import { useState, useEffect } from "react";
import { http } from "../api/http";
import { Navigate } from "react-router-dom";
//import { getStoredUser } from "../auth/auth";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [text, setText] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  async function saveProfile() {
    setText("Saving...");
    const newName = displayName.trim();
    try {
      if (newName.length >= 3) {
        const res = await http.patch("/me", { displayName });
        setProfile(res.data.user);
        setText("Saved");
      } else {
        setText("Failed. Name is too short.");
        return;
      }
    } catch {
      setText("Failed");
    }
  }

  async function changePassword() {
    setText("Changing password...");

    const next = newPassword.trim();

    try {
      if (currentPassword.length === 0) {
        setText("Enter current password");
        return;
      }

      if (next.length < 8) {
        setText("Password too short");
        return;
      }

      if (next !== confirmPassword) {
        setText("Passwords do not match");
        return;
      }

      await http.patch("/me/password", { currentPassword, newPassword: next });

      setText("Password changed");

      setCurrentPassword("");

      setNewPassword("");

      setConfirmPassword("");
    } catch (err) {
      setText("Failed: " + (err.response?.data?.error || "Server error"));
    }
  }

  useEffect(() => {
    async function loadProfile() {
      setText("Loading...");
      try {
        const res = await http.get("/me");
        setProfile(res.data.user);
        setDisplayName(res.data.user.displayName || "");
        setText("Loaded");
      } catch {
        setText("Failed");
      }
    }

    loadProfile();
  }, []);

  return (
    <div>
      <h2>Profile - {profile?.displayName}</h2>

      <p>{text}</p>

      {profile && (
        <div>
          <p>Email: {profile?.email}</p>
          <p>Role: {profile?.role}</p>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          ></input>
          <button onClick={() => saveProfile()}>Save</button>

          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
          ></input>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
          ></input>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          ></input>
          <button
            onClick={() => changePassword()}
            disabled={
              currentPassword.length === 0 ||
              newPassword.length === 0 ||
              confirmPassword.length === 0
            }
          >
            Change password
          </button>
        </div>
      )}
    </div>
  );
}
