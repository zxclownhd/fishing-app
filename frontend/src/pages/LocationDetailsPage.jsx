import { useEffect, useCallback, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../api/http";
import { getStoredUser } from "../auth/auth";
import { useFavorites } from "../client/hooks/useFavorites";
import { getCloudinaryVariant } from "../utils/cloudinaryUrl";
import { getErrorMessage } from "../api/getErrorMessage";
import { useI18n } from "../client/i18n/I18nContext";
import { displayFishName } from "../client/i18n/displayName";

export default function LocationDetailsPage() {
  const { id } = useParams();
  const { t, locale } = useI18n();

  const [user, setUser] = useState(getStoredUser());
  const [contactInfo, setContactInfo] = useState(null);

  const [location, setLocation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const { canUseFavorites, isFavorite, toggleFavorite } = useFavorites();

  // review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadAll = useCallback(async () => {
    const [locRes, revRes] = await Promise.all([
      http.get(`/locations/${id}`),
      http.get(`/locations/${id}/reviews`),
    ]);
    setLocation(locRes.data);
    setReviews(revRes.data.items || []);
  }, [id]);

  useEffect(() => {
    function onAuthChanged() {
      setUser(getStoredUser());
    }
    window.addEventListener("authChanged", onAuthChanged);
    return () => window.removeEventListener("authChanged", onAuthChanged);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        await loadAll();
      } catch (err) {
        console.error(err);
        if (!cancelled)
          setError(getErrorMessage(err, "Failed to load location details", t));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [loadAll, t]);

  useEffect(() => {
    let cancelled = false;

    async function loadContacts() {
      if (!user) {
        setContactInfo(null);
        return;
      }

      try {
        const res = await http.get(`/locations/${id}/contact`);
        if (!cancelled) setContactInfo(res.data.contactInfo || null);
      } catch (e) {
        console.error(
          "Failed to load contacts:",
          getErrorMessage(e, "locationDetails.errors.loadContactsFailed", t)
        );
        if (!cancelled) setContactInfo(null);
      }
    }

    loadContacts();
    return () => {
      cancelled = true;
    };
  }, [id, user, t]);

  async function submitReview(e) {
    e.preventDefault();
    if (!user) return;

    try {
      setSubmitting(true);
      setFormError("");

      await http.post(`/locations/${id}/reviews`, {
        rating: Number(rating),
        comment: comment.trim(),
      });

      setComment("");
      setRating(5);

      await loadAll();
    } catch (err) {
      console.error(err);
      setFormError(getErrorMessage(err, "locationDetails.errors.submitReviewFailed", t));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ padding: 16 }}>{t("common.loading")}</div>;
  if (error)
    return <div style={{ padding: 16, color: "crimson" }}>{error}</div>;
  if (!location)
    return <div style={{ padding: 16 }}>{t("common.notFound")}</div>;

  const latNum = Number(location.lat);
  const lngNum = Number(location.lng);

  const hasCoords = Number.isFinite(latNum) && Number.isFinite(lngNum);

  const googleMapsUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${latNum},${lngNum}`
    : null;

  const delta = 0.01;
  const left = lngNum - delta;
  const right = lngNum + delta;
  const top = latNum + delta;
  const bottom = latNum - delta;

  const osmEmbedUrl = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${latNum}%2C${lngNum}`
    : null;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/">{t("locationDetails.back")}</Link>
      </div>

      <h1 style={{ marginBottom: 4 }}>{location.title}</h1>

      <div style={{ opacity: 0.8 }}>
        {t(`regions.${location.region}`, location.region)} •{" "}
        {t(`locationForm.waterTypes.${location.waterType}`, location.waterType)}
      </div>

      {canUseFavorites ? (
        <button
          type="button"
          onClick={() => toggleFavorite(location.id)}
          style={{ fontSize: 20, lineHeight: 1 }}
          title={
            isFavorite(location.id)
              ? t("locationDetails.favRemove")
              : t("locationDetails.favAdd")
          }
        >
          {isFavorite(location.id) ? "★" : "☆"}
        </button>
      ) : null}

      <div style={{ opacity: 0.75, marginTop: 6 }}>
        {t("locationDetails.postedBy")}{" "}
        <strong>
          {location.owner?.displayName || t("locationDetails.unknown")}
        </strong>
      </div>

      <div style={{ marginTop: 8 }}>
        {t("locationDetails.ratingLabel")} {location.avgRating ?? "—"} (
        {location.reviewsCount ?? 0})
      </div>

      <div style={{ marginTop: 12 }}>
        <h3>{t("locationDetails.description")}</h3>
        <div>{location.description}</div>
      </div>

      {(location.photos || []).length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h3>{t("locationDetails.photos")}</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {location.photos.map((p) => {
              const bigUrl = getCloudinaryVariant(p.url, {
                w: 1400,
                h: 1000,
                crop: "fit",
              });

              return (
                <img
                  key={p.id}
                  src={bigUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  style={{ width: "100%", maxWidth: 760, borderRadius: 10 }}
                />
              );
            })}
          </div>
        </div>
      )}

      {user ? (
        contactInfo ? (
          <div style={{ marginTop: 12 }}>
            <h3>{t("locationDetails.contacts")}</h3>
            <div style={{ whiteSpace: "pre-wrap" }}>{contactInfo}</div>
          </div>
        ) : null
      ) : (
        <div style={{ marginTop: 12, opacity: 0.8 }}>
          <strong>{t("locationDetails.contacts")}:</strong>{" "}
          {t("locationDetails.contactsLoginHint")}
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <h3>{t("locationDetails.fish")}</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(location.fish || []).map((f) => (
            <span
              key={f.fishId}
              style={{
                border: "1px solid #ddd",
                borderRadius: 999,
                padding: "4px 10px",
              }}
            >
              {displayFishName(f.fish?.name, locale)}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <h3>{t("locationDetails.seasons")}</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(location.seasons || []).map((s) => (
            <span
              key={s.seasonId}
              style={{
                border: "1px solid #ddd",
                borderRadius: 999,
                padding: "4px 10px",
              }}
            >
              {t(`seasons.${s.season?.code}`, s.season?.code || "—")}
            </span>
          ))}
        </div>
      </div>

      {hasCoords && (
        <div style={{ marginTop: 12 }}>
          <h3>{t("locationDetails.map")}</h3>

          <div
            style={{
              borderRadius: 10,
              overflow: "hidden",
              border: "1px solid #ddd",
            }}
          >
            <iframe
              title={t("locationDetails.mapPreviewTitle")}
              src={osmEmbedUrl}
              width="100%"
              height="320"
              style={{ border: 0, display: "block" }}
              loading="lazy"
            />
          </div>

          {googleMapsUrl && (
            <div style={{ marginTop: 8 }}>
              <a href={googleMapsUrl} target="_blank" rel="noreferrer">
                {t("locationDetails.openGoogleMaps")}
              </a>
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: 18 }}>
        <h2>{t("locationDetails.leaveReview")}</h2>

        {!user ? (
          <div style={{ opacity: 0.8 }}>
            {t("locationDetails.loginToReview")}
          </div>
        ) : (
          <form
            onSubmit={submitReview}
            style={{ display: "grid", gap: 10, maxWidth: 520 }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span>{t("locationDetails.form.rating")}</span>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span>{t("locationDetails.form.comment")}</span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder={t("locationDetails.form.commentPlaceholder")}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              />
            </label>

            <button
              disabled={submitting}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            >
              {submitting
                ? t("locationDetails.form.submitting")
                : t("locationDetails.form.submit")}
            </button>

            {formError && <div style={{ color: "crimson" }}>{formError}</div>}
          </form>
        )}
      </div>

      <div style={{ marginTop: 18 }}>
        <h2>{t("locationDetails.reviewsTitle")}</h2>

        {reviews.length === 0 && (
          <div style={{ opacity: 0.7 }}>{t("locationDetails.noReviews")}</div>
        )}

        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {reviews.map((r) => (
            <div
              key={r.id}
              style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}
            >
              <div style={{ fontWeight: 700 }}>
                {r.user?.displayName ?? t("locationDetails.anonymous")} •{" "}
                {r.rating}/5
              </div>
              <div style={{ marginTop: 6 }}>{r.comment}</div>
              <div style={{ marginTop: 6, opacity: 0.6, fontSize: 12 }}>
                {new Date(r.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
