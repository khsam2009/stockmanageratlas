"use client";

import { useState, useEffect } from "react";
import { Plus, X, Search, Edit2, Trash2, Package, AlertTriangle } from "lucide-react";
import { getProducts, addProduct, updateProduct, deleteProduct } from "@/lib/firestore";
import type { Product } from "@/lib/types";

const CATEGORIES = [
  "Linge de lit",
  "Linge de bain",
  "Matelas 01 place",
  "Matelas 01 place rouler",
  "Matelas 02 places",
  "Matelas 02 places rouler",
  "Sommier 01 place",
  "Sommier 02 places",
  "Tete de lit 01 place",
  "Tete de lit 02 places",
  "Meuble de Maison",
  "Emballages",
  "Autres",
];

const UNITS = ["pcs", "kg", "g", "L", "mL", "m", "cm", "m²", "m³", "boîte", "carton", "palette"];

export default function ProduitsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

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
    active: true,
    minStockAlarm: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const prods = await getProducts();
      setProducts(prods);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
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
      active: product.active ?? true,
      minStockAlarm: product.minStockAlarm ?? true,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
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
        maxStock: form.maxStock ? parseInt(form.maxStock) : undefined,
        location: form.location,
        active: form.active,
        minStockAlarm: form.minStockAlarm,
      };

      if (editProduct) {
        await updateProduct(editProduct.id, productData);
      } else {
        await addProduct({
          ...productData,
          createdAt: new Date(),
          updatedAt: new Date(),
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
    if (!confirm(`Supprimer le produit "${product.name}" ?`)) return;
    try {
      await deleteProduct(product.id);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression");
    }
  };

  const categories = ["all", ...CATEGORIES];

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
        {/* Search */}
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
            marginBottom: "12px",
          }}
        >
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
              {cat === "all" ? "Tous" : cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
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
          filteredProducts.map((product) => (
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
                        <AlertTriangle size={13} />
                        <span style={{ fontSize: "12px" }}>Min: {product.minStock}</span>
                      </div>
                    )}
                    {product.currentStock > product.minStock && (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#0673d9" }}>
                        <AlertTriangle size={13} />
                        <span style={{ fontSize: "12px" }}>Min: {product.minStock}</span>
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
          ))
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={openCreate}>
        <Plus size={24} />
      </button>

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
                {CATEGORIES.map((cat) => (
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
                  placeholder="0"
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
    </div>
  );
}
