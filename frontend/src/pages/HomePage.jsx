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

  const [filters, setFilters] = useState({
    region: "",
    waterType: "",
    fish: "",
    season: "",
  });

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  const canNext = page * limit < total;
  const canPrev = page > 1;

  async function load(activeFilters) {
    const params = {
      page,
      limit,
    };

    if (activeFilters.region) params.region = activeFilters.region;
    if (activeFilters.waterType) params.waterType = activeFilters.waterType;
    if (activeFilters.fish) params.fish = activeFilters.fish;
    if (activeFilters.season) params.season = activeFilters.season;

    try {
      setLoading(true);
      setError("");
      const res = await http.get("/locations", { params });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
      setError("Failed to load locations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(filters);
  }, [page, filters]);

  function onSearch(e) {
    e.preventDefault();

    setPage(1);

    setFilters({
      region: region.trim(),
      waterType: waterType.trim(),
      fish: fish.trim(),
      season: season.trim(),
    });
  }

  function onReset() {
    setRegion("");
    setWaterType("");
    setFish("");
    setSeason("");
    setPage(1);

    setFilters({
      region: "",
      waterType: "",
      fish: "",
      season: "",
    });
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Fishing Locations</h1>

      <form
        onSubmit={onSearch}
        style={{ display: "grid", gap: 8, maxWidth: 520, marginBottom: 16 }}
      >
        <input
          placeholder="Region"
          value={region}
          onChange={(e) => setRegion(e.target.value)}
        />

        <select value={waterType} onChange={(e) => setWaterType(e.target.value)}>
          <option value={""}>All water types</option>
          <option value={"LAKE"}>Lake</option>
          <option value={"RIVER"}>River</option>
          <option value={"POND"}>Pond</option>
          <option value={"SEA"}>Sea</option>
        </select>

        <input
          placeholder="Fish"
          value={fish}
          onChange={(e) => setFish(e.target.value)}
        />

        <select value={season} onChange={(e) => setSeason(e.target.value)}>
          <option value={""}>All seasons</option>
          <option value={"SPRING"}>Spring</option>
          <option value={"SUMMER"}>Summer</option>
          <option value={"AUTUMN"}>Autumn</option>
          <option value={"WINTER"}>Winter</option>
        </select>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit">Search</button>
          <button type="button" onClick={onReset}>
            Reset
          </button>
        </div>
      </form>

      {loading && <div>Loading...</div>}
      {error && <div style={{ color: "crimson" }}>{error}</div>}

      <div
        style={{
          display: "grid",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        }}
      >
        {items.map((loc) => (
          <Link key={loc.id} to={`/locations/${loc.id}`}>
            <div style={{ border: "1px solid #ddd", padding: 12 }}>
              <div style={{ fontWeight: 700 }}>{loc.title}</div>
              <div>
                {loc.region} • {loc.waterType}
              </div>
              <div>
                Rating: {loc.avgRating ?? "—"} ({loc.reviewsCount ?? 0})
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button disabled={!canPrev} onClick={() => setPage(page - 1)}>
          Prev
        </button>

        <div>Page {page}</div>

        <button disabled={!canNext} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
