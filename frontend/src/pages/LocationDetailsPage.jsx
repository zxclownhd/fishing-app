import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { http } from "../api/http";

export default function LocationDetailsPage() {
  const { id } = useParams();
  const [location, setLocation] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const [locRes, revRes] = await Promise.all([
          http.get(`/locations/${id}`),
          http.get(`/locations/${id}/reviews`),
        ]);

        if (!cancelled) {
          setLocation(locRes.data);
          setReviews(revRes.data.items || []);
        }
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
  }, [id]);

  if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
  if (error) return <div style={{ padding: 16, color: "crimson" }}>{error}</div>;
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

      <div style={{ marginTop: 12 }}>
        <h3>Fish</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(location.fish || []).map((f) => (
            <span key={f.fishId} style={{ border: "1px solid #ddd", borderRadius: 999, padding: "4px 10px" }}>
              {f.fish?.name}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <h3>Seasons</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(location.seasons || []).map((s) => (
            <span key={s.seasonId} style={{ border: "1px solid #ddd", borderRadius: 999, padding: "4px 10px" }}>
              {s.season?.code}
            </span>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <h2>Reviews</h2>

        {reviews.length === 0 && <div style={{ opacity: 0.7 }}>No reviews yet.</div>}

        <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
          {reviews.map((r) => (
            <div key={r.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
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