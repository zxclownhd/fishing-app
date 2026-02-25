import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import LocationCard from "../components/LocationCard";

import RegionPicker from "../components/pickers/RegionPicker";
import FishPicker from "../components/pickers/FishPicker";
import SeasonPicker from "../components/pickers/SeasonPicker";

const LIMIT = 10;

export default function HomePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // UI controls
  const [regionSelected, setRegionSelected] = useState("");
  const [waterType, setWaterType] = useState("");
  const [fishSelected, setFishSelected] = useState([]);
  const [seasonsSelected, setSeasonsSelected] = useState([]); // multi сезони

  // applied filters
  const [filters, setFilters] = useState({
    region: "",
    waterType: "",
    fish: [],
    seasons: [],
  });

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / LIMIT)),
    [total],
  );
  const canPrev = page > 1;
  const canNext = page < totalPages;

  async function load(activeFilters, pageArg = page) {
    const params = { page: pageArg, limit: LIMIT };

    if (activeFilters.region) params.region = activeFilters.region;
    if (activeFilters.waterType) params.waterType = activeFilters.waterType;

    if (activeFilters.fish && activeFilters.fish.length) {
      params.fish = activeFilters.fish.join(",");
    }

    if (activeFilters.seasons && activeFilters.seasons.length) {
      params.seasons = activeFilters.seasons.join(",");
    }

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
    load(filters, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  function onSearch(e) {
    e.preventDefault();
    setPage(1);

    setFilters({
      region: regionSelected,
      waterType: waterType.trim(),
      fish: fishSelected,
      seasons: seasonsSelected,
    });
  }

  function onReset() {
    setRegionSelected("");
    setWaterType("");
    setFishSelected([]);
    setSeasonsSelected([]);
    setPage(1);

    setFilters({
      region: "",
      waterType: "",
      fish: [],
      seasons: [],
    });
  }

  function removeFilter(kind, value) {
    if (kind === "region") setRegionSelected("");
    if (kind === "waterType") setWaterType("");
    if (kind === "fish")
      setFishSelected((prev) => prev.filter((x) => x !== value));
    if (kind === "season")
      setSeasonsSelected((prev) => prev.filter((x) => x !== value));

    setPage(1);

    setFilters((prev) => {
      const next = { ...prev };

      if (kind === "region") next.region = "";
      if (kind === "waterType") next.waterType = "";
      if (kind === "fish")
        next.fish = (prev.fish || []).filter((x) => x !== value);
      if (kind === "season")
        next.seasons = (prev.seasons || []).filter((x) => x !== value);

      return next;
    });
  }

  return (
    <div style={{ padding: 16 }}>
      <h1>Fishing Locations</h1>

      <form
        onSubmit={onSearch}
        style={{ display: "grid", gap: 8, maxWidth: 520, marginBottom: 16 }}
      >
        <RegionPicker
          value={regionSelected}
          onChange={setRegionSelected}
          placeholder="Region"
        />

        <select
          value={waterType}
          onChange={(e) => setWaterType(e.target.value)}
          style={input}
        >
          <option value="">All water types</option>
          <option value="LAKE">Lake</option>
          <option value="RIVER">River</option>
          <option value="POND">Pond</option>
          <option value="SEA">Sea</option>
          <option value="OTHER">Other</option>
        </select>

        <FishPicker value={fishSelected} onChange={setFishSelected} />

        <SeasonPicker value={seasonsSelected} onChange={setSeasonsSelected} />

        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={loading}>
            Search
          </button>
          <button type="button" onClick={onReset} disabled={loading}>
            Reset
          </button>
        </div>
      </form>

      {filters.region ||
      filters.waterType ||
      (filters.fish && filters.fish.length) ||
      (filters.seasons && filters.seasons.length) ? (
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 6 }}>
            Active filters
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {filters.region ? (
              <Chip
                label={`Region: ${filters.region}`}
                onRemove={() => removeFilter("region")}
              />
            ) : null}

            {filters.waterType ? (
              <Chip
                label={`Water: ${filters.waterType}`}
                onRemove={() => removeFilter("waterType")}
              />
            ) : null}

            {(filters.fish || []).map((name) => (
              <Chip
                key={`fish-${name}`}
                label={`Fish: ${name}`}
                onRemove={() => removeFilter("fish", name)}
              />
            ))}

            {(filters.seasons || []).map((code) => (
              <Chip
                key={`season-${code}`}
                label={`Season: ${code}`}
                onRemove={() => removeFilter("season", code)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {loading ? <div>Loading...</div> : null}
      {error ? <div style={{ color: "crimson" }}>{error}</div> : null}

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

      <div
        style={{ marginTop: 16, display: "flex", gap: 8, alignItems: "center" }}
      >
        <button
          disabled={!canPrev || loading}
          onClick={() => setPage((p) => p - 1)}
        >
          Prev
        </button>

        <div style={{ opacity: 0.8 }}>
          Page {page} of {totalPages}
        </div>

        <button
          disabled={!canNext || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function Chip({ label, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      style={{
        border: "1px solid #ddd",
        borderRadius: 999,
        padding: "4px 10px",
        background: "#fff",
        cursor: "pointer",
      }}
      title="Remove filter"
    >
      {label} ✕
    </button>
  );
}

const input = { padding: 10, borderRadius: 8, border: "1px solid #ddd" };
