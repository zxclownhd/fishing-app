import { useState, useEffect } from "react";
import { http } from "../api/http";
import { Navigate } from "react-router-dom";
//import { getStoredUser } from "../auth/auth";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [text, setText] = useState("");
  const [displayName, setDisplayName] = useState("");

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
        </div>
      )}
    </div>
  );
}