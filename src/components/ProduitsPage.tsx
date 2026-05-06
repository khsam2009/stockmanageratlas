"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, X, Search, Edit2, Trash2, Package, AlertTriangle, Loader2, ScanLine, Menu } from "lucide-react";
import ProductBarcodeScanner from "@/components/ProductBarcodeScanner";
import { getProducts, addProduct, updateProduct, deleteProduct, getCategories, addCategory } from "@/lib/firestore";
import type { Categorie } from "@/lib/types";
import { useAuth } from "@/lib/AuthContext";
import type { Product } from "@/lib/types";

const UNITS = ["pcs", "kg", "g", "L", "mL", "m", "cm", "m²", "m³", "boîte", "carton", "palette"];

export default function ProduitsPage() {
  const { appUser } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]); // Categories as strings
  const [loading, setLoading] = useState(true);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<{ name: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showOperatorMenu, setShowOperatorMenu] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const hasWriteAccess = appUser ? appUser.role === "admin" || appUser.permissions.produits === "write" : false;
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const loaderRef = useRef<HTMLDivElement>(null);

  const handleBarcodeDetected = (code: string) => {
    setForm((prev) => ({ ...prev, codebarreEAN13: code }));
  };

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    category: "",
    unit: "pcs",
    currentStock: "0",
    minStock: "0",
    maxStock: "0",
    location: "",
    codebarreEAN13: "",
    active: true,
    minStockAlarm: true,
  });

  const checkDuplicateBarcode = (code: string): Product | null => {
    if (!code.trim()) return null;
    return products.find(
      (p) =>
        p.codebarreEAN13?.toLowerCase() === code.toLowerCase() &&
        (!editProduct || p.id !== editProduct.id)
    ) || null;
  };

  const duplicateProduct = form.codebarreEAN13 ? checkDuplicateBarcode(form.codebarreEAN13) : null;

  const loadData = async (reset = true) => {
    if (reset) {
      setLoading(true);
      setProducts([]);
      setLastDoc(null);
    } else {
      setLoadingMore(true);
    }
    try {
      const result = await getProducts(reset ? undefined : lastDoc || undefined);
      if (reset) {
        setProducts(result.products);
      } else {
        setProducts((prev) => [...prev, ...result.products]);
      }
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadCategories = async () => {
    try {
      setLoadingCategories(true);
      const catList = await getCategories();
      setCategories(catList.map(c => c.name));
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    loadData(true);
    loadCategories();
  }, []);

  const openCreate = () => {
    if (!hasWriteAccess) {
      alert("Vous n'avez pas les droits pour creer un produit.");
      return;
    }
    setEditProduct(null);
    setForm({
      code: "",
      name: "",
      description: "",
      category: "",
      unit: "pcs",
      currentStock: "0",
      minStock: "0",
      maxStock: "0",
      location: "",
      codebarreEAN13: "",
      active: true,
      minStockAlarm: true,
    });
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      code: product.code,
      name: product.name,
      description: product.description || "",
      category: product.category,
      unit: product.unit,
      currentStock: String(product.currentStock),
      minStock: String(product.minStock),
      maxStock: product.maxStock ? String(product.maxStock) : "0",
      location: product.location || "",
      codebarreEAN13: product.codebarreEAN13 || "",
      active: product.active ?? true,
      minStockAlarm: product.minStockAlarm ?? true,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!hasWriteAccess) {
      alert("Vous n'avez pas les droits pour modifier les produits.");
      return;
    }
    if (!form.code || !form.name || !form.category) {
      alert("Veuillez remplir les champs obligatoires (code, nom, catégorie)");
      return;
    }

    setSaving(true);
    try {
      const productData = {
        code: form.code.toUpperCase(),
        name: form.name,
        description: form.description,
        category: form.category,
        unit: form.unit,
        currentStock: parseInt(form.currentStock) || 0,
        minStock: parseInt(form.minStock) || 0,
        maxStock: form.maxStock ? parseInt(form.maxStock) : 0,
        location: form.location,
        codebarreEAN13: form.codebarreEAN13 || undefined,
        active: form.active,
        minStockAlarm: form.minStockAlarm,
      };

      if (editProduct) {
        await updateProduct(editProduct.id, productData, appUser?.email);
      } else {
        await addProduct({
          ...productData,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByEmail: appUser?.email,
          updatedByEmail: appUser?.email,
        });
      }

      setShowModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!hasWriteAccess) {
      alert("Vous n'avez pas les droits pour supprimer des produits.");
      return;
    }
    if (!confirm(`Supprimer le produit "${product.name}" ?`)) return;
    try {
      await deleteProduct(product.id);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression");
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      search === "" ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "all" || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  const getStockStatus = (product: Product) => {
    if (!product.active) return "inactive";
    if (product.currentStock === 0) return "danger";
    if (product.minStockAlarm && product.currentStock <= product.minStock) return "warning";
    return "success";
  };

  const getStockBadge = (product: Product) => {
    const status = getStockStatus(product);
    switch (status) {
      case "inactive":
        return <span className="badge" style={{ background: "#e2e8f0", color: "#64748b" }}>Inactif</span>;
      case "danger":
        return <span className="badge badge-danger">Rupture</span>;
      case "warning":
        return <span className="badge badge-warning">Stock bas</span>;
      default:
        return <span className="badge badge-success">OK</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Produits</div>
        <div className="page-subtitle">{products.length} produit(s) en catalogue</div>
      </div>

      <div className="page-content">
        {/* Search - Sticky header */}
        <div
          style={{
            position: "sticky",
            top: "0",
            background: "white",
            zIndex: 10,
            paddingTop: "8px",
            marginBottom: "12px",
          }}
        >
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <Search
              size={16}
              style={{
                position: "absolute",
                left: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
              }}
            />
            <input
              className="form-input"
              style={{ paddingLeft: "36px" }}
              placeholder="Rechercher par nom ou code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category filter */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              paddingBottom: "8px",
            }}
          >
            <button
              key="all"
              onClick={() => setFilterCategory("all")}
              style={{
                padding: "6px 12px",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: filterCategory === "all" ? "#1e40af" : "#e2e8f0",
                background: filterCategory === "all" ? "#1e40af" : "white",
                color: filterCategory === "all" ? "white" : "#64748b",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Tous
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  border: "1px solid",
                  borderColor: filterCategory === cat ? "#1e40af" : "#e2e8f0",
                  background: filterCategory === cat ? "#1e40af" : "white",
                  color: filterCategory === cat ? "white" : "#64748b",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 12px" }} />
            Chargement...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Package size={48} />
            </div>
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>Aucun produit</div>
            <div style={{ fontSize: "13px" }}>Ajoutez votre premier produit avec le bouton +</div>
          </div>
        ) : (
          <>
            {filteredProducts.map((product) => (
              <div key={product.id} className="list-item">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "4px",
                      }}
                    >
                      <span
                        style={{
                          background: "#f1f5f9",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "#475569",
                        }}
                      >
                        {product.code}
                      </span>
                      {getStockBadge(product)}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "2px" }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      {product.category}
                      {product.location && ` • 📍 ${product.location}`}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        marginTop: "6px",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "18px",
                            fontWeight: "700",
                            color:
                              getStockStatus(product) === "danger"
                                ? "#dc2626"
                                : getStockStatus(product) === "warning"
                                  ? "#d97706"
                                  : "#16a34a",
                          }}
                        >
                          {product.currentStock}
                        </span>
                        <span style={{ fontSize: "12px", color: "#64748b" }}> {product.unit}</span>
                      </div>
                      {product.currentStock <= product.minStock && (
                        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#d97706" }}>
                          <AlertTriangle size={12} />
                          <span style={{ fontSize: "11px" }}>Min: {product.minStock}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", marginLeft: "8px" }}>
                    <button
                      onClick={() => openEdit(product)}
                      style={{
                        background: "#f1f5f9",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px",
                        cursor: "pointer",
                        color: "#475569",
                      }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(product)}
                      style={{
                        background: "#fee2e2",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px",
                        cursor: "pointer",
                        color: "#dc2626",
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {/* Infinite scroll loader */}
            {loadingMore && (
              <div style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                <Loader2 size={20} className="animate-spin" style={{ margin: "0 auto", animation: "spin 1s linear infinite" }} />
                <style>{`
                  @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}
            {!hasMore && filteredProducts.length > 0 && (
              <div style={{ textAlign: "center", padding: "16px", color: "#94a3b8", fontSize: "12px" }}>
                Fin de la liste
              </div>
            )}
            <div ref={loaderRef} style={{ height: "1px" }} />
          </>
        )}
      </div>

      {/* FAB */}
      {hasWriteAccess && (
        <button className="fab" onClick={openCreate}>
          <Plus size={24} />
        </button>
      )}

      {/* Bottom Menu */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center p-4 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="relative">
          <div
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
            onClick={() => {
              setShowOperatorMenu(true);
              setShowCategoriesMenu(true);
              setShowAdminMenu(true);
            }}
          >
            <Menu size={28} className="text-gray-600 hover:text-gray-800" />
          </div>

          {/* Operator Menu */}
          {showOperatorMenu && (
            <div className="absolute left-0 bottom-full mb-4 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
              <div className="px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800">Opérateur</h3>
                <button
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowOperatorMenu(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="px-4 py-2">
                <div className="text-sm text-gray-600">Gérer les opérateurs</div>
              </div>
            </div>
          )}

          {/* Categories Menu */}
          {showCategoriesMenu && (
            <div className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
              <div className="px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800">Catégories</h3>
                <button
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowCategoriesMenu(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="px-4 py-2 space-y-2">
                {loadingCategories ? (
                  <div className="text-sm text-gray-500">Chargement...</div>
                ) : (
                  <>
                    {categories.map((cat, index) => (
                      <div key={index} className="flex items-center py-1 text-sm">
                        <span className="flex-1">{cat}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2">
                      <input
                        type="text"
                        placeholder="Nouvelle catégorie"
                        className="w-full px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            const input = e.target as HTMLInputElement;
                            if (input.value.trim()) {
                              addCategory(input.value.trim()).then(() => {
                                input.value = "";
                                loadCategories();
                              });
                            }
                          }
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Admin Menu */}
          {showAdminMenu && (
            <div className="absolute right-0 bottom-full mb-4 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-40">
              <div className="px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-800">Administration</h3>
                <button
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowAdminMenu(false)}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="px-4 py-2 space-y-2">
                {appUser?.role === "admin" ? (
                  <>
                    <div className="text-sm text-gray-600">Gestion des utilisateurs</div>
                    <div className="text-sm text-gray-600">Paramètres système</div>
                  </>
                ) : (
                  <div className="text-sm text-gray-500 italic">Accès réservé aux administrateurs</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>
                {editProduct ? "Modifier le produit" : "Nouveau produit"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Code *</label>
                <input
                  className="form-input"
                  placeholder="EX: PROD001"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  style={{ textTransform: "uppercase" }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Unité *</label>
                <select
                  className="form-input"
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  {UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Nom du produit *</label>
              <input
                className="form-input"
                placeholder="Nom complet du produit"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Catégorie *</label>
              <select
                className="form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <input
                className="form-input"
                placeholder="Description optionnelle"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <div className="form-group">
                <label className="form-label">Stock actuel</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={form.currentStock}
                  onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stock min</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Stock max</label>
                <input
                  className="form-input"
                  type="number"
                  min="0"
                  placeholder="∞"
                  value={form.maxStock}
                  onChange={(e) => setForm({ ...form, maxStock: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Emplacement</label>
              <input
                className="form-input"
                placeholder="Ex: Rayon A, Étagère 3..."
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Code-barres EAN-13</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  className="form-input"
                  placeholder="Ex: 5901234123457"
                  value={form.codebarreEAN13}
                  onChange={(e) => setForm({ ...form, codebarreEAN13: e.target.value.toUpperCase() })}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={() => setShowScanner(true)}
                  className="btn btn-secondary"
                  style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: "4px" , width: "110px"}}
                  title="Scanner un code-barres"
                >
                  <ScanLine size={18} />
                  Scanner
                </button>
              </div>
              {duplicateProduct && (
                <div style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "10px",
                  marginTop: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <AlertTriangle size={16} style={{ color: "#dc2626", flexShrink: 0 }} />
                  <div>
                    <div style={{ color: "#dc2626", fontWeight: "600", fontSize: "13px" }}>
                      Code-barres déjà utilisé
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      Le produit &quot;{duplicateProduct.name}&quot; ({duplicateProduct.code}) utilise déjà ce code-barres
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Checkboxes for active and alarm */}
            <div style={{ display: "flex", gap: "16px", marginTop: "8px", marginBottom: "16px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  style={{ width: "18px", height: "18px" }}
                />
                <span>Produit actif</span>
              </label>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.minStockAlarm}
                  onChange={(e) => setForm({ ...form, minStockAlarm: e.target.checked })}
                  style={{ width: "18px", height: "18px" }}
                />
                <span>Alarme stock minimum</span>
              </label>
            </div>

            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving
                ? "Enregistrement..."
                : editProduct
                  ? "✏️ Modifier le produit"
                  : "➕ Ajouter le produit"}
            </button>
          </div>
        </div>
      )}

      {/* Product Barcode Scanner */}
      <ProductBarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onCodeDetected={handleBarcodeDetected}
      />
    </div>
  );
}