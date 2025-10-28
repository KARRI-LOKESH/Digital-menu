import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useState } from "react";
import MenuPage from "./pages/MenuPage";
import CartPage from "./pages/CartPage";
import ScanToOrder from "./pages/ScanToOrder";
import "./Navbar.css";
import AdminDashboard from "./components/AdminDashboard";
import ServePage from "./pages/ServePage";
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <BrowserRouter>
      <nav className="navbar">
        <div className="navbar-logo">Hotel Lok</div>

        <div className={`navbar-links ${menuOpen ? "active" : ""}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <Link to="/cart" onClick={() => setMenuOpen(false)}>Cart</Link>
        </div>

        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<ScanToOrder />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/serve" element={<ServePage />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </BrowserRouter>
  );
}
