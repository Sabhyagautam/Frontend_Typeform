"use client";

/**
 * Dashboard — pixel-perfect Typeform clone.
 * Layout: Left sidebar (light grey, ~230px) + right main area with top tab bar.
 * Main area: "My workspace" heading with list/grid toggle, table-style list view.
 * Matches the real Typeform dashboard exactly.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  Plus, Search, MoreHorizontal, Copy, Trash2, ExternalLink,
  BarChart2, Edit3, Globe, EyeOff, ChevronDown,
  LayoutGrid, List, Check, Link2, HelpCircle, Settings,
  ChevronRight, Users, Zap, BarChart, FlaskConical,
  Star, FolderOpen, ChevronUp,
} from "lucide-react";
import { formsApi, FormListItem } from "@/lib/api";
import { formatRelativeDate } from "@/lib/utils";

/* ── small coloured square for form row ── */
function FormThumb({ id }: { id: string }) {
  const COLORS = [
    "#f97316","#8b5cf6","#3b82f6","#10b981",
    "#f59e0b","#ec4899","#06b6d4","#ef4444",
    "#84cc16","#6366f1","#14b8a6","#f43f5e",
  ];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  const bg = COLORS[Math.abs(h) % COLORS.length];
  return (
    <div style={{ width: 32, height: 32, borderRadius: 6, background: bg, flexShrink: 0 }} />
  );
}

/* ── 3-dot row menu ── */
function RowMenu({ form, onRename, onDuplicate, onDelete, onTogglePublish }:
  { form: FormListItem; onRename: () => void; onDuplicate: () => void; onDelete: () => void; onTogglePublish: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  const Item = ({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) => (
    <button onClick={(e) => { e.stopPropagation(); onClick(); setOpen(false); }}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 14px", fontSize: 13.5, color: danger ? "#dc2626" : "#374151", background: "none", border: "none", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? "#fef2f2" : "#f9fafb"}
      onMouseLeave={e => e.currentTarget.style.background = "none"}>
      {icon} {label}
    </button>
  );

  return (
    <div ref={ref} style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(v => !v)}
        style={{ width: 32, height: 32, border: "1px solid #e5e7eb", borderRadius: 6, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#6b7280" }}
        onMouseEnter={e => e.currentTarget.style.background = "#f9fafb"}
        onMouseLeave={e => e.currentTarget.style.background = "white"}>
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: 36, background: "white", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", padding: "4px 0", minWidth: 190, zIndex: 300 }}>
          <Item icon={<Edit3 size={14} />} label="Edit" onClick={() => {}} />
          <Item icon={<Copy size={14} />} label="Duplicate" onClick={onDuplicate} />
          <Item icon={<BarChart2 size={14} />} label="View results" onClick={() => {}} />
          <div style={{ height: 1, background: "#f3f4f6", margin: "4px 0" }} />
          <Item icon={form.status === "published" ? <EyeOff size={14} /> : <Globe size={14} />}
            label={form.status === "published" ? "Unpublish" : "Publish"} onClick={onTogglePublish} />
          {form.status === "published" && form.public_id && (
            <Item icon={<Link2 size={14} />} label="Copy link" onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/f/${form.public_id}`);
              toast.success("Link copied!");
            }} />
          )}
          <div style={{ height: 1, background: "#f3f4f6", margin: "4px 0" }} />
          <Item icon={<Trash2 size={14} />} label="Delete" onClick={onDelete} danger />
        </div>
      )}
    </div>
  );
}

/* ── Rename modal ── */
function RenameModal({ form, onSave, onClose }: { form: FormListItem; onSave: (id: string, t: string) => void; onClose: () => void }) {
  const [val, setVal] = useState(form.title);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setTimeout(() => { ref.current?.focus(); ref.current?.select(); }, 50); }, []);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "white", borderRadius: 12, padding: "28px 28px 24px", width: 420, boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 16, color: "#111827" }}>Rename typeform</h3>
        <input ref={ref} value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && val.trim()) onSave(form.id, val.trim()); if (e.key === "Escape") onClose(); }}
          style={{ width: "100%", padding: "10px 12px", border: "1.5px solid #d1d5db", borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "inherit", boxSizing: "border-box", marginBottom: 18 }}
          onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "#d1d5db"} />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} style={{ padding: "8px 18px", fontSize: 13.5, fontWeight: 500, color: "#374151", background: "white", border: "1px solid #d1d5db", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          <button onClick={() => val.trim() && onSave(form.id, val.trim())}
            style={{ padding: "8px 18px", fontSize: 13.5, fontWeight: 600, color: "white", background: "#1f1f1f", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}>Save</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Dashboard ── */
export default function DashboardPage() {
  const router = useRouter();
  const [forms, setForms] = useState<FormListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"updated" | "created" | "alpha">("updated");
  const [sortOpen, setSortOpen] = useState(false);
  const [renaming, setRenaming] = useState<FormListItem | null>(null);
  const [activeTab, setActiveTab] = useState("Forms");
  const [workspaceOpen, setWorkspaceOpen] = useState(true);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sortOpen) return;
    const fn = (e: MouseEvent) => { if (!sortRef.current?.contains(e.target as Node)) setSortOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [sortOpen]);

  const loadForms = useCallback(async () => {
    try { setLoading(true); setForms(await formsApi.list()); }
    catch { toast.error("Failed to load forms"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadForms(); }, [loadForms]);

  async function createForm() {
    try { const f = await formsApi.create({ title: "New form" }); router.push(`/forms/${f.id}/builder`); }
    catch { toast.error("Failed to create"); }
  }
  async function duplicateForm(id: string) {
    const t = toast.loading("Duplicating…");
    try { await formsApi.duplicate(id); await loadForms(); toast.success("Duplicated", { id: t }); }
    catch { toast.error("Failed", { id: t }); }
  }
  async function deleteForm(id: string) {
    if (!confirm("Delete this form? This cannot be undone.")) return;
    try { await formsApi.delete(id); setForms(p => p.filter(f => f.id !== id)); toast.success("Deleted"); }
    catch { toast.error("Failed"); }
  }
  async function togglePublish(form: FormListItem) {
    try {
      if (form.status === "published") { await formsApi.unpublish(form.id); toast.success("Unpublished"); }
      else { await formsApi.publish(form.id); toast.success("Published!"); }
      await loadForms();
    } catch { toast.error("Failed"); }
  }
  async function saveRename(id: string, title: string) {
    try { await formsApi.update(id, { title }); setForms(p => p.map(f => f.id === id ? { ...f, title } : f)); setRenaming(null); toast.success("Renamed"); }
    catch { toast.error("Failed"); }
  }

  const sortLabels: Record<string, string> = { updated: "Date updated", created: "Date created", alpha: "Alphabetical" };
  const filtered = forms
    .filter(f => f.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "alpha") return a.title.localeCompare(b.title);
      if (sortBy === "created") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  const TABS = ["Forms", "Contacts", "Automations", "Insights", "Research Flow"];

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: #f9f9f9; }
        .row-hover:hover { background: #f9fafb !important; }
      `}</style>

      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>

        {/* ══ LEFT SIDEBAR ══════════════════════════════ */}
        <aside style={{ width: 230, background: "white", borderRight: "1px solid #e5e7eb", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto" }}>

          {/* Logo + top area */}
          <div style={{ padding: "18px 16px 0" }}>
            {/* Logo row */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 24, height: 24, background: "#1f1f1f", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontSize: 12, fontWeight: 800 }}>T</div>
                <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>typeform</span>
              </div>
              <div style={{ display: "flex", gap: 2 }}>
                <button onClick={() => toast("Coming soon", { icon: "🚧" })} style={{ width: 28, height: 28, border: "none", background: "none", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 5 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <Zap size={15} />
                </button>
                <button onClick={() => toast("Coming soon", { icon: "🚧" })} style={{ width: 28, height: 28, border: "none", background: "none", cursor: "pointer", color: "#6b7280", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 5 }}
                  onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                  <Star size={15} />
                </button>
              </div>
            </div>

            {/* Create form button */}
            <button onClick={createForm}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "9px 0", fontSize: 13.5, fontWeight: 700, color: "white", background: "#1f1f1f", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", marginBottom: 14 }}
              onMouseEnter={e => e.currentTarget.style.background = "#333"} onMouseLeave={e => e.currentTarget.style.background = "#1f1f1f"}>
              <Plus size={15} strokeWidth={2.5} /> Create form
            </button>

            {/* Search */}
            <div style={{ position: "relative", marginBottom: 6 }}>
              <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
                style={{ width: "100%", paddingLeft: 30, paddingRight: 10, paddingTop: 7, paddingBottom: 7, border: "1px solid #e5e7eb", borderRadius: 7, fontSize: 13, color: "#374151", outline: "none", fontFamily: "inherit", background: "#fafafa", boxSizing: "border-box" }}
                onFocus={e => { e.target.style.borderColor = "#6366f1"; e.target.style.background = "white"; }}
                onBlur={e => { e.target.style.borderColor = "#e5e7eb"; e.target.style.background = "#fafafa"; }} />
            </div>
          </div>

          {/* Workspace nav */}
          <nav style={{ flex: 1, padding: "8px 8px 0" }}>
            {/* Workspaces section */}
            <button onClick={() => setWorkspaceOpen(v => !v)}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", fontSize: 12.5, fontWeight: 600, color: "#6b7280", background: "none", border: "none", cursor: "pointer", borderRadius: 6, fontFamily: "inherit" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6 }}><FolderOpen size={13} /> Workspaces</span>
              <Plus size={13} onClick={e => { e.stopPropagation(); toast("Coming soon", { icon: "🚧" }); }} />
            </button>

            {workspaceOpen && (
              <div style={{ marginBottom: 4 }}>
                {/* Private section */}
                <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", fontSize: 12, fontWeight: 600, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><ChevronUp size={12} /> Private</span>
                </button>
                {/* My workspace */}
                <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 12px 6px 20px", fontSize: 13, color: "#111827", background: "#f3f4f6", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "inherit", fontWeight: 500 }}>
                  <span>My workspace</span>
                  <span style={{ fontSize: 11, color: "#6b7280", background: "#e5e7eb", padding: "1px 7px", borderRadius: 10 }}>{forms.length}</span>
                </button>
              </div>
            )}

            {/* Responses collected */}
            <div style={{ margin: "12px 8px 4px", padding: "12px", background: "#f9fafb", borderRadius: 8, border: "1px solid #e5e7eb" }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", marginBottom: 6 }}>Responses collected</p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ flex: 1, height: 4, background: "#e5e7eb", borderRadius: 2 }}>
                  <div style={{ width: "0%", height: "100%", background: "#6366f1", borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 11, color: "#374151", fontWeight: 600 }}>0 / 10</span>
              </div>
              <button onClick={() => toast("Coming soon", { icon: "🚧" })} style={{ width: "100%", padding: "6px 0", fontSize: 12, fontWeight: 500, color: "#374151", background: "white", border: "1px solid #d1d5db", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
                Increase response limit
              </button>
            </div>
          </nav>

          {/* Footer */}
          <div style={{ padding: "8px", borderTop: "1px solid #f3f4f6" }}>
            {[{ icon: <HelpCircle size={14} />, label: "Help" }, { icon: <Settings size={14} />, label: "Settings" }].map(item => (
              <button key={item.label} onClick={() => toast("Coming soon", { icon: "🚧" })}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "7px 8px", fontSize: 13, color: "#6b7280", background: "none", border: "none", cursor: "pointer", borderRadius: 6, fontFamily: "inherit" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                {item.icon} {item.label}
              </button>
            ))}
            {/* User avatar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 6, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#f3f4f6")} onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f97316", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>S</div>
              <div>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: "#111827", lineHeight: 1.2 }}>sonof167</p>
                <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.2 }}>My workspace</p>
              </div>
            </div>
          </div>
        </aside>

        {/* ══ MAIN AREA ══════════════════════════════════ */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#fff" }}>

          {/* Top tab bar */}
          <div style={{ borderBottom: "1px solid #e5e7eb", background: "white", paddingLeft: 24, display: "flex", alignItems: "center", gap: 0, flexShrink: 0 }}>
            {TABS.map(tab => (
              <button key={tab}
                onClick={() => { if (tab === "Forms") setActiveTab(tab); else toast("Coming soon", { icon: "🚧" }); }}
                style={{
                  padding: "14px 16px", fontSize: 13.5, fontWeight: activeTab === tab ? 600 : 400,
                  color: activeTab === tab ? "#111827" : "#6b7280",
                  borderBottom: activeTab === tab ? "2px solid #111827" : "2px solid transparent",
                  background: "none", border: "none", paddingBottom: activeTab === tab ? 12 : 14, boxShadow: activeTab === tab ? "inset 0 -2px 0 #111827" : "none",
                  cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                {tab}
                {tab === "Research Flow" && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: "#8b5cf6", background: "#f3e8ff", padding: "1px 6px", borderRadius: 4 }}>Demo</span>
                )}
                {tab === "Insights" && (
                  <span style={{ color: "#10b981" }}><Star size={11} fill="#10b981" /></span>
                )}
              </button>
            ))}
          </div>

          {/* Workspace header + table */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

            {/* Workspace row */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "#111827" }}>My workspace</h1>
              <button onClick={() => toast("Coming soon", { icon: "🚧" })} style={{ color: "#9ca3af", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}><MoreHorizontal size={16} /></button>
              <button onClick={() => toast("Coming soon", { icon: "🚧" })} style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", fontSize: 12.5, fontWeight: 500, color: "#374151", background: "none", border: "1px solid #e5e7eb", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
                <Users size={13} /> Invite
              </button>
              <div style={{ flex: 1 }} />
              {/* Sort */}
              <div ref={sortRef} style={{ position: "relative" }}>
                <button onClick={() => setSortOpen(v => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", fontSize: 13, fontWeight: 500, color: "#374151", background: "white", border: "1px solid #e5e7eb", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}>
                  <ChevronDown size={13} /> {sortLabels[sortBy]}
                </button>
                {sortOpen && (
                  <div style={{ position: "absolute", right: 0, top: 36, background: "white", border: "1px solid #e5e7eb", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: 4, minWidth: 170, zIndex: 100 }}>
                    {(["updated", "created", "alpha"] as const).map(s => (
                      <button key={s} onClick={() => { setSortBy(s); setSortOpen(false); }}
                        style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", fontSize: 13, color: "#374151", background: "none", border: "none", cursor: "pointer", borderRadius: 6, fontFamily: "inherit", fontWeight: sortBy === s ? 600 : 400 }}
                        onMouseEnter={e => e.currentTarget.style.background = "#f3f4f6"} onMouseLeave={e => e.currentTarget.style.background = "none"}>
                        {sortBy === s && <Check size={13} color="#6366f1" />}
                        {sortBy !== s && <span style={{ width: 13 }} />}
                        {sortLabels[s]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* View toggle */}
              <div style={{ display: "flex", border: "1px solid #e5e7eb", borderRadius: 7, overflow: "hidden" }}>
                {[{ v: "list", icon: <List size={14} /> }, { v: "grid", icon: <LayoutGrid size={14} /> }].map(({ v, icon }) => (
                  <button key={v} onClick={() => setViewMode(v as "list" | "grid")}
                    style={{ padding: "6px 10px", background: viewMode === v ? "#f3f4f6" : "white", color: viewMode === v ? "#111827" : "#9ca3af", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* ── LIST VIEW ── */}
            {viewMode === "list" && (
              <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, overflow: "hidden", background: "white" }}>
                {/* Table header */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 140px 100px 40px", padding: "10px 16px", borderBottom: "1px solid #e5e7eb", background: "#fafafa" }}>
                  {["", "Responses", "Completed", "Updated", "Integrations", ""].map((h, i) => (
                    <span key={i} style={{ fontSize: 12, fontWeight: 600, color: "#9ca3af" }}>{h}</span>
                  ))}
                </div>

                {loading && Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 140px 100px 40px", padding: "14px 16px", borderBottom: "1px solid #f3f4f6", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 6 }} />
                      <div className="skeleton" style={{ height: 13, width: 160 }} />
                    </div>
                    {[80, 60, 80, 60].map((w, j) => <div key={j} className="skeleton" style={{ height: 12, width: w }} />)}
                    <div />
                  </div>
                ))}

                {!loading && filtered.length === 0 && (
                  <div style={{ padding: "60px 0", textAlign: "center", color: "#9ca3af" }}>
                    <p style={{ fontWeight: 500, marginBottom: 6 }}>{search ? `No results for "${search}"` : "No forms yet"}</p>
                    {!search && <button onClick={createForm} style={{ padding: "8px 18px", fontSize: 13, fontWeight: 600, color: "white", background: "#1f1f1f", border: "none", borderRadius: 7, cursor: "pointer", fontFamily: "inherit" }}>Create your first form</button>}
                  </div>
                )}

                {!loading && filtered.map((form, idx) => (
                  <div key={form.id} className="row-hover"
                    style={{ display: "grid", gridTemplateColumns: "1fr 120px 120px 140px 100px 40px", padding: "13px 16px", borderBottom: idx < filtered.length - 1 ? "1px solid #f3f4f6" : "none", alignItems: "center", cursor: "pointer", background: "white", transition: "background 0.1s" }}
                    onClick={() => router.push(`/forms/${form.id}/builder`)}>
                    {/* Name */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <FormThumb id={form.id} />
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{form.title}</span>
                    </div>
                    {/* Responses */}
                    <span style={{ fontSize: 13, color: form.response_count > 0 ? "#374151" : "#9ca3af" }}>
                      {form.response_count > 0 ? form.response_count : "—"}
                    </span>
                    {/* Completed */}
                    <span style={{ fontSize: 13, color: "#9ca3af" }}>—</span>
                    {/* Updated */}
                    <span style={{ fontSize: 13, color: "#6b7280" }}>{new Date(form.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    {/* Integrations */}
                    <div onClick={e => e.stopPropagation()}>
                      <button onClick={() => toast("Coming soon", { icon: "🚧" })}
                        style={{ width: 28, height: 28, border: "1px solid #e5e7eb", borderRadius: 6, background: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af" }}
                        title="Add integration">
                        <LayoutGrid size={13} />
                      </button>
                    </div>
                    {/* 3-dot menu */}
                    <div onClick={e => e.stopPropagation()}>
                      <RowMenu form={form}
                        onRename={() => setRenaming(form)}
                        onDuplicate={() => duplicateForm(form.id)}
                        onDelete={() => deleteForm(form.id)}
                        onTogglePublish={() => togglePublish(form)} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── GRID VIEW ── */}
            {viewMode === "grid" && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
                {/* Create card */}
                <button onClick={createForm}
                  style={{ height: 200, borderRadius: 10, border: "1.5px dashed #d1d5db", background: "white", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "#9ca3af", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#6366f1"; e.currentTarget.style.color = "#6366f1"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#d1d5db"; e.currentTarget.style.color = "#9ca3af"; }}>
                  <Plus size={20} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Create a typeform</span>
                </button>
                {filtered.map(form => {
                  const COLORS = ["#f97316","#8b5cf6","#3b82f6","#10b981","#f59e0b","#ec4899","#06b6d4","#ef4444"];
                  let h = 0; for (let i = 0; i < form.id.length; i++) h = form.id.charCodeAt(i) + ((h << 5) - h);
                  const bg = COLORS[Math.abs(h) % COLORS.length];
                  return (
                    <div key={form.id}
                      style={{ borderRadius: 10, border: "1px solid #e5e7eb", background: "white", overflow: "hidden", cursor: "pointer", transition: "box-shadow 0.15s" }}
                      onClick={() => router.push(`/forms/${form.id}/builder`)}
                      onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
                      onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                      <div style={{ height: 110, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 36, height: 36, background: "rgba(255,255,255,0.25)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "white", fontSize: 16 }}>📄</span>
                        </div>
                      </div>
                      <div style={{ padding: "10px 12px 12px" }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{form.title}</p>
                        <p style={{ fontSize: 11.5, color: "#9ca3af" }}>{form.response_count} responses</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {renaming && <RenameModal form={renaming} onSave={saveRename} onClose={() => setRenaming(null)} />}
    </>
  );
}
