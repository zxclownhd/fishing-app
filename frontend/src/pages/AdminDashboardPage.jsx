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

  const [expandedId, setExpandedId] = useState(null);
  const [detailsById, setDetailsById] = useState({});
  const [detailsLoadingId, setDetailsLoadingId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / LIMIT)),
    [total],
  );

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
    setExpandedId(null);
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

  async function setStatusForLocation(id, nextStatus) {
    setErrorText("");
    try {
      await http.patch(`/admin/locations/${id}/status`, { status: nextStatus });
      await loadLocations(page, status);
    } catch {
      setErrorText("Request failed");
    }
  }

  async function toggleDetails(id) {
    setErrorText("");

    // toggle open/close
    setExpandedId((prev) => (prev === id ? null : id));

    // if we already have full details cached, nothing else to do
    if (detailsById[id]) return;

    // fetch full details (includes ALL photos)
    setDetailsLoadingId(id);
    try {
      const res = await http.get(`/admin/locations/${id}`);
      const item = res.data.item;
      setDetailsById((prev) => ({ ...prev, [id]: item }));
    } catch {
      setErrorText("Failed to load details");
    } finally {
      setDetailsLoadingId(null);
    }
  }

  function canDelete(it) {
    return it.status === "HIDDEN";
  }

  async function deleteLocation(it) {
    if (!canDelete(it)) return;

    const ok = window.confirm(
      `Delete permanently?\n\nTitle: ${it.title || "(no title)"}\nStatus: ${it.status}\n\nThis will remove photos and related records.`,
    );
    if (!ok) return;

    setErrorText("");
    try {
      await http.delete(`/admin/locations/${it.id}`);
      const willBeEmpty = items.length === 1;
      const newPage = willBeEmpty && page > 1 ? page - 1 : page;
      setPage(newPage);
      setExpandedId(null);
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
            style={{
              ...styles.tabBtn,
              ...(status === s ? styles.tabBtnActive : null),
            }}
            disabled={loading && status === s}
          >
            {s}
          </button>
        ))}
      </div>

      {errorText ? (
        <div style={styles.error}>
          <div>{errorText}</div>
          <button
            onClick={() => loadLocations(page, status)}
            disabled={loading}
            style={{ marginTop: 8 }}
          >
            Retry
          </button>
        </div>
      ) : null}

      {loading ? <div style={{ padding: 12 }}>Loading...</div> : null}

      {!loading && !errorText && items.length === 0 ? (
        <div style={styles.empty}>No items in {status}</div>
      ) : null}

      <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
        {items.map((it) => {
          const full = detailsById[it.id];
          const isExpanded = expandedId === it.id;

          const desc = full?.description ?? it.description;
          const contacts = full?.contactInfo ?? it.contactInfo;

          // In list: it.photos is take:1
          // In details: full.photos is all
          const photos = isExpanded
            ? (full?.photos ?? it.photos ?? [])
            : (it.photos ?? []);

          return (
            <LocationCard
              key={it.id}
              loc={it}
              variant="admin"
              footer={
                <div style={{ display: "grid", gap: 10 }}>
                  <div style={styles.group}>
                    <div style={styles.groupLabel}>Fish</div>
                    <div style={styles.groupChips}>
                      {(it.fish || []).slice(0, 8).map((x, idx) => (
                        <span
                          key={
                            x.fishId
                              ? `${it.id}-fish-${x.fishId}`
                              : `${it.id}-fish-${idx}`
                          }
                          style={styles.chip}
                        >
                          {x.fish?.name || "fish"}
                        </span>
                      ))}
                      {!it.fish || it.fish.length === 0 ? (
                        <span style={styles.emptyDash}>—</span>
                      ) : null}
                    </div>
                  </div>

                  <div style={styles.group}>
                    <div style={styles.groupLabel}>Seasons</div>
                    <div style={styles.groupChips}>
                      {(it.seasons || []).slice(0, 8).map((x, idx) => (
                        <span
                          key={
                            x.seasonId
                              ? `${it.id}-season-${x.seasonId}`
                              : `${it.id}-season-${idx}`
                          }
                          style={styles.chip}
                        >
                          {x.season?.name || x.season?.code || "season"}
                        </span>
                      ))}
                      {!it.seasons || it.seasons.length === 0 ? (
                        <span style={styles.emptyDash}>—</span>
                      ) : null}
                    </div>
                  </div>

                  {expandedId === it.id ? (
                    <div style={styles.detailsBox}>
                      <div style={styles.detailsLabel}>Description</div>
                      <div style={styles.detailsText}>{desc || "—"}</div>

                      {contacts ? (
                        <div style={{ marginTop: 10 }}>
                          <div style={styles.detailsLabel}>Contacts</div>
                          <div style={styles.detailsText}>{contacts}</div>
                        </div>
                      ) : null}

                      <div style={{ marginTop: 10 }}>
                        <div style={styles.detailsLabel}>Photos</div>
                        {detailsLoadingId === it.id ? (
                          <div style={{ opacity: 0.75 }}>Loading photos...</div>
                        ) : photos && photos.length ? (
                          <div style={{ display: "grid", gap: 8 }}>
                            {photos.map((p, idx) => (
                              <img
                                key={p.id ? `p-${p.id}` : `p-${idx}`}
                                src={p.url}
                                alt=""
                                style={styles.detailsImg}
                              />
                            ))}
                          </div>
                        ) : (
                          <div style={{ opacity: 0.75 }}>No photos</div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              }
              actions={
                <>
                  <button
                    type="button"
                    onClick={() => toggleDetails(it.id)}
                    disabled={loading}
                  >
                    {isExpanded ? "Close" : "Details"}
                  </button>

                  <button
                    onClick={() => setStatusForLocation(it.id, "APPROVED")}
                    disabled={loading || it.status === "APPROVED"}
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => setStatusForLocation(it.id, "REJECTED")}
                    disabled={loading || it.status === "REJECTED"}
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => setStatusForLocation(it.id, "HIDDEN")}
                    disabled={loading || it.status === "HIDDEN"}
                  >
                    Hide
                  </button>

                  <button
                    onClick={() => deleteLocation(it)}
                    disabled={loading || !canDelete(it)}
                    title={
                      !canDelete(it)
                        ? "Delete is allowed only for HIDDEN"
                        : "Delete permanently"
                    }
                    style={canDelete(it) ? styles.dangerBtn : null}
                  >
                    Delete
                  </button>
                </>
              }
            />
          );
        })}
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
    borderWidth: 1,
    borderStyle: "solid",
    borderColor: "#ddd",
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
  detailsBox: {
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 12,
    background: "#fafafa",
  },
  detailsLabel: {
    fontSize: 13,
    opacity: 0.75,
    marginBottom: 6,
  },
  detailsText: {
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  detailsImg: {
    width: "100%",
    maxWidth: 640,
    borderRadius: 10,
    border: "1px solid #eee",
  },
  group: {
    display: "grid",
    gap: 6,
  },
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
  emptyDash: {
    opacity: 0.6,
    fontSize: 13,
  },
};
