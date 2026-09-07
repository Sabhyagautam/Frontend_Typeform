"use client";

/**
 * Results page — pixel-perfect Typeform clone.
 * Top bar: "New form > Create | Connect | Share | Results" tabs + "View live form" + "Export CSV"
 * Body: form title + stats cards + Responses/Summary tabs
 * Responses tab: clean table with Submitted date + answer columns, click row for full detail
 * Summary tab: per-question cards with animated bar charts
 */

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  ChevronLeft, ExternalLink, Download, BarChart2, List,
  Globe, ArrowLeft, Users, Check, Star, Eye, TrendingUp,
} from "lucide-react";
import { formsApi, responsesApi, Form, Question, Response, FormStats } from "@/lib/api";
import { formatDate, questionTypeLabel } from "@/lib/utils";

/* ── Individual response detail ── */
function IndividualResponse({ response, questions, onBack }: {
  response: Response; questions: Question[]; onBack: () => void;
}) {
  const qMap = Object.fromEntries(questions.map(q => [q.id, q]));

  return (
    <div>
      <button onClick={onBack}
        style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginBottom: 20, padding: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = "#374151"} onMouseLeave={e => e.currentTarget.style.color = "#6b7280"}>
        <ArrowLeft size={14} /> Back to all responses
      </button>

      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fafafa" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>Response detail</p>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>Submitted {formatDate(response.submitted_at)}</p>
          </div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: "#dcfce7", color: "#16a34a" }}>
            <Check size={11} /> Complete
          </span>
        </div>

        {/* Answers */}
        {(response.answers || []).map((answer, i) => {
          const q = qMap[answer.question_id];
          let val = answer.value ?? "—";
          try { const p = JSON.parse(val); if (Array.isArray(p)) val = p.join(", "); } catch {}
          return (
            <div key={answer.id} style={{ padding: "14px 20px", borderBottom: i < (response.answers?.length ?? 0) - 1 ? "1px solid #f9fafb" : "none" }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                {q ? questionTypeLabel(q.type) : "Question"}
              </p>
              <p style={{ fontSize: 13, fontWeight: 500, color: "#6b7280", marginBottom: 6 }}>{q?.title ?? answer.question_id}</p>
              {q?.type === "rating" && val !== "—" ? (
                <div style={{ display: "flex", gap: 3 }}>
                  {Array.from({ length: q.rating_steps ?? 5 }, (_, idx) => (
                    <Star key={idx} size={16} fill={idx < Number(val) ? "#f59e0b" : "none"} color={idx < Number(val) ? "#f59e0b" : "#d1d5db"} />
                  ))}
                  <span style={{ marginLeft: 8, fontSize: 13, fontWeight: 600, color: "#374151" }}>{val} / {q.rating_steps ?? 5}</span>
                </div>
              ) : (
                <p style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{val}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Responses table ── */
function ResponsesTable({ responses, questions, onView }: {
  responses: Response[]; questions: Question[]; onView: (r: Response) => void;
}) {
  const colQs = questions.slice(0, 3);

  function getAns(r: Response, qId: string) {
    const a = r.answers?.find(x => x.question_id === qId);
    if (!a?.value) return "—";
    let v = a.value;
    try { const p = JSON.parse(v); if (Array.isArray(p)) v = p.join(", "); } catch {}
    return v.length > 55 ? v.slice(0, 55) + "…" : v;
  }

  if (responses.length === 0) return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
      <div style={{ width: 52, height: 52, border: "2px dashed #e5e7eb", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
        <Users size={20} color="#d1d5db" />
      </div>
      <p style={{ fontWeight: 500, marginBottom: 4, color: "#6b7280" }}>No responses yet</p>
      <p style={{ fontSize: 13 }}>Share your form link to start collecting responses.</p>
    </div>
  );

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", background: "white" }}>
      {/* Table header */}
      <div style={{ display: "grid", gridTemplateColumns: `140px repeat(${colQs.length}, 1fr) 40px`, borderBottom: "1px solid #e5e7eb", background: "#fafafa", padding: "0" }}>
        {["Submitted", ...colQs.map(q => q.title), ""].map((h, i) => (
          <div key={i} style={{ padding: "10px 16px", fontSize: 11.5, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.06em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h}</div>
        ))}
      </div>

      {responses.map((r, idx) => (
        <div key={r.id}
          onClick={() => onView(r)}
          style={{ display: "grid", gridTemplateColumns: `140px repeat(${colQs.length}, 1fr) 40px`, borderBottom: idx < responses.length - 1 ? "1px solid #f9fafb" : "none", cursor: "pointer", background: "white", transition: "background 0.1s" }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#fafafa"}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "white"}>
          <div style={{ padding: "12px 16px", fontSize: 13, color: "#6b7280", whiteSpace: "nowrap" }}>{formatDate(r.submitted_at)}</div>
          {colQs.map(q => (
            <div key={q.id} style={{ padding: "12px 16px", fontSize: 13, color: "#374151", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getAns(r, q.id)}</div>
          ))}
          <div style={{ padding: "12px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Eye size={14} color="#d1d5db" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Summary stats ── */
function SummaryTab({ stats, questions }: { stats: FormStats; questions: Question[] }) {
  const qMap = Object.fromEntries(questions.map(q => [q.id, q]));

  if (stats.total_responses === 0) return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "#9ca3af" }}>
      <p style={{ fontWeight: 500 }}>No responses to summarize yet.</p>
    </div>
  );

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
      {stats.questions.map(qs => {
        const q = qMap[qs.question_id];
        if (!q) return null;
        return (
          <div key={qs.question_id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "18px 20px" }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
              {questionTypeLabel(q.type)}
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 14, lineHeight: 1.4 }}>{q.title}</p>

            {/* Text answers */}
            {["short_text", "long_text", "email"].includes(q.type) && (
              <p style={{ fontSize: 13, color: "#9ca3af", fontStyle: "italic" }}>
                {qs.total_answers} text answer{qs.total_answers !== 1 ? "s" : ""} — see individual responses tab.
              </p>
            )}

            {/* Average (number / rating) */}
            {qs.average != null && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: qs.choice_counts?.length ? 14 : 0 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: "#6366f1" }}>{qs.average.toFixed(1)}</span>
                <div>
                  <p style={{ fontSize: 12, color: "#9ca3af" }}>average</p>
                  {q.type === "rating" && (
                    <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
                      {Array.from({ length: q.rating_steps ?? 5 }, (_, i) => (
                        <Star key={i} size={13} fill={i < Math.round(qs.average!) ? "#f59e0b" : "none"} color={i < Math.round(qs.average!) ? "#f59e0b" : "#d1d5db"} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Choice bar chart */}
            {qs.choice_counts && qs.choice_counts.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {qs.choice_counts.map(cc => {
                  const pct = stats.total_responses > 0 ? Math.round((cc.count / stats.total_responses) * 100) : 0;
                  return (
                    <div key={cc.choice}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#374151", maxWidth: "70%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cc.choice}</span>
                        <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 500 }}>{cc.count} ({pct}%)</span>
                      </div>
                      <div style={{ height: 6, background: "#f3f4f6", borderRadius: 3, overflow: "hidden" }}>
                        <motion.div
                          style={{ height: "100%", background: "#6366f1", borderRadius: 3 }}
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Results page ── */
export default function ResultsPage(props: { params: Promise<{ formId: string }> }) {
  const { formId } = use(props.params);
  const router = useRouter();

  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [stats, setStats] = useState<FormStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"responses" | "summary">("responses");
  const [selected, setSelected] = useState<Response | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [f, r, s] = await Promise.all([formsApi.get(formId), responsesApi.list(formId), responsesApi.stats(formId)]);
        setForm(f); setResponses(r); setStats(s);
      } catch { toast.error("Failed to load"); router.push("/"); }
      finally { setLoading(false); }
    }
    load();
  }, [formId, router]);

  function exportCSV() {
    if (!form || !responses.length) return;
    const qs = form.questions || [];
    const headers = ["Submitted At", ...qs.map(q => q.title)];
    const rows = responses.map(r => {
      const row = [new Date(r.submitted_at).toISOString()];
      for (const q of qs) {
        const a = r.answers?.find(x => x.question_id === q.id);
        let v = a?.value ?? "";
        try { const p = JSON.parse(v); if (Array.isArray(p)) v = p.join("; "); } catch {}
        if (v.includes(",") || v.includes("\n") || v.includes('"')) v = `"${v.replace(/"/g, '""')}"`;
        row.push(v);
      }
      return row.join(",");
    });
    const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${(form.title || "responses").replace(/[^a-z0-9]/gi, "_")}_responses.csv`;
    a.click(); toast.success("CSV downloaded");
  }

  if (loading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "white" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "2.5px solid #e5e7eb", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
  if (!form) return null;

  const questions = form.questions || [];

  return (
    <>
      <style>{`* { box-sizing: border-box; } body { margin: 0; font-family: 'Inter', -apple-system, sans-serif; }`}</style>
      <div style={{ minHeight: "100vh", background: "white" }}>

        {/* ══ TOP BAR (matches Typeform builder header style) ══ */}
        <header style={{ height: 46, borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", padding: "0 16px", background: "white", position: "sticky", top: 0, zIndex: 50 }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginRight: 20, flexShrink: 0 }}>
            <button onClick={() => router.push("/")}
              style={{ fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
              Forms
            </button>
            <span style={{ color: "#d1d5db" }}>›</span>
            <button onClick={() => router.push(`/forms/${formId}/builder`)}
              style={{ fontSize: 13, fontWeight: 600, color: "#111827", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {form.title}
            </button>
          </div>

          {/* Center tabs: Create | Connect | Share | Results */}
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {[
              { label: "Create", href: `/forms/${formId}/builder` },
              { label: "Connect", href: null },
              { label: "Share", href: null },
              { label: "Results", href: null },
            ].map(t => (
              <button key={t.label}
                onClick={() => t.href ? router.push(t.href) : (t.label === "Results" ? null : toast("Coming soon", { icon: "🚧" }))}
                style={{
                  padding: "12px 18px", fontSize: 14,
                  fontWeight: t.label === "Results" ? 600 : 400,
                  color: t.label === "Results" ? "#111827" : "#6b7280",
                  background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                  boxShadow: t.label === "Results" ? "inset 0 -2px 0 #111827" : "none",
                }}
                onMouseEnter={e => { if (t.label !== "Results") e.currentTarget.style.color = "#374151"; }}
                onMouseLeave={e => { if (t.label !== "Results") e.currentTarget.style.color = "#6b7280"; }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {form.status === "published" && form.public_id && (
              <a href={`/f/${form.public_id}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 13, fontWeight: 500, color: "#374151", border: "1px solid #e5e7eb", borderRadius: 7, textDecoration: "none", background: "white" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#f9fafb"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "white"}>
                <Globe size={13} /> View live form <ExternalLink size={11} />
              </a>
            )}
            <button onClick={exportCSV} disabled={responses.length === 0}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 13, fontWeight: 500, color: responses.length === 0 ? "#d1d5db" : "#374151", border: "1px solid #e5e7eb", borderRadius: 7, background: "white", cursor: responses.length === 0 ? "not-allowed" : "pointer", fontFamily: "inherit" }}
              onMouseEnter={e => { if (responses.length > 0) e.currentTarget.style.background = "#f9fafb"; }}
              onMouseLeave={e => e.currentTarget.style.background = "white"}>
              <Download size={13} /> Export CSV
            </button>
          </div>
        </header>

        {/* ══ BODY ══ */}
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 28px" }}>

          {/* Form title + meta */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#111827", marginBottom: 8, letterSpacing: "-0.02em" }}>{form.title}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600, background: form.status === "published" ? "#dcfce7" : "#f3f4f6", color: form.status === "published" ? "#16a34a" : "#6b7280" }}>
                {form.status === "published" ? <><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block" }} /> Published</> : "Draft"}
              </span>
              <span style={{ fontSize: 13, color: "#9ca3af" }}>{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Stats cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 32 }}>
            {[
              { icon: <Users size={13} />, label: "TOTAL RESPONSES", value: responses.length, color: "#6366f1" },
              { icon: <List size={13} />, label: "QUESTIONS", value: questions.length, color: "#111827" },
              { icon: <TrendingUp size={13} />, label: "COMPLETION", value: responses.length > 0 ? "100%" : "—", color: "#111827" },
            ].map(card => (
              <div key={card.label} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 10, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 10 }}>
                  {card.icon} {card.label}
                </div>
                <div style={{ fontSize: 36, fontWeight: 800, color: card.color, lineHeight: 1 }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Responses / Summary tab switcher */}
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: 24, gap: 0 }}>
            {[
              { key: "responses", label: `Responses (${responses.length})`, icon: <List size={14} /> },
              { key: "summary", label: "Summary", icon: <BarChart2 size={14} /> },
            ].map(t => (
              <button key={t.key}
                onClick={() => { setActiveTab(t.key as "responses" | "summary"); setSelected(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "10px 18px",
                  fontSize: 14, fontWeight: activeTab === t.key ? 600 : 400,
                  color: activeTab === t.key ? "#111827" : "#6b7280",
                  background: "none", border: "none", cursor: "pointer", fontFamily: "inherit",
                  boxShadow: activeTab === t.key ? "inset 0 -2px 0 #111827" : "none",
                }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "responses" && (
            selected
              ? <IndividualResponse response={selected} questions={questions} onBack={() => setSelected(null)} />
              : <ResponsesTable responses={responses} questions={questions} onView={setSelected} />
          )}
          {activeTab === "summary" && stats && <SummaryTab stats={stats} questions={questions} />}
        </div>
      </div>
    </>
  );
}
