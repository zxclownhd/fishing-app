// src/client/components/LocationCard.jsx
import { Link } from "react-router-dom";
import { useMemo } from "react";

export default function LocationCard({
  loc,
  to,                 // optional string; if present - wrap in Link
  variant = "public", // "public" | "admin"
  actions = null,     // optional JSX (buttons etc)
  footer = null,      // optional JSX under description
  onClick,            // optional click handler when NOT using `to`
}) {
  const photoUrl = loc?.photos?.[0]?.url || null;

  const ratingText = useMemo(() => {
    if (variant !== "public") return null;
    const avg = Number(loc?.avgRating ?? 0);
    const cnt = Number(loc?.reviewsCount ?? 0);
    if (!cnt) return "No reviews yet";
    return `${avg.toFixed(1)} / 5 (${cnt})`;
  }, [variant, loc]);

  const status = loc?.status;
  const owner = loc?.owner;

  const card = (
    <div
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
          <img alt={loc?.title || "Location"} src={photoUrl} style={styles.img} />
        ) : (
          <div style={styles.noImg}>No photo</div>
        )}
      </div>

      <div style={styles.body}>
        <div style={styles.topRow}>
          <div style={styles.title}>{loc?.title || "(no title)"}</div>

          {variant === "admin" && status ? (
            <span style={{ ...styles.badge, ...badgeForStatus(status) }}>{status}</span>
          ) : null}
        </div>

        <div style={styles.meta}>
          <span style={styles.metaItem}>{loc?.region || "Unknown region"}</span>
          <span style={styles.dot}>•</span>
          <span style={styles.metaItem}>{loc?.waterType || "Unknown type"}</span>
        </div>

        {variant === "admin" ? (
          <div style={styles.adminMeta}>
            {owner?.email ? <div style={styles.adminLine}>Owner: {owner.email}</div> : null}
            {loc?.createdAt ? (
              <div style={styles.adminLine}>Created: {new Date(loc.createdAt).toLocaleString()}</div>
            ) : null}
          </div>
        ) : (
          <div style={styles.rating}>{ratingText}</div>
        )}

        {loc?.description ? (
          <div style={styles.desc}>{loc.description}</div>
        ) : (
          <div style={styles.descEmpty}>No description</div>
        )}

        {footer ? <div style={styles.footer}>{footer}</div> : null}

        {actions ? (
          <div style={styles.actions} onClick={(e) => e.stopPropagation()}>
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
  if (s === "APPROVED") return { background: "#DFF7E6", borderColor: "#7FD39A" };
  if (s === "REJECTED") return { background: "#FFE1E1", borderColor: "#F09A9A" };
  if (s === "HIDDEN") return { background: "#EEEEEE", borderColor: "#CFCFCF" };
  return { background: "#EEEEEE", borderColor: "#CFCFCF" };
}

const styles = {
  card: {
    display: "flex",
    gap: 12,
    padding: 12,
    border: "1px solid #e6e6e6",
    borderRadius: 12,
    background: "#fff",
    cursor: "pointer",
  },
  media: {
    width: 140,
    minWidth: 140,
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
  topRow: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 },
  title: { fontSize: 16, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  badge: {
    fontSize: 12,
    padding: "2px 8px",
    borderRadius: 999,
    border: "1px solid #ddd",
    whiteSpace: "nowrap",
  },
  meta: { marginTop: 4, fontSize: 13, opacity: 0.8, display: "flex", alignItems: "center", gap: 6 },
  metaItem: { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  dot: { opacity: 0.6 },
  rating: { marginTop: 6, fontSize: 13, opacity: 0.8 },
  adminMeta: { marginTop: 6, fontSize: 12, opacity: 0.8, display: "flex", gap: 12, flexWrap: "wrap" },
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
  actions: { marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" },
};