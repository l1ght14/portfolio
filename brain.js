(function () {
  "use strict";
  const host = document.getElementById("ascii-brain");
  if (!host) return;
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BODY = [
    "     .----------.     ",
    "   .'  $$    $$  '.   ",
    "  /   $$$$  $$$$   \\  ",
    " |   $$$$$$$$$$$$   |  ",
    "|   $$$ ::  :: $$$   |  ",
    "|   $$  (o)  (o)  $$  |  ",
    "|   $$$ ::  :: $$$   |  ",
    "|   $$$$$$$$$$$$$$   |  ",
    " \\  $$$$$$$$$$$$  /   ",
    "   '.  $$    $$  .'   ",
    "     '----------'     "
  ];
  const FACES = {
    idle:  { eye: "-  -", mouth: " --- " },
    code:  { eye: "^  ^", mouth: "==>>" },
    think: { eye: "-  -", mouth: " ... " },
    clean: { eye: "^  o", mouth: " ~   " },
    happy: { eye: "^  ^", mouth: " ^^ " }
  };
  const ORDER = ["idle", "code", "idle", "think", "idle", "clean", "idle", "code"];
  const CURSOR = ["|", "/", "-", "\\"];
  const FX = {
    code: [
      "> import torch",
      "> model.fit(X, y)",
      "> loss.backward()",
      "> ██████████  84%",
      "> torch.save(net)",
      "> epoch 12/50 ok"
    ],
    think: [
      "* chain-of-thought...",
      "  . . . collecting facts",
      "  ? ranking candidates",
      "  * grounding answer",
      "  . validating sources"
    ],
    clean: [
      "sweep .........  62%",
      "sweep ######...  88%",
      "sweep ##########  done",
      "tidying artefacts  ok"
    ],
    idle: ["prakash@portfolio: ~$", "rag pipeline ........ online", "74 facts indexed ...... ready"]
  };
  let act = 0, tick = 0, frame = 0, ci = 0, live = true;
  const state = { act: "idle", scroll: 0 };

  function logLines() {
    const pool = FX[state.act] || FX.idle;
    const n = pool.length;
    return Array.from({ length: 3 }, (_, i) => pool[(state.scroll + i) % n]);
  }

  function frameHTML() {
    const f = FACES[state.act] || FACES.idle;
    const body = BODY.slice();
    body[5] = "|   $$  " + f.eye + "  $$  |  ";
    body[10] = "     '---" + f.mouth + "---'     ";
    const logs = logLines();
    const cur = CURSOR[(frame >> 3) % CURSOR.length];
    return body.join("\n") +
      "\n" + logs.map((l, i) => "   " + l + (i === logs.length - 1 ? " " + cur : "")).join("\n");
  }

  function render() {
    host.innerHTML = frameHTML();
    host.className = "ascii-brain" + (state.act === "code" ? " hot" : state.act === "clean" ? " cool" : "");
  }

  function step() {
    if (!live) return;
    tick++;
    if (tick % 5 === 0) {
      state.act = ORDER[act % ORDER.length];
      act++;
      state.scroll++;
    }
    frame++;
    render();
    setTimeout(step, 260);
  }

  const io = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting && !live) { live = true; step(); }
      else if (!e.isIntersecting && live) { live = false; }
    });
  }, { threshold: 0.15 });
  io.observe(host);

  host.addEventListener("click", () => {
    state.act = state.act === "code" ? "idle" : "code";
    render();
  });

  if (REDUCED) { state.act = "idle"; render(); }
  else { render(); step(); }
  window.__brainSet = a => { if (FACES[a]) { state.act = a; render(); } };
})();
