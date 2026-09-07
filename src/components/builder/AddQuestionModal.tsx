"use client";

/**
 * AddQuestionModal — pixel-perfect Typeform clone.
 * White modal, tabs: "Add form elements | Import questions | Create with AI"
 * Left column: search box, Recommended section, Connect to apps section
 * Right section: 4 groups (Contact info, Text & Video, Choice, Other, Rating & ranking)
 * Each type has a small coloured square icon + name (no description text in header)
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Search, X } from "lucide-react";
import { QuestionType } from "@/lib/api";

/* ── Type icon colors — matching Typeform's exact palette ── */
interface TypeDef {
  type: QuestionType;
  label: string;
  color: string;
  emoji: string;
  desc: string;
}

const TYPES: TypeDef[] = [
  { type: "short_text",      label: "Short Text",      color: "#4f86f7", emoji: "≡",  desc: "A single line of text" },
  { type: "long_text",       label: "Long Text",        color: "#4f86f7", emoji: "☰",  desc: "Multiple lines of text" },
  { type: "multiple_choice", label: "Multiple Choice",  color: "#9b59b6", emoji: "⊞",  desc: "Select from a list of options" },
  { type: "dropdown",        label: "Dropdown",         color: "#7c6af7", emoji: "∨",  desc: "Pick one from a dropdown" },
  { type: "yes_no",          label: "Yes / No",         color: "#27ae60", emoji: "◐",  desc: "Binary yes or no answer" },
  { type: "email",           label: "Email",            color: "#e05a5a", emoji: "✉",  desc: "Validated email address" },
  { type: "number",          label: "Number",           color: "#f5a623", emoji: "#",  desc: "Numeric input only" },
  { type: "rating",          label: "Rating",           color: "#f5a623", emoji: "★",  desc: "Star or number rating scale" },
];

const RECOMMENDED: QuestionType[] = ["short_text", "multiple_choice", "email", "number", "rating"];

/* Groups matching Typeform's layout */
const GROUPS = [
  {
    label: "Contact info",
    types: ["email"] as QuestionType[],
  },
  {
    label: "Text & Video",
    types: ["short_text", "long_text"] as QuestionType[],
  },
  {
    label: "Choice",
    types: ["multiple_choice", "dropdown", "yes_no"] as QuestionType[],
  },
  {
    label: "Other",
    types: ["number"] as QuestionType[],
  },
  {
    label: "Rating & ranking",
    types: ["rating"] as QuestionType[],
  },
];

function TypeIcon({ def }: { def: TypeDef }) {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 7, background: def.color,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "white", fontSize: 14, fontWeight: 700, flexShrink: 0,
    }}>
      {def.emoji}
    </div>
  );
}

function TypeRow({ def, onClick }: { def: TypeDef; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", gap: 10, width: "100%",
        padding: "8px 10px", border: "1px solid transparent", borderRadius: 8,
        background: hover ? "#f5f5f5" : "none", cursor: "pointer", textAlign: "left",
        fontFamily: "inherit", transition: "all 0.1s",
      }}>
      <TypeIcon def={def} />
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "#111827", lineHeight: 1.2 }}>{def.label}</div>
        <div style={{ fontSize: 11.5, color: "#6b7280", lineHeight: 1.3, marginTop: 1 }}>{def.desc}</div>
      </div>
    </button>
  );
}

export default function AddQuestionModal({
  onSelect,
  onClose,
}: {
  onSelect: (type: QuestionType) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  const filteredTypes = search
    ? TYPES.filter(t => t.label.toLowerCase().includes(search.toLowerCase()))
    : null;

  const recommendedDefs = TYPES.filter(t => RECOMMENDED.includes(t.type));

  const content = (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
    >
      {/* Modal box */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: "white", borderRadius: 14, width: "100%", maxWidth: 760, maxHeight: "82vh", display: "flex", flexDirection: "column", boxShadow: "0 20px 60px rgba(0,0,0,0.2)", overflow: "hidden" }}
      >
        {/* Header tabs */}
        <div style={{ display: "flex", alignItems: "center", padding: "0 20px", borderBottom: "1px solid #e5e7eb", gap: 0, flexShrink: 0 }}>
          {["Add form elements", "Import questions", "Create with AI"].map((tab, i) => (
            <button key={tab}
              style={{
                padding: "14px 16px", fontSize: 13.5, fontWeight: i === 0 ? 600 : 400,
                color: i === 0 ? "#111827" : "#6b7280",
                borderBottom: i === 0 ? "2px solid #111827" : "2px solid transparent",
                background: "none", border: "none", paddingBottom: i === 0 ? 12 : 14, boxShadow: i === 0 ? "inset 0 -2px 0 #111827" : "none",
                cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
              }}>
              {tab}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: "50%", border: "none", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <X size={16} />
          </button>
        </div>

        {/* Body: two columns */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* LEFT column */}
          <div style={{ width: 220, borderRight: "1px solid #e5e7eb", padding: "14px 12px", overflowY: "auto", flexShrink: 0 }}>
            {/* Search */}
            <div style={{ position: "relative", marginBottom: 14 }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search form elements"
                style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 8, paddingBottom: 8, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box", background: "#fafafa" }}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.background = "white"; }}
                onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.background = "#fafafa"; }}
              />
            </div>

            {/* Recommended section */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Recommended</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 1, marginBottom: 14 }}>
              {recommendedDefs.map(def => (
                <TypeRow key={def.type} def={def} onClick={() => onSelect(def.type)} />
              ))}
            </div>

            {/* Connect to apps placeholder */}
            <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Connect to apps</p>
            {[
              { name: "HubSpot", color: "#ff7a59", emoji: "🔶" },
              { name: "Salesforce", color: "#00a1e0", emoji: "☁" },
            ].map(app => (
              <button key={app.name}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, background: "white", cursor: "pointer", fontFamily: "inherit", marginBottom: 6, fontSize: 13, color: "#374151", fontWeight: 500 }}
                onClick={() => {}}
                onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"} onMouseLeave={e => e.currentTarget.style.background = "white"}>
                <div style={{ width: 24, height: 24, borderRadius: 5, background: app.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>{app.emoji}</div>
                {app.name}
                <div style={{ marginLeft: "auto", width: 14, height: 14, borderRadius: "50%", border: "1.5px solid #10b981", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981" }} />
                </div>
              </button>
            ))}
            <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", border: "1px solid #e5e7eb", borderRadius: 8, background: "white", cursor: "pointer", fontFamily: "inherit", marginBottom: 6, fontSize: 13, color: "#374151" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"} onMouseLeave={e => e.currentTarget.style.background = "white"}>
              <div style={{ width: 24, height: 24, borderRadius: 5, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#6b7280" }}>⊞</div>
              Browse all apps
            </button>
          </div>

          {/* RIGHT: type groups */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {/* Search results */}
            {filteredTypes && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Results</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 2 }}>
                  {filteredTypes.length === 0 && <p style={{ fontSize: 13, color: "#9ca3af", gridColumn: "span 2" }}>No results for "{search}"</p>}
                  {filteredTypes.map(def => (
                    <TypeRow key={def.type} def={def} onClick={() => onSelect(def.type)} />
                  ))}
                </div>
              </div>
            )}

            {/* Grouped types */}
            {!filteredTypes && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, alignItems: "start" }}>
                {GROUPS.map(group => (
                  <div key={group.label} style={{ marginBottom: 20, paddingRight: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
                      {group.label}
                    </p>
                    {group.types.map(t => {
                      const def = TYPES.find(d => d.type === t)!;
                      return <TypeRow key={t} def={def} onClick={() => onSelect(t)} />;
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
