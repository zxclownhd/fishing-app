import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useI18n } from "./client/i18n/I18nContext";

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
    <div>
      <nav
        style={{
          padding: 12,
          borderBottom: "1px solid #eee",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <Link to="/" style={{ textDecoration: "none" }}>
          {t("nav.home")}
        </Link>

        {user && <Link to="/profile">{t("nav.profile")}</Link>}
        {user?.role === "OWNER" && <Link to="/owner">{t("nav.owner")}</Link>}
        {user?.role === "ADMIN" && <Link to="/admin">{t("nav.admin")}</Link>}

        {(user?.role === "OWNER" || user?.role === "USER") && (
          <Link to="/favorites">{t("nav.favorites")}</Link>
        )}

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
            aria-label={t("nav.language", "Language")}
            title={t("nav.language", "Language")}
          >
            <option value="en">EN</option>
            <option value="uk">UK</option>
          </select>

          {user ? (
            <>
              <span style={{ opacity: 0.8 }}>
                {userLabel} ({roleLabel})
              </span>
              <button
                onClick={logout}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              >
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
    </div>
  );
}