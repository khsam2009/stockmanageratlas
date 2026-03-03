"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PackagePlus,
  PackageMinus,
  ClipboardList,
  Package,
  ShieldCheck,
  LogOut,
  User,
} from "lucide-react";
import type { NavPage } from "@/lib/types";
import { useAuth } from "@/lib/AuthContext";
import { logoutUser } from "@/lib/auth";
import LoginPage from "@/components/LoginPage";
import Dashboard from "@/components/Dashboard";
import MouvementsPage from "@/components/MouvementsPage";
import ReceptionPage from "@/components/ReceptionPage";
import SortiePage from "@/components/SortiePage";
import InventairePage from "@/components/InventairePage";
import ProduitsPage from "@/components/ProduitsPage";
import AdminPage from "@/components/AdminPage";

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  permission?: "dashboard" | "mouvements" | "reception" | "sortie" | "inventaire" | "produits";
}

const ALL_NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Accueil",
    icon: <LayoutDashboard size={22} />,
    permission: "dashboard",
  },
  {
    id: "mouvements",
    label: "Mouvements",
    icon: <ArrowLeftRight size={22} />,
    permission: "mouvements",
  },
  {
    id: "reception",
    label: "Réception",
    icon: <PackagePlus size={22} />,
    permission: "reception",
  },
  {
    id: "sortie",
    label: "Sortie",
    icon: <PackageMinus size={22} />,
    permission: "sortie",
  },
  {
    id: "inventaire",
    label: "Inventaire",
    icon: <ClipboardList size={22} />,
    permission: "inventaire",
  },
  {
    id: "produits",
    label: "Produits",
    icon: <Package size={22} />,
    permission: "produits",
  },
  {
    id: "admin",
    label: "Admin",
    icon: <ShieldCheck size={22} />,
    adminOnly: true,
  },
];

export default function Home() {
  const { appUser, loading, canAccess, isAdmin } = useAuth();
  const [activePage, setActivePage] = useState<NavPage>("dashboard");
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        <div
          style={{
            width: "48px",
            height: "48px",
            border: "3px solid rgba(255,255,255,0.3)",
            borderTopColor: "white",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "14px" }}>Chargement...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not logged in → show login page
  if (!appUser) {
    return <LoginPage onLogin={() => {}} />;
  }

  // Build visible nav items based on permissions
  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.permission) return canAccess(item.permission);
    return true;
  });

  // If current page is no longer accessible, redirect to first available
  const currentPageAccessible =
    activePage === "admin"
      ? isAdmin
      : activePage === "dashboard"
      ? canAccess("dashboard")
      : canAccess(activePage as "mouvements" | "reception" | "sortie" | "inventaire" | "produits");

  const effectivePage =
    currentPageAccessible && visibleNavItems.some((n) => n.id === activePage)
      ? activePage
      : visibleNavItems[0]?.id ?? "dashboard";

  const renderPage = () => {
    switch (effectivePage) {
      case "dashboard":
        return <Dashboard onNavigate={setActivePage} />;
      case "mouvements":
        return <MouvementsPage />;
      case "reception":
        return <ReceptionPage />;
      case "sortie":
        return <SortiePage />;
      case "inventaire":
        return <InventairePage />;
      case "produits":
        return <ProduitsPage />;
      case "admin":
        return <AdminPage />;
      default:
        return <Dashboard onNavigate={setActivePage} />;
    }
  };

  const handleLogout = async () => {
    setShowUserMenu(false);
    await logoutUser();
  };

  return (
    <>
      {/* Top bar with user info */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: "48px",
          background: "#1e40af",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 100,
          boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        <span style={{ color: "white", fontSize: "15px", fontWeight: "700" }}>
          StockManager
        </span>

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255,255,255,0.15)",
            border: "none",
            borderRadius: "20px",
            padding: "5px 10px 5px 6px",
            cursor: "pointer",
            color: "white",
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "700",
            }}
          >
            {appUser.displayName.charAt(0).toUpperCase()}
          </div>
          <span style={{ fontSize: "13px", fontWeight: "500", maxWidth: "100px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {appUser.displayName}
          </span>
        </button>
      </div>

      {/* User dropdown menu */}
      {showUserMenu && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 200 }}
            onClick={() => setShowUserMenu(false)}
          />
          <div
            style={{
              position: "fixed",
              top: "54px",
              right: "12px",
              background: "white",
              borderRadius: "14px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.15)",
              zIndex: 201,
              minWidth: "200px",
              overflow: "hidden",
            }}
          >
            {/* User info */}
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #f1f5f9",
                background: "#f8fafc",
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                {appUser.displayName}
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                {appUser.email}
              </div>
              <div
                style={{
                  display: "inline-block",
                  marginTop: "6px",
                  fontSize: "11px",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: appUser.role === "admin" ? "#fef3c7" : "#eff6ff",
                  color: appUser.role === "admin" ? "#d97706" : "#2563eb",
                  fontWeight: "600",
                }}
              >
                {appUser.role === "admin" ? "Administrateur" : "Utilisateur"}
              </div>
            </div>

            {/* Profile option */}
            <button
              onClick={() => setShowUserMenu(false)}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "14px",
                color: "#374151",
                textAlign: "left",
              }}
            >
              <User size={16} color="#64748b" />
              Mon profil
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "none",
                border: "none",
                borderTop: "1px solid #f1f5f9",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "14px",
                color: "#dc2626",
                textAlign: "left",
              }}
            >
              <LogOut size={16} color="#dc2626" />
              Se déconnecter
            </button>
          </div>
        </>
      )}

      {/* Main content */}
      <main style={{ paddingTop: "48px", paddingBottom: "70px" }}>
        {renderPage()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {visibleNavItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${effectivePage === item.id ? "active" : ""}`}
            onClick={() => setActivePage(item.id)}
            style={{ background: "none", border: "none" }}
          >
            {item.icon}
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
