(function () {
  "use strict";
  const RAMP = " .:-=+*#%@";
  const CFG = {
    src: "assets/avatar.jpg",
    cols: 96,
    cellRatio: 0.52,
    vignetteX: 0.5,
    vignetteY: 0.42,
    vignetteRX: 0.62,
    vignetteRY: 0.78,
    gamma: 0.86,
    contrast: 1.34,
    fps: 15,
    dim: 0.9,
    dpr: 1, baseDirty: true,
    repulseRadius: 150,
    repulseForce: 26
  };
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PAL = [
    [255, 254, 21],
    [176, 237, 249],
    [143, 166, 179],
    [12, 30, 41]
  ];
  const state = {
    ready: false, cols: 0, rows: 0, cellW: 8, cellH: 16,
    chars: [], lum: [], rgb: [], alpha: [],
    px: 0, py: 0, tX: 0, tY: 0, cX: 0, cY: 0,
    vel: 0, activity: "idle", actT: 0, sweep: -1,
    reveal: REDUCED ? 1 : 0, booted: REDUCED, out: 0,
    scrollP: 0, lastY: 0, on: false
  };
  const cv = document.createElement("canvas");
  const ctx = cv.getContext("2d", { alpha: true });
  const src = document.createElement("canvas");
  const sctx = src.getContext("2d", { willReadFrequently: true });
  const base = document.createElement("canvas");
  const bctx = base.getContext("2d");
  function sample() {
    const img = new Image();
    img.onload = () => {
      const W = 720, H = 720;
      src.width = W; src.height = H;
      sctx.drawImage(img, 0, 0, W, H);
      const d = sctx.getImageData(0, 0, W, H).data;
      const cellPx = 16;
      const cols = Math.floor(W / cellPx);
      const rows = Math.floor(H / (cellPx * CFG.cellRatio));
      const cw = W / cols, ch = cw * CFG.cellRatio;
      let lo = 255, hi = 0;
      const raw = new Float32Array(cols * rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const sx = Math.floor((x + 0.5) * cw), sy = Math.floor((y + 0.5) * ch);
          const i = (sy * W + sx) * 4;
          const l = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
          raw[y * cols + x] = l;
          if (l < lo) lo = l;
          if (l > hi) hi = l;
        }
      }
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const k = y * cols + x;
          const sx = Math.floor((x + 0.5) * cw), sy = Math.floor((y + 0.5) * ch);
          const i = (sy * W + sx) * 4;
          let t = (raw[k] - lo) / Math.max(1, hi - lo);
          t = Math.pow(Math.max(0, Math.min(1, t)), CFG.gamma);
          t = Math.max(0, Math.min(1, (t - 0.5) * CFG.contrast + 0.5));
          const nx = (x + 0.5) / cols - CFG.vignetteX;
          const ny = (y + 0.5) / rows - CFG.vignetteY;
          const v = Math.sqrt(Math.pow(nx / CFG.vignetteRX, 2) + Math.pow(ny / CFG.vignetteRY, 2));
          const vig = Math.max(0, 1 - Math.pow(v, 2.1) * 1.06);
          const lum = t * vig;
          state.lum[k] = lum;
          const ri = RAMP[Math.min(RAMP.length - 1, Math.round(lum * (RAMP.length - 1)))];
          state.chars[k] = ri === " " ? " " : ri;
          const warm = d[i] - d[i + 2];
          const lumC = 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
          let ci;
          if (warm > 26 && lumC > 128) ci = 0;
          else if (lumC > 150) ci = 1;
          else if (lumC > 82) ci = 2;
          else ci = 3;
          state.rgb[k] = PAL[ci];
          state.alpha[k] = Math.min(1, (0.42 + lum * 1.75) * (ci === 0 ? 1.45 : 1));
        }
      }
      state.cols = cols; state.rows = rows; state.cellW = cw; state.cellH = ch;
      state.ready = true;
      layout();
      requestAnimationFrame(frame);
    };
    img.src = CFG.src;
  }
  function layout() {
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    state.dpr = dpr;
    const w = window.innerWidth, h = window.innerHeight;
    cv.width = Math.floor(w * dpr); cv.height = Math.floor(h * dpr);
    cv.style.width = w + "px"; cv.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    base.width = cv.width; base.height = cv.height;
    bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.baseDirty = true;
    const target = Math.min(w * 0.60, h * 0.80);
    const cpl = target / state.cols;
    state.cellW = cpl; state.cellH = cpl * CFG.cellRatio;
    state.px = w * 0.68 - (state.cols * state.cellW) / 2;
    state.py = h * 0.5 - (state.rows * state.cellH) / 2;
    state.cX = state.px; state.cY = state.py;
  }
  const ACTS = ["coding", "cleaning", "thinking", "debugging"];
  function actLabel(a) {
    return { coding: "compiling", cleaning: "tidying", thinking: "thinking", debugging: "scanning logs", idle: "idle" }[a] || a;
  }
  function setActivity(a) { state.activity = a; state.actT = 0; if (a === "cleaning") state.sweep = -1; }
  window.__asciiAct = function (a) { if (ACTS.indexOf(a) >= 0 || a === "idle") setActivity(a); };
  function physics(dt) {
    state.cX += (state.px - state.cX) * Math.min(1, dt * 3.4);
    state.cY += (state.py - state.cY) * Math.min(1, dt * 3.4);
  }
  let last = 0, acc = 0;
  function frame(ts) {
    if (!state.on) return;
    if (!last) last = ts;
    let dt = (ts - last) / 1000; last = ts;
    if (dt > 0.1) dt = 0.1;
    state.tX += dt;
    if (!state.booted) {
      state.reveal = Math.min(1, state.reveal + dt * 0.85);
      if (state.reveal >= 1) state.booted = true;
    }
    state.actT += dt;
    if (state.activity === "idle" && state.actT > 3.2) {
      setActivity(ACTS[Math.floor(Math.random() * ACTS.length)]);
    }
    if (state.activity !== "idle" && state.actT > 4.6) setActivity("idle");
    if (state.activity === "cleaning" && state.sweep < 1) {
      state.sweep = Math.min(1, state.sweep + dt * 0.55);
    }
    physics(dt);
    acc += dt;
    if (acc >= 1 / CFG.fps) { draw(); acc = 0; }
    requestAnimationFrame(frame);
  }
  function renderBase() {
    const w = window.innerWidth, h = window.innerHeight;
    bctx.setTransform(1, 0, 0, 1, 0, 0);
    bctx.clearRect(0, 0, base.width, base.height);
    bctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    bctx.textBaseline = "middle"; bctx.textAlign = "center";
    const bootFade = state.booted ? 1 : 0.2 + 0.8 * state.reveal;
    const revRows = state.reveal * state.rows;
    for (let y = 0; y < state.rows; y++) {
      if (y > revRows) continue;
      for (let x = 0; x < state.cols; x++) {
        const k = y * state.cols + x;
        const ch = state.chars[k];
        if (ch === " ") continue;
        const a = state.alpha[k] * bootFade * (1 - state.out) * CFG.dim;
        if (a <= 0.02) continue;
        const c = state.rgb[k];
        bctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a.toFixed(3) + ")";
        bctx.fillText(ch, state.px + x * state.cellW + state.cellW / 2, state.py + y * state.cellH + state.cellH / 2);
      }
    }
    state.baseDirty = false;
  }
  function draw() {
    const w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    if (!state.ready) return;
    if (state.baseDirty || !state.booted) renderBase();
    const t = state.tX;
    const sway = Math.sin(t * 0.6) * 2.2;
    const rise = Math.sin(t * 0.42) * 1.4;
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.drawImage(base, 0, 0, base.width, base.height, sway, rise, w, h);
    const cols = state.cols, rows = state.rows, cellW = state.cellW, cellH = state.cellH;
    const bootFade = state.booted ? 1 : 0.2 + 0.8 * state.reveal;
    const px0 = state.cX + sway, py0 = state.cY + rise;
    const put = (k, ch, ox, oy, boost) => {
      const x = k % cols, y = (k / cols) | 0;
      const hx = state.px + x * cellW + cellW / 2;
      const hy = state.py + y * cellH + cellH / 2;
      ctx.clearRect(hx - cellW * 0.6, hy - cellH * 0.6, cellW * 1.2, cellH * 1.2);
      const a = state.alpha[k] * bootFade * (1 - state.out) * CFG.dim * (boost || 1);
      if (a <= 0.02) return;
      const c = state.rgb[k];
      ctx.fillStyle = "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + Math.min(1, a).toFixed(3) + ")";
      ctx.fillText(ch, px0 + x * cellW + cellW / 2 + ox, py0 + y * cellH + cellH / 2 + oy);
    };
    for (let y = 0; y < rows; y++) {
      const hx = px0 + cols * cellW / 2, hy = py0 + y * cellH;
      if (Math.abs(hy - state.pointer.y) > CFG.repulseRadius) continue;
      for (let x = 0; x < cols; x++) {
        const k = y * cols + x;
        if (state.chars[k] === " ") continue;
        const dx = px0 + x * cellW + cellW / 2 - state.pointer.x;
        const dy = hy - state.pointer.y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > CFG.repulseRadius) continue;
        const f = (1 - d / CFG.repulseRadius) * CFG.repulseForce;
        const ang = Math.atan2(dy, dx) + Math.PI;
        put(k, state.chars[k], Math.cos(ang) * f, Math.sin(ang) * f, 0.5);
      }
    }
    if (state.vel > 0.02) {
      for (let y = 0; y < rows; y += 2) {
        for (let x = 0; x < cols; x += 3) {
          const k = y * cols + x;
          if (state.chars[k] === " ") continue;
          if (Math.random() > 0.3) continue;
          put(k, state.chars[k], state.vel * (y / rows) * 60, 0, 0.85);
        }
      }
    }
    if (state.activity === "cleaning" && state.sweep >= 0) {
      const band = Math.round(rows * 0.1);
      const sy = Math.round(state.sweep * rows);
      for (let y = Math.max(0, sy - band); y < Math.min(rows, sy + band); y++) {
        for (let x = 0; x < cols; x++) {
          const k = y * cols + x;
          if (state.chars[k] === " ") continue;
          if (Math.abs(y - sy) < 2) put(k, " ", 0, 0, 0);
          else put(k, state.chars[k], (state.sweep * rows - y) * 0.6, 0, 0.8);
        }
      }
    }
    if (state.activity === "coding") {
      for (let n = 0; n < 90; n++) {
        const y = Math.random() < 0.6 ? (rows * 0.2 + Math.random() * rows * 0.12) : (rows * 0.7 + Math.random() * rows * 0.14);
        const x = Math.floor(Math.random() * cols);
        const k = Math.min(state.chars.length - 1, Math.floor(y) * cols + x);
        if (state.chars[k] === " ") continue;
        put(k, RAMP[4 + Math.floor(Math.random() * 6)], 0, 0, 1.6);
      }
    }
    if (state.activity === "debugging") {
      for (let n = 0; n < 14; n++) {
        const y = Math.floor(Math.random() * rows), x = Math.floor(Math.random() * cols);
        const k = y * cols + x;
        if (state.chars[k] === " ") continue;
        put(k, Math.random() < 0.25 ? "!" : "@", 0, 0, 2.2);
      }
    }
    if (state.activity === "thinking") {
      const sy = Math.floor((Math.sin(t * 0.7) * 0.5 + 0.5) * rows);
      for (let y = Math.max(0, sy - 2); y < Math.min(rows, sy + 3); y++) {
        for (let x = 0; x < cols; x += 2) {
          const k = y * cols + x;
          if (state.chars[k] === " ") continue;
          put(k, state.chars[k], 0, Math.sin(t * 2 + x) * 1.2, 1.35);
        }
      }
    }
  }
  state.pointer = { x: -9999, y: -9999, inside: false };
  function init() {
    const host = document.getElementById("ascii-stage");
    if (!host) return;
    host.appendChild(cv);
    state.on = true;
    window.addEventListener("resize", layout, { passive: true });
    window.addEventListener("pointermove", e => {
      state.pointer.x = e.clientX; state.pointer.y = e.clientY; state.pointer.inside = true;
    }, { passive: true });
    window.addEventListener("pointerleave", () => { state.pointer.inside = false; state.pointer.x = -9999; state.pointer.y = -9999; });
    let lastY = window.scrollY, calm = 0;
    window.addEventListener("scroll", () => {
      const y = window.scrollY;
      const d = Math.abs(y - lastY);
      lastY = y;
      state.vel = Math.min(1, state.vel + d / 42);
      calm = 0;
      const stage = document.getElementById("hero-stage");
      if (stage) {
        const r = stage.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
        state.scrollP = p;
        state.out = Math.max(0, Math.min(1, (p - 0.55) / 0.45));
        state.baseDirty = true;
        const h = document.querySelector(".hero .wrap");
        if (h) { h.style.opacity = String(Math.max(0, 1 - p * 1.7)); h.style.transform = "translateY(" + (-p * 46) + "px)"; }
      }
    }, { passive: true });
    setInterval(() => {
      calm += 1;
      if (calm > 2) { state.vel *= 0.82; if (state.vel < 0.004) state.vel = 0; }
    }, 120);
    document.addEventListener("visibilitychange", () => { state.on = !document.hidden; if (state.on) { last = 0; requestAnimationFrame(frame); } });
    const boot = document.getElementById("boot");
    if (boot) {
      const skip = () => { state.reveal = 1; state.booted = true; boot.classList.add("done"); window.removeEventListener("wheel", skip); window.removeEventListener("keydown", skip); window.removeEventListener("pointerdown", skip); };
      window.addEventListener("wheel", skip, { once: true, passive: true });
      window.addEventListener("keydown", skip, { once: true });
      window.addEventListener("pointerdown", skip, { once: true });
      setTimeout(skip, 1700);
    }
    sample();
  }
  window.__asciiInit = init;
  window.__asciiSkipBoot = function () { state.reveal = 1; state.booted = true; const b = document.getElementById("boot"); if (b) b.classList.add("done"); };
  window.__asciiState = state;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
