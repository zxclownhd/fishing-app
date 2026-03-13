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
import { displayFishName } from "../../client/i18n/displayName";
import {
  LOCATION_LIMITS,
  validateLocationTextFields,
  hasLocationTextFieldErrors,
} from "./locationFormValidation";

export default function EditLocationForm({ loc, onSave, onCancel }) {
  const user = getStoredUser();
  const draftFolder = user ? `drafts/${user.id}` : undefined;
  const { t, locale } = useI18n();

  const [editDescription, setEditDescription] = useState("");
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editRegionSelected, setEditRegionSelected] = useState("");
  const [editWaterType, setEditWaterType] = useState("LAKE");
  const [editContactInfo, setEditContactInfo] = useState("");

  const [photos, setPhotos] = useState([]);
  const [pendingDeletedPhotoIds, setPendingDeletedPhotoIds] = useState([]);

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
  const descriptionRef = useRef(null);
  const contactsRef = useRef(null);

  useEffect(() => {
    savedRef.current = false;

    setEditDescription(loc.description || "");
    setFishSelected(uniqueValues((loc.fish || []).map((x) => x.fish?.name).filter(Boolean)));
    setSeasonSelected(uniqueValues(
      (loc.seasons || []).map((x) => x.season?.code).filter(Boolean),
    ));
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
    setPendingDeletedPhotoIds([]);

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

    requestAnimationFrame(() => {
      autoResizeTextarea(descriptionRef.current);
      autoResizeTextarea(contactsRef.current);
    });
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
      .map(photoIdentityKey)
      .filter(Boolean)
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
      .map(photoIdentityKey)
      .filter(Boolean)
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
      if (photos.length > 6) {
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

      if (pendingDeletedPhotoIds.length) {
        const uniquePhotoIds = Array.from(new Set(pendingDeletedPhotoIds));
        const deleteResults = await Promise.allSettled(
          uniquePhotoIds.map((photoId) => http.delete(`/photos/${photoId}`)),
        );
        const failedDeletes = deleteResults.filter((r) => r.status === "rejected");
        if (failedDeletes.length) {
          setEditError(t("photos.errors.deleteFailed"));
          return;
        }
      }

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
      setPendingDeletedPhotoIds([]);
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

    // persisted photo remove in edit mode: local-only until Save
    if (photo.id) {
      setPendingDeletedPhotoIds((prev) =>
        prev.includes(photo.id) ? prev : [...prev, photo.id],
      );
      setPhotos((prev) => (prev || []).filter((p) => p.id !== photo.id));
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
    setPendingDeletedPhotoIds([]);
    onCancel();
  }

  function handleFishChange(next) {
    setFishSelected(uniqueValues(next));
  }

  function handleSeasonChange(next) {
    setSeasonSelected(uniqueValues(next));
  }

  function handleRemoveFishType(name) {
    setFishSelected((prev) => (prev || []).filter((x) => x !== name));
  }

  function handleRemoveSeason(code) {
    setSeasonSelected((prev) => (prev || []).filter((x) => x !== code));
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.title")}</div>
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
      </div>
      <div style={fieldMetaRow}>
        <div style={fieldErrorText}>{fieldErrors.title || ""}</div>
        <div style={fieldCounterText}>
          {editTitle.length}/{LOCATION_LIMITS.title}
        </div>
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.description")}</div>
        <textarea
          ref={descriptionRef}
          value={editDescription}
          maxLength={LOCATION_LIMITS.description}
          onChange={(e) => {
            const next = e.target.value;
            setEditDescription(next);
            autoResizeTextarea(e.target);
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
          style={textareaInput}
        />
      </div>
      <div style={fieldMetaRow}>
        <div style={fieldErrorText}>{fieldErrors.description || ""}</div>
        <div style={fieldCounterText}>
          {editDescription.length}/{LOCATION_LIMITS.description}
        </div>
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.contacts")}</div>
        <textarea
          ref={contactsRef}
          value={editContactInfo}
          maxLength={LOCATION_LIMITS.contactInfo}
          onChange={(e) => {
            const next = e.target.value;
            setEditContactInfo(next);
            autoResizeTextarea(e.target);
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
          style={textareaInput}
        />
      </div>
      <div style={fieldMetaRow}>
        <div style={fieldErrorText}>{fieldErrors.contactInfo || ""}</div>
        <div style={fieldCounterText}>
          {editContactInfo.length}/{LOCATION_LIMITS.contactInfo}
        </div>
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.region")}</div>
        <RegionPicker
          value={editRegionSelected}
          onChange={setEditRegionSelected}
        />
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.waterType")}</div>
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
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.selectCoordinatesOnMap")}</div>
        <LocationPickerMap
          lat={editLat}
          lng={editLng}
          onSelect={(nextLat, nextLng) => {
            setEditLat(String(nextLat));
            setEditLng(String(nextLng));
          }}
        />

        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ ...displayField, flex: 1 }}>
            {editLat || t("locationForm.latPlaceholder")}
          </div>
          <div style={{ ...displayField, flex: 1 }}>
            {editLng || t("locationForm.lngPlaceholder")}
          </div>
        </div>
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.fish")}</div>
        <FishPicker value={fishSelected} onChange={handleFishChange} />
        {fishSelected.length ? (
          <div className="owner-location-form__chips">
            {fishSelected.map((name) => (
              <span key={`selected-fish-${name}`} className="chip owner-location-form__chip">
                <span className="owner-location-form__chip-label">
                  {displayFishName(name, locale)}
                </span>
                <button
                  type="button"
                  className="owner-location-form__chip-remove"
                  onClick={() => handleRemoveFishType(name)}
                  title={t("home.removeFilterTitle")}
                  aria-label={`${t("home.removeFilterTitle")}: ${displayFishName(name, locale)}`}
                >
                  {"\u2715"}
                </button>
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.seasons")}</div>
        <SeasonPicker value={seasonSelected} onChange={handleSeasonChange} />
        {seasonSelected.length ? (
          <div className="owner-location-form__chips">
            {seasonSelected.map((code) => {
              const label = t(`seasons.${String(code).toUpperCase()}`, code);
              return (
                <span key={`selected-season-${code}`} className="chip owner-location-form__chip">
                  <span className="owner-location-form__chip-label">{label}</span>
                  <button
                    type="button"
                    className="owner-location-form__chip-remove"
                    onClick={() => handleRemoveSeason(code)}
                    title={t("home.removeFilterTitle")}
                    aria-label={`${t("home.removeFilterTitle")}: ${label}`}
                  >
                    {"\u2715"}
                  </button>
                </span>
              );
            })}
          </div>
        ) : null}
      </div>

      <div style={fieldBlock}>
        <div style={fieldLabel}>{t("locationForm.labels.photos")}</div>
        <PhotoUploader
          photos={photos}
          onChange={setPhotos}
          max={6}
          onRemove={handleRemove}
          draftFolder={draftFolder}
          previewHintStyle={fieldLabel}
        />
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          disabled={saving || !isDirty}
          className="btn btn-primary"
          type="submit"
        >
          {saving ? t("locationForm.saving") : t("locationForm.save")}
        </button>

        <button
          type="button"
          onClick={cancel}
          className="btn btn-secondary"
          disabled={saving}
        >
          {t("locationForm.cancel")}
        </button>
      </div>

      {!saving ? (
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          {isDirty
            ? t("locationForm.pendingAfterSaveNotice")
            : t("locationForm.noChanges")}
        </div>
      ) : null}

      {editError ? <div style={{ color: "crimson" }}>{editError}</div> : null}
    </form>
  );
}

const input = { padding: 10, borderRadius: 8, border: "1px solid #ddd" };
const displayField = {
  ...input,
  color: "var(--color-text)",
  background: "var(--color-surface)",
  cursor: "default",
  userSelect: "text",
};
const textareaInput = {
  ...input,
  resize: "none",
  overflow: "hidden",
  minHeight: 88,
  lineHeight: 1.45,
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

function uniqueValues(items) {
  return Array.from(new Set((items || []).filter(Boolean)));
}

function photoIdentityKey(photo) {
  if (!photo) return "";
  if (photo.id) return `id:${String(photo.id).trim()}`;
  if (photo.publicId) return `public:${String(photo.publicId).trim()}`;
  if (photo.url) return `url:${String(photo.url).trim()}`;
  return "";
}
