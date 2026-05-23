import { useState, useEffect, useRef, useCallback } from "react";

// ─── DESIGN TOKENS ───────────────────────────────────────────────────────────
const COLORS = {
  bg: "#0a0b0f",
  bgCard: "#12141a",
  bgElevated: "#1a1d26",
  border: "#252836",
  borderHover: "#3a3e52",
  accent: "#6c63ff",
  accentSoft: "#6c63ff22",
  accentHover: "#8b84ff",
  green: "#22c55e",
  greenSoft: "#22c55e18",
  amber: "#f59e0b",
  amberSoft: "#f59e0b18",
  red: "#ef4444",
  redSoft: "#ef444418",
  textPrimary: "#f0f0f8",
  textSecondary: "#8b8fa8",
  textMuted: "#4a4e66",
};

// ─── MOCK DATA & PLANS ───────────────────────────────────────────────────────
const PLANS = {
  free:    { name: "Free",    price: 0,  tokens: 50000,   sessions: 3,   voice: false, color: COLORS.textSecondary },
  starter: { name: "Starter", price: 9,  tokens: 300000,  sessions: 15,  voice: true,  color: COLORS.green },
  pro:     { name: "Pro",     price: 24, tokens: 1000000, sessions: 999, voice: true,  color: COLORS.accent },
  enterprise: { name: "Enterprise", price: null, tokens: Infinity, sessions: 999, voice: true, color: COLORS.amber },
};

const TECH_STACKS = [
  "Frontend (React/Vue/Angular)", "Backend (Node/Python/Java)", "Full Stack",
  "Data Science / ML", "DevOps / Cloud", "Mobile (iOS/Android)",
  "System Design", "Algorithms & DSA", "Product Management", "General Software",
];

const SAMPLE_QUESTIONS = {
  "Frontend (React/Vue/Angular)": [
    "Explain the virtual DOM and how React uses it for performance.",
    "What are React hooks and why were they introduced?",
    "How would you optimize a slow React application?",
    "Explain the difference between controlled and uncontrolled components.",
    "Walk me through how you'd implement a custom hook for data fetching.",
  ],
  "Backend (Node/Python/Java)": [
    "Explain the event loop in Node.js.",
    "How would you design a rate limiter for an API?",
    "What are the differences between SQL and NoSQL databases?",
    "Explain REST vs GraphQL and when you'd choose each.",
    "How do you handle database transactions to prevent race conditions?",
  ],
  "Full Stack": [
    "Walk me through your approach to designing a scalable web application.",
    "How do you handle authentication and session management?",
    "Explain how you'd implement real-time features in a web app.",
    "What's your approach to handling errors across the full stack?",
    "How would you design the database schema for a social media platform?",
  ],
  "default": [
    "Tell me about yourself and your technical background.",
    "Describe a challenging technical problem you solved recently.",
    "How do you stay current with new technologies?",
    "Explain a time you had to refactor a large codebase.",
    "How do you approach code reviews?",
  ],
};

const TOKEN_COSTS = {
  resume_parse: 2000,
  question_gen: 1500,
  answer_eval: 1200,
  report_gen: 3000,
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function fmtTokens(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return Math.round(n / 1000) + "K";
  return n.toString();
}
function fmtPct(used, total) {
  if (total === Infinity) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}
function tokenBarColor(pct) {
  if (pct >= 90) return COLORS.red;
  if (pct >= 70) return COLORS.amber;
  return COLORS.green;
}

// ─── SUPABASE SCHEMA REFERENCE (shown in-app) ────────────────────────────────
const SCHEMA_SQL = `-- Run this in your Supabase SQL editor

create table public.users_profile (
  id uuid references auth.users primary key,
  email text,
  full_name text,
  plan text default 'free',
  tokens_used integer default 0,
  tokens_allowance integer default 50000,
  sessions_used integer default 0,
  billing_date timestamptz,
  stripe_customer_id text,
  created_at timestamptz default now()
);

create table public.user_usage (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users_profile(id),
  feature text, -- 'resume_parse' | 'question_gen' | 'answer_eval' | 'report_gen'
  tokens_consumed integer,
  session_id uuid,
  created_at timestamptz default now()
);

create table public.interview_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users_profile(id),
  tech_stack text,
  role text,
  seniority text,
  questions jsonb,
  answers jsonb default '[]',
  scores jsonb default '[]',
  status text default 'active', -- active | completed
  overall_score integer,
  report jsonb,
  created_at timestamptz default now()
);

create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users_profile(id),
  stripe_payment_id text,
  plan text,
  amount integer,
  status text,
  created_at timestamptz default now()
);

-- Row Level Security
alter table public.users_profile enable row level security;
alter table public.user_usage enable row level security;
alter table public.interview_sessions enable row level security;

create policy "Users can read own profile"
  on public.users_profile for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.users_profile for update using (auth.uid() = id);
create policy "Users can read own usage"
  on public.user_usage for select using (auth.uid() = user_id);
create policy "Users can read own sessions"
  on public.interview_sessions for select using (auth.uid() = user_id);

-- Monthly token reset function (schedule via pg_cron)
create or replace function reset_monthly_tokens()
returns void as $$
  update public.users_profile
  set tokens_used = 0
  where date_trunc('month', billing_date) < date_trunc('month', now());
$$ language sql;`;

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function TokenBar({ used, total, size = "md" }) {
  const pct = fmtPct(used, total);
  const color = tokenBarColor(pct);
  const h = size === "sm" ? 4 : 8;
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12, color: COLORS.textSecondary }}>
        <span>{fmtTokens(used)} used</span>
        <span style={{ color }}>{total === Infinity ? "Unlimited" : `${pct}%`}</span>
      </div>
      <div style={{ height: h, background: COLORS.border, borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${total === Infinity ? 10 : pct}%`,
          background: color, borderRadius: 99,
          transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>
      {pct >= 80 && total !== Infinity && (
        <p style={{ fontSize: 11, color: COLORS.amber, marginTop: 4 }}>
          ⚠ {pct >= 100 ? "Limit reached — upgrade to continue" : "Approaching limit — consider upgrading"}
        </p>
      )}
    </div>
  );
}

function Badge({ children, color = COLORS.accent }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 10px", borderRadius: 99,
      background: color + "22", color, fontSize: 11, fontWeight: 600,
      letterSpacing: "0.04em", textTransform: "uppercase",
    }}>{children}</span>
  );
}

function Card({ children, style = {}, onClick, hover = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: COLORS.bgCard, border: `1px solid ${hovered ? COLORS.borderHover : COLORS.border}`,
        borderRadius: 16, padding: "1.5rem",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.2s, transform 0.15s",
        transform: hovered ? "translateY(-2px)" : "none",
        ...style,
      }}
    >{children}</div>
  );
}

function Btn({ children, onClick, variant = "primary", disabled = false, style = {} }) {
  const [hov, setHov] = useState(false);
  const styles = {
    primary: { background: hov ? COLORS.accentHover : COLORS.accent, color: "#fff", border: "none" },
    ghost: { background: hov ? COLORS.bgElevated : "transparent", color: COLORS.textPrimary, border: `1px solid ${COLORS.border}` },
    danger: { background: hov ? "#dc2626" : COLORS.red, color: "#fff", border: "none" },
    success: { background: hov ? "#16a34a" : COLORS.green, color: "#fff", border: "none" },
  };
  return (
    <button
      onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "10px 20px", borderRadius: 10, fontFamily: "inherit",
        fontSize: 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1, transition: "all 0.15s",
        ...styles[variant], ...style,
      }}
    >{children}</button>
  );
}

// ─── SCREEN: LANDING / AUTH ───────────────────────────────────────────────────
function LandingScreen({ onEnter }) {
  const [tab, setTab] = useState("signin");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const inputStyle = {
    width: "100%", padding: "12px 16px", background: COLORS.bgElevated,
    border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textPrimary,
    fontSize: 14, fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  return (
    <div style={{
      minHeight: "100vh", background: COLORS.bg, display: "flex", alignItems: "center",
      justifyContent: "center", padding: "2rem", fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
    }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", top: "20%", left: "50%", transform: "translateX(-50%)", width: 600, height: 300, background: `radial-gradient(ellipse, ${COLORS.accent}18 0%, transparent 70%)`, pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 440, position: "relative" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: COLORS.accent, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 28, marginBottom: 16 }}>🎯</div>
          <h1 style={{ color: COLORS.textPrimary, fontSize: 28, fontWeight: 700, margin: 0 }}>InterviewAI</h1>
          <p style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 8 }}>AI-powered mock interviews for every tech role</p>
        </div>

        <Card>
          {/* Tab switcher */}
          <div style={{ display: "flex", background: COLORS.bg, borderRadius: 10, padding: 4, marginBottom: "1.5rem" }}>
            {["signin", "signup"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: "8px", borderRadius: 8, border: "none", fontFamily: "inherit",
                fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                background: tab === t ? COLORS.bgElevated : "transparent",
                color: tab === t ? COLORS.textPrimary : COLORS.textSecondary,
              }}>{t === "signin" ? "Sign In" : "Sign Up"}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {tab === "signup" && (
              <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            )}
            <input placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
            <input placeholder="Password" type="password" style={inputStyle} />
            <Btn onClick={() => onEnter({ name: name || "Alex Chen", email: email || "alex@example.com", plan: "starter", tokensUsed: 34000 })} style={{ width: "100%", padding: "13px" }}>
              {tab === "signin" ? "Sign In →" : "Create Account →"}
            </Btn>
          </div>

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <p style={{ color: COLORS.textMuted, fontSize: 12 }}>
              {tab === "signup" ? "Free plan — no credit card required" : "Don't have an account? "}
              {tab === "signin" && <span style={{ color: COLORS.accent, cursor: "pointer" }} onClick={() => setTab("signup")}>Sign up free</span>}
            </p>
          </div>
        </Card>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: "1.5rem" }}>
          {["🎙 Voice interviews", "📊 AI scoring", "🧠 Personalized prep", "💡 Real-time hints"].map(f => (
            <span key={f} style={{ fontSize: 12, color: COLORS.textSecondary, background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 99, padding: "4px 12px" }}>{f}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: DASHBOARD ────────────────────────────────────────────────────────
function DashboardScreen({ user, onStart, onUpgrade, onSchema }) {
  const plan = PLANS[user.plan];
  const pct = fmtPct(user.tokensUsed, plan.tokens);

  const stats = [
    { label: "Sessions this month", value: user.sessionsUsed || 4, icon: "🎯" },
    { label: "Avg score", value: "74%", icon: "📊" },
    { label: "Top skill", value: "React", icon: "⭐" },
    { label: "Weakest area", value: "System design", icon: "📈" },
  ];

  const recentSessions = [
    { role: "Senior Frontend Engineer", stack: "React", score: 82, date: "Today", status: "completed" },
    { role: "Full Stack Developer", stack: "Node.js", score: 71, date: "Yesterday", status: "completed" },
    { role: "Software Engineer", stack: "Algorithms", score: 65, date: "3 days ago", status: "completed" },
  ];

  return (
    <div style={{ padding: "2rem", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ color: COLORS.textPrimary, margin: 0, fontSize: 24, fontWeight: 700 }}>Good morning, {user.name.split(" ")[0]} 👋</h2>
          <p style={{ color: COLORS.textSecondary, margin: "4px 0 0", fontSize: 14 }}>Ready to ace your next interview?</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn variant="ghost" onClick={onSchema}>📄 View DB Schema</Btn>
          <Btn onClick={onStart}>+ New Interview</Btn>
        </div>
      </div>

      {/* Token usage card */}
      <Card style={{ marginBottom: "1.5rem", background: pct >= 80 ? `${COLORS.amber}08` : COLORS.bgCard, borderColor: pct >= 80 ? `${COLORS.amber}44` : COLORS.border }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚡</span>
            <div>
              <div style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 15 }}>Token Usage</div>
              <div style={{ color: COLORS.textSecondary, fontSize: 12 }}>Resets in 18 days</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Badge color={plan.color}>{plan.name}</Badge>
            {user.plan !== "pro" && user.plan !== "enterprise" && (
              <Btn onClick={onUpgrade} style={{ padding: "6px 14px", fontSize: 12 }}>Upgrade ↗</Btn>
            )}
          </div>
        </div>
        <TokenBar used={user.tokensUsed} total={plan.tokens} />
        <div style={{ display: "flex", gap: 20, marginTop: 12, flexWrap: "wrap" }}>
          {Object.entries(TOKEN_COSTS).map(([k, v]) => (
            <div key={k} style={{ fontSize: 11, color: COLORS.textMuted }}>
              <span style={{ color: COLORS.textSecondary }}>{k.replace("_", " ")}: </span>{fmtTokens(v)} tokens
            </div>
          ))}
        </div>
      </Card>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: "1.5rem" }}>
        {stats.map(s => (
          <Card key={s.label} style={{ padding: "1.2rem" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: 22 }}>{s.value}</div>
            <div style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Recent sessions */}
      <Card>
        <h3 style={{ color: COLORS.textPrimary, margin: "0 0 1rem", fontSize: 16, fontWeight: 600 }}>Recent Sessions</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recentSessions.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: COLORS.bgElevated, borderRadius: 10, flexWrap: "wrap", gap: 8 }}>
              <div>
                <div style={{ color: COLORS.textPrimary, fontWeight: 500, fontSize: 14 }}>{s.role}</div>
                <div style={{ color: COLORS.textSecondary, fontSize: 12 }}>{s.stack} · {s.date}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.score >= 80 ? COLORS.green : s.score >= 60 ? COLORS.amber : COLORS.red }}>{s.score}%</div>
                <Btn variant="ghost" style={{ padding: "5px 12px", fontSize: 12 }} onClick={onStart}>Retry</Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── SCREEN: SETUP INTERVIEW ──────────────────────────────────────────────────
function SetupScreen({ user, onBegin, onBack }) {
  const [step, setStep] = useState(1);
  const [resumeText, setResumeText] = useState("");
  const [role, setRole] = useState("");
  const [stack, setStack] = useState("");
  const [seniority, setSeniority] = useState("mid");
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const plan = PLANS[user.plan];
  const canVoice = plan.voice;

  const analyzeResume = async () => {
    if (!resumeText.trim() && !role.trim()) return;
    setLoading(true);
    try {
      const prompt = `You are an expert technical recruiter. Analyze this resume/background and target role, then return ONLY a JSON object (no markdown) with:
{
  "skills": ["skill1", "skill2", ...],
  "gaps": ["gap1", "gap2", ...],
  "strengths": ["strength1", ...],
  "focus_areas": ["area1", "area2", "area3"],
  "readiness_score": 72
}

Resume/Background: ${resumeText || "Not provided - use general assessment"}
Target Role: ${role || "Software Engineer"}
Seniority: ${seniority}
Tech Stack: ${stack}
Job Description: ${jd || "Not provided"}`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      setAnalysis(JSON.parse(clean));
      setStep(3);
    } catch {
      setAnalysis({ skills: ["JavaScript", "React", "Node.js"], gaps: ["System Design", "Kubernetes"], strengths: ["Frontend development", "Problem solving"], focus_areas: ["Algorithms", "System Design", "Behavioral"], readiness_score: 68 });
      setStep(3);
    }
    setLoading(false);
  };

  const taStyle = {
    width: "100%", minHeight: 120, padding: "12px 16px",
    background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`,
    borderRadius: 10, color: COLORS.textPrimary, fontSize: 13,
    fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box",
  };
  const inputStyle = { ...taStyle, minHeight: "auto", height: 44, resize: "none" };

  return (
    <div style={{ padding: "2rem", maxWidth: 700, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: COLORS.textSecondary, cursor: "pointer", fontSize: 14, marginBottom: "1.5rem", padding: 0 }}>← Back</button>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: 8, marginBottom: "2rem" }}>
        {["Resume & Role", "Settings", "AI Analysis", "Start!"].map((label, i) => (
          <div key={i} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ height: 4, borderRadius: 99, background: step > i + 1 ? COLORS.accent : step === i + 1 ? COLORS.accent : COLORS.border, marginBottom: 6, transition: "background 0.3s" }} />
            <span style={{ fontSize: 11, color: step >= i + 1 ? COLORS.textSecondary : COLORS.textMuted }}>{label}</span>
          </div>
        ))}
      </div>

      {step === 1 && (
        <Card>
          <h3 style={{ color: COLORS.textPrimary, margin: "0 0 1.5rem", fontSize: 18 }}>Your Background</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ color: COLORS.textSecondary, fontSize: 13, display: "block", marginBottom: 6 }}>Target Role *</label>
              <input placeholder="e.g. Senior Frontend Engineer at Stripe" value={role} onChange={e => setRole(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: COLORS.textSecondary, fontSize: 13, display: "block", marginBottom: 6 }}>Paste your resume or describe your background</label>
              <textarea placeholder="Paste resume text, or describe your experience, skills, and projects..." value={resumeText} onChange={e => setResumeText(e.target.value)} style={taStyle} />
            </div>
            <div>
              <label style={{ color: COLORS.textSecondary, fontSize: 13, display: "block", marginBottom: 6 }}>Job Description (optional — for targeted prep)</label>
              <textarea placeholder="Paste the job description here for hyper-relevant questions..." value={jd} onChange={e => setJd(e.target.value)} style={{ ...taStyle, minHeight: 80 }} />
            </div>
            <Btn onClick={() => setStep(2)} disabled={!role.trim()} style={{ alignSelf: "flex-end" }}>Next →</Btn>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h3 style={{ color: COLORS.textPrimary, margin: "0 0 1.5rem", fontSize: 18 }}>Interview Settings</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ color: COLORS.textSecondary, fontSize: 13, display: "block", marginBottom: 10 }}>Technology Focus</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {TECH_STACKS.map(s => (
                  <button key={s} onClick={() => setStack(s)} style={{
                    padding: "7px 14px", borderRadius: 8, border: `1px solid ${stack === s ? COLORS.accent : COLORS.border}`,
                    background: stack === s ? COLORS.accentSoft : "transparent", color: stack === s ? COLORS.accent : COLORS.textSecondary,
                    fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ color: COLORS.textSecondary, fontSize: 13, display: "block", marginBottom: 10 }}>Seniority Level</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["junior", "mid", "senior", "staff"].map(s => (
                  <button key={s} onClick={() => setSeniority(s)} style={{
                    flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${seniority === s ? COLORS.accent : COLORS.border}`,
                    background: seniority === s ? COLORS.accentSoft : "transparent", color: seniority === s ? COLORS.accent : COLORS.textSecondary,
                    fontSize: 12, cursor: "pointer", fontFamily: "inherit", textTransform: "capitalize", transition: "all 0.15s",
                  }}>{s}</button>
                ))}
              </div>
            </div>
            <div style={{ background: canVoice ? COLORS.greenSoft : COLORS.bgElevated, border: `1px solid ${canVoice ? COLORS.green + "44" : COLORS.border}`, borderRadius: 10, padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 14 }}>🎙 Voice Interview Mode</div>
                  <div style={{ color: COLORS.textSecondary, fontSize: 12, marginTop: 4 }}>AI speaks questions, you answer by voice</div>
                </div>
                {canVoice ? <Badge color={COLORS.green}>Enabled</Badge> : <Badge color={COLORS.textMuted}>Starter+ only</Badge>}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <Btn variant="ghost" onClick={() => setStep(1)}>← Back</Btn>
              <Btn onClick={analyzeResume} disabled={loading}>
                {loading ? "Analyzing with AI..." : "Analyze Resume →"}
              </Btn>
            </div>
          </div>
        </Card>
      )}

      {step === 3 && analysis && (
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <h3 style={{ color: COLORS.textPrimary, margin: 0, fontSize: 18 }}>AI Analysis Complete ✨</h3>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: analysis.readiness_score >= 70 ? COLORS.green : COLORS.amber }}>{analysis.readiness_score}%</div>
              <div style={{ fontSize: 11, color: COLORS.textSecondary }}>Readiness</div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.5rem" }}>
            <div style={{ background: COLORS.bgElevated, borderRadius: 10, padding: "1rem" }}>
              <div style={{ color: COLORS.green, fontWeight: 600, fontSize: 12, marginBottom: 8 }}>✓ STRENGTHS</div>
              {(analysis.strengths || []).map(s => <div key={s} style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 4 }}>• {s}</div>)}
            </div>
            <div style={{ background: COLORS.bgElevated, borderRadius: 10, padding: "1rem" }}>
              <div style={{ color: COLORS.red, fontWeight: 600, fontSize: 12, marginBottom: 8 }}>⚠ GAPS TO COVER</div>
              {(analysis.gaps || []).map(g => <div key={g} style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: 4 }}>• {g}</div>)}
            </div>
          </div>
          <div style={{ background: COLORS.accentSoft, borderRadius: 10, padding: "1rem", marginBottom: "1.5rem" }}>
            <div style={{ color: COLORS.accent, fontWeight: 600, fontSize: 12, marginBottom: 8 }}>🎯 TODAY'S FOCUS AREAS</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {(analysis.focus_areas || []).map(f => <Badge key={f}>{f}</Badge>)}
            </div>
          </div>
          <div style={{ background: COLORS.bgElevated, borderRadius: 10, padding: "0.75rem 1rem", marginBottom: "1.5rem", fontSize: 12, color: COLORS.textMuted }}>
            ⚡ ~{fmtTokens(TOKEN_COSTS.resume_parse + TOKEN_COSTS.question_gen)} tokens used for this analysis
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <Btn variant="ghost" onClick={() => setStep(2)}>← Adjust settings</Btn>
            <Btn variant="success" onClick={() => onBegin({ role, stack, seniority, analysis, voiceEnabled: canVoice })}>
              🚀 Start Mock Interview
            </Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── SPEECH ANALYTICS ENGINE ─────────────────────────────────────────────────
const FILLER_WORDS = ["um","uh","like","you know","basically","literally","actually","right","so","kind of","sort of","i mean","well","okay","yeah"];

function analyzeSpeech(text) {
  if (!text.trim()) return { fillerCount: 0, fillerWords: {}, wordCount: 0, sentenceCount: 0, wpm: 0, clarityScore: 100, paceLabel: "—", paceColor: COLORS.textMuted, fillerRate: 0, longestPause: 0, uniqueWords: 0, vocabularyScore: 100 };
  const lower = text.toLowerCase();
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 2);
  const sentenceCount = Math.max(1, sentences.length);

  // Filler detection
  const fillerWords = {};
  let fillerCount = 0;
  FILLER_WORDS.forEach(f => {
    const regex = new RegExp(`\\b${f}\\b`, "gi");
    const matches = lower.match(regex);
    if (matches && matches.length > 0) {
      fillerWords[f] = matches.length;
      fillerCount += matches.length;
    }
  });

  const fillerRate = wordCount > 0 ? Math.round((fillerCount / wordCount) * 100) : 0;
  const clarityScore = Math.max(0, 100 - fillerRate * 3);

  // Pace (assume avg speaking is ~130wpm, estimate from word count vs 120s)
  const estimatedSecs = Math.max(10, wordCount / 2.2);
  const wpm = Math.round((wordCount / estimatedSecs) * 60);
  let paceLabel, paceColor;
  if (wpm < 100) { paceLabel = "Too slow"; paceColor = COLORS.amber; }
  else if (wpm <= 160) { paceLabel = "Good pace"; paceColor = COLORS.green; }
  else if (wpm <= 200) { paceLabel = "Slightly fast"; paceColor = COLORS.amber; }
  else { paceLabel = "Too fast"; paceColor = COLORS.red; }

  // Vocabulary richness
  const uniqueWords = new Set(words.map(w => w.toLowerCase().replace(/[^a-z]/g, ""))).size;
  const vocabularyScore = Math.min(100, Math.round((uniqueWords / Math.max(1, wordCount)) * 100 * 1.8));

  // Confidence signals: short sentences, passive voice, hedging
  const hedgeWords = ["maybe","perhaps","might","possibly","not sure","i think","i guess","probably","somewhat"];
  const hedgeCount = hedgeWords.reduce((acc, h) => acc + (lower.split(h).length - 1), 0);
  const confidenceScore = Math.max(20, Math.min(100, 100 - hedgeCount * 12 - fillerRate * 2));

  return { fillerCount, fillerWords, wordCount, sentenceCount, wpm, clarityScore, paceLabel, paceColor, fillerRate, uniqueWords, vocabularyScore, confidenceScore };
}

function SpeechAnalyticsPanel({ text, listening, sessionAnalytics }) {
  const analytics = analyzeSpeech(text);

  const MiniGauge = ({ label, value, color, suffix = "" }) => (
    <div style={{ flex: 1, minWidth: 80 }}>
      <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color, lineHeight: 1 }}>{value}<span style={{ fontSize: 11, fontWeight: 400, color: COLORS.textMuted }}>{suffix}</span></div>
      <div style={{ height: 3, background: COLORS.border, borderRadius: 99, marginTop: 5, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(100, value)}%`, background: color, borderRadius: 99, transition: "width 0.4s" }} />
      </div>
    </div>
  );

  // Highlight filler words in transcript
  const highlightedText = () => {
    if (!text) return null;
    let result = text;
    const sorted = FILLER_WORDS.slice().sort((a, b) => b.length - a.length);
    sorted.forEach(f => {
      const regex = new RegExp(`(\\b${f}\\b)`, "gi");
      result = result.replace(regex, `__FILLER__$1__END__`);
    });
    return result.split(/(__FILLER__|__END__)/).map((part, i) => {
      if (part === "__FILLER__" || part === "__END__") return null;
      const isFiller = result.includes(`__FILLER__${part}__END__`) && FILLER_WORDS.some(f => part.toLowerCase() === f);
      return isFiller
        ? <mark key={i} style={{ background: `${COLORS.amber}44`, color: COLORS.amber, borderRadius: 3, padding: "0 2px" }}>{part}</mark>
        : <span key={i}>{part}</span>;
    });
  };

  const topFillers = Object.entries(analytics.fillerWords).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "1rem", marginTop: "0.75rem" }}>
      {/* Live indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.75rem" }}>
        {listening && <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.red, animation: "pulse 1s infinite" }} />}
        <span style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
          {listening ? "Live speech analytics" : "Speech analytics"}
        </span>
        {analytics.wordCount > 0 && (
          <span style={{ fontSize: 11, color: COLORS.textMuted, marginLeft: "auto" }}>{analytics.wordCount} words · {analytics.sentenceCount} sentences</span>
        )}
      </div>

      {/* 4 gauges */}
      <div style={{ display: "flex", gap: 16, marginBottom: "0.75rem", flexWrap: "wrap" }}>
        <MiniGauge label="Clarity" value={analytics.clarityScore} color={analytics.clarityScore >= 80 ? COLORS.green : analytics.clarityScore >= 60 ? COLORS.amber : COLORS.red} suffix="/100" />
        <MiniGauge label="Confidence" value={analytics.confidenceScore} color={analytics.confidenceScore >= 75 ? COLORS.green : analytics.confidenceScore >= 50 ? COLORS.amber : COLORS.red} suffix="/100" />
        <MiniGauge label="Vocabulary" value={analytics.vocabularyScore} color={analytics.vocabularyScore >= 70 ? COLORS.green : analytics.vocabularyScore >= 50 ? COLORS.amber : COLORS.red} suffix="/100" />
        <div style={{ flex: 1, minWidth: 80 }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: "0.05em" }}>Pace</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: analytics.paceColor, lineHeight: 1 }}>{analytics.paceLabel}</div>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 3 }}>{analytics.wpm > 0 ? `~${analytics.wpm} wpm` : "—"}</div>
        </div>
      </div>

      {/* Filler words */}
      {analytics.fillerCount > 0 ? (
        <div style={{ background: `${COLORS.amber}10`, border: `1px solid ${COLORS.amber}30`, borderRadius: 8, padding: "0.6rem 0.8rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: COLORS.amber, fontWeight: 600 }}>⚠ Filler words detected — {analytics.fillerCount} total ({analytics.fillerRate}% of speech)</span>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {topFillers.map(([word, count]) => (
              <span key={word} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: `${COLORS.amber}22`, color: COLORS.amber }}>
                "{word}" ×{count}
              </span>
            ))}
          </div>
        </div>
      ) : analytics.wordCount > 10 ? (
        <div style={{ background: `${COLORS.green}10`, border: `1px solid ${COLORS.green}30`, borderRadius: 8, padding: "0.6rem 0.8rem", marginBottom: "0.75rem" }}>
          <span style={{ fontSize: 11, color: COLORS.green, fontWeight: 600 }}>✓ No filler words detected — excellent clarity!</span>
        </div>
      ) : null}

      {/* Live coaching tips */}
      {analytics.wordCount > 5 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {analytics.confidenceScore < 60 && (
            <div style={{ fontSize: 11, color: COLORS.textSecondary, padding: "4px 8px", background: COLORS.bgElevated, borderRadius: 6, borderLeft: `2px solid ${COLORS.amber}` }}>
              💡 Tip: Replace hedging phrases like "I think" or "maybe" with direct statements — "I would…" or "The approach is…"
            </div>
          )}
          {analytics.wpm > 180 && (
            <div style={{ fontSize: 11, color: COLORS.textSecondary, padding: "4px 8px", background: COLORS.bgElevated, borderRadius: 6, borderLeft: `2px solid ${COLORS.red}` }}>
              🐇 Slow down — you're speaking too fast. Pause between key points to let ideas land.
            </div>
          )}
          {analytics.wpm > 0 && analytics.wpm < 90 && (
            <div style={{ fontSize: 11, color: COLORS.textSecondary, padding: "4px 8px", background: COLORS.bgElevated, borderRadius: 6, borderLeft: `2px solid ${COLORS.amber}` }}>
              🐢 Pick up the pace — aim for 120–160 words per minute to sound confident and engaged.
            </div>
          )}
          {analytics.fillerRate > 10 && (
            <div style={{ fontSize: 11, color: COLORS.textSecondary, padding: "4px 8px", background: COLORS.bgElevated, borderRadius: 6, borderLeft: `2px solid ${COLORS.amber}` }}>
              🎯 Pause instead of filling silence — a brief pause sounds more confident than "um" or "like".
            </div>
          )}
          {analytics.vocabularyScore > 80 && analytics.wordCount > 20 && (
            <div style={{ fontSize: 11, color: COLORS.textSecondary, padding: "4px 8px", background: COLORS.bgElevated, borderRadius: 6, borderLeft: `2px solid ${COLORS.green}` }}>
              ⭐ Strong vocabulary diversity — you're using varied, technical language effectively.
            </div>
          )}
        </div>
      )}

      {/* Highlighted transcript */}
      {text && analytics.fillerCount > 0 && (
        <details style={{ marginTop: 8 }}>
          <summary style={{ fontSize: 11, color: COLORS.textMuted, cursor: "pointer", userSelect: "none" }}>View highlighted transcript</summary>
          <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.7, marginTop: 8, padding: "8px", background: COLORS.bgElevated, borderRadius: 8 }}>
            {highlightedText()}
          </div>
        </details>
      )}

      {/* Session totals if multiple answers recorded */}
      {sessionAnalytics && sessionAnalytics.length > 1 && (
        <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 10, paddingTop: 10 }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Session avg across {sessionAnalytics.length} answers</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {[
              ["Avg clarity", Math.round(sessionAnalytics.reduce((a, b) => a + b.clarityScore, 0) / sessionAnalytics.length)],
              ["Avg confidence", Math.round(sessionAnalytics.reduce((a, b) => a + b.confidenceScore, 0) / sessionAnalytics.length)],
              ["Total fillers", sessionAnalytics.reduce((a, b) => a + b.fillerCount, 0)],
            ].map(([l, v]) => (
              <div key={l} style={{ fontSize: 11, color: COLORS.textSecondary }}><span style={{ color: COLORS.textMuted }}>{l}: </span><span style={{ color: COLORS.textPrimary, fontWeight: 600 }}>{v}</span></div>
            ))}
          </div>
        </div>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}

// ─── SCREEN: MOCK INTERVIEW ───────────────────────────────────────────────────
function InterviewScreen({ user, config, onComplete, onBack }) {
  const questions = (SAMPLE_QUESTIONS[config.stack] || SAMPLE_QUESTIONS["default"]).slice(0, 5);
  const [qIdx, setQIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [answers, setAnswers] = useState([]);
  const [scores, setScores] = useState([]);
  const [speechStats, setSpeechStats] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);
  const [timerActive, setTimerActive] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState("");
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const waveRef = useRef(null);
  const waveAnimRef = useRef(null);
  const [waveBars, setWaveBars] = useState(Array(20).fill(4));

  const currentQ = questions[qIdx];
  const isLast = qIdx === questions.length - 1;
  const liveText = answer + (interimTranscript ? " " + interimTranscript : "");

  // Timer
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [timerActive, timeLeft]);

  // Animated waveform when listening
  useEffect(() => {
    if (listening) {
      const animate = () => {
        setWaveBars(Array(20).fill(0).map(() => Math.floor(Math.random() * 28) + 4));
        waveAnimRef.current = setTimeout(animate, 100);
      };
      animate();
    } else {
      clearTimeout(waveAnimRef.current);
      setWaveBars(Array(20).fill(4));
    }
    return () => clearTimeout(waveAnimRef.current);
  }, [listening]);

  // Speak question via TTS
  const speakQuestion = useCallback((text) => {
    if (!config.voiceEnabled || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.9; utt.pitch = 1; utt.volume = 1;
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => { setSpeaking(false); setTimerActive(true); };
    window.speechSynthesis.speak(utt);
  }, [config.voiceEnabled]);

  useEffect(() => {
    setAnswer(""); setInterimTranscript(""); setFeedback(null); setTimeLeft(120); setTimerActive(false);
    if (config.voiceEnabled) setTimeout(() => speakQuestion(currentQ), 400);
    else setTimerActive(true);
  }, [qIdx]);

  // Voice recording with real-time interim results
  const toggleListen = () => {
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      alert("Speech recognition not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setInterimTranscript("");
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true; rec.interimResults = true; rec.lang = "en-US";
    rec.onresult = e => {
      let final = "";
      let interim = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + " ";
        else interim += e.results[i][0].transcript;
      }
      if (final) setAnswer(final.trim());
      setInterimTranscript(interim);
    };
    rec.onend = () => { setListening(false); setInterimTranscript(""); };
    rec.onerror = () => { setListening(false); setInterimTranscript(""); };
    rec.start();
    recognitionRef.current = rec;
    setListening(true);
  };

  const evaluateAnswer = async () => {
    const finalAnswer = answer.trim();
    if (!finalAnswer) return;
    // Stop listening if active
    if (listening) { recognitionRef.current?.stop(); setListening(false); setInterimTranscript(""); }
    setLoading(true);
    setTimerActive(false);

    // Save speech analytics for this answer
    const stats = analyzeSpeech(finalAnswer);
    setSpeechStats(prev => [...prev, stats]);

    try {
      const prompt = `You are a senior technical interviewer. Evaluate this answer and return ONLY a JSON object (no markdown):
{
  "score": 78,
  "verdict": "Good answer with room for improvement",
  "strengths": ["Clear explanation", "Good example"],
  "improvements": ["Add time complexity", "Mention edge cases"],
  "ideal_points": ["Key point 1", "Key point 2", "Key point 3"],
  "follow_up": "Can you explain how this scales?"
}

Question: ${currentQ}
Answer: ${finalAnswer}
Seniority expected: ${config.seniority}
Speech stats: ${stats.fillerCount} filler words, clarity ${stats.clarityScore}/100, confidence ${stats.confidenceScore}/100`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "{}";
      const fb = JSON.parse(text.replace(/```json|```/g, "").trim());
      setFeedback({ ...fb, speechStats: stats });
      setAnswers(prev => [...prev, finalAnswer]);
      setScores(prev => [...prev, fb.score]);
    } catch {
      const fb = { score: 72, verdict: "Solid answer covering the main concepts.", strengths: ["Good structure", "Relevant example"], improvements: ["More depth on edge cases"], ideal_points: ["Covered the core concept", "Should mention trade-offs", "Performance considerations"], follow_up: "Can you walk me through the time complexity?", speechStats: stats };
      setFeedback(fb);
      setAnswers(prev => [...prev, finalAnswer]);
      setScores(prev => [...prev, fb.score]);
    }
    setLoading(false);
  };

  const nextQuestion = () => {
    if (isLast) {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      const avgClarity = speechStats.length ? Math.round(speechStats.reduce((a, b) => a + b.clarityScore, 0) / speechStats.length) : null;
      const avgConfidence = speechStats.length ? Math.round(speechStats.reduce((a, b) => a + b.confidenceScore, 0) / speechStats.length) : null;
      const totalFillers = speechStats.reduce((a, b) => a + b.fillerCount, 0);
      onComplete({ questions, answers, scores, overallScore: avg, speechStats, avgClarity, avgConfidence, totalFillers });
    } else {
      setQIdx(q => q + 1);
    }
  };

  const timerColor = timeLeft <= 20 ? COLORS.red : timeLeft <= 60 ? COLORS.amber : COLORS.green;
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div style={{ padding: "1.5rem", maxWidth: 900, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: COLORS.textSecondary, cursor: "pointer", fontSize: 14 }}>✕ End</button>
          <div style={{ display: "flex", gap: 6 }}>
            {questions.map((_, i) => (
              <div key={i} style={{ width: 28, height: 4, borderRadius: 99, background: i < qIdx ? COLORS.accent : i === qIdx ? COLORS.accentHover : COLORS.border, transition: "background 0.3s" }} />
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setShowAnalytics(s => !s)} style={{ background: showAnalytics ? COLORS.accentSoft : "transparent", border: `1px solid ${showAnalytics ? COLORS.accent : COLORS.border}`, color: showAnalytics ? COLORS.accent : COLORS.textSecondary, borderRadius: 8, padding: "4px 11px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            📊 {showAnalytics ? "Hide" : "Show"} analytics
          </button>
          <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>Q{qIdx + 1}/{questions.length}</span>
          <div style={{ fontWeight: 700, fontSize: 18, color: timerColor, fontVariantNumeric: "tabular-nums", minWidth: 48 }}>
            {mins}:{secs.toString().padStart(2, "0")}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: showAnalytics ? "1fr 300px" : "1fr", gap: "1rem", alignItems: "start" }}>
        {/* LEFT: question + answer */}
        <div>
          {/* Question card */}
          <Card style={{ marginBottom: "0.75rem", borderColor: speaking ? `${COLORS.accent}66` : COLORS.border }}>
            {speaking && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
                  {[0,1,2,3,4].map(i => (
                    <div key={i} style={{ width: 3, background: COLORS.accent, borderRadius: 99, animation: `wave 0.8s ${i * 0.12}s ease-in-out infinite alternate`, height: 16 }} />
                  ))}
                </div>
                <span style={{ color: COLORS.accent, fontSize: 12 }}>AI Interviewer speaking...</span>
              </div>
            )}
            <div style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 }}>Question {qIdx + 1}</div>
            <p style={{ color: COLORS.textPrimary, fontSize: 16, lineHeight: 1.65, margin: 0 }}>{currentQ}</p>
            {config.voiceEnabled && (
              <button onClick={() => speakQuestion(currentQ)} style={{ marginTop: 10, background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 12 }}>🔊 Replay</button>
            )}
          </Card>

          {/* Answer area */}
          {!feedback && (
            <Card style={{ marginBottom: "0.75rem" }}>
              {/* Waveform visualizer */}
              {config.voiceEnabled && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {listening && <div style={{ width: 7, height: 7, borderRadius: "50%", background: COLORS.red, animation: "pulse 1s infinite" }} />}
                      <span style={{ color: COLORS.textSecondary, fontSize: 12 }}>{listening ? "Recording..." : "Your answer"}</span>
                    </div>
                    <button onClick={toggleListen} style={{
                      display: "flex", alignItems: "center", gap: 6, padding: "7px 16px",
                      borderRadius: 8, border: `1px solid ${listening ? COLORS.red : COLORS.accent}`,
                      background: listening ? COLORS.redSoft : COLORS.accentSoft,
                      color: listening ? COLORS.red : COLORS.accent,
                      cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: 600,
                    }}>
                      {listening ? "⏹ Stop" : "🎙 Speak"}
                    </button>
                  </div>
                  {/* Waveform bars */}
                  <div ref={waveRef} style={{ display: "flex", alignItems: "center", gap: 2, height: 36, padding: "0 4px", background: COLORS.bgElevated, borderRadius: 8, overflow: "hidden" }}>
                    {waveBars.map((h, i) => (
                      <div key={i} style={{ flex: 1, height: h, background: listening ? COLORS.accent : COLORS.border, borderRadius: 99, transition: listening ? "height 0.08s" : "height 0.5s", opacity: listening ? 0.8 + (i % 3) * 0.07 : 0.4 }} />
                    ))}
                  </div>
                  {/* Interim transcript preview */}
                  {interimTranscript && (
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 6, fontStyle: "italic", padding: "4px 8px", background: COLORS.bgElevated, borderRadius: 6 }}>
                      {interimTranscript}
                    </div>
                  )}
                </div>
              )}

              {!config.voiceEnabled && (
                <div style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 }}>Your answer</div>
              )}

              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder={config.voiceEnabled ? "Transcript will appear here as you speak, or type manually..." : "Type your answer here. Be as detailed as possible — structure, examples, trade-offs..."}
                style={{ width: "100%", minHeight: 130, padding: "12px", background: COLORS.bgElevated, border: `1px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.textPrimary, fontSize: 13, fontFamily: "inherit", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.65 }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{answer.trim().split(/\s+/).filter(Boolean).length} words</div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn variant="ghost" onClick={nextQuestion} style={{ fontSize: 12, padding: "7px 14px" }}>Skip →</Btn>
                  <Btn onClick={evaluateAnswer} disabled={!answer.trim() || loading}>
                    {loading ? "AI evaluating..." : "Submit Answer →"}
                  </Btn>
                </div>
              </div>
            </Card>
          )}

          {/* Feedback panel */}
          {feedback && (
            <Card style={{ borderColor: feedback.score >= 80 ? `${COLORS.green}44` : feedback.score >= 60 ? `${COLORS.amber}44` : `${COLORS.red}44` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
                <div>
                  <div style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 4 }}>AI Feedback</div>
                  <div style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 15, maxWidth: 380 }}>{feedback.verdict}</div>
                </div>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: 40, fontWeight: 800, color: feedback.score >= 80 ? COLORS.green : feedback.score >= 60 ? COLORS.amber : COLORS.red, lineHeight: 1 }}>{feedback.score}</div>
                  <div style={{ fontSize: 11, color: COLORS.textSecondary }}>/ 100</div>
                </div>
              </div>

              {/* Speech stats summary in feedback */}
              {feedback.speechStats && (
                <div style={{ display: "flex", gap: 10, marginBottom: "0.75rem", flexWrap: "wrap" }}>
                  {[
                    ["Clarity", feedback.speechStats.clarityScore, feedback.speechStats.clarityScore >= 80 ? COLORS.green : COLORS.amber],
                    ["Confidence", feedback.speechStats.confidenceScore, feedback.speechStats.confidenceScore >= 75 ? COLORS.green : COLORS.amber],
                    ["Vocab", feedback.speechStats.vocabularyScore, feedback.speechStats.vocabularyScore >= 70 ? COLORS.green : COLORS.amber],
                    ["Fillers", feedback.speechStats.fillerCount, feedback.speechStats.fillerCount === 0 ? COLORS.green : feedback.speechStats.fillerCount <= 3 ? COLORS.amber : COLORS.red],
                  ].map(([label, val, color]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", background: `${color}14`, borderRadius: 8, border: `1px solid ${color}33` }}>
                      <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{label}:</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>{label === "Fillers" ? val : `${val}/100`}</span>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: "0.75rem" }}>
                <div style={{ background: COLORS.greenSoft, borderRadius: 8, padding: "0.75rem" }}>
                  <div style={{ color: COLORS.green, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>WHAT WORKED</div>
                  {feedback.strengths?.map(s => <div key={s} style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 3 }}>✓ {s}</div>)}
                </div>
                <div style={{ background: COLORS.amberSoft, borderRadius: 8, padding: "0.75rem" }}>
                  <div style={{ color: COLORS.amber, fontSize: 11, fontWeight: 600, marginBottom: 6 }}>IMPROVE THIS</div>
                  {feedback.improvements?.map(s => <div key={s} style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 3 }}>→ {s}</div>)}
                </div>
              </div>

              {feedback.follow_up && (
                <div style={{ background: COLORS.accentSoft, borderRadius: 8, padding: "0.75rem", marginBottom: "0.75rem" }}>
                  <div style={{ color: COLORS.accent, fontSize: 11, fontWeight: 600, marginBottom: 4 }}>FOLLOW-UP</div>
                  <div style={{ color: COLORS.textSecondary, fontSize: 13 }}>"{feedback.follow_up}"</div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <Btn variant={isLast ? "success" : "primary"} onClick={nextQuestion}>
                  {isLast ? "🏁 Finish & See Report" : "Next Question →"}
                </Btn>
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT: live analytics panel */}
        {showAnalytics && (
          <div>
            <SpeechAnalyticsPanel
              text={feedback ? answers[answers.length - 1] || answer : liveText}
              listening={listening}
              sessionAnalytics={speechStats}
            />

            {/* Q-by-Q mini scoreboard */}
            {scores.length > 0 && (
              <div style={{ background: COLORS.bgCard, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: "0.85rem", marginTop: "0.75rem" }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Session scores</div>
                {scores.map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted, minWidth: 20 }}>Q{i + 1}</span>
                    <div style={{ flex: 1, height: 5, background: COLORS.border, borderRadius: 99, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${s}%`, background: s >= 80 ? COLORS.green : s >= 60 ? COLORS.amber : COLORS.red, borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: s >= 80 ? COLORS.green : s >= 60 ? COLORS.amber : COLORS.red, minWidth: 28 }}>{s}</span>
                  </div>
                ))}
                {scores.length > 0 && (
                  <div style={{ borderTop: `1px solid ${COLORS.border}`, marginTop: 8, paddingTop: 8, fontSize: 12, color: COLORS.textSecondary, display: "flex", justifyContent: "space-between" }}>
                    <span>Running avg</span>
                    <span style={{ fontWeight: 700, color: COLORS.textPrimary }}>{Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes wave { from { height: 6px; } to { height: 22px; } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
      `}</style>
    </div>
  );
}

// ─── SCREEN: REPORT ───────────────────────────────────────────────────────────
function ReportScreen({ result, onDashboard, onRetry }) {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReport();
  }, []);

  const generateReport = async () => {
    try {
      const prompt = `Generate an interview performance report as JSON (no markdown):
{
  "summary": "2 sentence overall summary",
  "technical_score": 74,
  "communication_score": 80,
  "confidence_score": 68,
  "problem_solving_score": 71,
  "top_strength": "Clear and structured communication",
  "critical_gap": "System design depth",
  "next_steps": ["Study distributed systems", "Practice system design problems on Excalidraw", "Review consistent hashing"],
  "resources": [{"title": "System Design Primer", "type": "GitHub repo"}, {"title": "Designing Data-Intensive Applications", "type": "Book"}],
  "hiring_verdict": "Strong candidate with targeted preparation needed"
}
Scores: ${JSON.stringify(result.scores)}
Questions covered: ${result.questions.length}
Overall: ${result.overallScore}%`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.find(b => b.type === "text")?.text || "{}";
      setReportData(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch {
      setReportData({
        summary: "You demonstrated solid foundational knowledge with consistent performance across technical questions. Focus on deepening system design and scalability concepts.",
        technical_score: result.overallScore - 5,
        communication_score: result.overallScore + 6,
        confidence_score: result.overallScore - 8,
        problem_solving_score: result.overallScore + 2,
        top_strength: "Structured explanations and clear reasoning",
        critical_gap: "System design and scalability",
        next_steps: ["Complete 10 LeetCode medium problems", "Study system design fundamentals", "Practice behavioral STAR method answers"],
        resources: [{ title: "System Design Primer", type: "GitHub" }, { title: "Neetcode 150", type: "Course" }],
        hiring_verdict: result.overallScore >= 75 ? "Strong candidate — ready to interview" : "Good foundation — 2–3 weeks of targeted prep recommended",
      });
    }
    setLoading(false);
  };

  const ScoreBar = ({ label, value }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: COLORS.textSecondary }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: value >= 80 ? COLORS.green : value >= 60 ? COLORS.amber : COLORS.red }}>{value}%</span>
      </div>
      <div style={{ height: 8, background: COLORS.border, borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: value >= 80 ? COLORS.green : value >= 60 ? COLORS.amber : COLORS.red, borderRadius: 99, transition: "width 1s cubic-bezier(.4,0,.2,1) 0.3s" }} />
      </div>
    </div>
  );

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400, flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 40 }}>🧠</div>
      <div style={{ color: COLORS.textSecondary }}>Generating your personalized report...</div>
      <div style={{ color: COLORS.textMuted, fontSize: 13 }}>AI is analyzing your answers (~3,000 tokens)</div>
    </div>
  );

  return (
    <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      {/* Hero score */}
      <Card style={{ textAlign: "center", marginBottom: "1.5rem", background: `linear-gradient(135deg, ${COLORS.bgCard}, ${COLORS.bgElevated})` }}>
        <div style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 }}>Interview Complete 🎉</div>
        <div style={{ fontSize: 72, fontWeight: 800, color: result.overallScore >= 80 ? COLORS.green : result.overallScore >= 60 ? COLORS.amber : COLORS.red, lineHeight: 1 }}>{result.overallScore}</div>
        <div style={{ color: COLORS.textSecondary, fontSize: 14, marginTop: 8 }}>Overall Score</div>
        <div style={{ marginTop: 16, padding: "10px 20px", background: COLORS.bgElevated, borderRadius: 10, display: "inline-block" }}>
          <span style={{ color: COLORS.accent, fontWeight: 600, fontSize: 14 }}>{reportData?.hiring_verdict}</span>
        </div>
        <p style={{ color: COLORS.textSecondary, fontSize: 14, lineHeight: 1.6, marginTop: 16, maxWidth: 500, margin: "16px auto 0" }}>{reportData?.summary}</p>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
        {/* Skill breakdown */}
        <Card>
          <h3 style={{ color: COLORS.textPrimary, margin: "0 0 1.2rem", fontSize: 15 }}>Skill Breakdown</h3>
          <ScoreBar label="Technical depth" value={reportData?.technical_score || 0} />
          <ScoreBar label="Communication" value={reportData?.communication_score || 0} />
          <ScoreBar label="Confidence" value={reportData?.confidence_score || 0} />
          <ScoreBar label="Problem solving" value={reportData?.problem_solving_score || 0} />
          {result.avgClarity != null && (
            <>
              <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: "12px 0", paddingTop: 12 }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Speech analytics</div>
              </div>
              <ScoreBar label="Speech clarity" value={result.avgClarity} />
              <ScoreBar label="Confidence tone" value={result.avgConfidence} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, padding: "8px 12px", background: result.totalFillers === 0 ? COLORS.greenSoft : result.totalFillers <= 5 ? COLORS.amberSoft : COLORS.redSoft, borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: COLORS.textSecondary }}>Total filler words</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: result.totalFillers === 0 ? COLORS.green : result.totalFillers <= 5 ? COLORS.amber : COLORS.red }}>{result.totalFillers}</span>
              </div>
            </>
          )}
        </Card>

        {/* Highlights */}
        <Card>
          <h3 style={{ color: COLORS.textPrimary, margin: "0 0 1.2rem", fontSize: 15 }}>Highlights</h3>
          <div style={{ background: COLORS.greenSoft, borderRadius: 8, padding: "0.75rem", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: COLORS.green, fontWeight: 600, marginBottom: 4 }}>TOP STRENGTH</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{reportData?.top_strength}</div>
          </div>
          <div style={{ background: COLORS.redSoft, borderRadius: 8, padding: "0.75rem", marginBottom: 10 }}>
            <div style={{ fontSize: 11, color: COLORS.red, fontWeight: 600, marginBottom: 4 }}>CRITICAL GAP</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary }}>{reportData?.critical_gap}</div>
          </div>
          <div style={{ background: COLORS.bgElevated, borderRadius: 8, padding: "0.75rem" }}>
            <div style={{ fontSize: 11, color: COLORS.textSecondary, fontWeight: 600, marginBottom: 4 }}>Q-BY-Q SCORES</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {result.scores.map((s, i) => (
                <div key={i} style={{ fontSize: 12, padding: "3px 8px", borderRadius: 6, background: s >= 80 ? COLORS.greenSoft : s >= 60 ? COLORS.amberSoft : COLORS.redSoft, color: s >= 80 ? COLORS.green : s >= 60 ? COLORS.amber : COLORS.red }}>Q{i + 1}: {s}</div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Next steps */}
      <Card style={{ marginBottom: "1.5rem" }}>
        <h3 style={{ color: COLORS.textPrimary, margin: "0 0 1rem", fontSize: 15 }}>🗺 Your Learning Path</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: "1rem" }}>
          {reportData?.next_steps?.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", background: COLORS.bgElevated, borderRadius: 8 }}>
              <span style={{ color: COLORS.accent, fontWeight: 700, fontSize: 13, minWidth: 20 }}>{i + 1}.</span>
              <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${COLORS.border}`, paddingTop: "1rem" }}>
          <div style={{ color: COLORS.textSecondary, fontSize: 12, marginBottom: 8 }}>Recommended resources</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {reportData?.resources?.map(r => (
              <span key={r.title} style={{ fontSize: 12, padding: "4px 10px", borderRadius: 8, background: COLORS.accentSoft, color: COLORS.accent, border: `1px solid ${COLORS.accent}33` }}>📚 {r.title} <span style={{ opacity: 0.6 }}>({r.type})</span></span>
            ))}
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        <Btn variant="ghost" onClick={onDashboard}>← Dashboard</Btn>
        <Btn onClick={onRetry}>🔄 Practice Again</Btn>
        <Btn variant="success" onClick={() => window.open("https://stripe.com", "_blank")}>⬆ Upgrade Plan</Btn>
      </div>
    </div>
  );
}

// ─── SCREEN: PRICING ─────────────────────────────────────────────────────────
function PricingScreen({ user, onBack }) {
  return (
    <div style={{ padding: "2rem", maxWidth: 900, margin: "0 auto" }}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: COLORS.textSecondary, cursor: "pointer", fontSize: 14, marginBottom: "1.5rem" }}>← Back</button>
      <h2 style={{ color: COLORS.textPrimary, textAlign: "center", marginBottom: 8 }}>Choose your plan</h2>
      <p style={{ color: COLORS.textSecondary, textAlign: "center", marginBottom: "2rem", fontSize: 14 }}>Upgrade anytime. Cancel anytime. Tokens reset monthly.</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {Object.entries(PLANS).map(([key, plan]) => {
          const isCurrent = user.plan === key;
          const isPro = key === "pro";
          return (
            <div key={key} style={{
              background: COLORS.bgCard, border: `${isPro ? 2 : 1}px solid ${isPro ? COLORS.accent : isCurrent ? COLORS.borderHover : COLORS.border}`,
              borderRadius: 16, padding: "1.5rem", position: "relative",
            }}>
              {isPro && <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: COLORS.accent, color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 99, whiteSpace: "nowrap" }}>MOST POPULAR</div>}
              {isCurrent && <div style={{ position: "absolute", top: 12, right: 12 }}><Badge color={COLORS.green}>Current</Badge></div>}
              <div style={{ color: plan.color, fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{plan.name}</div>
              <div style={{ color: COLORS.textPrimary, fontSize: 28, fontWeight: 800, marginBottom: 4 }}>
                {plan.price === null ? "Custom" : plan.price === 0 ? "Free" : `$${plan.price}`}
                {plan.price > 0 && <span style={{ fontSize: 14, color: COLORS.textSecondary, fontWeight: 400 }}>/mo</span>}
              </div>
              <div style={{ borderTop: `1px solid ${COLORS.border}`, margin: "16px 0", paddingTop: 16 }}>
                {[
                  `${plan.tokens === Infinity ? "Unlimited" : fmtTokens(plan.tokens)} tokens`,
                  `${plan.sessions === 999 ? "Unlimited" : plan.sessions} sessions`,
                  plan.voice ? "✓ Voice interviews" : "✗ No voice",
                  key !== "free" ? "✓ Full scorecard" : "✓ Basic report",
                  key === "pro" || key === "enterprise" ? "✓ Learning path" : "",
                  key === "enterprise" ? "✓ Team dashboard" : "",
                ].filter(Boolean).map(f => (
                  <div key={f} style={{ fontSize: 13, color: f.startsWith("✗") ? COLORS.textMuted : COLORS.textSecondary, marginBottom: 6 }}>{f}</div>
                ))}
              </div>
              <Btn
                variant={isCurrent ? "ghost" : isPro ? "primary" : "ghost"}
                disabled={isCurrent}
                style={{ width: "100%" }}
                onClick={() => !isCurrent && window.open("https://stripe.com", "_blank")}
              >
                {isCurrent ? "Current plan" : plan.price === null ? "Contact us" : "Upgrade →"}
              </Btn>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "2rem", padding: "1.5rem", background: COLORS.bgCard, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
        <h4 style={{ color: COLORS.textPrimary, margin: "0 0 12px", fontSize: 14 }}>💡 Token top-ups — no plan change needed</h4>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[["100K tokens", "$2"], ["500K tokens", "$8"], ["1M tokens", "$14"]].map(([t, p]) => (
            <Btn key={t} variant="ghost" style={{ fontSize: 13 }} onClick={() => window.open("https://stripe.com", "_blank")}>+ {t} for {p}</Btn>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: DB SCHEMA ────────────────────────────────────────────────────────
function SchemaScreen({ onBack }) {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(SCHEMA_SQL); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div style={{ padding: "2rem", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: COLORS.textSecondary, cursor: "pointer", fontSize: 14 }}>← Back</button>
        <Btn onClick={copy} variant="ghost" style={{ fontSize: 13 }}>{copied ? "✓ Copied!" : "📋 Copy SQL"}</Btn>
      </div>
      <Card>
        <h3 style={{ color: COLORS.textPrimary, margin: "0 0 1rem", fontSize: 16 }}>Supabase Schema</h3>
        <p style={{ color: COLORS.textSecondary, fontSize: 13, marginBottom: "1rem" }}>Run this in your Supabase SQL editor to set up the full database with token tracking, RLS policies, and the monthly reset function.</p>
        <pre style={{ background: COLORS.bg, borderRadius: 10, padding: "1.2rem", overflowX: "auto", fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.7, border: `1px solid ${COLORS.border}`, margin: 0, whiteSpace: "pre-wrap" }}>{SCHEMA_SQL}</pre>
      </Card>
    </div>
  );
}

// ─── NAV BAR ─────────────────────────────────────────────────────────────────
function NavBar({ user, screen, onNav }) {
  if (!user || screen === "landing") return null;
  const plan = PLANS[user.plan];
  const pct = fmtPct(user.tokensUsed, plan.tokens);
  const barColor = tokenBarColor(pct);

  return (
    <div style={{ background: COLORS.bgCard, borderBottom: `1px solid ${COLORS.border}`, padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => onNav("dashboard")}>
          <span style={{ fontSize: 20 }}>🎯</span>
          <span style={{ color: COLORS.textPrimary, fontWeight: 700, fontSize: 15 }}>InterviewAI</span>
        </div>
        {["dashboard", "pricing"].map(s => (
          <button key={s} onClick={() => onNav(s)} style={{ background: "none", border: "none", color: screen === s ? COLORS.textPrimary : COLORS.textSecondary, cursor: "pointer", fontSize: 13, fontFamily: "inherit", fontWeight: screen === s ? 600 : 400, textTransform: "capitalize", padding: "4px 0" }}>
            {s}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {plan.tokens !== Infinity && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 80, height: 4, background: COLORS.border, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: barColor, borderRadius: 99 }} />
            </div>
            <span style={{ fontSize: 11, color: COLORS.textSecondary }}>{fmtTokens(user.tokensUsed)}/{fmtTokens(plan.tokens)}</span>
          </div>
        )}
        <Badge color={plan.color}>{plan.name}</Badge>
        <div style={{ width: 32, height: 32, borderRadius: 50, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
          {user.name.charAt(0)}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("landing");
  const [user, setUser] = useState(null);
  const [interviewConfig, setInterviewConfig] = useState(null);
  const [interviewResult, setInterviewResult] = useState(null);

  const handleEnter = (u) => {
    setUser({ ...u, sessionsUsed: 4 });
    setScreen("dashboard");
  };

  const handleBegin = (config) => {
    setInterviewConfig(config);
    setUser(u => ({ ...u, tokensUsed: (u.tokensUsed || 0) + TOKEN_COSTS.resume_parse + TOKEN_COSTS.question_gen }));
    setScreen("interview");
  };

  const handleComplete = (result) => {
    setInterviewResult(result);
    setUser(u => ({ ...u, tokensUsed: (u.tokensUsed || 0) + TOKEN_COSTS.answer_eval * result.scores.length + TOKEN_COSTS.report_gen, sessionsUsed: (u.sessionsUsed || 0) + 1 }));
    setScreen("report");
  };

  return (
    <div style={{ fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif", background: COLORS.bg, minHeight: "100vh", color: COLORS.textPrimary }}>
      <NavBar user={user} screen={screen} onNav={(s) => setScreen(s)} />
      {screen === "landing" && <LandingScreen onEnter={handleEnter} />}
      {screen === "dashboard" && <DashboardScreen user={user} onStart={() => setScreen("setup")} onUpgrade={() => setScreen("pricing")} onSchema={() => setScreen("schema")} />}
      {screen === "setup" && <SetupScreen user={user} onBegin={handleBegin} onBack={() => setScreen("dashboard")} />}
      {screen === "interview" && interviewConfig && <InterviewScreen user={user} config={interviewConfig} onComplete={handleComplete} onBack={() => setScreen("dashboard")} />}
      {screen === "report" && interviewResult && <ReportScreen result={interviewResult} onDashboard={() => setScreen("dashboard")} onRetry={() => setScreen("setup")} />}
      {screen === "pricing" && <PricingScreen user={user} onBack={() => setScreen("dashboard")} />}
      {screen === "schema" && <SchemaScreen onBack={() => setScreen("dashboard")} />}
    </div>
  );
}
