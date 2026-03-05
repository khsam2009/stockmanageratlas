"use client";

import { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowLeftRight,
  PackagePlus,
  PackageMinus,
  ClipboardList,
  RefreshCw,
  BarChart3,
  Clock,
} from "lucide-react";
import { getProducts, getMovements, getReceptions } from "@/lib/firestore";
import type { Product, StockMovement, NavPage, BonReception } from "@/lib/types";

interface DashboardProps {
  onNavigate: (page: NavPage) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [receptions, setReceptions] = useState<BonReception[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, movs, recs] = await Promise.all([getProducts(), getMovements(), getReceptions()]);
      setProducts(prods);
      setMovements(movs);
      setReceptions(recs);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.active !== false);
  const lowStockProducts = products.filter((p) => p.minStockAlarm && p.currentStock <= p.minStock);
  const totalEntrees = movements.filter((m) => m.type === "entree").length;
  const totalSorties = movements.filter((m) => m.type === "sortie").length;

  // Calculate top products by sortie quantity
  const topSortieProducts = (() => {
    const productCounts: Record<string, { product: Product; totalQuantity: number; count: number }> = {};
    
    movements.filter((m) => m.type === "sortie").forEach((m) => {
      if (!productCounts[m.productId]) {
        const product = products.find((p) => p.id === m.productId);
        if (product) {
          productCounts[m.productId] = { product, totalQuantity: 0, count: 0 };
        }
      }
      if (productCounts[m.productId]) {
        productCounts[m.productId].totalQuantity += m.quantity;
        productCounts[m.productId].count += 1;
      }
    });
    
    return Object.values(productCounts)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);
  })();

  // Calculate average supply time (days between receptions)
  const averageSupplyTime = (() => {
    if (receptions.filter((r) => r.status === "valide").length < 2) return null;
    
    const sortedReceptions = receptions
      .filter((r) => r.status === "valide")
      .sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
    
    let totalDays = 0;
    let count = 0;
    for (let i = 1; i < sortedReceptions.length; i++) {
      const prevDate = sortedReceptions[i - 1].date instanceof Date 
        ? sortedReceptions[i - 1].date 
        : new Date(sortedReceptions[i - 1].date);
      const currDate = sortedReceptions[i].date instanceof Date 
        ? sortedReceptions[i].date 
        : new Date(sortedReceptions[i].date);
      
      const days = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (days > 0 && days < 365) { // Filter out unrealistic values
        totalDays += days;
        count++;
      }
    }
    
    return count > 0 ? Math.round(totalDays / count) : null;
  })();

  // Products needing restock (low stock with alarm enabled)
  const productsNeedingRestock = lowStockProducts.slice(0, 5);

  const quickActions = [
    {
      label: "Mouvement",
      icon: <ArrowLeftRight size={24} />,
      color: "#1e40af",
      bg: "#dbeafe",
      page: "mouvements" as NavPage,
    },
    {
      label: "Réception",
      icon: <PackagePlus size={24} />,
      color: "#16a34a",
      bg: "#dcfce7",
      page: "reception" as NavPage,
    },
    {
      label: "Sortie",
      icon: <PackageMinus size={24} />,
      color: "#dc2626",
      bg: "#fee2e2",
      page: "sortie" as NavPage,
    },
    {
      label: "Inventaire",
      icon: <ClipboardList size={24} />,
      color: "#d97706",
      bg: "#fef3c7",
      page: "inventaire" as NavPage,
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div className="page-title">📦 StockManager</div>
            <div className="page-subtitle">Tableau de bord</div>
          </div>
          <button
            onClick={loadData}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              borderRadius: "8px",
              padding: "8px",
              color: "white",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div className="stat-card">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  background: "#dbeafe",
                  borderRadius: "10px",
                  padding: "10px",
                  color: "#1e40af",
                }}
              >
                <Package size={20} />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>
                  {loading ? "..." : totalProducts}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Produits</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  background: "#fee2e2",
                  borderRadius: "10px",
                  padding: "10px",
                  color: "#dc2626",
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#dc2626" }}>
                  {loading ? "..." : lowStockProducts.length}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Stock bas</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  background: "#dcfce7",
                  borderRadius: "10px",
                  padding: "10px",
                  color: "#16a34a",
                }}
              >
                <TrendingUp size={20} />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#16a34a" }}>
                  {loading ? "..." : totalEntrees}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Entrées récentes</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  background: "#fef3c7",
                  borderRadius: "10px",
                  padding: "10px",
                  color: "#d97706",
                }}
              >
                <TrendingDown size={20} />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#d97706" }}>
                  {loading ? "..." : totalSorties}
                </div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Sorties récentes</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ marginBottom: "20px" }}>
          <h2
            style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginBottom: "12px" }}
          >
            Actions rapides
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {quickActions.map((action) => (
              <button
                key={action.page}
                onClick={() => onNavigate(action.page)}
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    background: action.bg,
                    borderRadius: "12px",
                    padding: "12px",
                    color: action.color,
                  }}
                >
                  {action.icon}
                </div>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>
                  {action.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Top Products by Sortie */}
        {topSortieProducts.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <BarChart3 size={18} />
              Produits les plus sortis
            </h2>
            {topSortieProducts.map((item, index) => (
              <div
                key={item.product.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  marginBottom: "6px",
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "6px",
                    background: index === 0 ? "#dc2626" : index === 1 ? "#ea580c" : index === 2 ? "#d97706" : "#64748b",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "700",
                  }}
                >
                  {index + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: "600" }}>{item.product.name}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{item.product.code}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "14px", fontWeight: "700", color: "#dc2626" }}>
                    {item.totalQuantity} {item.product.unit}
                  </div>
                  <div style={{ fontSize: "10px", color: "#64748b" }}>{item.count} mouvements</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Supply Time Stats */}
        {averageSupplyTime !== null && (
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <Clock size={18} />
              Temps d& apos;approvisionnement
            </h2>
            <div
              style={{
                background: "#eff6ff",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "32px", fontWeight: "700", color: "#1e40af" }}>
                {averageSupplyTime}
              </div>
              <div style={{ fontSize: "13px", color: "#64748b" }}>
                jours en moyenne entre les réceptions
              </div>
            </div>
          </div>
        )}

        {/* Low Stock Alert */}
        {lowStockProducts.length > 0 && (
          <div style={{ marginBottom: "20px" }}>
            <h2
              style={{
                fontSize: "16px",
                fontWeight: "700",
                color: "#1e293b",
                marginBottom: "12px",
              }}
            >
              ⚠️ Alertes stock bas
            </h2>
            {lowStockProducts.slice(0, 3).map((product) => (
              <div
                key={product.id}
                className="alert alert-warning"
                style={{ marginBottom: "8px" }}
              >
                <AlertTriangle size={16} />
                <div>
                  <div style={{ fontWeight: "600", fontSize: "13px" }}>{product.name}</div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    Stock: {product.currentStock} {product.unit} (min: {product.minStock})
                  </div>
                </div>
              </div>
            ))}
            {lowStockProducts.length > 3 && (
              <div style={{ fontSize: "12px", color: "#64748b", textAlign: "center" }}>
                +{lowStockProducts.length - 3} autres produits en stock bas
              </div>
            )}
          </div>
        )}

        {/* Recent Movements */}
        <div>
          <h2
            style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", marginBottom: "12px" }}
          >
            Derniers mouvements
          </h2>
          {loading ? (
            <div style={{ textAlign: "center", padding: "24px", color: "#64748b" }}>
              Chargement...
            </div>
          ) : movements.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <div style={{ fontWeight: "600", marginBottom: "4px" }}>Aucun mouvement</div>
              <div style={{ fontSize: "13px" }}>Les mouvements apparaîtront ici</div>
            </div>
          ) : (
            movements.map((movement) => (
              <div key={movement.id} className="list-item">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div
                      style={{
                        background: movement.type === "entree" ? "#dcfce7" : "#fee2e2",
                        borderRadius: "8px",
                        padding: "8px",
                        color: movement.type === "entree" ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {movement.type === "entree" ? (
                        <TrendingUp size={16} />
                      ) : (
                        <TrendingDown size={16} />
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600" }}>
                        {movement.productName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>{movement.reason}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: movement.type === "entree" ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {movement.type === "entree" ? "+" : "-"}
                      {movement.quantity}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      {movement.date instanceof Date
                        ? movement.date.toLocaleDateString("fr-FR")
                        : ""}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
