const SYS = "You are the portfolio assistant of Prakash Sharma. Answer ONLY from the provided context about him. Keep answers under 120 words, factual and friendly. Never invent facts, metrics or technologies. If the question is not about Prakash Sharma's profile, skills, experience, projects, education or contact details, reply that you can only answer questions about Prakash Sharma.";
const MAX_Q = 300;
const MAX_CTX = 4000;
const TIMEOUT_MS = 20000;

async function gemini(q, ctx, key) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/" + (process.env.GEMINI_MODEL || "gemini-2.5-flash-lite") + ":generateContent?key=" + key;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYS }] },
      contents: [{ parts: [{ text: "Context:\n" + ctx + "\nQuestion: " + q }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 300 }
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!r.ok) return null;
  const j = await r.json();
  const parts = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts;
  return parts && parts[0] && parts[0].text ? parts[0].text : null;
}

async function groq(q, ctx, key) {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.4,
      max_tokens: 300,
      messages: [
        { role: "system", content: SYS },
        { role: "user", content: "Context:\n" + ctx + "\nQuestion: " + q }
      ]
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!r.ok) return null;
  const j = await r.json();
  const msg = j.choices && j.choices[0] && j.choices[0].message;
  return msg && msg.content ? msg.content : null;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
    const question = String(body.question || "").slice(0, MAX_Q).trim();
    const context = String(body.context || "").slice(0, MAX_CTX);
    if (!question) {
      res.status(400).json({ error: "Missing question" });
      return;
    }
    let answer = null;
    if (process.env.GEMINI_API_KEY) answer = await gemini(question, context, process.env.GEMINI_API_KEY);
    if (!answer && process.env.GROQ_API_KEY) answer = await groq(question, context, process.env.GROQ_API_KEY);
    if (!answer) {
      res.status(502).json({ error: "Model provider unavailable" });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json({ answer: answer });
  } catch (e) {
    res.status(500).json({ error: "Request failed" });
  }
};
