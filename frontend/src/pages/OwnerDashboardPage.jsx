import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import { getStoredUser } from "../auth/auth";
import { Link } from "react-router-dom";
import { useI18n } from "../client/i18n/I18nContext";

import CreateLocationForm from "../components/owner/CreateLocationForm";
import MyLocationsList from "../components/owner/MyLocationsList";
import { getErrorMessage } from "../api/getErrorMessage";

const LIMIT = 12;

export default function OwnerDashboardPage() {
  const user = getStoredUser();
  const { t } = useI18n();

  const [activeTab, setActiveTab] = useState("LIST"); // LIST | CREATE

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / LIMIT)),
    [total],
  );

  const [editingId, setEditingId] = useState(null);

  async function loadMyLocations(pageArg = page) {
    const res = await http.get("/owner/locations", {
      params: { page: pageArg, limit: LIMIT },
    });

    if (res.data && Array.isArray(res.data.items)) {
      setItems(res.data.items);
      setTotal(res.data.total || 0);
      return;
    }

    const arr = res.data.items || res.data || [];
    setItems(arr);
    setTotal(Array.isArray(arr) ? arr.length : 0);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        setEditingId(null);
        setPage(1);
        await loadMyLocations(1);
      } catch (err) {
        console.error(err);
        if (!cancelled)
          setError(getErrorMessage(err, "Failed to load owner locations"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      await loadMyLocations(page);
    } catch (e) {
      setError(getErrorMessage(e, "Failed to load owner locations"));
    } finally {
      setLoading(false);
    }
  }

  async function onCreate(payload) {
    const safePayload = { ...payload };

    try {
      setError("");
      await http.post("/locations", safePayload);
      setActiveTab("LIST");
      await refresh();
    } catch (e) {
      // keep user on CREATE, show error
      setError(getErrorMessage(e, "Failed to create location"));
      throw e; // let CreateLocationForm show it too if it wants
    }
  }

  function startEdit(loc) {
    setEditingId(loc.id);
    setActiveTab("LIST");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function onSaveEdit(id, payload) {
    try {
      setError("");
      await http.patch(`/owner/locations/${id}`, payload);
      await refresh();
      setEditingId(null);
    } catch (e) {
      setError(getErrorMessage(e, "Failed to update location"));
      throw e; // let EditLocationForm show it too
    }
  }

  async function onToggleHidden(loc) {
    try {
      setError("");
      const path =
        loc.status === "HIDDEN"
          ? `/owner/locations/${loc.id}/unhide`
          : `/owner/locations/${loc.id}/hide`;

      await http.post(path);
      await refresh();
    } catch (e) {
      console.error(e);
      setError(getErrorMessage(e, "Failed to update status"));
    }
  }

  async function goNext() {
    const next = page + 1;
    setPage(next);
    setLoading(true);
    setError("");
    setEditingId(null);

    try {
      await loadMyLocations(next);
    } catch (e) {
      setError(getErrorMessage(e, "Failed to load owner locations"));
    } finally {
      setLoading(false);
    }
  }

  async function goPrev() {
    const prev = page - 1;
    setPage(prev);
    setLoading(true);
    setError("");
    setEditingId(null);

    try {
      await loadMyLocations(prev);
    } catch (e) {
      setError(getErrorMessage(e, "Failed to load owner locations"));
    } finally {
      setLoading(false);
    }
  }

  if (!user) return <div style={{ padding: 16 }}>Please login.</div>;
  if (user.role !== "OWNER")
    return <div style={{ padding: 16 }}>Owner only.</div>;

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <div style={{ marginBottom: 10 }}>
        <Link to="/">{t("owner.back")}</Link>
      </div>

      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>{t("owner.title")}</h2>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
            {t("owner.summary.totalLabel")} {total} |{" "}
            {t("owner.summary.pageLabel")} {page} {t("owner.summary.ofLabel")}{" "}
            {totalPages}
          </div>
        </div>

        <button onClick={refresh} disabled={loading}>
          {t("owner.refresh")}
        </button>
      </div>

      {error ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: "1px solid #f2b5b5",
            background: "#fff0f0",
            borderRadius: 12,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("LIST")}
          style={{
            ...styles.tabBtn,
            ...(activeTab === "LIST" ? styles.tabBtnActive : null),
          }}
        >
          {t("owner.tabs.list")}
        </button>

        <button
          onClick={() => setActiveTab("CREATE")}
          style={{
            ...styles.tabBtn,
            ...(activeTab === "CREATE" ? styles.tabBtnActive : null),
          }}
        >
          {t("owner.tabs.create")}
        </button>
      </div>

      {activeTab === "CREATE" ? (
        <CreateLocationForm
          onCreate={onCreate}
          onCancel={() => setActiveTab("LIST")}
        />
      ) : (
        <MyLocationsList
          items={items}
          loading={loading}
          error={error}
          page={page}
          total={total}
          totalPages={totalPages}
          onPrev={goPrev}
          onNext={goNext}
          onRefresh={refresh}
          editingId={editingId}
          onStartEdit={startEdit}
          onCancelEdit={cancelEdit}
          onSaveEdit={onSaveEdit}
          onToggleHidden={onToggleHidden}
        />
      )}
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
};
