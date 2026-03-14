import React from "react";
import { SORT_OPTIONS } from "./sortOptions";
import { useI18n } from "../../client/i18n/I18nContext";

export default function SortPicker({ value, onChange }) {
  const { t } = useI18n();

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div className="type-label" style={{ opacity: 0.85 }}>
        {t("sort.title")}
      </div>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid var(--color-border-soft)",
          background: "var(--color-surface)",
          color: "var(--color-text)",
          fontSize: "var(--type-body-size)",
          lineHeight: "var(--type-body-line)",
        }}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {t(`sort.options.${opt.i18nKey}`, opt.value)}
          </option>
        ))}
      </select>
    </div>
  );
}
