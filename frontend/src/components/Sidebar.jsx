import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Sidebar({ open, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleCreateAccount() {
    
    navigate("/signup");
  }

  return (
    <>
      {/* Backdrop */}
      {open && <div className="sidebar-backdrop" onClick={onClose}></div>}

      <aside className={`sidebar-drawer ${open ? "open" : ""}`}>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <h2 className="brand">BudgetTracker</h2>

        <div className="sidebar-actions">
          <button className="sidebar-btn danger" onClick={handleLogout}>
            Logout
          </button>

          <button className="sidebar-btn" onClick={handleCreateAccount}>
            Create another account
          </button>
        </div>
      </aside>
    </>
  );
}