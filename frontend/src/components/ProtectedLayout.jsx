import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import AiAdvisorDrawer from "./ai/AiAdvisorDrawer";
import AiQuickAddModal from "./ai/AiQuickAddModal";
import TransactionModal from "./TransactionModal";
import { getCategories } from "../api/categories.api";

export default function ProtectedLayout() {
  const { isAuthenticated, loading, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiAdvisorOpen, setAiAdvisorOpen] = useState(false);
  const [aiQuickAddOpen, setAiQuickAddOpen] = useState(false);
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [categories, setCategories] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      loadCategories();
    }
  }, [isAuthenticated]);

  async function loadCategories() {
    try {
      const data = await getCategories();
      setCategories(data.categories || []);
    } catch (err) {
      console.warn("Could not load categories:", err.message);
    }
  }

  function triggerRefresh() {
    setRefreshTrigger((prev) => prev + 1);
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg-primary)",
          color: "var(--text-muted)",
          fontSize: "15px",
        }}
      >
        Loading Aura Budget Tracker...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAdvisor={() => setAiAdvisorOpen(true)}
      />

      {/* Main Wrapper */}
      <div className="main-wrapper">
        <TopBar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onOpenAiQuickAdd={() => setAiQuickAddOpen(true)}
          onOpenAddTx={() => {
            setEditingTx(null);
            setAddTxOpen(true);
          }}
        />

        <main style={{ flex: 1 }}>
          <Outlet
            context={{
              categories,
              refreshTrigger,
              triggerRefresh,
              onOpenAdvisor: () => setAiAdvisorOpen(true),
              onOpenAiQuickAdd: () => setAiQuickAddOpen(true),
              onOpenAddTx: () => {
                setEditingTx(null);
                setAddTxOpen(true);
              },
              onEditTx: (tx) => {
                setEditingTx(tx);
                setAddTxOpen(true);
              },
            }}
          />
        </main>
      </div>

      {/* AI Financial Advisor Drawer */}
      <AiAdvisorDrawer
        isOpen={aiAdvisorOpen}
        onClose={() => setAiAdvisorOpen(false)}
        userName={user?.name || "there"}
      />

      {/* AI Quick Add Natural Language Modal */}
      <AiQuickAddModal
        isOpen={aiQuickAddOpen}
        onClose={() => setAiQuickAddOpen(false)}
        categories={categories}
        onTransactionAdded={triggerRefresh}
      />

      {/* Manual Add / Edit Transaction Modal */}
      <TransactionModal
        isOpen={addTxOpen}
        onClose={() => {
          setAddTxOpen(false);
          setEditingTx(null);
        }}
        transaction={editingTx}
        categories={categories}
        onSaved={triggerRefresh}
      />
    </div>
  );
}