"use client";

import { useState, useEffect } from "react";
import { Plus, X, CheckCircle, Eye, Trash2, PackageMinus } from "lucide-react";
import { getSorties, addSortie, validateSortie, getProducts } from "@/lib/firestore";
import type { BonSortie, BonSortieItem, Product } from "@/lib/types";
import ExportButton from "@/components/ExportButton";
import {
  exportSortiePDF,
  exportSortieExcel,
  exportSortieWord,
} from "@/lib/exportUtils";

export default function SortiePage() {
  const [sorties, setSorties] = useState<BonSortie[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<BonSortie | null>(null);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);

  const [form, setForm] = useState({
    destination: "",
    requestedBy: "",
    operator: "",
    notes: "",
    items: [] as BonSortieItem[],
  });

  const [newItem, setNewItem] = useState({
    productId: "",
    quantityRequested: "",
    quantityDelivered: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [sors, prods] = await Promise.all([getSorties(), getProducts()]);
      setSorties(sors);
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

  const generateNumber = () => {
    const now = new Date();
    return `BS-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getTime()).slice(-4)}`;
  };

  const addItem = () => {
    if (!newItem.productId || !newItem.quantityRequested || !newItem.quantityDelivered) {
      alert("Veuillez remplir tous les champs du produit");
      return;
    }
    const product = products.find((p) => p.id === newItem.productId);
    if (!product) return;

    const qtyDelivered = parseInt(newItem.quantityDelivered);
    if (qtyDelivered > product.currentStock) {
      alert(`Stock insuffisant pour ${product.name}. Stock disponible: ${product.currentStock} ${product.unit}`);
      return;
    }

    const item: BonSortieItem = {
      productId: newItem.productId,
      productName: product.name,
      productCode: product.code,
      quantityRequested: parseInt(newItem.quantityRequested),
      quantityDelivered: qtyDelivered,
      unit: product.unit,
    };

    setForm({ ...form, items: [...form.items, item] });
    setNewItem({ productId: "", quantityRequested: "", quantityDelivered: "" });
  };

  const removeItem = (index: number) => {
    setForm({ ...form, items: form.items.filter((_, i) => i !== index) });
  };

  const handleSubmit = async () => {
    if (!form.destination || !form.requestedBy || !form.operator || form.items.length === 0) {
      alert("Veuillez remplir tous les champs et ajouter au moins un produit");
      return;
    }

    setSaving(true);
    try {
      await addSortie({
        number: generateNumber(),
        destination: form.destination,
        requestedBy: form.requestedBy,
        date: new Date(),
        status: "brouillon",
        items: form.items,
        totalItems: form.items.length,
        operator: form.operator,
        notes: form.notes,
        createdAt: new Date(),
      });

      setForm({ destination: "", requestedBy: "", operator: "", notes: "", items: [] });
      setShowModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleValidate = async (sortie: BonSortie) => {
    if (!confirm(`Valider le bon ${sortie.number} ? Cela déduira les quantités du stock.`)) return;

    setValidating(true);
    try {
      await validateSortie(sortie.id, sortie);
      setShowDetail(null);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la validation");
    } finally {
      setValidating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "valide":
        return <span className="badge badge-success">Validé</span>;
      case "annule":
        return <span className="badge badge-danger">Annulé</span>;
      default:
        return <span className="badge badge-warning">Brouillon</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Bons de Sortie</div>
        <div className="page-subtitle">Sortie de produits du stock</div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            Chargement...
          </div>
        ) : sorties.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <PackageMinus size={48} />
            </div>
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>Aucun bon de sortie</div>
            <div style={{ fontSize: "13px" }}>Créez votre premier bon avec le bouton +</div>
          </div>
        ) : (
          sorties.map((sortie) => (
            <div key={sortie.id} className="list-item" onClick={() => setShowDetail(sortie)}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ fontSize: "14px", fontWeight: "700" }}>{sortie.number}</span>
                    {getStatusBadge(sortie.status)}
                  </div>
                  <div style={{ fontSize: "13px", color: "#64748b" }}>
                    Destination: {sortie.destination}
                  </div>
                  <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                    Demandé par: {sortie.requestedBy} • {sortie.totalItems} article(s)
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {sortie.date instanceof Date
                      ? sortie.date.toLocaleDateString("fr-FR")
                      : ""}
                  </div>
                  <Eye size={16} style={{ color: "#94a3b8", marginTop: "4px" }} />
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

      {/* Create Modal */}
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
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Nouveau bon de sortie</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Destination *</label>
              <input
                className="form-input"
                placeholder="Service, chantier, client..."
                value={form.destination}
                onChange={(e) => setForm({ ...form, destination: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Demandé par *</label>
              <input
                className="form-input"
                placeholder="Nom du demandeur"
                value={form.requestedBy}
                onChange={(e) => setForm({ ...form, requestedBy: e.target.value })}
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

            {/* Items section */}
            <div style={{ marginBottom: "16px" }}>
              <label className="form-label">Produits à sortir *</label>

              {form.items.map((item, index) => (
                <div
                  key={index}
                  style={{
                    background: "#f8fafc",
                    borderRadius: "8px",
                    padding: "10px",
                    marginBottom: "8px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600" }}>{item.productName}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      Demandé: {item.quantityRequested} | Livré: {item.quantityDelivered} {item.unit}
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(index)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626" }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              <div
                style={{
                  background: "#fff7ed",
                  borderRadius: "10px",
                  padding: "12px",
                  border: "1px dashed #fb923c",
                }}
              >
                <div style={{ fontSize: "12px", fontWeight: "600", color: "#ea580c", marginBottom: "8px" }}>
                  + Ajouter un produit
                </div>
                <select
                  className="form-input"
                  style={{ marginBottom: "8px" }}
                  value={newItem.productId}
                  onChange={(e) => setNewItem({ ...newItem, productId: e.target.value })}
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.code}] {p.name} - Stock: {p.currentStock} {p.unit}
                    </option>
                  ))}
                </select>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Qté demandée"
                    value={newItem.quantityRequested}
                    onChange={(e) => setNewItem({ ...newItem, quantityRequested: e.target.value })}
                  />
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Qté livrée"
                    value={newItem.quantityDelivered}
                    onChange={(e) => setNewItem({ ...newItem, quantityDelivered: e.target.value })}
                  />
                </div>
                <button
                  onClick={addItem}
                  style={{
                    background: "#ea580c",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    cursor: "pointer",
                    width: "100%",
                  }}
                >
                  Ajouter
                </button>
              </div>
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

            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Enregistrement..." : "💾 Enregistrer le bon"}
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: "700" }}>{showDetail.number}</h2>
                {getStatusBadge(showDetail.status)}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ExportButton
                  onExportPDF={() => exportSortiePDF(showDetail)}
                  onExportExcel={() => exportSortieExcel(showDetail)}
                  onExportWord={() => exportSortieWord(showDetail)}
                />
                <button
                  onClick={() => setShowDetail(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="card" style={{ marginBottom: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Destination</div>
                  <div style={{ fontSize: "14px", fontWeight: "600" }}>{showDetail.destination}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Date</div>
                  <div style={{ fontSize: "14px", fontWeight: "600" }}>
                    {showDetail.date instanceof Date
                      ? showDetail.date.toLocaleDateString("fr-FR")
                      : ""}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Demandé par</div>
                  <div style={{ fontSize: "14px", fontWeight: "600" }}>{showDetail.requestedBy}</div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Opérateur</div>
                  <div style={{ fontSize: "14px", fontWeight: "600" }}>{showDetail.operator}</div>
                </div>
              </div>
            </div>

            <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>
              Détail des produits
            </h3>
            {showDetail.items.map((item, index) => (
              <div
                key={index}
                style={{
                  background: "#f8fafc",
                  borderRadius: "8px",
                  padding: "10px",
                  marginBottom: "8px",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: "600" }}>{item.productName}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Code: {item.productCode}</div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginTop: "4px",
                    fontSize: "12px",
                  }}
                >
                  <span>Demandé: {item.quantityRequested} {item.unit}</span>
                  <span style={{ color: "#dc2626", fontWeight: "600" }}>
                    Livré: {item.quantityDelivered} {item.unit}
                  </span>
                </div>
              </div>
            ))}

            {showDetail.notes && (
              <div
                style={{
                  background: "#fef3c7",
                  borderRadius: "8px",
                  padding: "10px",
                  marginBottom: "12px",
                  fontSize: "13px",
                }}
              >
                📝 {showDetail.notes}
              </div>
            )}

            {showDetail.status === "brouillon" && (
              <button
                className="btn-danger"
                onClick={() => handleValidate(showDetail)}
                disabled={validating}
              >
                <CheckCircle size={18} />
                {validating ? "Validation..." : "Valider et déduire du stock"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
