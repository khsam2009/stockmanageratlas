"use client";

import { useState, useEffect } from "react";
import { Plus, TrendingUp, TrendingDown, Search, X, Filter } from "lucide-react";
import { getMovements, addMovement, getProducts } from "@/lib/firestore";
import type { StockMovement, Product } from "@/lib/types";
import ExportButton from "@/components/ExportButton";
import {
  exportMouvementsPDF,
  exportMouvementsExcel,
  exportMouvementsWord,
} from "@/lib/exportUtils";

export default function MouvementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<"all" | "entree" | "sortie">("all");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    type: "entree" as "entree" | "sortie",
    productId: "",
    quantity: "",
    reason: "",
    reference: "",
    operator: "",
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [movs, prods] = await Promise.all([getMovements(), getProducts()]);
      setMovements(movs);
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

  const filteredMovements = movements.filter((m) => {
    const matchFilter = filter === "all" || m.type === filter;
    const matchSearch =
      search === "" ||
      m.productName.toLowerCase().includes(search.toLowerCase()) ||
      m.reason.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleSubmit = async () => {
    if (!form.productId || !form.quantity || !form.reason || !form.operator) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    const product = products.find((p) => p.id === form.productId);
    if (!product) return;

    const qty = parseInt(form.quantity);
    if (form.type === "sortie" && qty > product.currentStock) {
      alert(`Stock insuffisant. Stock disponible: ${product.currentStock} ${product.unit}`);
      return;
    }

    setSaving(true);
    try {
      await addMovement({
        type: form.type,
        productId: form.productId,
        productName: product.name,
        productCode: product.code,
        quantity: qty,
        reason: form.reason,
        reference: form.reference,
        operator: form.operator,
        date: new Date(),
        notes: form.notes,
      });

      setForm({
        type: "entree",
        productId: "",
        quantity: "",
        reason: "",
        reference: "",
        operator: "",
        notes: "",
      });
      setShowModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div className="page-title">Mouvements de Stock</div>
            <div className="page-subtitle">Entrées et sorties de produits</div>
          </div>
          <div style={{ paddingTop: "4px" }}>
            <ExportButton
              onExportPDF={() => exportMouvementsPDF(filteredMovements)}
              onExportExcel={() => exportMouvementsExcel(filteredMovements)}
              onExportWord={() => exportMouvementsWord(filteredMovements)}
            />
          </div>
        </div>
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
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filter tabs */}
        <div className="tab-bar">
          {[
            { id: "all", label: "Tous" },
            { id: "entree", label: "Entrées" },
            { id: "sortie", label: "Sorties" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`tab-item ${filter === tab.id ? "active" : ""}`}
              onClick={() => setFilter(tab.id as "all" | "entree" | "sortie")}
              style={{ border: "none", background: "none", cursor: "pointer" }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Movements list */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            Chargement...
          </div>
        ) : filteredMovements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Filter size={48} />
            </div>
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>Aucun mouvement</div>
            <div style={{ fontSize: "13px" }}>Ajoutez un mouvement avec le bouton +</div>
          </div>
        ) : (
          filteredMovements.map((movement) => (
            <div key={movement.id} className="list-item">
              <div
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
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
                      <TrendingUp size={18} />
                    ) : (
                      <TrendingDown size={18} />
                    )}
                  </div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>
                      {movement.productName}
                    </div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      {movement.reason}
                      {movement.reference && ` • Réf: ${movement.reference}`}
                    </div>
                    <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                      Par {movement.operator} •{" "}
                      {movement.date instanceof Date
                        ? movement.date.toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: movement.type === "entree" ? "#16a34a" : "#dc2626",
                    }}
                  >
                    {movement.type === "entree" ? "+" : "-"}
                    {movement.quantity}
                  </div>
                  <span
                    className={`badge ${movement.type === "entree" ? "badge-success" : "badge-danger"}`}
                  >
                    {movement.type === "entree" ? "Entrée" : "Sortie"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setShowModal(true)}>
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
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Nouveau mouvement</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Type selector */}
            <div className="tab-bar" style={{ marginBottom: "16px" }}>
              <button
                className={`tab-item ${form.type === "entree" ? "active" : ""}`}
                onClick={() => setForm({ ...form, type: "entree" })}
                style={{ border: "none", background: "none", cursor: "pointer" }}
              >
                📥 Entrée
              </button>
              <button
                className={`tab-item ${form.type === "sortie" ? "active" : ""}`}
                onClick={() => setForm({ ...form, type: "sortie" })}
                style={{ border: "none", background: "none", cursor: "pointer" }}
              >
                📤 Sortie
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Produit *</label>
              <select
                className="form-input"
                value={form.productId}
                onChange={(e) => setForm({ ...form, productId: e.target.value })}
              >
                <option value="">Sélectionner un produit</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.name} - Stock: {p.currentStock} {p.unit}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantité *</label>
              <input
                className="form-input"
                type="number"
                min="1"
                placeholder="0"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Motif *</label>
              <input
                className="form-input"
                placeholder="Ex: Achat fournisseur, Utilisation atelier..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Référence</label>
              <input
                className="form-input"
                placeholder="N° de commande, bon..."
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Opérateur *</label>
              <input
                className="form-input"
                placeholder="Votre nom"
                value={form.operator}
                onChange={(e) => setForm({ ...form, operator: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Remarques..."
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>

            <button
              className={form.type === "entree" ? "btn-success" : "btn-danger"}
              onClick={handleSubmit}
              disabled={saving}
            >
              {saving
                ? "Enregistrement..."
                : form.type === "entree"
                  ? "✅ Enregistrer l'entrée"
                  : "📤 Enregistrer la sortie"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
