"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ScanLine, Package, Check, Camera, Keyboard } from "lucide-react";
import type { Product } from "@/lib/types";
import { Html5Qrcode } from "html5-qrcode";

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onProductScanned: (product: Product, quantity: number) => void;
}

interface ScannedItem {
  product: Product;
  quantity: number;
}

export default function BarcodeScannerModal({
  isOpen,
  onClose,
  products,
  onProductScanned,
}: BarcodeScannerModalProps) {
  const [barcode, setBarcode] = useState("");
  const [foundProduct, setFoundProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [showQuantityPopup, setShowQuantityPopup] = useState(false);
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [useCamera, setUseCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  const activeProducts = products.filter((p) => p.active !== false);

  useEffect(() => {
    if (isOpen && inputRef.current && !useCamera) {
      inputRef.current.focus();
    }
  }, [isOpen, useCamera]);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setBarcode("");
        setFoundProduct(null);
        setQuantity("1");
        setShowQuantityPopup(false);
        setScannedItems([]);
        setUseCamera(false);
        setCameraError(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

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

  const handleBarcodeDetected = useCallback((detectedBarcode: string) => {
    const product = activeProducts.find(
      (p) => p.code.toLowerCase() === detectedBarcode.toLowerCase()
    );
    
    if (product) {
      setFoundProduct(product);
      setShowQuantityPopup(true);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      setUseCamera(false);
    } else {
      setBarcode(detectedBarcode);
    }
  }, [activeProducts]);

  const startCamera = useCallback(async () => {
    try {
      const scanner = new Html5Qrcode("scanner-container");
      scannerRef.current = scanner;
      
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 150 },
          aspectRatio: 1.777778,
        },
        (decodedText) => {
          handleBarcodeDetected(decodedText);
        },
        () => {}
      );
      return true;
    } catch (err) {
      console.error("Camera error:", err);
      return false;
    }
  }, [handleBarcodeDetected]);

  useEffect(() => {
    if (useCamera && isOpen) {
      startCamera().then((success) => {
        if (!success) {
          setCameraError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
        }
      });
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [useCamera, isOpen, startCamera, stopCamera]);

  const handleBarcodeChange = (value: string) => {
    setBarcode(value);
    
    if (value.length > 0) {
      const product = activeProducts.find(
        (p) => p.code.toLowerCase() === value.toLowerCase()
      );
      if (product) {
        setFoundProduct(product);
        setShowQuantityPopup(true);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && foundProduct) {
      handleConfirmQuantity();
    }
  };

  const handleConfirmQuantity = () => {
    if (!foundProduct) return;
    const qty = parseInt(quantity) || 1;
    
    setScannedItems([...scannedItems, { product: foundProduct, quantity: qty }]);
    onProductScanned(foundProduct, qty);
    
    setBarcode("");
    setFoundProduct(null);
    setQuantity("1");
    setShowQuantityPopup(false);
    
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleContinueScan = () => {
    setBarcode("");
    setFoundProduct(null);
    setQuantity("1");
    setShowQuantityPopup(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleFinishScan = () => {
    onClose();
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
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
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
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Scanner Code-barres</h2>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                {activeProducts.length} produits actifs disponibles
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
          >
            <X size={20} />
          </button>
        </div>

        {scannedItems.length > 0 && (
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
              Produits scannés ({scannedItems.length})
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
              {scannedItems.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "#dbeafe",
                    borderRadius: "6px",
                    padding: "4px 8px",
                    fontSize: "12px",
                    color: "#1e40af",
                  }}
                >
                  {item.product.code} x{item.quantity}
                </div>
              ))}
            </div>
          </div>
        )}

        {useCamera && !showQuantityPopup ? (
          <div>
            <div 
              id="scanner-container" 
              ref={scannerContainerRef}
              style={{ 
                width: "100%", 
                minHeight: "250px",
                background: "#000",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "16px"
              }} 
            />
            {cameraError && (
              <div style={{ 
                background: "#fef2f2", 
                border: "1px solid #fecaca", 
                borderRadius: "8px", 
                padding: "12px",
                textAlign: "center",
                marginBottom: "16px",
                color: "#dc2626"
              }}>
                {cameraError}
              </div>
            )}
            <button
              onClick={() => { stopCamera(); setUseCamera(false); }}
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
              Retour à la saisie manuelle
            </button>
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <label className="form-label">Scanner ou entrer le code-barres</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  ref={inputRef}
                  className="form-input"
                  style={{ 
                    flex: 1,
                    fontSize: "18px", 
                    padding: "14px", 
                    textTransform: "uppercase",
                    letterSpacing: "2px"
                  }}
                  placeholder="Scanner le code..."
                  value={barcode}
                  onChange={(e) => handleBarcodeChange(e.target.value.toUpperCase())}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
                <button
                  onClick={() => setUseCamera(true)}
                  style={{
                    background: "#1e40af",
                    border: "none",
                    borderRadius: "8px",
                    padding: "14px 16px",
                    color: "white",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  title="Ouvrir la caméra"
                >
                  <Camera size={20} />
                </button>
              </div>
            </div>

            {barcode === "" && !showQuantityPopup && (
              <div>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                  Ou sélectionnez un produit :
                </div>
                <div style={{ maxHeight: "200px", overflow: "auto" }}>
                  {activeProducts.slice(0, 10).map((product) => (
                    <div
                      key={product.id}
                      onClick={() => {
                        setFoundProduct(product);
                        setShowQuantityPopup(true);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        padding: "10px",
                        background: "#f8fafc",
                        borderRadius: "8px",
                        marginBottom: "6px",
                        cursor: "pointer",
                      }}
                    >
                      <Package size={16} style={{ color: "#64748b" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "13px", fontWeight: "600" }}>{product.name}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{product.code}</div>
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Stock: {product.currentStock} {product.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showQuantityPopup && foundProduct && (
          <div
            style={{
              background: "#eff6ff",
              border: "2px solid #3b82f6",
              borderRadius: "12px",
              padding: "16px",
              marginTop: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div
                style={{
                  background: "#16a34a",
                  borderRadius: "8px",
                  padding: "8px",
                  color: "white",
                }}
              >
                <Package size={20} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700" }}>{foundProduct.name}</div>
                <div style={{ fontSize: "12px", color: "#64748b" }}>
                  Code: {foundProduct.code} • Stock: {foundProduct.currentStock} {foundProduct.unit}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Quantité</label>
              <input
                className="form-input"
                style={{ fontSize: "20px", textAlign: "center", padding: "12px" }}
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                autoFocus
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px" }}>
              <button
                onClick={handleContinueScan}
                style={{
                  background: "white",
                  border: "2px solid #3b82f6",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "#1e40af",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <ScanLine size={16} />
                Scanner à nouveau
              </button>
              <button
                onClick={handleFinishScan}
                style={{
                  background: "#16a34a",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "6px",
                }}
              >
                <Check size={16} />
                Terminer
              </button>
            </div>
          </div>
        )}

        {barcode.length > 0 && !foundProduct && !showQuantityPopup && !useCamera && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "8px",
              padding: "12px",
              textAlign: "center",
              marginTop: "12px",
            }}
          >
            <div style={{ color: "#dc2626", fontWeight: "600" }}>Produit non trouvé</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
              Le code &quot;{barcode}&quot; ne correspond à aucun produit actif
            </div>
          </div>
        )}

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <button
            onClick={onClose}
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
        </div>
      </div>
    </div>
  );
}
