import { Link } from "react-router-dom";
import { useMemo } from "react";
import { getCloudinaryVariant } from "../utils/cloudinaryUrl";
import { toCompactFishChipLabel } from "../utils/fishChipLabel";
import { useI18n } from "../client/i18n/I18nContext";
import { displayFishName } from "../client/i18n/displayName";
import "./LocationCard.css";

export default function LocationCard({
  loc,
  to, // optional string; if present - wrap in Link
  toState, // optional Link state when using `to`
  variant = "public", // "public" | "admin"
  className = "",
  titleBadge = null,
  actions = null, // optional JSX (buttons etc)
  footer = null, // optional JSX under description
  onClick, // optional click handler when NOT using `to`
  hideAdminDescription = false,
  compactFishLabelMode = "full", // "full" | "locale-smart"
}) {
  const { t, locale } = useI18n();

  const photoUrl = loc?.photos?.[0]?.url || null;
  const photoCount = getLocationPhotoCount(loc);
  const extraPhotoCount = Math.max(0, photoCount - 1);
  const extraPhotosLabel =
    extraPhotoCount > 0 ? formatExtraPhotosLabel(extraPhotoCount, locale, t) : "";

  const thumbUrl = photoUrl
    ? getCloudinaryVariant(photoUrl, {
        w: 640,
        h: 400,
        crop: "fill",
        gravity: "auto",
      })
    : "";

  const rating = useMemo(() => {
    if (variant !== "public") return null;
    const avg = Number(loc?.avgRating ?? 0);
    const cnt = Number(loc?.reviewsCount ?? 0);
    if (!cnt) {
      return {
        hasReviews: false,
        label: t("card.noReviews"),
        title: t("card.noReviews"),
      };
    }
    const value = avg.toFixed(1);
    return {
      hasReviews: true,
      value,
      title: `${value}`,
    };
  }, [variant, loc, t]);

  const status = loc?.status;
  const owner = loc?.owner;

  const regionLabel = loc?.region
    ? t(`regions.${String(loc.region).toUpperCase()}`, loc.region)
    : t("card.unknownRegion");

  const waterTypeLabel = loc?.waterType
    ? t(`home.waterTypes.${String(loc.waterType).toUpperCase()}`, loc.waterType)
    : t("card.unknownType");

  const fishNames = useMemo(
    () => extractFishNames(loc?.fish).map((name) => displayFishName(name, locale)),
    [loc?.fish, locale],
  );

  const seasonLabels = useMemo(
    () =>
      extractSeasonCodes(loc?.seasons).map((code) =>
        t(`seasons.${String(code).toUpperCase()}`, code),
      ),
    [loc?.seasons, t],
  );

  const compactFish = useMemo(
    () =>
      fishNames.map((name) => ({
        label:
          compactFishLabelMode === "locale-smart"
            ? toCompactFishChipLabel(name)
            : name,
        title: name,
      })),
    [fishNames, compactFishLabelMode],
  );

  const visibleFish = compactFish.slice(0, 3);
  const hiddenFishCount = Math.max(0, compactFish.length - visibleFish.length);
  const visibleSeasons = seasonLabels.slice(0, 2);
  const hiddenSeasonsCount = Math.max(0, seasonLabels.length - visibleSeasons.length);
  const isInteractive = Boolean(to || onClick);

  const card = (
    <div
      className={`location-card ${
        variant === "public" ? "location-card--public" : "location-card--admin"
      } ${isInteractive ? "location-card--interactive" : ""} ${className}`.trim()}
      role={!to && onClick ? "button" : undefined}
      tabIndex={!to && onClick ? 0 : undefined}
      onClick={!to ? onClick : undefined}
      onKeyDown={
        !to && onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick(e);
            }
          : undefined
      }
    >
      <div className="location-card__media">
        {photoUrl ? (
          <img
            alt={loc?.title || t("card.photoAlt")}
            src={thumbUrl}
            loading="lazy"
            decoding="async"
            className="location-card__img"
          />
        ) : (
          <div className="location-card__no-img">{t("card.noPhoto")}</div>
        )}
        {photoUrl && extraPhotoCount > 0 ? (
          <span className="location-card__photo-count-pill">{extraPhotosLabel}</span>
        ) : null}
      </div>

      <div className="location-card__body">
        {variant === "public" ? (
          <div className="location-card__utility-row">
            <div
              className={`location-card__rating ${
                rating?.hasReviews ? "" : "location-card__rating--empty"
              }`}
              title={rating?.title}
            >
              {rating?.hasReviews ? (
                <>
                  <span className="location-card__rating-main">
                    <span className="location-card__rating-star" aria-hidden>
                      {"\u2605"}
                    </span>
                    {rating.value}
                  </span>
                </>
              ) : (
                <span className="location-card__rating-empty">{rating?.label}</span>
              )}
            </div>

            {actions ? (
              <div
                className="location-card__utility-actions"
                onClick={(e) => e.stopPropagation()}
              >
                {actions}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="location-card__top-row">
          <div className="location-card__title">{loc?.title || t("card.noTitle")}</div>

          {titleBadge ? (
            titleBadge
          ) : variant === "admin" && status ? (
            <span className="location-card__badge" style={badgeForStatus(status)}>
              {t(`card.statuses.${String(status).toUpperCase()}`, status)}
            </span>
          ) : null}
        </div>

        <div className="location-card__meta">
          <span className="location-card__meta-item">{regionLabel}</span>
          <span className="location-card__dot">{"\u2022"}</span>
          <span className="location-card__meta-item">{waterTypeLabel}</span>
        </div>

        {variant === "admin" ? (
          <div className="location-card__admin-meta">
            {loc?.createdAt ? (
              <div className="location-card__admin-line">
                {t("card.createdAtLabel", "Created at:")}{" "}
                {new Date(loc.createdAt).toLocaleString()}
              </div>
            ) : null}
            {owner ? (
              <div className="location-card__admin-line">
                {t("card.ownerLabel")} {owner.displayName || "\u2014"}
                {owner.email ? ` (${owner.email})` : ""}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="location-card__info-block">
              <CompactRow
                label={t("home.filterLabels.fish", "Fish")}
                items={visibleFish}
                hiddenCount={hiddenFishCount}
              />
              <CompactRow
                label={t("home.filterLabels.season", "Season")}
                items={visibleSeasons}
                hiddenCount={hiddenSeasonsCount}
              />
            </div>
          </>
        )}

        {variant === "public" ? (
          <PublicDescription
            text={loc?.description}
            label={t("card.descriptionLabel")}
            emptyText={t("card.noDescription")}
          />
        ) : hideAdminDescription ? null : loc?.description ? (
          <div className="location-card__desc">{loc.description}</div>
        ) : (
          <div className="location-card__desc-empty">{t("card.noDescription")}</div>
        )}

        {footer ? <div className="location-card__footer">{footer}</div> : null}

        {actions && variant !== "public" ? (
          <div
            className="location-card__actions"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link to={to} state={toState} className="location-card__link">
        {card}
      </Link>
    );
  }

  return card;
}

function badgeForStatus(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING") {
    return {
      background: "var(--color-status-pending-bg)",
      borderColor: "var(--color-status-pending-border)",
    };
  }
  if (s === "APPROVED") {
    return {
      background: "var(--color-status-approved-bg)",
      borderColor: "var(--color-status-approved-border)",
    };
  }
  if (s === "REJECTED") {
    return {
      background: "var(--color-status-rejected-bg)",
      borderColor: "var(--color-status-rejected-border)",
    };
  }
  if (s === "HIDDEN") {
    return {
      background: "var(--color-status-hidden-bg)",
      borderColor: "var(--color-status-hidden-border)",
    };
  }
  return {
    background: "var(--color-status-hidden-bg)",
    borderColor: "var(--color-status-hidden-border)",
  };
}

function CompactRow({ label, items, hiddenCount }) {
  return (
    <div className="location-card__compact-row">
      <div className="location-card__compact-label">{label}</div>
      <div className="location-card__compact-items">
        {items.length ? (
          <>
            {items.map((item) => (
              <span
                key={typeof item === "string" ? item : `${item.title}-${item.label}`}
                className="location-card__compact-chip"
                title={typeof item === "string" ? undefined : item.title}
              >
                {typeof item === "string" ? item : item.label}
              </span>
            ))}
            {hiddenCount > 0 ? (
              <span className="location-card__compact-chip location-card__compact-chip--more">
                +{hiddenCount}
              </span>
            ) : null}
          </>
        ) : (
          <span className="location-card__compact-empty">{"\u2014"}</span>
        )}
      </div>
    </div>
  );
}

function extractFishNames(fish) {
  if (!Array.isArray(fish)) return [];
  const names = fish
    .map((x) => {
      if (typeof x === "string") return x;
      return x?.fish?.name || x?.name || "";
    })
    .map((x) => String(x || "").trim())
    .filter(Boolean);
  return [...new Set(names)];
}

function extractSeasonCodes(seasons) {
  if (!Array.isArray(seasons)) return [];
  const codes = seasons
    .map((x) => {
      if (typeof x === "string") return x;
      return x?.season?.code || x?.code || x?.season?.name || x?.name || "";
    })
    .map((x) => String(x || "").trim())
    .filter(Boolean);
  return [...new Set(codes)];
}

function PublicDescription({ text, label, emptyText }) {
  const hasText = Boolean(String(text || "").trim());

  return (
    <div className="location-card__desc-section">
      <div className="location-card__compact-label location-card__desc-label">
        {label}
      </div>
      <div className="location-card__desc-wrap">
        {hasText ? (
          <div className="location-card__desc location-card__desc--public">
            {text}
          </div>
        ) : (
          <div className="location-card__desc-empty">{emptyText}</div>
        )}
      </div>
    </div>
  );
}

function getLocationPhotoCount(loc) {
  const byField = Number(loc?.photosCount);
  if (Number.isFinite(byField) && byField >= 0) return byField;

  const byCountObj = Number(loc?._count?.photos);
  if (Number.isFinite(byCountObj) && byCountObj >= 0) return byCountObj;

  return Array.isArray(loc?.photos) ? loc.photos.length : 0;
}

function formatExtraPhotosLabel(count, locale, t) {
  const normalized = Number.isFinite(Number(count)) ? Math.max(0, Number(count)) : 0;
  const rules = new Intl.PluralRules(locale === "uk" ? "uk" : "en");
  const category = rules.select(normalized);
  const template = t(
    `card.extraPhotos.${category}`,
    t("card.extraPhotos.other", "+{count} photos"),
  );
  return String(template).replace("{count}", String(normalized));
}
