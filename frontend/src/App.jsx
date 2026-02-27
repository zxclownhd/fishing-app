import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import HomePage from "./pages/HomePage";
import LocationDetailsPage from "./pages/LocationDetailsPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ProfilePage from "./pages/ProfilePage";

import { clearAuth, getStoredUser } from "./auth/auth";

export default function App() {
  const nav = useNavigate();
  const [user, setUser] = useState(getStoredUser());

  const userLabel = user?.displayName?.trim()
    ? user.displayName.trim()
    : user?.email || "";

  // простий спосіб: оновлювати user при зміні localStorage після login/register
  // (ми зробимо це через custom event)
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
          Home
        </Link>

        {user && <Link to="/profile">Profile</Link>}
        {user?.role === "OWNER" && <Link to="/owner">Owner</Link>}
        {user?.role === "ADMIN" && <Link to="/admin">Admin</Link>}

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          {user ? (
            <>
              <span style={{ opacity: 0.8 }}>
                {userLabel} ({user.role})
              </span>
              <button
                onClick={logout}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid #ddd",
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
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
        {/* Admin додамо наступним кроком */}
        {/* <Route path="/admin" element={<AdminDashboardPage />} /> */}
      </Routes>
    </div>
  );
}
