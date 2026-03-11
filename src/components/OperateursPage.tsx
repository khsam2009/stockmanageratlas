"use client";

import { useState, useEffect } from "react";
import { Plus, X, Search, Edit2, Trash2, Users, Star, Loader2 } from "lucide-react";
import { getOperators, addOperator, updateOperator, deleteOperator } from "@/lib/firestore";
import { useAuth } from "@/lib/AuthContext";
import type { Operator } from "@/lib/types";

export default function OperateursPage() {
  const { appUser } = useAuth();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editOperator, setEditOperator] = useState<Operator | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    name: "",
    code: "",
    role: "",
    phone: "",
    email: "",
    isMain: false,
    active: true,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getOperators();
      setOperators(data);
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
    setEditOperator(null);
    setForm({
      name: "",
      code: "",
      role: "",
      phone: "",
      email: "",
      isMain: false,
      active: true,
    });
    setShowModal(true);
  };

  const openEdit = (operator: Operator) => {
    setEditOperator(operator);
    setForm({
      name: operator.name,
      code: operator.code || "",
      role: operator.role || "",
      phone: operator.phone || "",
      email: operator.email || "",
      isMain: operator.isMain || false,
      active: operator.active ?? true,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      alert("Veuillez entrer le nom de l'opérateur");
      return;
    }

    setSaving(true);
    try {
      if (editOperator) {
        await updateOperator(editOperator.id, {
          name: form.name,
          code: form.code,
          role: form.role,
          phone: form.phone,
          email: form.email,
          isMain: form.isMain,
          active: form.active,
        }, appUser?.email);
      } else {
        await addOperator({
          name: form.name,
          code: form.code,
          role: form.role,
          phone: form.phone,
          email: form.email,
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

  const handleDelete = async (operator: Operator) => {
    if (!confirm(`Supprimer l'opérateur "${operator.name}" ?`)) return;
    try {
      await deleteOperator(operator.id);
      await loadData();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression");
    }
  };

  const filteredOperators = operators.filter((o) => {
    const matchSearch =
      search === "" ||
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      (o.code && o.code.toLowerCase().includes(search.toLowerCase())) ||
      (o.role && o.role.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  const mainOperator = operators.find((o) => o.isMain);

  const ROLES = [
    "Magasinier",
    "Responsable stock",
    "Technicien",
    "Superviseur",
    "Chef de dépôt",
    "Administrateur",
    "Autre",
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Opérateurs</div>
        <div className="page-subtitle">{operators.length} opérateur(s)</div>
      </div>

      {/* Main operator banner */}
      {mainOperator && (
        <div
          style={{
            background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
            border: "1px solid #3b82f6",
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
              background: "#3b82f6",
              borderRadius: "50%",
              padding: "8px",
              display: "flex",
            }}
          >
            <Star size={20} fill="white" color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "12px", color: "#1e40af", fontWeight: "600" }}>OPÉRATEUR PRINCIPAL</div>
            <div style={{ fontSize: "16px", fontWeight: "700", color: "#1e3a8a" }}>{mainOperator.name}</div>
            {mainOperator.role && (
              <div style={{ fontSize: "12px", color: "#1d4ed8" }}>{mainOperator.role} • {mainOperator.phone}</div>
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
              placeholder="Rechercher par nom, code ou rôle..."
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
        ) : filteredOperators.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Users size={48} />
            </div>
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>Aucun opérateur</div>
            <div style={{ fontSize: "13px" }}>Ajoutez votre premier opérateur avec le bouton +</div>
          </div>
        ) : (
          filteredOperators.map((operator) => (
            <div key={operator.id} className="list-item">
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
                    {operator.isMain && (
                      <span
                        style={{
                          background: "#dbeafe",
                          color: "#1e40af",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <Star size={10} fill="#1e40af" /> PRINCIPAL
                      </span>
                    )}
                    {!operator.active && (
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
                    {operator.name}
                  </div>
                  {operator.code && (
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                      Code: {operator.code}
                    </div>
                  )}
                  <div style={{ fontSize: "12px", color: "#64748b" }}>
                    {operator.role && <span>👤 {operator.role}</span>}
                    {operator.role && operator.phone && <span> • </span>}
                    {operator.phone && <span>📞 {operator.phone}</span>}
                    {(operator.role || operator.phone) && operator.email && <span> • </span>}
                    {operator.email && <span>✉️ {operator.email}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginLeft: "8px" }}>
                  <button
                    onClick={() => openEdit(operator)}
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
                    onClick={() => handleDelete(operator)}
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
                {editOperator ? "Modifier l'opérateur" : "Nouvel opérateur"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Nom de l&apos;opérateur *</label>
              <input
                className="form-input"
                placeholder="Nom complet de l'opérateur"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Code opérateur</label>
              <input
                className="form-input"
                placeholder="Code identifiant (ex: OP001)"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                style={{ textTransform: "uppercase" }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Rôle / Fonction</label>
              <select
                className="form-input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="">Sélectionner un rôle</option>
                {ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
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
                  placeholder="email@operateur.ma"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px",
                background: form.isMain ? "#dbeafe" : "#f8fafc",
                borderRadius: "8px",
                border: form.isMain ? "1px solid #3b82f6" : "1px solid #e2e8f0",
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
                <div style={{ fontWeight: "600", fontSize: "14px", color: form.isMain ? "#1e40af" : "#334155" }}>
                  ⭐ Opérateur principal
                </div>
                <div style={{ fontSize: "12px", color: form.isMain ? "#1d4ed8" : "#64748b" }}>
                  Cet opérateur sera affiché en priorité
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
                  {form.active ? "L'opérateur peut être utilisé" : "L'opérateur n'est pas disponible"}
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
              ) : editOperator ? (
                "Mettre à jour"
              ) : (
                "Créer l'opérateur"
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
