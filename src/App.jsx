import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";

// ─── THEME CONTEXT ────────────────────────────────────────────────────────────
const ThemeContext = createContext();
const useTheme = () => useContext(ThemeContext);

// ─── DB (localStorage as SQLite-like store) ───────────────────────────────────
const DB = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } },
  set: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
  getObj: (key, def = {}) => { try { return JSON.parse(localStorage.getItem(key)) || def; } catch { return def; } },
  setObj: (key, val) => localStorage.setItem(key, JSON.stringify(val)),
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);

// ─── SEED DATA ────────────────────────────────────────────────────────────────
const seedRecipes = [
  {
    id: "seed1", name: "Tarte Tatin", description: "La classique tarte aux pommes caramélisées renversée.", portions: 6,
    category: "Dessert", tags: ["Classique", "Automne"], favorite: true, image: null, createdAt: Date.now() - 86400000,
    ingredients: [
      { id: "i1", name: "Pommes", qty: 1200, unit: "g" },
      { id: "i2", name: "Beurre", qty: 80, unit: "g" },
      { id: "i3", name: "Sucre", qty: 150, unit: "g" },
      { id: "i4", name: "Pâte feuilletée", qty: 1, unit: "unités" },
    ],
    steps: [
      { id: "s1", text: "Éplucher et couper les pommes en quartiers.", cookType: null, temp: null, flame: null, duration: 10 },
      { id: "s2", text: "Dans une poêle allant au four, faire fondre le beurre et le sucre jusqu'à obtenir un caramel doré.", cookType: "poele", temp: null, flame: 5, duration: 8 },
      { id: "s3", text: "Disposer les pommes dans le caramel et cuire 10 min.", cookType: "poele", temp: null, flame: 4, duration: 10 },
      { id: "s4", text: "Recouvrir de pâte feuilletée et enfourner.", cookType: "four", temp: 200, flame: null, duration: 25 },
    ]
  },
  {
    id: "seed2", name: "Poulet rôti citron-thym", description: "Un poulet juteux aux herbes fraîches.", portions: 4,
    category: "Plat", tags: ["Rôti", "Facile"], favorite: false, image: null, createdAt: Date.now() - 172800000,
    ingredients: [
      { id: "i5", name: "Poulet entier", qty: 1, unit: "unités" },
      { id: "i6", name: "Citron", qty: 2, unit: "unités" },
      { id: "i7", name: "Thym frais", qty: 4, unit: "c. à soupe" },
      { id: "i8", name: "Huile d'olive", qty: 3, unit: "c. à soupe" },
      { id: "i9", name: "Sel", qty: 10, unit: "g" },
    ],
    steps: [
      { id: "s5", text: "Préchauffer le four à 200°C. Frotter le poulet d'huile, sel, thym et jus de citron.", cookType: "four", temp: 200, flame: null, duration: 0 },
      { id: "s6", text: "Glisser les demi-citrons dans la cavité du poulet.", cookType: null, temp: null, flame: null, duration: 2 },
      { id: "s7", text: "Rôtir 60 minutes en arrosant toutes les 20 minutes.", cookType: "four", temp: 200, flame: null, duration: 60 },
    ]
  }
];

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, style = {} }) => {
  const icons = {
    home: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
    search: "M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
    plus: "M12 5v14M5 12h14",
    heart: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
    "heart-fill": "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z",
    trash: "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
    edit: "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
    back: "M19 12H5M12 19l-7-7 7-7",
    timer: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2",
    fire: "M12 22c4.97 0 9-3.582 9-8 0-3-2-5.5-4-7 .5 2-1 4-3 4.5C14 9 13 6 10 4c0 3-2 6-2 8 0 1.5.5 3 2 4-.5-1-.5-2 0-3 1 2 3 3 2 5z",
    check: "M20 6L9 17l-5-5",
    "check-circle": "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    tag: "M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z M7 7h.01",
    copy: "M20 9h-9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 0 2 2v1",
    export: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12",
    import: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3",
    settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
    sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42",
    moon: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
    chef: "M12 2a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4z M6 9h12l1 12H5L6 9z",
    cart: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0",
    x: "M18 6L6 18M6 6l12 12",
    image: "M21 9l-9-7-9 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9z M9 22V12h6v10",
    oven: "M3 3h18v18H3z M8 8h8v4H8z M8 15h2M12 15h2M16 15h.01",
    flame2: "M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z",
    nav_recipes: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    close: "M6 18L18 6M6 6l12 12",
    users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    play: "M5 3l14 9-14 9V3z",
    pause: "M6 4h4v16H6zM14 4h4v16h-4z",
    stop: "M4 4h16v16H4z",
    chevdown: "M6 9l6 6 6-6",
    chevup: "M18 15l-6-6-6 6",
  };
  const d = icons[name] || icons.home;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      {d.split(" M").map((seg, i) => (
        <path key={i} d={(i === 0 ? "" : "M") + seg} />
      ))}
    </svg>
  );
};

// ─── TIMER HOOK ────────────────────────────────────────────────────────────────
function useTimer(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const ref = useRef(null);
  const reset = useCallback((s) => { clearInterval(ref.current); setSeconds(s); setRunning(false); setFinished(false); }, []);
  const start = useCallback(() => setRunning(true), []);
  const pause = useCallback(() => setRunning(false), []);
  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => setSeconds(s => {
        if (s <= 1) { clearInterval(ref.current); setRunning(false); setFinished(true); return 0; }
        return s - 1;
      }), 1000);
    } else clearInterval(ref.current);
    return () => clearInterval(ref.current);
  }, [running]);
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return { seconds, running, finished, start, pause, reset, fmt };
}

// ─── UNIT LABELS ──────────────────────────────────────────────────────────────
const UNITS = ["g", "mL", "unités", "c. à café", "c. à soupe"];
const CATEGORIES = ["Entrée", "Plat", "Dessert", "Boisson", "Snack", "Petit-déjeuner", "Sauce", "Autre"];

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const GlobalStyles = ({ dark }) => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;0,9..144,700;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
    :root {
      --bg: ${dark ? "#0f0f12" : "#f7f5f0"};
      --bg2: ${dark ? "#18181c" : "#ffffff"};
      --bg3: ${dark ? "#222228" : "#efe9e0"};
      --card: ${dark ? "#1e1e24" : "#ffffff"};
      --border: ${dark ? "#2e2e38" : "#e4ddd4"};
      --text: ${dark ? "#f0ede8" : "#1a1612"};
      --text2: ${dark ? "#9994a0" : "#7a7068"};
      --text3: ${dark ? "#6a6478" : "#a09888"};
      --accent: #e8501a;
      --accent2: #f5a623;
      --accent3: ${dark ? "#3d3d4f" : "#f0e8dc"};
      --green: #2d9e6b;
      --red: #d94040;
      --shadow: ${dark ? "0 4px 24px rgba(0,0,0,.5)" : "0 4px 24px rgba(0,0,0,.08)"};
      --shadow-sm: ${dark ? "0 2px 8px rgba(0,0,0,.4)" : "0 2px 8px rgba(0,0,0,.06)"};
      --r: 16px; --r-sm: 10px; --r-lg: 24px;
      --font-display: 'Fraunces', Georgia, serif;
      --font-body: 'DM Sans', system-ui, sans-serif;
    }
    html, body, #root { height: 100%; background: var(--bg); color: var(--text); font-family: var(--font-body); }
    body { overflow: hidden; }
    input, textarea, select { font-family: var(--font-body); }
    button { cursor: pointer; font-family: var(--font-body); }
    ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
    .scroll { overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; }
    @keyframes fadeUp { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform: translateY(0); } }
    @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
    @keyframes scaleIn { from { transform:scale(.92); opacity:0; } to { transform:scale(1); opacity:1; } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.5; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes timerPulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.04);} }
    .anim-fade-up { animation: fadeUp .35s cubic-bezier(.22,1,.36,1) both; }
    .anim-scale { animation: scaleIn .25s cubic-bezier(.22,1,.36,1) both; }
    .btn { display:flex; align-items:center; justify-content:center; gap:6px; border:none; outline:none;
      border-radius: var(--r-sm); padding: 10px 18px; font-size: 14px; font-weight: 500;
      transition: all .18s; user-select:none; }
    .btn:active { transform: scale(.96); }
    .btn-primary { background:var(--accent); color:#fff; }
    .btn-primary:hover { filter:brightness(1.08); }
    .btn-ghost { background:transparent; color:var(--text); }
    .btn-ghost:hover { background:var(--bg3); }
    .btn-outline { background:transparent; border:1.5px solid var(--border); color:var(--text2); }
    .btn-outline:hover { border-color:var(--accent); color:var(--accent); }
    .btn-sm { padding: 7px 12px; font-size:13px; }
    .btn-icon { width:40px; height:40px; padding:0; border-radius:12px; }
    .input { width:100%; padding:11px 14px; border-radius:var(--r-sm); border:1.5px solid var(--border);
      background:var(--bg3); color:var(--text); font-size:14px; outline:none; transition:.18s;
      -webkit-appearance:none; }
    .input:focus { border-color:var(--accent); background:var(--bg2); }
    .input::placeholder { color:var(--text3); }
    .select { appearance:none; -webkit-appearance:none; }
    .chip { display:inline-flex; align-items:center; gap:4px; padding:4px 10px; border-radius:99px;
      font-size:12px; font-weight:500; background:var(--bg3); color:var(--text2); border:1px solid var(--border);
      cursor:pointer; transition:.18s; white-space:nowrap; }
    .chip.active { background:var(--accent); color:#fff; border-color:var(--accent); }
    .chip:hover:not(.active) { border-color:var(--accent); color:var(--accent); }
    .card { background:var(--card); border-radius:var(--r); box-shadow:var(--shadow-sm); border:1px solid var(--border); }
    .overlay { position:fixed; inset:0; background:rgba(0,0,0,.55); backdrop-filter:blur(4px); z-index:100; animation:fadeIn .2s; }
    .sheet { position:fixed; bottom:0; left:0; right:0; background:var(--card); border-radius:28px 28px 0 0;
      z-index:101; max-height:92vh; display:flex; flex-direction:column; animation:slideUp .28s cubic-bezier(.22,1,.36,1); box-shadow: 0 -8px 40px rgba(0,0,0,.18); }
    .sheet-handle { width:36px; height:4px; background:var(--border); border-radius:4px; margin:10px auto 4px; flex-shrink:0; }
    .badge { display:inline-flex; align-items:center; justify-content:center; min-width:20px; height:20px;
      padding:0 6px; border-radius:99px; font-size:11px; font-weight:700; background:var(--accent); color:#fff; }
    .divider { height:1px; background:var(--border); margin:8px 0; }
    .label { font-size:12px; font-weight:600; color:var(--text2); text-transform:uppercase; letter-spacing:.06em; margin-bottom:6px; }
  `}</style>
);

// ─── TOAST ────────────────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2400); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position:"fixed", bottom:90, left:"50%", transform:"translateX(-50%)", zIndex:999,
      background:"var(--text)", color:"var(--bg)", padding:"10px 20px", borderRadius:99,
      fontSize:14, fontWeight:500, whiteSpace:"nowrap", boxShadow:"0 4px 20px rgba(0,0,0,.25)",
      animation:"fadeUp .25s both" }}>{msg}</div>
  );
}

// ─── MODAL SHEET ──────────────────────────────────────────────────────────────
function Sheet({ title, onClose, children, actions }) {
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          padding:"8px 20px 12px" }}>
          <h2 style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:500 }}>{title}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <div className="scroll" style={{ flex:1, padding:"0 20px 24px" }}>{children}</div>
        {actions && <div style={{ padding:"12px 20px 28px", borderTop:"1px solid var(--border)", display:"flex", gap:10 }}>{actions}</div>}
      </div>
    </>
  );
}

// ─── CONFIRM DIALOG ───────────────────────────────────────────────────────────
function Confirm({ msg, onOk, onCancel }) {
  return (
    <>
      <div className="overlay" onClick={onCancel} />
      <div className="sheet" style={{ maxHeight:"auto", bottom:"40%" }}>
        <div className="sheet-handle" />
        <div style={{ padding:"8px 24px 24px", display:"flex", flexDirection:"column", gap:16 }}>
          <p style={{ fontSize:15, color:"var(--text)", textAlign:"center" }}>{msg}</p>
          <div style={{ display:"flex", gap:10 }}>
            <button className="btn btn-outline" style={{ flex:1 }} onClick={onCancel}>Annuler</button>
            <button className="btn btn-primary" style={{ flex:1, background:"var(--red)" }} onClick={onOk}>Supprimer</button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── TIMER WIDGET ─────────────────────────────────────────────────────────────
function TimerWidget({ minutes, stepText, onClose }) {
  const total = minutes * 60;
  const timer = useTimer(total);
  useEffect(() => { timer.reset(total); }, [total]);
  const progress = total > 0 ? (timer.seconds / total) * 100 : 0;
  const r = 52, circ = 2 * Math.PI * r;

  useEffect(() => {
    if (timer.finished && "Notification" in window && Notification.permission === "granted")
      new Notification("⏰ Minuteur terminé !", { body: stepText });
  }, [timer.finished]);

  return (
    <div style={{ position:"fixed", bottom:100, right:16, zIndex:200, background:"var(--card)",
      border:"1px solid var(--border)", borderRadius:var_r(20), padding:20, width:180,
      boxShadow:"var(--shadow)", animation:"scaleIn .25s both" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <span style={{ fontSize:12, color:"var(--text2)", fontWeight:500 }}>Minuteur</span>
        <button className="btn btn-ghost" style={{ padding:2, borderRadius:6 }} onClick={onClose}>
          <Icon name="close" size={14} />
        </button>
      </div>
      <div style={{ display:"flex", justifyContent:"center", margin:"12px 0" }}>
        <svg width={120} height={120} style={{ transform:"rotate(-90deg)" }}>
          <circle cx={60} cy={60} r={r} fill="none" stroke="var(--border)" strokeWidth={6} />
          <circle cx={60} cy={60} r={r} fill="none" stroke={timer.finished ? "var(--green)" : "var(--accent)"}
            strokeWidth={6} strokeDasharray={circ} strokeDashoffset={circ * (1 - progress / 100)}
            strokeLinecap="round" style={{ transition:"stroke-dashoffset .5s", animation: timer.running ? "timerPulse 1s infinite" : "none" }} />
          <text x={60} y={60} textAnchor="middle" dominantBaseline="middle"
            style={{ fontSize:22, fontWeight:700, fontFamily:"var(--font-body)", fill:"var(--text)", transform:"rotate(90deg)", transformOrigin:"60px 60px" }}>
            {timer.fmt(timer.seconds)}
          </text>
        </svg>
      </div>
      <div style={{ display:"flex", gap:8 }}>
        {!timer.running && !timer.finished &&
          <button className="btn btn-primary" style={{ flex:1 }} onClick={timer.start}><Icon name="play" size={14} /> Démarrer</button>}
        {timer.running &&
          <button className="btn btn-outline" style={{ flex:1 }} onClick={timer.pause}><Icon name="pause" size={14} /> Pause</button>}
        {timer.finished &&
          <button className="btn" style={{ flex:1, background:"var(--green)", color:"#fff" }}><Icon name="check" size={14} /> Terminé !</button>}
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => timer.reset(total)}><Icon name="stop" size={14} /></button>
      </div>
    </div>
  );
}
function var_r(n) { return `${n}px`; }

// ─── RECIPE CARD ──────────────────────────────────────────────────────────────
function RecipeCard({ recipe, onClick, onFav, onDelete, onDuplicate, style }) {
  const [longPress, setLongPress] = useState(false);
  const lpRef = useRef(null);
  const startPress = () => { lpRef.current = setTimeout(() => setLongPress(true), 500); };
  const endPress = () => { clearTimeout(lpRef.current); };

  const catColors = { Dessert:"#e85d75", Plat:"#3b82f6", Entrée:"#10b981", Boisson:"#8b5cf6",
    Snack:"#f59e0b", "Petit-déjeuner":"#f97316", Sauce:"#ec4899", Autre:"#6b7280" };
  const color = catColors[recipe.category] || "#6b7280";

  return (
    <>
      {longPress && (
        <>
          <div className="overlay" onClick={() => setLongPress(false)} />
          <div className="sheet" style={{ maxHeight:"auto" }}>
            <div className="sheet-handle" />
            <div style={{ padding:"8px 20px 28px", display:"flex", flexDirection:"column", gap:4 }}>
              <p style={{ fontFamily:"var(--font-display)", fontSize:18, fontWeight:500, marginBottom:8 }}>{recipe.name}</p>
              {[
                { icon:"edit", label:"Modifier", action:() => { setLongPress(false); onClick(recipe, true); } },
                { icon:"copy", label:"Dupliquer", action:() => { onDuplicate(recipe); setLongPress(false); } },
                { icon:"heart", label:recipe.favorite ? "Retirer des favoris" : "Ajouter aux favoris", action:() => { onFav(recipe.id); setLongPress(false); } },
                { icon:"trash", label:"Supprimer", action:() => { onDelete(recipe.id); setLongPress(false); }, danger:true },
              ].map(({ icon, label, action, danger }) => (
                <button key={label} onClick={action} className="btn btn-ghost"
                  style={{ justifyContent:"flex-start", gap:14, color: danger ? "var(--red)" : "var(--text)", padding:"13px 8px" }}>
                  <Icon name={icon} size={18} />
                  <span style={{ fontSize:15 }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      <div className="card anim-fade-up" onClick={() => onClick(recipe)} onTouchStart={startPress} onTouchEnd={endPress}
        onMouseDown={startPress} onMouseUp={endPress}
        style={{ cursor:"pointer", overflow:"hidden", transition:"transform .18s, box-shadow .18s", ...style }}
        onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
        onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
        <div style={{ height:6, background:`linear-gradient(90deg, ${color}, ${color}88)` }} />
        <div style={{ padding:"14px 16px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8 }}>
            <h3 style={{ fontFamily:"var(--font-display)", fontSize:17, fontWeight:500, lineHeight:1.3, flex:1 }}>{recipe.name}</h3>
            <button onClick={e => { e.stopPropagation(); onFav(recipe.id); }}
              className="btn btn-ghost" style={{ padding:4, borderRadius:8, color: recipe.favorite ? "#e85d75" : "var(--text3)", flexShrink:0 }}>
              <Icon name={recipe.favorite ? "heart-fill" : "heart"} size={18} style={{ fill: recipe.favorite ? "#e85d75" : "none" }} />
            </button>
          </div>
          {recipe.description && <p style={{ fontSize:13, color:"var(--text2)", marginTop:4, lineHeight:1.5,
            overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{recipe.description}</p>}
          <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap", alignItems:"center" }}>
            <span className="chip" style={{ borderColor:`${color}55`, color, background:`${color}15` }}>{recipe.category}</span>
            <span className="chip"><Icon name="users" size={11} /> {recipe.portions} pers.</span>
            <span className="chip"><Icon name="list" size={11} /> {recipe.ingredients.length} ingr.</span>
            {recipe.tags?.slice(0,2).map(t => <span key={t} className="chip"><Icon name="tag" size={10}/> {t}</span>)}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── INGREDIENT ROW ───────────────────────────────────────────────────────────
function IngredientRow({ ing, basePortions, currentPortions, onLongPress }) {
  const ratio = currentPortions / (basePortions || 1);
  const qty = ing.qty * ratio;
  const display = qty % 1 === 0 ? qty : +qty.toFixed(2);
  const [pressed, setPressed] = useState(false);
  const lpRef = useRef(null);
  const start = () => { lpRef.current = setTimeout(() => { setPressed(false); onLongPress(ing); }, 600); };
  const end = () => clearTimeout(lpRef.current);
  return (
    <div onTouchStart={start} onTouchEnd={end} onMouseDown={start} onMouseUp={end}
      style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
        padding:"10px 0", borderBottom:"1px solid var(--border)", gap:8, userSelect:"none" }}>
      <span style={{ fontSize:14, color:"var(--text)" }}>{ing.name}</span>
      <span style={{ fontSize:14, fontWeight:600, color:"var(--accent)", whiteSpace:"nowrap" }}>
        {display} <span style={{ fontWeight:400, color:"var(--text2)", fontSize:12 }}>{ing.unit}</span>
      </span>
    </div>
  );
}

// ─── RECIPE EDITOR ────────────────────────────────────────────────────────────
function RecipeEditor({ recipe: initial, onSave, onClose }) {
  const emptyRecipe = { id: uid(), name:"", description:"", portions:4, category:"Plat",
    tags:[], favorite:false, image:null, ingredients:[], steps:[], createdAt:Date.now() };
  const [rec, setRec] = useState(initial ? { ...initial } : emptyRecipe);
  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState({});

  const set = (k, v) => setRec(r => ({ ...r, [k]: v }));

  // Ingredients
  const addIng = () => set("ingredients", [...rec.ingredients,
    { id: uid(), name:"", qty:0, unit:"g" }]);
  const updIng = (id, k, v) => set("ingredients", rec.ingredients.map(i => i.id === id ? { ...i, [k]: v } : i));
  const delIng = (id) => set("ingredients", rec.ingredients.filter(i => i.id !== id));

  // Steps
  const addStep = () => set("steps", [...rec.steps,
    { id: uid(), text:"", cookType:null, temp:null, flame:null, duration:0 }]);
  const updStep = (id, k, v) => set("steps", rec.steps.map(s => s.id === id ? { ...s, [k]: v } : s));
  const delStep = (id) => set("steps", rec.steps.filter(s => s.id !== id));

  const handleImage = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set("image", ev.target.result);
    reader.readAsDataURL(file);
  };

  const submit = () => {
    const errs = {};
    if (!rec.name.trim()) errs.name = "Le nom est requis";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(rec);
  };

  return (
    <Sheet title={initial ? "Modifier la recette" : "Nouvelle recette"} onClose={onClose}
      actions={<>
        <button className="btn btn-outline" style={{ flex:1 }} onClick={onClose}>Annuler</button>
        <button className="btn btn-primary" style={{ flex:1 }} onClick={submit}>
          <Icon name="check" size={16} /> Enregistrer
        </button>
      </>}>
      <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
        {/* Image */}
        <div style={{ position:"relative", height:120, borderRadius:"var(--r)", overflow:"hidden",
          background:"var(--bg3)", border:"1.5px dashed var(--border)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          {rec.image
            ? <img src={rec.image} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt="" />
            : <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, color:"var(--text3)" }}>
                <Icon name="image" size={28} />
                <span style={{ fontSize:13 }}>Ajouter une photo</span>
              </div>}
          <input type="file" accept="image/*" onChange={handleImage}
            style={{ position:"absolute", inset:0, opacity:0, cursor:"pointer" }} />
        </div>

        {/* Name */}
        <div>
          <div className="label">Nom *</div>
          <input className="input" placeholder="Ex : Tarte aux pommes" value={rec.name}
            onChange={e => set("name", e.target.value)} style={errors.name ? { borderColor:"var(--red)" } : {}} />
          {errors.name && <p style={{ color:"var(--red)", fontSize:12, marginTop:4 }}>{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <div className="label">Description</div>
          <textarea className="input" placeholder="Courte description…" value={rec.description}
            onChange={e => set("description", e.target.value)}
            style={{ resize:"vertical", minHeight:72 }} />
        </div>

        {/* Portions + Category */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div>
            <div className="label">Portions</div>
            <input className="input" type="number" min={1} value={rec.portions}
              onChange={e => set("portions", +e.target.value || 1)} />
          </div>
          <div>
            <div className="label">Catégorie</div>
            <select className="input select" value={rec.category} onChange={e => set("category", e.target.value)}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <div className="label">Tags</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
            {rec.tags.map(t => (
              <span key={t} className="chip active" onClick={() => set("tags", rec.tags.filter(x => x !== t))}>
                {t} <Icon name="x" size={10} />
              </span>
            ))}
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <input className="input" placeholder="Ajouter un tag…" value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newTag.trim()) { set("tags", [...rec.tags, newTag.trim()]); setNewTag(""); }}} />
            <button className="btn btn-outline" style={{ flexShrink:0 }}
              onClick={() => { if (newTag.trim()) { set("tags", [...rec.tags, newTag.trim()]); setNewTag(""); } }}>
              <Icon name="plus" size={16} />
            </button>
          </div>
        </div>

        <div className="divider" />

        {/* Ingredients */}
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div className="label" style={{ marginBottom:0 }}>Ingrédients</div>
            <button className="btn btn-outline btn-sm" onClick={addIng}><Icon name="plus" size={14}/> Ajouter</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {rec.ingredients.map((ing, idx) => (
              <div key={ing.id} style={{ display:"grid", gridTemplateColumns:"1fr 72px 92px 36px", gap:6, alignItems:"center" }}>
                <input className="input" placeholder={`Ingrédient ${idx+1}`} value={ing.name}
                  onChange={e => updIng(ing.id, "name", e.target.value)} style={{ fontSize:13, padding:"8px 10px" }} />
                <input className="input" type="number" min={0} step="any" placeholder="Qté" value={ing.qty || ""}
                  onChange={e => updIng(ing.id, "qty", parseFloat(e.target.value) || 0)} style={{ fontSize:13, padding:"8px 8px" }} />
                <select className="input select" value={ing.unit} onChange={e => updIng(ing.id, "unit", e.target.value)}
                  style={{ fontSize:12, padding:"8px 6px" }}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
                <button className="btn btn-ghost" style={{ padding:6, color:"var(--red)", borderRadius:8 }}
                  onClick={() => delIng(ing.id)}><Icon name="trash" size={14}/></button>
              </div>
            ))}
            {rec.ingredients.length === 0 &&
              <p style={{ fontSize:13, color:"var(--text3)", textAlign:"center", padding:"12px 0" }}>Aucun ingrédient — cliquez sur Ajouter</p>}
          </div>
        </div>

        <div className="divider" />

        {/* Steps */}
        <div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
            <div className="label" style={{ marginBottom:0 }}>Étapes</div>
            <button className="btn btn-outline btn-sm" onClick={addStep}><Icon name="plus" size={14}/> Ajouter</button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {rec.steps.map((step, idx) => (
              <div key={step.id} className="card" style={{ padding:"12px 14px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <span style={{ fontWeight:600, color:"var(--accent)", fontSize:13 }}>Étape {idx+1}</span>
                  <button className="btn btn-ghost" style={{ padding:4, color:"var(--red)" }} onClick={() => delStep(step.id)}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
                <textarea className="input" placeholder="Description de l'étape…" value={step.text}
                  onChange={e => updStep(step.id, "text", e.target.value)}
                  style={{ resize:"vertical", minHeight:60, marginBottom:8 }} />
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                  <div>
                    <div className="label">Cuisson</div>
                    <select className="input select" value={step.cookType || ""} onChange={e => updStep(step.id, "cookType", e.target.value || null)}
                      style={{ fontSize:13 }}>
                      <option value="">Aucune</option>
                      <option value="four">🔥 Four</option>
                      <option value="poele">🍳 Poêle</option>
                      <option value="autre">💡 Autre</option>
                    </select>
                  </div>
                  <div>
                    <div className="label">Durée (min)</div>
                    <input className="input" type="number" min={0} value={step.duration || ""}
                      onChange={e => updStep(step.id, "duration", +e.target.value || 0)}
                      style={{ fontSize:13 }} />
                  </div>
                  {step.cookType === "four" && (
                    <div>
                      <div className="label">Température (°C)</div>
                      <input className="input" type="number" step={5} value={step.temp || ""}
                        onChange={e => updStep(step.id, "temp", +e.target.value || null)} style={{ fontSize:13 }} />
                    </div>
                  )}
                  {step.cookType === "poele" && (
                    <div>
                      <div className="label">Feu (1–9)</div>
                      <input className="input" type="number" min={1} max={9} value={step.flame || ""}
                        onChange={e => updStep(step.id, "flame", +e.target.value || null)} style={{ fontSize:13 }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
            {rec.steps.length === 0 &&
              <p style={{ fontSize:13, color:"var(--text3)", textAlign:"center", padding:"12px 0" }}>Aucune étape — cliquez sur Ajouter</p>}
          </div>
        </div>
      </div>
    </Sheet>
  );
}

// ─── RECIPE DETAIL ────────────────────────────────────────────────────────────
function RecipeDetail({ recipe: initialRecipe, allRecipes, onClose, onEdit, onAddToCart, toast }) {
  const [portions, setPortions] = useState(initialRecipe.portions);
  const [activeTimer, setActiveTimer] = useState(null);
  const [cookMode, setCookMode] = useState(false);
  const [cookStep, setCookStep] = useState(0);
  const recipe = allRecipes.find(r => r.id === initialRecipe.id) || initialRecipe;

  const cookTypes = { four:"🔥 Four", poele:"🍳 Poêle", autre:"💡 Autre" };

  if (cookMode) {
    const step = recipe.steps[cookStep];
    return (
      <div style={{ position:"fixed", inset:0, background:"var(--bg)", zIndex:50, display:"flex",
        flexDirection:"column", padding:0 }}>
        <div style={{ padding:"16px 20px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button className="btn btn-ghost" onClick={() => setCookMode(false)} style={{ gap:6 }}>
            <Icon name="close" size={18} /> Quitter
          </button>
          <span style={{ fontFamily:"var(--font-display)", fontSize:16 }}>{recipe.name}</span>
          <span style={{ fontSize:13, color:"var(--text2)" }}>{cookStep+1}/{recipe.steps.length}</span>
        </div>
        <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"20px", gap:16, overflowY:"auto" }}>
          <div style={{ background:"var(--accent)", color:"#fff", width:44, height:44,
            borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"var(--font-display)", fontSize:22, fontWeight:500 }}>{cookStep+1}</div>
          {step.cookType && (
            <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
              <span className="chip" style={{ background:"var(--accent3)", borderColor:"var(--accent)", color:"var(--accent)" }}>
                {cookTypes[step.cookType]}
                {step.cookType === "four" && step.temp ? ` — ${step.temp}°C` : ""}
                {step.cookType === "poele" && step.flame ? ` — Feu ${step.flame}/9` : ""}
              </span>
              {step.duration > 0 && <span className="chip">{step.duration} min</span>}
            </div>
          )}
          <p style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:300, lineHeight:1.6, color:"var(--text)" }}>
            {step.text}
          </p>
          {step.duration > 0 && (
            <button className="btn btn-primary" style={{ alignSelf:"flex-start" }}
              onClick={() => setActiveTimer({ minutes: step.duration, text: step.text })}>
              <Icon name="timer" size={16} /> Lancer le minuteur ({step.duration} min)
            </button>
          )}
        </div>
        <div style={{ padding:"16px 20px 32px", display:"flex", gap:12, borderTop:"1px solid var(--border)" }}>
          <button className="btn btn-outline" style={{ flex:1 }} disabled={cookStep === 0}
            onClick={() => setCookStep(s => s-1)}>
            <Icon name="back" size={16} /> Précédent
          </button>
          {cookStep < recipe.steps.length - 1
            ? <button className="btn btn-primary" style={{ flex:1 }} onClick={() => setCookStep(s => s+1)}>
                Suivant <Icon name="back" size={16} style={{ transform:"rotate(180deg)" }} />
              </button>
            : <button className="btn" style={{ flex:1, background:"var(--green)", color:"#fff" }}
                onClick={() => setCookMode(false)}>
                <Icon name="check" size={16} /> Terminé !
              </button>}
        </div>
        {activeTimer && <TimerWidget minutes={activeTimer.minutes} stepText={activeTimer.text} onClose={() => setActiveTimer(null)} />}
      </div>
    );
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"var(--bg)", zIndex:50, display:"flex",
      flexDirection:"column", overflowY:"auto" }}>
      {/* Header image */}
      <div style={{ height:200, position:"relative", background:"var(--bg3)", flexShrink:0 }}>
        {recipe.image
          ? <img src={recipe.image} style={{ width:"100%", height:"100%", objectFit:"cover" }} alt={recipe.name} />
          : <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center",
              background:`linear-gradient(135deg, var(--bg3), var(--border))` }}>
              <Icon name="chef" size={56} style={{ color:"var(--border)", opacity:.6 }} />
            </div>}
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, rgba(0,0,0,.15) 0%, rgba(0,0,0,.6) 100%)" }} />
        <button className="btn" onClick={onClose}
          style={{ position:"absolute", top:16, left:16, background:"rgba(0,0,0,.4)", color:"#fff",
            backdropFilter:"blur(8px)", borderRadius:12, padding:"8px 14px" }}>
          <Icon name="back" size={16} /> Retour
        </button>
        <button className="btn" onClick={() => onEdit(recipe)}
          style={{ position:"absolute", top:16, right:16, background:"rgba(0,0,0,.4)", color:"#fff",
            backdropFilter:"blur(8px)", borderRadius:12, padding:"8px 14px" }}>
          <Icon name="edit" size={16} />
        </button>
      </div>

      <div style={{ padding:"20px 20px 120px" }}>
        {/* Title & meta */}
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:8 }}>
            <span className="chip">{recipe.category}</span>
            {recipe.tags?.map(t => <span key={t} className="chip"><Icon name="tag" size={10}/> {t}</span>)}
          </div>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:28, fontWeight:500, lineHeight:1.2 }}>{recipe.name}</h1>
          {recipe.description && <p style={{ fontSize:14, color:"var(--text2)", marginTop:6, lineHeight:1.6 }}>{recipe.description}</p>}
        </div>

        {/* Mode cuisine */}
        {recipe.steps.length > 0 && (
          <button className="btn btn-primary" style={{ width:"100%", marginBottom:16, padding:"13px" }}
            onClick={() => { setCookMode(true); setCookStep(0); }}>
            <Icon name="chef" size={18} /> Mode cuisine
          </button>
        )}

        {/* Portions slider */}
        <div className="card" style={{ padding:"14px 16px", marginBottom:16 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontFamily:"var(--font-display)", fontSize:16 }}>Portions</span>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <button className="btn btn-ghost" style={{ padding:6, borderRadius:8, border:"1px solid var(--border)" }}
                onClick={() => setPortions(p => Math.max(1, p-1))}>−</button>
              <span style={{ fontWeight:700, fontSize:18, minWidth:24, textAlign:"center" }}>{portions}</span>
              <button className="btn btn-ghost" style={{ padding:6, borderRadius:8, border:"1px solid var(--border)" }}
                onClick={() => setPortions(p => p+1)}>+</button>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:19, fontWeight:500, marginBottom:4 }}>
              Ingrédients <span style={{ fontSize:14, color:"var(--text2)", fontFamily:"var(--font-body)" }}>
                (appui long → liste de courses)
              </span>
            </h2>
            {recipe.ingredients.map(ing => (
              <IngredientRow key={ing.id} ing={ing} basePortions={recipe.portions}
                currentPortions={portions} onLongPress={(i) => { onAddToCart(i, recipe.portions, portions); toast(`"${i.name}" ajouté à la liste`); }} />
            ))}
          </div>
        )}

        {/* Steps */}
        {recipe.steps.length > 0 && (
          <div>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:19, fontWeight:500, marginBottom:12 }}>Préparation</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {recipe.steps.map((step, idx) => (
                <div key={step.id} className="card" style={{ padding:"14px 16px" }}>
                  <div style={{ display:"flex", gap:12, alignItems:"flex-start" }}>
                    <div style={{ width:28, height:28, borderRadius:9, background:"var(--accent)", color:"#fff",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:"var(--font-display)", fontWeight:500, fontSize:14, flexShrink:0 }}>{idx+1}</div>
                    <div style={{ flex:1 }}>
                      {step.cookType && (
                        <div style={{ display:"flex", gap:8, marginBottom:6, flexWrap:"wrap" }}>
                          <span className="chip" style={{ color:"var(--accent)", borderColor:"var(--accent)", background:"var(--accent3)" }}>
                            {cookTypes[step.cookType]}
                            {step.cookType === "four" && step.temp ? ` ${step.temp}°C` : ""}
                            {step.cookType === "poele" && step.flame ? ` Feu ${step.flame}/9` : ""}
                          </span>
                        </div>
                      )}
                      <p style={{ fontSize:14, lineHeight:1.6, color:"var(--text)" }}>{step.text}</p>
                      {step.duration > 0 && (
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:10 }}>
                          <span style={{ fontSize:13, color:"var(--text2)" }}>
                            <Icon name="timer" size={13} style={{ verticalAlign:"middle", marginRight:4 }} />
                            {step.duration} min
                          </span>
                          <button className="btn btn-outline btn-sm"
                            onClick={() => setActiveTimer({ minutes: step.duration, text: step.text })}>
                            <Icon name="play" size={13} /> Minuteur
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {activeTimer && <TimerWidget minutes={activeTimer.minutes} stepText={activeTimer.text} onClose={() => setActiveTimer(null)} />}
    </div>
  );
}

// ─── SHOPPING LIST ────────────────────────────────────────────────────────────
function ShoppingList({ items, onUpdate }) {
  const [newItem, setNewItem] = useState("");
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const sorted = [...items].sort((a, b) => (a.checked ? 1 : 0) - (b.checked ? 1 : 0));

  const add = () => {
    if (!newItem.trim()) return;
    onUpdate([...items, { id: uid(), name: newItem.trim(), qty: "", unit: "", checked: false }]);
    setNewItem("");
  };

  const toggle = (id) => onUpdate(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
  const remove = (id) => onUpdate(items.filter(i => i.id !== id));
  const clearDone = () => onUpdate(items.filter(i => !i.checked));
  const done = items.filter(i => i.checked).length;

  return (
    <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"0 16px 12px", flexShrink:0 }}>
        <div style={{ display:"flex", gap:8 }}>
          <input className="input" placeholder="Ajouter un élément…" value={newItem}
            onChange={e => setNewItem(e.target.value)}
            onKeyDown={e => e.key === "Enter" && add()} />
          <button className="btn btn-primary" style={{ flexShrink:0 }} onClick={add}>
            <Icon name="plus" size={18} />
          </button>
        </div>
        {done > 0 && (
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:10 }}>
            <span style={{ fontSize:13, color:"var(--text2)" }}>{done} / {items.length} coché{done>1?"s":""}</span>
            <button className="btn btn-ghost btn-sm" style={{ color:"var(--red)" }} onClick={clearDone}>
              <Icon name="trash" size={14}/> Effacer coché{done>1?"s":""}
            </button>
          </div>
        )}
      </div>
      <div className="scroll" style={{ flex:1, padding:"0 16px 24px" }}>
        {sorted.length === 0 && (
          <div style={{ textAlign:"center", padding:"40px 0", color:"var(--text3)" }}>
            <Icon name="cart" size={40} style={{ opacity:.3 }} />
            <p style={{ marginTop:12, fontSize:14 }}>Liste vide</p>
          </div>
        )}
        {sorted.map(item => (
          <div key={item.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"11px 0",
            borderBottom:"1px solid var(--border)", opacity: item.checked ? .45 : 1, transition:".2s" }}>
            <button onClick={() => toggle(item.id)}
              style={{ width:24, height:24, borderRadius:7, border:`2px solid ${item.checked ? "var(--green)" : "var(--border)"}`,
                background: item.checked ? "var(--green)" : "transparent",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, cursor:"pointer",
                transition:".18s" }}>
              {item.checked && <Icon name="check" size={12} style={{ color:"#fff" }} />}
            </button>
            <div style={{ flex:1 }}>
              {editId === item.id
                ? <input className="input" value={editVal} onChange={e => setEditVal(e.target.value)}
                    onBlur={() => { onUpdate(items.map(i => i.id === item.id ? { ...i, name: editVal } : i)); setEditId(null); }}
                    onKeyDown={e => e.key === "Enter" && e.target.blur()}
                    autoFocus style={{ padding:"4px 8px" }} />
                : <span style={{ fontSize:14, textDecoration: item.checked ? "line-through" : "none",
                    cursor:"text" }} onDoubleClick={() => { setEditId(item.id); setEditVal(item.name); }}>
                    {item.name}
                    {item.qty ? <span style={{ color:"var(--accent)", fontWeight:600, marginLeft:6 }}>
                      {item.qty} {item.unit}</span> : ""}
                  </span>}
            </div>
            <button className="btn btn-ghost" style={{ padding:4, color:"var(--text3)", borderRadius:6 }}
              onClick={() => remove(item.id)}><Icon name="trash" size={14} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
function Settings({ dark, setDark, recipes, onImport, toast }) {
  const fileRef = useRef(null);

  const exportData = () => {
    const data = JSON.stringify({ recipes, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `recettes-${Date.now()}.json`;
    a.click();
    toast("Export réussi !");
  };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const { recipes: imported } = JSON.parse(ev.target.result);
        if (Array.isArray(imported)) { onImport(imported); toast(`${imported.length} recettes importées`); }
        else toast("Format invalide");
      } catch { toast("Erreur d'import"); }
    };
    reader.readAsText(file);
  };

  const rows = [
    { icon:"sun", label:"Thème", desc: dark ? "Mode sombre" : "Mode clair",
      right: <div onClick={() => setDark(!dark)} style={{ width:44, height:24, borderRadius:12,
        background: dark ? "var(--accent)" : "var(--border)", position:"relative", cursor:"pointer", transition:".25s" }}>
        <div style={{ position:"absolute", top:2, left: dark ? 22 : 2, width:20, height:20,
          borderRadius:10, background:"#fff", transition:".25s", boxShadow:"0 1px 4px rgba(0,0,0,.3)" }} />
      </div> },
    { icon:"export", label:"Exporter les recettes", desc:`${recipes.length} recette${recipes.length>1?"s":""}`,
      right: <button className="btn btn-outline btn-sm" onClick={exportData}>Exporter</button> },
    { icon:"import", label:"Importer des recettes", desc:"Fichier JSON",
      right: <button className="btn btn-outline btn-sm" onClick={() => fileRef.current.click()}>Importer</button> },
  ];

  return (
    <div style={{ padding:"0 16px" }}>
      <input ref={fileRef} type="file" accept=".json" onChange={handleImport} style={{ display:"none" }} />
      <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
        {rows.map(({ icon, label, desc, right }) => (
          <div key={label} className="card" style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px" }}>
            <div style={{ width:36, height:36, borderRadius:10, background:"var(--bg3)", display:"flex",
              alignItems:"center", justifyContent:"center", color:"var(--accent)", flexShrink:0 }}>
              <Icon name={icon} size={18} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:14, fontWeight:500 }}>{label}</div>
              <div style={{ fontSize:12, color:"var(--text2)" }}>{desc}</div>
            </div>
            {right}
          </div>
        ))}
      </div>
      <div style={{ textAlign:"center", marginTop:32, color:"var(--text3)", fontSize:12 }}>
        <div style={{ fontFamily:"var(--font-display)", fontSize:18, color:"var(--accent)", marginBottom:4 }}>RecipeVault</div>
        100% hors-ligne · Open source
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [dark, setDark] = useState(() => DB.getObj("prefs", { dark: false }).dark);
  const [tab, setTab] = useState("home");
  const [recipes, setRecipes] = useState(() => {
    const stored = DB.get("recipes");
    if (stored.length > 0) return stored;
    DB.set("recipes", seedRecipes);
    return seedRecipes;
  });
  const [cart, setCart] = useState(() => DB.get("cart"));
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("Toutes");
  const [filterFav, setFilterFav] = useState(false);
  const [detail, setDetail] = useState(null);
  const [editor, setEditor] = useState(null); // null | { recipe: null|obj }
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => { DB.set("recipes", recipes); }, [recipes]);
  useEffect(() => { DB.set("cart", cart); }, [cart]);
  useEffect(() => { DB.setObj("prefs", { dark }); }, [dark]);

  const showToast = (msg) => { setToast(null); setTimeout(() => setToast(msg), 10); };

  const saveRecipe = (rec) => {
    setRecipes(rs => rs.find(r => r.id === rec.id) ? rs.map(r => r.id === rec.id ? rec : r) : [rec, ...rs]);
    setEditor(null);
    showToast(rec.name + " enregistrée !");
  };

  const deleteRecipe = (id) => {
    setRecipes(rs => rs.filter(r => r.id !== id));
    setDetail(null); setConfirm(null);
    showToast("Recette supprimée");
  };

  const duplicateRecipe = (rec) => {
    const dup = { ...rec, id: uid(), name: rec.name + " (copie)", createdAt: Date.now(), favorite: false };
    setRecipes(rs => [dup, ...rs]);
    showToast("Recette dupliquée !");
  };

  const toggleFav = (id) => setRecipes(rs => rs.map(r => r.id === id ? { ...r, favorite: !r.favorite } : r));

  const addToCart = (ing, basePortions, currentPortions) => {
    const ratio = currentPortions / (basePortions || 1);
    const qty = +(ing.qty * ratio).toFixed(2);
    setCart(c => {
      const existing = c.find(i => i.name.toLowerCase() === ing.name.toLowerCase() && i.unit === ing.unit);
      if (existing) return c.map(i => i.id === existing.id ? { ...i, qty: +(parseFloat(i.qty||0) + qty).toFixed(2) } : i);
      return [...c, { id: uid(), name: ing.name, qty, unit: ing.unit, checked: false }];
    });
  };

  const filtered = recipes.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.tags?.some(t => t.toLowerCase().includes(q));
    const matchCat = filterCat === "Toutes" || r.category === filterCat;
    const matchFav = !filterFav || r.favorite;
    return matchSearch && matchCat && matchFav;
  });

  const cats = ["Toutes", ...CATEGORIES];
  const cartBadge = cart.filter(i => !i.checked).length;

  // ── TAB CONTENT
  const tabContent = {
    home: (
      <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
        {/* Search */}
        <div style={{ padding:"12px 16px 8px", flexShrink:0 }}>
          <div style={{ position:"relative" }}>
            <Icon name="search" size={16} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)",
              color:"var(--text3)", pointerEvents:"none" }} />
            <input className="input" placeholder="Rechercher une recette…" value={search}
              onChange={e => setSearch(e.target.value)} style={{ paddingLeft:38 }} />
            {search && <button onClick={() => setSearch("")} style={{ position:"absolute", right:10, top:"50%",
              transform:"translateY(-50%)", background:"none", border:"none", color:"var(--text3)", cursor:"pointer", padding:4 }}>
              <Icon name="x" size={14} />
            </button>}
          </div>
        </div>

        {/* Filters */}
        <div style={{ overflowX:"auto", display:"flex", gap:8, padding:"4px 16px 10px", flexShrink:0 }}>
          <span className={`chip ${filterFav ? "active" : ""}`} onClick={() => setFilterFav(!filterFav)}>
            <Icon name="heart-fill" size={11} style={{ fill: filterFav ? "#fff" : "none" }} /> Favoris
          </span>
          {cats.map(c => (
            <span key={c} className={`chip ${filterCat === c ? "active" : ""}`}
              onClick={() => setFilterCat(c)}>{c}</span>
          ))}
        </div>

        {/* Recipes grid */}
        <div className="scroll" style={{ flex:1, padding:"0 16px 24px" }}>
          {filtered.length === 0 && (
            <div style={{ textAlign:"center", paddingTop:60, color:"var(--text3)" }}>
              <Icon name="nav_recipes" size={48} style={{ opacity:.25 }} />
              <p style={{ marginTop:12, fontSize:15 }}>Aucune recette trouvée</p>
              {search && <p style={{ fontSize:13, marginTop:4 }}>Essayez un autre terme</p>}
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            {filtered.map((r, i) => (
              <RecipeCard key={r.id} recipe={r} style={{ animationDelay:`${i*.04}s` }}
                onClick={(r, editMode) => editMode ? setEditor({ recipe: r }) : setDetail(r)}
                onFav={toggleFav} onDelete={(id) => setConfirm(id)} onDuplicate={duplicateRecipe} />
            ))}
          </div>
        </div>
      </div>
    ),

    cart: (
      <div style={{ height:"100%", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"0 16px 12px", flexShrink:0, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <p style={{ fontSize:13, color:"var(--text2)" }}>Appui long sur un ingrédient dans une recette pour l'ajouter ici.</p>
        </div>
        <ShoppingList items={cart} onUpdate={(items) => setCart(items)} />
      </div>
    ),

    settings: (
      <div style={{ height:"100%", overflowY:"auto" }}>
        <Settings dark={dark} setDark={setDark} recipes={recipes}
          onImport={(imported) => setRecipes(rs => {
            const ids = new Set(rs.map(r => r.id));
            return [...rs, ...imported.filter(r => !ids.has(r.id))];
          })} toast={showToast} />
      </div>
    ),
  };

  const tabs = [
    { id:"home", icon:"nav_recipes", label:"Recettes" },
    { id:"cart", icon:"cart", label:"Courses", badge: cartBadge },
    { id:"settings", icon:"settings", label:"Paramètres" },
  ];

  return (
    <ThemeContext.Provider value={{ dark, setDark }}>
      <GlobalStyles dark={dark} />
      <div style={{ height:"100dvh", display:"flex", flexDirection:"column", background:"var(--bg)", overflow:"hidden" }}>

        {/* Header */}
        <div style={{ padding:"48px 20px 12px", background:"var(--bg2)", borderBottom:"1px solid var(--border)",
          flexShrink:0, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <h1 style={{ fontFamily:"var(--font-display)", fontSize:24, fontWeight:500, color:"var(--text)" }}>
              {tab === "home" ? "Mes Recettes" : tab === "cart" ? "Liste de courses" : "Paramètres"}
            </h1>
            {tab === "home" && <p style={{ fontSize:12, color:"var(--text2)", marginTop:2 }}>
              {filtered.length} recette{filtered.length>1?"s":""}
            </p>}
          </div>
          {tab === "home" && (
            <button className="btn btn-primary" style={{ borderRadius:14 }}
              onClick={() => setEditor({ recipe: null })}>
              <Icon name="plus" size={18} /> Nouvelle
            </button>
          )}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflow:"hidden" }}>{tabContent[tab]}</div>

        {/* Bottom nav */}
        <div style={{ background:"var(--bg2)", borderTop:"1px solid var(--border)",
          display:"flex", padding:"8px 8px 28px", flexShrink:0, gap:4 }}>
          {tabs.map(({ id, icon, label, badge }) => (
            <button key={id} onClick={() => setTab(id)} className="btn btn-ghost"
              style={{ flex:1, flexDirection:"column", gap:3, padding:"6px 4px",
                color: tab === id ? "var(--accent)" : "var(--text3)",
                background: tab === id ? "var(--accent3)" : "transparent",
                borderRadius:14, transition:".18s", position:"relative" }}>
              <div style={{ position:"relative" }}>
                <Icon name={icon} size={22} />
                {badge > 0 && <span className="badge" style={{ position:"absolute", top:-6, right:-8, minWidth:16, height:16,
                  fontSize:10, padding:"0 4px" }}>{badge}</span>}
              </div>
              <span style={{ fontSize:10, fontWeight:600 }}>{label}</span>
            </button>
          ))}
        </div>

        {/* Overlays */}
        {detail && (
          <RecipeDetail recipe={detail} allRecipes={recipes} onClose={() => setDetail(null)}
            onEdit={(r) => { setDetail(null); setEditor({ recipe: r }); }}
            onAddToCart={addToCart} toast={showToast} />
        )}
        {editor && (
          <RecipeEditor recipe={editor.recipe} onSave={saveRecipe} onClose={() => setEditor(null)} />
        )}
        {confirm && (
          <Confirm msg="Supprimer cette recette ?" onOk={() => deleteRecipe(confirm)} onCancel={() => setConfirm(null)} />
        )}
        {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
      </div>
    </ThemeContext.Provider>
  );
}
