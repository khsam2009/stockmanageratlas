"use client";

import { useState, useEffect } from "react";
import { User, Mail, Calendar, Shield, Package, ArrowLeftRight, Lock, Save, AlertCircle } from "lucide-react";
import { getProducts, getMovements } from "@/lib/firestore";
import { useAuth } from "@/lib/AuthContext";
import type { Product, StockMovement } from "@/lib/types";

export default function MonProfilPage() {
  const { appUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [productsCount, setProductsCount] = useState(0);
  const [mouvementsCount, setMouvementsCount] = useState(0);
  const [lastLogin, setLastLogin] = useState<Date | null>(null);

  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (appUser?.email) {
      loadStats();
    }
  }, [appUser]);

  const loadStats = async () => {
    setLoading(true);
      console.log("Loading stats for user:", appUser?.email);
    try {
      if (appUser?.email) {
        const [productsResult, mouvementsResult] = await Promise.all([
          getProducts(),
          getMovements(),
        ]);
        
        // Compter les produits créés par cet utilisateur
        const myProducts = productsResult.products.filter(
          (p: Product) => p.createdByEmail === appUser.email
        );
        setProductsCount(myProducts.length);

        // Compter les mouvements créés par cet utilisateur
        const myMouvements = mouvementsResult.movements.filter(
          (m: StockMovement) => m.operatorEmail === appUser.email
        );
        setMouvementsCount(myMouvements.length);
      }
    } catch (error) {
      console.error("Erreur chargement stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Veuillez remplir tous les champs");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 6 caractères");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas");
      return;
    }

    if (newPassword === currentPassword) {
      setPasswordError("Le nouveau mot de passe doit être différent de l'actuel");
      return;
    }

    setChangingPassword(true);

    try {
      // Re-authentification avec l'ancien mot de passe
      // Note: dans un vrai cas il faudrait re-auth, ici on suppose que l'utilisateur est déjà authentifié
      // Pour simplifier on met à jour via Firebase Auth avec le token de session
      // On va utiliser la fonction de re-auth via email/mot de passe - limité pour démo
      
      alert("Fonction de changement de mot de passe non implémentée côté Firestore sans re-auth. " +
            "En production, utiliser reauthenticateWithCredential de Firebase Auth.");
      
      // Pour l'exemple on montre le succès si les validations passent
      setPasswordSuccess("Mot de passe changé avec succès (simulation) - En production, reconnexion requise");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setPasswordError("Erreur lors du changement de mot de passe: " + error.message);
    } finally {
      setChangingPassword(false);
    }
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
          Chargement du profil...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Mon profil</div>
          <div className="page-subtitle">Gérer mes informations et mon compte</div>
        </div>
      </div>

      <div className="page-content">
        {/* En-tête profil */}
        <div style={{
          background: "linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)",
          borderRadius: "12px",
          padding: "24px",
          color: "white",
          marginBottom: "24px",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{
            position: "absolute",
            top: "-50%",
            right: "-50%",
            width: "200%",
            height: "200%",
            background: "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)",
            pointerEvents: "none"
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              marginBottom: "16px"
            }}>
              <div style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "24px",
                fontWeight: "700",
                border: "3px solid rgba(255,255,255,0.3)"
              }}>
                {appUser?.displayName?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "700" }}>
                  {appUser?.displayName}
                </div>
                <div style={{ fontSize: "14px", opacity: 0.9, marginTop: "4px" }}>
                  {appUser?.email}
                </div>
              </div>
            </div>
            <div style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap"
            }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "500"
              }}>
                <Shield size={14} />
                {appUser?.role === "admin" ? "Administrateur" : "Utilisateur"}
              </span>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 12px",
                background: "rgba(255,255,255,0.2)",
                borderRadius: "20px",
                fontSize: "13px",
                fontWeight: "500"
              }}>
                <Calendar size={14} />
                Créé le {(appUser?.createdAt as Date)?.toLocaleDateString("fr-FR") || "-"}
              </span>
            </div>
          </div>
        </div>

        {/* Statistiques d'activité */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px"
        }}>
          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#dbeafe",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2563eb"
              }}>
                <Package size={22} />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>{productsCount}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Produits créés</div>
              </div>
            </div>
          </div>

          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#f0fdf4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#16a34a"
              }}>
                <ArrowLeftRight size={22} />
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b" }}>{mouvementsCount}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>Mouvements créés</div>
              </div>
            </div>
          </div>

          <div style={{
            background: "white",
            borderRadius: "12px",
            padding: "20px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "44px",
                height: "44px",
                borderRadius: "10px",
                background: "#fef3c7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#d97706"
              }}>
                <Mail size={22} />
              </div>
              <div>
                <div style={{ fontSize: "14px", color: "#64748b" }}>Email de connexion</div>
                <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", marginTop: "4px", wordBreak: "break-all" }}>
                  {appUser?.email || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Permissions accordées */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          marginBottom: "24px"
        }}>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield size={18} color="#64748b" />
              Autorisations accordées
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
              Niveau d&apos;accès pour chaque fonctionnalité
            </p>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "12px"
          }}>
            {appUser?.permissions && Object.entries(appUser.permissions).map(([key, level]) => {
              const labelMap: Record<string, string> = {
                dashboard: "Tableau de bord",
                mouvements: "Mouvements",
                reception: "Bon de Réception",
                sortie: "Bon de Sortie",
                inventaire: "Inventaire",
                produits: "Produits",
                fournisseurs: "Fournisseurs",
                operateurs: "Opérateurs"
              };
              const colorMap: Record<string, string> = {
                none: "#ef4444",
                read: "#f59e0b",
                write: "#10b981"
              };
              const labelMapColor: Record<string, string> = {
                none: "#dc2626",
                read: "#d97706",
                write: "#059669"
              };
              return (
                <div key={key} style={{
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0"
                }}>
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "4px" }}>
                    {labelMap[level] || level}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: colorMap[level] || "#94a3b8"
                    }} />
                    <span style={{ fontSize: "13px", fontWeight: "600", color: labelMapColor[level] || "#64748b" }}>
                      {level === "none" ? "Aucun" : level === "read" ? "Lecture" : "Écriture"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Changement de mot de passe */}
        <div style={{
          background: "white",
          borderRadius: "12px",
          padding: "20px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Lock size={18} color="#64748b" />
              Changer le mot de passe
            </h3>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>
              Mettre à jour votre mot de passe pour sécuriser votre compte
            </p>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {passwordError && (
              <div style={{
                padding: "10px 14px",
                background: "#fee2e2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#dc2626",
                fontSize: "13px"
              }}>
                <AlertCircle size={16} />
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div style={{
                padding: "10px 14px",
                background: "#dcfce7",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#166534",
                fontSize: "13px"
              }}>
                <Save size={16} />
                {passwordSuccess}
              </div>
            )}

            <input
              type="password"
              placeholder="Mot de passe actuel"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={{
                padding: "10px 14px",
                border: "1.5px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                background: "white",
                outline: "none"
              }}
            />
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={{
                padding: "10px 14px",
                border: "1.5px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                background: "white",
                outline: "none"
              }}
            />
            <input
              type="password"
              placeholder="Confirmer le nouveau mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                padding: "10px 14px",
                border: "1.5px solid #e2e8f0",
                borderRadius: "8px",
                fontSize: "14px",
                background: "white",
                outline: "none"
              }}
            />

            <button
              type="submit"
              disabled={changingPassword}
              style={{
                padding: "10px 20px",
                background: changingPassword ? "#94a3b8" : "#1e40af",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: changingPassword ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "background 0.2s"
              }}
            >
              <Save size={16} />
              {changingPassword ? "Changement en cours..." : "Changer le mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
