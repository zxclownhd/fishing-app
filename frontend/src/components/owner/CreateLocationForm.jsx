import { useState } from "react";
import RegionPicker from "../pickers/RegionPicker";
import FishPicker from "../pickers/FishPicker";
import SeasonPicker from "../pickers/SeasonPicker";

export default function CreateLocationForm({ onCreate }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [regionSelected, setRegionSelected] = useState("");
  const [waterType, setWaterType] = useState("LAKE");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");

  const [fishSelected, setFishSelected] = useState([]);
  const [seasonSelected, setSeasonSelected] = useState([]);

  const [contactInfo, setContactInfo] = useState("");
  const [photoUrls, setPhotoUrls] = useState("");

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");

    try {
      const photoArr = photoUrls.split(",").map((s) => s.trim()).filter(Boolean);

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
        photoUrls: photoArr,
      });

      setTitle("");
      setDescription("");
      setRegionSelected("");
      setWaterType("LAKE");
      setLat("");
      setLng("");
      setFishSelected([]);
      setSeasonSelected([]);
      setContactInfo("");
      setPhotoUrls("");
    } catch (err) {
      setCreateError(err?.response?.data?.error || "Failed to create location");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div style={box}>
      <h2 style={{ marginTop: 0 }}>Create location</h2>

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} style={input} />

        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={input} />

        <textarea placeholder="Contacts (optional) phone, email, Telegram" value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} rows={2} style={input} />

        <RegionPicker value={regionSelected} onChange={setRegionSelected} />

        <select value={waterType} onChange={(e) => setWaterType(e.target.value)} style={input}>
          <option value="LAKE">LAKE</option>
          <option value="RIVER">RIVER</option>
          <option value="POND">POND</option>
          <option value="SEA">SEA</option>
          <option value="OTHER">OTHER</option>
        </select>

        <div style={{ display: "flex", gap: 10 }}>
          <input placeholder="Lat (e.g. 50.45)" value={lat} onChange={(e) => setLat(e.target.value)} style={{ ...input, flex: 1 }} />
          <input placeholder="Lng (e.g. 30.52)" value={lng} onChange={(e) => setLng(e.target.value)} style={{ ...input, flex: 1 }} />
        </div>

        <FishPicker value={fishSelected} onChange={setFishSelected} />

        <SeasonPicker value={seasonSelected} onChange={setSeasonSelected} />

        <input placeholder="Photo URLs (comma separated)" value={photoUrls} onChange={(e) => setPhotoUrls(e.target.value)} style={input} />

        <button disabled={creating} style={btn}>
          {creating ? "Creating..." : "Create (PENDING)"}
        </button>

        {createError ? <div style={{ color: "crimson" }}>{createError}</div> : null}
      </form>
    </div>
  );
}

const box = { marginTop: 16, border: "1px solid #eee", borderRadius: 10, padding: 12, maxWidth: 720 };
const input = { padding: 10, borderRadius: 8, border: "1px solid #ddd" };
const btn = { padding: "10px 14px", borderRadius: 8, border: "1px solid #ddd" };