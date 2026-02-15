import { useState } from "react";
import { http } from "../api/http";
import { Navigate } from "react-router-dom";
import { getStoredUser } from "../auth/auth";

export default function AdminDashboardPage() {
  const [text, setText] = useState("Moderation panel");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("PENDING");

  const user = getStoredUser();

  async function loadLocations() {
    setText("Loading...");
    try {
      await http.get("/health");
      const res = await http.get("/admin/locations", {
        params: { status: status, page: 1, limit: 20 },
      });
      setItems(res.data.items);
      setText("Loaded from API");
    } catch {
      setText("Request failed");
    }
  }

  async function changeStatus(id, action) {
    try {
      await http.patch(`/admin/locations/${id}/${action}`);
      await loadLocations();
    } catch {
      setText("Request failed");
    }
  }

  if (!user) {
    return <Navigate to="/login" replace/>;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/" replace/>;
  }

  return (
    <div>
      <h2>Admin Dashboard</h2>

      <p>{text}</p>

      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value={"PENDING"}>PENDING</option>
        <option value={"APPROVED"}>APPROVED</option>
        <option value={"REJECTED"}>REJECTED</option>
        <option value={"HIDDEN"}>HIDDEN</option>
      </select>

      <button onClick={ () => {loadLocations()}}>Load</button>

      <p>Items: {items.length}</p>
      {items.map((it) => (
        <div key={it.id}>
          <div>{it.title || "(no title)"}</div>

          <button onClick={ () => changeStatus(it.id, "approve")}>Approve</button>
          <button onClick={ () => changeStatus(it.id, "reject")}>Reject</button>
          <button onClick={ () => changeStatus(it.id, "hide")}>Hide</button>
        </div>
      ))}

      <button
        onClick={() => {
          setItems([]);
        }}
      >
        Clear
      </button>
    </div>
  );
}
