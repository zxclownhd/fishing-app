import { useMemo, useState } from "react";

const REGION_OPTIONS = [
  "VINNYTSIA","VOLYN","DNIPROPETROVSK","DONETSK","ZHYTOMYR","ZAKARPATTIA","ZAPORIZHZHIA",
  "IVANO_FRANKIVSK","KYIV","KIROVOHRAD","LUHANSK","LVIV","MYKOLAIV","ODESA","POLTAVA","RIVNE",
  "SUMY","TERNOPIL","KHARKIV","KHERSON","KHMELNYTSKYI","CHERKASY","CHERNIVTSI","CHERNIHIV","CRIMEA",
];

export default function RegionPicker({ value, onChange, placeholder = "Region" }) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REGION_OPTIONS.slice(0, 20);
    return REGION_OPTIONS.filter((r) => r.toLowerCase().includes(q)).slice(0, 20);
  }, [query]);

  function selectRegion(r) {
    onChange(r);
    setQuery(r);
    setOpen(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          onChange(""); // поки не вибрали зі списку
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={input}
      />

      {open && filtered.length > 0 ? (
        <div style={dropdown}>
          {filtered.map((r) => (
            <div
              key={r}
              onMouseDown={() => selectRegion(r)}
              style={dropdownItem}
            >
              {r}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const input = { padding: 10, borderRadius: 8, border: "1px solid #ddd", width: "100%" };
const dropdown = {
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
};
const dropdownItem = { padding: 8, cursor: "pointer" };