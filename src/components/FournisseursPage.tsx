"use client";

import { useState, useEffect } from "react";
import { Plus, X, Search, Edit2, Trash2, Truck, Star, Loader2 } from "lucide-react";
import { getSuppliers, addSupplier, updateSupplier, deleteSupplier } from "@/lib/firestore";
import { useAuth } from "@/lib/AuthContext";
import type { Supplier } from "@/lib/types";

export default function FournisseursPage() {
  const { appUser } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    contact: "",
    phone: "",
    email: "",
    address: "",
    isMain: false,
    active: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data);
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
    setEditSupplier(null);
    setForm({
      name: "",
      code: "",
      contact: "",
      phone: "",
      email: "",
      address: "",
      isMain: false,
      active: true,
    });
    setShowModal(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditSupplier(supplier);
    setForm({
      name: supplier.name,
      code: supplier.code || "",
      contact: supplier.contact || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      address: supplier.address || "",
      isMain: supplier.isMain || false,
      active: supplier.active ?? true,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      alert("Veuillez entrer le nom du fournisseur");
      return;
    }

    setSaving(true);
    try {
      if (editSupplier) {
        await updateSupplier(editSupplier.id, {
          name: form.name,
          code: form.code,
          contact: form.contact,
          phone: form.phone,
          email: form.email,
          address: form.address,
          isMain: form.isMain,
          active: form.active,
        }, appUser?.email);
      } else {
        await addSupplier({
          name: form.name,
          code: form.code,
          contact: form.contact,
          phone: form.phone,
          email: form.email,
          address: form.address,
          isMain: form.isMain,
          active: form.active,
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

  const handleDelete = async (supplier: Supplier) => {
    if (!confirm(`Supprimer le fournisseur "${supplier.name}" ?`)) return;
    try {
      await deleteSupplier(supplier.id);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression");
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const matchSearch =
      search === "" ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(search.toLowerCase())) ||
      (s.contact && s.contact.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  const mainSupplier = suppliers.find((s) => s.isMain);

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Fournisseurs</div>
        <div className="page-subtitle">{suppliers.length} fournisseur(s)</div>
      </div>

      {/* Main supplier banner */}
      {mainSupplier && (
        <div
          style={{
            background: "linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)",
            border: "1px solid #fbbf24",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              background: "#fbbf24",
              borderRadius: "50%",
              padding: "8px",
              display: "flex",
            }}
          >
            <Star size={20} fill="white" color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", color: "#92400e", fontWeight: "600" }}>FOURNISSEUR PRINCIPAL</div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#78350f" }}>{mainSupplier.name}</div>
            {mainSupplier.contact && (
              <div style={{ fontSize: "12px", color: "#a16207" }}>{mainSupplier.contact} • {mainSupplier.phone}</div>
            )}
          </div>
        </div>
      )}

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
          <div style={{ position: "relative" }}>
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
              placeholder="Rechercher par nom, code ou contact..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: "0 auto 12px" }} />
            Chargement...
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Truck size={48} />
            </div>
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>Aucun fournisseur</div>
            <div style={{ fontSize: "13px" }}>Ajoutez votre premier fournisseur avec le bouton +</div>
          </div>
        ) : (
          filteredSuppliers.map((supplier) => (
            <div key={supplier.id} className="list-item">
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
                    {supplier.isMain && (
                      <span
                        style={{
                          background: "#fef3c7",
                          color: "#92400e",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Star size={10} fill="#92400e" /> PRINCIPAL
                      </span>
                    )}
                    {!supplier.active && (
                      <span
                        style={{
                          background: "#e2e8f0",
                          color: "#64748b",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: "600",
                        }}
                      >
                        INACTIF
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "2px" }}>
                    {supplier.name}
                  </div>
                  {supplier.code && (
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                      Code: {supplier.code}
                    </div>
                  )}
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {supplier.contact && <span>👤 {supplier.contact}</span>}
                    {supplier.contact && supplier.phone && <span> • </span>}
                    {supplier.phone && <span>📞 {supplier.phone}</span>}
                    {(supplier.contact || supplier.phone) && supplier.email && <span> • </span>}
                    {supplier.email && <span>✉️ {supplier.email}</span>}
                  </div>
                  {supplier.address && (
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
                      📍 {supplier.address}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "8px", marginLeft: "8px" }}>
                  <button
                    onClick={() => openEdit(supplier)}
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
                    onClick={() => handleDelete(supplier)}
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
                {editSupplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Nom du fournisseur *</label>
              <input
                className="form-input"
                placeholder="Nom complet du fournisseur"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Code fournisseur</label>
              <input
                className="form-input"
                placeholder="Code identifiant (ex: FOURN001)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Personne de contact</label>
              <input
                className="form-input"
                placeholder="Nom du contact"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input
                  className="form-input"
                  placeholder="+212 6XX XXX XXX"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="contact@fournisseur.ma"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Adresse</label>
              <input
                className="form-input"
                placeholder="Adresse complète"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                background: form.isMain ? "#fef3c7" : "#f8fafc",
                borderRadius: "8px",
                border: form.isMain ? "1px solid #fbbf24" : "1px solid #e2e8f0",
                cursor: "pointer",
              }}
              onClick={() => setForm({ ...form, isMain: !form.isMain })}
            >
              <input
                type="checkbox"
                checked={form.isMain}
                onChange={(e) => setForm({ ...form, isMain: e.target.checked })}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", fontSize: "14px", color: form.isMain ? "#92400e" : "#334155" }}>
                  ⭐ Fournisseur principal
                </div>
                <div style={{ fontSize: "12px", color: form.isMain ? "#b45309" : "#64748b" }}>
                  Ce fournisseur sera affiché en priorité
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                background: form.active ? "#f0fdf4" : "#fef2f2",
                borderRadius: "8px",
                border: form.active ? "1px solid #22c55e" : "1px solid #ef4444",
                cursor: "pointer",
                marginTop: "12px",
              }}
              onClick={() => setForm({ ...form, active: !form.active })}
            >
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "600", fontSize: "14px", color: form.active ? "#166534" : "#991b1b" }}>
                  {form.active ? "✅ Actif" : "❌ Inactif"}
                </div>
                <div style={{ fontSize: "12px", color: form.active ? "#15803d" : "#b91c1c" }}>
                  {form.active ? "Le fournisseur peut être utilisé" : "Le fournisseur n'est pas disponible"}
                </div>
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={saving}
              style={{ marginTop: "20px", width: "100%" }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ marginRight: "8px" }} />
                  Enregistrement...
                </>
              ) : editSupplier ? (
                "Mettre à jour"
              ) : (
                "Créer le fournisseur"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
