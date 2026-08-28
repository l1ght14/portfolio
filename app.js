const $ = s => document.querySelector(s);
const REDIRECT = "I can only answer questions about Prakash Sharma - try asking about his experience, skills, projects, or contact details.";
const STOP = new Set("a an the is are was were of in on at to for and or with his he him her their what which who whom how does do did can could you your me about tell has have had i my please will would should that this it its as be been being by from into over under".split(" "));
const tok = t => t.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(w => w && !STOP.has(w));
const IDF = {};
(function () {
  const df = {};
  const N = window.KB.length;
  window.KB.forEach(c => { new Set(tok(c.s)).forEach(w => df[w] = (df[w] || 0) + 1); });
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
const retrieve = q => window.KB.map(c => ({ c, s: cos(vec(q), vec(c.s)) })).sort((x, y) => y.s - x.s).slice(0, 4);
const fallback = q => {
  const r = retrieve(q).filter(x => x.s > 0.05);
  return r.length ? r.slice(0, 3).map(x => x.c.s).join(" ") : REDIRECT;
};
const SYS = "You are the portfolio assistant of Prakash Sharma. Answer ONLY from the provided context about him. Keep answers under 120 words, factual and friendly. Never invent facts, metrics or technologies. If the question is not about Prakash Sharma's profile, skills, experience, projects, education or contact details, reply exactly: " + REDIRECT;
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
  const r = retrieve(q);
  const ctx = r.map(x => x.c.s).join("\n");
  let out = null;
  try { out = await llm(q, ctx); } catch (e) { out = null; }
  if (!out) out = r[0].s > 0.05 ? fallback(q) : REDIRECT;
  t.className = "msg bot";
  t.textContent = out;
  log.scrollTop = log.scrollHeight;
}
form.addEventListener("submit", e => {
  e.preventDefault();
  const q = input.value.trim();
  input.value = "";
  ask(q);
});
["What has he built with RAG?", "Tell me about Mira", "His experience at Tradxlink?", "Top skills?", "How do I contact him?"].forEach(c => {
  const b = document.createElement("button");
  b.type = "button";
  b.className = "chip";
  b.textContent = c;
  b.addEventListener("click", () => ask(c));
  $("#chips").appendChild(b);
});
add("bot", "Hey! I'm Prakash's AI twin - a small RAG bot grounded on his career docs. Ask me about his experience, skills, projects or how to reach him.");
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
