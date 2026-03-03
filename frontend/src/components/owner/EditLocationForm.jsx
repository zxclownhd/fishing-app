import { useEffect, useMemo, useRef, useState } from "react";
import RegionPicker from "../pickers/RegionPicker";
import FishPicker from "../pickers/FishPicker";
import SeasonPicker from "../pickers/SeasonPicker";
import PhotoUploader from "./PhotoUploader";
import { http } from "../../api/http";
import { getStoredUser } from "../../auth/auth";

export default function EditLocationForm({ loc, onSave, onCancel }) {
  const user = getStoredUser();
  const draftFolder = user ? `drafts/${user.id}` : undefined;

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

  // NEW: so unmount cleanup won't run after successful save
  const savedRef = useRef(false);

  useEffect(() => {
    // when editing a new location, reset the saved flag
    savedRef.current = false;

    setEditDescription(loc.description || "");
    setFishSelected((loc.fish || []).map((x) => x.fish?.name).filter(Boolean));
    setSeasonSelected((loc.seasons || []).map((x) => x.season?.code).filter(Boolean));
    setEditContactInfo(loc.contactInfo || "");
    setEditLat(String(loc.lat ?? ""));
    setEditLng(String(loc.lng ?? ""));
    setEditTitle(loc.title || "");
    setEditRegionSelected(loc.region || "");
    setEditWaterType(loc.waterType || "LAKE");

    setPhotos(
      (loc.photos || [])
        .map((p) => ({ id: p.id, url: p.url }))
        .filter((p) => p.url)
    );

    setEditError("");
  }, [loc]);

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

    const curFish = (fishSelected || []).map((s) => s.trim()).sort().join("|");
    const curSeasons = (seasonSelected || []).map((s) => s.trim()).sort().join("|");
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
      console.error("cleanup failed", e);
    }
  }

  // NEW: cleanup drafts when the edit form unmounts (e.g., tab switch / closing edit)
  useEffect(() => {
    return () => {
      if (savedRef.current) return;

      const publicIds = getDraftPublicIds();
      if (!publicIds.length) return;

      http.post("/photos/cleanup", { publicIds }).catch((e) => {
        console.error("cleanup failed", e);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photos]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setEditError("");

    try {
      const latStr = String(editLat).trim();
      const lngStr = String(editLng).trim();
      if (!latStr || !lngStr) {
        setEditError("Lat and Lng are required");
        return;
      }

      const latNum = Number(latStr);
      const lngNum = Number(lngStr);

      if (!Number.isFinite(latNum) || !Number.isFinite(lngNum)) {
        setEditError("Lat and Lng must be valid numbers");
        return;
      }
      if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
        setEditError("Lat/Lng out of range");
        return;
      }

      if (!photos || photos.length < 1) {
        setEditError("At least 1 photo is required");
        return;
      }
      if (photos.length > 5) {
        setEditError("Max 5 photos");
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

      // NEW: mark as saved so unmount cleanup won't delete the photos
      savedRef.current = true;

      onCancel();
    } catch (err) {
      setEditError(err?.response?.data?.error || "Failed to update location");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(photo) {
    setEditError("");

    if (photo?.id) {
      await http.delete(`/photos/${photo.id}`);
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
        onChange={(e) => setEditTitle(e.target.value)}
        placeholder="Title"
        style={input}
      />

      <textarea
        value={editDescription}
        onChange={(e) => setEditDescription(e.target.value)}
        rows={3}
        style={input}
      />

      <textarea
        value={editContactInfo}
        onChange={(e) => setEditContactInfo(e.target.value)}
        placeholder="Contacts (optional)"
        rows={2}
        style={input}
      />

      <RegionPicker value={editRegionSelected} onChange={setEditRegionSelected} />

      <select
        value={editWaterType}
        onChange={(e) => setEditWaterType(e.target.value)}
        style={input}
      >
        <option value="LAKE">LAKE</option>
        <option value="RIVER">RIVER</option>
        <option value="POND">POND</option>
        <option value="SEA">SEA</option>
        <option value="OTHER">OTHER</option>
      </select>

      <div style={{ display: "flex", gap: 10 }}>
        <input
          value={editLat}
          onChange={(e) => setEditLat(e.target.value)}
          placeholder="Lat (e.g. 50.45)"
          style={{ ...input, flex: 1 }}
        />
        <input
          value={editLng}
          onChange={(e) => setEditLng(e.target.value)}
          placeholder="Lng (e.g. 30.52)"
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
          {saving ? "Saving..." : "Save (will stay PENDING)"}
        </button>

        <button type="button" onClick={cancel} style={btn} disabled={saving}>
          Cancel
        </button>
      </div>

      {!saving && !isDirty ? (
        <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>
          No changes to save
        </div>
      ) : null}

      {editError ? <div style={{ color: "crimson" }}>{editError}</div> : null}
    </form>
  );
}

const input = { padding: 10, borderRadius: 8, border: "1px solid #ddd" };
const btn = { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" };