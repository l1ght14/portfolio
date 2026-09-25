(function () {
  "use strict";
  const host = document.getElementById("ascii-brain");
  if (!host) return;
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hint = host.parentElement && host.parentElement.querySelector(".lab-hint");
  const HINT_AUTO = "click it to make it code";
  const HINT_LOCK = "locked: coding \u2014 click to release";

  const SKULL = [
    "     .----------.     ",
    "   .'  $$$    $$  '.   ",
    "  /   $$$$  $$$$   \\   ",
    " |   $$$$$$$$$$$$   |   ",
    "|   $$$ ::  :: $$$   |   ",
    "|   $$  @@@  @@@  $$|   ",
    "|   $$$ ::  :: $$$   |   ",
    "|   $$$$$$$$$$$$$$   |   ",
    " \\  $$$$$$$$$$$$$$  /   ",
    "   '.  $$    $$  .'   ",
    "     '----------'     "
  ];
  const STATES = {
    idle: {
      eye: "-  -", mouth: " --- ", label: "idle",
      log: ["prakash@portfolio: ~$", "rag pipeline ........ online", "19 projects ........ ready"]
    },
    code: {
      eye: "^  ^", mouth: "==>>", label: "coding",
      log: ["> import torch", "> model.fit(X, y)", "> loss.backward()", "> epoch 12/50 ..... ok"]
    },
    think: {
      eye: "-  -", mouth: " ... ", label: "thinking",
      log: ["* chain-of-thought", "  . collecting facts", "  ? ranking sources", "  * grounded answer"]
    },
    clean: {
      eye: "^  o", mouth: " ~   ", label: "tidying",
      log: ["sweep .........  62%", "sweep ######...  88%", "sweep ########## done", "artefacts tidied .. ok"]
    },
    alert: {
      eye: "x  x", mouth: " !!! ", label: "alert",
      log: ["WARN prompt injection", "  blocked at gate", "  audit log written", "  status ..... secured"]
    }
  };
  const SEQ = ["idle", "code", "idle", "think", "idle", "clean", "idle", "code", "idle", "alert"];
  const CURSOR = ["|", "/", "-", "\\"];

  // Per-state motion envelope: x/y amplitude, speed, depth scale, shake.
  const G = {
    idle:  { ax: 8,  ay: 5.4, sp: 0.80, sc: 0.026, sh: 0,   rot: 1.3 },
    code:  { ax: 5,  ay: 3.2, sp: 2.60, sc: 0.038, sh: 1.1, rot: 1.8 },
    think: { ax: 12, ay: 5.2, sp: 0.55, sc: 0.018, sh: 0,   rot: 2.8 },
    clean: { ax: 15, ay: 3.2, sp: 1.10, sc: 0.030, sh: 0,   rot: 0.8 },
    alert: { ax: 6,  ay: 2.0, sp: 5.50, sc: 0.055, sh: 2.6, rot: 2.2 }
  };

  // Canonical width keeps every glyph row aligned regardless of hand-authored lengths.
  const W = Math.max.apply(null, SKULL.map(function (r) { return r.length; }));
  const BASE = SKULL.map(function (r) { return r.padEnd(W, " "); });
  const EYE_ROW = 5, MOUTH_ROW = 10;

  const face = document.createElement("span");
  face.className = "brain-face";
  const depth = document.createElement("span");
  depth.className = "brain-depth";
  depth.setAttribute("aria-hidden", "true");
  host.append(depth, face);
  host.style.position = "relative";
  host.tabIndex = 0;

  const state = { act: "idle", scroll: 0 };
  let act = 0, frame = 0, locked = false, last = 0, raf = 0, live = true;
  const TEXT_MS = 170, ADVANCE = 9;

  function logLines() {
    const pool = STATES[state.act].log;
    return Array.from({ length: 3 }, function (_, i) {
      return pool[(state.scroll + i) % pool.length];
    });
  }

  function frameText() {
    const s = STATES[state.act] || STATES.idle;
    const rows = BASE.slice();
    rows[EYE_ROW] = ("|   $$  " + s.eye + "  $$  |").padEnd(W, " ");
    rows[MOUTH_ROW] = ("     '---" + s.mouth + "---'").padEnd(W, " ");
    const cur = CURSOR[(frame >> 1) % CURSOR.length];
    const logs = logLines();
    return rows.join("\n") + "\n" + logs.map(function (l, i) {
      return "   " + l + (i === logs.length - 1 ? " " + cur : "");
    }).join("\n");
  }

  function render() {
    const text = frameText();
    face.textContent = text;
    depth.textContent = text;
    host.className = "ascii-brain" +
      (state.act === "code" || state.act === "alert" ? " hot" : state.act === "clean" ? " cool" : "") +
      (locked ? " locked" : "");
    host.setAttribute("aria-label", "Animated ASCII brain, currently " + STATES[state.act].label +
      (locked ? ", locked by click" : ", cycling automatically"));
  }

  // x/y/rotate drive the front layer; the back layer lags for parallax depth.
  function pose(t) {
    const g = G[state.act] || G.idle;
    const x = g.ax * Math.sin(t * g.sp) + (g.sh ? Math.sin(t * 47) * g.sh : 0);
    const y = g.ay * Math.cos(t * g.sp * 0.77) + (g.sh ? Math.cos(t * 39) * g.sh * 0.6 : 0);
    const r = g.rot * Math.sin(t * g.sp * 0.5);
    const s = 1 + g.sc * Math.sin(t * g.sp * 1.3);
    face.style.transform = "translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) + "px,0) rotate(" +
      r.toFixed(2) + "deg) scale(" + s.toFixed(3) + ")";
    depth.style.transform = "translate3d(" + (x * 0.42).toFixed(2) + "px," + (y * 0.42).toFixed(2) +
      "px,0) rotate(" + (r * 0.4).toFixed(2) + "deg) scale(" + (s * 0.97).toFixed(3) + ")";
  }

  function loop(ts) {
    if (!live) { raf = 0; return; }
    raf = requestAnimationFrame(loop);
    if (ts - last >= TEXT_MS) {
      last = ts;
      frame++;
      if (!locked && frame % ADVANCE === 0) {
        act++;
        state.act = SEQ[act % SEQ.length];
        state.scroll++;
      }
      render();
    }
    pose(ts / 1000);
  }

  function start() { if (!raf && live) { last = performance.now(); raf = requestAnimationFrame(loop); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  function toggle() {
    locked = !locked;
    if (locked) { state.act = "code"; state.scroll = 0; act = 1; }
    else { state.act = "idle"; }
    if (hint) hint.textContent = locked ? HINT_LOCK : HINT_AUTO;
    render();
  }

  host.addEventListener("click", toggle);
  host.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
  });

  new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting && !REDUCED) { live = true; start(); }
      else { live = false; stop(); }
    });
  }, { threshold: 0.15 }).observe(host);

  render();
  if (REDUCED) { live = false; pose(0); }
  else start();

  window.__brainSet = function (a) {
    if (!STATES[a]) return false;
    state.act = a; state.scroll = 0; locked = true;
    if (hint) hint.textContent = "locked: " + STATES[a].label + " \u2014 click to release";
    render();
    return true;
  };
  window.__brainState = function () { return { act: state.act, locked: locked }; };
  window.__brainTransform = function () { return face.style.transform; };
  window.__brainCheck = function () {
    var rows = BASE.slice();
    var s = STATES[state.act] || STATES.idle;
    rows[EYE_ROW] = ("|   $$  " + s.eye + "  $$  |").padEnd(W, " ");
    rows[MOUTH_ROW] = ("     '---" + s.mouth + "---'").padEnd(W, " ");
    var bad = rows.filter(function (r) { return r.length !== W; });
    return { skullRows: rows.length, width: W, mismatched: bad.length, ok: bad.length === 0 };
  };
})();
