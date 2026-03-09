// src/client/components/LocationCard.jsx
import { Link } from "react-router-dom";
import { useMemo } from "react";
import { getCloudinaryVariant } from "../utils/cloudinaryUrl";
import { useI18n } from "../client/i18n/I18nContext";
import "./LocationCard.css";

export default function LocationCard({
  loc,
  to, // optional string; if present - wrap in Link
  variant = "public", // "public" | "admin"
  actions = null, // optional JSX (buttons etc)
  footer = null, // optional JSX under description
  onClick, // optional click handler when NOT using `to`
}) {
  const { t } = useI18n();

  const photoUrl = loc?.photos?.[0]?.url || null;

  const thumbUrl = photoUrl
    ? getCloudinaryVariant(photoUrl, {
        w: 400,
        h: 280,
        crop: "fill",
        gravity: "auto",
      })
    : "";

  const ratingText = useMemo(() => {
    if (variant !== "public") return null;
    const avg = Number(loc?.avgRating ?? 0);
    const cnt = Number(loc?.reviewsCount ?? 0);
    if (!cnt) return t("card.noReviews");
    return `${avg.toFixed(1)} / 5 (${cnt})`;
  }, [variant, loc, t]);

  const status = loc?.status;
  const owner = loc?.owner;

  const regionLabel = loc?.region
    ? t(`regions.${String(loc.region).toUpperCase()}`, loc.region)
    : t("card.unknownRegion");

  const waterTypeLabel = loc?.waterType
    ? t(`home.waterTypes.${String(loc.waterType).toUpperCase()}`, loc.waterType)
    : t("card.unknownType");

  const card = (
    <div
      className="location-card"
      style={styles.card}
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
      <div style={styles.media}>
        {photoUrl ? (
          <img
            alt={loc?.title || t("card.photoAlt")}
            src={thumbUrl}
            loading="lazy"
            decoding="async"
            style={styles.img}
          />
        ) : (
          <div style={styles.noImg}>{t("card.noPhoto")}</div>
        )}
      </div>

      <div style={styles.body}>
        <div style={styles.topRow}>
          <div style={styles.title}>{loc?.title || t("card.noTitle")}</div>

          {variant === "admin" && status ? (
            <span style={{ ...styles.badge, ...badgeForStatus(status) }}>
              {t(`card.statuses.${String(status).toUpperCase()}`, status)}
            </span>
          ) : null}
        </div>

        <div style={styles.meta}>
          <span style={styles.metaItem}>{regionLabel}</span>
          <span style={styles.dot}>•</span>
          <span style={styles.metaItem}>{waterTypeLabel}</span>
        </div>

        {variant === "admin" ? (
          <div style={styles.adminMeta}>
            {owner ? (
              <div style={styles.adminLine}>
                {t("card.ownerLabel")} {owner.displayName || "—"}
                {owner.email ? ` (${owner.email})` : ""}
              </div>
            ) : null}
            {loc?.createdAt ? (
              <div style={styles.adminLine}>
                {t("card.createdLabel")}{" "}
                {new Date(loc.createdAt).toLocaleString()}
              </div>
            ) : null}
          </div>
        ) : (
          <div style={styles.rating}>{ratingText}</div>
        )}

        {loc?.description ? (
          <div style={styles.desc}>{loc.description}</div>
        ) : (
          <div style={styles.descEmpty}>{t("card.noDescription")}</div>
        )}

        {footer ? <div style={styles.footer}>{footer}</div> : null}

        {actions ? (
          <div
            className="location-card__actions"
            style={styles.actions}
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
      <Link to={to} style={{ textDecoration: "none", color: "inherit" }}>
        {card}
      </Link>
    );
  }

  return card;
}

function badgeForStatus(status) {
  const s = String(status || "").toUpperCase();
  if (s === "PENDING") return { background: "#FFF6D6", borderColor: "#F2D27A" };
  if (s === "APPROVED")
    return { background: "#DFF7E6", borderColor: "#7FD39A" };
  if (s === "REJECTED")
    return { background: "#FFE1E1", borderColor: "#F09A9A" };
  if (s === "HIDDEN") return { background: "#EEEEEE", borderColor: "#CFCFCF" };
  return { background: "#EEEEEE", borderColor: "#CFCFCF" };
}

const styles = {
  card: {
    display: "flex",
    flexDirection: "var(--location-card-direction, row)",
    gap: "var(--location-card-gap, 12px)",
    flexWrap: "wrap",
    padding: 12,
    border: "1px solid #e6e6e6",
    borderRadius: 12,
    background: "#fff",
    cursor: "pointer",
  },
  media: {
    width: "var(--location-card-media-width, 140px)",
    minWidth: "var(--location-card-media-min-width, 140px)",
    height: 100,
    borderRadius: 10,
    overflow: "hidden",
    border: "1px solid #eee",
    background: "#fafafa",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  img: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  noImg: { fontSize: 12, opacity: 0.6 },
  body: { flex: 1, minWidth: 0 },
  topRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  badge: {
    fontSize: 12,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid #ddd",
    whiteSpace: "nowrap",
  },
  meta: {
    marginTop: 4,
    fontSize: 13,
    opacity: 0.8,
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  metaItem: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "var(--location-card-meta-white-space, nowrap)",
  },
  dot: { opacity: 0.6 },
  rating: { marginTop: 6, fontSize: 13, opacity: 0.8 },
  adminMeta: {
    marginTop: 6,
    fontSize: 12,
    opacity: 0.8,
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  adminLine: { whiteSpace: "nowrap" },
  desc: {
    marginTop: 8,
    fontSize: 13,
    opacity: 0.9,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  },
  descEmpty: { marginTop: 8, fontSize: 13, opacity: 0.55 },
  footer: { marginTop: 10 },
  actions: {
    marginTop: 10,
    display: "flex",
    gap: "var(--location-card-actions-gap, 8px)",
    flexWrap: "wrap",
  },
};
