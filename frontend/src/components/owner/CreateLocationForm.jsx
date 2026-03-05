import { useEffect, useRef, useState } from "react";
import { http } from "../../api/http";
import { getStoredUser } from "../../auth/auth";
import { getErrorMessage } from "../../api/getErrorMessage";
import { useI18n } from "../../client/i18n/I18nContext";

import RegionPicker from "../pickers/RegionPicker";
import FishPicker from "../pickers/FishPicker";
import SeasonPicker from "../pickers/SeasonPicker";
import PhotoUploader from "./PhotoUploader";

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

  const createdRef = useRef(false);

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
      const latStr = String(lat).trim();
      const lngStr = String(lng).trim();
      if (!latStr || !lngStr) {
        setCreateError("Lat and Lng are required");
        return;
      }

      const latNum = Number(latStr);
      const lngNum = Number(lngStr);

      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        setCreateError("Lat and Lng must be valid numbers");
        return;
      }
      if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
        setCreateError("Lat/Lng out of range");
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
        setCreateError("At least 1 photo is required");
        return;
      }
      if (normalizedPhotos.length > 5) {
        setCreateError("Max 5 photos");
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
      setCreateError(getErrorMessage(err, "Failed to create location"));
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
    <div style={box}>
      <h2 style={{ marginTop: 0 }}>{t("createLocation.title")}</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input
          placeholder={t("locationForm.titlePlaceholder")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={input}
        />

        <textarea
          placeholder={t("locationForm.descriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={input}
        />

        <textarea
          placeholder={t("locationForm.contactsPlaceholderFull")}
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
          rows={2}
          style={input}
        />

        <RegionPicker value={regionSelected} onChange={setRegionSelected} />

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

        <div style={{ display: "flex", gap: 10 }}>
          <input
            placeholder={t("locationForm.latPlaceholder")}
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            style={{ ...input, flex: 1 }}
          />
          <input
            placeholder={t("locationForm.lngPlaceholder")}
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            style={{ ...input, flex: 1 }}
          />
        </div>

        <FishPicker value={fishSelected} onChange={setFishSelected} />

        <SeasonPicker value={seasonSelected} onChange={setSeasonSelected} />

        <PhotoUploader
          photos={photos}
          onChange={setPhotos}
          max={5}
          draftFolder={draftFolder}
        />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button disabled={creating} style={btn}>
            {creating
              ? t("createLocation.creating")
              : t("createLocation.createPending")}
          </button>

          <button
            type="button"
            onClick={cancel}
            disabled={creating}
            style={btn}
          >
            {t("locationForm.cancel")}
          </button>
        </div>

        {createError ? (
          <div style={{ color: "crimson" }}>{createError}</div>
        ) : null}
      </form>
    </div>
  );
}

const box = {
  marginTop: 16,
  border: "1px solid #eee",
  borderRadius: 10,
  padding: 12,
  maxWidth: 720,
};
const input = { padding: 10, borderRadius: 8, border: "1px solid #ddd" };
const btn = { padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd" };
