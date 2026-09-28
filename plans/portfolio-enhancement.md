# Portfolio Enhancement Plan

Status: draft, awaiting go-ahead on each step
Created: 2026-09-26
Scope: `D:\portfolio\site` (deployed from `github.com/l1ght14/portfolio`)

## Objective

Raise recruiter/hiring-manager conversion of the portfolio, based on a
2026 audit of what strong technical portfolios actually do, prioritised by
signal-per-hour-of-effort.

## Research basis

Sources consulted (2026-09-26):

- O2Ten, *Building a Portfolio That Gets Noticed* — four-project front-page
  structure; "a cheap custom domain is the single highest-leverage portfolio
  investment"; no-metrics is the top mistake for international candidates;
  ten weak projects on display signals "side-project hobbyist".
- Yara, *Do Recruiters Actually Look at Your GitHub?* — recruiter and hiring
  manager are different audiences; "what you chose, what you gave up, and
  why is the single most convincing thing an engineer can read about you";
  README first screen must be one sentence plus a screenshot or live link;
  six pins is the whole portfolio.
- dev.to, *Optimizing Your GitHub Profile* — six seconds on a resume, longer on
  GitHub; green flags are documentation, structure, evidence of testing,
  real problems, commit messages that explain why.
- FolioX, *How to Build a Developer Portfolio* — mini case study per project
  (problem, role, tech, outcome) in 3–5 sentences; human About section.
- Seera, *Portfolio Website Builders 2026* — fast load and mobile review are
  baseline expectations.
- Colourlib / Envato / TheCSSAgency 2026 trend roundups — dark high-contrast,
  scroll-triggered motion, micro-interactions; pick two or three, not all.
- GitHub community discussion #169760 — pin polished repos with live links;
  track a `learning` tag then promote finished work.

## Already strong — do not regress

These are ahead of the median candidate and are the reason this site works.
Any step must preserve them.

- Four case studies in Problem / What I did / Result form (retrieval security,
  RAG latency, 300-page documents, government-crawler ingestion).
- Real metrics with numbers: 30s→<10s, ~50% cost, ~80% automation, 13 users.
- PRODUCTION / PROJECT / LEARNING evidence labelling on the stack.
- Retrieval-only RAG chatbot with refusal on out-of-scope questions.
- ~167 KB local first load (index + CSS + JS + data + avatar), no trackers, no
  framework. `og.png` (143 KB) is crawler-only and `resume.pdf` (220 KB) is
  click-through, so neither is on the critical path.
- Open-to-work status bar, resume link, honest FAQ including a "no cloud/K8s
  production ownership" answer.

## Ownership legend

| Tag | Meaning |
|-----|---------|
| **[A]** | Agent can build, verify and ship end to end without input |
| **[A+H]** | Agent builds; human must supply or confirm the truth |
| **[H]** | Human only; no code involved, agent cannot do it |

---

## Step 1 — Promote the test suite into the repo **[A]**

The Playwright checks currently live in `%TEMP%` and are lost on reboot, so
"verify" is not reproducible for you or a future agent.

This is not a hard dependency for Steps 5, 6 and 7 (pure markup, metadata and
one script tag — verifiable by eye). It *is* worth doing before Steps 2, 4 and
8, which change rendered output, chat behaviour and focus order respectively.
Do it first; it is cheap.

Tasks:
- Create `tools/check.py` from the existing chat-regression and responsive
  checks (12 chat cases, 5 viewports, reduced-motion, photo load, frame
  advance, zero page errors).
- Create `tools/links.py` to re-verify every outbound link returns 200.
- Add a keyboard-focus walk to `check.py`, covering the defect found in
  Step 8, so it cannot silently regress.
- Add the contrast assertions for the specific pairs named in Step 8.

Exit criteria: `python tools/check.py` exits 0 from a clean clone.
Verify: run it before and after every subsequent step.

---

## Step 2 — Add trade-offs to the case studies **[A+H]**

Highest signal-per-hour change available. The audit was emphatic that
"what you chose, what you gave up, and why" is the part a template cannot
produce, and that it quietly selects your own interview questions.

There are **four** case studies: retrieval security, RAG latency, 300-page
documents, government-crawler ingestion. Current shape of each: Problem /
What I did / Result. Missing: the decision.

Agent drafts one `Trade-off` line per case from facts already on the page.
Human confirms accuracy — this is the one place the agent must not improvise,
because a wrong claim about your own engineering is a credibility risk.

Examples of the shape (drafted, not factual claims):
- Retrieval security — *Chose enforcing access in the query engine before
  vector search rather than filtering after generation. Gave up a single
  unified retrieval path, because post-generation filtering cannot un-leak
  data that already reached the prompt.*
- Latency — *Chose a single-pass summary over tree summarisation. Gave up
  hierarchical context on very long documents, which is why 300-page inputs
  needed a separate GridFS path.*
- 300-page documents — *Chose references plus on-demand rebuild over storing
  the index inline. Gave up a warm index cache, paying reconstruction cost
  per query.*
- Government crawlers — *draft pending; the page currently states the outcome
  but not the ingestion/storage decision.*

Tasks: add the field, extend the knowledge base so the chatbot can answer
"what trade-offs did you make", update the matching `data.js` chunk.

Exit criteria: chatbot answers the trade-off question from the KB; no
existing chat-regression case regresses.

---

## Step 3 — Visual proof for the case studies **[A+H]**

Every source asks for screenshots or diagrams. The three case studies are
text-only; only the architecture section has SVG.

Blocked on the human: confidentiality. A real Tradvisor screenshot may not be
shareable.

Agent builds the slot: figure/figcaption in each case, lazy-loaded, with a
placeholder and a graceful no-image state.
Human supplies: redacted screenshot, a synthetic mock, or an explicit decision
to stay text-only.

Exit criteria: no layout shift when images load; page weight impact stated.

---

## Step 4 — Curate the project front page **[A]**

16 repo tiles next to 6 bento cards reads as volume. The audit recommends
four projects on the front page and treating the rest as browsable depth.

Tasks:
- Promote 3–4 to featured with the deep / production / quick-build /
  personal roles the research recommends (TrimStack or the fraud detector fit
  "quick build").
- Move the 16-grid behind a `<details>` "browse all 16 repositories" toggle,
  default closed, so it costs nothing to a skimming reader.
- Keep all 16 links intact and verified; this is about emphasis, not removal.

Exit criteria: 16 links still resolve; first paint of the projects section is
measurably lighter.

---

## Step 5 — Consolidate navigation **[A]**

Eight nav items against a 90-second skim. Target five.

Proposed: work, projects, stack, experience, contact. Fold `architecture` into
`work` and `capabilities` into `stack`, keeping their headings and anchors
intact so nothing is orphaned.

Exit criteria: no dangling `#anchor`; all existing anchor links resolve.

---

## Step 6 — Search and shareability **[A]**

- `robots.txt`, `sitemap.xml`, canonical URL.
- `og:image` is 143 KB PNG; add `og:image:width/height` (present), consider
  WebP and a smaller variant.
- JSON-LD `Person` schema: name, jobTitle, worksFor, sameAs (GitHub, LinkedIn),
  alumniOf, knowsAbout. This is the single cheapest structured-data win for
  recruiter search.
- Ensure one `<h1>` and a sane heading order (audit during Step 8).

Exit criteria: valid JSON-LD parses; every link in head resolves.

---

## Step 7 — Cookieless analytics **[A]**

Currently zero visibility into whether the email CTA converts, and the site
cannot distinguish a visitor from a bounce.

- Add Vercel Analytics (cookieless, no banner, no consent prompt) or
  self-hosted Plausible. Must not contradict the "no trackers" footer claim —
  either is defensible; Google Analytics is not, as it would break that claim.

Human: enable the Vercel project setting if the script alone is not enough.

Exit criteria: a real hit appears in the dashboard; no cookie banner appears.

---

## Step 8 — Accessibility and performance pass **[A]**

One confirmed defect first, then the general pass.

**Confirmed bug:** `styles.css:101` sets `.chat-input input:focus{outline:none}`.
The global `:focus-visible` rule at `styles.css:25` is therefore cancelled for
the single most important control on the page — the chatbot input. A keyboard
user cannot tell when the chatbot has focus. That is a WCAG 2.4.7 failure and
should be fixed regardless of anything else in this step. Replace with a
visible `:focus-within` treatment on `.chat-input` so the whole field lights
up, not just the bare input.

Then the general pass:

- Contrast audit of `--dim` on `--deep` and of the acid accent on panel
  surfaces; fix any below WCAG AA.
- `font-display: swap` on the Google Fonts load, plus preconnect.
- `loading="lazy"` / `decoding="async"` on below-fold imagery.
- Confirm keyboard-only navigation reaches the chatbot, the scene player and
  every nav item. `#scenes` already has `:focus-visible`; verify it is
  reachable given it sits below the fold.

Exit criteria: no console errors; full keyboard path works with a visible
focus indicator at every stop; contrast passes AA.

---

## Step 9 — Custom domain **[H → A]**

Called the single highest-leverage investment. Currently a subdomain.

Human: buy a `.dev` or `.com` (~$12–15/yr) and give agent DNS access or
permission to configure records.
Agent: Vercel domain, DNS, canonical URL, sitemap, OG URL, `mailto` and
social links, then verify no 404s and HTTPS is enforced.

Exit criteria: apex and `www` both resolve, HTTPS enforced, canonical set.

---

## Step 10 — LinkedIn and GitHub hygiene **[H]**

No code. Agent can advise, cannot execute.

- Enable LinkedIn "Open to Work" (recruiter-only and public toggle) with the
  target titles and the portfolio URL in the headline.
- Pin the six repos that match the featured four. Unpin coursework, forks and
  anything stale — the audit notes clustered old dates read as "hasn't built
  since school".
- Add a profile README answering: who, what you build, what you are good at.
- Add a live link to the portfolio in the email signature and LinkedIn.

---

## Step 11 — Social proof **[H]**

- One or two short quotes from a colleague, manager or internship supervisor.
  A single named sentence outperforms an empty testimonials block.
- Ask while it is fresh; a former supervisor is easiest.

Agent: build the component once the quotes exist.

---

## Step 12 — The personal project slot **[H]**

The recommended four-project structure includes a personal project, and the
current page has no slot for it. Notably, the hamster GIF that was removed was
the only personal signal on the site.

Human: pick something that is genuinely yours and small — a tool, an analysis,
something for a community or hobby. It does not need to be impressive, only
yours.
Agent: build the card once chosen.

---

## Execution order and parallelism

| Step | Depends on | Can run with |
|------|-----------|--------------|
| 1 Promote tests | — | do first; hard dep for 2, 4, 8 |
| 2 Trade-offs | 1 | 5, 6, 7, 8 |
| 4 Curate projects | 1 | 2, 5, 6, 7, 8 |
| 5 Nav | — | 2, 4, 6, 7, 8 |
| 6 SEO/schema | — | 2, 4, 5, 7, 8 |
| 7 Analytics | — | 2, 4, 5, 6, 8 |
| 8 A11y/perf | 1 | 2, 4, 5, 6, 7 |
| 3 Visuals | 1 | blocked on human assets |
| 9 Domain | — | blocked on human purchase |
| 10–12 | — | human only, no code |

Steps 2, 4, 5, 6, 7 and 8 touch disjoint files and can run in parallel by
separate agents. Note that 5, 6 and 7 genuinely have no dependency on Step 1
and can start immediately.

## Rollback

Each step is one commit with a conventional-commit message. Direct mode, no
branches: `git revert <sha>` restores any single step without touching the
others. Ship steps 5, 6 and 7 together — they are low-risk and individually
unverifiable in isolation.

## Corrections log

An adversarial pass over this plan found two errors in the agent's own audit
claims, both now fixed above:

- The audit reported "three case studies" — there are **four**.
- The audit reported "~311 KB first load" — the actual local first load is
  **~167 KB**; 311 KB was an overcount that included non-critical-path assets.

It also surfaced a confirmed accessibility defect that the original audit had
only listed as a "risk": the chat input's focus ring is actively removed.
