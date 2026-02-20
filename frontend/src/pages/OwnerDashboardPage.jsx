import { useEffect, useState } from "react";
import { http } from "../api/http";
import { getStoredUser } from "../auth/auth";
import { Link } from "react-router-dom";

export default function OwnerDashboardPage() {
  const user = getStoredUser();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // create form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [region, setRegion] = useState("");
  const [waterType, setWaterType] = useState("LAKE");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [fishNames, setFishNames] = useState(""); // comma separated
  const [seasonCodes, setSeasonCodes] = useState(""); // comma separated
  const [contactInfo, setContactInfo] = useState("");
  const [editContactInfo, setEditContatcInfo] = useState("");
  const [photoUrls, setPhotoUrls] = useState(""); // comma separated
  const [editPhotoUrls, setEditPhotoUrls] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // edit
  const [editingId, setEditingId] = useState(null);
  const [editDescription, setEditDescription] = useState("");
  const [editFishNames, setEditFishNames] = useState("");
  const [editSeasonCodes, setEditSeasonCodes] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  async function loadMyLocations() {
    const res = await http.get("/owner/locations");
    setItems(res.data.items || res.data || []);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        await loadMyLocations();
      } catch (err) {
        console.error(err);
        if (!cancelled) setError("Failed to load owner locations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function onCreate(e) {
    e.preventDefault();

    try {
      setCreating(true);
      setCreateError("");

      const fishArr = fishNames
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const seasonArr = seasonCodes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const photoArr = photoUrls
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await http.post("/locations", {
        title: title.trim(),
        description: description.trim(),
        region: region.trim(),
        waterType,
        lat: Number(lat),
        lng: Number(lng),
        fishNames: fishArr,
        seasonCodes: seasonArr,
        contactInfo: contactInfo.trim() || undefined,
        photoUrls: photoArr,
      });

      // reset form
      setTitle("");
      setDescription("");
      setRegion("");
      setWaterType("LAKE");
      setLat("");
      setLng("");
      setFishNames("");
      setSeasonCodes("");
      setContactInfo("");
      setPhotoUrls("");

      await loadMyLocations();
    } catch (err) {
      console.error(err);
      setCreateError(err?.response?.data?.error || "Failed to create location");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(loc) {
    setEditingId(loc.id);
    setEditDescription(loc.description || "");
    setEditFishNames(
      (loc.fish || [])
        .map((x) => x.fish?.name)
        .filter(Boolean)
        .join(", "),
    );
    setEditSeasonCodes(
      (loc.seasons || [])
        .map((x) => x.season?.code)
        .filter(Boolean)
        .join(", "),
    );
    setEditContatcInfo(loc.contactInfo || "");
    setEditPhotoUrls(
      (loc.photos || [])
        .map((p) => p.url)
        .filter(Boolean)
        .join(", "),
    );
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDescription("");
    setEditFishNames("");
    setEditSeasonCodes("");
    setEditContatcInfo("");
    setEditError("");
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editingId) return;

    try {
      setSaving(true);
      setEditError("");

      const fishArr = editFishNames
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const seasonArr = editSeasonCodes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const photoArr = editPhotoUrls
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await http.patch(`/owner/locations/${editingId}`, {
        description: editDescription.trim(),
        fishNames: fishArr,
        seasonCodes: seasonArr,
        contactInfo: contactInfo.trim() || null,
        photoUrls: photoArr,
      });

      await loadMyLocations();
      cancelEdit();
    } catch (err) {
      console.error(err);
      setEditError(err?.response?.data?.error || "Failed to update location");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return <div style={{ padding: 16 }}>Please login.</div>;
  if (user.role !== "OWNER")
    return <div style={{ padding: 16 }}>Owner only.</div>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/">← Back</Link>
      </div>

      <h1>Owner Dashboard</h1>

      {/* Create */}
      <div
        style={{
          marginTop: 16,
          border: "1px solid #eee",
          borderRadius: 10,
          padding: 12,
          maxWidth: 720,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Create location</h2>

        <form onSubmit={onCreate} style={{ display: "grid", gap: 10 }}>
          <input
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />

          <textarea
            placeholder="Contacts (optional) — phone, email, Telegram"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
            rows={2}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />

          <input
            placeholder="Region (e.g. Kyiv)"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />

          <select
            value={waterType}
            onChange={(e) => setWaterType(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          >
            <option value="LAKE">LAKE</option>
            <option value="RIVER">RIVER</option>
            <option value="POND">POND</option>
            <option value="SEA">SEA</option>
            <option value="OTHER">OTHER</option>
          </select>

          <div style={{ display: "flex", gap: 10 }}>
            <input
              placeholder="Lat (e.g. 50.45)"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              style={{
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ddd",
                flex: 1,
              }}
            />
            <input
              placeholder="Lng (e.g. 30.52)"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              style={{
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ddd",
                flex: 1,
              }}
            />
          </div>

          <input
            placeholder="Fish (comma separated) e.g. Carp, Pike"
            value={fishNames}
            onChange={(e) => setFishNames(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />

          <input
            placeholder="Seasons (comma separated) e.g. SPRING, SUMMER"
            value={seasonCodes}
            onChange={(e) => setSeasonCodes(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />

          <input
            placeholder="Photo URLs (comma separated)"
            value={photoUrls}
            onChange={(e) => setPhotoUrls(e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
          />

          <button
            disabled={creating}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          >
            {creating ? "Creating..." : "Create (PENDING)"}
          </button>

          {createError && <div style={{ color: "crimson" }}>{createError}</div>}
        </form>
      </div>

      {/* List */}
      <div style={{ marginTop: 24 }}>
        <h2>My locations</h2>

        {loading && <div>Loading...</div>}
        {error && <div style={{ color: "crimson" }}>{error}</div>}

        <div
          style={{
            display: "grid",
            gap: 12,
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          }}
        >
          {items.map((loc) => (
            <div
              key={loc.id}
              style={{
                border: "1px solid #ddd",
                borderRadius: 10,
                padding: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ fontWeight: 700 }}>{loc.title}</div>
                <span style={{ opacity: 0.8 }}>{loc.status}</span>
              </div>

              <div style={{ opacity: 0.8, marginTop: 4 }}>
                {loc.region} • {loc.waterType}
              </div>

              <div style={{ marginTop: 8, opacity: 0.9 }}>
                {loc.description}
              </div>

              {loc.photos?.[0]?.url && (
                <img
                  src={loc.photos[0].url}
                  alt=""
                  style={{
                    width: "100%",
                    height: 160,
                    objectFit: "cover",
                    borderRadius: 10,
                    marginTop: 10,
                  }}
                />
              )}

              {loc.contactInfo && (
                <div style={{ marginTop: 6, fontSize: 13 }}>
                  <strong>Contacts:</strong>{" "}
                  <span style={{ opacity: 0.9 }}>{loc.contactInfo}</span>
                </div>
              )}

              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                Fish:{" "}
                {(loc.fish || [])
                  .map((x) => x.fish?.name)
                  .filter(Boolean)
                  .join(", ") || "—"}
              </div>

              <div style={{ marginTop: 4, fontSize: 13, opacity: 0.8 }}>
                Seasons:{" "}
                {(loc.seasons || [])
                  .map((x) => x.season?.code)
                  .filter(Boolean)
                  .join(", ") || "—"}
              </div>

              <div style={{ marginTop: 10 }}>
                {editingId === loc.id ? (
                  <form onSubmit={saveEdit} style={{ display: "grid", gap: 8 }}>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={3}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    />

                    <textarea
                      value={editContactInfo}
                      onChange={(e) => setEditContatcInfo(e.target.value)}
                      placeholder="Contacts (optional)"
                      rows={2}
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    />

                    <input
                      value={editFishNames}
                      onChange={(e) => setEditFishNames(e.target.value)}
                      placeholder="Fish: Carp, Pike"
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    />
                    <input
                      value={editSeasonCodes}
                      onChange={(e) => setEditSeasonCodes(e.target.value)}
                      placeholder="Seasons: SPRING, SUMMER"
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    />

                    <input
                      value={editPhotoUrls}
                      onChange={(e) => setEditPhotoUrls(e.target.value)}
                      placeholder="Photo URLs (comma separated)"
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        border: "1px solid #ddd",
                      }}
                    />

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        disabled={saving}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid #ddd",
                        }}
                      >
                        {saving ? "Saving..." : "Save (will stay PENDING)"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid #ddd",
                        }}
                      >
                        Cancel
                      </button>
                    </div>

                    {editError && (
                      <div style={{ color: "crimson" }}>{editError}</div>
                    )}
                  </form>
                ) : (
                  <button
                    onClick={() => startEdit(loc)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
