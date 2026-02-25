import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import { Navigate } from "react-router-dom";
import { getStoredUser } from "../auth/auth";
import LocationCard from "../components/LocationCard";

const LIMIT = 20;

export default function AdminDashboardPage() {
  const user = getStoredUser();

  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / LIMIT)), [total]);

  async function loadLocations(pageArg = page, statusArg = status) {
    setLoading(true);
    setErrorText("");
    try {
      await http.get("/health");
      const res = await http.get("/admin/locations", {
        params: { status: statusArg, page: pageArg, limit: LIMIT },
      });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch {
      setErrorText("Request failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user || user.role !== "ADMIN") return;
    loadLocations(1, status);
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  function goNext() {
    const next = page + 1;
    setPage(next);
    loadLocations(next, status);
  }

  function goPrev() {
    const prev = page - 1;
    setPage(prev);
    loadLocations(prev, status);
  }

  async function changeStatus(id, action) {
    setErrorText("");
    try {
      await http.patch(`/admin/locations/${id}/${action}`);
      await loadLocations(page, status);
    } catch {
      setErrorText("Request failed");
    }
  }

  function canDelete(it) {
    return it.status === "PENDING" || it.status === "REJECTED" || it.status === "HIDDEN";
  }

  async function deleteLocation(it) {
    if (!canDelete(it)) return;

    const ok = window.confirm(
      `Delete permanently?\n\nTitle: ${it.title || "(no title)"}\nStatus: ${it.status}\n\nThis will remove photos and related records.`
    );
    if (!ok) return;

    setErrorText("");
    try {
      await http.delete(`/admin/locations/${it.id}`);
      // if we deleted the last item on the page, try to go back one page
      const willBeEmpty = items.length === 1;
      const newPage = willBeEmpty && page > 1 ? page - 1 : page;
      setPage(newPage);
      await loadLocations(newPage, status);
    } catch {
      setErrorText("Delete failed");
    }
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "ADMIN") return <Navigate to="/" replace />;

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>Moderation</h2>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
            Total: {total} | Page {page} of {totalPages}
          </div>
        </div>

        <button onClick={() => loadLocations(page, status)} disabled={loading}>
          Refresh
        </button>
      </div>

      <div style={styles.tabs}>
        {["PENDING", "APPROVED", "REJECTED", "HIDDEN"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            style={{ ...styles.tabBtn, ...(status === s ? styles.tabBtnActive : null) }}
            disabled={loading && status === s}
          >
            {s}
          </button>
        ))}
      </div>

      {errorText ? (
        <div style={styles.error}>
          <div>{errorText}</div>
          <button onClick={() => loadLocations(page, status)} disabled={loading} style={{ marginTop: 8 }}>
            Retry
          </button>
        </div>
      ) : null}

      {loading ? <div style={{ padding: 12 }}>Loading...</div> : null}

      {!loading && !errorText && items.length === 0 ? (
        <div style={styles.empty}>No items in {status}</div>
      ) : null}

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {items.map((it) => (
          <LocationCard
            key={it.id}
            loc={it}
            variant="admin"
            footer={
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(it.fish || []).slice(0, 8).map((x) => (
                  <span key={x.id} style={styles.chip}>
                    {x.fish?.name || "fish"}
                  </span>
                ))}
                {(it.seasons || []).slice(0, 8).map((x) => (
                  <span key={x.id} style={styles.chip}>
                    {x.season?.name || "season"}
                  </span>
                ))}
              </div>
            }
            actions={
              <>
                <button
                  onClick={() => changeStatus(it.id, "approve")}
                  disabled={loading || it.status === "APPROVED" || status !== "PENDING"}
                  title={status !== "PENDING" ? "Approve is for Pending only" : ""}
                >
                  Approve
                </button>

                <button
                  onClick={() => changeStatus(it.id, "reject")}
                  disabled={loading || it.status === "REJECTED" || status !== "PENDING"}
                  title={status !== "PENDING" ? "Reject is for Pending only" : ""}
                >
                  Reject
                </button>

                <button
                  onClick={() => changeStatus(it.id, "hide")}
                  disabled={loading || it.status === "HIDDEN"}
                >
                  Hide
                </button>

                <button
                  onClick={() => deleteLocation(it)}
                  disabled={loading || !canDelete(it)}
                  title={!canDelete(it) ? "Approved items can only be hidden" : "Delete permanently"}
                  style={canDelete(it) ? styles.dangerBtn : null}
                >
                  Delete
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
  tabs: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 8,
  },
  tabBtn: {
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
  },
  tabBtnActive: {
    borderColor: "#111",
  },
  chip: {
    fontSize: 12,
    padding: "2px 8px",
    border: "1px solid #eee",
    borderRadius: 999,
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
  dangerBtn: {
    borderColor: "#f2b5b5",
  },
};