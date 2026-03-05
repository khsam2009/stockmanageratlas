"use client";

import { useState, useRef, useEffect } from "react";
import { Search, X, ChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Sélectionner une option",
  searchPlaceholder = "Rechercher...",
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          background: "#fff",
          fontSize: "14px",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: selectedOption ? "#1e293b" : "#94a3b8",
        }}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          size={18}
          style={{
            color: "#94a3b8",
            transform: isOpen ? "rotate(180deg)" : "rotate(0)",
            transition: "transform 0.2s",
          }}
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: "4px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            zIndex: 50,
            maxHeight: "250px",
            overflow: "hidden",
          }}
        >
          {/* Search input */}
          <div
            style={{
              padding: "8px",
              borderBottom: "1px solid #e2e8f0",
            }}
          >
            <div style={{ position: "relative" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  width: "100%",
                  padding: "8px 10px 8px 32px",
                  border: "1px solid #e2e8f0",
                  borderRadius: "6px",
                  fontSize: "13px",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* Options list */}
          <div
            style={{
              maxHeight: "190px",
              overflowY: "auto",
            }}
          >
            {filteredOptions.length === 0 ? (
              <div
                style={{
                  padding: "16px",
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: "13px",
                }}
              >
                Aucun résultat
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    border: "none",
                    background: option.value === value ? "#f1f5f9" : "transparent",
                    textAlign: "left",
                    cursor: "pointer",
                    fontSize: "14px",
                    color: "#1e293b",
                  }}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
