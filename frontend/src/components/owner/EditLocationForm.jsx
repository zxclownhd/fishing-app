import { useEffect, useState } from "react";
import RegionPicker from "../pickers/RegionPicker";
import FishPicker from "../pickers/FishPicker";
import SeasonPicker from "../pickers/SeasonPicker";

export default function EditLocationForm({ loc, onSave, onCancel }) {
  const [editDescription, setEditDescription] = useState("");
  const [editLat, setEditLat] = useState("");
  const [editLng, setEditLng] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editRegionSelected, setEditRegionSelected] = useState("");
  const [editWaterType, setEditWaterType] = useState("LAKE");
  const [editContactInfo, setEditContactInfo] = useState("");
  const [editPhotoUrls, setEditPhotoUrls] = useState("");

  const [fishSelected, setFishSelected] = useState([]);
  const [seasonSelected, setSeasonSelected] = useState([]);

  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    setEditDescription(loc.description || "");
    setFishSelected((loc.fish || []).map((x) => x.fish?.name).filter(Boolean));
    setSeasonSelected(
      (loc.seasons || []).map((x) => x.season?.code).filter(Boolean),
    );
    setEditContactInfo(loc.contactInfo || "");
    setEditPhotoUrls(
      (loc.photos || [])
        .map((p) => p.url)
        .filter(Boolean)
        .join(", "),
    );
    setEditLat(String(loc.lat ?? ""));
    setEditLng(String(loc.lng ?? ""));
    setEditTitle(loc.title || "");
    setEditRegionSelected(loc.region || "");
    setEditWaterType(loc.waterType || "LAKE");
    setEditError("");
  }, [loc]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setEditError("");

    try {
      const photoArr = editPhotoUrls
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

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

      await onSave(loc.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        region: editRegionSelected,
        waterType: editWaterType,
        fishNames: fishSelected,
        seasonCodes: seasonSelected,
        contactInfo: editContactInfo.trim() || null,
        photoUrls: photoArr,
        lat: latNum,
        lng: lngNum,
      });

      onCancel();
    } catch (err) {
      setEditError(err?.response?.data?.error || "Failed to update location");
    } finally {
      setSaving(false);
    }
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

      <RegionPicker
        value={editRegionSelected}
        onChange={setEditRegionSelected}
      />

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

      <input
        value={editPhotoUrls}
        onChange={(e) => setEditPhotoUrls(e.target.value)}
        placeholder="Photo URLs (comma separated)"
        style={input}
      />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button disabled={saving} style={btn}>
          {saving ? "Saving..." : "Save (will stay PENDING)"}
        </button>
        <button type="button" onClick={onCancel} style={btn}>
          Cancel
        </button>
      </div>

      {editError ? <div style={{ color: "crimson" }}>{editError}</div> : null}
    </form>
  );
}

const input = { padding: 10, borderRadius: 8, border: "1px solid #ddd" };
const btn = { padding: "8px 12px", borderRadius: 8, border: "1px solid #ddd" };
