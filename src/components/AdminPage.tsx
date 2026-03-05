"use client";

import { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Shield,
  ShieldOff,
  Trash2,
  Edit3,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getAllUsers, createAppUser, updateAppUser, deleteAppUser } from "@/lib/auth";
import { useAuth } from "@/lib/AuthContext";
import type { AppUser, CreateUserData, PagePermission } from "@/lib/types";

const ALL_PERMISSIONS: { id: PagePermission; label: string }[] = [
  { id: "dashboard", label: "Tableau de bord" },
  { id: "mouvements", label: "Mouvements" },
  { id: "reception", label: "Bon de réception" },
  { id: "sortie", label: "Bon de sortie" },
  { id: "inventaire", label: "Inventaire" },
  { id: "produits", label: "Produits" },
];

// ==================== CREATE USER MODAL ====================

interface CreateUserModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateUserModal({ onClose, onCreated }: CreateUserModalProps) {
  const [form, setForm] = useState<CreateUserData>({
    email: "",
    password: "",
    displayName: "",
    role: "user",
    permissions: ["dashboard"],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePermission = (perm: PagePermission) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email || !form.password || !form.displayName) {
      setError("Tous les champs sont obligatoires.");
      return;
    }
    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    try {
      await createAppUser(form);
      onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création.";
      if (msg.includes("auth/email-already-in-use")) {
        setError("Cet email est déjà utilisé.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px 20px 0 0",
          padding: "24px",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            Créer un utilisateur
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "8px",
              padding: "6px",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <X size={18} color="#64748b" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Nom complet</label>
            <input
              type="text"
              value={form.displayName}
              onChange={(e) => setForm({ ...form, displayName: e.target.value })}
              placeholder="Jean Dupont"
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="jean@exemple.com"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Mot de passe</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Min. 6 caractères"
                style={{ ...inputStyle, paddingRight: "44px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#94a3b8",
                  display: "flex",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Rôle</label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value as "admin" | "user" })
              }
              style={inputStyle}
            >
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          {/* Permissions (only for non-admin) */}
          {form.role === "user" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Accès aux pages</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginTop: "6px",
                }}
              >
                {ALL_PERMISSIONS.map((perm) => (
                  <button
                    key={perm.id}
                    type="button"
                    onClick={() => togglePermission(perm.id)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid",
                      borderColor: form.permissions.includes(perm.id) ? "#2563eb" : "#e2e8f0",
                      background: form.permissions.includes(perm.id) ? "#eff6ff" : "white",
                      color: form.permissions.includes(perm.id) ? "#2563eb" : "#64748b",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {form.permissions.includes(perm.id) ? (
                      <Check size={14} />
                    ) : (
                      <div style={{ width: 14 }} />
                    )}
                    {perm.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {form.role === "admin" && (
            <div
              style={{
                background: "#fef3c7",
                border: "1px solid #fde68a",
                borderRadius: "10px",
                padding: "10px 12px",
                marginBottom: "20px",
                fontSize: "13px",
                color: "#92400e",
              }}
            >
              Les administrateurs ont accès à toutes les pages.
            </div>
          )}

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                padding: "10px 12px",
                marginBottom: "16px",
                color: "#dc2626",
                fontSize: "13px",
              }}
            >
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: loading ? "#93c5fd" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Création..." : "Créer le compte"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==================== EDIT USER MODAL ====================

interface EditUserModalProps {
  user: AppUser;
  onClose: () => void;
  onUpdated: () => void;
}

function EditUserModal({ user, onClose, onUpdated }: EditUserModalProps) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [role, setRole] = useState<"admin" | "user">(user.role);
  const [permissions, setPermissions] = useState<PagePermission[]>(user.permissions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePermission = (perm: PagePermission) => {
    setPermissions((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await updateAppUser(user.uid, { displayName, role, permissions });
      onUpdated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1000,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "white",
          borderRadius: "20px 20px 0 0",
          padding: "24px",
          width: "100%",
          maxWidth: "500px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            Modifier l&apos;utilisateur
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "8px",
              padding: "6px",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <X size={18} color="#64748b" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Nom complet</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Email (non modifiable)</label>
            <input type="email" value={user.email} disabled style={{ ...inputStyle, background: "#f8fafc", color: "#94a3b8" }} />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={labelStyle}>Rôle</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as "admin" | "user")}
              style={inputStyle}
            >
              <option value="user">Utilisateur</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>

          {role === "user" && (
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Accès aux pages</label>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginTop: "6px",
                }}
              >
                {ALL_PERMISSIONS.map((perm) => (
                  <button
                    key={perm.id}
                    type="button"
                    onClick={() => togglePermission(perm.id)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1.5px solid",
                      borderColor: permissions.includes(perm.id) ? "#2563eb" : "#e2e8f0",
                      background: permissions.includes(perm.id) ? "#eff6ff" : "white",
                      color: permissions.includes(perm.id) ? "#2563eb" : "#64748b",
                      fontSize: "13px",
                      fontWeight: "500",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {permissions.includes(perm.id) ? <Check size={14} /> : <div style={{ width: 14 }} />}
                    {perm.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "10px",
                padding: "10px 12px",
                marginBottom: "16px",
                color: "#dc2626",
                fontSize: "13px",
              }}
            >
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "13px",
              background: loading ? "#93c5fd" : "#2563eb",
              color: "white",
              border: "none",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==================== MAIN ADMIN PAGE ====================

export default function AdminPage() {
  const { appUser } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const list = await getAllUsers();
      setUsers(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleActive = async (user: AppUser) => {
    setActionLoading(user.uid);
    try {
      await updateAppUser(user.uid, { active: !user.active });
      await loadUsers();
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (user: AppUser) => {
    if (!confirm(`Supprimer le compte de ${user.displayName} ?`)) return;
    setActionLoading(user.uid);
    try {
      await deleteAppUser(user.uid);
      await loadUsers();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div style={{ padding: "16px", maxWidth: "600px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
            Administration
          </h1>
          <p style={{ fontSize: "13px", color: "#64748b", margin: "2px 0 0" }}>
            Gestion des utilisateurs
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 14px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "10px",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          <UserPlus size={16} />
          Nouveau
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            background: "#eff6ff",
            borderRadius: "12px",
            padding: "14px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#2563eb" }}>
            {users.length}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>Total utilisateurs</div>
        </div>
        <div
          style={{
            background: "#f0fdf4",
            borderRadius: "12px",
            padding: "14px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: "700", color: "#16a34a" }}>
            {users.filter((u) => u.active).length}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>Actifs</div>
        </div>
      </div>

      {/* User List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
          Chargement...
        </div>
      ) : users.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            color: "#94a3b8",
            background: "#f8fafc",
            borderRadius: "12px",
          }}
        >
          <Users size={32} style={{ marginBottom: "8px", opacity: 0.4 }} />
          <p>Aucun utilisateur</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {users.map((user) => (
            <div
              key={user.uid}
              style={{
                background: "white",
                borderRadius: "14px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                opacity: user.active ? 1 : 0.6,
              }}
            >
              {/* User Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "14px",
                  gap: "12px",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: user.role === "admin" ? "#fef3c7" : "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "16px",
                    fontWeight: "700",
                    color: user.role === "admin" ? "#d97706" : "#2563eb",
                  }}
                >
                  {user.displayName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#1e293b",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {user.displayName}
                    </span>
                    {user.uid === appUser?.uid && (
                      <span
                        style={{
                          fontSize: "10px",
                          background: "#dcfce7",
                          color: "#16a34a",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          fontWeight: "600",
                        }}
                      >
                        Vous
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "1px" }}>
                    {user.email}
                  </div>
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: user.role === "admin" ? "#fef3c7" : "#f1f5f9",
                        color: user.role === "admin" ? "#d97706" : "#475569",
                        fontWeight: "600",
                      }}
                    >
                      {user.role === "admin" ? "Admin" : "Utilisateur"}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        background: user.active ? "#dcfce7" : "#fee2e2",
                        color: user.active ? "#16a34a" : "#dc2626",
                        fontWeight: "600",
                      }}
                    >
                      {user.active ? "Actif" : "Désactivé"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                  <button
                    onClick={() => setExpandedUser(expandedUser === user.uid ? null : user.uid)}
                    style={iconBtnStyle}
                    title="Voir les permissions"
                  >
                    {expandedUser === user.uid ? (
                      <ChevronUp size={16} color="#64748b" />
                    ) : (
                      <ChevronDown size={16} color="#64748b" />
                    )}
                  </button>
                  <button
                    onClick={() => setEditingUser(user)}
                    style={iconBtnStyle}
                    title="Modifier"
                  >
                    <Edit3 size={16} color="#2563eb" />
                  </button>
                  {user.uid !== appUser?.uid && (
                    <>
                      <button
                        onClick={() => handleToggleActive(user)}
                        disabled={actionLoading === user.uid}
                        style={iconBtnStyle}
                        title={user.active ? "Désactiver" : "Activer"}
                      >
                        {user.active ? (
                          <ShieldOff size={16} color="#f59e0b" />
                        ) : (
                          <Shield size={16} color="#16a34a" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={actionLoading === user.uid}
                        style={iconBtnStyle}
                        title="Supprimer"
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Expanded Permissions */}
              {expandedUser === user.uid && (
                <div
                  style={{
                    borderTop: "1px solid #f1f5f9",
                    padding: "12px 14px",
                    background: "#f8fafc",
                  }}
                >
                  <p style={{ fontSize: "12px", fontWeight: "600", color: "#64748b", margin: "0 0 8px" }}>
                    Accès aux pages :
                  </p>
                  {user.role === "admin" ? (
                    <span style={{ fontSize: "12px", color: "#d97706", fontWeight: "600" }}>
                      Toutes les pages (administrateur)
                    </span>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {ALL_PERMISSIONS.map((perm) => (
                        <span
                          key={perm.id}
                          style={{
                            fontSize: "11px",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: user.permissions.includes(perm.id) ? "#eff6ff" : "#f1f5f9",
                            color: user.permissions.includes(perm.id) ? "#2563eb" : "#94a3b8",
                            fontWeight: "500",
                            border: `1px solid ${user.permissions.includes(perm.id) ? "#bfdbfe" : "#e2e8f0"}`,
                          }}
                        >
                          {user.permissions.includes(perm.id) ? "✓ " : "✗ "}
                          {perm.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={loadUsers}
        />
      )}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={loadUsers}
        />
      )}
    </div>
  );
}

// ==================== STYLES ====================

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "#475569",
  marginBottom: "5px",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  border: "1.5px solid #e2e8f0",
  borderRadius: "10px",
  fontSize: "14px",
  outline: "none",
  boxSizing: "border-box",
  background: "white",
};

const iconBtnStyle: React.CSSProperties = {
  background: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "7px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
