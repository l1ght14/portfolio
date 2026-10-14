# Human Steps — Your Checklist

Everything on this page needs **you**, not me. Nothing here needs me to build
it; some of it needs me afterwards to build the component once you supply it.

Companion doc: `portfolio-enhancement.md` (full 12-step plan with the
agent/human split).

---

## Part A — Do this week (~90 minutes total)

### 1. Review my trade-off drafts  ·  ~20 min  ·  BLOCKS the highest-value change
Your four case studies currently say Problem / What I did / Result. They are
missing the decision — what you chose, what you gave up, and why. Research is
emphatic that this is the single most convincing thing an engineer can read
about you, because a template cannot produce it.

I will draft all four from facts already on your page. **You only correct
them.** Do not rewrite from scratch — the value is your real reasoning, and I
am deliberately not guessing at engineering decisions you made.

Also set up the custom domain in the same sitting — buying it is the task,
I do the configuration after.

### 2. LinkedIn hygiene  ·  ~15 min  ·  do not delegate
- Turn on the **Open to Work** banner (both recruiter-only and public).
- Put the portfolio URL in your **headline**, not just the About section.
- Add the URL to your **email signature**.
- Ask two people for a one-line quote (see #4). Do it in the same message.

### 3. Pin your GitHub repos  ·  ~10 min
You get six pins and nobody scrolls past them, so the pinned six *are* your
portfolio. Pin the four featured projects from the makeover. Unpin coursework,
forks and anything stale — a cluster of repos that all stopped updating at once
reads as "hasn't built since school".

Add a **profile README** answering three questions in under ten seconds: who
are you, what do you build, what are you good at.

### 4. Collect two quotes  ·  ~10 min to ask, weeks to get
One named sentence from a colleague, manager or internship supervisor beats an
entire empty testimonials block. Ask your former operations supervisor — easiest
ask, freshest memory. One message: *"Would you write one sentence I could quote
on my portfolio about working with me?"*

---

## Part B — Decide, then I build

### 5. Screenshots for the case studies  ·  your decision
Every case study is text-only right now; research asks for visual proof.
Three options, in order of preference:
- **Redacted screenshot** of Tradvisor, with customer data masked.
- **Synthetic mock** — I can build a realistic UI mock from the flow you
  describe. Zero confidentiality risk, and recruiters cannot tell.
- **Text-only, permanently.** Fine, but then the case studies stay abstract.

Your call. If you pick mock, describe the screen and I'll build it.

### 6. Pick a personal project  ·  your call, then my build
The recommended structure is four projects: deep / production / quick-build /
personal. Your personal slot is the only empty one. It does not need to be
impressive, only yours — a tool, an analysis, something for a hobby or a
community. (Ironically the hamster GIF was the only personal signal on the page,
and it got cut.)

### 7. Decide on skill proficiency bars  ·  read the warning below first
Three of the five references you added use them. **Do not adopt them.** Your
PRODUCTION / PROJECT / LEARNING evidence labels are stronger than a
self-assigned "HTML 90%", which is unverifiable and which recruiters
specifically discount. This would be a regression on your best differentiator.

---

## Part C — Only me

You do not need to do anything for these; I will run them in parallel while you
work through Part A.

| Step | What I do |
|------|-----------|
| 1 | Move the test suite into the repo so verification survives a reboot |
| 4 | Curate the project front page, demote the 16-repo grid |
| 5 | Nav 8 → 5 items |
| 6 | robots.txt, sitemap, JSON-LD `Person` schema, canonical |
| 7 | Cookieless analytics (you may need to flip one Vercel toggle) |
| 8 | Accessibility + performance — **already fixed the chat-input focus bug** |

---

## Part D — Reference Verdict

You added five page-design references. I scored them on measured palette fit,
gap coverage, recruiter fit, implementation cost, originality, and regression
risk. Objective numbers first.

### Measurements

Your palette: `--deep #0C1E29` (luminance 0.105, hue 203°), `--acid #FFFE15`
(hue 60°), `--sky #B0EDF9` (hue 190°).

| Ref | Mean luminance | Dark pixels | Hue clusters | Colourfulness | Edge density | Accent hue | Gap to acid |
|-----|---------------|-------------|--------------|---------------|--------------|------------|-------------|
| R0 Saira (orange/navy) | 0.12 | 87% | 2 | 0.112 | 46.2 | 15° | 44.7° |
| R1 Han Nguyen (green/cream) | 0.53 | 16% | 6 | 0.188 | 58.3 | 35° | 24.7° |
| R2 Mac Magic (b/w retro) | 0.78 | 10% | 2 | 0.002 | 59.8 | none | n/a |
| R3 Shehan (black/amber) | 0.07 | 90% | 4 | 0.108 | **36.5** | 25° | 34.7° |
| R4 Samantha (orange) | 0.12 | 81% | 2 | 0.322 | 57.2 | 15° | 44.7° |

- **R2 is disqualified.** Luminance 0.78 against your 0.105 — it is a *light*
  theme and colourfulness 0.002 means it is effectively greyscale. Adopting it
  means inverting the entire design. The retro browser-window project cards are
  genuinely good, though, and worth stealing on their own.
- **R1 has the best ideas and the worst system.** Accent hue 35° is actually
  the closest to your acid yellow, and its Activities/Hobbies section fills your
  one real gap. But at 0.53 luminance and 6 hue clusters it is a near-total
  visual rebuild, and the editorial serif look reads graphic-designer, not
  backend engineer.

### Verdict: **R3 (Shehan) is the best base**, with ideas lifted from the others

R3 is the only reference whose whole system transfers. Its 0.07 luminance,
4 hue clusters and 36.5 edge density (the cleanest of the five) sit closest to
your existing deep-navy/acid identity, and its two signature moves — the huge
ghost/outlined section headings and the full-bleed hero portrait — are cheap to
add to your existing sections without restructuring anything.

It also scores worst on originality (5/10) and would regress if you copied its
skill bars. So take the system, not the template.

### What to take, from where

| Take | From | Why it earns its place |
|------|------|------------------------|
| Ghost/outlined heading repetition | R3 | Highest visual impact per line of CSS, matches palette exactly |
| Full-bleed hero portrait | R3 | Your photo is currently buried in About; recruiters meet you at the top |
| Testimonial cards | R0 | Fills your empty social-proof gap |
| Activities / Hobbies section | R1 | Fills your empty personal-project gap |
| Browser-window project cards | R2 | Apt for a web developer; makes GitHub links feel like real products |
| **Reject: skill % bars** | R0, R3, R4 | Regression — your evidence labels are better |
| **Reject: colour inversion** | R2 | Would undo your identity |
| **Reject: coral/amber accent swap** | R0, R4 | 45° hue gap; your acid yellow is the differentiator |

### The honest caveat

None of these five has what actually makes your site work: the four case
studies with real metrics, and the RAG chatbot that refuses out-of-scope
questions. Three of the five contain skill-percentage bars that research
identifies as padding. If this makeover chases the templates, you could end up
with a prettier site that converts worse.

The safe play is **additive**: lift the five devices above, change no existing
section, and re-measure after each one.
