const $ = s => document.querySelector(s);
const REDIRECT = "I can only answer questions about Prakash Sharma - try asking about his experience, skills, projects, or contact details.";
const STOP = new Set("a an the is are was were of in on at to for and or with his he him her their what which who whom how does do did can could you your me about tell has have had i my please will would should that this it its as be been being by from into over under".split(" "));
const tok = t => t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w && !STOP.has(w));
const IDF = {};
(function () {
  const df = {};
  const N = window.KB.length;
  window.KB.forEach(c => { new Set(tok(c.t + " " + c.s)).forEach(w => df[w] = (df[w] || 0) + 1); });
  for (const w in df) IDF[w] = Math.log(1 + N / df[w]);
})();
const vec = t => {
  const f = {};
  tok(t).forEach(w => f[w] = (f[w] || 0) + 1);
  const v = {};
  for (const w in f) v[w] = f[w] * (IDF[w] || 1);
  return v;
};
const cos = (a, b) => {
  let d = 0, na = 0, nb = 0;
  for (const w in a) { na += a[w] * a[w]; if (b[w]) d += a[w] * b[w]; }
  for (const w in b) nb += b[w] * b[w];
  return na && nb ? d / Math.sqrt(na * nb) : 0;
};
const norm = s => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const NAMES = ["mira", "redax", "trimstack", "tradersentiment", "resume-screener-nlp", "emotion_detector", "walmart", "covid-19", "loan-default-prediction", "customer-churn", "customer-segmentation", "blood_cell_detection_v2", "movie-recommender", "ab-testing-landing-page", "e-commerce-sales-analysis", "loan_approval_model", "number-system", "desktop-voice-assistant-main", "credit-card-fraud-detection"];
const retrieve = q => {
  const v = vec(q);
  const ql = q.toLowerCase();
  const nq = norm(q);
  const wantsCount = /\b(how many|how much|list all|all projects|name (his|your) projects|which projects)\b/.test(ql);
  const wantsLink = /\b(where|github|link|url|repo|repository|hosted|demo|source|code)\b/.test(ql);
  return window.KB.map(c => {
    let s = cos(v, vec(c.t + " " + c.s));
    if (wantsCount && c.s.indexOf("Project count") === 0) s += 0.5;
    if (wantsLink && /^(github|links|project_url)$/.test(c.t)) s += 0.4;
    if (/\bgithub\b/.test(ql) && c.t === "github") s += 0.45;
    if (/\blinkedin\b/.test(ql) && c.s.indexOf("LinkedIn") > -1) s += 0.45;
    const name = c.s.split(",")[0].split(" his ")[0].trim();
    if (name.length > 3 && NAMES.indexOf(norm(name)) > -1 && nq.indexOf(norm(name)) > -1) s += 0.75;
    return { c, s };
  }).sort((x, y) => y.s - x.s).slice(0, 4);
};
const ANCHORS = new Set("prakash he his him mira redax trimstack tradxlink tradvisor edxso nextwealth augtech internship intern bca rungta pune rag agent agentic agents llama llamaindex milvus gridfs mongodb fastapi python lidar procurement requisition ocr embeddings embedding hallucination latency portfolio resume cv hire hiring recruiter candidate role roles job work worked works skill skills experience experienced project projects education degree study studied contact email phone linkedin github remote hybrid onsite ability abilities built build building know knows tech stack strength strengths available availability certification certificate company startup tradersentiment primetrade screener sentiment churn segmentation kmeans loan walmart covid blood cell fraud recommender forecasting a/b testing voice assistant number system converter text2sql table retrieval nlp streamlit prophet pandas numpy pytorch".split(" "));
const onTopic = q => (q.toLowerCase().match(/[a-z0-9]+/g) || []).some(w => ANCHORS.has(w));
const fallback = q => {
  if (!tok(q).length) return window.KB.filter(c => c.t === "abilities").slice(0, 3).map(c => c.s).join(" ");
  const r = retrieve(q).filter(x => x.s > 0.05);
  return r.length ? r.slice(0, 3).map(x => x.c.s).join(" ") : REDIRECT;
};
async function llm(q, ctx) {
  const r = await fetch("api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: q, context: ctx })
  });
  if (!r.ok) return null;
  const j = await r.json();
  return j.answer || null;
}
const log = $("#chatLog"), form = $("#chatForm"), input = $("#chatText");
const add = (who, text) => {
  const d = document.createElement("div");
  d.className = "msg " + who;
  d.textContent = text;
  log.appendChild(d);
  log.scrollTop = log.scrollHeight;
  return d;
};
async function ask(q) {
  if (!q) return;
  add("user", q);
  const t = add("bot", "");
  t.innerHTML = "<i></i><i></i><i></i>";
  t.className = "msg bot typing";
  setFace("think");
  const r = retrieve(q);
  let out = null;
  if (onTopic(q)) {
    try { out = await llm(q, r.map(x => x.c.s).join("\n")); } catch (e) { out = null; }
    if (!out) out = fallback(q);
  } else {
    out = REDIRECT;
  }
  setFace(out === REDIRECT ? "refuse" : "speak");
  t.className = "msg bot";
  t.textContent = out;
  log.scrollTop = log.scrollHeight;
  setTimeout(() => setFace("idle"), 2200);
}
form.addEventListener("submit", e => {
  e.preventDefault();
  const q = input.value.trim();
  input.value = "";
  ask(q);
});
["What has he built with RAG?", "Tell me about Mira", "Why should I hire him?", "What are his skills?", "What can he do?", "How do I contact him?"].forEach(c => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip";
  b.textContent = c;
  b.addEventListener("click", () => ask(c));
  $("#chips").appendChild(b);
});
const FACES = {
  idle: "┌──────┐\n│ ●  ● │\n│      │\n└──────┘",
  blink: "┌──────┐\n│ ▬  ▬ │\n│      │\n└──────┘",
  think: "┌──────┐\n│ ◕  ◑ │\n│   ▪  │\n└──────┘",
  speak: "┌──────┐\n│ ●  ● │\n│   ▄  │\n└──────┘",
  refuse: "┌──────┐\n│ ╳  ╳ │\n│   ─  │\n└──────┘"
};
const faceEl = document.getElementById("chatFace");
const badgeEl = document.getElementById("chatState");
function setFace(kind) {
  if (!faceEl || !FACES[kind]) return;
  faceEl.textContent = FACES[kind];
  faceEl.className = "chat-face" + (kind === "think" ? " think" : kind === "speak" ? " speak" : kind === "refuse" ? " refuse" : "");
  if (kind === "think" || kind === "speak") {
    faceEl.classList.add("blink");
    setTimeout(() => faceEl && faceEl.classList.remove("blink"), 340);
  }
  if (badgeEl) badgeEl.textContent = kind;
  if (window.__asciiAct) window.__asciiAct(kind === "think" || kind === "speak" ? "thinking" : "coding");
}
setInterval(() => { if (badgeEl && badgeEl.textContent === "idle") setFace(Math.random() < 0.5 ? "idle" : "blink"); }, 3400);
add("bot", "Hey! I'm Prakash's AI twin - a small RAG bot grounded on his career docs. Ask me about his experience, skills, projects or how to reach him.");
setFace("idle");
const ROLES = ["AI Engineer", "GenAI Engineer", "RAG Specialist", "Agentic AI Developer", "Python Developer"];
const tw = $("#typewriter");
if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
  tw.textContent = ROLES[0];
} else {
  let ri = 0, ci = 0, del = false;
  (function tick() {
    const r = ROLES[ri];
    ci += del ? -1 : 1;
    tw.textContent = r.slice(0, ci);
    let d = del ? 40 : 80;
    if (!del && ci === r.length) { d = 1500; del = true; }
    else if (del && ci === 0) { del = false; ri = (ri + 1) % ROLES.length; d = 300; }
    setTimeout(tick, d);
  })();
}
const io = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("on")), { threshold: .12 });
document.querySelectorAll(".rv").forEach(el => io.observe(el));
const navLinks = Array.from(document.querySelectorAll(".nav nav a"));
const sections = navLinks.map(a => document.querySelector(a.getAttribute("href"))).filter(Boolean);
if (sections.length && "IntersectionObserver" in window) {
  const spy = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach(s => spy.observe(s));
}
const kbCount = document.getElementById("kbcount");
if (kbCount) kbCount.textContent = "grounded on " + window.KB.length + " verified career facts";
const statEls = document.querySelectorAll(".stat b[data-from]");
const statFmt = (el, v) => {
  const tilde = el.dataset.tilde === "1";
  const pre = el.dataset.prefix || "";
  if (el.dataset.unit === "pct") return (tilde ? "~" : "") + Math.round(v) + "%";
  if (pre) return pre + Math.round(v) + "s";
  return String(Math.round(v));
};
let statDone = false;
const statIO = new IntersectionObserver(es => {
  es.forEach(e => {
    if (!e.isIntersecting || statDone) return;
    statDone = true;
    statIO.disconnect();
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dur = 1200, t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / dur);
      const ease = 1 - Math.pow(1 - p, 3);
      statEls.forEach(el => {
        const from = parseFloat(el.dataset.from), to = parseFloat(el.dataset.to);
        el.textContent = statFmt(el, from + (to - from) * ease);
      });
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}, { threshold: 0.35 });
if (statEls.length) statIO.observe(statEls[0].closest(".stats-grid"));
