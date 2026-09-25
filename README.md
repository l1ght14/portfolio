# Prakash Sharma — AI Portfolio

A one-page AI portfolio with a **RAG chat assistant** built in: visitors land on the page and can interrogate a bot that is grounded strictly on Prakash's career documents.

- **Stack:** vanilla HTML/CSS/JS, zero dependencies, no build step.
- **Chat:** client-side TF-IDF retrieval over a 102-chunk knowledge base + an LLM generation step that runs server-side through `api/chat.js`.
- **Keys:** live in environment variables, never in the browser.

---

## 1. How the chat works (RAG pipeline)

```text
visitor question
      |
      v
[ app.js ]  tokenize -> TF-IDF cosine over data.js KB -> top 4 chunks
      |
      v
POST /api/chat   { question, context }
      |
      v
[ api/chat.js ]  server-side system prompt + retrieved context
      |          -> Gemini (GEMINI_API_KEY)
      |          -> falls back to Groq (GROQ_API_KEY)
      v
answer -> rendered in the terminal chat window
```

**Graceful degradation:** if `/api/chat` is unavailable (opened as a local file, or hosted on plain static hosting) the bot returns the retrieved knowledge-base sentences directly. The chat never breaks — it just answers in retrieval mode.

**Guardrails (two layers):**
1. **Retrieval:** if the best match scores below `0.05` the question is treated as off-topic.
2. **Prompt:** the server-side system prompt instructs the model to answer only from context, never invent facts, and to refuse anything outside Prakash's profile, skills, experience, projects, education or contact details.

Try it: ask `What is the weather today?` -> `I can only answer questions about Prakash Sharma...`

---

## 2. Deploy to Vercel (recommended, ~3 minutes)

Vercel runs the static files *and* the serverless function, so the LLM path works and keys stay server-side.

1. **Get a free API key** (either one is enough, both is fine):
   - Gemini: <https://aistudio.google.com/apikey>
   - Groq: <https://console.groq.com/keys>
2. **Push the `site` folder to GitHub:**
   ```bash
   cd D:\portfolio\site
   git init
   git add .
   git commit -m "portfolio: AI portfolio with RAG chat"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
3. **Import on Vercel:** <https://vercel.com/new> -> select the repo -> **Deploy** (no build settings needed; Vercel serves static files and auto-detects `api/chat.js`).
4. **Add environment variables:** Project -> **Settings** -> **Environment Variables**:

   | Name | Value | Required |
   |---|---|---|
   | `GEMINI_API_KEY` | your Gemini key | one of the two |
   | `GROQ_API_KEY` | your Groq key | one of the two |
   | `GEMINI_MODEL` | comma-separated list, defaults to `gemini-2.5-flash-lite,gemini-3-flash,gemini-3.1-flash-lite,gemini-2.0-flash` | optional |
   | `GROQ_MODEL` | comma-separated list, defaults to `llama-3.3-70b-versatile,llama-3.1-8b-instant` | optional |

   The model variables are **optional**. Each is a fallback chain: if the first model is unavailable on your key or quota tier, the next one is tried automatically, then the other provider, and finally the local retrieval fallback. Leave them blank unless you want to pin a specific model.

   Apply to **Production** (and Preview if you want preview deploys to chat too).
5. **Redeploy:** Deployments -> latest -> **Redeploy** (env vars only apply to new builds).
6. **Verify:** open the URL, click a suggestion chip. A generated sentence = LLM live. A raw document sentence = still in retrieval mode (check env vars / redeploy).

Set both keys and Gemini is tried first, with Groq as automatic fallback.
---

## 3. Other hosting options

| Platform | Chat mode | How |
|---|---|---|
| **Vercel** (recommended) | LLM + retrieval | Import repo, add env vars, deploy |
| **Netlify** | LLM + retrieval | Move `api/chat.js` to `netlify/functions/chat.js`, export `exports.handler = async (event) => ({ statusCode: 200, body: JSON.stringify({ answer }) })`, set env vars in Site settings |
| **Cloudflare Pages** | LLM + retrieval | Move to `functions/api/chat.js`, export `export async function onRequestPost(ctx)`, set env vars in Pages settings |
| **GitHub Pages** | retrieval only | Push the static files; no serverless runtime, so the bot answers from the knowledge base without LLM generation |

**GitHub Pages quick path** (no keys at all):
```bash
cd D:\portfolio\site
git init && git add . && git commit -m "portfolio"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```
Then Repo -> **Settings** -> **Pages** -> Source: `main` / root -> Save.

---

## 4. Project structure

```text
site/
  index.html        markup: hero + chat, metrics, experience, projects, skills, education, contact
  styles.css        all styling + design tokens
  data.js           window.KB — 102 knowledge-base chunks powering the RAG retrieval
  app.js            retrieval (TF-IDF cosine), chat UI, typewriter, scroll reveals
  brain.js          autonomous ASCII brain: 3D drift, per-state motion, click-to-lock
  scenes.js         ASCII scene player: plays the baked GIF scenes at random
  assets/scenes.js  generated ASCII frame data (run-length encoded)
  assets/avatar.jpg the site photo, shown as a photo
  api/chat.js       serverless endpoint: holds API keys server-side, calls Gemini/Groq
  .env.example      template of env var names
  .gitignore        keeps .env and secrets out of git
  README.md         this file

tools/
  bake_scenes.py    bakes the reference GIFs in image/ into assets/scenes.js
```

The ASCII scenes are **generated, not hand-written**. The source GIFs are
reference material and are kept outside this repo (in `image/` next to the
site folder, or wherever `SCENE_GIFS` points). To change them, edit the
`SCENES` list in `tools/bake_scenes.py` and re-run:

```bash
python tools/bake_scenes.py     # rewrites assets/scenes.js
```

It crops each animation to its content, keys out the flat background,
normalises tone once per scene so playback does not flicker, caps density on
scenes that would otherwise render as a solid wall, and run-length encodes
the result. The bake is deterministic: re-running it on unchanged input
reproduces `assets/scenes.js` byte for byte.

---

## 5. Run locally

**Static (no LLM, retrieval mode):**
```bash
cd D:\portfolio\site
python -m http.server 8000
# open http://localhost:8000
```
Or just double-click `index.html` — it works from `file://` too.

**With the LLM (full mode):** install the [Vercel CLI](https://vercel.com/docs/cli), create a `.env` file from `.env.example` with your keys, then:
```bash
cd D:\portfolio\site
vercel dev
```
`vercel dev` runs the function locally with your env vars. `.env` is git-ignored — never commit it.

---

## 6. Customizing

**Content (experience, projects, metrics):** edit `index.html`. Sections are in order: hero (chat), metrics band, `// 01 — experience`, `// 02 — projects`, `// 03 — skills`, `// 04 — education`, `// 05 — contact`.

**Chat knowledge base:** edit `data.js`. Each chunk is one factual sentence or two — small chunks retrieve better than long paragraphs:
```js
{ t: "experience", s: "He cut RAG response latency from 30+ seconds to under 10 seconds..." }
```
Add, remove or reword chunks and the bot picks them up on reload — no rebuild, no re-embedding step.

**Colors and fonts:** design tokens live in `styles.css` at the top:
```css
:root{
  --bg:#0C1E29;      /* page background */
  --acid:#FFFE15;    /* accent: name, metrics, CTA, chat accents */
  --sky:#B0EDF9;     /* secondary: links, labels, tags */
  --ink:#E8F0F2;     /* body text */
}
```
Fonts are loaded in `index.html` (Space Grotesk + JetBrains Mono).

**Tuning retrieval:** the relevance floor is `0.05` in `app.js` (`fallback()` and `ask()`). Raise it for stricter matching, lower it for more permissive answers. `retrieve()` takes the top 4 chunks — raise for more context, at the cost of more tokens.
---

## 7. Security notes

- **API keys never reach the browser.** They are read from `process.env` inside `api/chat.js` and are never echoed into responses.
- **Input is validated server-side:** question capped at 300 chars, context at 4000 chars, method must be `POST`, malformed bodies return `400`.
- **Errors are generic.** Failures return `Model provider unavailable` / `Request failed` — never provider payloads, keys or stack traces.
- **Prompt is enforced server-side.** The retrieval context is passed from the client for speed, but the scope-limiting system prompt lives in `api/chat.js:1`, so a tampered client cannot broaden what the bot will discuss.
- **`.env` is git-ignored.** Keep it local; configure real values in your host's dashboard.
- **Recommended hardening (optional):** restrict each provider key to your domain where the provider supports it, and add a rate limit (Vercel Edge Config, Upstash, or a platform WAF) if the endpoint starts getting real traffic. A per-instance in-memory counter is deliberately not used — it resets on every deploy and splits across replicas.

---

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Bot answers with raw document sentences | `/api/chat` unavailable or no key set | Deploy with the function + env vars, then **Redeploy** (env vars do not apply retroactively) |
| `Model provider unavailable` | Key invalid, quota exhausted, or model name wrong | Check Vercel logs; try the other provider; verify `GEMINI_MODEL` / `GROQ_MODEL` |
| Bot says "I can only answer questions about Prakash Sharma" to a valid question | Retrieval score below the `0.05` floor | Rephrase, or add matching wording to `data.js` |
| Page unstyled after deploy | `styles.css` not committed | `git add styles.css && git commit && git push` |
| `POST /api/chat` 501 locally | Plain static server has no function runtime | Expected — use `vercel dev` for full mode |
| Works locally, not on Vercel | Env vars added after the build | Settings -> Environment Variables -> Redeploy |

---

## 9. Content fact sheet

Every claim on this site is traceable to Prakash's career source documents. Metrics used, exactly as worded:

| Metric | Meaning |
|---|---|
| `30s -> <10s` | RAG response latency cut at Tradxlink (tree summarization -> compact generation) |
| `~50%` | LLM token cost reduction via generation redesign |
| `~80%` | Manual effort cut through Python + Selenium + Sheets automation (Edxso) |
| `13` | Users on Mira, a live AI receptionist product (beta) |

Project maturity is labelled honestly: **Mira** = live beta, **Redax** = in progress, **TrimStack** = in development. No salary figures appear anywhere in the knowledge base.

---

## 10. Contact

- Email: prakash.sharma.1462003@gmail.com
- Phone: +91 8349353477
- LinkedIn: linkedin.com/in/prakash-sharma-ps
- GitHub: github.com/l1ght14

Add the deployed URL to your resume next to these links — recruiters can interrogate the bot before they ever email you.
