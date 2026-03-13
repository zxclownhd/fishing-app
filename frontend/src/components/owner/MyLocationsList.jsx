import { useEffect } from "react";
import LocationCard from "../LocationCard";
import EditLocationForm from "./EditLocationForm";
import { useI18n } from "../../client/i18n/I18nContext";
import { displayFishName } from "../../client/i18n/displayName";
import { toCompactFishChipLabel } from "../../utils/fishChipLabel";
import "./MyLocationsList.css";

export default function MyLocationsList({
  items,
  loading,
  error,
  page,
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
  const editingLoc = items.find((loc) => loc.id === editingId) || null;

  useEffect(() => {
    if (!editingLoc) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [editingLoc]);

  return (
    <div className="owner-list">
      {error ? (
        <div className="owner-list__error">
          <div>{error}</div>
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn btn-secondary owner-list__retry-btn"
          >
            {t("ownerList.retry")}
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="text-muted owner-list__state">{t("ownerList.loading")}</div>
      ) : null}

      {!loading && !error && items.length === 0 ? (
        <div className="text-muted owner-list__state">{t("ownerList.empty")}</div>
      ) : null}

      <div className="grid owner-list__cards">
        {items.map((loc) => {
          const isEditing = editingId === loc.id;
          const statusCode = String(loc?.status || "").toUpperCase();
          const fishItems = (loc.fish || []).map((x) => {
            const rawName = typeof x === "string" ? x : (x?.fish?.name || x?.name || "");
            const fullLabel = displayFishName(rawName, locale) || t("admin.unknown");
            return {
              fullLabel,
              compactLabel: toCompactFishChipLabel(fullLabel),
            };
          });
          const visibleFish = fishItems.slice(0, 3);
          const hiddenFishCount = Math.max(0, fishItems.length - visibleFish.length);

          const fishChips = visibleFish.map((item, idx) => {
            return (
              <span
                key={`${loc.id}-fish-${idx}-${item.fullLabel}`}
                className="owner-list__chip"
                title={item.fullLabel}
              >
                {item.compactLabel || item.fullLabel}
              </span>
            );
          });

          const seasonChips = (loc.seasons || []).slice(0, 8).map((x, idx) => {
            const code = typeof x === "string"
              ? x
              : (x?.season?.code || x?.season?.name || x?.code || x?.name || "");
            return (
              <span
                key={x?.seasonId ? `${loc.id}-season-${x.seasonId}` : `${loc.id}-season-${idx}`}
                className="owner-list__chip"
              >
                {code ? t(`seasons.${String(code).toUpperCase()}`, code) : t("admin.unknown")}
              </span>
            );
          });

          return (
            <LocationCard
              key={loc.id}
              loc={loc}
              variant="public"
              className={`owner-list__card ${isEditing ? "owner-list__card--editing" : ""}`}
              compactFishLabelMode="locale-smart"
              actions={
                <div className="owner-list__actions">
                  {isEditing ? (
                    <button type="button" disabled className="btn btn-secondary">
                      {t("ownerList.editing")}
                    </button>
                  ) : (
                    <button
                      onClick={() => onStartEdit(loc)}
                      disabled={loading}
                      className="btn btn-secondary"
                    >
                      {t("ownerList.edit")}
                    </button>
                  )}

                  <button
                    onClick={() => onToggleHidden(loc)}
                    disabled={loading}
                    className="btn btn-secondary"
                  >
                    {loc.status === "HIDDEN"
                      ? t("ownerList.unhide")
                      : t("ownerList.hide")}
                  </button>
                </div>
              }
              titleBadge={
                <span
                  className={`location-card__badge owner-list__status-badge owner-list__status-badge--${statusCode.toLowerCase()}`}
                >
                  {t(`card.statuses.${statusCode}`, loc?.status || statusCode || "-")}
                </span>
              }
              footer={
                <div className="owner-list__footer">
                  <div className="owner-list__group">
                    <div className="owner-list__group-label">{t("admin.groups.fish")}</div>
                    <div className="owner-list__group-chips">
                      {fishChips.length ? fishChips : <span className="owner-list__empty-dash">{"\u2014"}</span>}
                      {hiddenFishCount > 0 ? (
                        <span className="owner-list__chip">+{hiddenFishCount}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="owner-list__group">
                    <div className="owner-list__group-label">{t("admin.groups.seasons")}</div>
                    <div className="owner-list__group-chips">
                      {seasonChips.length ? seasonChips : <span className="owner-list__empty-dash">{"\u2014"}</span>}
                    </div>
                  </div>

                </div>
              }
            />
          );
        })}
      </div>

      {editingLoc ? (
        <div
          className="owner-list__edit-modal-overlay"
          onClick={onCancelEdit}
          role="presentation"
        >
          <div
            className="owner-list__edit-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t("ownerList.edit")}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="owner-list__edit-modal-title">
              {t("ownerList.edit")} - {editingLoc.title || t("card.noTitle")}
            </div>

            <div className="owner-list__edit-modal-content">
              <EditLocationForm
                loc={editingLoc}
                onSave={onSaveEdit}
                onCancel={onCancelEdit}
              />
            </div>
          </div>
        </div>
      ) : null}

      <div className="pagination owner-list__pagination">
        <button
          onClick={onPrev}
          disabled={loading || page === 1}
          className="btn btn-secondary"
        >
          {t("common.prev")}
        </button>

        <div className="text-muted">
          {t("ownerList.pageLabel")} {page} {t("owner.summary.ofLabel")} {totalPages}
        </div>

        <button
          onClick={onNext}
          disabled={loading || page >= totalPages}
          className="btn btn-secondary"
        >
          {t("common.next")}
        </button>
      </div>
    </div>
  );
}
