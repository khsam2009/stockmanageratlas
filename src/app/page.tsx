"use client";

import { useState } from "react";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PackagePlus,
  PackageMinus,
  ClipboardList,
  Package,
  Boxes,
  ShieldCheck,
  LogOut,
  User,
  Truck,
  Users,
  Settings,
} from "lucide-react";
import type { NavPage, PagePermission } from "@/lib/types";
import { useAuth } from "@/lib/AuthContext";
import { ProtectedPage } from "@/lib/AuthContext";
import { logoutUser } from "@/lib/auth";
import LoginPage from "@/components/LoginPage";
import Dashboard from "@/components/Dashboard";
import MouvementsPage from "@/components/MouvementsPage";
import ReceptionPage from "@/components/ReceptionPage";
import SortiePage from "@/components/SortiePage";
import InventairePage from "@/components/InventairePage";
import ProduitsPage from "@/components/ProduitsPage";
import CategoriesPage from "@/components/CategoriesPage";
import AdminPage from "@/components/AdminPage";
import FournisseursPage from "@/components/FournisseursPage";
import OperateursPage from "@/components/OperateursPage";
import StockPage from "@/components/StockPage";
import MonProfilPage from "@/components/MonProfilPage";

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  permission?: "dashboard" | "mouvements" | "reception" | "sortie" | "inventaire" | "produits" | "fournisseurs" | "operateurs";
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
    id: "categories",
    label: "Catégories",
    icon: <LayoutDashboard size={22} />,
    permission: "produits",
  },
  {
    id: "stock",
    label: "Stock",
    icon: <Boxes size={22} />,
    permission: "produits",
  },
  {
    id: "fournisseurs",
    label: "Fournisseurs",
    icon: <Truck size={22} />,
    permission: "fournisseurs",
  },
  {
    id: "operateurs",
    label: "Opérateurs",
    icon: <Users size={22} />,
    permission: "operateurs",
  },
  {
    id: "monprofil",
    label: "Mon profil",
    icon: <Settings size={22} />,
    permission: "dashboard",
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
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);

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
  const allVisibleNavItems = ALL_NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.permission) return canAccess(item.permission);
    return true;
  }).filter((item) => item.id !== "monprofil");

  // Split into primary + overflow items
  const primaryItems = allVisibleNavItems.filter((item) =>
    ["dashboard", "mouvements", "reception", "sortie"].includes(item.id)
  );
  const overflowItems = allVisibleNavItems.filter((item) => !primaryItems.includes(item));

  // If current page is no longer accessible, redirect to first available
  const currentPageAccessible =
    activePage === "admin"
      ? isAdmin
      : activePage === "dashboard"
      ? canAccess("dashboard")
      : canAccess(
          activePage === "categories" || activePage === "stock"
            ? "produits"
            : (activePage as PagePermission)
        );

  const effectivePage =
    currentPageAccessible
      ? activePage
      : allVisibleNavItems[0]?.id ?? "dashboard";

  const renderPage = () => {
    switch (effectivePage) {
      case "dashboard":
        return (
          <ProtectedPage page="dashboard">
            <Dashboard onNavigate={setActivePage} />
          </ProtectedPage>
        );
      case "mouvements":
        return (
          <ProtectedPage page="mouvements">
            <MouvementsPage />
          </ProtectedPage>
        );
      case "reception":
        return (
          <ProtectedPage page="reception">
            <ReceptionPage />
          </ProtectedPage>
        );
      case "sortie":
        return (
          <ProtectedPage page="sortie">
            <SortiePage />
          </ProtectedPage>
        );
      case "inventaire":
        return (
          <ProtectedPage page="inventaire">
            <InventairePage />
          </ProtectedPage>
        );
      case "produits":
        return (
          <ProtectedPage page="produits">
            <ProduitsPage />
          </ProtectedPage>
        );
      case "categories":
        return (
          <ProtectedPage page="produits">
            <CategoriesPage />
          </ProtectedPage>
        );
      case "stock":
        return (
          <ProtectedPage page="produits">
            <StockPage />
          </ProtectedPage>
        );
      case "fournisseurs":
        return (
          <ProtectedPage page="fournisseurs">
            <FournisseursPage />
          </ProtectedPage>
        );
      case "operateurs":
        return (
          <ProtectedPage page="operateurs">
            <OperateursPage />
          </ProtectedPage>
        );
      case "monprofil":
        return (
          <ProtectedPage page="dashboard">
            <MonProfilPage />
          </ProtectedPage>
        );
      case "admin":
        return <AdminPage />;
      default:
        return (
          <ProtectedPage page="dashboard">
            <Dashboard onNavigate={setActivePage} />
          </ProtectedPage>
        );
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
        onClick={() => setShowOverflowMenu(false)}
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
              onClick={() => { setActivePage("monprofil"); setShowUserMenu(false); }}
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
      <main style={{ paddingTop: "48px", paddingBottom: "70px" }}   onClick={() => setShowOverflowMenu(false)}>
        {renderPage()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {/* Primary items - always visible */}
        {primaryItems.map((item) => (
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
        {/* Overflow menu for additional items */}
        {overflowItems.length > 0 && (
          <div style={{ position: "relative" }}>
            <button
              className={`nav-item ${overflowItems.some(i => i.id === effectivePage) ? "active" : ""}`}
              onClick={() => setShowOverflowMenu(!showOverflowMenu)}
              style={{ background: "none", border: "none", position: "relative" }}
              title="Plus de pages"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
              <span className="nav-label">Plus</span>
            </button>
            {showOverflowMenu && (
              <div
                style={{
                  position: "absolute",
                  bottom: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "white",
                  borderRadius: "12px",
                  padding: "8px",
                  minWidth: "160px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
                  zIndex: 1000,
                  marginBottom: "8px",
                }}
                onClick={() => setShowOverflowMenu(false)}
              >
                {overflowItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActivePage(item.id);
                      setShowOverflowMenu(false);
                    }}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      border: "none",
                      background: effectivePage === item.id ? "#eff6ff" : "white",
                      color: effectivePage === item.id ? "#2563eb" : "#374151",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      textAlign: "left",
                    }}
                  >
                    {item.icon}
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {effectivePage === item.id && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  );
}
