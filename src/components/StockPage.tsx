import { useState, useEffect } from "react";
import { Package, TrendingDown, AlertTriangle, ArrowUpDown, Filter, Search, Calendar, X } from "lucide-react";
import { getProducts, getMovementsUpToDate, getLastValidatedInventoryBeforeDate } from "@/lib/firestore";
import { useAuth } from "@/lib/AuthContext";
import type { Product, StockMovement, Inventory } from "@/lib/types";
import ExportButton from "@/components/ExportButton";
import { exportStockPDF, exportStockExcel, exportStockWord } from "@/lib/exportUtils";
import type { StockExportItem, StockExportFilters } from "@/lib/exportUtils";

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
  const [selectedDate, setSelectedDate] = useState<string>(""); // "" = stock actuel, sinon "YYYY-MM-DD"

  // Historical stock data
  const [historicalStock, setHistoricalStock] = useState<Map<string, number>>(new Map());
  const [historicalLoading, setHistoricalLoading] = useState(false);

  // Date du jour au format YYYY-MM-DD (limite max du sélecteur de date)
  const todayStr = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  })();

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

  // Load historical stock when date changes
  useEffect(() => {
    if (selectedDate === "") {
      setHistoricalStock(new Map());
      return;
    }

    const loadHistoricalStock = async () => {
      setHistoricalLoading(true);
      try {
        const [yearStr, monthStr, dayStr] = selectedDate.split("-");
        const year = parseInt(yearStr);
        const month = parseInt(monthStr) - 1; // 0-indexed
        const day = parseInt(dayStr);
        const endOfDay = new Date(year, month, day, 23, 59, 59, 999); // Selected date at 23:59:59
        const startOfYear = new Date(year, 0, 1); // January 1st of selected year
        
        // Get last validated inventory before end of selected date
        const lastInventory = await getLastValidatedInventoryBeforeDate(endOfDay);
        
        let baseStock = new Map<string, number>();
        let movementsStartDate = startOfYear;
        
        if (lastInventory) {
          // Use inventory physical stock as base
          for (const item of lastInventory.items) {
            baseStock.set(item.productId, item.physicalStock);
          }
          // Movements after inventory end date (or start date if no end date)
          movementsStartDate = lastInventory.endDate || lastInventory.startDate;
        }
        
        // Get movements from movementsStartDate to endOfDay
        const movements = await getMovementsUpToDate(endOfDay);
        
        // Filter movements after the base date
        const relevantMovements = movements.filter(m => m.date >= movementsStartDate);
        
        // Apply movements to base stock
        const stockMap = new Map<string, number>(baseStock);
        
        for (const movement of relevantMovements) {
          const current = stockMap.get(movement.productId) || 0;
          if (movement.type === "entree") {
            stockMap.set(movement.productId, current + movement.quantity);
          } else {
            stockMap.set(movement.productId, current - movement.quantity);
          }
        }
        
        setHistoricalStock(stockMap);
      } catch (error) {
        console.error("Erreur chargement stock historique:", error);
      } finally {
        setHistoricalLoading(false);
      }
    };

    loadHistoricalStock();
  }, [selectedDate]);

  // Calculer le résumé
  const getStock = (product: Product) => selectedDate === "" ? product.currentStock : (historicalStock.get(product.id) || 0);
  
  const outOfStockCount = products.filter(p => getStock(p) <= 0).length;
  const negativeStockCount = products.filter(p => getStock(p) < 0).length;
  const lowStockCount = products.filter(p => getStock(p) > 0 && getStock(p) <= (p.minStock || 0)).length;

  // Filtrer et trier les produits
  const filteredProducts = products
    .filter((p) => {
      // Get stock for this product (historical or current)
      const stock = selectedDate === "" ? p.currentStock : (historicalStock.get(p.id) || 0);
      
      // Filtre par statut positif
      if (showPositiveOnly && stock <= 0) return false;
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
      const stockA = selectedDate === "" ? a.currentStock : (historicalStock.get(a.id) || 0);
      const stockB = selectedDate === "" ? b.currentStock : (historicalStock.get(b.id) || 0);
      
      if (sortOrder === "asc") {
        return stockA - stockB;
      } else {
        return stockB - stockA;
      }
    });

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Formater une valeur de date (YYYY-MM-DD) en jj/mm/aaaa
  const formatDateFr = (value: string) => {
    if (!value) return "";
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("fr-FR");
  };

  // Données exportées (produits filtrés avec le stock calculé)
  const stockExportItems: StockExportItem[] = filteredProducts.map((p) => ({
    code: p.code,
    name: p.name,
    category: p.category,
    stock: getStock(p),
    unit: p.unit,
    minStock: p.minStock || 0,
  }));

  const stockExportFilters: StockExportFilters = {
    category: selectedCategory,
    date: selectedDate,
    searchQuery: searchQuery,
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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="page-title">Stock des articles</div>
            <div className="page-subtitle">
              {selectedDate === ""
                ? `${products.length} article(s) au total`
                : `Stock au ${formatDateFr(selectedDate)} — ${products.length} article(s)`
              }
            </div>
          </div>
          <div style={{ paddingTop: "4px" }}>
            <ExportButton
              onExportPDF={() => exportStockPDF(stockExportItems, stockExportFilters)}
              onExportExcel={() => exportStockExcel(stockExportItems, stockExportFilters)}
              onExportWord={() => exportStockWord(stockExportItems, stockExportFilters)}
            />
          </div>
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
          {/* Ligne 1: Checkbox positifs + bouton tri + filtre mois */}
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

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
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

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label style={{ fontSize: "14px", fontWeight: "600", color: "#475569" }}>
                  <Calendar size={16} style={{ marginRight: "6px", verticalAlign: "middle" }} />
                  Stock au :
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  max={todayStr}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={historicalLoading}
                  style={{
                    padding: "8px 14px",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "8px",
                    fontSize: "14px",
                    background: "white",
                    cursor: "pointer",
                    opacity: historicalLoading ? 0.6 : 1
                  }}
                />
                {selectedDate !== "" && (
                  <button
                    onClick={() => setSelectedDate("")}
                    title="Revenir au stock actuel"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "30px",
                      height: "30px",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "8px",
                      background: "white",
                      cursor: "pointer",
                      color: "#64748b"
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
                {selectedDate === "" && (
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Stock actuel</span>
                )}
                {historicalLoading && (
                  <span style={{ fontSize: "12px", color: "#64748b" }}>Chargement...</span>
                )}
              </div>
            </div>
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
              minWidth: "600px"
            }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Article
                  </th>
                  <th style={{ padding: "14px 16px", textAlign: "left", fontSize: "13px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {selectedDate === "" ? "Stock actuel" : `Stock au ${formatDateFr(selectedDate)}`}
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
                  const stock = selectedDate === "" ? product.currentStock : (historicalStock.get(product.id) || 0);
                  const isOutOfStock = stock <= 0;
                  const isNegative = stock < 0;
                  const isLowStock = stock > 0 && stock <= (product.minStock || 0);
                  const isBelowMin = stock < (product.minStock || 0);
                  
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
                          {product.description || "-"}
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
                            {stock}
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
