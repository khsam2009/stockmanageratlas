"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ScanLine, Keyboard, Camera } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface ProductBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onCodeDetected: (code: string) => void;
}

export default function ProductBarcodeScanner({
  isOpen,
  onClose,
  onCodeDetected,
}: ProductBarcodeScannerProps) {
  const [barcode, setBarcode] = useState("");
  const [useCamera, setUseCamera] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping camera:", err);
      }
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      
      const container = document.getElementById("product-scanner-container");
      if (!container) return;
      
      const scanner = new Html5Qrcode("product-scanner-container");
      scannerRef.current = scanner;
      
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777778,
        },
        (decodedText) => {
          if (scannerRef.current) {
            scannerRef.current.stop().catch(() => {});
            scannerRef.current = null;
          }
          onCodeDetected(decodedText);
          onClose();
        },
        () => {}
      );
      return true;
    } catch (err) {
      console.error("Camera error:", err);
      return false;
    }
  }, [onCodeDetected, onClose]);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    
    if (useCamera) {
      startCamera().then((success) => {
        if (!success) {
          setCameraError("Impossible d'accéder à la caméra. Utilisez la saisie manuelle.");
          setUseCamera(false);
        }
      });
    } else {
      stopCamera();
      inputRef.current?.focus();
    }
    
    return () => {
      stopCamera();
    };
  }, [isOpen, useCamera, startCamera, stopCamera]);

  const handleSubmit = (value: string) => {
    if (value.trim()) {
      onCodeDetected(value.trim());
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div
        className="modal-content"
        style={{ maxWidth: "500px", maxHeight: "90vh", overflow: "auto" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-handle" />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                background: "#1e40af",
                borderRadius: "10px",
                padding: "10px",
                color: "white",
              }}
            >
              <ScanLine size={20} />
            </div>
            <h2 style={{ fontSize: "18px", fontWeight: "700" }}>
              Scanner code-barres
            </h2>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#64748b",
            }}
          >
            <X size={20} />
          </button>
        </div>

        {useCamera ? (
          <div>
            <div
              id="product-scanner-container"
              style={{
                width: "100%",
                minHeight: "250px",
                background: "#000",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "16px",
              }}
            />
            {cameraError && (
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "8px",
                  padding: "12px",
                  textAlign: "center",
                  marginBottom: "16px",
                  color: "#dc2626",
                }}
              >
                {cameraError}
              </div>
            )}
            <button
              onClick={() => setUseCamera(false)}
              style={{
                width: "100%",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "8px",
                padding: "14px",
                color: "#64748b",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
            >
              <Keyboard size={18} />
              Saisir manuellement
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <label className="form-label">Entrer le code-barres</label>
              <input
                ref={inputRef}
                className="form-input"
                style={{
                  fontSize: "18px",
                  padding: "14px",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
                placeholder="Saisir le code..."
                value={barcode}
                onChange={(e) => setBarcode(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit(barcode);
                  }
                }}
                autoFocus
              />
            </div>
            <button
              onClick={() => setUseCamera(true)}
              style={{
                width: "100%",
                background: "#1e40af",
                border: "none",
                borderRadius: "8px",
                padding: "14px",
                color: "white",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "12px",
              }}
            >
              <Camera size={18} />
              Ouvrir la caméra
            </button>
          </div>
        )}

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <button
            onClick={handleClose}
            style={{
              background: "#f1f5f9",
              border: "none",
              borderRadius: "8px",
              padding: "12px 20px",
              color: "#64748b",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              flex: 1,
            }}
          >
            Annuler
          </button>
          <button
            onClick={() => handleSubmit(barcode)}
            disabled={!barcode.trim()}
            style={{
              background: barcode.trim() ? "#1e40af" : "#e2e8f0",
              border: "none",
              borderRadius: "8px",
              padding: "12px 20px",
              color: barcode.trim() ? "white" : "#94a3b8",
              fontSize: "14px",
              fontWeight: "600",
              cursor: barcode.trim() ? "pointer" : "not-allowed",
              flex: 1,
            }}
          >
            Valider
          </button>
        </div>
      </div>
    </div>
  );
}
