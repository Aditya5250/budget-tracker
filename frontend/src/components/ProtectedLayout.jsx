import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import Sidebar from "./Sidebar";

export default function ProtectedLayout() {
    const { isAuthenticated } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <>
            {/* Sidebar toggle button */}
            <button
                className="sidebar-toggle"
                aria-label="Open menu"
                onClick={() => setSidebarOpen(true)}
            >
                <span className="hamburger"></span>
            </button>

            {/* Sidebar */}
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content */}
            <main className="app-main centered">
                <Outlet />
            </main>
        </>
    );
}