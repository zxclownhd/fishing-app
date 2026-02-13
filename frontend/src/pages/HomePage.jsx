import { useEffect, useState } from "react";
import { http } from "../api/http";
import { Link } from "react-router-dom";

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [region, setRegion] = useState("");
  const [waterType, setWaterType] = useState("");
  const [fish, setFish] = useState("");
  const [season, setSeason] = useState("");

  async function load(params = {}) {
    try {
      setLoading(true);
      setError("");
      const res = await http.get("/locations", { params });
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
      setError("Failed to load locations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial load
    load();
  }, []);

  function onSearch(e) {
    e.preventDefault();

    const params = {};
    if (region.trim()) params.region = region.trim();
    if (waterType.trim()) params.waterType = waterType.trim(); // e.g. LAKE / RIVER
    if (fish.trim()) params.fish = fish.trim(); // e.g. Carp
    if (season.trim()) params.season = season.trim(); // e.g. SPRING

    load(params);
  }

  function onReset() {
    setRegion("");
    setWaterType("");
    setFish("");
    setSeason("");
    load();
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Fishing Locations</h1>

      <form
        onSubmit={onSearch}
        style={{ display: "grid", gap: 8, maxWidth: 520, marginBottom: 16 }}
      >
        <input
          placeholder="Region (e.g. Kyiv)"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          placeholder="Water type (LAKE / RIVER / POND / SEA)"
          value={waterType}
          onChange={(e) => setWaterType(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          placeholder="Fish (e.g. Carp)"
          value={fish}
          onChange={(e) => setFish(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <input
          placeholder="Season (SPRING / SUMMER / AUTUMN / WINTER)"
          value={season}
          onChange={(e) => setSeason(e.target.value)}
          style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
        />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="submit"
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          >
            Search
          </button>
          <button
            type="button"
            onClick={onReset}
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          >
            Reset
          </button>
        </div>
      </form>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "crimson" }}>{error}</div>}

      {!loading && !error && items.length === 0 && (
        <div style={{ opacity: 0.7 }}>No locations found.</div>
      )}

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          marginTop: 12,
        }}
      >
        {items.map((loc) => (
          <Link
            to={`/locations/${loc.id}`}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <div
              style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12 }}
            >
              <div style={{ fontWeight: 700 }}>{loc.title}</div>
              <div style={{ opacity: 0.8 }}>
                {loc.region} • {loc.waterType}
              </div>

              <div style={{ marginTop: 8 }}>
                Rating: {loc.avgRating ?? "—"} ({loc.reviewsCount ?? 0})
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
