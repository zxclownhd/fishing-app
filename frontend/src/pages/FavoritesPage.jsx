import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import { Link, Navigate } from "react-router-dom";
import { getStoredUser } from "../auth/auth";
import LocationCard from "../components/LocationCard";
import { getErrorMessage } from "../api/getErrorMessage";
import { useI18n } from "../client/i18n/I18nContext";
import "./FavoritesPage.css";

const LIMIT = 6;

export default function FavoritesPage() {
  const user = getStoredUser();
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
      const rawItems = Array.isArray(res.data?.items) ? res.data.items : [];
      const normalizedItems = await normalizeAndHydrateFavorites(rawItems);
      setItems(normalizedItems);
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
        <div className="favorites-page__top">
          <div className="favorites-page__back-row">
            <Link to="/" className="btn btn-secondary favorites-page__back-btn">
              {t("profile.back")}
            </Link>
          </div>
        </div>

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
          <div className="grid favorites-page__cards">
            {items.map((it) => (
              <LocationCard
                key={it.id || it.locationId}
                loc={it}
                to={`/locations/${it.locationId || it.id}`}
                toState={{ from: "/favorites" }}
                variant="public"
                compactFishLabelMode="locale-smart"
                actions={
                  <button
                    type="button"
                    title={t("favoritesPage.remove")}
                    aria-label={t("favoritesPage.remove")}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeFavorite(it.locationId || it.id);
                    }}
                    disabled={loading}
                    className="btn btn-secondary home-page__favorite-btn favorites-page__remove-btn"
                  >
                    {"\u2715"}
                  </button>
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

async function normalizeAndHydrateFavorites(rawItems) {
  const normalized = rawItems
    .map((raw) => normalizeFavoriteItem(raw))
    .filter((item) => Boolean(item?.id || item?.locationId));

  const hydrated = await Promise.all(
    normalized.map(async (item) => {
      if (!needsLocationHydration(item)) return item;
      try {
        const locationId = item.locationId || item.id;
        const res = await http.get(`/locations/${locationId}`);
        const details = extractLocationCandidate(res?.data);
        return mergeLocationData(item, details);
      } catch {
        return item;
      }
    }),
  );

  return hydrated;
}

function normalizeFavoriteItem(raw) {
  const direct = extractLocationCandidate(raw);
  const nested = extractLocationCandidate(
    raw?.location || raw?.locationData || raw?.item || raw?.loc,
  );

  const merged = mergeLocationData(direct, nested);
  const locationId =
    raw?.locationId ||
    nested?.id ||
    direct?.id ||
    raw?.location?.id ||
    null;

  return {
    ...merged,
    id: locationId || merged.id || raw?.id || null,
    locationId: locationId || merged.id || raw?.id || null,
  };
}

function extractLocationCandidate(value) {
  if (!value || typeof value !== "object") return {};
  if (value.item && typeof value.item === "object") return value.item;
  if (value.location && typeof value.location === "object") return value.location;
  return value;
}

function mergeLocationData(primary, secondary) {
  const first = primary && typeof primary === "object" ? primary : {};
  const second = secondary && typeof secondary === "object" ? secondary : {};

  return {
    ...first,
    ...second,
    id: second.id || first.id || null,
    photos: pickArray(second.photos, first.photos),
    fish: pickArray(second.fish, first.fish),
    seasons: pickArray(second.seasons, first.seasons),
  };
}

function pickArray(preferred, fallback) {
  if (Array.isArray(preferred)) return preferred;
  if (Array.isArray(fallback)) return fallback;
  return [];
}

function needsLocationHydration(item) {
  const hasMeta = Boolean(item?.region && item?.waterType);
  const hasContent = Boolean(item?.title) && Array.isArray(item?.photos);
  const hasCardData =
    Array.isArray(item?.fish) &&
    Array.isArray(item?.seasons) &&
    item?.avgRating !== undefined &&
    item?.reviewsCount !== undefined;
  return !(hasMeta && hasContent && hasCardData);
}
