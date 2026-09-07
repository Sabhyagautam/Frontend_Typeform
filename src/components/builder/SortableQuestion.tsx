"use client";

/**
 * SortableQuestion — left sidebar question item.
 * Matches Typeform exactly: coloured letter badge (A, B, C…) + question title.
 * Drag handle appears on hover. Selected state has left blue border.
 */

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoreHorizontal } from "lucide-react";
import { Question } from "@/lib/api";

const LETTER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/* Letter badge colors per type — matching Typeform's palette */
const BADGE_COLOR: Record<string, string> = {
  short_text: "#4f86f7",
  long_text: "#4f86f7",
  email: "#e05a5a",
  number: "#f5a623",
  multiple_choice: "#9b59b6",
  dropdown: "#7c6af7",
  yes_no: "#27ae60",
  rating: "#f5a623",
};

/* Small icon glyphs that match Typeform's type icons */
const TYPE_GLYPH: Record<string, string> = {
  short_text: "≡",
  long_text: "≡",
  email: "✉",
  number: "#",
  multiple_choice: "⊞",
  dropdown: "∨",
  yes_no: "◐",
  rating: "★",
};

export default function SortableQuestion({
  question,
  index,
  selected,
  onClick,
}: {
  question: Question;
  index: number;
  selected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const bg = BADGE_COLOR[question.type] || "#6366f1";
  const letter = LETTER[index] || "?";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="q-row"
      onClick={onClick}
      title={question.title || "Untitled"}
      css-selected={selected ? "true" : "false"}
    >
      <div style={{
        display: "flex", alignItems: "flex-start", gap: 7, padding: "7px 8px",
        cursor: "pointer", borderLeft: `3px solid ${selected ? "#6366f1" : "transparent"}`,
        background: selected ? "#eef2ff" : "transparent",
        transition: "all 0.1s", position: "relative",
      }}>
        {/* Drag handle — visible on parent hover */}
        <div {...attributes} {...listeners}
          onClick={e => e.stopPropagation()}
          style={{ cursor: "grab", color: "#d1d5db", display: "flex", alignItems: "center", paddingTop: 3, flexShrink: 0 }}
          title="Drag to reorder">
          <GripVertical size={12} />
        </div>

        {/* Letter badge */}
        <div style={{
          width: 20, height: 20, borderRadius: 4, background: bg,
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "white", fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 1,
        }}>
          {letter}
        </div>

        {/* Title */}
        <span style={{
          flex: 1, fontSize: 12.5, color: selected ? "#4338ca" : "#374151",
          fontWeight: selected ? 600 : 400, lineHeight: 1.4,
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {question.title || <span style={{ color: "#9ca3af", fontStyle: "italic" }}>Untitled</span>}
          {question.required && <span style={{ color: "#ef4444", marginLeft: 2 }}>*</span>}
        </span>
      </div>
    </div>
  );
}
