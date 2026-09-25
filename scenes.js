(function () {
  "use strict";
  // ASCII scene player. Frame data is baked offline by tools/bake_scenes.py
  // into assets/scenes.js, so nothing here touches image pixels at runtime.
  const SCENES = window.SCENES || [];
  const host = document.getElementById("scenes");
  if (!host || !SCENES.length) return;

  // Frames ship run-length encoded (see tools/bake_scenes.py); a glyph run of
  // n is one alphabet char plus the glyph. Expand once, up front.
  (function expand() {
    for (const s of SCENES) {
      const alpha = s.alpha || "";
      s.frames = s.frames.map(function (enc) {
        let out = "";
        for (let i = 0; i < enc.length; i += 2) {
          const n = alpha.indexOf(enc.charAt(i)) + 1;
          const ch = enc.charAt(i + 1);
          for (let k = 0; k < n; k++) out += ch;
        }
        return out;
      });
      delete s.alpha;
    }
  })();

  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FPS = 12;          // glyph frames per second
  const DWELL = 5200;      // ms before switching to another random scene
  const PREBUILD = 2;      // frame canvases warmed per tick, off the critical path

  // ramp index -> [r, g, b, alpha]; index 0 is the background and stays empty
  const TIER = [
    null,
    [143, 166, 179, 0.30], [143, 166, 179, 0.42], [143, 166, 179, 0.55],
    [143, 166, 179, 0.68], [176, 237, 249, 0.62], [176, 237, 249, 0.78],
    [176, 237, 249, 0.92], [255, 254, 21, 0.80], [255, 254, 21, 0.98]
  ];

  const cv = document.createElement("canvas");
  const ctx = cv.getContext("2d");
  host.appendChild(cv);

  const state = {
    ready: false, scene: 0, frame: 0, dpr: 1,
    cellW: 8, cellH: 16, cols: 0, rows: 0,
    tX: 0, acc: 0, sceneT: 0, on: false, live: true, built: 0
  };
  const cache = new Map();
  const queue = [];
  let last = 0, reveal = REDUCED ? 1 : 0;

  const caption = host.parentElement && host.parentElement.querySelector(".lab-hint");
  function say(text) { if (caption) caption.textContent = text; }

  function pickRandom() {
    if (SCENES.length < 2) return 0;
    let n = state.scene;
    while (n === state.scene) n = Math.floor(Math.random() * SCENES.length);
    return n;
  }

  const MAX_W = 560;        // the panel is full width; the art reads best capped
  // One cell size for every scene, sized off the tallest grid so nothing is
  // ever clipped and the scale does not jump when the scene changes.
  const MAXC = Math.max.apply(null, SCENES.map(function (s) { return s.cols; }));
  const MAXR = Math.max.apply(null, SCENES.map(function (s) { return s.rows; }));
  const AR = 0.52;          // cell height / cell width, must match the baker

  function layout() {
    const box = host.getBoundingClientRect();
    const w = Math.min(MAX_W, Math.max(240, box.width));
    const h = Math.max(200, box.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.floor(w * dpr); cv.height = Math.floor(h * dpr);
    cv.style.width = w + "px"; cv.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    state.dpr = dpr; state.w = w; state.h = h;
    state.cellW = Math.max(2, Math.min(w / MAXC, h / (MAXR * AR)));
    state.cellH = state.cellW * AR;
  }

  function key(si, fi) { return si + ":" + fi; }

  // One glyph grid -> one cached canvas. Built on demand for the frame we are
  // about to show, and pre-warmed in the background so nothing flashes empty.
  function build(si, fi) {
    const k = key(si, fi);
    if (cache.has(k)) return cache.get(k);
    const s = SCENES[si];
    const c = document.createElement("canvas");
    c.width = cv.width; c.height = cv.height;
    const g = c.getContext("2d");
    g.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height);
    g.textBaseline = "middle"; g.textAlign = "center";

    const cols = s.cols, rows = s.rows;
    const cellW = state.cellW, cellH = state.cellH;
    const ox = (state.w - cols * cellW) / 2, oy = (state.h - rows * cellH) / 2;
    const data = s.frames[fi];
    let cur = null;
    for (let i = 0; i < cols * rows; i++) {
      const ch = data[i];
      if (ch === " ") continue;
      const tier = TIER[" .:-=+*#%@".indexOf(ch)];
      if (!tier) continue;
      const css = "rgba(" + tier[0] + "," + tier[1] + "," + tier[2] + "," + tier[3] + ")";
      if (css !== cur) { g.fillStyle = css; cur = css; }
      const x = i % cols, y = (i / cols) | 0;
      g.fillText(ch, ox + x * cellW + cellW / 2, oy + y * cellH + cellH / 2);
    }
    cache.set(k, c);
    return c;
  }

  function prewarm() {
    const s = SCENES[state.scene];
    for (let n = 0; n < PREBUILD; n++) {
      const fi = (state.frame + 1 + n) % s.frames.length;
      if (!cache.has(key(state.scene, fi))) build(state.scene, fi);
    }
  }

  function go(si, announce) {
    state.scene = si; state.frame = 0; state.sceneT = 0; state.acc = 0;
    const s = SCENES[si];
    say((announce ? "scene: " : "now: ") + s.label + "  ·  click for another");
    host.setAttribute("aria-label", "ASCII animation: " + s.label + ". Click for a random scene.");
    draw();
  }

  function draw() {
    if (!state.ready) return;
    const s = SCENES[state.scene];
    const c = build(state.scene, state.frame);
    const t = state.tX;
    const sway = Math.sin(t * 0.5) * 1.8;
    const rise = Math.sin(t * 0.37) * 1.1;
    ctx.clearRect(0, 0, state.w, state.h);
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.75 * reveal;
    ctx.drawImage(c, sway, rise);
    ctx.restore();
    // scanline shimmer keeps it feeling terminal-ish without touching the art
    ctx.fillStyle = "rgba(12,30,41," + (0.05 + 0.03 * Math.sin(t * 2.1)).toFixed(3) + ")";
    ctx.fillRect(0, 0, state.w, state.h);
    prewarm();
  }

  function frame(ts) {
    if (!state.on) return;
    const dt = last ? Math.min(0.1, (ts - last) / 1000) : 0;
    last = ts;
    state.tX += dt;
    if (reveal < 1) reveal = Math.min(1, reveal + dt * 1.1);

    const s = SCENES[state.scene];
    state.acc += dt; state.sceneT += dt;
    if (state.acc >= 1 / FPS) {
      state.acc = 0;
      state.frame = (state.frame + 1) % s.frames.length;
    }
    if (!REDUCED && state.sceneT * 1000 > DWELL) go(pickRandom(), false);
    draw();
    requestAnimationFrame(frame);
  }

  function play() { if (!state.on) { state.on = true; last = 0; requestAnimationFrame(frame); } }
  function pause() { state.on = false; }

  function init() {
    layout();
    state.ready = true;
    state.cols = SCENES[0].cols; state.rows = SCENES[0].rows;
    go(Math.floor(Math.random() * SCENES.length), false);
    if (REDUCED) { pause(); reveal = 1; draw(); }
    else play();

    let rt = 0;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { cache.clear(); layout(); draw(); }, 220);
    }, { passive: true });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) pause(); else if (state.live) play();
    });

    new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        state.live = e.isIntersecting;
        if (REDUCED) return;
        if (e.isIntersecting && !document.hidden) play(); else pause();
      });
    }, { threshold: 0.12 }).observe(host);

    host.addEventListener("click", function () { if (!REDUCED) go(pickRandom(), true); });

    const boot = document.getElementById("boot");
    if (boot) {
      const skip = function () {
        boot.classList.add("done");
        window.removeEventListener("wheel", skip);
        window.removeEventListener("keydown", skip);
        window.removeEventListener("pointerdown", skip);
      };
      window.addEventListener("wheel", skip, { once: true, passive: true });
      window.addEventListener("keydown", skip, { once: true });
      window.addEventListener("pointerdown", skip, { once: true });
      setTimeout(skip, 1700);
    }
  }

  // app.js nudges the scene while the assistant is thinking or answering.
  window.__asciiAct = function (a) {
    if (REDUCED || !state.ready) return;
    if (a === "coding") { const i = SCENES.findIndex(function (s) { return s.id === "coding"; }); if (i >= 0) go(i, false); }
  };
  window.__asciiInit = init;
  window.__asciiState = state;
  window.__asciiSkipBoot = function () {
    const b = document.getElementById("boot");
    if (b) b.classList.add("done");
  };
  window.__sceneState = function () {
    return { scene: SCENES[state.scene].id, label: SCENES[state.scene].label,
             frame: state.frame, frames: SCENES[state.scene].frames.length,
             built: cache.size, live: state.on };
  };
  window.__sceneGo = function (i) { if (SCENES[i]) go(i, false); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
