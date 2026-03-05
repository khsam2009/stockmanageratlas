"use client";

import { useState } from "react";
import { Download, FileText, FileSpreadsheet, FileType } from "lucide-react";

interface ExportOption {
  label: string;
  format: "pdf" | "excel" | "word";
  icon: React.ReactNode;
  color: string;
}

interface ExportButtonProps {
  onExportPDF: () => Promise<void>;
  onExportExcel: () => Promise<void>;
  onExportWord: () => Promise<void>;
}

export default function ExportButton({ onExportPDF, onExportExcel, onExportWord }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const options: ExportOption[] = [
    {
      label: "PDF",
      format: "pdf",
      icon: <FileText size={16} />,
      color: "#dc2626",
    },
    {
      label: "Excel",
      format: "excel",
      icon: <FileSpreadsheet size={16} />,
      color: "#16a34a",
    },
    {
      label: "Word",
      format: "word",
      icon: <FileType size={16} />,
      color: "#2563eb",
    },
  ];

  const handleExport = async (format: "pdf" | "excel" | "word") => {
    setLoading(format);
    setOpen(false);
    try {
      if (format === "pdf") await onExportPDF();
      else if (format === "excel") await onExportExcel();
      else await onExportWord();
    } catch (err) {
      console.error("Export error:", err);
      alert("Erreur lors de l'export");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={loading !== null}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: loading ? "#94a3b8" : "#475569",
          color: "white",
          border: "none",
          borderRadius: "8px",
          padding: "8px 14px",
          fontSize: "13px",
          fontWeight: "600",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 0.2s",
        }}
      >
        <Download size={15} />
        {loading ? `Export ${loading}...` : "Exporter"}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 998,
            }}
            onClick={() => setOpen(false)}
          />
          {/* Dropdown */}
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "calc(100% + 6px)",
              background: "white",
              borderRadius: "10px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              zIndex: 999,
              minWidth: "140px",
              overflow: "hidden",
              border: "1px solid #e2e8f0",
            }}
          >
            {options.map((opt) => (
              <button
                key={opt.format}
                onClick={() => handleExport(opt.format)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  width: "100%",
                  padding: "11px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  color: "#1e293b",
                  textAlign: "left",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "#f8fafc";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "none";
                }}
              >
                <span style={{ color: opt.color }}>{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
