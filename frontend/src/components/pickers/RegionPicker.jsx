import { useMemo, useState } from "react";
import { useI18n } from "../../client/i18n/I18nContext";

const REGION_OPTIONS = [
  "VINNYTSIA","VOLYN","DNIPROPETROVSK","DONETSK","ZHYTOMYR","ZAKARPATTIA","ZAPORIZHZHIA",
  "IVANO_FRANKIVSK","KYIV","KIROVOHRAD","LUHANSK","LVIV","MYKOLAIV","ODESA","POLTAVA","RIVNE",
  "SUMY","TERNOPIL","KHARKIV","KHERSON","KHMELNYTSKYI","CHERKASY","CHERNIVTSI","CHERNIHIV","CRIMEA",
];

export default function RegionPicker({ value, onChange, placeholder }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const ph = placeholder ?? t("regionPicker.placeholder");

  const filtered = useMemo(() => {
    const q = String(value || "").trim().toLowerCase();
    if (!q) return REGION_OPTIONS.slice(0, 20);

    return REGION_OPTIONS
      .filter((code) => {
        const label = t(`regions.${code}`, code).toLowerCase();
        return code.toLowerCase().includes(q) || label.includes(q);
      })
      .slice(0, 20);
  }, [value, t]);

  function selectRegion(code) {
    onChange(code);
    setOpen(false);
  }

  function displayValue(v) {
    if (!v) return "";
    // Якщо юзер набирає “чернетку” (не код), показуємо як є
    if (!REGION_OPTIONS.includes(v)) return v;
    return t(`regions.${v}`, v);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        placeholder={ph}
        value={displayValue(value || "")}
        onChange={(e) => {
          // Дозволяємо вводити текст (чернетку). Якщо це точний код – ок.
          // Якщо юзер вводить "Київська", це не код і просто фільтрує список.
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        style={input}
      />

      {open && filtered.length > 0 ? (
        <div style={dropdown}>
          {filtered.map((code) => (
            <div key={code} onMouseDown={() => selectRegion(code)} style={dropdownItem}>
              {t(`regions.${code}`, code)}
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