import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import { Navigate, useNavigate } from "react-router-dom";
import { getStoredUser } from "../auth/auth";
import LocationCard from "../components/LocationCard";

const LIMIT = 20;

export default function FavoritesPage() {
  const user = getStoredUser();
  const nav = useNavigate();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / LIMIT)),
    [total],
  );

  async function load(pageArg = page) {
    setLoading(true);
    setErrorText("");
    try {
      const res = await http.get("/favorites", {
        params: { page: pageArg, limit: LIMIT },
      });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      setErrorText("Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function removeFavorite(id) {
    setErrorText("");
    try {
      const res = await http.delete(`/favorites/${id}`);
      const removed = !!res.data?.removed;

      if (removed) {
        setItems((prev) => prev.filter((x) => x.id !== id));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } catch {
      setErrorText("Remove failed");
    }
  }

  useEffect(() => {
    if (!user) return;
    load(1);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function goNext() {
    const next = page + 1;
    setPage(next);
    load(next);
  }

  function goPrev() {
    const prev = page - 1;
    setPage(prev);
    load(prev);
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>Favorites</h2>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
            Total: {total} | Page {page} of {totalPages}
          </div>
        </div>

        <button onClick={() => load(page)} disabled={loading}>
          Refresh
        </button>
      </div>

      {errorText ? (
        <div style={styles.error}>
          <div>{errorText}</div>
          <button
            onClick={() => load(page)}
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading ? <div style={{ padding: 12 }}>Loading...</div> : null}

      {!loading && !errorText && items.length === 0 ? (
        <div style={styles.empty}>No favorites yet</div>
      ) : null}

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {items.map((it) => (
          <LocationCard
            key={it.id}
            loc={it}
            variant="admin"
            actions={
              <>
                <button
                  type="button"
                  onClick={() => nav(`/locations/${it.id}`)}
                >
                  Details
                </button>

                <button
                  type="button"
                  onClick={() => removeFavorite(it.id)}
                  disabled={loading}
                >
                  Remove
                </button>
              </>
            }
          />
        ))}
      </div>

      <div style={styles.pagination}>
        <button onClick={goPrev} disabled={loading || page === 1}>
          Prev
        </button>

        <div style={{ opacity: 0.8 }}>
          Page {page} / {totalPages}
        </div>

        <button onClick={goNext} disabled={loading || page >= totalPages}>
          Next
        </button>
      </div>
    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    position: "sticky",
    top: 0,
    background: "#fff",
    padding: "12px 0",
    zIndex: 2,
  },
  pagination: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTop: "1px solid #eee",
  },
  empty: {
    padding: 12,
    opacity: 0.75,
  },
  error: {
    marginTop: 12,
    padding: 12,
    border: "1px solid #f2b5b5",
    background: "#fff0f0",
    borderRadius: 12,
  },
};
