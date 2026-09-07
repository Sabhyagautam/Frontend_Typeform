"use client";

/**
 * Builder — pixel-perfect Typeform clone.
 * Top: "+ Add content | Design | Mobile | Play | Variables | Logic | Settings" toolbar
 * Left: question list with letter badges (A, B, C…), "Add Welcome Screen" at bottom, Endings section
 * Center: white card preview with underline inputs, large question text
 * Right: "Question ?" / "Answer" / "Logic +" / "Comments" sections
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  Plus, ChevronLeft, Globe, Check, Eye, Settings,
  ChevronDown, ChevronUp, Star, AlertCircle, ArrowRight,
  Smartphone, Monitor, Play, Layers, MessageSquare,
  HelpCircle, Palette, MoreHorizontal, ExternalLink, BarChart2,
} from "lucide-react";
import { formsApi, Form, Question, QuestionType } from "@/lib/api";
import { questionTypeLabel } from "@/lib/utils";
import AddQuestionModal from "@/components/builder/AddQuestionModal";
import QuestionSettings from "@/components/builder/QuestionSettings";
import SortableQuestion from "@/components/builder/SortableQuestion";
import SharePanel from "@/components/builder/SharePanel";

/* ─── Letter colors matching Typeform exactly ─── */
const LETTER_COLORS: Record<string, string> = {
  short_text: "#4f86f7",
  long_text: "#4f86f7",
  email: "#e05a5a",
  number: "#f5a623",
  multiple_choice: "#9b59b6",
  dropdown: "#7c6af7",
  yes_no: "#27ae60",
  rating: "#f5a623",
};

/* ─── Center preview answer input (has OWN local state — the key fix) ─── */
function CenterAnswerInput({ question }: { question: Question }) {
  const [val, setVal] = useState("");
  useEffect(() => { setVal(""); }, [question.id]);

  const underlineInput: React.CSSProperties = {
    background: "transparent", border: "none", borderBottom: "1px solid #d1d5db",
    outline: "none", width: "100%", padding: "8px 0", fontSize: 15,
    fontFamily: "inherit", color: "#374151", transition: "border-color 0.15s",
  };

  switch (question.type) {
    case "short_text":
      return <input type="text" style={underlineInput} placeholder="Your answer here…" value={val} onChange={e => setVal(e.target.value)}
        onFocus={e => e.target.style.borderBottomColor = "#6366f1"} onBlur={e => e.target.style.borderBottomColor = "#d1d5db"} />;
    case "long_text":
      return <textarea style={{ ...underlineInput, resize: "none", minHeight: 72, lineHeight: 1.6 } as React.CSSProperties}
        placeholder="Your answer here…" value={val} onChange={e => setVal(e.target.value)} rows={3}
        onFocus={e => e.target.style.borderBottomColor = "#6366f1"} onBlur={e => e.target.style.borderBottomColor = "#d1d5db"} />;
    case "email":
      return <input type="text" inputMode="email" style={underlineInput} placeholder="name@example.com" value={val} onChange={e => setVal(e.target.value)}
        onFocus={e => e.target.style.borderBottomColor = "#6366f1"} onBlur={e => e.target.style.borderBottomColor = "#d1d5db"} />;
    case "number":
      return <input type="text" inputMode="numeric" style={underlineInput} placeholder="0" value={val} onChange={e => setVal(e.target.value)}
        onFocus={e => e.target.style.borderBottomColor = "#6366f1"} onBlur={e => e.target.style.borderBottomColor = "#d1d5db"} />;
    case "multiple_choice": {
      const choices = question.choices ?? [];
      const KEYS = "ABCDEFGHIJKLMNOP";
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          {choices.length === 0 && <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>Add choices in the settings panel →</p>}
          {choices.map((c, i) => (
            <button key={i} type="button" onClick={() => setVal(val === c ? "" : c)}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 6, border: `1.5px solid ${val === c ? "#6366f1" : "#e5e7eb"}`, background: val === c ? "#eef2ff" : "white", color: val === c ? "#6366f1" : "#374151", fontSize: 14, fontFamily: "inherit", cursor: "pointer", textAlign: "left", transition: "all 0.12s" }}
              onMouseEnter={e => { if (val !== c) e.currentTarget.style.borderColor = "#a5b4fc"; }}
              onMouseLeave={e => { if (val !== c) e.currentTarget.style.borderColor = "#e5e7eb"; }}>
              <span style={{ width: 22, height: 22, borderRadius: 4, border: `1.5px solid ${val === c ? "#6366f1" : "#d1d5db"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, background: val === c ? "#6366f1" : "white", color: val === c ? "white" : "#6b7280" }}>
                {val === c ? <Check size={11} /> : KEYS[i]}
              </span>
              {c}
            </button>
          ))}
        </div>
      );
    }
    case "dropdown": {
      const choices = question.choices ?? [];
      return (
        <div style={{ position: "relative", marginTop: 8 }}>
          <select value={val} onChange={e => setVal(e.target.value)}
            style={{ width: "100%", padding: "10px 36px 10px 12px", border: "1.5px solid #e5e7eb", borderRadius: 7, fontSize: 14, fontFamily: "inherit", background: "white", color: "#374151", outline: "none", appearance: "none", cursor: "pointer" }}
            onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "#e5e7eb"}>
            <option value="">Select an option…</option>
            {choices.map((c, i) => <option key={i} value={c}>{c}</option>)}
          </select>
          <ChevronDown size={14} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#9ca3af" }} />
        </div>
      );
    }
    case "yes_no":
      return (
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          {["Yes", "No"].map(opt => (
            <button key={opt} type="button" onClick={() => setVal(val === opt ? "" : opt)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 7, border: `1.5px solid ${val === opt ? "#6366f1" : "#e5e7eb"}`, background: val === opt ? "#eef2ff" : "white", color: val === opt ? "#6366f1" : "#374151", fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
              {opt === "Yes" ? "👍" : "👎"} {opt}
            </button>
          ))}
        </div>
      );
    case "rating": {
      const steps = question.rating_steps ?? 5;
      const numVal = Number(val);
      return (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Array.from({ length: steps }, (_, i) => i + 1).map(n => (
              <button key={n} type="button" onClick={() => setVal(val === String(n) ? "" : String(n))}
                style={{ width: 42, height: 42, borderRadius: 7, border: `1.5px solid ${numVal >= n ? "#f59e0b" : "#e5e7eb"}`, background: numVal >= n ? "#fffbeb" : "white", color: numVal >= n ? "#f59e0b" : "#6b7280", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {numVal >= n ? <Star size={16} fill="#f59e0b" color="#f59e0b" /> : n}
              </button>
            ))}
          </div>
        </div>
      );
    }
    default: return null;
  }
}

/* ─── Full-screen preview mode ─── */
function PreviewMode({ questions, form, onClose }: { questions: Question[]; form: Form; onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const q = questions[index];
  const color = form.theme_color || "#0445AF";

  function validate() {
    if (!q) return true;
    const v = (answers[q.id] || "").trim();
    if (q.required && !v) { setErrors({ [q.id]: "This question is required" }); return false; }
    if (q.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) { setErrors({ [q.id]: "Please enter a valid email" }); return false; }
    if (q.type === "number" && v && isNaN(Number(v))) { setErrors({ [q.id]: "Please enter a valid number" }); return false; }
    setErrors({}); return true;
  }
  function advance() {
    if (!validate()) return;
    if (index < questions.length - 1) { setDir(1); setIndex(i => i + 1); }
    else setDone(true);
  }
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (done) return;
      if ((e.target as HTMLElement).tagName === "TEXTAREA") return;
      if (e.key === "Enter") { e.preventDefault(); advance(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });
  const pct = questions.length > 0 ? ((index + 1) / questions.length) * 100 : 0;

  if (done) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: color, display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 20, right: 24, color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>✕ Close preview</button>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}><Check size={28} /></div>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 10 }}>{form.thank_you_message || "Thanks for completing this!"}</h1>
        <button onClick={() => { setDone(false); setIndex(0); setAnswers({}); }} style={{ marginTop: 16, padding: "10px 24px", fontSize: 14, fontWeight: 600, color: color, background: "white", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}>Restart preview</button>
      </motion.div>
    </div>
  );
  if (!q) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 500, background: color, color: "white", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.2)" }}>
        <div style={{ height: "100%", background: "rgba(255,255,255,0.6)", transition: "width 0.4s", width: `${pct}%` }} />
      </div>
      <div style={{ position: "absolute", top: 14, right: 90, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{index + 1} / {questions.length}</div>
      <button onClick={onClose} style={{ position: "absolute", top: 10, right: 20, color: "rgba(255,255,255,0.6)", background: "none", border: "none", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>✕ Close</button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "60px 40px" }}>
        <div style={{ width: "100%", maxWidth: 640 }}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div key={q.id} custom={dir}
              variants={{ enter: (d: number) => ({ y: d > 0 ? 70 : -70, opacity: 0 }), center: { y: 0, opacity: 1 }, exit: (d: number) => ({ y: d > 0 ? -70 : 70, opacity: 0 }) }}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, marginBottom: 12, opacity: 0.6 }}>{index + 1} <ArrowRight size={12} /></div>
              <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, lineHeight: 1.3 }}>{q.title || "Untitled"}{q.required && <span style={{ color: "#fca5a5", marginLeft: 4 }}>*</span>}</h2>
              {q.description && <p style={{ fontSize: 16, opacity: 0.7, marginBottom: 24 }}>{q.description}</p>}
              <div style={{ marginBottom: 16 }}><CenterAnswerInput key={q.id} question={q} /></div>
              {errors[q.id] && <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(220,38,38,0.2)", borderRadius: 7, fontSize: 13, color: "#fca5a5", marginBottom: 12 }}><AlertCircle size={14} />{errors[q.id]}</div>}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 16 }}>
                <button onClick={advance} style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 22px", fontSize: 14, fontWeight: 700, color: "white", background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.5)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
                  {index === questions.length - 1 ? <><Check size={14} /> Submit</> : <><Check size={14} /> OK</>}
                </button>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>press <kbd style={{ border: "1px solid rgba(255,255,255,0.3)", borderRadius: 3, padding: "1px 5px", fontSize: 11 }}>Enter</kbd></span>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 20, right: 20, display: "flex", gap: 6 }}>
        <button onClick={() => { if (index > 0) { setDir(-1); setIndex(i => i - 1); } }} disabled={index === 0}
          style={{ width: 36, height: 36, borderRadius: 7, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: index === 0 ? 0.3 : 1 }}>
          <ChevronUp size={16} />
        </button>
        <button onClick={advance} style={{ width: 36, height: 36, borderRadius: 7, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ChevronDown size={16} />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Main Builder Page
═══════════════════════════════════════════════════ */
export default function BuilderPage(props: { params: Promise<{ formId: string }> }) {
  const { formId } = use(props.params);
  const router = useRouter();

  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"create" | "connect" | "share" | "results">("create");
  const [showAddModal, setShowAddModal] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [rightTab, setRightTab] = useState<"question" | "logic" | "comments">("question");

  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const loadForm = useCallback(async () => {
    try {
      setLoading(true);
      const data = await formsApi.get(formId);
      setForm(data); setTitleValue(data.title);
      setQuestions(data.questions || []);
      if (data.questions?.length > 0) setSelectedId(data.questions[0].id);
    } catch { toast.error("Failed to load"); router.push("/"); }
    finally { setLoading(false); }
  }, [formId, router]);

  useEffect(() => { loadForm(); }, [loadForm]);

  async function saveTitle() {
    if (!form || titleValue.trim() === form.title) { setEditingTitle(false); return; }
    try { await formsApi.update(formId, { title: titleValue.trim() }); setForm(f => f ? { ...f, title: titleValue.trim() } : f); }
    catch { toast.error("Failed"); }
    setEditingTitle(false);
  }

  async function handleAddQuestion(type: QuestionType) {
    const defaults: Partial<Question> = {
      type, title: `${questionTypeLabel(type)} question`, required: false,
      choices: ["multiple_choice", "dropdown"].includes(type) ? ["Option A", "Option B", "Option C"] : [],
      rating_steps: type === "rating" ? 5 : undefined,
    };
    try {
      const q = await formsApi.addQuestion(formId, defaults);
      setQuestions(prev => [...prev, q]); setSelectedId(q.id); setShowAddModal(false);
    } catch { toast.error("Failed to add"); }
  }

  function handleQuestionChange(updated: Question) {
    setQuestions(prev => prev.map(q => q.id === updated.id ? updated : q));
    clearTimeout(saveTimers.current[updated.id]);
    saveTimers.current[updated.id] = setTimeout(async () => {
      try { await formsApi.updateQuestion(formId, updated.id, updated); }
      catch { toast.error("Failed to save"); }
    }, 600);
  }

  async function handleQuestionSave(updated: Question) {
    setQuestions(prev => prev.map(q => q.id === updated.id ? updated : q));
    try { await formsApi.updateQuestion(formId, updated.id, updated); }
    catch { toast.error("Failed"); }
  }

  async function handleDeleteQuestion(id: string) {
    try {
      await formsApi.deleteQuestion(formId, id);
      setQuestions(prev => {
        const next = prev.filter(q => q.id !== id);
        if (selectedId === id) { const idx = prev.findIndex(q => q.id === id); setSelectedId(next[Math.max(0, idx - 1)]?.id ?? null); }
        return next;
      });
    } catch { toast.error("Failed"); }
  }

  async function handleDuplicateQuestion(q: Question) {
    try {
      const copy = await formsApi.addQuestion(formId, { ...q, title: q.title + " (copy)" });
      setQuestions(prev => { const idx = prev.findIndex(x => x.id === q.id); const next = [...prev]; next.splice(idx + 1, 0, copy); return next; });
      setSelectedId(copy.id);
    } catch { toast.error("Failed"); }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIdx = questions.findIndex(q => q.id === active.id);
    const newIdx = questions.findIndex(q => q.id === over.id);
    const reordered = arrayMove(questions, oldIdx, newIdx);
    setQuestions(reordered);
    try { await formsApi.reorderQuestions(formId, reordered.map((q, i) => ({ id: q.id, order_index: i }))); }
    catch { toast.error("Failed to reorder"); }
  }

  async function togglePublish() {
    if (!form) return;
    setPublishing(true);
    try {
      if (form.status === "published") { await formsApi.unpublish(formId); setForm(f => f ? { ...f, status: "draft" } : f); toast.success("Unpublished"); }
      else { const updated = await formsApi.publish(formId); setForm(updated); toast.success("Published!"); }
    } catch { toast.error("Failed"); }
    finally { setPublishing(false); }
  }

  const selectedQ = questions.find(q => q.id === selectedId) ?? null;
  const qIndex = selectedQ ? questions.findIndex(q => q.id === selectedQ.id) : -1;
  const LETTER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "white" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid #e5e7eb", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!form) return null;

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', -apple-system, sans-serif; }
        .q-row:hover { background: #f5f5f5 !important; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: "white" }}>

        {/* ══ ROW 1: breadcrumb + Content/Workflow/Connect tabs + Share + Publish ══ */}
        <header style={{ height: 46, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 16px", flexShrink: 0, background: "white", zIndex: 40 }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 24, flexShrink: 0 }}>
            <Link href="/" style={{ display: "flex", alignItems: "center", color: "#6b7280", textDecoration: "none", fontSize: 13 }}>
              Forms
            </Link>
            <span style={{ color: "#d1d5db", fontSize: 14 }}>›</span>
            {editingTitle ? (
              <input autoFocus value={titleValue} onChange={e => setTitleValue(e.target.value)}
                onBlur={saveTitle} onKeyDown={e => { if (e.key === "Enter") saveTitle(); if (e.key === "Escape") setEditingTitle(false); }}
                style={{ fontSize: 13, fontWeight: 600, color: "#111827", border: "none", borderBottom: "2px solid #6366f1", outline: "none", background: "transparent", padding: "1px 0", width: 160, fontFamily: "inherit" }} />
            ) : (
              <button onClick={() => { setEditingTitle(true); setTitleValue(form.title); }}
                style={{ fontSize: 13, fontWeight: 600, color: "#111827", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {form.title}
              </button>
            )}
          </div>

          {/* Center: Content / Workflow / Connect tabs */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
            {[
              { label: "Content", active: true },
              { label: "Workflow", active: false },
              { label: "Connect", active: false },
            ].map(t => (
              <button key={t.label}
                onClick={() => !t.active && toast("Coming soon", { icon: "🚧" })}
                style={{
                  padding: "12px 18px", fontSize: 14, fontWeight: t.active ? 600 : 400,
                  color: t.active ? "#111827" : "#6b7280",
                  background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                  boxShadow: t.active ? "inset 0 -2px 0 #111827" : "none",
                  transition: "color 0.1s",
                }}
                onMouseEnter={e => { if (!t.active) e.currentTarget.style.color = "#374151"; }}
                onMouseLeave={e => { if (!t.active) e.currentTarget.style.color = "#6b7280"; }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Right: Share + Publish button */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {/* Share button */}
            <button
              onClick={() => {
                if (form.status === "published" && form.public_id) {
                  navigator.clipboard.writeText(`${window.location.origin}/f/${form.public_id}`);
                  toast.success("Share link copied!");
                } else {
                  toast("Publish your form first to get a share link", { icon: "🔒" });
                }
              }}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: 13, fontWeight: 500, color: "#374151", background: "white", border: "1px solid #d1d5db", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background = "white"}>
              <ExternalLink size={13} /> Share
            </button>

            {/* View plans / Publish */}
            {form.status === "published" ? (
              <button onClick={togglePublish} disabled={publishing}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", fontSize: 13, fontWeight: 700, color: "white", background: "#16a34a", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}>
                <Check size={13} /> Published
              </button>
            ) : (
              <button onClick={togglePublish} disabled={publishing}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 16px", fontSize: 13, fontWeight: 700, color: "white", background: "#1a7f4b", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={e => e.currentTarget.style.background = "#156b3f"}
                onMouseLeave={e => e.currentTarget.style.background = "#1a7f4b"}>
                <Globe size={13} /> {publishing ? "Publishing…" : "Publish"}
              </button>
            )}

            {/* Open live form */}
            {form.status === "published" && form.public_id && (
              <a href={`/f/${form.public_id}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", padding: "6px 8px", color: "#6b7280", border: "1px solid #e5e7eb", borderRadius: 7, textDecoration: "none" }} title="Open live form">
                <ExternalLink size={14} />
              </a>
            )}

            {/* Results link */}
            <button onClick={() => router.push(`/forms/${formId}/results`)}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 11px", fontSize: 12.5, fontWeight: 500, color: "#6b7280", background: "none", border: "1px solid #e5e7eb", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
              onMouseLeave={e => e.currentTarget.style.background = "none"}>
              <BarChart2 size={13} /> Results
            </button>
          </div>
        </header>

        {/* ══ ROW 2: Universal mode + Add content + Design + icons toolbar ══ */}
        <div style={{ height: 46, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 12px", gap: 8, flexShrink: 0, background: "white", zIndex: 39 }}>
          {/* Universal mode dropdown */}
          <button
            onClick={() => toast("Coming soon", { icon: "🚧" })}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", fontSize: 12.5, fontWeight: 500, color: "#374151", background: "white", border: "1px solid #e5e7eb", borderRadius: 7, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}>
            <span style={{ fontSize: 13 }}>⊞</span> Universal mode <ChevronDown size={12} color="#9ca3af" />
          </button>

          <div style={{ width: 1, height: 22, background: "#e5e7eb", flexShrink: 0 }} />

          {/* + Add content — the main black pill button */}
          <button onClick={() => setShowAddModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", fontSize: 13, fontWeight: 600, color: "white", background: "#1f1f1f", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = "#333"}
            onMouseLeave={e => e.currentTarget.style.background = "#1f1f1f"}>
            <Plus size={14} strokeWidth={2.5} /> Add content
          </button>

          {/* Design */}
          <button onClick={() => toast("Design — coming soon", { icon: "🚧" })}
            style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", fontSize: 13, fontWeight: 500, color: "#374151", background: "none", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}>
            <Palette size={14} /> Design
          </button>

          {/* Icon-only toolbar buttons matching Typeform exactly */}
          {[
            { icon: <Smartphone size={16} />, title: "Mobile preview", action: () => toast("Mobile — coming soon", { icon: "📱" }) },
            { icon: <Play size={16} />, title: "Preview", action: () => setPreviewMode(true) },
            { icon: <HelpCircle size={16} />, title: "Variables", action: () => toast("Variables — coming soon", { icon: "🚧" }) },
            { icon: <Layers size={16} />, title: "Logic", action: () => toast("Logic — coming soon", { icon: "🚧" }) },
            { icon: <Settings size={16} />, title: "Settings", action: () => toast("Settings — coming soon", { icon: "🚧" }) },
          ].map(btn => (
            <button key={btn.title} onClick={btn.action} title={btn.title}
              style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280", background: "none", border: "none", borderRadius: 7, cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = "#374151"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#6b7280"; }}>
              {btn.icon}
            </button>
          ))}
        </div>

        {/* ══ BODY ═══════════════════════════════════ */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* LEFT: question list */}
          <aside style={{ width: 180, borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", background: "#fafafa", flexShrink: 0, overflowY: "auto" }}>
            {/* Page header */}
            <div style={{ padding: "10px 10px 6px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>Pages</div>
              {questions.length === 0 ? (
                <div style={{ textAlign: "center", padding: "20px 8px", color: "#d1d5db" }}>
                  <p style={{ fontSize: 11, lineHeight: 1.5 }}>No questions yet</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} modifiers={[restrictToVerticalAxis]}>
                  <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                    {questions.map((q, i) => (
                      <SortableQuestion key={q.id} question={q} index={i} selected={selectedId === q.id} onClick={() => setSelectedId(q.id)} />
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>

            {/* Add welcome screen button */}
            <div style={{ padding: "0 8px 6px" }}>
              <button onClick={() => toast("Welcome screen — coming soon", { icon: "👋" })}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 7, padding: "7px 8px", fontSize: 12, color: "#6b7280", background: "none", border: "1px dashed #d1d5db", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "#6366f1"} onMouseLeave={e => e.currentTarget.style.borderColor = "#d1d5db"}>
                <Plus size={12} /> Add Welcome Screen
              </button>
            </div>

            {/* Endings */}
            <div style={{ padding: "8px 10px 12px", marginTop: "auto", borderTop: "1px solid #e5e7eb" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                Endings <Plus size={11} style={{ cursor: "pointer" }} onClick={() => toast("Coming soon", { icon: "🚧" })} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 8px", background: "white", border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 12, color: "#374151", cursor: "pointer" }}
                onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "white")}>
                <div style={{ width: 20, height: 20, borderRadius: 4, background: "#1f1f1f", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={11} color="white" />
                </div>
                <span style={{ fontWeight: 500 }}>End Screen</span>
              </div>
            </div>
          </aside>

          {/* CENTER: preview */}
          <div style={{
            flex: 1, display: "flex", flexDirection: "column",
            background: "#f5f5f5",
            backgroundImage: "radial-gradient(#dde0e6 1px, transparent 1px)",
            backgroundSize: "20px 20px",
            overflow: "hidden",
          }}>
            {/* Center toolbar */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderBottom: "1px solid #e5e7eb", background: "rgba(255,255,255,0.8)", flexShrink: 0 }}>
              {[{ label: "Desktop", icon: <Monitor size={13} /> }, { label: "Mobile", icon: <Smartphone size={13} /> }].map(({ label, icon }) => (
                <button key={label}
                  style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 12px", fontSize: 12, fontWeight: 500, borderRadius: 6, cursor: "pointer", fontFamily: "inherit", background: label === "Desktop" ? "white" : "none", color: label === "Desktop" ? "#374151" : "#9ca3af", border: label === "Desktop" ? "1px solid #e5e7eb" : "1px solid transparent", boxShadow: label === "Desktop" ? "0 1px 2px rgba(0,0,0,0.05)" : "none" }}
                  onClick={() => label === "Mobile" && toast("Mobile — coming soon", { icon: "📱" })}>
                  {icon} {label}
                </button>
              ))}
            </div>

            {/* Preview card */}
            <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "28px" }}>
              {!selectedQ ? (
                <div style={{ textAlign: "center", color: "#9ca3af" }}>
                  <div style={{ width: 56, height: 56, border: "2px dashed #d1d5db", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                    <Plus size={20} color="#d1d5db" />
                  </div>
                  <p style={{ fontWeight: 500, marginBottom: 4 }}>Select a question to preview</p>
                  <p style={{ fontSize: 13 }}>Or click "+ Add content" to create one</p>
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div key={selectedQ.id}
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.18 }}
                    style={{ background: "white", borderRadius: 12, padding: "40px 48px", maxWidth: 640, width: "100%", boxShadow: "0 2px 20px rgba(0,0,0,0.06)" }}>

                    {/* Question number badge */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 4, background: LETTER_COLORS[selectedQ.type] || "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
                        {LETTER[qIndex] || "?"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>
                        {questionTypeLabel(selectedQ.type)}
                      </div>
                    </div>

                    {/* Editable question title */}
                    <textarea
                      value={selectedQ.title}
                      onChange={e => handleQuestionChange({ ...selectedQ, title: e.target.value })}
                      placeholder="Write a question…"
                      rows={2}
                      style={{ width: "100%", fontSize: 22, fontWeight: 700, color: "#111827", border: "none", outline: "none", resize: "none", background: "transparent", fontFamily: "inherit", lineHeight: 1.35, padding: 0, marginBottom: 6 }}
                    />

                    {/* Editable description */}
                    <input
                      type="text"
                      value={selectedQ.description ?? ""}
                      onChange={e => handleQuestionChange({ ...selectedQ, description: e.target.value })}
                      placeholder="Description (optional)"
                      style={{ width: "100%", fontSize: 14, color: "#9ca3af", border: "none", outline: "none", background: "transparent", fontFamily: "inherit", padding: 0, marginBottom: 20, fontStyle: "italic" }}
                    />

                    {/* The answer input — HAS OWN STATE */}
                    <CenterAnswerInput key={selectedQ.id} question={selectedQ} />

                    {selectedQ.required && (
                      <p style={{ fontSize: 11.5, color: "#ef4444", marginTop: 8 }}>* Required</p>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>

            {/* Chat to create bar (Typeform-style bottom bar) */}
            <div style={{ padding: "10px 24px", borderTop: "1px solid #e5e7eb", background: "white", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 24, color: "#9ca3af" }}>
                <MessageSquare size={14} />
                <span style={{ fontSize: 13 }}>Chat to create</span>
              </div>
              <button style={{ width: 34, height: 34, borderRadius: "50%", background: "#e5e7eb", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }} onClick={() => toast("AI features — coming soon", { icon: "✨" })}>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>

          {/* RIGHT: Question/Answer/Logic panel */}
          <aside style={{ width: 250, borderLeft: "1px solid #e5e7eb", background: "white", overflowY: "auto", flexShrink: 0 }}>
            {selectedQ ? (
              <QuestionSettings
                question={selectedQ}
                onChange={handleQuestionSave}
                onDelete={() => handleDeleteQuestion(selectedQ.id)}
                onDuplicate={() => handleDuplicateQuestion(selectedQ)}
              />
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", padding: 20 }}>
                <p style={{ fontSize: 13, color: "#d1d5db", textAlign: "center" }}>Select a question to edit settings</p>
              </div>
            )}
          </aside>
        </div>
      </div>

      {showAddModal && <AddQuestionModal onSelect={handleAddQuestion} onClose={() => setShowAddModal(false)} />}
      {previewMode && <PreviewMode questions={questions} form={form} onClose={() => setPreviewMode(false)} />}
    </>
  );
}
