import { useMemo, useState } from "react";

const OPTIONS = ["SPRING", "SUMMER", "AUTUMN", "WINTER"];

export default function SeasonPicker({ value, onChange }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return OPTIONS
      .filter((x) => !(value || []).includes(x))
      .filter((x) => x.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query, value]);

  function add(code) {
    const next = (value || []).includes(code) ? (value || []) : [...(value || []), code];
    onChange(next);
  }

  function remove(code) {
    onChange((value || []).filter((x) => x !== code));
  }

  return (
    <div style={{ position: "relative", display: "grid", gap: 6 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(value || []).map((code) => (
          <button key={code} type="button" onClick={() => remove(code)} style={chipBtn}>
            {code} ✕
          </button>
        ))}
      </div>

      <input
        placeholder="Seasons (type to search)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={input}
      />

      {open && filtered.length > 0 ? (
        <div style={{ ...dropdown, marginTop: 72 }}>
          {filtered.map((code) => (
            <div
              key={code}
              onMouseDown={() => {
                add(code);
                setQuery("");
                setOpen(false);
              }}
              style={dropdownItem}
            >
              {code}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const input = { padding: 10, borderRadius: 8, border: "1px solid #ddd", width: "100%" };
const chipBtn = { border: "1px solid #ddd", borderRadius: 999, padding: "4px 10px", background: "#fff" };
const dropdown = {
  position: "absolute",
  zIndex: 10,
  background: "white",
  border: "1px solid #ddd",
  width: "100%",
  borderRadius: 8,
  overflow: "hidden",
  maxHeight: 220,
  overflowY: "auto",
};
const dropdownItem = { padding: 8, cursor: "pointer" };