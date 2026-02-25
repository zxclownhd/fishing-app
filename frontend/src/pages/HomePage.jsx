import { useEffect, useState } from "react";
import { http } from "../api/http";
import { Link } from "react-router-dom";
import LocationCard from "../components/LocationCard";

const REGION_OPTIONS = [
  "VINNYTSIA",
  "VOLYN",
  "DNIPROPETROVSK",
  "DONETSK",
  "ZHYTOMYR",
  "ZAKARPATTIA",
  "ZAPORIZHZHIA",
  "IVANO_FRANKIVSK",
  "KYIV",
  "KIROVOHRAD",
  "LUHANSK",
  "LVIV",
  "MYKOLAIV",
  "ODESA",
  "POLTAVA",
  "RIVNE",
  "SUMY",
  "TERNOPIL",
  "KHARKIV",
  "KHERSON",
  "KHMELNYTSKYI",
  "CHERKASY",
  "CHERNIVTSI",
  "CHERNIHIV",
  "CRIMEA",
];

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [waterType, setWaterType] = useState("");
  const [season, setSeason] = useState("");

  const [filters, setFilters] = useState({
    region: "",
    waterType: "",
    fish: "",
    season: "",
  });

  const [regionQuery, setRegionQuery] = useState("");
  const [regionSelected, setRegionSelected] = useState("");
  const [regionOpen, setRegionOpen] = useState(false);

  const q = regionQuery.trim().toLowerCase();
  const regionFiltered = REGION_OPTIONS.filter((r) =>
    r.toLowerCase().includes(q),
  );

  const [fishOptions, setFishOptions] = useState([]);
  const [fishQuery, setFishQuery] = useState("");
  const [fishSelected, setFishSelected] = useState([]);
  const [fishOpen, setFishOpen] = useState(false);

  const loadFish = async () => {
    try {
      const res = await http.get("/locations/fish");
      const names = (res.data.items || []).map((item) => item.name);

      setFishOptions(names);
    } catch (err) {
      console.error(err);
      setError("Failed to load fish");
    }
  };

  const fishFiltered = fishOptions
    .filter((name) => !fishSelected.includes(name))
    .filter((name) =>
      name.toLowerCase().includes(fishQuery.trim().toLowerCase()),
    )
    .slice(0, 10);

  function addFish(name) {
    setFishSelected((prev) => (prev.includes(name) ? prev : [...prev, name]));
  }

  function removeFish(name) {
    setFishSelected((prev) => prev.filter((x) => x !== name));
  }

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
    if (activeFilters.fish && activeFilters.fish.length) {
      params.fish = activeFilters.fish.join(",");
    }
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
    loadFish();
  }, []);

  useEffect(() => {
    load(filters);
  }, [page, filters]);

  function onSearch(e) {
    e.preventDefault();

    setPage(1);

    setFilters({
      region: regionSelected,
      waterType: waterType.trim(),
      fish: fishSelected,
      season: season.trim(),
    });
  }

  function onReset() {
    setWaterType("");
    setSeason("");
    setRegionQuery("");
    setRegionSelected("");
    setRegionOpen(false);
    setFishSelected([]);
    setFishQuery("");
    setFishOpen(false);
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
        <div style={{ position: "relative" }}>
          <input
            placeholder="Region"
            value={regionQuery}
            onChange={(e) => {
              setRegionQuery(e.target.value);
              setRegionOpen(true);
              setRegionSelected("");
            }}
            onFocus={() => setRegionOpen(true)}
            onBlur={() => setRegionOpen(false)}
          />

          {regionOpen && regionFiltered.length > 0 && (
            <div
              style={{
                position: "absolute",
                zIndex: 10,
                background: "white",
                border: "1px solid #ddd",
                width: "100%",
                marginTop: 4,
                borderRadius: 8,
                overflow: "hidden",
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              {regionFiltered.map((r) => (
                <div
                  key={r}
                  onMouseDown={() => {
                    setRegionSelected(r);
                    setRegionQuery(r);
                    setRegionOpen(false);
                  }}
                  style={{ padding: 8, cursor: "pointer" }}
                >
                  {r}
                </div>
              ))}
            </div>
          )}
        </div>

        <select
          value={waterType}
          onChange={(e) => setWaterType(e.target.value)}
        >
          <option value={""}>All water types</option>
          <option value={"LAKE"}>Lake</option>
          <option value={"RIVER"}>River</option>
          <option value={"POND"}>Pond</option>
          <option value={"SEA"}>Sea</option>
        </select>

        <div style={{ position: "relative", display: "grid", gap: 6 }}>
          {/* chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {fishSelected.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => removeFish(name)}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 999,
                  padding: "4px 10px",
                }}
              >
                {name} ✕
              </button>
            ))}
          </div>

          {/* input */}
          <input
            placeholder="Fish (type to search)"
            value={fishQuery}
            onChange={(e) => {
              setFishQuery(e.target.value);
              setFishOpen(true);
            }}
            onFocus={() => setFishOpen(true)}
            onBlur={() => setFishOpen(false)}
          />

          {/* dropdown */}
          {fishOpen && fishFiltered.length > 0 && (
            <div
              style={{
                position: "absolute",
                zIndex: 10,
                background: "white",
                border: "1px solid #ddd",
                width: "100%",
                marginTop: 72, // щоб випало під інпутом; потім відполіруєш
                borderRadius: 8,
                overflow: "hidden",
                maxHeight: 220,
                overflowY: "auto",
              }}
            >
              {fishFiltered.map((name) => (
                <div
                  key={name}
                  onMouseDown={() => {
                    addFish(name);
                    setFishQuery("");
                    setFishOpen(false);
                  }}
                  style={{ padding: 8, cursor: "pointer" }}
                >
                  {name}
                </div>
              ))}
            </div>
          )}
        </div>

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
          <LocationCard
            key={loc.id}
            loc={loc}
            to={`/locations/${loc.id}`}
            variant="public"
          />
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
