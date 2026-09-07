"use client";

/**
 * QuestionSettings — right panel matching real Typeform exactly.
 * FIX: SectionHeader uses <div> not <button> to avoid button-in-button hydration error.
 */

import { useState } from "react";
import { Plus, X, ChevronDown, Copy, Trash2, HelpCircle, Video, AlignLeft, Check } from "lucide-react";
import { Question, QuestionType } from "@/lib/api";
import { questionTypeLabel } from "@/lib/utils";

const ALL_TYPES: QuestionType[] = [
  "short_text", "long_text", "multiple_choice", "dropdown",
  "email", "number", "yes_no", "rating",
];

const TYPE_COLORS: Record<string, string> = {
  short_text: "#4f86f7", long_text: "#4f86f7", email: "#e05a5a", number: "#f5a623",
  multiple_choice: "#9b59b6", dropdown: "#7c6af7", yes_no: "#27ae60", rating: "#f5a623",
};

const TYPE_EMOJI: Record<string, string> = {
  short_text: "≡", long_text: "☰", email: "✉", number: "#",
  multiple_choice: "⊞", dropdown: "∨", yes_no: "◐", rating: "★",
};

interface Props {
  question: Question;
  onChange: (q: Question) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
}

export default function QuestionSettings({ question, onChange, onDelete, onDuplicate }: Props) {
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const [answerExpanded, setAnswerExpanded] = useState(true);
  const [logicExpanded, setLogicExpanded] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  function update(patch: Partial<Question>) { onChange({ ...question, ...patch }); }
  function updateChoice(i: number, val: string) {
    const choices = [...(question.choices ?? [])]; choices[i] = val; update({ choices });
  }
  function addChoice() { update({ choices: [...(question.choices ?? []), `Option ${(question.choices?.length ?? 0) + 1}`] }); }
  function removeChoice(i: number) { update({ choices: (question.choices ?? []).filter((_, j) => j !== i) }); }

  const showChoices = ["multiple_choice", "dropdown"].includes(question.type);
  const showRating = question.type === "rating";

  /* ── CRITICAL FIX: use <div role="button"> instead of <button> to avoid nested button error ── */
  const SectionRow = ({
    label,
    extra,
    onClick,
  }: {
    label: string;
    extra?: React.ReactNode;
    onClick?: () => void;
  }) => (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
      style={{
        width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "12px 16px", borderBottom: "1px solid #f0f0f0",
        cursor: onClick ? "pointer" : "default", userSelect: "none",
      }}
      onMouseEnter={e => { if (onClick) (e.currentTarget as HTMLElement).style.background = "#fafafa"; }}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "none"}
    >
      <span style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{label}</span>
      {extra}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>

      {/* ── QUESTION header ── */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13.5, fontWeight: 600, color: "#111827" }}>
          Question <HelpCircle size={13} color="#9ca3af" />
        </span>
        {/* Text / Video toggle */}
        <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: 6, overflow: "hidden" }}>
          <button style={{ padding: "4px 10px", fontSize: 12, fontWeight: 500, background: "#f3f4f6", color: "#374151", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
            <AlignLeft size={11} /> Text
          </button>
          <button style={{ padding: "4px 10px", fontSize: 12, fontWeight: 500, background: "none", color: "#9ca3af", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
            <Video size={11} /> Video
          </button>
        </div>
      </div>

      {/* ── Answer type picker ── */}
      <div style={{ padding: "12px 16px 10px", borderBottom: "1px solid #f0f0f0" }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Answer type</p>
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setTypeMenuOpen(v => !v)}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 8, background: "white", cursor: "pointer", fontFamily: "inherit", fontSize: 13.5, fontWeight: 500, color: "#374151" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#a5b4fc"}
            onMouseLeave={e => { if (!typeMenuOpen) e.currentTarget.style.borderColor = "#e5e7eb"; }}
          >
            <div style={{ width: 24, height: 24, borderRadius: 5, background: TYPE_COLORS[question.type] || "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {TYPE_EMOJI[question.type] || "?"}
            </div>
            <span style={{ flex: 1, textAlign: "left" }}>{questionTypeLabel(question.type)}</span>
            <ChevronDown size={13} color="#9ca3af" />
          </button>
          {typeMenuOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, background: "white", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", zIndex: 200, padding: 4, maxHeight: 280, overflowY: "auto" }}>
              {ALL_TYPES.map(t => (
                <button key={t}
                  onClick={() => { update({ type: t }); setTypeMenuOpen(false); }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", background: t === question.type ? "#eef2ff" : "none", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "inherit", fontSize: 13, color: t === question.type ? "#4338ca" : "#374151" }}
                  onMouseEnter={e => { if (t !== question.type) e.currentTarget.style.background = "#f9fafb"; }}
                  onMouseLeave={e => { if (t !== question.type) e.currentTarget.style.background = "none"; }}>
                  <div style={{ width: 22, height: 22, borderRadius: 5, background: TYPE_COLORS[t], display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                    {TYPE_EMOJI[t]}
                  </div>
                  {questionTypeLabel(t)}
                  {t === question.type && <Check size={13} style={{ marginLeft: "auto" }} color="#6366f1" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Image or video */}
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Image or video</p>
          <button
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", fontSize: 12.5, color: "#6b7280", background: "none", border: "1px dashed #d1d5db", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = "#a5b4fc"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "#d1d5db"}
          >
            <Plus size={12} /> Add image or video
          </button>
        </div>
      </div>

      {/* ── ANSWER section ── */}
      <div style={{ borderBottom: "1px solid #e5e7eb" }}>
        <SectionRow
          label="Answer"
          onClick={() => setAnswerExpanded(v => !v)}
          extra={
            <ChevronDown size={14} color="#9ca3af"
              style={{ transform: answerExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }} />
          }
        />
        {answerExpanded && (
          <div style={{ padding: "12px 16px" }}>
            {/* Required toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "#374151", marginBottom: 1 }}>Required</p>
                <p style={{ fontSize: 11.5, color: "#9ca3af" }}>Must answer to continue</p>
              </div>
              <div
                onClick={() => update({ required: !question.required })}
                style={{ width: 36, height: 20, borderRadius: 10, background: question.required ? "#6366f1" : "#d1d5db", position: "relative", transition: "background 0.2s", cursor: "pointer", flexShrink: 0 }}
              >
                <div style={{ position: "absolute", top: 3, left: question.required ? 19 : 3, width: 14, height: 14, borderRadius: "50%", background: "white", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
              </div>
            </div>

            {/* Description */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Description</p>
              <textarea
                value={question.description ?? ""}
                onChange={e => update({ description: e.target.value })}
                placeholder="Add help text…"
                rows={2}
                style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 7, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", background: "white", color: "#374151", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "#a5b4fc"}
                onBlur={e => e.target.style.borderColor = "#e5e7eb"}
              />
            </div>

            {/* Rating steps */}
            {showRating && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Steps</p>
                <select
                  value={question.rating_steps ?? 5}
                  onChange={e => update({ rating_steps: Number(e.target.value) })}
                  style={{ width: "100%", padding: "8px 10px", border: "1.5px solid #e5e7eb", borderRadius: 7, fontSize: 13, fontFamily: "inherit", outline: "none", background: "white", color: "#374151" }}
                  onFocus={e => e.target.style.borderColor = "#a5b4fc"}
                  onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                >
                  {[3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} steps</option>)}
                </select>
              </div>
            )}

            {/* Choices */}
            {showChoices && (
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8 }}>Options</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {(question.choices ?? []).map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 18, height: 18, borderRadius: 4, background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: "#6b7280", flexShrink: 0 }}>
                        {"ABCDEFGHIJKLMNOP"[i]}
                      </div>
                      <input type="text" value={c} onChange={e => updateChoice(i, e.target.value)}
                        style={{ flex: 1, padding: "6px 8px", border: "1.5px solid #e5e7eb", borderRadius: 6, fontSize: 12.5, fontFamily: "inherit", outline: "none", background: "white", color: "#374151" }}
                        onFocus={e => e.target.style.borderColor = "#a5b4fc"}
                        onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                      />
                      <button onClick={() => removeChoice(i)}
                        style={{ color: "#d1d5db", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center", flexShrink: 0 }}
                        onMouseEnter={e => e.currentTarget.style.color = "#ef4444"}
                        onMouseLeave={e => e.currentTarget.style.color = "#d1d5db"}>
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={addChoice}
                  style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5, fontSize: 12.5, color: "#6366f1", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
                  <Plus size={13} /> Add option
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── LOGIC section ── */}
      <div style={{ borderBottom: "1px solid #e5e7eb" }}>
        <SectionRow
          label="Logic"
          onClick={() => setLogicExpanded(v => !v)}
          extra={
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* Use a div styled as a button — NOT an actual <button> inside the clickable row */}
              <div
                role="button"
                tabIndex={0}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => { if (e.key === "Enter") e.stopPropagation(); }}
                style={{ width: 20, height: 20, borderRadius: "50%", border: "1.5px solid #d1d5db", background: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#9ca3af" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = "#6366f1"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = "#d1d5db"}
              >
                <Plus size={11} />
              </div>
            </div>
          }
        />
        {logicExpanded && (
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Logic jumps — coming soon</p>
          </div>
        )}
      </div>

      {/* ── COMMENTS section ── */}
      <div style={{ borderBottom: "1px solid #e5e7eb" }}>
        <SectionRow
          label="Comments"
          onClick={() => setCommentsExpanded(v => !v)}
          extra={
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#10b981", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />
            </div>
          }
        />
        {commentsExpanded && (
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Comments — coming soon</p>
          </div>
        )}
      </div>

      {/* ── Bottom: Duplicate + Delete ── */}
      <div style={{ marginTop: "auto", padding: "12px 16px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 8, flexShrink: 0 }}>
        {onDuplicate && (
          <button onClick={onDuplicate}
            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 0", fontSize: 12.5, fontWeight: 500, color: "#374151", background: "white", border: "1px solid #e5e7eb", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
            onMouseLeave={e => e.currentTarget.style.background = "white"}>
            <Copy size={13} /> Duplicate
          </button>
        )}
        <button onClick={onDelete}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 0", fontSize: 12.5, fontWeight: 500, color: "#dc2626", background: "white", border: "1px solid #fecaca", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}
          onMouseEnter={e => e.currentTarget.style.background = "#fef2f2"}
          onMouseLeave={e => e.currentTarget.style.background = "white"}>
          <Trash2 size={13} /> Delete
        </button>
      </div>
    </div>
  );
}
