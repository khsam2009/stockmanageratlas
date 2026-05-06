import { useState, useEffect } from "react";
import { Package, TrendingDown, AlertTriangle, ArrowUpDown, Filter, Search } from "lucide-react";
import { getProducts } from "@/lib/firestore";
import { useAuth } from "@/lib/AuthContext";
import type { Product } from "@/lib/types";

export default function StockPage() {
  const { appUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  // Filtres
  const [showPositiveOnly, setShowPositiveOnly] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc"); // asc = stock croissant, desc = stock décroissant

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await getProducts();
      const allProducts = result.products;
      
      // Extraire les catégories uniques
      const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))] as string[];
      setCategories(uniqueCategories);
      setProducts(allProducts);
    } catch (error) {
      console.error("Erreur chargement stock:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Calculer le résumé
  const outOfStockCount = products.filter(p => p.currentStock <= 0).length;
  const negativeStockCount = products.filter(p => p.currentStock < 0).length;
  const lowStockCount = products.filter(p => p.currentStock > 0 && p.currentStock <= (p.minStock || 0)).length;

  // Filtrer et trier les produits
  const filteredProducts = products
    .filter((p) => {
      // Filtre par statut positif
      if (showPositiveOnly && p.currentStock <= 0) return false;
      // Filtre par catégorie
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      // Filtre par recherche (nom ou code/EAN)
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name && p.name.toLowerCase().includes(q);
        const matchCode = p.code && p.code.toLowerCase().includes(q);
        const matchEan = p.codebarreEAN13 && p.codebarreEAN13.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchEan) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "asc") {
        return a.currentStock - b.currentStock;
      } else {
        return b.currentStock - a.currentStock;
      }
    });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  if (loading) {
    return (
      <div className="page-content">
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          <div style={{ 
            width: "48px", 
            height: "48px", 
            border: "3px solid #e2e8f0", 
            borderTopColor: "#2563eb", 
            borderRadius: "50%", 
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px"
          }} />
          Chargement du stock...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Stock des articles</div>
          <div className="page-subtitle">{products.length} article(s) au total</div>
        </div>
      </div>

      <div className="page-content">
        {/* Résumé statistiques */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "16px", 
          marginBottom: "24px" 
        }}>
          {/* Articles en rupture */}
          <div className="stat-card" style={{ borderLeft: "4px solid #dc2626" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#fef2f2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <AlertTriangle size={22} color="#dc2626" />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>{outOfStockCount}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>En rupture</div>
              </div>
            </div>
          </div>

          {/* Articles en valeur négative */}
          <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <TrendingDown size={22} color="#d97706" />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>{negativeStockCount}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>En négatif</div>
              </div>
            </div>
          </div>

          {/* Alerte stock minimum */}
          <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#fffbeb",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <AlertTriangle size={22} color="#d97706" />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>{lowStockCount}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Stock minimum</div>
              </div>
            </div>
          </div>

          {/* Total articles */}
          <div className="stat-card" style={{ borderLeft: "4px solid #10b981" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#ecfdf5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Package size={22} color="#059669" />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>{filteredProducts.length}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Affichés</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "16px",
          marginBottom: "16px",
          border: "1px solid #e2e8f0",
          display: "flex",
          flexDirection: "column",
          gap: "12px"
        }}>
          {/* Ligne 1: Checkbox positifs + bouton tri */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                id="filter-positive"
                checked={showPositiveOnly}
                onChange={(e) => setShowPositiveOnly(e.target.checked)}
                style={{
                  width: "18px",
                  height: "18px",
                  cursor: "pointer"
                }}
              />
              <label htmlFor="filter-positive" style={{ 
                fontSize: "14px", 
                color: "#475569",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <Filter size={16} />
                Afficher uniquement les articles avec stock positif
              </label>
            </div>

            <button
              onClick={toggleSortOrder}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 14px",
                background: sortOrder === "asc" ? "#10b981" : "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              <ArrowUpDown size={16} />
              Stock {sortOrder === "asc" ? "Croissant" : "Décroissant"}
            </button>
          </div>

          {/* Ligne 2: Recherche + Filtre catégorie */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "250px" }}>
              <div style={{
                position: "relative",
                flex: 1,
                maxWidth: "400px"
              }}>
                <Search size={18} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="text"
                  placeholder="Rechercher par nom ou code article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 14px 8px 38px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "white"
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>
                Catégorie :
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  padding: "8px 14px",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "14px",
                  background: "white",
                  cursor: "pointer",
                  minWidth: "200px"
                }}
              >
                <option value="all">Toutes</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <span style={{ fontSize: "13px", color: "#64748b", whiteSpace: "nowrap" }}>
              {filteredProducts.length} article(s)
            </span>
          </div>
        </div>

        {/* Tableau */}
        <div style={{ 
          background: "white", 
          borderRadius: "12px", 
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ 
              width: "100%", 
              borderCollapse: "collapse",
              minWidth: "380px"
            }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Article
                  </th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Stock actuel
                  </th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Stock min
                  </th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Alerte
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.currentStock <= 0;
                  const isNegative = product.currentStock < 0;
                  const isLowStock = product.currentStock > 0 && product.currentStock <= (product.minStock || 0);
                  const isBelowMin = product.currentStock < (product.minStock || 0);
                  
                  return (
                    <tr 
                      key={product.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        backgroundColor: isNegative ? "#fef2f2" : (isLowStock ? "#fffbeb" : "white"),
                        transition: "background-color 0.2s"
                      }}
                    >
                      <td style={{ padding: "16px", verticalAlign: "top" }}>
                        <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "14px" }}>
                          {product.name}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          {product.description || ""}
                        </div>
                      </td>
                      <td style={{ padding: "16px", verticalAlign: "top" }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px"
                        }}>
                          <span style={{
                            fontSize: "18px",
                            fontWeight: "700",
                            color: isOutOfStock ? "#dc2626" : (isLowStock ? "#d97706" : "#16a34a"),
                            fontFamily: "monospace"
                          }}>
                            {product.currentStock}
                          </span>
                          <span style={{
                            fontSize: "12px",
                            color: "#64748b"
                          }}>
                            {product.unit}
                          </span>
                        </div>
                        {isNegative && (
                          <span style={{
                            display: "inline-block",
                            marginTop: "4px",
                            padding: "2px 8px",
                            background: "#fee2e2",
                            color: "#dc2626",
                            fontSize: "11px",
                            borderRadius: "4px",
                            fontWeight: "600"
                          }}>
                            ⚠️ Valeur négative
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px", verticalAlign: "top" }}>
                        <span style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: isBelowMin ? "#d97706" : "#64748b",
                          fontFamily: "monospace"
                        }}>
                          {product.minStock || 0} {product.unit}
                        </span>
                      </td>
                      <td style={{ padding: "16px", verticalAlign: "top" }}>
                        {isOutOfStock && (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 10px",
                            background: "#fee2e2",
                            color: "#dc2626",
                            fontSize: "11px",
                            borderRadius: "6px",
                            fontWeight: "600"
                          }}>
                            <AlertTriangle size={12} />
                            RUPTURE
                          </span>
                        )}
                        {isLowStock && !isOutOfStock && (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 10px",
                            background: "#fffbeb",
                            color: "#d97706",
                            fontSize: "11px",
                            borderRadius: "6px",
                            fontWeight: "600"
                          }}>
                            ⚠️ Minimum
                          </span>
                        )}
                        {!isOutOfStock && !isLowStock && (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "4px 10px",
                            background: "#ecfdf5",
                            color: "#059669",
                            fontSize: "11px",
                            borderRadius: "6px",
                            fontWeight: "600"
                          }}>
                            ✓ OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {filteredProducts.length === 0 && (
            <div style={{
              padding: "40px",
              textAlign: "center",
              color: "#64748b"
            }}>
              <Package size={48} style={{ margin: "0 auto 16px", opacity: 0.3 }} />
              <div style={{ fontSize: "15px", fontWeight: "600", marginBottom: "4px" }}>
                Aucun article trouvé
              </div>
              <div style={{ fontSize: "13px" }}>
                Ajustez vos filtres pour voir plus de résultats
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
