import LocationCard from "../LocationCard";
import EditLocationForm from "./EditLocationForm";
import { useI18n } from "../../client/i18n/I18nContext";
import { displayFishName } from "../../client/i18n/displayName";

export default function MyLocationsList({
  items,
  loading,
  error,
  page,
  total,
  totalPages,
  onPrev,
  onNext,
  onRefresh,
  editingId,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onToggleHidden,
}) {
  const { t, locale } = useI18n();

  return (
    <div style={{ marginTop: 12 }}>
      {error ? (
        <div style={styles.error}>
          <div>{error}</div>
          <button
            onClick={onRefresh}
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            {t("ownerList.retry")}
          </button>
        </div>
      ) : null}

      {loading ? (
        <div style={{ padding: 12 }}>{t("ownerList.loading")}</div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div style={styles.empty}>{t("ownerList.empty")}</div>
      ) : null}

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {items.map((loc) => {
          const isEditing = editingId === loc.id;

          const fishChips = (loc.fish || []).slice(0, 8).map((x, idx) => (
            <span
              key={
                x.fishId
                  ? `${loc.id}-fish-${x.fishId}`
                  : `${loc.id}-fish-${idx}`
              }
              style={styles.chip}
            >
              {displayFishName(x.fish?.name, locale) || t("admin.unknown")}
            </span>
          ));

          const seasonChips = (loc.seasons || []).slice(0, 8).map((x, idx) => {
            const code = x.season?.code || x.season?.name || "";
            return (
              <span
                key={
                  x.seasonId
                    ? `${loc.id}-season-${x.seasonId}`
                    : `${loc.id}-season-${idx}`
                }
                style={styles.chip}
              >
                {code ? t(`seasons.${code}`, code) : t("admin.unknown")}
              </span>
            );
          });

          return (
            <LocationCard
              key={loc.id}
              loc={loc}
              variant="admin"
              footer={
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={styles.group}>
                    <div style={styles.groupLabel}>
                      {t("admin.groups.fish")}
                    </div>
                    <div style={styles.groupChips}>
                      {fishChips.length ? (
                        fishChips
                      ) : (
                        <span style={styles.emptyDash}>—</span>
                      )}
                    </div>
                  </div>

                  <div style={styles.group}>
                    <div style={styles.groupLabel}>
                      {t("admin.groups.seasons")}
                    </div>
                    <div style={styles.groupChips}>
                      {seasonChips.length ? (
                        seasonChips
                      ) : (
                        <span style={styles.emptyDash}>—</span>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div style={styles.editBox}>
                      <EditLocationForm
                        loc={loc}
                        onSave={onSaveEdit}
                        onCancel={onCancelEdit}
                      />
                    </div>
                  ) : null}
                </div>
              }
              actions={
                <>
                  {isEditing ? (
                    <button type="button" disabled>
                      {t("ownerList.editing")}
                    </button>
                  ) : (
                    <button onClick={() => onStartEdit(loc)} disabled={loading}>
                      {t("ownerList.edit")}
                    </button>
                  )}

                  <button
                    onClick={() => onToggleHidden(loc)}
                    disabled={loading}
                  >
                    {loc.status === "HIDDEN"
                      ? t("ownerList.unhide")
                      : t("ownerList.hide")}
                  </button>
                </>
              }
            />
          );
        })}
      </div>

      <div style={styles.pagination}>
        <button onClick={onPrev} disabled={loading || page === 1}>
          {t("common.prev")}
        </button>

        <div style={{ opacity: 0.8 }}>
          {t("ownerList.pageLabel")} {page} / {totalPages} |{" "}
          {t("ownerList.totalLabel")} {total}
        </div>

        <button onClick={onNext} disabled={loading || page >= totalPages}>
          {t("common.next")}
        </button>
      </div>
    </div>
  );
}

const styles = {
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid #eee",
  },
  chip: {
    fontSize: 12,
    padding: "2px 8px",
    border: "1px solid #eee",
    borderRadius: 999,
  },
  editBox: {
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 12,
    background: "#fafafa",
  },
  empty: { padding: 12, opacity: 0.75 },
  error: {
    marginTop: 12,
    padding: 12,
    border: "1px solid #f2b5b5",
    background: "#fff0f0",
    borderRadius: 12,
  },

  group: { display: "grid", gap: 6 },
  groupLabel: {
    fontSize: 12,
    opacity: 0.7,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  groupChips: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  },
  emptyDash: { opacity: 0.6, fontSize: 13 },
};
