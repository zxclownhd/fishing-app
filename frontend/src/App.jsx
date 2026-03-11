import { Routes, Route, Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useI18n } from "./client/i18n/I18nContext";
import "./AppLayout.css";

import HomePage from "./pages/HomePage";
import LocationDetailsPage from "./pages/LocationDetailsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ProfilePage from "./pages/ProfilePage";
import FavoritesPage from "./pages/FavoritesPage";

import { clearAuth, getStoredUser } from "./auth/auth";

export default function App() {
  const nav = useNavigate();
  const [user, setUser] = useState(getStoredUser());

  const { locale, setLocale, t } = useI18n();

  const userLabel = user?.displayName?.trim()
    ? user.displayName.trim()
    : user?.email || "";

  const roleLabel = user?.role ? t(`roles.${user.role}`, user.role) : "";

  useEffect(() => {
    function onAuthChanged() {
      setUser(getStoredUser());
    }
    window.addEventListener("authChanged", onAuthChanged);
    return () => window.removeEventListener("authChanged", onAuthChanged);
  }, []);

  function logout() {
    clearAuth();
    window.dispatchEvent(new Event("authChanged"));
    nav("/");
  }

  return (
    <div className="app-layout">
      <nav className="app-nav">
        <div className="app-nav__links">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `app-nav__link${isActive ? " app-nav__link--active" : ""}`
            }
          >
            {t("nav.home")}
          </NavLink>

          {user && (
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `app-nav__link${isActive ? " app-nav__link--active" : ""}`
              }
            >
              {t("nav.profile")}
            </NavLink>
          )}
          {user?.role === "OWNER" && (
            <NavLink
              to="/owner"
              className={({ isActive }) =>
                `app-nav__link${isActive ? " app-nav__link--active" : ""}`
              }
            >
              {t("nav.owner")}
            </NavLink>
          )}
          {user?.role === "ADMIN" && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `app-nav__link${isActive ? " app-nav__link--active" : ""}`
              }
            >
              {t("nav.admin")}
            </NavLink>
          )}

          {(user?.role === "OWNER" || user?.role === "USER") && (
            <NavLink
              to="/favorites"
              className={({ isActive }) =>
                `app-nav__link${isActive ? " app-nav__link--active" : ""}`
              }
            >
              {t("nav.favorites")}
            </NavLink>
          )}
        </div>

        <div className="app-nav__actions">
          <div
            className="app-nav__language-toggle"
            role="group"
            aria-label={t("nav.language", "Language")}
          >
            <button
              type="button"
              className={`app-nav__language-button${
                locale === "en" ? " app-nav__language-button--active" : ""
              }`}
              onClick={() => setLocale("en")}
              aria-pressed={locale === "en"}
            >
              EN
            </button>
            <button
              type="button"
              className={`app-nav__language-button${
                locale === "uk" ? " app-nav__language-button--active" : ""
              }`}
              onClick={() => setLocale("uk")}
              aria-pressed={locale === "uk"}
            >
              УКР
            </button>
          </div>

          {user ? (
            <>
              <span className="app-nav__user-name">{userLabel}</span>
              <span className="app-nav__role-badge">{roleLabel}</span>
              <button onClick={logout} className="app-nav__logout">
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <Link to="/login">{t("nav.login")}</Link>
              <Link to="/register">{t("nav.register")}</Link>
            </>
          )}
        </div>
      </nav>

      <main className="app-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/locations/:id" element={<LocationDetailsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/owner" element={<OwnerDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
        </Routes>
      </main>

      <footer className="app-footer">{t("footer.rights")}</footer>
    </div>
  );
}
