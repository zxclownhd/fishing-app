import { useEffect, useMemo, useState } from "react";
import { http } from "../../api/http";
import { getErrorMessage } from "../../api/getErrorMessage";
import { useI18n } from "../../client/i18n/I18nContext";
import { displayFishName } from "../../client/i18n/displayName";

export default function FishPicker({ value, onChange }) {
  const { t, locale } = useI18n();

  const [options, setOptions] = useState([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await http.get("/locations/fish");
        const names = (res.data.items || []).map((x) => x.name).filter(Boolean);
        if (!cancelled) setOptions(names);
      } catch (e) {
        console.error(
          "Failed to load fish:",
          getErrorMessage(e, t("fishPicker.loadFailed")),
        );
        if (!cancelled) setOptions([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options
      .filter((name) => !(value || []).includes(name))
      .filter((name) => {
        if (!q) return true;
        const en = name.toLowerCase();
        const uk = displayFishName(name, locale).toLowerCase();
        return en.includes(q) || uk.includes(q);
      })
      .slice(0, 50);
  }, [options, query, value, locale]);

  function add(name) {
    const next = (value || []).includes(name)
      ? value || []
      : [...(value || []), name];
    onChange(next);
  }

  function remove(name) {
    onChange((value || []).filter((x) => x !== name));
  }

  return (
    <div style={{ position: "relative", display: "grid", gap: 6 }}>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(value || []).map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => remove(name)}
            style={chipBtn}
          >
            {displayFishName(name, locale)} ✕
          </button>
        ))}
      </div>

      <input
        placeholder={t("fishPicker.placeholder")}
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
          {filtered.map((name) => (
            <div
              key={name}
              onMouseDown={() => {
                add(name);
                setQuery("");
                setOpen(false);
              }}
              style={dropdownItem}
            >
              {displayFishName(name, locale)}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

const input = {
  padding: 10,
  borderRadius: 8,
  border: "1px solid #ddd",
  width: "100%",
};
const chipBtn = {
  border: "1px solid #ddd",
  borderRadius: 999,
  padding: "4px 10px",
  background: "#fff",
};
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
