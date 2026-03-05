"use client";

import { useState, useEffect } from "react";
import { Plus, X, CheckCircle, Eye, ClipboardList, AlertTriangle } from "lucide-react";
import { getInventories, addInventory, updateInventory, validateInventory, getProducts } from "@/lib/firestore";
import type { Inventory, InventoryItem, Product } from "@/lib/types";
import ExportButton from "@/components/ExportButton";
import {
  exportInventairePDF,
  exportInventaireExcel,
  exportInventaireWord,
} from "@/lib/exportUtils";

export default function InventairePage() {
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<Inventory | null>(null);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [activeTab, setActiveTab] = useState<"annuel" | "intermediaire">("annuel");

  const [form, setForm] = useState({
    type: "annuel" as "annuel" | "intermediaire",
    name: "",
    operator: "",
    notes: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [invs, prods] = await Promise.all([getInventories(), getProducts()]);
      setInventories(invs);
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

  const handleCreateInventory = async () => {
    if (!form.name || !form.operator) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    setSaving(true);
    try {
      // Create inventory items from current stock
      const items: InventoryItem[] = products.map((p) => ({
        productId: p.id,
        productName: p.name,
        productCode: p.code,
        theoreticalStock: p.currentStock,
        physicalStock: p.currentStock, // Default to theoretical
        difference: 0,
        unit: p.unit,
      }));

      await addInventory({
        type: form.type,
        name: form.name,
        startDate: new Date(),
        status: "en_cours",
        items,
        operator: form.operator,
        notes: form.notes,
        createdAt: new Date(),
      });

      setForm({ type: "annuel", name: "", operator: "", notes: "" });
      setShowModal(false);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePhysicalStock = async (
    inventory: Inventory,
    itemIndex: number,
    physicalStock: number
  ) => {
    const updatedItems = [...inventory.items];
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      physicalStock,
      difference: physicalStock - updatedItems[itemIndex].theoreticalStock,
    };

    const updatedInventory = { ...inventory, items: updatedItems };
    setShowDetail(updatedInventory);

    try {
      await updateInventory(inventory.id, { items: updatedItems });
    } catch (error) {
      console.error(error);
    }
  };

  const handleValidate = async (inventory: Inventory) => {
    if (!confirm(`Valider l'inventaire "${inventory.name}" ? Cela ajustera les stocks.`)) return;

    setValidating(true);
    try {
      await validateInventory(inventory.id, inventory);
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
      case "en_cours":
        return <span className="badge badge-info">En cours</span>;
      default:
        return <span className="badge badge-gray">Terminé</span>;
    }
  };

  const filteredInventories = inventories.filter((inv) => inv.type === activeTab);

  const getDifferenceColor = (diff: number) => {
    if (diff > 0) return "#16a34a";
    if (diff < 0) return "#dc2626";
    return "#64748b";
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Inventaires</div>
        <div className="page-subtitle">Inventaire annuel et intermédiaire</div>
      </div>

      <div className="page-content">
        {/* Tab selector */}
        <div className="tab-bar">
          <button
            className={`tab-item ${activeTab === "annuel" ? "active" : ""}`}
            onClick={() => setActiveTab("annuel")}
            style={{ border: "none", background: "none", cursor: "pointer" }}
          >
            📅 Annuel
          </button>
          <button
            className={`tab-item ${activeTab === "intermediaire" ? "active" : ""}`}
            onClick={() => setActiveTab("intermediaire")}
            style={{ border: "none", background: "none", cursor: "pointer" }}
          >
            🔄 Intermédiaire
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            Chargement...
          </div>
        ) : filteredInventories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <ClipboardList size={48} />
            </div>
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>
              Aucun inventaire {activeTab}
            </div>
            <div style={{ fontSize: "13px" }}>Créez un inventaire avec le bouton +</div>
          </div>
        ) : (
          filteredInventories.map((inventory) => (
            <div
              key={inventory.id}
              className="list-item"
              onClick={() => setShowDetail(inventory)}
            >
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
                    <span style={{ fontSize: "14px", fontWeight: "700" }}>{inventory.name}</span>
                    {getStatusBadge(inventory.status)}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {inventory.items.length} produits • Par {inventory.operator}
                  </div>
                  <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                    Début:{" "}
                    {inventory.startDate instanceof Date
                      ? inventory.startDate.toLocaleDateString("fr-FR")
                      : ""}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {inventory.items.filter((i) => i.difference !== 0).length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#d97706" }}>
                      <AlertTriangle size={14} />
                      <span style={{ fontSize: "12px" }}>
                        {inventory.items.filter((i) => i.difference !== 0).length} écarts
                      </span>
                    </div>
                  )}
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
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Nouvel inventaire</h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="tab-bar" style={{ marginBottom: "16px" }}>
              <button
                className={`tab-item ${form.type === "annuel" ? "active" : ""}`}
                onClick={() => setForm({ ...form, type: "annuel" })}
                style={{ border: "none", background: "none", cursor: "pointer" }}
              >
                📅 Annuel
              </button>
              <button
                className={`tab-item ${form.type === "intermediaire" ? "active" : ""}`}
                onClick={() => setForm({ ...form, type: "intermediaire" })}
                style={{ border: "none", background: "none", cursor: "pointer" }}
              >
                🔄 Intermédiaire
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Nom de l&apos;inventaire *</label>
              <input
                className="form-input"
                placeholder={
                  form.type === "annuel"
                    ? "Ex: Inventaire annuel 2024"
                    : "Ex: Inventaire Q1 2024"
                }
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Responsable *</label>
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

            <div
              className="alert alert-warning"
              style={{ marginBottom: "16px" }}
            >
              <AlertTriangle size={16} />
              <div style={{ fontSize: "12px" }}>
                L&apos;inventaire sera créé avec les stocks théoriques actuels. Vous pourrez ensuite
                saisir les stocks physiques.
              </div>
            </div>

            <button className="btn-primary" onClick={handleCreateInventory} disabled={saving}>
              {saving ? "Création..." : "📋 Créer l'inventaire"}
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight: "95vh" }}
          >
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
                <h2 style={{ fontSize: "16px", fontWeight: "700" }}>{showDetail.name}</h2>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "4px" }}>
                  {getStatusBadge(showDetail.status)}
                  <span className={`badge ${showDetail.type === "annuel" ? "badge-info" : "badge-gray"}`}>
                    {showDetail.type === "annuel" ? "Annuel" : "Intermédiaire"}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <ExportButton
                  onExportPDF={() => exportInventairePDF(showDetail)}
                  onExportExcel={() => exportInventaireExcel(showDetail)}
                  onExportWord={() => exportInventaireWord(showDetail)}
                />
                <button
                  onClick={() => setShowDetail(null)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="card" style={{ marginBottom: "12px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", textAlign: "center" }}>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "700" }}>
                    {showDetail.items.length}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Produits</div>
                </div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: "#16a34a" }}>
                    {showDetail.items.filter((i) => i.difference > 0).length}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Excédents</div>
                </div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "700", color: "#dc2626" }}>
                    {showDetail.items.filter((i) => i.difference < 0).length}
                  </div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>Manquants</div>
                </div>
              </div>
            </div>

            {/* Items list */}
            <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "8px" }}>
              Comptage des produits
            </h3>

            {showDetail.items.map((item, index) => (
              <div
                key={item.productId}
                style={{
                  background: "#f8fafc",
                  borderRadius: "10px",
                  padding: "12px",
                  marginBottom: "8px",
                  border: item.difference !== 0 ? "1px solid #fde68a" : "1px solid transparent",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "8px",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "600" }}>{item.productName}</div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>{item.productCode}</div>
                  </div>
                  {item.difference !== 0 && (
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: getDifferenceColor(item.difference),
                      }}
                    >
                      {item.difference > 0 ? "+" : ""}
                      {item.difference} {item.unit}
                    </span>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px" }}>
                      Stock théorique
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>
                      {item.theoreticalStock} {item.unit}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "2px" }}>
                      Stock physique
                    </div>
                    {showDetail.status === "en_cours" ? (
                      <input
                        type="number"
                        className="form-input"
                        style={{ padding: "6px 10px", fontSize: "14px" }}
                        value={item.physicalStock}
                        onChange={(e) =>
                          handleUpdatePhysicalStock(showDetail, index, parseInt(e.target.value) || 0)
                        }
                      />
                    ) : (
                      <div style={{ fontSize: "14px", fontWeight: "600" }}>
                        {item.physicalStock} {item.unit}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {showDetail.status === "en_cours" && (
              <button
                className="btn-success"
                onClick={() => handleValidate(showDetail)}
                disabled={validating}
                style={{ marginTop: "8px" }}
              >
                <CheckCircle size={18} />
                {validating ? "Validation..." : "Valider et ajuster les stocks"}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
