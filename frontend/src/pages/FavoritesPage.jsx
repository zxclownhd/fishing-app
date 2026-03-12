import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import { Navigate, useNavigate } from "react-router-dom";
import { getStoredUser } from "../auth/auth";
import LocationCard from "../components/LocationCard";
import { getErrorMessage } from "../api/getErrorMessage";
import { useI18n } from "../client/i18n/I18nContext";
import "./FavoritesPage.css";

const LIMIT = 6;

export default function FavoritesPage() {
  const user = getStoredUser();
  const nav = useNavigate();
  const { t } = useI18n();

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / LIMIT)),
    [total],
  );
  const canPrev = page > 1;
  const canNext = page < totalPages;

  async function load(pageArg = page) {
    setLoading(true);
    setErrorText("");
    try {
      const res = await http.get("/favorites", {
        params: { page: pageArg, limit: LIMIT },
      });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      setErrorText(getErrorMessage(e, t("errors.favorites.loadFailed"), t));
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
    } catch (e) {
      setErrorText(getErrorMessage(e, t("errors.favorites.removeFailed"), t));
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
    <div className="page favorites-page">
      <div className="container favorites-page__container">
        <header className="favorites-page__header">
          <h1 className="page-title favorites-page__title">
            {t("favoritesPage.title")}
          </h1>
          <div className="text-muted favorites-page__meta">
            {t("favoritesPage.summary.totalLabel")} {total}
          </div>
        </header>

        {errorText ? (
          <div className="favorites-page__error">
            <div>{errorText}</div>
            <button
              onClick={() => load(page)}
              disabled={loading}
              className="btn btn-secondary favorites-page__retry-btn"
            >
              {t("favoritesPage.retry")}
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="text-muted favorites-page__state">{t("common.loading")}</div>
        ) : null}

        {!loading && !errorText && items.length === 0 ? (
          <div className="text-muted favorites-page__state">
            {t("favoritesPage.empty")}
          </div>
        ) : null}

        <section className="favorites-page__results">
          <div className="favorites-page__cards">
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
                      className="btn btn-secondary"
                    >
                      {t("favoritesPage.details")}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeFavorite(it.id)}
                      disabled={loading}
                      className="btn btn-secondary"
                    >
                      {t("favoritesPage.remove")}
                    </button>
                  </>
                }
              />
            ))}
          </div>
        </section>

        <div className="pagination favorites-page__pagination">
          <button
            onClick={goPrev}
            disabled={loading || !canPrev}
            className="btn btn-secondary"
          >
            {t("common.prev")}
          </button>

          <div className="text-muted favorites-page__pagination-meta">
            {t("favoritesPage.summary.pageLabel")} {page}{" "}
            {t("favoritesPage.summary.ofLabel")} {totalPages}
          </div>

          <button
            onClick={goNext}
            disabled={loading || !canNext}
            className="btn btn-secondary"
          >
            {t("common.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
