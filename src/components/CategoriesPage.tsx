"use client";

import { useState, useEffect } from "react";
import { Plus, X, Edit3, Trash2, Package, Loader2 } from "lucide-react";
import { getCategories, addCategory, updateCategory, deleteCategory } from "@/lib/firestore";
import { useAuth } from "@/lib/AuthContext";
import type { Categorie } from "@/lib/types";

export default function CategoriesPage() {
  const { appUser } = useAuth();
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Categorie | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasWriteAccess = appUser ? appUser.role === "admin" || appUser.permissions.produits === "write" : false;

  const loadCategories = async () => {
    setLoading(true);
    try {
      const catList = await getCategories();
      setCategories(catList);
      // Si aucune catégorie, crée "AUTRES" par défaut (si droits)
      if (catList.length === 0 && hasWriteAccess) {
        await addCategory("AUTRES");
        const updatedList = await getCategories();
        setCategories(updatedList);
      }
    } catch (error) {
      console.error("Erreur chargement categories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openCreate = () => {
    if (!hasWriteAccess) {
      alert("Vous n'avez pas les droits pour creer une categorie.");
      return;
    }
    setEditingCategory(null);
    setCategoryName("");
    setShowModal(true);
  };

  const openEdit = (cat: Categorie) => {
    if (!hasWriteAccess) {
      alert("Vous n'avez pas les droits pour modifier une categorie.");
      return;
    }
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!categoryName.trim()) {
      setError("Le nom de la categorie est obligatoire.");
      return;
    }
    const normalizedName = categoryName.trim().toLowerCase();
    if (categories.find(c => c.name.toLowerCase() === normalizedName) &&
        (!editingCategory || editingCategory.name.toLowerCase() !== normalizedName)) {
      setError("Cette categorie existe deja.");
      return;
    }
    if (normalizedName === "autres" && !editingCategory) {
      setError("La categorie AUTRES ne peut pas etre creee manuellement.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: categoryName.trim() }, appUser?.email);
      } else {
        await addCategory(categoryName.trim(), appUser?.email);
      }
      await loadCategories();
      setShowModal(false);
    } catch (error: any) {
      console.error("Erreur sauvegarde categorie:", error);
      setError("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Categorie) => {
    if (!hasWriteAccess) {
      alert("Vous n'avez pas les droits pour supprimer une categorie.");
      return;
    }
    if (cat.name.toLowerCase() === "autres") {
      alert("La categorie AUTRES ne peut pas etre supprimee.");
      return;
    }
    if (!confirm(`Supprimer la categorie "${cat.name}" ?`)) return;
    try {
      await deleteCategory(cat.id);
      await loadCategories();
    } catch (error) {
      console.error("Erreur suppression categorie:", error);
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Categories</div>
        <div className="page-subtitle">{categories.length} categorie(s)</div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            <Loader2 size={32} style={{ margin: "0 auto 12px" }} className="animate-spin" />
            Chargement...
          </div>
        ) : categories.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Package size={48} />
            </div>
            <div style={{ fontWeight: "600", marginBottom: "4px" }}>Aucune categorie</div>
            <div style={{ fontSize: "13px" }}>Ajoutez votre premiere categorie avec le bouton +</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {categories.map((cat) => (
              <div key={cat.id} className="list-item">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <span style={{ fontSize: "15px", fontWeight: "600", color: "#1e293b" }}>{cat.name}</span>
                    {cat.name.toLowerCase() === "autres" && (
                      <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "8px" }}>(par defaut)</span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => openEdit(cat)}
                      style={{
                        background: "#f1f5f9",
                        border: "none",
                        borderRadius: "8px",
                        padding: "8px",
                        cursor: "pointer",
                        color: "#475569",
                      }}
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
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
          </div>
        )}

        {/* FAB */}
        {hasWriteAccess && (
          <button className="fab" onClick={openCreate}>
            <Plus size={24} />
          </button>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-handle" />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>{editingCategory ? "Modifier" : "Nouvelle"} categorie</h2>
              <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "10px", marginBottom: "16px", color: "#dc2626", fontSize: "13px" }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nom de la categorie</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: Electronique"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSave()}
              />
            </div>

            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement..." : editingCategory ? "Enregistrer" : "Creer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
