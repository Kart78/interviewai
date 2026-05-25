import { useState, useEffect, useRef, useCallback } from "react";

// ─── COLORS ──────────────────────────────────────────────────────────────────
const C = {
  bg: "#07080d", card: "#0f1117", elevated: "#161820", border: "#1e2130",
  borderHover: "#2e3248", accent: "#7c6fff", accentHover: "#9d94ff",
  accentSoft: "#7c6fff1a", green: "#22c55e", greenSoft: "#22c55e18",
  amber: "#f59e0b", amberSoft: "#f59e0b18", red: "#ef4444", redSoft: "#ef444418",
  blue: "#3b82f6", blueSoft: "#3b82f618",
  txt: "#eeeef5", txt2: "#7b7f9a", txt3: "#3d4060",
  avaBase: "#1a1030", avaBorder: "#7c6fff44",
};

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
  if(!text?.trim()) return {fillerCount:0,fillerWords:{},wordCount:0,wpm:0,clarityScore:100,confidenceScore:100,vocabularyScore:100,paceLabel:"—",paceColor:C.txt3};
  const lower=text.toLowerCase(), words=text.trim().split(/\s+/).filter(Boolean);
  const wordCount=words.length;
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

// ─── CLAUDE API CALL ──────────────────────────────────────────────────────────
async function callClaude(messages, model="claude-haiku-4-5-20251001", maxTokens=1200){
  const res = await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({ model, max_tokens:maxTokens, messages }),
  });
  const data = await res.json();
  const text = data.content?.find(b=>b.type==="text")?.text||"";
  return text;
}

function parseJSON(text){
  try{ return JSON.parse(text.replace(/```json|```/g,"").trim()); }
  catch{ return null; }
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Btn({children,onClick,variant="primary",disabled=false,style={}}){
  const [hov,setHov]=useState(false);
  const styles={
    primary:{background:hov?C.accentHover:C.accent,color:"#fff",border:"none"},
    ghost:{background:hov?C.elevated:"transparent",color:C.txt,border:`1px solid ${C.border}`},
    danger:{background:hov?"#dc2626":C.red,color:"#fff",border:"none"},
    success:{background:hov?"#16a34a":C.green,color:"#fff",border:"none"},
    google:{background:hov?"#fff":C.elevated,color:C.txt,border:`1px solid ${C.border}`},
  };
  return(
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{padding:"10px 20px",borderRadius:10,fontFamily:"inherit",fontSize:14,fontWeight:600,
        cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.45:1,transition:"all 0.15s",
        ...styles[variant],...style}}>
      {children}
    </button>
  );
}

function Card({children,style={},onClick}){
  const [hov,setHov]=useState(false);
  return(
    <div onClick={onClick}
      onMouseEnter={()=>onClick&&setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{background:C.card,border:`1px solid ${hov?C.borderHover:C.border}`,borderRadius:16,
        padding:"1.5rem",cursor:onClick?"pointer":"default",transition:"border-color 0.2s",
        transform:hov?"translateY(-1px)":"none",...style}}>
      {children}
    </div>
  );
}

function Badge({children,color=C.accent}){
  return <span style={{display:"inline-block",padding:"2px 10px",borderRadius:99,
    background:color+"22",color,fontSize:11,fontWeight:600,letterSpacing:"0.04em",textTransform:"uppercase"}}>
    {children}
  </span>;
}

function TokenBar({used,total}){
  const p=pct(used,total);
  const color=barC(p);
  return(
    <div style={{width:"100%"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontSize:12,color:C.txt2}}>
        <span>{fmtN(used)} used</span>
        <span style={{color}}>{total===Infinity?"Unlimited":`${p}%`}</span>
      </div>
      <div style={{height:6,background:C.border,borderRadius:99,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${total===Infinity?8:p}%`,background:color,borderRadius:99,
          transition:"width 0.6s",boxShadow:`0 0 8px ${color}66`}}/>
      </div>
      {p>=80&&total!==Infinity&&<p style={{fontSize:11,color:C.amber,marginTop:4}}>⚠ {p>=100?"Limit reached":"Approaching limit"} — upgrade to continue</p>}
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

  const inp = {
    width:"100%",padding:"12px 16px",background:C.elevated,
    border:`1px solid ${C.border}`,borderRadius:10,color:C.txt,
    fontSize:14,fontFamily:"inherit",outline:"none",boxSizing:"border-box",
    transition:"border-color 0.2s",
  };

  const handleAuth = async()=>{
    if(!email.trim()||!password.trim()) return setError("Please fill in all fields");
    if(tab==="signup"&&!name.trim()) return setError("Please enter your full name");
    setError(""); setLoading(true);
    // ── TO CONNECT REAL AUTH: replace below with ──
    // const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    // OR supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
    await new Promise(r=>setTimeout(r,900));
    const displayName = tab==="signup" ? name.trim() : email.split("@")[0];
    onEnter({ name:displayName, email:email.trim(), plan:"free", tokensUsed:0, sessionsUsed:0 });
    setLoading(false);
  };

  const handleGoogle = async()=>{
    setLoading(true);
    // ── TO CONNECT REAL GOOGLE AUTH: replace below with ──
    // await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    await new Promise(r=>setTimeout(r,1000));
    const mockName = "Demo User";
    onEnter({ name:mockName, email:"demo@gmail.com", plan:"free", tokensUsed:0, sessionsUsed:0 });
    setLoading(false);
  };

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",
      justifyContent:"center",padding:"2rem",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      {/* Ambient */}
      <div style={{position:"fixed",top:"15%",left:"50%",transform:"translateX(-50%)",
        width:600,height:300,background:`radial-gradient(ellipse,${C.accent}14 0%,transparent 70%)`,pointerEvents:"none"}}/>

      <div style={{width:"100%",maxWidth:420,position:"relative"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:"2rem"}}>
          <AvaAvatar speaking={false} listening={false} thinking={false} size={80}/>
          <h1 style={{color:C.txt,fontSize:26,fontWeight:700,margin:"12px 0 4px"}}>InterviewAI</h1>
          <p style={{color:C.txt2,fontSize:13}}>Meet <strong style={{color:C.accent}}>Ava</strong> — your personal AI interview coach</p>
        </div>

        <Card>
          {/* Tab */}
          <div style={{display:"flex",background:C.bg,borderRadius:10,padding:4,marginBottom:"1.25rem"}}>
            {["signin","signup"].map(t=>(
              <button key={t} onClick={()=>{setTab(t);setError("");}} style={{
                flex:1,padding:"8px",borderRadius:8,border:"none",fontFamily:"inherit",
                fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.15s",
                background:tab===t?C.elevated:"transparent",color:tab===t?C.txt:C.txt2}}>
                {t==="signin"?"Sign In":"Sign Up"}
              </button>
            ))}
          </div>

          {/* Google OAuth */}
          <Btn variant="google" onClick={handleGoogle} disabled={loading}
            style={{width:"100%",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.8 18.9 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.3 35.5 26.8 36 24 36c-5.3 0-9.8-3.5-11.4-8.3l-6.5 5C9.5 39.4 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.8l6.2 5.2C41.2 35.5 44 30.1 44 24c0-1.3-.1-2.7-.4-4z"/>
            </svg>
            {loading?"Connecting...":"Continue with Google"}
          </Btn>

          {/* Divider */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            <div style={{flex:1,height:1,background:C.border}}/>
            <span style={{color:C.txt3,fontSize:12}}>or</span>
            <div style={{flex:1,height:1,background:C.border}}/>
          </div>

          {/* Fields */}
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {tab==="signup"&&<input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} style={inp}/>}
            <input placeholder="Email address" value={email} onChange={e=>setEmail(e.target.value)} style={inp} type="email"/>
            <input placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} style={inp} type="password"
              onKeyDown={e=>e.key==="Enter"&&handleAuth()}/>
            {error&&<p style={{color:C.red,fontSize:12,margin:0}}>{error}</p>}
            <Btn onClick={handleAuth} disabled={loading} style={{width:"100%",padding:"13px"}}>
              {loading?"Please wait...":tab==="signin"?"Sign In →":"Create Account →"}
            </Btn>
          </div>

          <p style={{color:C.txt3,fontSize:12,textAlign:"center",marginTop:"1rem"}}>
            {tab==="signup"?"Free plan — no credit card required":"No account? "}
            {tab==="signin"&&<span style={{color:C.accent,cursor:"pointer"}} onClick={()=>setTab("signup")}>Sign up free</span>}
          </p>
        </Card>

        <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"center",marginTop:"1.25rem"}}>
          {["🎙 Voice interviews","📊 Real-time scoring","🤖 Ava AI coach","💡 Live coaching","🌍 All industries"].map(f=>(
            <span key={f} style={{fontSize:12,color:C.txt2,background:C.card,border:`1px solid ${C.border}`,borderRadius:99,padding:"4px 12px"}}>{f}</span>
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
  const stats=[
    {label:"Sessions this month",value:user.sessionsUsed||4,icon:"🎯"},
    {label:"Avg score",value:"74%",icon:"📊"},
    {label:"Top industry",value:"Business",icon:"⭐"},
    {label:"Next goal",value:"System Design",icon:"📈"},
  ];
  const recent=[
    {role:"Financial Analyst",industry:"Business & Finance",score:82,date:"Today"},
    {role:"Registered Nurse",industry:"Healthcare",score:71,date:"Yesterday"},
    {role:"UX Designer",industry:"Creative",score:65,date:"3 days ago"},
  ];
  return(
    <div style={{padding:"2rem",maxWidth:1100,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"2rem",flexWrap:"wrap",gap:16}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <AvaAvatar speaking={false} listening={false} thinking={false} size={56}/>
          <div>
            <h2 style={{color:C.txt,margin:0,fontSize:22,fontWeight:700}}>Good morning, {user.name.split(" ")[0]} 👋</h2>
            <p style={{color:C.txt2,margin:"2px 0 0",fontSize:13}}>Ava is ready for your next mock interview</p>
          </div>
        </div>
        <Btn onClick={onStart}>+ New Interview with Ava</Btn>
      </div>

      {/* Token card */}
      <Card style={{marginBottom:"1.5rem",borderColor:p>=80?`${C.amber}44`:C.border}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:20}}>⚡</span>
            <div>
              <div style={{color:C.txt,fontWeight:600,fontSize:15}}>Token Usage</div>
              <div style={{color:C.txt2,fontSize:12}}>Resets in 18 days</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <Badge color={plan.color}>{plan.name}</Badge>
            {user.plan!=="pro"&&user.plan!=="enterprise"&&<Btn onClick={onUpgrade} style={{padding:"6px 14px",fontSize:12}}>Upgrade ↗</Btn>}
          </div>
        </div>
        <TokenBar used={user.tokensUsed} total={plan.tokens}/>
      </Card>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:"1.5rem"}}>
        {stats.map(s=>(
          <Card key={s.label} style={{padding:"1.2rem"}}>
            <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
            <div style={{color:C.txt,fontWeight:700,fontSize:22}}>{s.value}</div>
            <div style={{color:C.txt2,fontSize:12,marginTop:3}}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Recent */}
      <Card>
        <h3 style={{color:C.txt,margin:"0 0 1rem",fontSize:16,fontWeight:600}}>Recent Sessions</h3>
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {recent.map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",
              padding:"12px 16px",background:C.elevated,borderRadius:10,flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{color:C.txt,fontWeight:500,fontSize:14}}>{s.role}</div>
                <div style={{color:C.txt2,fontSize:12}}>{s.industry} · {s.date}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:20,fontWeight:700,color:s.score>=80?C.green:s.score>=60?C.amber:C.red}}>{s.score}%</div>
                <Btn variant="ghost" style={{padding:"5px 12px",fontSize:12}} onClick={onStart}>Retry</Btn>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ─── SCREEN: SETUP ────────────────────────────────────────────────────────────
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
  const canVoice=plan.voice;
  const senLevels=industry?SENIORITY[industry]:["Entry-Level","Mid-Level","Senior","Lead","Director"];
  const finalRole=role==="__custom__"?customRole:role;

  const analyzeResume=async()=>{
    if(!finalRole.trim())return;
    setLoading(true);
    try{
      const text=await callClaude([{role:"user",content:`You are an expert career coach. Analyze this candidate's background for the target role. Return ONLY valid JSON, no other text:
{"skills":["skill1","skill2","skill3"],"gaps":["gap1","gap2"],"strengths":["strength1","strength2"],"focus_areas":["area1","area2","area3"],"readiness_score":72,"interview_types":["Behavioral","Situational","Technical"],"ava_intro":"Hi! I'm Ava, your AI interview coach. I've reviewed your background and I'm excited to help you prepare for the ${finalRole} role. I can see you have solid strengths, but let's work on a few key areas together. Ready to start?"}

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
        ava_intro:`Hi! I'm Ava, your AI interview coach. I've reviewed your background for the ${finalRole} role and I'm ready to help you prepare. Let's focus on your key areas and get you interview-ready!`,
      });
      setStep(3);
    }
    setLoading(false);
  };

  const ta={width:"100%",minHeight:110,padding:"12px 16px",background:C.elevated,
    border:`1px solid ${C.border}`,borderRadius:10,color:C.txt,fontSize:13,
    fontFamily:"inherit",resize:"vertical",outline:"none",boxSizing:"border-box"};
  const inp={...ta,minHeight:"auto",height:44,resize:"none"};
  const pill=(val,sel,onClick,label)=>(
    <button key={val} onClick={onClick} style={{padding:"7px 14px",borderRadius:8,
      border:`1px solid ${sel?C.accent:C.border}`,
      background:sel?C.accentSoft:"transparent",color:sel?C.accent:C.txt2,
      fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
      {label||val}
    </button>
  );

  return(
    <div style={{padding:"2rem",maxWidth:720,margin:"0 auto",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.txt2,cursor:"pointer",fontSize:14,marginBottom:"1.5rem",padding:0}}>← Back</button>

      {/* Steps */}
      <div style={{display:"flex",gap:8,marginBottom:"2rem"}}>
        {["Industry & Role","Your Background","AI Analysis","Start!"].map((label,i)=>(
          <div key={i} style={{flex:1,textAlign:"center"}}>
            <div style={{height:4,borderRadius:99,background:step>i+1?C.accent:step===i+1?C.accent:C.border,marginBottom:5,transition:"background 0.3s"}}/>
            <span style={{fontSize:11,color:step>=i+1?C.txt2:C.txt3}}>{label}</span>
          </div>
        ))}
      </div>

      {step===1&&(
        <Card>
          <h3 style={{color:C.txt,margin:"0 0 1.5rem",fontSize:18}}>What are you interviewing for?</h3>
          <div style={{display:"flex",flexDirection:"column",gap:20}}>
            <div>
              <label style={{color:C.txt2,fontSize:13,display:"block",marginBottom:10}}>Industry *</label>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(165px,1fr))",gap:8}}>
                {INDUSTRIES.map(ind=>(
                  <button key={ind.id} onClick={()=>{setIndustry(ind.id);setRole("");setSeniority("");}} style={{
                    display:"flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:10,
                    border:`1px solid ${industry===ind.id?C.accent:C.border}`,
                    background:industry===ind.id?C.accentSoft:C.elevated,
                    color:industry===ind.id?C.accent:C.txt2,
                    fontSize:12,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",textAlign:"left"}}>
                    <span>{ind.icon}</span><span>{ind.label}</span>
                  </button>
                ))}
              </div>
            </div>
            {industry&&(
              <div>
                <label style={{color:C.txt2,fontSize:13,display:"block",marginBottom:10}}>Role *</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {(ROLES_BY_INDUSTRY[industry]||[]).map(r=>pill(r,role===r,()=>setRole(r),r))}
                  {pill("__custom__",role==="__custom__",()=>setRole("__custom__"),"✏ Other role...")}
                </div>
                {role==="__custom__"&&<input placeholder="Type your role..." value={customRole} onChange={e=>setCustomRole(e.target.value)} style={{...inp,marginTop:10}} autoFocus/>}
              </div>
            )}
            {industry&&role&&(role!=="__custom__"||customRole.trim())&&(
              <div>
                <label style={{color:C.txt2,fontSize:13,display:"block",marginBottom:10}}>Seniority / Level *</label>
                <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                  {senLevels.map(s=>pill(s,seniority===s,()=>setSeniority(s),s))}
                </div>
              </div>
            )}
            <Btn onClick={()=>setStep(2)} disabled={!industry||!role||(role==="__custom__"&&!customRole.trim())||!seniority} style={{alignSelf:"flex-end"}}>Next →</Btn>
          </div>
        </Card>
      )}

      {step===2&&(
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
            <h3 style={{color:C.txt,margin:0,fontSize:18}}>Your Background</h3>
            <div style={{display:"flex",gap:8}}><Badge color={C.accent}>{finalRole}</Badge><Badge color={C.txt2}>{seniority}</Badge></div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <div>
              <label style={{color:C.txt2,fontSize:13,display:"block",marginBottom:6}}>Paste your CV / resume <span style={{color:C.txt3}}>(optional but recommended)</span></label>
              <textarea placeholder="Paste your resume text, LinkedIn summary, or describe your experience and skills..." value={resumeText} onChange={e=>setResumeText(e.target.value)} style={ta}/>
            </div>
            <div>
              <label style={{color:C.txt2,fontSize:13,display:"block",marginBottom:6}}>Job description <span style={{color:C.txt3}}>(optional — for hyper-targeted questions)</span></label>
              <textarea placeholder="Paste the job posting here..." value={jd} onChange={e=>setJd(e.target.value)} style={{...ta,minHeight:70}}/>
            </div>
            <div style={{background:canVoice?C.greenSoft:C.elevated,border:`1px solid ${canVoice?C.green+"44":C.border}`,borderRadius:10,padding:"1rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{color:C.txt,fontWeight:600,fontSize:14}}>🎙 Voice Interview Mode</div>
                  <div style={{color:C.txt2,fontSize:12,marginTop:4}}>Ava speaks questions, you answer by voice — with live speech analytics</div>
                </div>
                {canVoice?<Badge color={C.green}>Enabled</Badge>:<Badge color={C.txt3}>Starter+ only</Badge>}
              </div>
            </div>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <Btn variant="ghost" onClick={()=>setStep(1)}>← Back</Btn>
              <Btn onClick={analyzeResume} disabled={loading}>{loading?"Ava is analyzing your profile...":"Analyze & Prepare →"}</Btn>
            </div>
          </div>
        </Card>
      )}

      {step===3&&analysis&&(
        <Card>
          <div style={{display:"flex",gap:16,alignItems:"flex-start",marginBottom:"1.25rem"}}>
            <AvaAvatar speaking={false} listening={false} thinking={false} size={64}/>
            <div style={{flex:1}}>
              <div style={{color:C.accent,fontSize:12,fontWeight:600,marginBottom:6}}>AVA SAYS</div>
              <p style={{color:C.txt,fontSize:14,lineHeight:1.6,margin:0,fontStyle:"italic"}}>"{analysis.ava_intro}"</p>
            </div>
            <div style={{textAlign:"center",flexShrink:0}}>
              <div style={{fontSize:30,fontWeight:800,color:analysis.readiness_score>=70?C.green:C.amber}}>{analysis.readiness_score}%</div>
              <div style={{fontSize:11,color:C.txt2}}>Readiness</div>
            </div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:"1.25rem"}}>
            <div style={{background:C.greenSoft,borderRadius:10,padding:"0.85rem"}}>
              <div style={{color:C.green,fontWeight:600,fontSize:11,marginBottom:6}}>✓ STRENGTHS</div>
              {analysis.strengths?.map(s=><div key={s} style={{color:C.txt2,fontSize:12,marginBottom:3}}>• {s}</div>)}
            </div>
            <div style={{background:C.redSoft,borderRadius:10,padding:"0.85rem"}}>
              <div style={{color:C.red,fontWeight:600,fontSize:11,marginBottom:6}}>⚠ GAPS TO COVER</div>
              {analysis.gaps?.map(g=><div key={g} style={{color:C.txt2,fontSize:12,marginBottom:3}}>• {g}</div>)}
            </div>
          </div>
          <div style={{background:C.accentSoft,borderRadius:10,padding:"0.85rem",marginBottom:"1.25rem"}}>
            <div style={{color:C.accent,fontWeight:600,fontSize:11,marginBottom:6}}>🎯 TODAY'S FOCUS AREAS</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>{analysis.focus_areas?.map(f=><Badge key={f}>{f}</Badge>)}</div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between"}}>
            <Btn variant="ghost" onClick={()=>setStep(2)}>← Adjust</Btn>
            <Btn variant="success" onClick={()=>onBegin({role:finalRole,industry,seniority,analysis,voiceEnabled:canVoice})}>🚀 Start with Ava</Btn>
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

  // ── Speak question via TTS ──
  const speakText=useCallback((text,onEnd)=>{
    if(!config.voiceEnabled||!window.speechSynthesis)return onEnd?.();
    window.speechSynthesis.cancel();
    const utt=new SpeechSynthesisUtterance(text);
    utt.rate=0.88; utt.pitch=1.05; utt.volume=1;
    // Prefer a female voice
    const voices=window.speechSynthesis.getVoices();
    const fem=voices.find(v=>v.name.toLowerCase().includes("female")||v.name.includes("Samantha")||v.name.includes("Karen")||v.name.includes("Moira"));
    if(fem)utt.voice=fem;
    utt.onstart=()=>setAvaSpeaking(true);
    utt.onend=()=>{ setAvaSpeaking(false); onEnd?.(); };
    window.speechSynthesis.speak(utt);
  },[config.voiceEnabled]);

  // ── Ask question when question changes ──
  useEffect(()=>{
    if(!currentQ||loadingQ)return;
    setAnswer(""); setInterimTranscript(""); setFeedback(""); setCoachTip(""); setTimeLeft(120); setTimerActive(false);
    setAvaListening(false);
    setAvaMessage(`Question ${qIdx+1} of ${questions.length}`);
    speakText(currentQ,()=>{ setTimerActive(true); setAvaListening(true); setAvaMessage("I'm listening — take your time and answer confidently."); });
  },[qIdx,currentQ,loadingQ]);

  // ── Real-time Ava coaching tip as user types ──
  const coachDebounce=useRef(null);
  useEffect(()=>{
    if(answer.length<30||feedback)return;
    clearTimeout(coachDebounce.current);
    coachDebounce.current=setTimeout(async()=>{
      const stats=analyzeSpeech(answer);
      // Quick local tip — no API call
      if(stats.fillerRate>10) setCoachTip("💡 Tip from Ava: Try to reduce filler words — pause instead of saying 'um' or 'like'.");
      else if(stats.confidenceScore<55) setCoachTip("💡 Tip from Ava: Sound more confident — replace 'I think' with 'I would' or 'In my experience'.");
      else if(stats.wpm>185) setCoachTip("💡 Tip from Ava: You're speaking fast — slow down to let your ideas land.");
      else if(answer.split(/[.!?]/).filter(s=>s.trim()).length===1&&answer.length>80) setCoachTip("💡 Tip from Ava: Structure your answer — try the STAR method: Situation, Task, Action, Result.");
      else setCoachTip("");
    },1200);
    return()=>clearTimeout(coachDebounce.current);
  },[answer]);

  // ── Voice recording ──
  const toggleListen=()=>{
    if(!window.SpeechRecognition&&!window.webkitSpeechRecognition)return alert("Use Chrome or Edge for voice features");
    if(listening){ recognitionRef.current?.stop(); setListening(false); setInterimTranscript(""); return; }
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    const rec=new SR();
    rec.continuous=true; rec.interimResults=true; rec.lang="en-US";
    rec.onresult=e=>{
      let fin="",int="";
      for(let i=0;i<e.results.length;i++){ if(e.results[i].isFinal)fin+=e.results[i][0].transcript+" "; else int+=e.results[i][0].transcript; }
      if(fin)setAnswer(fin.trim()); setInterimTranscript(int);
    };
    rec.onend=()=>{ setListening(false); setInterimTranscript(""); };
    rec.start(); recognitionRef.current=rec; setListening(true);
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
        setAvaMessage(parsed.ava_feedback||"Good effort! Let's keep going.");
        speakText(parsed.ava_feedback||`You scored ${parsed.score} out of 100. ${parsed.verdict}`,()=>{});
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
    <div style={{padding:"1.5rem",maxWidth:960,margin:"0 auto",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
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
          <button onClick={()=>setShowAnalytics(s=>!s)} style={{
            background:showAnalytics?C.accentSoft:"transparent",border:`1px solid ${showAnalytics?C.accent:C.border}`,
            color:showAnalytics?C.accent:C.txt2,borderRadius:8,padding:"4px 11px",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>
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
              {config.voiceEnabled&&(
                <div style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      {listening&&<div style={{width:7,height:7,borderRadius:"50%",background:C.red,animation:"pulse 1s infinite"}}/>}
                      <span style={{color:C.txt2,fontSize:12}}>{listening?"Recording...":"Your answer"}</span>
                    </div>
                    <button onClick={toggleListen} style={{
                      display:"flex",alignItems:"center",gap:6,padding:"7px 16px",borderRadius:8,
                      border:`1px solid ${listening?C.red:C.accent}`,
                      background:listening?C.redSoft:C.accentSoft,
                      color:listening?C.red:C.accent,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>
                      {listening?"⏹ Stop":"🎙 Speak"}
                    </button>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:2,height:34,padding:"0 6px",background:C.elevated,borderRadius:8}}>
                    {waveBars.map((h,i)=>(
                      <div key={i} style={{flex:1,height:h,background:listening?C.accent:C.border,borderRadius:99,transition:listening?"height 0.08s":"height 0.5s",opacity:listening?0.7+i%3*0.1:0.4}}/>
                    ))}
                  </div>
                  {interimTranscript&&<div style={{fontSize:12,color:C.txt3,marginTop:5,fontStyle:"italic",padding:"4px 8px",background:C.elevated,borderRadius:6}}>{interimTranscript}</div>}
                </div>
              )}
              <textarea value={answer} onChange={e=>setAnswer(e.target.value)}
                placeholder={config.voiceEnabled?"Speak your answer or type here...":"Type your answer — structure, examples, outcomes..."}
                style={{width:"100%",minHeight:120,padding:"12px",background:C.elevated,border:`1px solid ${C.border}`,borderRadius:10,color:C.txt,fontSize:13,fontFamily:"inherit",resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.65}}/>
              {/* Live coaching tip from Ava */}
              {coachTip&&(
                <div style={{marginTop:8,padding:"8px 12px",background:C.accentSoft,border:`1px solid ${C.accent}33`,borderRadius:8,fontSize:12,color:C.txt2,display:"flex",gap:8,alignItems:"flex-start"}}>
                  <AvaAvatar speaking={false} listening={false} thinking={false} size={24}/>
                  <span>{coachTip}</span>
                </div>
              )}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10}}>
                <span style={{fontSize:11,color:C.txt3}}>{answer.trim().split(/\s+/).filter(Boolean).length} words</span>
                <div style={{display:"flex",gap:8}}>
                  <Btn variant="ghost" onClick={nextQuestion} style={{fontSize:12,padding:"7px 14px"}}>Skip →</Btn>
                  <Btn onClick={evaluateAnswer} disabled={!answer.trim()||loadingEval}>{loadingEval?"Ava is evaluating...":"Submit Answer →"}</Btn>
                </div>
              </div>
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
                {speech.wordCount>0&&<span style={{fontSize:10,color:C.txt3,marginLeft:"auto"}}>{speech.wordCount}w</span>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:"0.75rem"}}>
                {[["Clarity",speech.clarityScore],[" Confidence",speech.confidenceScore],["Vocabulary",speech.vocabularyScore]].map(([l,v])=>(
                  <div key={l}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.txt3,marginBottom:3}}>
                      <span>{l}</span><span style={{color:v>=75?C.green:v>=50?C.amber:C.red,fontWeight:600}}>{v}</span>
                    </div>
                    <div style={{height:4,background:C.border,borderRadius:99,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${v}%`,background:v>=75?C.green:v>=50?C.amber:C.red,borderRadius:99}}/>
                    </div>
                  </div>
                ))}
                <div>
                  <div style={{fontSize:10,color:C.txt3,marginBottom:3}}>Pace</div>
                  <div style={{fontSize:13,fontWeight:700,color:speech.paceColor}}>{speech.paceLabel}</div>
                  <div style={{fontSize:10,color:C.txt3}}>{speech.wpm>0?`~${speech.wpm} wpm`:""}</div>
                </div>
              </div>
              {speech.fillerCount>0?(
                <div style={{background:`${C.amber}10`,border:`1px solid ${C.amber}30`,borderRadius:8,padding:"0.6rem 0.8rem"}}>
                  <div style={{fontSize:11,color:C.amber,fontWeight:600,marginBottom:5}}>⚠ {speech.fillerCount} filler words</div>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {Object.entries(speech.fillerWords).slice(0,4).map(([w,n])=>(
                      <span key={w} style={{fontSize:10,padding:"1px 7px",borderRadius:99,background:`${C.amber}22`,color:C.amber}}>"{w}" ×{n}</span>
                    ))}
                  </div>
                </div>
              ):speech.wordCount>10?(
                <div style={{background:C.greenSoft,border:`1px solid ${C.green}30`,borderRadius:8,padding:"0.5rem 0.8rem",fontSize:11,color:C.green}}>✓ No filler words detected!</div>
              ):null}
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
        ava_closing:"You showed real potential today! Every interview is practice, and you're getting stronger. Come back tomorrow and let's work on the areas we identified. You've got this! 🌟",
      });
    }
    setLoading(false);
  };

  const speakAvaClosing=()=>{
    if(!report?.ava_closing||!window.speechSynthesis)return;
    window.speechSynthesis.cancel();
    const utt=new SpeechSynthesisUtterance(report.ava_closing);
    utt.rate=0.9; utt.pitch=1.05;
    const voices=window.speechSynthesis.getVoices();
    const fem=voices.find(v=>v.name.includes("Samantha")||v.name.includes("Karen")||v.name.toLowerCase().includes("female"));
    if(fem)utt.voice=fem;
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
    <div style={{padding:"2rem",maxWidth:820,margin:"0 auto",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
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
          {result.avgClarity!=null&&(
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

// ─── SCREEN: PRICING ─────────────────────────────────────────────────────────
function PricingScreen({user,onBack}){
  return(
    <div style={{padding:"2rem",maxWidth:900,margin:"0 auto",fontFamily:"'DM Sans','Segoe UI',sans-serif"}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:C.txt2,cursor:"pointer",fontSize:14,marginBottom:"1.5rem"}}>← Back</button>
      <h2 style={{color:C.txt,textAlign:"center",marginBottom:8,fontSize:24}}>Choose your plan</h2>
      <p style={{color:C.txt2,textAlign:"center",marginBottom:"2rem",fontSize:14}}>Upgrade anytime · Cancel anytime · Tokens reset monthly</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
        {Object.entries(PLANS).map(([key,plan])=>{
          const isCurrent=user.plan===key;
          const isPro=key==="pro";
          return(
            <div key={key} style={{background:C.card,border:`${isPro?2:1}px solid ${isPro?C.accent:isCurrent?C.borderHover:C.border}`,
              borderRadius:16,padding:"1.5rem",position:"relative"}}>
              {isPro&&<div style={{position:"absolute",top:-12,left:"50%",transform:"translateX(-50%)",
                background:C.accent,color:"#fff",fontSize:11,fontWeight:700,padding:"3px 12px",borderRadius:99,whiteSpace:"nowrap"}}>MOST POPULAR</div>}
              {isCurrent&&<div style={{position:"absolute",top:12,right:12}}><Badge color={C.green}>Current</Badge></div>}
              <div style={{color:plan.color,fontWeight:700,fontSize:16,marginBottom:4}}>{plan.name}</div>
              <div style={{color:C.txt,fontSize:28,fontWeight:800,marginBottom:4}}>
                {plan.price===null?"Custom":plan.price===0?"Free":`$${plan.price}`}
                {plan.price>0&&<span style={{fontSize:14,color:C.txt2,fontWeight:400}}>/mo</span>}
              </div>
              <div style={{borderTop:`1px solid ${C.border}`,margin:"14px 0",paddingTop:14}}>
                {[
                  `${plan.tokens===Infinity?"Unlimited":fmtN(plan.tokens)} tokens`,
                  `${plan.sessions===999?"Unlimited":plan.sessions} sessions`,
                  plan.voice?"✓ Voice + Ava coach":"✗ No voice",
                  key!=="free"?"✓ Full scorecard":"✓ Basic report",
                  key==="pro"||key==="enterprise"?"✓ Learning path":"",
                  key==="enterprise"?"✓ Team dashboard":"",
                ].filter(Boolean).map(f=>(
                  <div key={f} style={{fontSize:13,color:f.startsWith("✗")?C.txt3:C.txt2,marginBottom:6}}>{f}</div>
                ))}
              </div>
              <Btn variant={isCurrent?"ghost":isPro?"primary":"ghost"} disabled={isCurrent}
                style={{width:"100%"}} onClick={()=>!isCurrent&&window.open("https://stripe.com","_blank")}>
                {isCurrent?"Current plan":plan.price===null?"Contact us":"Upgrade →"}
              </Btn>
            </div>
          );
        })}
      </div>
      <div style={{marginTop:"2rem",padding:"1.5rem",background:C.card,borderRadius:12,border:`1px solid ${C.border}`}}>
        <h4 style={{color:C.txt,margin:"0 0 12px",fontSize:14}}>💡 Token top-ups — no plan change needed</h4>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {[["100K tokens","$2"],["500K tokens","$8"],["1M tokens","$14"]].map(([t,p])=>(
            <Btn key={t} variant="ghost" style={{fontSize:13}} onClick={()=>window.open("https://stripe.com","_blank")}>+ {t} for {p}</Btn>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── NAV ──────────────────────────────────────────────────────────────────────
function Nav({user,screen,onNav,onLogout}){
  const [profileOpen,setProfileOpen]=useState(false);
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
            color:screen===s?C.txt:C.txt2,cursor:"pointer",fontSize:13,fontFamily:"inherit",
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

        {/* Profile avatar — clickable */}
        <div style={{position:"relative"}}>
          <div onClick={()=>setProfileOpen(o=>!o)}
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
                    color:C.txt2,fontSize:13,cursor:"pointer",fontFamily:"inherit",
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
                    color:C.red,fontSize:13,cursor:"pointer",fontFamily:"inherit",
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
  // Always start on auth — never skip it
  const [screen,setScreen]=useState("auth");
  const [user,setUser]=useState(null);
  const [config,setConfig]=useState(null);
  const [result,setResult]=useState(null);

  const handleEnter=u=>{ setUser({...u,sessionsUsed:u.sessionsUsed||0}); setScreen("dashboard"); };
  const handleBegin=cfg=>{ setConfig(cfg); setUser(u=>({...u,tokensUsed:(u.tokensUsed||0)+3500})); setScreen("interview"); };
  const handleComplete=r=>{ setResult(r); setUser(u=>({...u,tokensUsed:(u.tokensUsed||0)+r.scores.length*1200+3000,sessionsUsed:(u.sessionsUsed||0)+1})); setScreen("report"); };
  const handleLogout=()=>{ setUser(null); setConfig(null); setResult(null); setScreen("auth"); };

  return(
    <div style={{fontFamily:"'DM Sans','Segoe UI',system-ui,sans-serif",background:C.bg,minHeight:"100vh",color:C.txt}}>
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
