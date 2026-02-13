import { Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LocationDetailsPage from "./pages/LocationDetailsPage";

export default function App() {
  return (
    <div>
      <nav style={{ padding: 12, borderBottom: "1px solid #eee" }}>
        <Link to="/" style={{ textDecoration: "none" }}>Home</Link>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/locations/:id" element={<LocationDetailsPage />} />
      </Routes>
    </div>
  );
}
