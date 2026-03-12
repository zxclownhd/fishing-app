import { useEffect, useRef, useState } from "react";
import { http } from "../../api/http";
import { getStoredUser } from "../../auth/auth";
import { getErrorMessage } from "../../api/getErrorMessage";
import { useI18n } from "../../client/i18n/I18nContext";

import RegionPicker from "../pickers/RegionPicker";
import FishPicker from "../pickers/FishPicker";
import SeasonPicker from "../pickers/SeasonPicker";
import PhotoUploader from "./PhotoUploader";
import LocationPickerMap from "./LocationPickerMap";
import {
  LOCATION_LIMITS,
  validateLocationTextFields,
  hasLocationTextFieldErrors,
} from "./locationFormValidation";

export default function CreateLocationForm({ onCreate, onCancel }) {
  const user = getStoredUser();
  const draftFolder = user ? `drafts/${user.id}` : undefined;
  const { t } = useI18n();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [regionSelected, setRegionSelected] = useState("");
  const [waterType, setWaterType] = useState("LAKE");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const [fishSelected, setFishSelected] = useState([]);
  const [seasonSelected, setSeasonSelected] = useState([]);

  const [contactInfo, setContactInfo] = useState("");

  const [photos, setPhotos] = useState([]);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    title: "",
    description: "",
    contactInfo: "",
  });

  const createdRef = useRef(false);
  const descriptionRef = useRef(null);
  const contactsRef = useRef(null);

  function getDraftPublicIds() {
    return (photos || [])
      .filter((p) => !p.id && p.publicId)
      .map((p) => String(p.publicId).trim())
      .filter(Boolean);
  }

  async function cleanupDrafts() {
    const publicIds = getDraftPublicIds();
    if (!publicIds.length) return;

    try {
      await http.post("/photos/cleanup", { publicIds });
    } catch (e) {
      console.error("cleanup failed:", getErrorMessage(e, "cleanup failed"));
    }
  }

  // cleanup when leaving the create form without creating
  useEffect(() => {
    return () => {
      if (createdRef.current) return;
      const publicIds = getDraftPublicIds();
      if (!publicIds.length) return;

      http.post("/photos/cleanup", { publicIds }).catch((e) => {
        console.error("cleanup failed:", getErrorMessage(e, "cleanup failed"));
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  async function submit(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      const nextFieldErrors = validateLocationTextFields(
        { title, description, contactInfo },
        t,
      );
      setFieldErrors(nextFieldErrors);
      if (hasLocationTextFieldErrors(nextFieldErrors)) {
        return;
      }

      const latStr = String(lat).trim();
      const lngStr = String(lng).trim();
      if (!latStr || !lngStr) {
        setCreateError(t("locationForm.errors.coordsRequired"));
        return;
      }

      const latNum = Number(latStr);
      const lngNum = Number(lngStr);

      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        setCreateError(t("locationForm.errors.coordsInvalid"));
        return;
      }
      if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
        setCreateError(t("locationForm.errors.coordsRange"));
        return;
      }

      const normalizedPhotos = Array.isArray(photos)
        ? photos
            .map((p) => ({
              url: p?.url ? String(p.url).trim() : "",
              publicId: p?.publicId ? String(p.publicId).trim() : "",
            }))
            .filter((p) => p.url && p.publicId)
        : [];

      if (normalizedPhotos.length < 1) {
        setCreateError(t("locationForm.errors.minPhotos"));
        return;
      }
      if (normalizedPhotos.length > 5) {
        setCreateError(t("locationForm.errors.maxPhotos"));
        return;
      }

      await onCreate({
        title: title.trim(),
        description: description.trim(),
        region: regionSelected,
        waterType,
        lat: latNum,
        lng: lngNum,
        fishNames: fishSelected,
        seasonCodes: seasonSelected,
        contactInfo: contactInfo.trim() || undefined,

        photos: normalizedPhotos,
        photoUrls: normalizedPhotos.map((p) => p.url), // optional backward compat
      });

      createdRef.current = true;

      setTitle("");
      setDescription("");
      setRegionSelected("");
      setWaterType("LAKE");
      setLat("");
      setLng("");
      setFishSelected([]);
      setSeasonSelected([]);
      setContactInfo("");
      setPhotos([]);
    } catch (err) {
      setCreateError(getErrorMessage(err, t("ownerCreate.errors.createFailed"), t));
    } finally {
      setCreating(false);
    }
  }

  async function cancel() {
    if (creating) return;
    await cleanupDrafts();

    if (typeof onCancel === "function") onCancel();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.title")}</div>
        <input
          placeholder={t("locationForm.titlePlaceholder")}
          value={title}
          maxLength={LOCATION_LIMITS.title}
          onChange={(e) => {
            const next = e.target.value;
            setTitle(next);
            setFieldErrors(
              validateLocationTextFields({ title: next, description, contactInfo }, t),
            );
          }}
          style={input}
        />
      </div>
      <div style={fieldMetaRow}>
        <div style={fieldErrorText}>{fieldErrors.title || ""}</div>
        <div style={fieldCounterText}>
          {title.length}/{LOCATION_LIMITS.title}
        </div>
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.description")}</div>
        <textarea
          ref={descriptionRef}
          placeholder={t("locationForm.descriptionPlaceholder")}
          value={description}
          maxLength={LOCATION_LIMITS.description}
          onChange={(e) => {
            const next = e.target.value;
            setDescription(next);
            autoResizeTextarea(e.target);
            setFieldErrors(
              validateLocationTextFields({ title, description: next, contactInfo }, t),
            );
          }}
          rows={3}
          style={textareaInput}
        />
      </div>
      <div style={fieldMetaRow}>
        <div style={fieldErrorText}>{fieldErrors.description || ""}</div>
        <div style={fieldCounterText}>
          {description.length}/{LOCATION_LIMITS.description}
        </div>
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.contacts")}</div>
        <textarea
          ref={contactsRef}
          placeholder={t("locationForm.contactsPlaceholderFull")}
          value={contactInfo}
          maxLength={LOCATION_LIMITS.contactInfo}
          onChange={(e) => {
            const next = e.target.value;
            setContactInfo(next);
            autoResizeTextarea(e.target);
            setFieldErrors(
              validateLocationTextFields({ title, description, contactInfo: next }, t),
            );
          }}
          rows={2}
          style={textareaInput}
        />
      </div>
      <div style={fieldMetaRow}>
        <div style={fieldErrorText}>{fieldErrors.contactInfo || ""}</div>
        <div style={fieldCounterText}>
          {contactInfo.length}/{LOCATION_LIMITS.contactInfo}
        </div>
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.region")}</div>
        <RegionPicker value={regionSelected} onChange={setRegionSelected} />
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.waterType")}</div>
        <select
          value={waterType}
          onChange={(e) => setWaterType(e.target.value)}
          style={input}
        >
          <option value="LAKE">
            {t("locationForm.waterTypes.LAKE", "LAKE")}
          </option>
          <option value="RIVER">
            {t("locationForm.waterTypes.RIVER", "RIVER")}
          </option>
          <option value="POND">
            {t("locationForm.waterTypes.POND", "POND")}
          </option>
          <option value="SEA">{t("locationForm.waterTypes.SEA", "SEA")}</option>
          <option value="OTHER">
            {t("locationForm.waterTypes.OTHER", "OTHER")}
          </option>
        </select>
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.selectCoordinatesOnMap")}</div>
        <LocationPickerMap
          lat={lat}
          lng={lng}
          onSelect={(nextLat, nextLng) => {
            setLat(String(nextLat));
            setLng(String(nextLng));
          }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ ...displayField, flex: 1 }}>
            {lat || t("locationForm.latPlaceholder")}
          </div>
          <div style={{ ...displayField, flex: 1 }}>
            {lng || t("locationForm.lngPlaceholder")}
          </div>
        </div>
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.fish")}</div>
        <FishPicker value={fishSelected} onChange={setFishSelected} />
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.seasons")}</div>
        <SeasonPicker value={seasonSelected} onChange={setSeasonSelected} />
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.photos")}</div>
        <PhotoUploader
          photos={photos}
          onChange={setPhotos}
          max={5}
          draftFolder={draftFolder}
        />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button disabled={creating} className="btn btn-primary" type="submit">
          {creating
            ? t("createLocation.creating")
            : t("createLocation.create")}
        </button>

        <button
          type="button"
          onClick={cancel}
          disabled={creating}
          className="btn btn-secondary"
        >
          {t("locationForm.cancel")}
        </button>
      </div>

      {createError ? (
        <div style={{ color: "crimson" }}>{createError}</div>
      ) : null}
    </form>
  );
}

const input = { padding: 10, borderRadius: 8, border: "1px solid #ddd" };
const textareaInput = {
  ...input,
  resize: "none",
  overflow: "hidden",
  minHeight: 88,
  lineHeight: 1.45,
};
const displayField = {
  ...input,
  color: "var(--color-text)",
  background: "var(--color-surface)",
  cursor: "default",
  userSelect: "text",
};
const fieldBlock = { display: "grid", gap: 6 };
const fieldLabel = {
  fontSize: 12,
  fontWeight: 600,
  color: "var(--color-text-secondary)",
  lineHeight: 1.3,
};
const fieldMetaRow = {
  marginTop: -6,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 8,
  minHeight: 16,
};
const fieldErrorText = { color: "crimson", fontSize: 12, lineHeight: 1.2 };
const fieldCounterText = { fontSize: 12, opacity: 0.7 };

function autoResizeTextarea(node) {
  if (!node) return;
  node.style.height = "auto";
  node.style.height = `${node.scrollHeight}px`;
}
