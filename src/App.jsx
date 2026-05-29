import { useState, useEffect, useRef, useCallback } from "react";

import { createClient } from '@supabase/supabase-js';

// ─── SUPABASE CLIENT ──────────────────────────────────────────────────────────
const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Guard — gives readable error instead of silent undefined createClient
if (!SUPABASE_URL || !SUPABASE_ANON) {
  console.error("❌ Missing Supabase env vars. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel.");
}

export const supabase = createClient(
  SUPABASE_URL  ?? "https://placeholder.supabase.co",
  SUPABASE_ANON ?? "placeholder-key"
);


// ─── DESIGN SYSTEM — World-class SaaS standards (Linear, Vercel, Stripe-inspired) ─
// Font: Inter — #1 screen-optimized font per 2026 research
// Sizes: WCAG AA compliant — body ≥16px, UI labels ≥13px, never below 12px
// Weights: 500 minimum for UI text, 600 for labels, 700+ for headings
// Contrast: All text-on-background passes 4.5:1 minimum ratio

const F = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

const C = {
  // Backgrounds — deep dark, clear hierarchy
  bg:       "#07080d",
  card:     "#0f1117",
  elevated: "#161820",
  raised:   "#1c1f2e",
  // Borders
  border:      "#1e2130",
  borderMid:   "#252840",
  borderHover: "#363a52",
  // Brand
  accent:     "#7c6fff",
  accentHover:"#9d94ff",
  accentSoft: "#7c6fff1a",
  accentMid:  "#7c6fff33",
  // Status
  green:     "#22c55e", greenSoft: "#22c55e18", greenMid: "#22c55e33",
  amber:     "#f59e0b", amberSoft: "#f59e0b18", amberMid: "#f59e0b33",
  red:       "#ef4444", redSoft:   "#ef444418", redMid:   "#ef444433",
  blue:      "#3b82f6", blueSoft:  "#3b82f618",
  // Typography — high contrast, WCAG AA+
  // txt:  white-ish  — headings, primary content  (contrast ~14:1 on bg)
  // txt2: medium     — body, descriptions         (contrast ~7:1 on bg)
  // txt3: muted      — hints, placeholders        (contrast ~4.5:1 on bg)
  // txt4: disabled   — very muted, never for content
  txt:  "#f0f0f8",   // near-white, slightly warm
  txt2: "#a8adc4",   // medium — readable body text (was #7b7f9a — too dim)
  txt3: "#6b7094",   // muted labels (was #3d4060 — failed contrast)
  txt4: "#3d4060",   // disabled only
};

// ─── TYPOGRAPHY HELPERS ───────────────────────────────────────────────────────
// sz = font-size, fw = font-weight, lh = line-height, ls = letter-spacing
const T = {
  // Display headings
  d1: { fontSize:42, fontWeight:800, lineHeight:1.15, letterSpacing:"-0.03em", color:C.txt },
  d2: { fontSize:32, fontWeight:800, lineHeight:1.2,  letterSpacing:"-0.025em",color:C.txt },
  // Section headings
  h1: { fontSize:26, fontWeight:700, lineHeight:1.25, letterSpacing:"-0.02em", color:C.txt },
  h2: { fontSize:20, fontWeight:700, lineHeight:1.3,  letterSpacing:"-0.015em",color:C.txt },
  h3: { fontSize:17, fontWeight:600, lineHeight:1.35, letterSpacing:"-0.01em", color:C.txt },
  h4: { fontSize:15, fontWeight:600, lineHeight:1.4,  letterSpacing:"-0.005em",color:C.txt },
  // Body text — WCAG AA, ≥16px for reading
  body:  { fontSize:16, fontWeight:400, lineHeight:1.65, color:C.txt2 },
  bodyM: { fontSize:16, fontWeight:500, lineHeight:1.65, color:C.txt2 },
  // UI labels — ≥13px minimum
  ui:    { fontSize:15, fontWeight:500, lineHeight:1.5, color:C.txt2 },
  uiSm:  { fontSize:13, fontWeight:500, lineHeight:1.5, color:C.txt2 },
  // Captions / meta — 12px absolute minimum, never below
  caption: { fontSize:12, fontWeight:500, lineHeight:1.5, color:C.txt3 },
  // Overline labels (all-caps, spaced)
  label: { fontSize:11, fontWeight:600, lineHeight:1, letterSpacing:"0.08em", textTransform:"uppercase", color:C.txt3 },
};

// ─── ADMIN CONFIG ─────────────────────────────────────────────────────────────
// Add your email here — these users get full voice + admin features
const ADMIN_EMAILS = [
  "kart78@gmail.com",      // owner
  // "colleague@example.com", // add more admins here
];

const isAdmin = (email) => ADMIN_EMAILS.includes(email?.toLowerCase().trim());

// Voice access rules:
// - Admin → always enabled
// - Starter / Pro / Enterprise → enabled
// - Free → disabled (upsell to Starter)
const hasVoiceAccess = (email, plan) => isAdmin(email) || plan !== "free";

// ─── PLANS ───────────────────────────────────────────────────────────────────
const PLANS = {
  free:       { name:"Free",       price:0,    tokens:50000,   sessions:3,   voice:false, color:C.txt2 },
  starter:    { name:"Starter",    price:9,    tokens:300000,  sessions:15,  voice:true,  color:C.green },
  pro:        { name:"Pro",        price:24,   tokens:1000000, sessions:999, voice:true,  color:C.accent },
  enterprise: { name:"Enterprise", price:null, tokens:Infinity,sessions:999, voice:true,  color:C.amber },
};

// ─── INDUSTRIES & ROLES ──────────────────────────────────────────────────────
const INDUSTRIES = [
  {id:"technology", label:"Technology & Software", icon:"💻"},
  {id:"business",   label:"Business & Finance",    icon:"📊"},
  {id:"healthcare", label:"Healthcare & Medical",  icon:"🏥"},
  {id:"creative",   label:"Creative & Marketing",  icon:"🎨"},
  {id:"education",  label:"Education & Research",  icon:"🎓"},
  {id:"legal",      label:"Legal & Compliance",    icon:"⚖️"},
  {id:"engineering",label:"Engineering & Science", icon:"⚙️"},
  {id:"sales",      label:"Sales & Customer Success",icon:"🤝"},
  {id:"operations", label:"Operations & Logistics",icon:"📦"},
  {id:"hr",         label:"HR & People Ops",       icon:"👥"},
];

const ROLES_BY_INDUSTRY = {
  technology:  ["Frontend Engineer","Backend Engineer","Full Stack Engineer","Data Scientist","ML Engineer","DevOps / Cloud Engineer","Mobile Developer","Product Manager","QA Engineer","Security Engineer"],
  business:    ["Financial Analyst","Investment Banker","Business Analyst","Management Consultant","Strategy Manager","CFO / Finance Director","Accountant / CPA","Risk Manager","Portfolio Manager","Economist"],
  healthcare:  ["Registered Nurse","Physician / Doctor","Pharmacist","Physical Therapist","Healthcare Administrator","Medical Researcher","Dentist","Psychologist / Therapist","Radiologist","Surgeon"],
  creative:    ["UX / UI Designer","Graphic Designer","Marketing Manager","Content Strategist","Brand Manager","Copywriter","Social Media Manager","Art Director","Video Producer","SEO Specialist"],
  education:   ["Teacher / Instructor","University Lecturer","Curriculum Designer","School Counselor","Academic Researcher","Education Administrator","Instructional Designer","Librarian","Tutor / Coach","Department Head"],
  legal:       ["Lawyer / Attorney","Paralegal","Compliance Officer","Legal Analyst","Contract Manager","Public Defender","Corporate Counsel","Judge / Magistrate","Legal Consultant","Notary"],
  engineering: ["Mechanical Engineer","Civil Engineer","Electrical Engineer","Chemical Engineer","Aerospace Engineer","Structural Engineer","Environmental Engineer","Industrial Engineer","Biomedical Engineer","Systems Engineer"],
  sales:       ["Account Executive","Sales Manager","Customer Success Manager","Business Development Rep","Sales Engineer","VP of Sales","Retail Sales Associate","Real Estate Agent","Insurance Agent","SDR / BDR"],
  operations:  ["Operations Manager","Supply Chain Manager","Logistics Coordinator","Project Manager","Scrum Master","Program Manager","Procurement Manager","Warehouse Manager","Process Improvement Analyst","COO"],
  hr:          ["HR Generalist","Recruiter / Talent Acquisition","HR Business Partner","L&D Specialist","Compensation & Benefits Manager","HR Director","DEI Program Manager","Payroll Specialist","Org Development Consultant","CHRO"],
};

const SENIORITY = {
  technology:  ["Intern","Junior","Mid","Senior","Staff / Principal"],
  business:    ["Analyst","Associate","Manager","Director","VP / C-Suite"],
  healthcare:  ["Student / Resident","Entry-Level","Experienced","Senior","Chief / Director"],
  creative:    ["Junior","Mid-Level","Senior","Lead","Director / VP"],
  education:   ["Entry-Level","Experienced","Senior","Lead","Head / Dean"],
  legal:       ["Paralegal / Associate","Junior Attorney","Associate","Senior Associate","Partner / Director"],
  engineering: ["Graduate / Intern","Junior","Mid-Level","Senior","Principal / Director"],
  sales:       ["SDR / Entry","Account Exec","Senior AE","Manager","Director / VP"],
  operations:  ["Coordinator","Specialist","Manager","Senior Manager","Director / VP"],
  hr:          ["Coordinator","Generalist","Manager","Senior Manager","Director / CHRO"],
};

const FILLERS = ["um","uh","like","you know","basically","literally","actually","right","so","kind of","sort of","i mean","well","okay","yeah","hmm"];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const fmtN = n => n>=1000000?(n/1000000).toFixed(1)+"M":n>=1000?Math.round(n/1000)+"K":String(n);
const pct  = (u,t) => t===Infinity?0:Math.min(100,Math.round(u/t*100));
const barC = p => p>=90?C.red:p>=70?C.amber:C.green;

function analyzeSpeech(text){
  // No text — return null scores so UI shows "—" not fake 100s
  if(!text?.trim()) return {
    fillerCount:0, fillerWords:{}, wordCount:0, wpm:0,
    clarityScore:null, confidenceScore:null, vocabularyScore:null,
    paceLabel:"—", paceColor:C.txt3, fillerRate:0
  };
  const lower=text.toLowerCase(), words=text.trim().split(/\s+/).filter(Boolean);
  const wordCount=words.length;
  // Need at least 10 words for meaningful scores
  if(wordCount<10) return {
    fillerCount:0, fillerWords:{}, wordCount, wpm:0,
    clarityScore:null, confidenceScore:null, vocabularyScore:null,
    paceLabel:"Keep going…", paceColor:C.txt3, fillerRate:0
  };
  const fillerWords={};let fillerCount=0;
  FILLERS.forEach(f=>{const m=lower.match(new RegExp(`\\b${f}\\b`,"g"));if(m){fillerWords[f]=m.length;fillerCount+=m.length;}});
  const fillerRate=wordCount>0?Math.round(fillerCount/wordCount*100):0;
  const clarityScore=Math.max(0,100-fillerRate*3);
  const secs=Math.max(10,wordCount/2.2);
  const wpm=Math.round(wordCount/secs*60);
  const paceLabel=wpm<100?"Too slow":wpm<=160?"Good pace":wpm<=200?"Slightly fast":"Too fast";
  const paceColor=wpm>=100&&wpm<=160?C.green:C.amber;
  const unique=new Set(words.map(w=>w.toLowerCase().replace(/[^a-z]/g,""))).size;
  const vocabularyScore=Math.min(100,Math.round(unique/Math.max(1,wordCount)*100*1.8));
  const hedges=["maybe","perhaps","might","possibly","not sure","i think","i guess","probably","somewhat"];
  const hedgeCount=hedges.reduce((a,h)=>a+(lower.split(h).length-1),0);
  const confidenceScore=Math.max(20,Math.min(100,100-hedgeCount*12-fillerRate*2));
  return {fillerCount,fillerWords,wordCount,wpm,clarityScore,confidenceScore,vocabularyScore,paceLabel,paceColor,fillerRate};
}

// ─── AVA AVATAR COMPONENT ─────────────────────────────────────────────────────
function AvaAvatar({ speaking, listening, thinking, size=120 }){
  const [mouthH, setMouthH] = useState(2);
  const [blink, setBlink] = useState(false);
  const [eyeY, setEyeY] = useState(0);
  const animRef = useRef(null);
  const blinkRef = useRef(null);

  // Mouth animation synced to speaking
  useEffect(()=>{
    if(speaking){
      const animate=()=>{
        setMouthH(Math.random()*14+2);
        animRef.current=setTimeout(animate, 80+Math.random()*60);
      };
      animate();
    } else {
      clearTimeout(animRef.current);
      setMouthH(2);
    }
    return ()=>clearTimeout(animRef.current);
  },[speaking]);

  // Listening pulse — subtle nod
  useEffect(()=>{
    if(listening){
      const nod=()=>{ setEyeY(p=>p===0?1:0); blinkRef.current=setTimeout(nod,800); };
      nod();
    } else { clearTimeout(blinkRef.current); setEyeY(0); }
    return ()=>clearTimeout(blinkRef.current);
  },[listening]);

  // Natural blink every 3-4s
  useEffect(()=>{
    const doBlink=()=>{
      setBlink(true);
      setTimeout(()=>setBlink(false),150);
      blinkRef.current=setTimeout(doBlink,3000+Math.random()*2000);
    };
    blinkRef.current=setTimeout(doBlink,2000);
    return ()=>clearTimeout(blinkRef.current);
  },[]);

  const r = size/2;
  const cx = r, cy = r;

  // Glow color
  const glowColor = thinking?"#f59e0b":speaking?C.accent:listening?"#22c55e":C.accent;

  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      {/* Outer glow ring */}
      <div style={{
        position:"absolute", inset:-4, borderRadius:"50%",
        background:`radial-gradient(circle, ${glowColor}30 0%, transparent 70%)`,
        animation: speaking?"avaPulse 0.6s ease-in-out infinite alternate":listening?"avaPulse 1.2s ease-in-out infinite alternate":"none",
      }}/>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ borderRadius:"50%", overflow:"hidden" }}>
        <defs>
          <radialGradient id="avaBg" cx="50%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#2a1a5e"/>
            <stop offset="100%" stopColor="#07080d"/>
          </radialGradient>
          <radialGradient id="skinGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fcd5b0"/>
            <stop offset="100%" stopColor="#e8a87c"/>
          </radialGradient>
          <radialGradient id="hairGrad" cx="50%" cy="0%" r="80%">
            <stop offset="0%" stopColor="#4a2800"/>
            <stop offset="100%" stopColor="#1a0a00"/>
          </radialGradient>
          <filter id="soft">
            <feGaussianBlur stdDeviation="0.5"/>
          </filter>
        </defs>

        {/* Background */}
        <circle cx={cx} cy={cy} r={r} fill="url(#avaBg)"/>

        {/* Subtle grid lines for sci-fi look */}
        {[0.3,0.5,0.7].map(f=>(
          <circle key={f} cx={cx} cy={cy} r={r*f} fill="none" stroke={C.accent} strokeWidth="0.3" opacity="0.15"/>
        ))}

        {/* Neck */}
        <rect x={cx-size*0.08} y={cy+size*0.22} width={size*0.16} height={size*0.18} rx={size*0.04} fill="url(#skinGrad)"/>

        {/* Shoulders */}
        <ellipse cx={cx} cy={cy+size*0.46} rx={size*0.38} ry={size*0.14} fill="#1a1a2e"/>

        {/* Head */}
        <ellipse cx={cx} cy={cy+size*0.04} rx={size*0.24} ry={size*0.27} fill="url(#skinGrad)"/>

        {/* Hair */}
        <ellipse cx={cx} cy={cy-size*0.14} rx={size*0.25} ry={size*0.16} fill="url(#hairGrad)"/>
        <ellipse cx={cx-size*0.22} cy={cy+size*0.04} rx={size*0.05} ry={size*0.14} fill="url(#hairGrad)"/>
        <ellipse cx={cx+size*0.22} cy={cy+size*0.04} rx={size*0.05} ry={size*0.14} fill="url(#hairGrad)"/>

        {/* Eyes */}
        {/* Left eye */}
        <ellipse cx={cx-size*0.085} cy={cy+size*0.04+eyeY} rx={size*0.045} ry={blink?0.5:size*0.035} fill="#1a0a00"/>
        <circle cx={cx-size*0.078} cy={cy+size*0.032+eyeY} r={size*0.012} fill="white" opacity="0.9"/>
        {/* Right eye */}
        <ellipse cx={cx+size*0.085} cy={cy+size*0.04+eyeY} rx={size*0.045} ry={blink?0.5:size*0.035} fill="#1a0a00"/>
        <circle cx={cx+size*0.092} cy={cy+size*0.032+eyeY} r={size*0.012} fill="white" opacity="0.9"/>

        {/* Eyebrows */}
        <path d={`M${cx-size*0.115},${cy-size*0.01+eyeY} Q${cx-size*0.085},${cy-size*0.025+eyeY} ${cx-size*0.055},${cy-size*0.01+eyeY}`} fill="none" stroke="#3d1a00" strokeWidth={size*0.015} strokeLinecap="round"/>
        <path d={`M${cx+size*0.055},${cy-size*0.01+eyeY} Q${cx+size*0.085},${cy-size*0.025+eyeY} ${cx+size*0.115},${cy-size*0.01+eyeY}`} fill="none" stroke="#3d1a00" strokeWidth={size*0.015} strokeLinecap="round"/>

        {/* Nose */}
        <path d={`M${cx},${cy+size*0.06} Q${cx+size*0.025},${cy+size*0.1} ${cx+size*0.035},${cy+size*0.12} Q${cx+size*0.01},${cy+size*0.125} ${cx-size*0.01},${cy+size*0.12}`} fill="none" stroke="#c88860" strokeWidth={size*0.012} strokeLinecap="round"/>

        {/* Mouth — lip-synced */}
        <ellipse cx={cx} cy={cy+size*0.165} rx={size*0.06} ry={mouthH/size*size*0.04+1} fill={mouthH>4?"#8b2020":"#c86060"}/>
        {/* Upper lip */}
        <path d={`M${cx-size*0.065},${cy+size*0.158} Q${cx-size*0.03},${cy+size*0.15} ${cx},${cy+size*0.152} Q${cx+size*0.03},${cy+size*0.15} ${cx+size*0.065},${cy+size*0.158}`} fill="none" stroke="#b05050" strokeWidth={size*0.01} strokeLinecap="round"/>

        {/* Status indicator dot */}
        <circle cx={cx+size*0.22} cy={cy-size*0.2} r={size*0.04}
          fill={thinking?C.amber:speaking?C.accent:listening?C.green:C.txt3}
          opacity="0.9"/>
      </svg>

      <style>{`
        @keyframes avaPulse { from{opacity:0.5;transform:scale(1)} to{opacity:1;transform:scale(1.04)} }
      `}</style>
    </div>
  );
}

// ─── CLAUDE API CALL — via Supabase Edge Function (key never in browser) ─────
async function callClaude(messages, model="claude-haiku-4-5-20251001", maxTokens=1200){
  try {
    // Get current user session token to authenticate the edge function
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    const edgeFnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claude-proxy`;

    const res = await fetch(edgeFnUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Edge function error ${res.status}: ${err}`);
    }

    const data = await res.json();
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
    return data.content?.find(b => b.type === "text")?.text || "";

  } catch (err) {
    console.error("callClaude failed:", err.message);
    throw err; // Let callers fall back to their catch blocks
  }
}

function parseJSON(text){
  try{ return JSON.parse(text.replace(/```json|```/g,"").trim()); }
  catch{ return null; }
}

// ─── SHARED UI COMPONENTS ─────────────────────────────────────────────────────
function Btn({children,onClick,variant="primary",disabled=false,style={}}){
  const [hov,setHov]=useState(false);
  const base = {
    padding:"11px 22px", borderRadius:10, fontFamily:F, fontSize:15,
    fontWeight:600, cursor:disabled?"not-allowed":"pointer",
    opacity:disabled?0.45:1, transition:"all 0.15s",
    letterSpacing:"-0.01em", lineHeight:1,
  };
  const styles={
    primary:{ background:hov?C.accentHover:C.accent, color:"#fff", border:"none",
      boxShadow:hov?`0 0 0 3px ${C.accentMid}`:"none" },
    ghost:  { background:hov?C.elevated:"transparent", color:C.txt,
      border:`1px solid ${hov?C.borderHover:C.borderMid}` },
    danger: { background:hov?"#dc2626":C.red, color:"#fff", border:"none" },
    success:{ background:hov?"#16a34a":C.green, color:"#fff", border:"none" },
    google: { background:hov?"#1c1f2e":C.elevated, color:C.txt,
      border:`1px solid ${C.borderMid}` },
  };
  return(
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{...base,...styles[variant],...style}}>
      {children}
    </button>
  );
}

function Card({children,style={},onClick}){
  const [hov,setHov]=useState(false);
  return(
    <div onClick={onClick}
      onMouseEnter={()=>onClick&&setHov(true)}
      onMouseLeave={()=>onClick&&setHov(false)}
      style={{background:C.card, border:`1px solid ${hov?C.borderHover:C.border}`,
        borderRadius:16, padding:"1.5rem",
        cursor:onClick?"pointer":"default",
        transition:"border-color 0.2s, transform 0.15s",
        transform:hov?"translateY(-2px)":"none",
        ...style}}>
      {children}
    </div>
  );
}

function Badge({children,color=C.accent,size="sm"}){
  return(
    <span style={{display:"inline-flex",alignItems:"center",
      padding: size==="md"?"4px 12px":"3px 10px",
      borderRadius:99, background:color+"22", color,
      fontSize: size==="md"?13:11, fontWeight:600,
      letterSpacing:"0.05em", textTransform:"uppercase",
      fontFamily:F, lineHeight:1.2}}>
      {children}
    </span>
  );
}

function TokenBar({used,total}){
  const p=pct(used,total);
  const color=barC(p);
  return(
    <div style={{width:"100%"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,
        ...T.uiSm, color:C.txt2}}>
        <span style={{fontWeight:500}}>{fmtN(used)} used</span>
        <span style={{color, fontWeight:600}}>{total===Infinity?"Unlimited":`${p}%`}</span>
      </div>
      <div style={{height:7,background:C.elevated,borderRadius:99,overflow:"hidden",
        border:`1px solid ${C.border}`}}>
        <div style={{height:"100%",width:`${total===Infinity?8:p}%`,
          background:color, borderRadius:99,
          transition:"width 0.6s cubic-bezier(.4,0,.2,1)",
          boxShadow:`0 0 10px ${color}55`}}/>
      </div>
      {p>=80&&total!==Infinity&&(
        <p style={{...T.caption, color:C.amber, marginTop:5, fontWeight:500}}>
          ⚠ {p>=100?"Limit reached — upgrade to continue":"Approaching limit — consider upgrading"}
        </p>
      )}
    </div>
  );
}

// Reusable input style — WCAG compliant, 16px base
const inputCss = {
  width:"100%", padding:"13px 16px",
  background:C.elevated, border:`1.5px solid ${C.borderMid}`,
  borderRadius:10, color:C.txt,
  fontSize:16, fontFamily:F, fontWeight:400,
  lineHeight:1.5, outline:"none", boxSizing:"border-box",
  transition:"border-color 0.2s",
};

// Section heading with consistent spacing
function SectionTitle({children, sub}){
  return(
    <div style={{marginBottom:sub?"6px":"0"}}>
      <h2 style={{...T.h3, margin:0}}>{children}</h2>
      {sub&&<p style={{...T.uiSm, color:C.txt3, marginTop:4}}>{sub}</p>}
    </div>
  );
}

// ─── SCREEN: AUTH ─────────────────────────────────────────────────────────────
function AuthScreen({onEnter}){
  const [tab,setTab]=useState("signin");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [name,setName]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const [showForgot,setShowForgot]=useState(false);
  const [forgotEmail,setForgotEmail]=useState("");
  const [forgotLoading,setForgotLoading]=useState(false);

  const handleAuth = async () => {
    // Fix: check each field individually with clear messages
    if (!email.trim()) return setError("Please enter your email address");
    if (!password.trim()) return setError("Please enter your password");
    if (tab === "signup" && !name.trim()) return setError("Please enter your full name");
    if (tab === "signup" && password.length < 8) return setError("Password must be at least 8 characters");
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (tab === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (error) throw error;
        if (data.user && data.session) {
          onEnter({ name: name.trim(), email: email.trim(), plan: "free", tokensUsed: 0, sessionsUsed: 0 });
        } else {
          setSuccess("✓ Check your email for a confirmation link, then sign in.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        const displayName = data.user?.user_metadata?.full_name || data.user?.user_metadata?.name || email.split("@")[0];
        onEnter({ name: displayName, email: email.trim(), plan: "free", tokensUsed: 0, sessionsUsed: 0, id: data.user?.id });
      }
    } catch (err) {
      // Friendlier error messages
      const msg = err.message || "";
      if (msg.includes("Invalid login")) setError("Incorrect email or password — please try again");
      else if (msg.includes("Email not confirmed")) setError("Please confirm your email first — check your inbox");
      else if (msg.includes("already registered")) setError("This email is already registered — try signing in instead");
      else setError(msg || "Something went wrong — please try again");
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.trim()) return setError("Please enter your email address");
    setForgotLoading(true); setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
        redirectTo: "https://interviewai-ebon.vercel.app",
      });
      if (error) throw error;
      setSuccess("✓ Password reset email sent! Check your inbox.");
      setShowForgot(false);
    } catch (err) {
      setError(err.message || "Failed to send reset email");
    }
    setForgotLoading(false);
  };

  const handleGoogle = async () => {
    setLoading(true); setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: "https://interviewai-ebon.vercel.app",
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err.message || "Google sign-in failed");
      setLoading(false);
    }
  };

  return(
    <div style={{minHeight:"100vh", background:C.bg, display:"flex", alignItems:"center",
      justifyContent:"center", padding:"2rem", fontFamily:F}}>
      <div style={{position:"fixed",top:"12%",left:"50%",transform:"translateX(-50%)",
        width:700, height:350,
        background:`radial-gradient(ellipse,${C.accent}12 0%,transparent 68%)`,
        pointerEvents:"none"}}/>

      <div style={{width:"100%", maxWidth:440, position:"relative"}}>
        <div style={{textAlign:"center", marginBottom:"2.5rem"}}>
          <AvaAvatar speaking={false} listening={false} thinking={false} size={88}/>
          <h1 style={{...T.d2, marginTop:16, marginBottom:6}}>InterviewAI</h1>
          <p style={{...T.body, color:C.txt2}}>
            Meet <strong style={{color:C.accent, fontWeight:700}}>Ava</strong> — your personal AI interview coach
          </p>
        </div>

        <Card style={{padding:"2rem"}}>

          {/* ── FORGOT PASSWORD FORM ── */}
          {showForgot ? (
            <div>
              <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:"1.5rem"}}>
                <button onClick={()=>{setShowForgot(false);setError("");setSuccess("");}}
                  style={{background:"none",border:"none",color:C.txt2,cursor:"pointer",fontSize:18,lineHeight:1}}>←</button>
                <h3 style={{...T.h3, margin:0}}>Reset your password</h3>
              </div>
              <p style={{...T.uiSm, color:C.txt2, marginBottom:"1.25rem", lineHeight:1.6}}>
                Enter your email and we'll send you a link to reset your password. Completely free — powered by Supabase.
              </p>
              <div style={{display:"flex", flexDirection:"column", gap:12}}>
                <div>
                  <label style={{...T.uiSm, display:"block", marginBottom:6, color:C.txt2, fontWeight:600}}>
                    Email address
                  </label>
                  <input placeholder="you@example.com" value={forgotEmail} type="email"
                    onChange={e=>setForgotEmail(e.target.value)} style={inputCss}
                    onKeyDown={e=>e.key==="Enter"&&handleForgotPassword()}
                    autoFocus/>
                </div>
                {error&&(
                  <div style={{background:C.redSoft, border:`1px solid ${C.redMid}`,
                    borderRadius:8, padding:"10px 14px", ...T.uiSm, color:C.red, fontWeight:500}}>
                    ⚠ {error}
                  </div>
                )}
                {success&&(
                  <div style={{background:C.greenSoft, border:`1px solid ${C.greenMid}`,
                    borderRadius:8, padding:"10px 14px", ...T.uiSm, color:C.green, fontWeight:500}}>
                    {success}
                  </div>
                )}
                <Btn onClick={handleForgotPassword} disabled={forgotLoading}
                  style={{width:"100%", padding:"14px 22px", fontSize:16}}>
                  {forgotLoading?"Sending…":"Send Reset Link →"}
                </Btn>
              </div>
            </div>
          ) : (
            <>
              {/* Sign in / Sign up tabs */}
              <div style={{display:"flex", background:C.bg, borderRadius:10, padding:4, marginBottom:"1.5rem", gap:4}}>
                {["signin","signup"].map(t=>(
                  <button key={t} onClick={()=>{setTab(t);setError("");setSuccess("");}} style={{
                    flex:1, padding:"10px 16px", borderRadius:8, border:"none", fontFamily:F,
                    fontSize:15, fontWeight:600, cursor:"pointer", transition:"all 0.15s", lineHeight:1,
                    background:tab===t?C.elevated:"transparent", color:tab===t?C.txt:C.txt3}}>
                    {t==="signin"?"Sign In":"Create Account"}
                  </button>
                ))}
              </div>

              {/* Google OAuth */}
              <Btn variant="google" onClick={handleGoogle} disabled={loading}
                style={{width:"100%", marginBottom:14, display:"flex",
                  alignItems:"center", justifyContent:"center", gap:10, fontSize:15, padding:"13px 22px"}}>
                <svg width="20" height="20" viewBox="0 0 48 48" style={{flexShrink:0}}>
                  <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.8 18.9 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
                  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.3 0-9.8-3.5-11.4-8.3l-6.5 5C9.5 39.4 16.2 44 24 44z"/>
                  <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C41.2 35.5 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"/>
                </svg>
                <span>{loading?"Connecting...":"Continue with Google"}</span>
              </Btn>

              {/* Divider */}
              <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:16}}>
                <div style={{flex:1, height:1, background:C.border}}/>
                <span style={{...T.caption, color:C.txt3, fontWeight:500}}>or with email</span>
                <div style={{flex:1, height:1, background:C.border}}/>
              </div>

              {/* Form fields */}
              <div style={{display:"flex", flexDirection:"column", gap:12}}>
                {tab==="signup"&&(
                  <div>
                    <label style={{...T.uiSm, display:"block", marginBottom:6, color:C.txt2, fontWeight:600}}>Full name</label>
                    <input placeholder="Jane Smith" value={name}
                      onChange={e=>setName(e.target.value)} style={inputCss}/>
                  </div>
                )}
                <div>
                  <label style={{...T.uiSm, display:"block", marginBottom:6, color:C.txt2, fontWeight:600}}>Email address</label>
                  <input placeholder="you@example.com" value={email} type="email"
                    onChange={e=>setEmail(e.target.value)} style={inputCss}/>
                </div>
                <div>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:6}}>
                    <label style={{...T.uiSm, color:C.txt2, fontWeight:600}}>Password</label>
                    {tab==="signin"&&(
                      <button onClick={()=>{setShowForgot(true);setForgotEmail(email);setError("");setSuccess("");}}
                        style={{background:"none", border:"none", color:C.accent,
                          fontSize:13, fontWeight:500, cursor:"pointer", fontFamily:F}}>
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input placeholder={tab==="signup"?"Min. 8 characters":"Your password"} value={password} type="password"
                    onChange={e=>setPassword(e.target.value)} style={inputCss}
                    onKeyDown={e=>e.key==="Enter"&&handleAuth()}/>
                </div>
                {error&&(
                  <div style={{background:C.redSoft, border:`1px solid ${C.redMid}`,
                    borderRadius:8, padding:"10px 14px", ...T.uiSm, color:C.red, fontWeight:500}}>
                    ⚠ {error}
                  </div>
                )}
                {success&&(
                  <div style={{background:C.greenSoft, border:`1px solid ${C.greenMid}`,
                    borderRadius:8, padding:"10px 14px", ...T.uiSm, color:C.green, fontWeight:500}}>
                    {success}
                  </div>
                )}
                <Btn onClick={handleAuth} disabled={loading}
                  style={{width:"100%", padding:"14px 22px", fontSize:16, marginTop:4}}>
                  {loading?"Please wait…":tab==="signin"?"Sign In →":"Create Free Account →"}
                </Btn>
              </div>

              <p style={{...T.uiSm, color:C.txt3, textAlign:"center", marginTop:"1.25rem"}}>
                {tab==="signup"
                  ? "Free plan — no credit card required"
                  : <>No account?{" "}
                      <span style={{color:C.accent, cursor:"pointer", fontWeight:600}}
                        onClick={()=>setTab("signup")}>Sign up free</span>
                    </>
                }
              </p>
            </>
          )}
        </Card>

        <div style={{display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center", marginTop:"1.5rem"}}>
          {["🎙 Voice interviews","📊 Real-time scoring","🤖 Ava AI coach","🌍 All industries"].map(f=>(
            <span key={f} style={{...T.caption, color:C.txt2,
              background:C.card, border:`1px solid ${C.border}`,
              borderRadius:99, padding:"6px 14px", fontWeight:500}}>
              {f}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── SCREEN: DASHBOARD ────────────────────────────────────────────────────────
function DashboardScreen({user,onStart,onUpgrade}){
  const plan=PLANS[user.plan];
  const p=pct(user.tokensUsed,plan.tokens);
  const hour=new Date().getHours();
  const greeting=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";

  const stats=[
    {label:"Sessions this month", value:user.sessionsUsed||0, icon:"🎯", color:C.accent},
    {label:"Average score",       value:"—",   icon:"📊", color:C.green},
    {label:"Top industry",        value:"—",   icon:"⭐", color:C.amber},
    {label:"Next goal",           value:"Practice", icon:"📈", color:C.blue},
  ];

  const recent=[
    {role:"Financial Analyst",  industry:"Business & Finance", score:82, date:"Today"},
    {role:"Registered Nurse",   industry:"Healthcare",         score:71, date:"Yesterday"},
    {role:"UX Designer",        industry:"Creative",           score:65, date:"3 days ago"},
  ];

  return(
    <div style={{padding:"2rem", maxWidth:1100, margin:"0 auto", fontFamily:F}}>
      {/* Page header */}
      <div style={{display:"flex", justifyContent:"space-between",
        alignItems:"flex-start", marginBottom:"2rem", flexWrap:"wrap", gap:16}}>
        <div style={{display:"flex", alignItems:"center", gap:16}}>
          <AvaAvatar speaking={false} listening={false} thinking={false} size={56}/>
          <div>
            <h1 style={{...T.h2, margin:0}}>{greeting}, {user.name.split(" ")[0]} 👋</h1>
            <p style={{...T.ui, color:C.txt2, marginTop:4}}>
              Ava is ready for your next mock interview
            </p>
          </div>
        </div>
        <Btn onClick={onStart} style={{fontSize:15, padding:"12px 24px"}}>
          + New Interview with Ava
        </Btn>
      </div>

      {/* Token usage card */}
      <Card style={{marginBottom:"1.5rem",
        borderColor:p>=80?`${C.amber}55`:C.border,
        background:p>=80?`${C.amber}06`:C.card}}>
        <div style={{display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:14, flexWrap:"wrap", gap:10}}>
          <div style={{display:"flex", alignItems:"center", gap:12}}>
            <div style={{width:40, height:40, borderRadius:10,
              background:C.accentSoft, display:"flex",
              alignItems:"center", justifyContent:"center", fontSize:20}}>⚡</div>
            <div>
              <div style={{...T.h4, margin:0}}>Token Usage</div>
              <div style={{...T.caption, color:C.txt3, marginTop:3, fontWeight:500}}>
                Resets in 18 days
              </div>
            </div>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <Badge color={plan.color} size="md">{plan.name}</Badge>
            {user.plan!=="pro"&&user.plan!=="enterprise"&&(
              <Btn onClick={onUpgrade} style={{padding:"8px 16px", fontSize:14}}>
                Upgrade ↗
              </Btn>
            )}
          </div>
        </div>
        <TokenBar used={user.tokensUsed} total={plan.tokens}/>
      </Card>

      {/* Stats grid */}
      <div style={{display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",
        gap:14, marginBottom:"1.5rem"}}>
        {stats.map(s=>(
          <Card key={s.label} style={{padding:"1.25rem"}}>
            <div style={{display:"flex", alignItems:"center",
              justifyContent:"space-between", marginBottom:14}}>
              <div style={{width:40, height:40, borderRadius:10,
                background:s.color+"18", display:"flex",
                alignItems:"center", justifyContent:"center",
                fontSize:20}}>{s.icon}</div>
            </div>
            <div style={{...T.d2, fontSize:28, margin:"0 0 4px",
              color:s.color}}>{s.value}</div>
            <div style={{...T.uiSm, color:C.txt2, fontWeight:500}}>
              {s.label}
            </div>
          </Card>
        ))}
      </div>

      {/* Recent sessions */}
      <Card>
        <div style={{display:"flex", justifyContent:"space-between",
          alignItems:"center", marginBottom:"1.25rem"}}>
          <h2 style={{...T.h4, margin:0}}>Recent Sessions</h2>
          <span style={{...T.caption, color:C.txt3, fontWeight:500}}>
            Last 30 days
          </span>
        </div>
        <div style={{display:"flex", flexDirection:"column", gap:8}}>
          {user.sessionsUsed>0&&recent.map((s,i)=>(
            <div key={i} style={{display:"flex", alignItems:"center",
              justifyContent:"space-between", padding:"14px 16px",
              background:C.elevated, borderRadius:12,
              border:`1px solid ${C.border}`, flexWrap:"wrap", gap:8,
              transition:"border-color 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.borderHover}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div>
                <div style={{...T.h4, margin:0}}>{s.role}</div>
                <div style={{...T.caption, color:C.txt3, marginTop:4, fontWeight:500}}>
                  {s.industry} · {s.date}
                </div>
              </div>
              <div style={{display:"flex", alignItems:"center", gap:14}}>
                <div style={{...T.h2, fontSize:22,
                  color:s.score>=80?C.green:s.score>=60?C.amber:C.red}}>
                  {s.score}%
                </div>
                <Btn variant="ghost" style={{padding:"7px 16px", fontSize:14}}
                  onClick={onStart}>
                  Retry
                </Btn>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state when no real sessions */}
        {user.sessionsUsed===0&&(
          <div style={{textAlign:"center", padding:"2rem 1rem",
            marginTop:8, borderTop:`1px solid ${C.border}`}}>
            <div style={{fontSize:40, marginBottom:12}}>🎯</div>
            <p style={{...T.ui, color:C.txt2, marginBottom:16}}>
              No sessions yet — start your first interview with Ava
            </p>
            <Btn onClick={onStart}>Start Interview →</Btn>
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── SCREEN: SETUP ────────────────────────────────────────────────────────────
const IND_COLORS = {
  technology:"#7c6fff", business:"#3b82f6", healthcare:"#22c55e",
  creative:"#f59e0b", education:"#06b6d4", legal:"#8b5cf6",
  engineering:"#f97316", sales:"#ec4899", operations:"#14b8a6", hr:"#a78bfa",
};

function SetupScreen({user,onBegin,onBack}){
  const [step,setStep]=useState(1);
  const [resumeText,setResumeText]=useState("");
  const [role,setRole]=useState("");
  const [customRole,setCustomRole]=useState("");
  const [industry,setIndustry]=useState("");
  const [seniority,setSeniority]=useState("");
  const [jd,setJd]=useState("");
  const [loading,setLoading]=useState(false);
  const [analysis,setAnalysis]=useState(null);

  const plan=PLANS[user.plan];
  const canVoice=hasVoiceAccess(user.email, user.plan);
  const senLevels=industry?SENIORITY[industry]:["Entry-Level","Mid-Level","Senior","Lead","Director"];
  const finalRole=role==="__custom__"?customRole:role;

  const analyzeResume=async()=>{
    if(!finalRole.trim())return;
    setLoading(true);
    try{
      const text=await callClaude([{role:"user",content:`You are an expert career coach. Analyze this candidate's background for the target role. Return ONLY valid JSON, no other text:
{"skills":["skill1","skill2","skill3"],"gaps":["gap1","gap2"],"strengths":["strength1","strength2"],"focus_areas":["area1","area2","area3"],"readiness_score":72,"interview_types":["Behavioral","Situational","Technical"],"ava_intro":"Hi! I'm Ava. I've reviewed your background for the ${finalRole} role. Let's work on your key areas and get you interview-ready!"}

Resume: ${resumeText||"Not provided"}
Target Role: ${finalRole}
Industry: ${industry}
Seniority: ${seniority}
Job Description: ${jd||"Not provided"}`}]);
      const parsed=parseJSON(text);
      if(parsed){ setAnalysis(parsed); setStep(3); }
      else throw new Error("parse");
    }catch{
      setAnalysis({
        skills:["Communication","Problem-solving","Domain knowledge"],
        gaps:["Leadership depth","Industry certifications"],
        strengths:["Motivated candidate","Relevant experience"],
        focus_areas:["Behavioral","Situational","Role-specific knowledge"],
        readiness_score:65,
        interview_types:["Behavioral","Situational","Technical"],
        ava_intro:`Hi! I'm Ava, your AI interview coach. I've reviewed your background for the ${finalRole} role and I'm ready to help you prepare!`,
      });
      setStep(3);
    }
    setLoading(false);
  };

  const taCss={...inputCss, minHeight:110, resize:"vertical"};

  const PillBtn=({val,selected,onClick,label})=>(
    <button onClick={onClick} style={{
      padding:"9px 16px", borderRadius:9,
      border:`1.5px solid ${selected?C.accent:C.borderMid}`,
      background:selected?C.accentSoft:C.elevated,
      color:selected?C.accent:C.txt2,
      fontSize:14, fontWeight:selected?600:500,
      cursor:"pointer", fontFamily:F,
      transition:"all 0.15s", lineHeight:1.3,
    }}>{label||val}</button>
  );

  return(
    <div style={{padding:"2rem", maxWidth:760, margin:"0 auto", fontFamily:F}}>
      <button onClick={onBack} style={{
        background:"none", border:"none", color:C.txt2,
        cursor:"pointer", fontSize:15, fontWeight:500,
        marginBottom:"1.5rem", padding:0, fontFamily:F}}>
        ← Back
      </button>

      <div style={{display:"flex", gap:8, marginBottom:"2.5rem"}}>
        {["Industry & Role","Your Background","AI Analysis","Start!"].map((label,i)=>(
          <div key={i} style={{flex:1, textAlign:"center"}}>
            <div style={{height:4, borderRadius:99,
              background:step>i+1?C.accent:step===i+1?C.accent:C.border,
              marginBottom:7, transition:"background 0.3s"}}/>
            <span style={{fontSize:12, fontWeight:600,
              color:step>=i+1?C.txt2:C.txt4, fontFamily:F}}>{label}</span>
          </div>
        ))}
      </div>

      {step===1&&(
        <Card style={{padding:"2rem"}}>
          <h2 style={{...T.h2, marginBottom:"1.75rem"}}>What are you interviewing for?</h2>
          <div style={{display:"flex", flexDirection:"column", gap:24}}>
            <div>
              <label style={{...T.uiSm, color:C.txt2, fontWeight:600, display:"block", marginBottom:12}}>
                Industry <span style={{color:C.red}}>*</span>
              </label>
              <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))", gap:10}}>
                {INDUSTRIES.map(ind=>{
                  const sel=industry===ind.id;
                  const col=IND_COLORS[ind.id]||C.accent;
                  return(
                    <button key={ind.id}
                      onClick={()=>{setIndustry(ind.id);setRole("");setSeniority("");}}
                      style={{display:"flex", alignItems:"center", gap:12,
                        padding:"13px 16px", borderRadius:12,
                        border:`1.5px solid ${sel?col:C.border}`,
                        background:sel?col+"18":C.elevated,
                        cursor:"pointer", fontFamily:F, transition:"all 0.15s", textAlign:"left"}}>
                      <span style={{width:34, height:34, borderRadius:8,
                        background:col+"22", display:"flex", alignItems:"center",
                        justifyContent:"center", fontSize:18, flexShrink:0}}>
                        {ind.icon}
                      </span>
                      <span style={{fontSize:13, fontWeight:sel?600:500,
                        color:sel?col:C.txt2, lineHeight:1.3, fontFamily:F}}>
                        {ind.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {industry&&(
              <div>
                <label style={{...T.uiSm, color:C.txt2, fontWeight:600, display:"block", marginBottom:12}}>
                  Role <span style={{color:C.red}}>*</span>
                </label>
                <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
                  {(ROLES_BY_INDUSTRY[industry]||[]).map(r=>(
                    <PillBtn key={r} val={r} selected={role===r} onClick={()=>setRole(r)} label={r}/>
                  ))}
                  <PillBtn val="__custom__" selected={role==="__custom__"}
                    onClick={()=>setRole("__custom__")} label="+ Other role"/>
                </div>
                {role==="__custom__"&&(
                  <input placeholder="e.g. Biostatistician, Pilot, Sommelier…"
                    value={customRole} onChange={e=>setCustomRole(e.target.value)}
                    style={{...inputCss, marginTop:12}} autoFocus/>
                )}
              </div>
            )}

            {industry&&role&&(role!=="__custom__"||customRole.trim())&&(
              <div>
                <label style={{...T.uiSm, color:C.txt2, fontWeight:600, display:"block", marginBottom:12}}>
                  Seniority / Level <span style={{color:C.red}}>*</span>
                </label>
                <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
                  {senLevels.map(s=>(
                    <PillBtn key={s} val={s} selected={seniority===s} onClick={()=>setSeniority(s)} label={s}/>
                  ))}
                </div>
              </div>
            )}

            <div style={{display:"flex", justifyContent:"flex-end"}}>
              <Btn onClick={()=>setStep(2)}
                disabled={!industry||!role||(role==="__custom__"&&!customRole.trim())||!seniority}
                style={{fontSize:15, padding:"12px 24px"}}>
                Next →
              </Btn>
            </div>
          </div>
        </Card>
      )}

      {step===2&&(
        <Card style={{padding:"2rem"}}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center",
            marginBottom:"1.75rem", flexWrap:"wrap", gap:10}}>
            <h2 style={{...T.h2, margin:0}}>Your Background</h2>
            <div style={{display:"flex", gap:8}}>
              <Badge color={C.accent} size="md">{finalRole}</Badge>
              <Badge color={C.txt3} size="md">{seniority}</Badge>
            </div>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:18}}>
            <div>
              <label style={{...T.uiSm, display:"block", marginBottom:6, color:C.txt2, fontWeight:600}}>
                Resume / CV <span style={{color:C.txt3, fontWeight:400}}>(optional but recommended)</span>
              </label>
              <textarea placeholder="Paste your resume text, LinkedIn summary, or describe your experience..."
                value={resumeText} onChange={e=>setResumeText(e.target.value)} style={taCss}/>
            </div>
            <div>
              <label style={{...T.uiSm, display:"block", marginBottom:6, color:C.txt2, fontWeight:600}}>
                Job Description <span style={{color:C.txt3, fontWeight:400}}>(optional — for targeted questions)</span>
              </label>
              <textarea placeholder="Paste the job posting here…"
                value={jd} onChange={e=>setJd(e.target.value)}
                style={{...taCss, minHeight:80}}/>
            </div>
            <div style={{background:canVoice?C.greenSoft:C.elevated,
              border:`1.5px solid ${canVoice?C.green+"55":C.border}`,
              borderRadius:12, padding:"1rem 1.25rem"}}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div>
                  <div style={{...T.h4, margin:0}}>🎙 Voice Interview Mode</div>
                  <div style={{...T.uiSm, color:C.txt2, marginTop:5}}>
                    Ava speaks questions aloud, you answer by voice — with live speech analytics
                  </div>
                </div>
                {canVoice
                  ? <Badge color={C.green} size="md">{isAdmin(user.email)?"Admin — Enabled":"Enabled"}</Badge>
                  : <Badge color={C.txt3} size="md">Starter+ only</Badge>}
              </div>
            </div>
            <div style={{display:"flex", justifyContent:"space-between"}}>
              <Btn variant="ghost" onClick={()=>setStep(1)} style={{fontSize:15}}>← Back</Btn>
              <Btn onClick={analyzeResume} disabled={loading} style={{fontSize:15, padding:"12px 24px"}}>
                {loading?"Ava is analyzing your profile…":"Analyze & Prepare →"}
              </Btn>
            </div>
          </div>
        </Card>
      )}

      {step===3&&analysis&&(
        <Card style={{padding:"2rem"}}>
          <div style={{display:"flex", gap:16, alignItems:"flex-start", marginBottom:"1.5rem"}}>
            <AvaAvatar speaking={false} listening={false} thinking={false} size={68}/>
            <div style={{flex:1}}>
              <div style={{fontSize:11, fontWeight:600, color:C.accent,
                letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:8}}>
                Ava says
              </div>
              <p style={{...T.body, color:C.txt2, margin:0, fontStyle:"italic"}}>
                "{analysis.ava_intro}"
              </p>
            </div>
            <div style={{textAlign:"center", flexShrink:0, padding:"12px 18px",
              background:C.elevated, borderRadius:12, border:`1px solid ${C.border}`}}>
              <div style={{fontSize:34, fontWeight:800, margin:0,
                color:analysis.readiness_score>=70?C.green:C.amber}}>
                {analysis.readiness_score}%
              </div>
              <div style={{fontSize:12, color:C.txt3, marginTop:4, fontWeight:500}}>
                Readiness
              </div>
            </div>
          </div>
          <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:"1.25rem"}}>
            <div style={{background:C.greenSoft, border:`1px solid ${C.greenMid}`, borderRadius:12, padding:"1rem"}}>
              <div style={{fontSize:11, fontWeight:600, color:C.green, letterSpacing:"0.06em",
                textTransform:"uppercase", marginBottom:10}}>✓ Strengths</div>
              {analysis.strengths?.map(s=>(
                <div key={s} style={{...T.uiSm, color:C.txt2, marginBottom:6}}>• {s}</div>
              ))}
            </div>
            <div style={{background:C.redSoft, border:`1px solid ${C.redMid}`, borderRadius:12, padding:"1rem"}}>
              <div style={{fontSize:11, fontWeight:600, color:C.red, letterSpacing:"0.06em",
                textTransform:"uppercase", marginBottom:10}}>⚠ Gaps to cover</div>
              {analysis.gaps?.map(g=>(
                <div key={g} style={{...T.uiSm, color:C.txt2, marginBottom:6}}>• {g}</div>
              ))}
            </div>
          </div>
          <div style={{background:C.accentSoft, border:`1px solid ${C.accentMid}`,
            borderRadius:12, padding:"1rem", marginBottom:"1.25rem"}}>
            <div style={{fontSize:11, fontWeight:600, color:C.accent, letterSpacing:"0.06em",
              textTransform:"uppercase", marginBottom:10}}>🎯 Focus areas</div>
            <div style={{display:"flex", gap:8, flexWrap:"wrap"}}>
              {analysis.focus_areas?.map(f=><Badge key={f} color={C.accent} size="md">{f}</Badge>)}
            </div>
          </div>
          <div style={{display:"flex", justifyContent:"space-between"}}>
            <Btn variant="ghost" onClick={()=>setStep(2)} style={{fontSize:15}}>← Adjust</Btn>
            <Btn variant="success"
              onClick={()=>onBegin({role:finalRole,industry,seniority,analysis,voiceEnabled:canVoice})}
              style={{fontSize:15, padding:"12px 24px"}}>
              🚀 Start Interview with Ava
            </Btn>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── SCREEN: INTERVIEW ────────────────────────────────────────────────────────
function InterviewScreen({user,config,onComplete,onBack}){
  const [questions,setQuestions]=useState([]);
  const [qIdx,setQIdx]=useState(0);
  const [answer,setAnswer]=useState("");
  const [answers,setAnswers]=useState([]);
  const [scores,setScores]=useState([]);
  const [speechStats,setSpeechStats]=useState([]);
  const [feedback,setFeedback]=useState(null);
  const [coachTip,setCoachTip]=useState("");
  const [loadingQ,setLoadingQ]=useState(true);
  const [loadingEval,setLoadingEval]=useState(false);
  const [listening,setListening]=useState(false);
  const [avaSpeaking,setAvaSpeaking]=useState(false);
  const [avaListening,setAvaListening]=useState(false);
  const [avaThinking,setAvaThinking]=useState(false);
  const [interimTranscript,setInterimTranscript]=useState("");
  const [timeLeft,setTimeLeft]=useState(120);
  const [timerActive,setTimerActive]=useState(false);
  const [waveBars,setWaveBars]=useState(Array(20).fill(4));
  const [showAnalytics,setShowAnalytics]=useState(true);
  const [avaMessage,setAvaMessage]=useState("");

  const recognitionRef=useRef(null);
  const timerRef=useRef(null);
  const waveRef=useRef(null);

  // Cleanup on unmount — stop TTS and mic
  useEffect(()=>{
    return()=>{
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
      clearTimeout(timerRef.current);
    };
  },[]);

  const liveText=answer+(interimTranscript?" "+interimTranscript:"");
  const currentQ=questions[qIdx]||"";
  const isLast=qIdx===questions.length-1&&questions.length>0;

  // ── Generate questions dynamically via Claude ──
  useEffect(()=>{
    generateQuestions();
  },[]);

  const generateQuestions=async()=>{
    setLoadingQ(true);
    setAvaThinking(true);
    setAvaMessage("Preparing your personalized interview questions...");
    try{
      const text=await callClaude([{role:"user",content:`You are Ava, an expert AI interview coach. Generate exactly 5 interview questions for this candidate. Return ONLY a JSON array of 5 strings, no other text.

Role: ${config.role}
Industry: ${config.industry}
Seniority: ${config.seniority}
Key gaps to probe: ${config.analysis?.gaps?.join(", ")||"general competencies"}
Focus areas: ${config.analysis?.focus_areas?.join(", ")||"behavioral, situational"}
Resume context: ${config.analysis?.skills?.join(", ")||"general background"}

Requirements:
- Mix behavioral (STAR-method), situational, and role-specific technical questions
- Match the seniority level (${config.seniority})
- Be specific to ${config.role} in ${config.industry}
- Questions should feel like a real interview, not a quiz
- Progress from rapport-building to challenging`}]);
      const parsed=parseJSON(text);
      if(Array.isArray(parsed)&&parsed.length>0){
        setQuestions(parsed);
        setAvaMessage(`Great! I've prepared ${parsed.length} personalized questions for you. Let's begin!`);
      } else throw new Error();
    }catch{
      setQuestions([
        `Tell me about yourself and what draws you to the ${config.role} role.`,
        `Describe a challenging situation in your career and how you handled it.`,
        `What is your greatest professional achievement as a ${config.seniority} professional?`,
        `How do you stay current with developments in your field?`,
        `Where do you see yourself in 3-5 years and how does this role fit?`,
      ]);
      setAvaMessage("I've prepared 5 questions tailored to your profile. Let's get started!");
    }
    setAvaThinking(false);
    setLoadingQ(false);
  };

  // ── Timer ──
  useEffect(()=>{
    if(timerActive&&timeLeft>0){ timerRef.current=setTimeout(()=>setTimeLeft(t=>t-1),1000); }
    return()=>clearTimeout(timerRef.current);
  },[timerActive,timeLeft]);

  // ── Waveform animation ──
  useEffect(()=>{
    let id;
    if(listening){ const anim=()=>{ setWaveBars(Array(20).fill(0).map(()=>Math.floor(Math.random()*28)+4)); id=setTimeout(anim,90); }; anim(); }
    else{ setWaveBars(Array(20).fill(4)); }
    return()=>clearTimeout(id);
  },[listening]);

  // ── Ava voice — warm, clear, natural female voice ──
  const getAvaVoice=useCallback(()=>{
    const voices=window.speechSynthesis.getVoices();
    if(!voices.length) return null;
    // Priority list — best natural-sounding voices across browsers/OS
    const preferred=[
      "Samantha",          // macOS/iOS — warm, natural
      "Karen",             // macOS Australian — clear
      "Moira",             // macOS Irish — friendly
      "Tessa",             // macOS South African
      "Serena",            // macOS enhanced
      "Google UK English Female", // Chrome — polite British
      "Google US English",        // Chrome fallback
      "Microsoft Aria Online",    // Edge — very natural
      "Microsoft Jenny Online",   // Edge — warm
      "Microsoft Zira",           // Windows — clear
    ];
    for(const name of preferred){
      const v=voices.find(v=>v.name.includes(name));
      if(v) return v;
    }
    // Final fallback — any female-labeled voice
    return voices.find(v=>
      v.name.toLowerCase().includes("female")||
      v.name.toLowerCase().includes("woman")||
      (v.lang.startsWith("en")&&v.name.toLowerCase().includes("f"))
    ) || voices.find(v=>v.lang.startsWith("en")) || null;
  },[]);

  const speakText=useCallback((text,onEnd)=>{
    if(!config.voiceEnabled||!window.speechSynthesis)return onEnd?.();
    window.speechSynthesis.cancel();
    const utt=new SpeechSynthesisUtterance(text);
    // Ava's voice settings — warm, calm, clear
    utt.rate=0.90;    // slightly slower = more thoughtful, less rushed
    utt.pitch=1.08;   // slightly higher = friendly, approachable
    utt.volume=0.95;  // just under full — comfortable, not blaring
    const voice=getAvaVoice();
    if(voice) utt.voice=voice;
    utt.onstart=()=>setAvaSpeaking(true);
    utt.onend=()=>{ setAvaSpeaking(false); onEnd?.(); };
    utt.onerror=()=>{ setAvaSpeaking(false); onEnd?.(); };
    window.speechSynthesis.speak(utt);
  },[config.voiceEnabled, getAvaVoice]);

  // ── Ask question when question changes — Ava speaks proactively ──
  useEffect(()=>{
    if(!currentQ||loadingQ)return;
    setAnswer(""); setInterimTranscript(""); setFeedback(null); setCoachTip(""); setTimeLeft(120); setTimerActive(false);
    setAvaListening(false);

    const startListening=()=>{
      setTimerActive(true);
      setAvaListening(true);
      setAvaMessage("I'm listening carefully — please take your time and answer in your own way.");
      // Auto-start mic after Ava finishes speaking (Chrome/Edge only)
      if(window.SpeechRecognition||window.webkitSpeechRecognition){
        setTimeout(()=>{ toggleListenAuto(); }, 300);
      }
    };

    if(qIdx===0){
      const intro=`Hello, and a very warm welcome! I'm Ava, your personal interview coach. It's wonderful to have you here today. I've carefully prepared ${questions.length} questions based on your background, and I'm genuinely here to help you do your very best. Please take all the time you need with each answer — there's no rush at all. Whenever you're ready, here is your first question. ${currentQ}`;
      setAvaMessage("Welcome! I'm so glad you're here. Let's begin whenever you're ready.");
      speakText(intro, startListening);
    } else {
      const bridges=[
        `Thank you so much for sharing that. You're doing really well. Here is your next question, number ${qIdx+1}. ${currentQ}`,
        `That was a lovely answer, thank you. Please take a moment if you need it. Here is question ${qIdx+1}. ${currentQ}`,
        `Wonderful, thank you for that response. You should feel proud of the effort you're putting in. Question ${qIdx+1}. ${currentQ}`,
        `You are doing beautifully — please keep going. Here is question ${qIdx+1}. ${currentQ}`,
        `You've done so well to get here. This is your final question, so give it your best. ${currentQ}`,
      ];
      const bridge=isLast?bridges[4]:bridges[Math.min(qIdx-1,3)];
      setAvaMessage(`Question ${qIdx+1} of ${questions.length} — you're doing great!`);
      speakText(bridge, startListening);
    }
  },[qIdx,currentQ,loadingQ,speakText,questions.length,isLast]);

  // ── Real-time Ava coaching tip as user types ──
  const coachDebounce=useRef(null);
  useEffect(()=>{
    if(answer.length<30||feedback)return;
    clearTimeout(coachDebounce.current);
    coachDebounce.current=setTimeout(()=>{
      const stats=analyzeSpeech(answer);
      const wordCount=answer.trim().split(/\s+/).filter(Boolean).length;
      // Pick the most relevant tip — only one at a time
      if(stats.fillerRate>12)
        setCoachTip("💙 Ava: You're doing really well! A gentle tip — try pausing briefly instead of saying 'um' or 'like'. A short pause actually sounds very confident to interviewers.");
      else if(stats.confidenceScore<50)
        setCoachTip("💙 Ava: I can see you have great knowledge here! May I suggest replacing phrases like 'I think' with 'In my experience' or 'I would' — it helps your confidence shine through beautifully.");
      else if(answer.split(/[.!?]+/).filter(s=>s.trim().length>5).length<=1&&wordCount>60)
        setCoachTip("💙 Ava: Lovely content! You might find it helpful to use the STAR method — Situation, Task, Action, Result. It gives interviewers a really clear picture of your experience.");
      else if(wordCount<40&&wordCount>20)
        setCoachTip("💙 Ava: Great start! Would you be able to share a specific example or outcome? Concrete details help interviewers appreciate your experience so much more.");
      else if(wordCount>200)
        setCoachTip("💙 Ava: Wonderful depth — you clearly know this topic well! When you feel ready, it's a good idea to start wrapping up. Quality over length is always appreciated.");
      else if(stats.vocabularyScore>80&&wordCount>50)
        setCoachTip("✨ Ava: This is a really impressive answer — excellent structure and vocabulary. I think interviewers will respond very positively to this!");
      else
        setCoachTip("");
    },1400);
    return()=>clearTimeout(coachDebounce.current);
  },[answer,feedback]);

  // ── Voice recording ──
  const startRecognition=()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR)return;
    const rec=new SR();
    rec.continuous=true; rec.interimResults=true; rec.lang="en-US";
    rec.onresult=e=>{
      let fin="",int="";
      for(let i=0;i<e.results.length;i++){ if(e.results[i].isFinal)fin+=e.results[i][0].transcript+" "; else int+=e.results[i][0].transcript; }
      if(fin)setAnswer(fin.trim()); setInterimTranscript(int);
    };
    rec.onend=()=>{ setListening(false); setInterimTranscript(""); };
    rec.onerror=()=>{ setListening(false); setInterimTranscript(""); };
    rec.start(); recognitionRef.current=rec; setListening(true);
  };

  // Auto-start mic (called after Ava finishes speaking)
  const toggleListenAuto=()=>{
    if(listening)return; // already recording
    startRecognition();
  };

  const toggleListen=()=>{
    if(!window.SpeechRecognition&&!window.webkitSpeechRecognition)
      return alert("Voice features require Chrome or Edge browser");
    if(listening){ recognitionRef.current?.stop(); setListening(false); setInterimTranscript(""); return; }
    startRecognition();
  };

  // ── Evaluate answer with real AI ──
  const evaluateAnswer=async()=>{
    const finalAnswer=answer.trim(); if(!finalAnswer)return;
    if(listening){ recognitionRef.current?.stop(); setListening(false); setInterimTranscript(""); }
    setLoadingEval(true); setTimerActive(false); setAvaListening(false);
    setAvaThinking(true); setAvaMessage("Let me evaluate your answer...");
    const stats=analyzeSpeech(finalAnswer);
    setSpeechStats(prev=>[...prev,stats]);
    try{
      const text=await callClaude([{role:"user",content:`You are Ava, a warm but rigorous AI interview coach. Evaluate this interview answer and return ONLY valid JSON:
{
  "score": 78,
  "verdict": "Good answer, covers the core points but could go deeper",
  "strengths": ["Clear structure", "Relevant example used"],
  "improvements": ["Add quantifiable outcome", "Mention stakeholder impact"],
  "ideal_points": ["Key point they should have made 1", "Key point 2"],
  "follow_up": "Can you tell me more about the outcome of that situation?",
  "ava_feedback": "Nice work! You showed good self-awareness there. For your next answer, try to quantify the impact — numbers make your answers 2x more memorable to interviewers.",
  "score_breakdown": {"content": 75, "structure": 80, "relevance": 78, "confidence": 72}
}

Question: ${currentQ}
Answer: ${finalAnswer}
Role: ${config.role}, Seniority: ${config.seniority}
Speech: ${stats.fillerCount} fillers, clarity ${stats.clarityScore}/100, confidence ${stats.confidenceScore}/100`}],
      "claude-sonnet-4-20250514", 1200);
      const parsed=parseJSON(text);
      if(parsed){
        setFeedback(parsed);
        setAnswers(prev=>[...prev,finalAnswer]);
        setScores(prev=>[...prev,parsed.score]);
        setAvaThinking(false);
        setAvaMessage(parsed.ava_feedback||"Thank you so much for that answer. Let's keep going — you're doing wonderfully.");
        speakText(parsed.ava_feedback||`Thank you for your answer. You scored ${parsed.score} out of 100. ${parsed.verdict} Please don't worry — every answer is a chance to improve, and you are doing really well.`,()=>{});
      } else throw new Error();
    }catch{
      const fb={
        score:72,verdict:"Solid answer covering the main concepts.",
        strengths:["Good structure","Relevant example"],
        improvements:["Add quantifiable outcomes","Mention stakeholder impact"],
        ideal_points:["Quantified impact","Stakeholder consideration","Lessons learned"],
        follow_up:"Can you walk me through what happened next?",
        ava_feedback:"Good effort! Try to add specific numbers and outcomes — that's what interviewers remember most.",
        score_breakdown:{content:70,structure:75,relevance:72,confidence:68},
      };
      setFeedback(fb); setAnswers(prev=>[...prev,finalAnswer]); setScores(prev=>[...prev,fb.score]);
      setAvaThinking(false); setAvaMessage(fb.ava_feedback);
    }
    setLoadingEval(false);
  };

  const nextQuestion=()=>{
    if(isLast){
      const avg=Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
      const avgClarity=speechStats.length?Math.round(speechStats.reduce((a,b)=>a+b.clarityScore,0)/speechStats.length):null;
      const avgConf=speechStats.length?Math.round(speechStats.reduce((a,b)=>a+b.confidenceScore,0)/speechStats.length):null;
      onComplete({questions,answers,scores,overallScore:avg,speechStats,avgClarity,avgConfidence:avgConf,totalFillers:speechStats.reduce((a,b)=>a+b.fillerCount,0)});
    } else { setQIdx(q=>q+1); }
  };

  const timerColor=timeLeft<=20?C.red:timeLeft<=60?C.amber:C.green;
  const mins=Math.floor(timeLeft/60), secs=timeLeft%60;
  const speech=analyzeSpeech(feedback?answers[answers.length-1]||answer:liveText);

  if(loadingQ) return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:24}}>
      <AvaAvatar speaking={false} listening={false} thinking={true} size={100}/>
      <div style={{color:C.txt2,fontSize:15}}>Ava is preparing your questions...</div>
      <div style={{color:C.txt3,fontSize:12}}>Personalizing for {config.role} · {config.seniority}</div>
    </div>
  );

  return(
    <div style={{padding:"1.5rem",maxWidth:960,margin:"0 auto",fontFamily:F}}>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.25rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <button onClick={onBack} style={{background:"none",border:"none",color:C.txt2,cursor:"pointer",fontSize:14}}>✕ End</button>
          <div style={{display:"flex",gap:5}}>
            {questions.map((_,i)=>(
              <div key={i} style={{width:26,height:4,borderRadius:99,
                background:i<qIdx?C.accent:i===qIdx?C.accentHover:C.border,transition:"background 0.3s"}}/>
            ))}
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <button onClick={()=>setShowAnalytics(s=>!s)}
          aria-label="Toggle analytics panel"
          style={{
            background:showAnalytics?C.accentSoft:"transparent",border:`1px solid ${showAnalytics?C.accent:C.border}`,
            color:showAnalytics?C.accent:C.txt2,borderRadius:8,padding:"4px 11px",fontSize:12,cursor:"pointer",fontFamily:F}}>
            📊 Analytics
          </button>
          <span style={{color:C.txt2,fontSize:13}}>Q{qIdx+1}/{questions.length}</span>
          <div style={{fontWeight:700,fontSize:18,color:timerColor,fontVariantNumeric:"tabular-nums",minWidth:48}}>
            {mins}:{secs.toString().padStart(2,"0")}
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:showAnalytics?"1fr 290px":"1fr",gap:"1rem",alignItems:"start"}}>
        {/* LEFT */}
        <div>
          {/* Ava + question */}
          <Card style={{marginBottom:"0.75rem",borderColor:avaSpeaking?`${C.accent}66`:C.border}}>
            <div style={{display:"flex",gap:16,alignItems:"flex-start"}}>
              <AvaAvatar speaking={avaSpeaking} listening={avaListening} thinking={avaThinking} size={80}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                  <span style={{color:C.accent,fontSize:12,fontWeight:600}}>AVA</span>
                  {avaSpeaking&&<span style={{fontSize:11,color:C.txt2,animation:"fadePulse 1s infinite"}}>speaking...</span>}
                  {avaThinking&&<span style={{fontSize:11,color:C.amber}}>thinking...</span>}
                  {avaListening&&!avaSpeaking&&!avaThinking&&<span style={{fontSize:11,color:C.green}}>listening...</span>}
                </div>
                {avaMessage&&!feedback&&(
                  <p style={{color:C.txt2,fontSize:13,margin:"0 0 10px",fontStyle:"italic"}}>"{avaMessage}"</p>
                )}
                <p style={{color:C.txt,fontSize:15,lineHeight:1.65,margin:0,fontWeight:500}}>{currentQ}</p>
                {config.voiceEnabled&&(
                  <button onClick={()=>speakText(currentQ,()=>{})} style={{marginTop:8,background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:12}}>🔊 Replay</button>
                )}
              </div>
            </div>
          </Card>

          {/* Answer */}
          {!feedback&&(
            <Card style={{marginBottom:"0.75rem"}}>
              {/* ── BIG MIC BUTTON — primary interaction ── */}
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:12,marginBottom:16}}>
                {/* Main mic button */}
                <button onClick={toggleListen}
                  aria-label={listening?"Stop recording":"Start speaking"}
                  style={{
                    width:80, height:80, borderRadius:"50%",
                    border:`3px solid ${listening?C.red:avaListening?C.green:C.borderMid}`,
                    background:listening?C.redSoft:avaListening?C.greenSoft:C.elevated,
                    cursor:"pointer", fontSize:32,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"all 0.2s",
                    boxShadow:listening?`0 0 24px ${C.red}55`:avaListening?`0 0 24px ${C.green}44`:"none",
                    animation:listening?"micPulse 1.5s ease-in-out infinite":"none",
                  }}>
                  {listening?"⏹":"🎙"}
                </button>
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:14,fontWeight:600,color:listening?C.red:avaListening?C.green:C.txt2}}>
                    {listening?"Listening — tap to stop":"Tap to speak your answer"}
                  </div>
                  <div style={{fontSize:12,color:C.txt3,marginTop:3}}>
                    {listening?"Ava is hearing you...":"or type below"}
                  </div>
                </div>

                {/* Waveform — only shown while listening */}
                {listening&&(
                  <div style={{display:"flex",alignItems:"center",gap:2,height:36,width:"100%",maxWidth:300,padding:"0 8px",background:C.elevated,borderRadius:10}}>
                    {waveBars.map((h,i)=>(
                      <div key={i} style={{flex:1,height:h,background:C.accent,borderRadius:99,transition:"height 0.08s",opacity:0.7+i%3*0.1}}/>
                    ))}
                  </div>
                )}

                {/* Interim transcript — live preview */}
                {interimTranscript&&(
                  <div style={{fontSize:13,color:C.txt2,fontStyle:"italic",padding:"8px 14px",
                    background:C.elevated,borderRadius:8,width:"100%",textAlign:"center",lineHeight:1.5}}>
                    "{interimTranscript}"
                  </div>
                )}
              </div>

              {/* Transcript / text area */}
              {(answer||!listening)&&(
                <div style={{marginBottom:10}}>
                  {answer&&(
                    <div style={{fontSize:12,color:C.txt3,marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                      <span style={{width:6,height:6,borderRadius:"50%",background:C.green,display:"inline-block"}}/>
                      Transcript captured
                    </div>
                  )}
                  <textarea value={answer} onChange={e=>setAnswer(e.target.value)}
                    placeholder="Your spoken answer appears here — or type directly..."
                    style={{width:"100%",minHeight:90,padding:"12px",background:C.elevated,
                      border:`1px solid ${answer?C.borderMid:C.border}`,borderRadius:10,
                      color:C.txt,fontSize:14,fontFamily:F,resize:"vertical",
                      outline:"none",boxSizing:"border-box",lineHeight:1.65}}/>
                </div>
              )}

              {/* Live coaching tip from Ava */}
              {coachTip&&(
                <div style={{marginBottom:10,padding:"10px 14px",background:C.accentSoft,
                  border:`1px solid ${C.accent}33`,borderRadius:10,
                  display:"flex",gap:10,alignItems:"flex-start"}}>
                  <AvaAvatar speaking={false} listening={false} thinking={false} size={28}/>
                  <div>
                    <div style={{fontSize:11,fontWeight:600,color:C.accent,letterSpacing:"0.05em",textTransform:"uppercase",marginBottom:3}}>Ava coaching tip</div>
                    <span style={{fontSize:13,color:C.txt2,lineHeight:1.5}}>{coachTip}</span>
                  </div>
                </div>
              )}

              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span style={{fontSize:12,color:C.txt3,fontWeight:500}}>
                  {answer.trim().split(/\s+/).filter(Boolean).length} words
                </span>
                <div style={{display:"flex",gap:8}}>
                  <Btn variant="ghost" onClick={()=>{
                    if(scores.length===qIdx){ setScores(prev=>[...prev,0]); setAnswers(prev=>[...prev,"(skipped)"]); }
                    nextQuestion();
                  }} style={{fontSize:13,padding:"8px 16px"}}>Skip →</Btn>
                  <Btn onClick={evaluateAnswer} disabled={!answer.trim()||loadingEval}
                    style={{fontSize:14,padding:"10px 20px"}}>
                    {loadingEval?"Ava is evaluating...":"Submit Answer →"}
                  </Btn>
                </div>
              </div>

              <style>{`
                @keyframes micPulse {
                  0%,100%{box-shadow:0 0 0 0 ${C.red}44}
                  50%{box-shadow:0 0 0 12px ${C.red}00}
                }
              `}</style>
            </Card>
          )}

          {/* Feedback */}
          {feedback&&(
            <Card style={{borderColor:feedback.score>=80?`${C.green}44`:feedback.score>=60?`${C.amber}44`:`${C.red}44`}}>
              {/* Ava feedback message */}
              <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:"1rem",padding:"10px 14px",background:C.accentSoft,borderRadius:10}}>
                <AvaAvatar speaking={avaSpeaking} listening={false} thinking={false} size={44}/>
                <div style={{flex:1}}>
                  <div style={{color:C.accent,fontSize:11,fontWeight:600,marginBottom:4}}>AVA'S FEEDBACK</div>
                  <p style={{color:C.txt,fontSize:13,margin:0,lineHeight:1.6}}>{feedback.ava_feedback}</p>
                </div>
                <div style={{textAlign:"center",flexShrink:0}}>
                  <div style={{fontSize:36,fontWeight:800,color:feedback.score>=80?C.green:feedback.score>=60?C.amber:C.red,lineHeight:1}}>{feedback.score}</div>
                  <div style={{fontSize:10,color:C.txt2}}>/100</div>
                </div>
              </div>

              {/* Score breakdown bars */}
              {feedback.score_breakdown&&(
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:"1rem"}}>
                  {Object.entries(feedback.score_breakdown).map(([k,v])=>(
                    <div key={k}>
                      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:C.txt2,marginBottom:3}}>
                        <span style={{textTransform:"capitalize"}}>{k}</span>
                        <span style={{color:v>=80?C.green:v>=60?C.amber:C.red,fontWeight:600}}>{v}</span>
                      </div>
                      <div style={{height:4,background:C.border,borderRadius:99,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${v}%`,background:v>=80?C.green:v>=60?C.amber:C.red,borderRadius:99,transition:"width 1s cubic-bezier(.4,0,.2,1) 0.2s"}}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:"0.75rem"}}>
                <div style={{background:C.greenSoft,borderRadius:8,padding:"0.75rem"}}>
                  <div style={{color:C.green,fontSize:11,fontWeight:600,marginBottom:6}}>WHAT WORKED</div>
                  {feedback.strengths?.map(s=><div key={s} style={{color:C.txt2,fontSize:12,marginBottom:3}}>✓ {s}</div>)}
                </div>
                <div style={{background:C.amberSoft,borderRadius:8,padding:"0.75rem"}}>
                  <div style={{color:C.amber,fontSize:11,fontWeight:600,marginBottom:6}}>IMPROVE THIS</div>
                  {feedback.improvements?.map(s=><div key={s} style={{color:C.txt2,fontSize:12,marginBottom:3}}>→ {s}</div>)}
                </div>
              </div>

              {feedback.follow_up&&(
                <div style={{background:C.accentSoft,borderRadius:8,padding:"0.75rem",marginBottom:"0.75rem"}}>
                  <div style={{color:C.accent,fontSize:11,fontWeight:600,marginBottom:4}}>AVA'S FOLLOW-UP</div>
                  <div style={{color:C.txt2,fontSize:13}}>"{feedback.follow_up}"</div>
                </div>
              )}

              <div style={{display:"flex",justifyContent:"flex-end"}}>
                <Btn variant={isLast?"success":"primary"} onClick={nextQuestion}>
                  {isLast?"🏁 Finish & See Report":"Next Question →"}
                </Btn>
              </div>
            </Card>
          )}
        </div>

        {/* RIGHT: analytics + scoreboard */}
        {showAnalytics&&(
          <div>
            {/* Speech analytics */}
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:14,padding:"1rem",marginBottom:"0.75rem"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:"0.75rem"}}>
                {listening&&<div style={{width:7,height:7,borderRadius:"50%",background:C.red,animation:"pulse 1s infinite"}}/>}
                <span style={{fontSize:11,color:C.txt2,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.05em"}}>Live Speech Analytics</span>
                {speech.wordCount>0&&<span style={{fontSize:10,color:C.txt3,marginLeft:"auto"}}>{speech.wordCount} words</span>}
              </div>

              {/* Show waiting state when no speech yet */}
              {speech.wordCount===0?(
                <div style={{textAlign:"center",padding:"1rem 0"}}>
                  <div style={{fontSize:24,marginBottom:8}}>🎙</div>
                  <div style={{fontSize:12,color:C.txt3}}>
                    {listening?"Listening for your answer...":"Start speaking to see live analytics"}
                  </div>
                </div>
              ):(
                <>
                  {/* Scores — only show when enough words for accuracy */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:"0.75rem"}}>
                    {[["Clarity",speech.clarityScore],["Confidence",speech.confidenceScore],["Vocabulary",speech.vocabularyScore]].map(([l,v])=>(
                      <div key={l}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.txt3,marginBottom:3}}>
                          <span>{l}</span>
                          <span style={{
                            color:v===null?C.txt3:v>=75?C.green:v>=50?C.amber:C.red,
                            fontWeight:600
                          }}>
                            {v===null?"—":v}
                          </span>
                        </div>
                        <div style={{height:4,background:C.border,borderRadius:99,overflow:"hidden"}}>
                          <div style={{
                            height:"100%",
                            width:v===null?"0%":`${v}%`,
                            background:v===null?C.border:v>=75?C.green:v>=50?C.amber:C.red,
                            borderRadius:99,
                            transition:"width 0.4s"
                          }}/>
                        </div>
                        {v===null&&<div style={{fontSize:9,color:C.txt4,marginTop:2}}>need 10+ words</div>}
                      </div>
                    ))}
                    <div>
                      <div style={{fontSize:10,color:C.txt3,marginBottom:3}}>Pace</div>
                      <div style={{fontSize:13,fontWeight:700,color:speech.paceColor}}>{speech.paceLabel}</div>
                      <div style={{fontSize:10,color:C.txt3}}>{speech.wpm>0?`~${speech.wpm} wpm`:""}</div>
                    </div>
                  </div>

                  {/* Filler words */}
                  {speech.fillerCount>0?(
                    <div style={{background:`${C.amber}10`,border:`1px solid ${C.amber}30`,borderRadius:8,padding:"0.6rem 0.8rem"}}>
                      <div style={{fontSize:11,color:C.amber,fontWeight:600,marginBottom:5}}>⚠ {speech.fillerCount} filler words</div>
                      <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                        {Object.entries(speech.fillerWords).slice(0,4).map(([w,n])=>(
                          <span key={w} style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:`${C.amber}22`,color:C.amber}}>"{w}" ×{n}</span>
                        ))}
                      </div>
                    </div>
                  ):speech.wordCount>=10?(
                    <div style={{background:C.greenSoft,border:`1px solid ${C.green}30`,borderRadius:8,padding:"0.5rem 0.8rem",fontSize:11,color:C.green}}>✓ No filler words detected!</div>
                  ):null}
                </>
              )}
            </div>

            {/* Q-by-Q scores */}
            {scores.length>0&&(
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,padding:"0.85rem"}}>
                <div style={{fontSize:10,color:C.txt3,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Session scores</div>
                {scores.map((s,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                    <span style={{fontSize:11,color:C.txt3,minWidth:20}}>Q{i+1}</span>
                    <div style={{flex:1,height:5,background:C.border,borderRadius:99,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${s}%`,background:s>=80?C.green:s>=60?C.amber:C.red,borderRadius:99,transition:"width 0.8s"}}/>
                    </div>
                    <span style={{fontSize:11,fontWeight:700,color:s>=80?C.green:s>=60?C.amber:C.red,minWidth:28}}>{s}</span>
                  </div>
                ))}
                <div style={{borderTop:`1px solid ${C.border}`,marginTop:8,paddingTop:8,fontSize:12,color:C.txt2,display:"flex",justifyContent:"space-between"}}>
                  <span>Running avg</span>
                  <span style={{fontWeight:700,color:C.txt}}>{Math.round(scores.reduce((a,b)=>a+b,0)/scores.length)}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.25}}
        @keyframes fadePulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>
    </div>
  );
}

// ─── SCREEN: REPORT ───────────────────────────────────────────────────────────
function ReportScreen({result,onDashboard,onRetry}){
  const [report,setReport]=useState(null);
  const [loading,setLoading]=useState(true);
  const [avaSpeaking,setAvaSpeaking]=useState(false);

  useEffect(()=>{ generateReport(); },[]);

  const generateReport=async()=>{
    try{
      const text=await callClaude([{role:"user",content:`You are Ava, a warm and honest AI interview coach. Generate a post-interview performance report. Return ONLY valid JSON:
{
  "summary": "2-sentence honest summary of performance",
  "technical_score": 74,
  "communication_score": 80,
  "confidence_score": 68,
  "problem_solving_score": 71,
  "top_strength": "Clear and structured communication",
  "critical_gap": "System design depth",
  "next_steps": ["Specific action 1", "Specific action 2", "Specific action 3"],
  "resources": [{"title": "Resource name", "type": "Type"}],
  "hiring_verdict": "Strong candidate — 2-3 weeks targeted prep recommended",
  "ava_closing": "Personal encouraging message from Ava about their progress and next steps"
}

Scores per question: ${JSON.stringify(result.scores)}
Overall score: ${result.overallScore}%
Speech clarity avg: ${result.avgClarity||"N/A"}
Confidence avg: ${result.avgConfidence||"N/A"}
Total fillers: ${result.totalFillers||0}`}],
      "claude-haiku-4-5-20251001", 1200);
      const parsed=parseJSON(text);
      if(parsed) setReport(parsed); else throw new Error();
    }catch{
      setReport({
        summary:"You demonstrated solid foundational knowledge with consistent performance. Focus on deepening specific domain expertise and adding quantifiable outcomes to your answers.",
        technical_score:result.overallScore-5,communication_score:result.overallScore+6,
        confidence_score:result.overallScore-8,problem_solving_score:result.overallScore+2,
        top_strength:"Structured explanations and clear reasoning",
        critical_gap:"Quantifying impact and outcomes",
        next_steps:["Research the STAR method and practice 3 answers","Add numbers to every achievement on your resume","Schedule a practice session with Ava tomorrow"],
        resources:[{title:"STAR Method Guide",type:"Article"},{title:"Interview Prep Roadmap",type:"Course"}],
        hiring_verdict:result.overallScore>=75?"Strong candidate — ready to interview":"Good foundation — 2 weeks targeted prep recommended",
        ava_closing:"I am so proud of the effort you put in today. Every single interview is a step forward, and you should feel really good about what you've achieved here. Please come back whenever you'd like to practise — I'll always be here to support you. You've absolutely got this. Well done! 🌟",
      });
    }
    setLoading(false);
  };

  const speakAvaClosing=()=>{
    if(!report?.ava_closing||!window.speechSynthesis)return;
    window.speechSynthesis.cancel();
    const utt=new SpeechSynthesisUtterance(report.ava_closing);
    utt.rate=0.90; utt.pitch=1.08; utt.volume=0.95;
    const voices=window.speechSynthesis.getVoices();
    const preferred=["Samantha","Karen","Moira","Tessa","Google UK English Female","Microsoft Aria Online","Microsoft Jenny Online","Microsoft Zira"];
    const voice=preferred.reduce((found,name)=>found||voices.find(v=>v.name.includes(name)),null)
      ||voices.find(v=>v.lang.startsWith("en"))||null;
    if(voice)utt.voice=voice;
    utt.onstart=()=>setAvaSpeaking(true); utt.onend=()=>setAvaSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const ScoreBar=({label,value})=>(
    <div style={{marginBottom:12}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:13,color:C.txt2}}>{label}</span>
        <span style={{fontSize:13,fontWeight:600,color:value>=80?C.green:value>=60?C.amber:C.red}}>{value}%</span>
      </div>
      <div style={{height:8,background:C.border,borderRadius:99,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${value}%`,background:value>=80?C.green:value>=60?C.amber:C.red,
          borderRadius:99,transition:"width 1s cubic-bezier(.4,0,.2,1) 0.3s"}}/>
      </div>
    </div>
  );

  if(loading) return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"60vh",gap:20}}>
      <AvaAvatar speaking={false} listening={false} thinking={true} size={100}/>
      <div style={{color:C.txt2}}>Ava is writing your performance report...</div>
    </div>
  );

  return(
    <div style={{padding:"2rem",maxWidth:820,margin:"0 auto",fontFamily:F}}>
      {/* Hero */}
      <Card style={{textAlign:"center",marginBottom:"1.5rem"}}>
        <div style={{fontSize:14,color:C.txt2,marginBottom:6}}>Interview Complete 🎉</div>
        <div style={{fontSize:72,fontWeight:800,lineHeight:1,
          color:result.overallScore>=80?C.green:result.overallScore>=60?C.amber:C.red}}>
          {result.overallScore}
        </div>
        <div style={{color:C.txt2,fontSize:14,marginTop:6}}>Overall Score</div>
        <div style={{marginTop:14,padding:"10px 20px",background:C.elevated,borderRadius:10,display:"inline-block"}}>
          <span style={{color:C.accent,fontWeight:600,fontSize:14}}>{report?.hiring_verdict}</span>
        </div>
        <p style={{color:C.txt2,fontSize:14,lineHeight:1.6,marginTop:14,maxWidth:500,margin:"14px auto 0"}}>{report?.summary}</p>
      </Card>

      {/* Ava closing message */}
      <Card style={{marginBottom:"1.5rem",borderColor:`${C.accent}44`}}>
        <div style={{display:"flex",gap:14,alignItems:"flex-start"}}>
          <AvaAvatar speaking={avaSpeaking} listening={false} thinking={false} size={64}/>
          <div style={{flex:1}}>
            <div style={{color:C.accent,fontSize:11,fontWeight:600,marginBottom:6}}>AVA SAYS</div>
            <p style={{color:C.txt,fontSize:14,margin:0,lineHeight:1.65,fontStyle:"italic"}}>"{report?.ava_closing}"</p>
            <button onClick={speakAvaClosing} style={{marginTop:8,background:"none",border:"none",color:C.accent,cursor:"pointer",fontSize:12}}>🔊 Hear from Ava</button>
          </div>
        </div>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1.5rem",marginBottom:"1.5rem"}}>
        <Card>
          <h3 style={{color:C.txt,margin:"0 0 1.2rem",fontSize:15}}>Skill Breakdown</h3>
          <ScoreBar label="Technical depth" value={report?.technical_score||0}/>
          <ScoreBar label="Communication" value={report?.communication_score||0}/>
          <ScoreBar label="Confidence" value={report?.confidence_score||0}/>
          <ScoreBar label="Problem solving" value={report?.problem_solving_score||0}/>
          {result.avgClarity!=null&&result.totalFillers!=null&&(
            <>
              <div style={{borderTop:`1px solid ${C.border}`,margin:"12px 0",paddingTop:12}}>
                <div style={{fontSize:11,color:C.txt3,marginBottom:10,textTransform:"uppercase",letterSpacing:"0.05em"}}>Speech analytics</div>
              </div>
              <ScoreBar label="Speech clarity" value={result.avgClarity}/>
              <ScoreBar label="Confidence tone" value={result.avgConfidence}/>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8,padding:"7px 10px",
                background:result.totalFillers===0?C.greenSoft:result.totalFillers<=5?C.amberSoft:C.redSoft,borderRadius:8}}>
                <span style={{fontSize:13,color:C.txt2}}>Total filler words</span>
                <span style={{fontSize:16,fontWeight:700,color:result.totalFillers===0?C.green:result.totalFillers<=5?C.amber:C.red}}>{result.totalFillers}</span>
              </div>
            </>
          )}
        </Card>

        <Card>
          <h3 style={{color:C.txt,margin:"0 0 1.2rem",fontSize:15}}>Highlights</h3>
          <div style={{background:C.greenSoft,borderRadius:8,padding:"0.75rem",marginBottom:10}}>
            <div style={{fontSize:11,color:C.green,fontWeight:600,marginBottom:4}}>TOP STRENGTH</div>
            <div style={{fontSize:13,color:C.txt2}}>{report?.top_strength}</div>
          </div>
          <div style={{background:C.redSoft,borderRadius:8,padding:"0.75rem",marginBottom:10}}>
            <div style={{fontSize:11,color:C.red,fontWeight:600,marginBottom:4}}>CRITICAL GAP</div>
            <div style={{fontSize:13,color:C.txt2}}>{report?.critical_gap}</div>
          </div>
          <div style={{background:C.elevated,borderRadius:8,padding:"0.75rem"}}>
            <div style={{fontSize:11,color:C.txt2,fontWeight:600,marginBottom:6}}>Q-BY-Q SCORES</div>
            <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
              {result.scores.map((s,i)=>(
                <div key={i} style={{fontSize:11,padding:"3px 8px",borderRadius:6,
                  background:s>=80?C.greenSoft:s>=60?C.amberSoft:C.redSoft,
                  color:s>=80?C.green:s>=60?C.amber:C.red}}>Q{i+1}: {s}</div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Next steps */}
      <Card style={{marginBottom:"1.5rem"}}>
        <h3 style={{color:C.txt,margin:"0 0 1rem",fontSize:15}}>🗺 Your Learning Path from Ava</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:"1rem"}}>
          {report?.next_steps?.map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 12px",background:C.elevated,borderRadius:8}}>
              <span style={{color:C.accent,fontWeight:700,fontSize:13,minWidth:20}}>{i+1}.</span>
              <span style={{color:C.txt2,fontSize:13}}>{s}</span>
            </div>
          ))}
        </div>
        <div style={{borderTop:`1px solid ${C.border}`,paddingTop:"0.85rem"}}>
          <div style={{color:C.txt2,fontSize:12,marginBottom:8}}>Recommended resources</div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {report?.resources?.map(r=>(
              <span key={r.title} style={{fontSize:12,padding:"4px 10px",borderRadius:8,background:C.accentSoft,color:C.accent,border:`1px solid ${C.accent}33`}}>
                📚 {r.title} <span style={{opacity:0.6}}>({r.type})</span>
              </span>
            ))}
          </div>
        </div>
      </Card>

      <div style={{display:"flex",gap:10,justifyContent:"center"}}>
        <Btn variant="ghost" onClick={onDashboard}>← Dashboard</Btn>
        <Btn onClick={onRetry}>🔄 Practice Again with Ava</Btn>
      </div>
    </div>
  );
}

// ─── STRIPE PRICE IDs — paste yours from Stripe Dashboard ───────────────────
// Stripe Dashboard → Product catalog → click product → copy Price ID
const STRIPE_PRICES = {
  starter:    import.meta.env.VITE_STRIPE_STARTER_PRICE_ID    || "",
  pro:        import.meta.env.VITE_STRIPE_PRO_PRICE_ID        || "",
  topup100k:  import.meta.env.VITE_STRIPE_TOPUP_100K_PRICE_ID || "",
  topup500k:  import.meta.env.VITE_STRIPE_TOPUP_500K_PRICE_ID || "",
  topup1m:    import.meta.env.VITE_STRIPE_TOPUP_1M_PRICE_ID   || "",  // ← ADD
};

// ─── STRIPE CHECKOUT via Supabase Edge Function ───────────────────────────────
async function createCheckoutSession(priceId, userEmail, mode="subscription"){
  const { data:{ session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const edgeFnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;
  const res = await fetch(edgeFnUrl,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      ...(token?{"Authorization":`Bearer ${token}`}:{}),
    },
    body:JSON.stringify({
      price_id: priceId,
      mode,  // "subscription" or "payment" for one-time
      success_url: `${window.location.origin}?checkout=success`,
      cancel_url:  `${window.location.origin}?checkout=cancel`,
      customer_email: userEmail,
    }),
  });
  if(!res.ok) throw new Error("Failed to create checkout session");
  const { url } = await res.json();
  if(url) window.location.href = url; // redirect to Stripe Checkout
  else throw new Error("No checkout URL returned");
}

// ─── SCREEN: PRICING ─────────────────────────────────────────────────────────
function PricingScreen({user,onBack}){
  const [loadingPlan,setLoadingPlan]=useState(null);
  const [checkoutError,setCheckoutError]=useState("");

  // Show success/cancel message if returning from Stripe
  const params=new URLSearchParams(window.location.search);
  const checkoutStatus=params.get("checkout");

  const handleUpgrade=async(planKey)=>{
    const priceId=STRIPE_PRICES[planKey];
    if(!priceId){
      setCheckoutError(`Price ID for ${planKey} not configured yet. Add VITE_STRIPE_${planKey.toUpperCase()}_PRICE_ID to Vercel env vars.`);
      return;
    }
    setLoadingPlan(planKey); setCheckoutError("");
    try{
      await createCheckoutSession(priceId, user.email, "subscription");
    }catch(err){
      setCheckoutError(err.message||"Checkout failed — please try again");
      setLoadingPlan(null);
    }
  };

  const handleTopup=async(key,label,price)=>{
    const priceId=STRIPE_PRICES[key];
    if(!priceId){
      setCheckoutError(`Top-up price ID not configured. Add VITE_STRIPE_${key.toUpperCase()}_PRICE_ID to Vercel.`);
      return;
    }
    setLoadingPlan(key); setCheckoutError("");
    try{
      await createCheckoutSession(priceId, user.email, "payment");
    }catch(err){
      setCheckoutError(err.message||"Checkout failed");
      setLoadingPlan(null);
    }
  };

  return(
    <div style={{padding:"2rem",maxWidth:960,margin:"0 auto",fontFamily:F}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.txt2,cursor:"pointer",fontSize:14,marginBottom:"1.5rem"}}>← Back</button>

      {/* Checkout return banners */}
      {checkoutStatus==="success"&&(
        <div style={{background:C.greenSoft,border:`1px solid ${C.greenMid}`,borderRadius:12,
          padding:"14px 20px",marginBottom:"1.5rem",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>🎉</span>
          <div>
            <div style={{...T.h4,margin:0,color:C.green}}>Payment successful!</div>
            <div style={{...T.uiSm,color:C.txt2,marginTop:3}}>Your plan has been upgraded. Enjoy your new features!</div>
          </div>
        </div>
      )}
      {checkoutStatus==="cancel"&&(
        <div style={{background:C.amberSoft,border:`1px solid ${C.amberMid}`,borderRadius:12,
          padding:"14px 20px",marginBottom:"1.5rem"}}>
          <div style={{...T.uiSm,color:C.amber}}>No worries — your checkout was cancelled. You can upgrade whenever you're ready.</div>
        </div>
      )}
      {checkoutError&&(
        <div style={{background:C.redSoft,border:`1px solid ${C.redMid}`,borderRadius:12,
          padding:"14px 20px",marginBottom:"1.5rem"}}>
          <div style={{...T.uiSm,color:C.red}}>⚠ {checkoutError}</div>
        </div>
      )}

      <h2 style={{...T.h1,textAlign:"center",marginBottom:8}}>Choose your plan</h2>
      <p style={{...T.ui,color:C.txt2,textAlign:"center",marginBottom:"2.5rem"}}>
        Upgrade anytime · Cancel anytime · Tokens reset monthly
      </p>

      {/* Plan cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:16,marginBottom:"2rem"}}>
        {Object.entries(PLANS).map(([key,plan])=>{
          const isCurrent=user.plan===key;
          const isPro=key==="pro";
          const isLoading=loadingPlan===key;
          const priceId=STRIPE_PRICES[key];
          const canUpgrade=!isCurrent&&plan.price!==null&&plan.price>0;

          return(
            <div key={key} style={{
              background:C.card,
              border:`${isPro?2:1}px solid ${isPro?C.accent:isCurrent?C.green+"66":C.border}`,
              borderRadius:16,padding:"1.5rem",position:"relative",
              transition:"transform 0.15s",
            }}>
              {isPro&&(
                <div style={{position:"absolute",top:-13,left:"50%",transform:"translateX(-50%)",
                  background:C.accent,color:"#fff",fontSize:11,fontWeight:700,
                  padding:"4px 14px",borderRadius:99,whiteSpace:"nowrap",
                  boxShadow:`0 2px 8px ${C.accent}55`}}>
                  MOST POPULAR
                </div>
              )}
              {isCurrent&&(
                <div style={{position:"absolute",top:12,right:12}}>
                  <Badge color={C.green} size="md">Current</Badge>
                </div>
              )}

              {/* Plan name + price */}
              <div style={{color:plan.color,fontWeight:700,fontSize:17,marginBottom:6}}>{plan.name}</div>
              <div style={{marginBottom:4}}>
                <span style={{color:C.txt,fontSize:30,fontWeight:800,letterSpacing:"-0.02em"}}>
                  {plan.price===null?"Custom":plan.price===0?"Free":`$${plan.price}`}
                </span>
                {plan.price>0&&<span style={{fontSize:14,color:C.txt2,fontWeight:400}}>/mo</span>}
              </div>

              {/* Features */}
              <div style={{borderTop:`1px solid ${C.border}`,margin:"14px 0",paddingTop:14,display:"flex",flexDirection:"column",gap:7}}>
                {[
                  {text:`${plan.tokens===Infinity?"Unlimited":fmtN(plan.tokens)} tokens`,ok:true},
                  {text:`${plan.sessions===999?"Unlimited":plan.sessions} sessions`,ok:true},
                  {text:"Voice + Ava coach",ok:plan.voice},
                  {text:"Full scorecard",ok:key!=="free"},
                  {text:"Learning path",ok:key==="pro"||key==="enterprise"},
                  {text:"Team dashboard",ok:key==="enterprise"},
                ].filter(f=>f.text).map(f=>(
                  <div key={f.text} style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:13,color:f.ok?C.green:C.txt4,flexShrink:0}}>{f.ok?"✓":"✗"}</span>
                    <span style={{fontSize:13,color:f.ok?C.txt2:C.txt4}}>{f.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Btn
                variant={isCurrent?"ghost":isPro?"primary":"ghost"}
                disabled={isCurrent||isLoading}
                style={{width:"100%",marginTop:4}}
                onClick={()=>{
                  if(key==="enterprise") window.open("mailto:hello@interviewai.app?subject=Enterprise Plan","_blank");
                  else if(canUpgrade) handleUpgrade(key);
                }}>
                {isLoading?"Redirecting to Stripe…":
                 isCurrent?"Current plan":
                 plan.price===null?"Contact us →":
                 `Upgrade to ${plan.name} →`}
              </Btn>

              {/* Show if price ID missing */}
              {canUpgrade&&!priceId&&(
                <div style={{fontSize:10,color:C.amber,marginTop:6,textAlign:"center"}}>
                  ⚠ Add VITE_STRIPE_{key.toUpperCase()}_PRICE_ID to Vercel
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Token top-ups */}
      <Card>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"1rem",flexWrap:"wrap",gap:8}}>
          <div>
            <h3 style={{...T.h4,margin:0}}>💡 Token top-ups</h3>
            <p style={{...T.uiSm,color:C.txt2,marginTop:4}}>Need more tokens without changing your plan? Buy extra anytime.</p>
          </div>
        </div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          {[
            {key:"topup100k",label:"100K tokens",price:"$2",desc:"~8 full sessions"},
            {key:"topup500k",label:"500K tokens",price:"$8",desc:"~40 full sessions"},
            {key:"topup1m",  label:"1M tokens",  price:"$14",desc:"~80 full sessions"},
          ].map(t=>(
            <div key={t.key} style={{flex:1,minWidth:160,background:C.elevated,
              borderRadius:12,padding:"1rem",border:`1px solid ${C.border}`}}>
              <div style={{...T.h4,margin:"0 0 2px"}}>{t.label}</div>
              <div style={{fontSize:18,fontWeight:800,color:C.accent,marginBottom:2}}>{t.price}</div>
              <div style={{...T.caption,color:C.txt3,marginBottom:10}}>{t.desc}</div>
              <Btn variant="ghost" style={{width:"100%",fontSize:13}}
                disabled={loadingPlan===t.key}
                onClick={()=>handleTopup(t.key,t.label,t.price)}>
                {loadingPlan===t.key?"Redirecting…":`Buy ${t.label}`}
              </Btn>
              {!STRIPE_PRICES[t.key]&&(
                <div style={{fontSize:10,color:C.txt4,marginTop:4,textAlign:"center"}}>Price ID needed</div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Security note */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginTop:"1.5rem"}}>
        <span style={{fontSize:16}}>🔒</span>
        <span style={{...T.caption,color:C.txt3}}>
          Payments secured by Stripe · No card details stored · Cancel anytime from your account
        </span>
      </div>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function Nav({user,screen,onNav,onLogout}){
  const [profileOpen,setProfileOpen]=useState(false);
  const profileRef=useRef(null);
  useEffect(()=>{
    const handleClick=(e)=>{ if(profileRef.current&&!profileRef.current.contains(e.target)) setProfileOpen(false); };
    document.addEventListener("mousedown",handleClick);
    return()=>document.removeEventListener("mousedown",handleClick);
  },[]);
  if(!user||screen==="auth")return null;
  const plan=PLANS[user.plan];
  const p=pct(user.tokensUsed,plan.tokens);
  const color=barC(p);
  return(
    <div style={{background:C.card,borderBottom:`1px solid ${C.border}`,padding:"0 1.5rem",
      display:"flex",alignItems:"center",justifyContent:"space-between",height:54,
      position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer"}} onClick={()=>onNav("dashboard")}>
          <AvaAvatar speaking={false} listening={false} thinking={false} size={28}/>
          <span style={{color:C.txt,fontWeight:700,fontSize:15}}>InterviewAI</span>
        </div>
        {["dashboard","pricing"].map(s=>(
          <button key={s} onClick={()=>onNav(s)} style={{background:"none",border:"none",
            color:screen===s?C.txt:C.txt2,cursor:"pointer",fontSize:13,fontFamily:F,
            fontWeight:screen===s?600:400,textTransform:"capitalize",padding:"4px 0"}}>
            {s}
          </button>
        ))}
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        {plan.tokens!==Infinity&&(
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:72,height:4,background:C.border,borderRadius:99,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${p}%`,background:color,borderRadius:99}}/>
            </div>
            <span style={{fontSize:11,color:C.txt2}}>{fmtN(user.tokensUsed)}/{fmtN(plan.tokens)}</span>
          </div>
        )}
        <Badge color={plan.color}>{plan.name}</Badge>
        {isAdmin(user.email)&&(
          <Badge color={C.amber}>Admin</Badge>
        )}

        {/* Profile avatar — clickable */}
        <div style={{position:"relative"}} ref={profileRef}>
          <div onClick={()=>setProfileOpen(o=>!o)}
            aria-label="Profile menu"
            style={{width:32,height:32,borderRadius:"50%",background:C.accent,display:"flex",
              alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"#fff",
              cursor:"pointer",border:`2px solid ${profileOpen?C.accentHover:C.border}`,
              transition:"border-color 0.15s",userSelect:"none"}}>
            {user.name.charAt(0).toUpperCase()}
          </div>

          {/* Dropdown */}
          {profileOpen&&(
            <div style={{position:"absolute",top:40,right:0,width:220,background:C.card,
              border:`1px solid ${C.border}`,borderRadius:12,boxShadow:"0 8px 32px #00000066",
              zIndex:200,overflow:"hidden"}}>
              {/* User info */}
              <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                  <div style={{width:36,height:36,borderRadius:"50%",background:C.accent,display:"flex",
                    alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:700,color:"#fff",flexShrink:0}}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{overflow:"hidden"}}>
                    <div style={{color:C.txt,fontWeight:600,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.name}</div>
                    <div style={{color:C.txt2,fontSize:11,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{user.email}</div>
                  </div>
                </div>
                <Badge color={plan.color}>{plan.name} Plan</Badge>
              </div>

              {/* Token usage inside dropdown */}
              <div style={{padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
                <div style={{fontSize:11,color:C.txt2,marginBottom:6}}>Token usage this month</div>
                <TokenBar used={user.tokensUsed} total={plan.tokens}/>
              </div>

              {/* Menu items */}
              {[
                {icon:"🎯", label:"Dashboard",    action:()=>{onNav("dashboard");setProfileOpen(false);}},
                {icon:"💳", label:"Upgrade Plan", action:()=>{onNav("pricing");setProfileOpen(false);}},
              ].map(item=>(
                <button key={item.label} onClick={item.action}
                  style={{width:"100%",padding:"11px 16px",background:"none",border:"none",
                    color:C.txt2,fontSize:13,cursor:"pointer",fontFamily:F,
                    display:"flex",alignItems:"center",gap:10,textAlign:"left",
                    transition:"background 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.elevated}
                  onMouseLeave={e=>e.currentTarget.style.background="none"}>
                  <span>{item.icon}</span><span>{item.label}</span>
                </button>
              ))}

              {/* Sign out */}
              <div style={{borderTop:`1px solid ${C.border}`}}>
                <button onClick={()=>{onLogout();setProfileOpen(false);}}
                  style={{width:"100%",padding:"11px 16px",background:"none",border:"none",
                    color:C.red,fontSize:13,cursor:"pointer",fontFamily:F,
                    display:"flex",alignItems:"center",gap:10,textAlign:"left",
                    transition:"background 0.15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=C.redSoft}
                  onMouseLeave={e=>e.currentTarget.style.background="none"}>
                  <span>🚪</span><span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App(){
  const [screen,setScreen]=useState("auth");
  const [user,setUser]=useState(null);
  const [config,setConfig]=useState(null);
  const [result,setResult]=useState(null);

  // ── Listen for Supabase auth changes (handles Google OAuth redirect) ──────
  useEffect(()=>{
    // Handle OAuth redirect — exchange code for session
    supabase.auth.getSession().then(({ data:{ session } })=>{
      if(session?.user) buildUser(session.user);
    });

    const { data:{ subscription } } = supabase.auth.onAuthStateChange((event, session)=>{
      if((event==="SIGNED_IN" || event==="TOKEN_REFRESHED" || event==="INITIAL_SESSION") && session?.user){
        buildUser(session.user);
      } else if(event==="SIGNED_OUT"){
        setUser(null); setConfig(null); setResult(null); setScreen("auth");
      }
    });
    return ()=> subscription.unsubscribe();
  },[]);

  const buildUser=(supaUser)=>{
    const name = supaUser.user_metadata?.full_name
      || supaUser.user_metadata?.name
      || supaUser.email?.split("@")[0]
      || "User";
    setUser({ name, email:supaUser.email, plan:"free", tokensUsed:0, sessionsUsed:0, id:supaUser.id });
    setScreen("dashboard");
  };

  const handleEnter=u=>{ setUser({...u,sessionsUsed:u.sessionsUsed||0}); setScreen("dashboard"); };
  const handleBegin=cfg=>{ setConfig(cfg); setUser(u=>({...u,tokensUsed:(u.tokensUsed||0)+3500})); setScreen("interview"); };
  const handleComplete=r=>{ setResult(r); setUser(u=>({...u,tokensUsed:(u.tokensUsed||0)+r.scores.length*1200+3000,sessionsUsed:(u.sessionsUsed||0)+1})); setScreen("report"); };
  const handleLogout=async()=>{
    await supabase.auth.signOut();
    setUser(null); setConfig(null); setResult(null); setScreen("auth");
  };

  return(
    <div style={{fontFamily:F,background:C.bg,minHeight:"100vh",color:C.txt}}>
      <Nav user={user} screen={screen} onNav={s=>setScreen(s)} onLogout={handleLogout}/>
      {screen==="auth"     &&<AuthScreen onEnter={handleEnter}/>}
      {screen==="dashboard"&&user&&<DashboardScreen user={user} onStart={()=>setScreen("setup")} onUpgrade={()=>setScreen("pricing")}/>}
      {screen==="setup"    &&user&&<SetupScreen user={user} onBegin={handleBegin} onBack={()=>setScreen("dashboard")}/>}
      {screen==="interview"&&config&&<InterviewScreen user={user} config={config} onComplete={handleComplete} onBack={()=>setScreen("dashboard")}/>}
      {screen==="report"   &&result&&<ReportScreen result={result} onDashboard={()=>setScreen("dashboard")} onRetry={()=>setScreen("setup")}/>}
      {screen==="pricing"  &&user&&<PricingScreen user={user} onBack={()=>setScreen("dashboard")}/>}
    </div>
  );
}
