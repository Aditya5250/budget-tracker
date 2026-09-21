import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  BarChart3,
  Target,
  Bot,
  LogOut,
  Sparkles,
  Sun,
  Moon,
  X,
  Wallet,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export default function Sidebar({ open, onClose, onOpenAdvisor }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const initial = (user?.name || "User").charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          className="modal-overlay"
          style={{ zIndex: 1050 }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`sidebar ${open ? "mobile-open" : ""}`}>
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-icon-wrapper">
            <Wallet size={22} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              <span className="brand-title">AuraBudget</span>
              <span className="brand-badge">AI</span>
            </div>
            <span style={{ fontSize: "11px", color: "var(--text-subtle)", fontWeight: 500 }}>
              Smart Financial Tracker
            </span>
          </div>
          {open && (
            <button
              onClick={onClose}
              style={{
                marginLeft: "auto",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="nav-group">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/analytics"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            <BarChart3 size={18} />
            <span>Analytics</span>
          </NavLink>

          <NavLink
            to="/budgets"
            className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            onClick={onClose}
          >
            <Target size={18} />
            <span>Budgets & Goals</span>
          </NavLink>

          <button
            type="button"
            className="nav-link ai-tab"
            onClick={() => {
              onClose?.();
              onOpenAdvisor?.();
            }}
            style={{ width: "100%", textAlign: "left", cursor: "pointer" }}
          >
            <Bot size={18} />
            <span>AI Advisor</span>
            <Sparkles size={13} style={{ marginLeft: "auto" }} />
          </button>
        </nav>

        {/* User Footer */}
        <div className="user-footer">
          <div className="user-profile">
            <div className="user-avatar">{initial}</div>
            <div className="user-meta">
              <div className="user-name">{user?.name || "Aditya Raj"}</div>
              <div className="user-email">{user?.email || "user@domain.com"}</div>
            </div>
          </div>

          <div className="sidebar-actions-row">
            <button
              type="button"
              className="icon-btn"
              onClick={toggleTheme}
              title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              type="button"
              className="icon-btn danger"
              onClick={handleLogout}
              title="Logout from session"
              aria-label="Logout"
              style={{ flex: 1 }}
            >
              <LogOut size={16} />
              <span style={{ fontSize: "12.5px", fontWeight: 600, marginLeft: "6px" }}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}