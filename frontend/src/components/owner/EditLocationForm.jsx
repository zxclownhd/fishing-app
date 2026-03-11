import { useEffect, useMemo, useRef, useState } from "react";
import RegionPicker from "../pickers/RegionPicker";
import FishPicker from "../pickers/FishPicker";
import SeasonPicker from "../pickers/SeasonPicker";
import PhotoUploader from "./PhotoUploader";
import LocationPickerMap from "./LocationPickerMap";
import { http } from "../../api/http";
import { getStoredUser } from "../../auth/auth";
import { getErrorMessage } from "../../api/getErrorMessage";
import { useI18n } from "../../client/i18n/I18nContext";
import {
  LOCATION_LIMITS,
  validateLocationTextFields,
  hasLocationTextFieldErrors,
} from "./locationFormValidation";

export default function EditLocationForm({ loc, onSave, onCancel }) {
  const user = getStoredUser();
  const draftFolder = user ? `drafts/${user.id}` : undefined;
  const { t } = useI18n();

  const [editDescription, setEditDescription] = useState("");
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editRegionSelected, setEditRegionSelected] = useState("");
  const [editWaterType, setEditWaterType] = useState("LAKE");
  const [editContactInfo, setEditContactInfo] = useState("");

  const [photos, setPhotos] = useState([]);

  const [fishSelected, setFishSelected] = useState([]);
  const [seasonSelected, setSeasonSelected] = useState([]);

  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({
    title: "",
    description: "",
    contactInfo: "",
  });

  // so unmount cleanup won't run after successful save
  const savedRef = useRef(false);

  useEffect(() => {
    savedRef.current = false;

    setEditDescription(loc.description || "");
    setFishSelected((loc.fish || []).map((x) => x.fish?.name).filter(Boolean));
    setSeasonSelected(
      (loc.seasons || []).map((x) => x.season?.code).filter(Boolean),
    );
    setEditContactInfo(loc.contactInfo || "");
    setEditLat(String(loc.lat ?? ""));
    setEditLng(String(loc.lng ?? ""));
    setEditTitle(loc.title || "");
    setEditRegionSelected(loc.region || "");
    setEditWaterType(loc.waterType || "LAKE");

    setPhotos(
      (loc.photos || [])
        .map((p) => ({ id: p.id, url: p.url, publicId: p.publicId }))
        .filter((p) => p.url),
    );

    setEditError("");
    setFieldErrors(
      validateLocationTextFields(
        {
          title: loc.title || "",
          description: loc.description || "",
          contactInfo: loc.contactInfo || "",
        },
        t,
      ),
    );
  }, [loc, t]);

  const isDirty = useMemo(() => {
    const norm = (v) => String(v ?? "").trim();

    const origTitle = norm(loc.title);
    const origDesc = norm(loc.description);
    const origContacts = norm(loc.contactInfo);

    const origLat = norm(loc.lat);
    const origLng = norm(loc.lng);

    const origRegion = norm(loc.region);
    const origWater = norm(loc.waterType || "LAKE");

    const origFish = (loc.fish || [])
      .map((x) => x.fish?.name)
      .filter(Boolean)
      .map((s) => s.trim())
      .sort()
      .join("|");

    const origSeasons = (loc.seasons || [])
      .map((x) => x.season?.code)
      .filter(Boolean)
      .map((s) => s.trim())
      .sort()
      .join("|");

    const origPhotos = (loc.photos || [])
      .map((p) => p.url)
      .filter(Boolean)
      .map((s) => s.trim())
      .sort()
      .join("|");

    const curFish = (fishSelected || [])
      .map((s) => s.trim())
      .sort()
      .join("|");
    const curSeasons = (seasonSelected || [])
      .map((s) => s.trim())
      .sort()
      .join("|");
    const curPhotos = (photos || [])
      .map((p) => String(p.url || "").trim())
      .filter(Boolean)
      .sort()
      .join("|");

    return (
      norm(editTitle) !== origTitle ||
      norm(editDescription) !== origDesc ||
      norm(editContactInfo) !== origContacts ||
      norm(editLat) !== origLat ||
      norm(editLng) !== origLng ||
      norm(editRegionSelected) !== origRegion ||
      norm(editWaterType) !== origWater ||
      curFish !== origFish ||
      curSeasons !== origSeasons ||
      curPhotos !== origPhotos
    );
  }, [
    loc,
    editTitle,
    editDescription,
    editContactInfo,
    editLat,
    editLng,
    editRegionSelected,
    editWaterType,
    fishSelected,
    seasonSelected,
    photos,
  ]);

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

  // cleanup drafts when the edit form unmounts (tab switch / closing edit)
  useEffect(() => {
    return () => {
      if (savedRef.current) return;

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
    setSaving(true);
    setEditError("");

    try {
      const nextFieldErrors = validateLocationTextFields(
        {
          title: editTitle,
          description: editDescription,
          contactInfo: editContactInfo,
        },
        t,
      );
      setFieldErrors(nextFieldErrors);
      if (hasLocationTextFieldErrors(nextFieldErrors)) {
        return;
      }

      const latStr = String(editLat).trim();
      const lngStr = String(editLng).trim();
      if (!latStr || !lngStr) {
        setEditError(t("locationForm.errors.coordsRequired"));
        return;
      }

      const latNum = Number(latStr);
      const lngNum = Number(lngStr);

      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        setEditError(t("locationForm.errors.coordsInvalid"));
        return;
      }
      if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
        setEditError(t("locationForm.errors.coordsRange"));
        return;
      }

      if (!photos || photos.length < 1) {
        setEditError(t("locationForm.errors.minPhotos"));
        return;
      }
      if (photos.length > 5) {
        setEditError(t("locationForm.errors.maxPhotos"));
        return;
      }

      const newPhotos = (photos || [])
        .filter((p) => !p.id)
        .map((p) => ({
          url: p?.url ? String(p.url).trim() : "",
          publicId: p?.publicId ? String(p.publicId).trim() : "",
        }))
        .filter((p) => p.url && p.publicId);

      await onSave(loc.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        region: editRegionSelected,
        waterType: editWaterType,
        fishNames: fishSelected,
        seasonCodes: seasonSelected,
        contactInfo: editContactInfo.trim() || null,
        lat: latNum,
        lng: lngNum,
        photos: newPhotos,
        photoUrls: (photos || []).map((p) => p.url).filter(Boolean),
      });

      savedRef.current = true;
      onCancel();
    } catch (err) {
      setEditError(getErrorMessage(err, t("ownerEdit.errors.updateFailed"), t));
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(photo) {
    setEditError("");

    if (!photo) return;

    // optimistic UI remove (optional). safer after delete, so do after success
    if (photo.id) {
      try {
        await http.delete(`/photos/${photo.id}`);
        setPhotos((prev) => (prev || []).filter((p) => p.id !== photo.id));
      } catch (e) {
        setEditError(getErrorMessage(e, t("photos.errors.deleteFailed"), t));
      }
      return;
    }

    // draft photo (no id) remove locally
    if (photo.publicId) {
      setPhotos((prev) =>
        (prev || []).filter((p) => p.publicId !== photo.publicId),
      );
      return;
    }

    // fallback: remove by url
    if (photo.url) {
      setPhotos((prev) => (prev || []).filter((p) => p.url !== photo.url));
    }
  }

  async function cancel() {
    if (saving) return;
    await cleanupDrafts();
    onCancel();
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
      <input
        value={editTitle}
        maxLength={LOCATION_LIMITS.title}
        onChange={(e) => {
          const next = e.target.value;
          setEditTitle(next);
          setFieldErrors(
            validateLocationTextFields(
              {
                title: next,
                description: editDescription,
                contactInfo: editContactInfo,
              },
              t,
            ),
          );
        }}
        placeholder={t("locationForm.titlePlaceholder")}
        style={input}
      />
      <div style={fieldMetaRow}>
        <div style={fieldErrorText}>{fieldErrors.title || ""}</div>
        <div style={fieldCounterText}>
          {editTitle.length}/{LOCATION_LIMITS.title}
        </div>
      </div>

      <textarea
        value={editDescription}
        maxLength={LOCATION_LIMITS.description}
        onChange={(e) => {
          const next = e.target.value;
          setEditDescription(next);
          setFieldErrors(
            validateLocationTextFields(
              {
                title: editTitle,
                description: next,
                contactInfo: editContactInfo,
              },
              t,
            ),
          );
        }}
        rows={3}
        placeholder={t("locationForm.descriptionPlaceholder")}
        style={input}
      />
      <div style={fieldMetaRow}>
        <div style={fieldErrorText}>{fieldErrors.description || ""}</div>
        <div style={fieldCounterText}>
          {editDescription.length}/{LOCATION_LIMITS.description}
        </div>
      </div>

      <textarea
        value={editContactInfo}
        maxLength={LOCATION_LIMITS.contactInfo}
        onChange={(e) => {
          const next = e.target.value;
          setEditContactInfo(next);
          setFieldErrors(
            validateLocationTextFields(
              {
                title: editTitle,
                description: editDescription,
                contactInfo: next,
              },
              t,
            ),
          );
        }}
        placeholder={t("locationForm.contactsPlaceholder")}
        rows={2}
        style={input}
      />
      <div style={fieldMetaRow}>
        <div style={fieldErrorText}>{fieldErrors.contactInfo || ""}</div>
        <div style={fieldCounterText}>
          {editContactInfo.length}/{LOCATION_LIMITS.contactInfo}
        </div>
      </div>

      <RegionPicker
        value={editRegionSelected}
        onChange={setEditRegionSelected}
      />

      <select
        value={editWaterType}
        onChange={(e) => setEditWaterType(e.target.value)}
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

      <LocationPickerMap
        lat={editLat}
        lng={editLng}
        onSelect={(nextLat, nextLng) => {
          setEditLat(String(nextLat));
          setEditLng(String(nextLng));
        }}
      />

      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={editLat}
          readOnly
          placeholder={t("locationForm.latPlaceholder")}
          style={{ ...input, flex: 1 }}
        />
        <input
          value={editLng}
          readOnly
          placeholder={t("locationForm.lngPlaceholder")}
          style={{ ...input, flex: 1 }}
        />
      </div>

      <FishPicker value={fishSelected} onChange={setFishSelected} />

      <SeasonPicker value={seasonSelected} onChange={setSeasonSelected} />

      <PhotoUploader
        photos={photos}
        onChange={setPhotos}
        max={5}
        onRemove={handleRemove}
        draftFolder={draftFolder}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button disabled={saving || !isDirty} style={btn}>
          {saving ? t("locationForm.saving") : t("locationForm.savePending")}
        </button>

        <button type="button" onClick={cancel} style={btn} disabled={saving}>
          {t("locationForm.cancel")}
        </button>
      </div>

      {!saving && !isDirty ? (
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          {t("locationForm.noChanges")}
        </div>
      ) : null}

      {editError ? <div style={{ color: "crimson" }}>{editError}</div> : null}
    </form>
  );
}

const input = { padding: 10, borderRadius: 8, border: "1px solid #ddd" };
const btn = { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" };
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
