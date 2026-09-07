"use client";

/**
 * Public respondent flow — the signature Typeform one-question-at-a-time experience.
 * Matches Typeform's exact UI: full-screen colored background, large centered question,
 * smooth slide transitions, keyboard nav, OK button, progress bar.
 * No authentication required.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronUp, ChevronDown, ArrowRight, AlertCircle,
  Star, Lock,
} from "lucide-react";
import { publicApi, Form, Question } from "@/lib/api";

/* ─── Each question type's answer input ─── */
function AnswerInput({
  question,
  value,
  onChange,
  onAdvance,
}: {
  question: Question;
  value: string;
  onChange: (v: string) => void;
  onAdvance: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus after animation settles
  useEffect(() => {
    const t = setTimeout(() => { inputRef.current?.focus(); textRef.current?.focus(); }, 380);
    return () => clearTimeout(t);
  }, [question.id]);

  // Auto-advance for yes/no and multiple choice after picking
  function pick(v: string) {
    onChange(v);
    if (question.type === "yes_no" || question.type === "multiple_choice") {
      setTimeout(onAdvance, 350);
    }
  }

  const inputStyle: React.CSSProperties = {
    background: "transparent", border: "none", borderBottom: "2px solid rgba(255,255,255,0.4)",
    outline: "none", width: "100%", padding: "10px 0", fontSize: 22, fontFamily: "inherit",
    color: "white", transition: "border-color 0.2s",
  };

  switch (question.type) {
    case "short_text":
      return (
        <input ref={inputRef} type="text"
          style={inputStyle} placeholder="Type your answer here…"
          value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onAdvance(); } }}
          onFocus={e => e.target.style.borderBottomColor = "white"}
          onBlur={e => e.target.style.borderBottomColor = "rgba(255,255,255,0.4)"}
        />
      );
    case "long_text":
      return (
        <textarea ref={textRef}
          style={{ ...inputStyle, resize: "none", minHeight: 90, fontSize: 20, lineHeight: 1.6 } as React.CSSProperties}
          placeholder="Type your answer here…"
          value={value} onChange={e => onChange(e.target.value)} rows={4}
          onFocus={e => e.target.style.borderBottomColor = "white"}
          onBlur={e => e.target.style.borderBottomColor = "rgba(255,255,255,0.4)"}
        />
      );
    case "email":
      return (
        <input ref={inputRef} type="text" inputMode="email"
          style={inputStyle} placeholder="name@example.com"
          value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onAdvance(); } }}
          onFocus={e => e.target.style.borderBottomColor = "white"}
          onBlur={e => e.target.style.borderBottomColor = "rgba(255,255,255,0.4)"}
        />
      );
    case "number":
      return (
        <input ref={inputRef} type="text" inputMode="numeric"
          style={inputStyle} placeholder="Type a number…"
          value={value} onChange={e => onChange(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); onAdvance(); } }}
          onFocus={e => e.target.style.borderBottomColor = "white"}
          onBlur={e => e.target.style.borderBottomColor = "rgba(255,255,255,0.4)"}
        />
      );
    case "multiple_choice": {
      const choices = question.choices ?? [];
      const KEYS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          {choices.map((c, i) => (
            <button key={i} type="button" onClick={() => pick(c)}
              style={{
                display: "flex", alignItems: "center", gap: 14, width: "100%",
                padding: "14px 18px", borderRadius: 8, cursor: "pointer", textAlign: "left",
                fontSize: 17, color: "white", fontFamily: "inherit", transition: "all 0.15s",
                border: `2px solid ${value === c ? "white" : "rgba(255,255,255,0.3)"}`,
                background: value === c ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)",
              }}
              onMouseEnter={e => { if (value !== c) e.currentTarget.style.borderColor = "rgba(255,255,255,0.65)"; }}
              onMouseLeave={e => { if (value !== c) e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; }}
            >
              <span style={{
                width: 28, height: 28, border: `1.5px solid ${value === c ? "white" : "rgba(255,255,255,0.5)"}`,
                borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0,
                background: value === c ? "white" : "transparent", color: value === c ? "#333" : "white",
              }}>
                {value === c ? <Check size={13} /> : KEYS[i]}
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
        <div style={{ marginTop: 12, position: "relative" }}>
          <select value={value} onChange={e => onChange(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.4)",
              borderRadius: 8, color: "white", fontSize: 17, fontFamily: "inherit",
              padding: "12px 40px 12px 16px", width: "100%", outline: "none", cursor: "pointer",
              appearance: "none", WebkitAppearance: "none",
            }}
            onFocus={e => e.target.style.borderColor = "white"}
            onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.4)"}>
            <option value="" style={{ background: "#333" }}>Select an option…</option>
            {choices.map((c, i) => <option key={i} value={c} style={{ background: "#333" }}>{c}</option>)}
          </select>
          <ChevronDown size={18} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "rgba(255,255,255,0.6)" }} />
        </div>
      );
    }
    case "yes_no":
      return (
        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          {["Yes", "No"].map(opt => (
            <button key={opt} type="button" onClick={() => pick(opt)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "14px 24px",
                border: `2px solid ${value === opt ? "white" : "rgba(255,255,255,0.35)"}`,
                borderRadius: 8, background: value === opt ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.08)",
                color: "white", fontSize: 17, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", transition: "all 0.15s",
              }}
              onMouseEnter={e => { if (value !== opt) e.currentTarget.style.borderColor = "rgba(255,255,255,0.65)"; }}
              onMouseLeave={e => { if (value !== opt) e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; }}
            >
              {opt === "Yes" ? "👍" : "👎"} {opt}
              {value === opt && <Check size={15} style={{ marginLeft: 4, opacity: 0.8 }} />}
            </button>
          ))}
        </div>
      );
    case "rating": {
      const steps = question.rating_steps ?? 5;
      const numVal = Number(value);
      return (
        <div style={{ marginTop: 12 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Array.from({ length: steps }, (_, i) => i + 1).map(n => (
              <button key={n} type="button" onClick={() => onChange(value === String(n) ? "" : String(n))}
                style={{
                  width: 50, height: 50, borderRadius: 8,
                  border: `2px solid ${numVal >= n ? "white" : "rgba(255,255,255,0.35)"}`,
                  background: numVal >= n ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
                  color: "white", fontSize: 16, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                }}
                onMouseEnter={e => { if (numVal < n) e.currentTarget.style.borderColor = "rgba(255,255,255,0.65)"; }}
                onMouseLeave={e => { if (numVal < n) e.currentTarget.style.borderColor = "rgba(255,255,255,0.35)"; }}
              >
                {numVal >= n ? <Star size={20} fill="white" /> : n}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6, paddingInline: 2 }}>
            <span>Not likely</span><span>Extremely likely</span>
          </div>
        </div>
      );
    }
    default: return null;
  }
}

/* ─── Welcome screen ─── */
function WelcomeScreen({ form, onStart }: { form: Form; onStart: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      style={{ display: "flex", flexDirection: "column", justifyContent: "center", minHeight: "100vh", padding: "60px 48px", maxWidth: 680, margin: "0 auto" }}>
      <h1 style={{ fontSize: 48, fontWeight: 800, color: "white", lineHeight: 1.2, marginBottom: 16, letterSpacing: "-0.02em" }}>
        {form.title}
      </h1>
      {form.description && (
        <p style={{ fontSize: 20, color: "rgba(255,255,255,0.75)", marginBottom: 36, lineHeight: 1.6 }}>{form.description}</p>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button onClick={onStart}
          style={{
            display: "flex", alignItems: "center", gap: 10, padding: "14px 30px",
            fontSize: 18, fontWeight: 700, color: "white",
            background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.6)",
            borderRadius: 8, cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; e.currentTarget.style.borderColor = "white"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)"; }}
        >
          Start <ArrowRight size={20} />
        </button>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.45)" }}>
          {form.questions?.length ?? 0} question{(form.questions?.length ?? 0) !== 1 ? "s" : ""} · ~{Math.max(1, Math.ceil((form.questions?.length ?? 0) / 3))} min
        </span>
      </div>
    </motion.div>
  );
}

/* ─── Thank you screen ─── */
function ThankYouScreen({ message, color }: { message: string; color: string }) {
  return (
    <div style={{ minHeight: "100vh", background: color, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{ textAlign: "center", padding: "0 32px" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <Check size={34} color="white" strokeWidth={2.5} />
        </div>
        <h1 style={{ fontSize: 42, fontWeight: 800, color: "white", marginBottom: 12, letterSpacing: "-0.02em" }}>
          {message || "Thanks for completing this form!"}
        </h1>
        <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)" }}>Your response has been recorded.</p>
      </motion.div>
    </div>
  );
}

/* ─── Not found ─── */
function NotFoundScreen() {
  return (
    <div style={{ minHeight: "100vh", background: "#111827", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "white", padding: "0 32px" }}>
        <div style={{ width: 64, height: 64, background: "#1f2937", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
          <Lock size={26} color="#6b7280" />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>Form not found</h2>
        <p style={{ color: "#6b7280", fontSize: 16 }}>This form doesn't exist or hasn't been published.</p>
      </div>
    </div>
  );
}

/* ─── Main page ─── */
export default function PublicFormPage(props: { params: Promise<{ publicId: string }> }) {
  const { publicId } = use(props.params);

  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    publicApi.getForm(publicId)
      .then(setForm)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [publicId]);

  const questions: Question[] = form?.questions ?? [];
  const currentQ = questions[currentIndex] ?? null;
  const color = form?.theme_color || "#0445AF";

  const validate = useCallback((): boolean => {
    if (!currentQ) return true;
    const v = (answers[currentQ.id] || "").trim();
    if (currentQ.required && !v) {
      setErrors({ [currentQ.id]: "This question is required" });
      return false;
    }
    if (currentQ.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setErrors({ [currentQ.id]: "Please enter a valid email address" });
      return false;
    }
    if (currentQ.type === "number" && v && isNaN(Number(v))) {
      setErrors({ [currentQ.id]: "Please enter a valid number" });
      return false;
    }
    setErrors({});
    return true;
  }, [currentQ, answers]);

  const advance = useCallback(async () => {
    if (!validate()) return;
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex(i => i + 1);
      setErrors({});
    } else {
      setSubmitting(true);
      try {
        const payload = Object.entries(answers).map(([question_id, value]) => ({ question_id, value }));
        await publicApi.submit(publicId, payload);
        setSubmitted(true);
      } catch (err: unknown) {
        const axErr = err as { response?: { status?: number; data?: { errors?: Record<string, string> } } };
        if (axErr?.response?.status === 422 && axErr?.response?.data?.errors) {
          const serverErrors = axErr.response.data.errors;
          setErrors(serverErrors);
          const firstId = Object.keys(serverErrors)[0];
          const errIdx = questions.findIndex(q => q.id === firstId);
          if (errIdx !== -1) { setDirection(errIdx < currentIndex ? -1 : 1); setCurrentIndex(errIdx); }
        } else {
          setErrors({ submit: "Something went wrong. Please try again." });
        }
      } finally { setSubmitting(false); }
    }
  }, [validate, currentIndex, questions, answers, publicId]);

  // Keyboard: Enter to advance
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!started || submitted || submitting) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "Enter") { e.preventDefault(); advance(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [started, submitted, submitting, advance]);

  const progress = questions.length > 0 ? ((currentIndex + (submitted ? 1 : 0)) / questions.length) * 100 : 0;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#0445AF", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 32, height: 32, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (notFound || !form) return <NotFoundScreen />;
  if (submitted) return <ThankYouScreen message={form.thank_you_message || "Thanks for completing this form!"} color={color} />;

  if (!started) return (
    <div style={{ minHeight: "100vh", background: color }}>
      <WelcomeScreen form={form} onStart={() => setStarted(true)} />
    </div>
  );

  if (!currentQ) return null;

  return (
    <div style={{ minHeight: "100vh", background: color, color: "white", position: "relative", overflow: "hidden" }}>
      {/* Progress bar */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.2)", zIndex: 100 }}>
        <div style={{ height: "100%", background: "rgba(255,255,255,0.65)", transition: "width 0.45s ease", width: `${progress}%` }} />
      </div>

      {/* Counter */}
      <div style={{ position: "fixed", top: 14, right: 18, fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.6)", zIndex: 100 }}>
        {currentIndex + 1} / {questions.length}
      </div>

      {/* Submit error */}
      {errors.submit && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(220,38,38,0.9)", color: "white", padding: "10px 18px", borderRadius: 8, fontSize: 14, display: "flex", alignItems: "center", gap: 8, zIndex: 200 }}>
          <AlertCircle size={15} /> {errors.submit}
        </div>
      )}

      {/* Question */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "60px 32px" }}>
        <div style={{ width: "100%", maxWidth: 680 }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={currentQ.id} custom={direction}
              variants={{
                enter: (d: number) => ({ y: d > 0 ? 80 : -80, opacity: 0, scale: 0.97 }),
                center: { y: 0, opacity: 1, scale: 1 },
                exit: (d: number) => ({ y: d > 0 ? -80 : 80, opacity: 0, scale: 0.97 }),
              }}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {/* Number */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.6)", marginBottom: 14 }}>
                {currentIndex + 1} <ArrowRight size={13} />
              </div>

              {/* Title */}
              <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.3, marginBottom: 8, letterSpacing: "-0.01em" }}>
                {currentQ.title || "Question"}
                {currentQ.required && <span style={{ color: "rgba(255,150,150,0.9)", marginLeft: 4 }}>*</span>}
              </h1>

              {/* Description */}
              {currentQ.description && (
                <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", marginBottom: 28, lineHeight: 1.6 }}>
                  {currentQ.description}
                </p>
              )}

              {/* Answer input */}
              <AnswerInput
                question={currentQ}
                value={answers[currentQ.id] || ""}
                onChange={v => { setAnswers(a => ({ ...a, [currentQ.id]: v })); if (errors[currentQ.id]) setErrors({}); }}
                onAdvance={advance}
              />

              {/* Error */}
              {errors[currentQ.id] && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "10px 14px", background: "rgba(220,38,38,0.18)", border: "1px solid rgba(220,38,38,0.4)", borderRadius: 8, fontSize: 14, color: "#fca5a5" }}>
                  <AlertCircle size={15} /> {errors[currentQ.id]}
                </div>
              )}

              {/* OK button — hidden for auto-advance types */}
              {currentQ.type !== "multiple_choice" && currentQ.type !== "yes_no" && (
                <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 14 }}>
                  <button onClick={advance} disabled={submitting}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "12px 24px",
                      fontSize: 16, fontWeight: 700, color: "white",
                      background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.5)",
                      borderRadius: 6, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.32)"; e.currentTarget.style.borderColor = "white"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.2)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.5)"; }}
                  >
                    {submitting
                      ? <span style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "white", borderRadius: "50%", display: "inline-block", animation: "spin 0.8s linear infinite" }} />
                      : currentIndex === questions.length - 1
                        ? <><Check size={16} /> Submit</>
                        : <><Check size={16} /> OK</>
                    }
                  </button>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", display: "flex", alignItems: "center", gap: 5 }}>
                    press <kbd style={{ border: "1px solid rgba(255,255,255,0.35)", borderRadius: 4, padding: "1px 6px", fontSize: 12, fontFamily: "inherit" }}>Enter</kbd>
                  </span>
                </div>
              )}

              {/* For auto-advance types: show OK if an answer is already selected */}
              {(currentQ.type === "multiple_choice" || currentQ.type === "yes_no") && answers[currentQ.id] && (
                <div style={{ marginTop: 16 }}>
                  <button onClick={advance}
                    style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 22px", fontSize: 15, fontWeight: 700, color: "white", background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.5)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
                    {currentIndex === questions.length - 1 ? <><Check size={15} /> Submit</> : <><Check size={15} /> OK</>}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Nav arrows */}
      <div style={{ position: "fixed", bottom: 24, right: 24, display: "flex", gap: 8, zIndex: 100 }}>
        <button onClick={() => { if (currentIndex > 0) { setDirection(-1); setCurrentIndex(i => i - 1); setErrors({}); } }}
          disabled={currentIndex === 0}
          style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: currentIndex === 0 ? 0.3 : 1, transition: "all 0.15s" }}>
          <ChevronUp size={18} />
        </button>
        <button onClick={advance} disabled={submitting}
          style={{ width: 40, height: 40, borderRadius: 8, background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s" }}>
          <ChevronDown size={18} />
        </button>
      </div>

      {/* Branding */}
      <div style={{ position: "fixed", bottom: 14, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.35)", zIndex: 100 }}>
        <div style={{ width: 16, height: 16, background: "rgba(255,255,255,0.15)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>T</div>
        Powered by Typeform
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
