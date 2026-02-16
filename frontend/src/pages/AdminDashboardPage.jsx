import { useState } from "react";
import { http } from "../api/http";
import { Navigate } from "react-router-dom";
import { getStoredUser } from "../auth/auth";

export default function AdminDashboardPage() {
  const [text, setText] = useState("Moderation panel");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const user = getStoredUser();
  const totalPages = Math.ceil(total / 20);

  async function loadLocations(pageArg = page) {
    setText("Loading...");
    try {
      await http.get("/health");
      const res = await http.get("/admin/locations", {
        params: { status: status, page: pageArg, limit: 20 },
      });
      setItems(res.data.items);
      setTotal(res.data.total);
      setText("Loaded from API");
    } catch {
      setText("Request failed");
    }
  }

  function Next() {
    const next = page + 1;
    setPage(next);
    loadLocations(next)
  }

  function Prev() {
    const prev = page - 1;
    setPage(prev);
    loadLocations(prev);
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

      <button onClick={ () => {loadLocations()}}>Refresh</button>

      <p>Items: {items.length}</p>
      {items.map((it) => (
        <div key={it.id}>
          <div>{it.title || "(no title)"}</div>

          <button onClick={ () => changeStatus(it.id, "approve")} disabled={it.status === "APPROVED"}>Approve</button>
          <button onClick={ () => changeStatus(it.id, "reject")} disabled={it.status === "REJECTED"}>Reject</button>
          <button onClick={ () => changeStatus(it.id, "hide")} disabled={it.status === "HIDDEN"}>Hide</button>
        </div>
      ))}

      <div>
        <button onClick={() => Prev()} disabled={page === 1}>Prev</button>
        <p>Page:{page}</p>
        <button onClick={() => Next()} disabled={page>=totalPages}>Next</button>
      </div>

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