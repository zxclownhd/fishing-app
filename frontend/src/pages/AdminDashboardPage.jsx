import { useState } from "react";

import { http } from "../api/http";

export default function AdminDashboardPage() {
  const [text, setText] = useState("Moderation panel");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("PENDING");
  

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

      <button
        onClick={async () => {
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
        }}
      >
        Load
      </button>

      <p>Items: {items.length}</p>
      {items.map((it) => (
        <div key={it.id}>{it.title || "(no title)"}</div>
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
