import { useEffect, useMemo, useState } from "react";
import { http } from "../api/http";
import { Navigate, Link } from "react-router-dom";
import { clearAuth, getStoredUser } from "../auth/auth";

export default function ProfilePage() {
  const storedUser = getStoredUser();

  const [profile, setProfile] = useState(null);

  const [activeTab, setActiveTab] = useState("PROFILE"); // PROFILE | SECURITY

  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState("");
  const [infoText, setInfoText] = useState("");

  const [redirectToLogin, setRedirectToLogin] = useState(false);

  // profile edit
  const [displayName, setDisplayName] = useState("");
  const displayNameTrim = displayName.trim();

  // password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const canSaveName = useMemo(() => {
    if (!profile) return false;
    if (displayNameTrim.length < 3) return false;
    return displayNameTrim !== String(profile.displayName || "").trim();
  }, [profile, displayNameTrim]);

  const canChangePassword = useMemo(() => {
    if (!currentPassword || !newPassword || !confirmPassword) return false;
    if (newPassword.trim().length < 8) return false;
    if (newPassword !== confirmPassword) return false;
    return true;
  }, [currentPassword, newPassword, confirmPassword]);

  async function loadProfile() {
    setLoading(true);
    setErrorText("");
    setInfoText("");

    try {
      const res = await http.get("/me");
      const user = res.data.user;
      setProfile(user);
      setDisplayName(user?.displayName || "");

      // sync stored user for UI header if needed
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        window.dispatchEvent(new Event("authChanged"));
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        clearAuth();
        setRedirectToLogin(true);
        return;
      }
      setErrorText(err?.response?.data?.error || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveProfile() {
    setErrorText("");
    setInfoText("");

    if (displayNameTrim.length < 3) {
      setErrorText("Display name must be at least 3 characters");
      return;
    }

    try {
      setInfoText("Saving...");
      const res = await http.patch("/me", { displayName: displayNameTrim });
      const user = res.data.user;

      setProfile(user);
      setDisplayName(user?.displayName || "");

      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
        window.dispatchEvent(new Event("authChanged"));
      }

      setInfoText("Saved");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        clearAuth();
        setRedirectToLogin(true);
        return;
      }
      setErrorText(err?.response?.data?.error || "Failed to save");
      setInfoText("");
    }
  }

  async function changePassword() {
    setErrorText("");
    setInfoText("");

    const next = newPassword.trim();

    if (!currentPassword) {
      setErrorText("Enter current password");
      return;
    }
    if (next.length < 8) {
      setErrorText("New password must be at least 8 characters");
      return;
    }
    if (next !== confirmPassword) {
      setErrorText("Passwords do not match");
      return;
    }

    try {
      setInfoText("Changing password...");
      await http.patch("/me/password", { currentPassword, newPassword: next });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setInfoText("Password changed");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 401) {
        clearAuth();
        setRedirectToLogin(true);
        return;
      }
      setErrorText(err?.response?.data?.error || "Failed to change password");
      setInfoText("");
    }
  }

  if (redirectToLogin) return <Navigate to="/login" replace />;
  if (!storedUser) return <Navigate to="/login" replace />;

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <div style={{ marginBottom: 10 }}>
        <Link to="/">← Back</Link>
      </div>

      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>Profile</h2>
          <div style={{ marginTop: 6, fontSize: 13, opacity: 0.75 }}>
            {profile?.email || storedUser.email} | {profile?.role || storedUser.role}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={loadProfile} disabled={loading}>
            Refresh
          </button>
        </div>
      </div>

      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab("PROFILE")}
          style={{ ...styles.tabBtn, ...(activeTab === "PROFILE" ? styles.tabBtnActive : null) }}
        >
          Profile
        </button>

        <button
          onClick={() => setActiveTab("SECURITY")}
          style={{ ...styles.tabBtn, ...(activeTab === "SECURITY" ? styles.tabBtnActive : null) }}
        >
          Security
        </button>
      </div>

      {errorText ? <div style={styles.error}>{errorText}</div> : null}
      {infoText ? <div style={styles.info}>{infoText}</div> : null}
      {loading ? <div style={{ padding: 12 }}>Loading...</div> : null}

      {!loading && profile ? (
        <div style={{ marginTop: 12 }}>
          {activeTab === "PROFILE" ? (
            <div style={styles.card}>
              <h3 style={{ marginTop: 0 }}>Basic info</h3>

              <div style={styles.row}>
                <div style={styles.label}>Email</div>
                <div>{profile.email}</div>
              </div>

              <div style={styles.row}>
                <div style={styles.label}>Role</div>
                <div>{profile.role}</div>
              </div>

              <div style={{ marginTop: 12 }}>
                <div style={styles.label}>Display name</div>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={styles.input} />
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={saveProfile} disabled={!canSaveName || loading}>
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayName(profile.displayName || "")}
                    disabled={loading}
                  >
                    Reset name
                  </button>
                </div>
                <div style={{ marginTop: 8, fontSize: 13, opacity: 0.75 }}>
                  Min length 3 characters
                </div>
              </div>
            </div>
          ) : (
            <div style={styles.card}>
              <h3 style={{ marginTop: 0 }}>Change password</h3>

              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                style={styles.input}
              />

              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 8 chars)"
                style={styles.input}
              />

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                style={styles.input}
              />

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={changePassword} disabled={!canChangePassword || loading}>
                  Change password
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setErrorText("");
                    setInfoText("");
                  }}
                  disabled={loading}
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      ) : null}
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
  card: {
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 12,
    background: "#fff",
    maxWidth: 720,
  },
  row: {
    display: "flex",
    gap: 12,
    padding: "6px 0",
  },
  label: {
    width: 120,
    fontSize: 13,
    opacity: 0.75,
  },
  input: {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    width: "100%",
    marginTop: 6,
  },
  error: {
    marginTop: 12,
    padding: 12,
    border: "1px solid #f2b5b5",
    background: "#fff0f0",
    borderRadius: 12,
  },
  info: {
    marginTop: 12,
    padding: 12,
    border: "1px solid #ddd",
    background: "#fafafa",
    borderRadius: 12,
  },
};