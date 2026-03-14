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

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M20 14.3A8.6 8.6 0 1 1 9.7 4a7 7 0 1 0 10.3 10.3Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function App() {
  const nav = useNavigate();
  const [user, setUser] = useState(getStoredUser());
  const [theme, setTheme] = useState(() => {
    if (typeof document === "undefined") return "light";
    return document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";
  });

  const { locale, setLocale, t } = useI18n();

  const roleLabel = user?.role ? t(`roles.${user.role}`, user.role) : "";

  useEffect(() => {
    function onAuthChanged() {
      setUser(getStoredUser());
    }
    window.addEventListener("authChanged", onAuthChanged);
    return () => window.removeEventListener("authChanged", onAuthChanged);
  }, []);

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.setAttribute("data-theme", "dark");
      return;
    }
    document.documentElement.removeAttribute("data-theme");
  }, [theme]);

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

          <div
            className="app-nav__theme-toggle"
            role="group"
            aria-label={t("nav.theme", "Theme")}
          >
            <button
              type="button"
              className={`app-nav__theme-button${
                theme === "light" ? " app-nav__theme-button--active" : ""
              }`}
              onClick={() => setTheme("light")}
              aria-pressed={theme === "light"}
              title={t("nav.themeLight", "Light theme")}
            >
              <SunIcon />
            </button>
            <button
              type="button"
              className={`app-nav__theme-button${
                theme === "dark" ? " app-nav__theme-button--active" : ""
              }`}
              onClick={() => setTheme("dark")}
              aria-pressed={theme === "dark"}
              title={t("nav.themeDark", "Dark theme")}
            >
              <MoonIcon />
            </button>
          </div>

          {user ? (
            <>
              <span className="app-nav__role-badge">{roleLabel}</span>
              <button onClick={logout} className="app-nav__logout">
                {t("nav.logout")}
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `app-nav__auth-link${isActive ? " app-nav__auth-link--active" : ""}`
                }
              >
                {t("nav.login")}
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `app-nav__auth-link${isActive ? " app-nav__auth-link--active" : ""}`
                }
              >
                {t("nav.register")}
              </NavLink>
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

