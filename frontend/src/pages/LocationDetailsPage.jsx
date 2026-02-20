import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../api/http";
import { getStoredUser } from "../auth/auth";

export default function LocationDetailsPage() {
  const { id } = useParams();

  const [user, setUser] = useState(getStoredUser());

  const [contactInfo, setContactInfo] = useState(null);

  const [location, setLocation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        if (!cancelled) setError("Failed to load location details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [loadAll]);

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
      } catch {
        if (!cancelled) setContactInfo(null);
      }
    }

    loadContacts();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

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
      const msg = err?.response?.data?.error || "Failed to submit review";
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (error)
    return <div style={{ padding: 16, color: "crimson" }}>{error}</div>;
  if (!location) return <div style={{ padding: 16 }}>Not found</div>;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <Link to="/">← Back</Link>
      </div>

      <h1 style={{ marginBottom: 4 }}>{location.title}</h1>
      <div style={{ opacity: 0.8 }}>
        {location.region} • {location.waterType}
      </div>

      <div style={{ marginTop: 8 }}>
        Rating: {location.avgRating ?? "—"} ({location.reviewsCount ?? 0})
      </div>

      <div style={{ marginTop: 12 }}>
        <h3>Description</h3>
        <div>{location.description}</div>
      </div>

      {(location.photos || []).length > 0 && (
        <div style={{ marginTop: 12 }}>
          <h3>Photos</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {location.photos.map((p) => (
              <img
                key={p.id}
                src={p.url}
                alt=""
                style={{ width: "100%", maxWidth: 760, borderRadius: 10 }}
              />
            ))}
          </div>
        </div>
      )}

      {user ? (
        contactInfo ? (
          <div style={{ marginTop: 12 }}>
            <h3>Contacts</h3>
            <div style={{ whiteSpace: "pre-wrap" }}>{contactInfo}</div>
          </div>
        ) : null
      ) : (
        <div style={{ marginTop: 12, opacity: 0.8 }}>
          <strong>Contacts:</strong> Login to see owner contacts.
        </div>
      )}

      <div style={{ marginTop: 12 }}>
        <h3>Fish</h3>
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
              {f.fish?.name}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <h3>Seasons</h3>
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
              {s.season?.code}
            </span>
          ))}
        </div>
      </div>

      {/* Add review */}
      <div style={{ marginTop: 18 }}>
        <h2>Leave a review</h2>

        {!user ? (
          <div style={{ opacity: 0.8 }}>Please login to leave a review.</div>
        ) : (
          <form
            onSubmit={submitReview}
            style={{ display: "grid", gap: 10, maxWidth: 520 }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <span>Rating</span>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
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
              <span>Comment</span>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Write your review..."
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
              {submitting ? "Submitting..." : "Submit review"}
            </button>

            {formError && <div style={{ color: "crimson" }}>{formError}</div>}
          </form>
        )}
      </div>

      {/* Reviews list */}
      <div style={{ marginTop: 18 }}>
        <h2>Reviews</h2>

        {reviews.length === 0 && (
          <div style={{ opacity: 0.7 }}>No reviews yet.</div>
        )}

        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {reviews.map((r) => (
            <div
              key={r.id}
              style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}
            >
              <div style={{ fontWeight: 700 }}>
                {r.user?.displayName ?? "Anonymous"} • {r.rating}/5
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
