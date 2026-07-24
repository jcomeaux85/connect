// aiProvider — the ONLY place BEN|connect knows an AI vendor exists.
// Every feature calls invokeAI(); the vendor behind it is env config.
//
//   VITE_AI_PROVIDER = 'base44' (default) | 'anthropic' | 'openai_compat'
//   VITE_AI_BASE_URL = your server proxy base (required for non-base44 providers;
//                      keys live server-side, never in the browser)
//   VITE_AI_MODEL    = model id for non-base44 providers
//
// Contract (matches Base44 InvokeLLM so existing code needs no reshaping):
//   invokeAI({ prompt, response_json_schema?, add_context_from_internet? })
//   -> string when no schema, parsed object when schema provided.
// Copilot is intentionally not, and will never be, a provider here.

import { base44 } from "@/api/base44Client";

const PROVIDER = import.meta.env.VITE_AI_PROVIDER || "base44";
const BASE_URL = import.meta.env.VITE_AI_BASE_URL || "";
const MODEL = import.meta.env.VITE_AI_MODEL || "";

function schemaInstruction(schema) {
  return `\n\nRespond ONLY with valid JSON matching this schema, no markdown fences, no preamble:\n${JSON.stringify(schema)}`;
}

function parseMaybeJSON(text, schema) {
  if (!schema) return text;
  const clean = String(text).replace(/```json|```/g, "").trim();
  try {
    return JSON.parse(clean);
  } catch {
    // Last resort: extract first {...} block
    const m = clean.match(/\{[\s\S]*\}/);
    if (m) { try { return JSON.parse(m[0]); } catch { /* fall through */ } }
    throw new Error("aiProvider: model did not return valid JSON");
  }
}

const drivers = {
  // Demo phase — Base44's built-in LLM.
  async base44(payload) {
    return base44.integrations.Core.InvokeLLM(payload);
  },

  // Ship target — Anthropic Messages API via your server proxy.
  async anthropic({ prompt, response_json_schema }) {
    const body = {
      model: MODEL || "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{
        role: "user",
        content: response_json_schema ? prompt + schemaInstruction(response_json_schema) : prompt
      }]
    };
    const res = await fetch(`${BASE_URL}/v1/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`aiProvider(anthropic): ${res.status}`);
    const data = await res.json();
    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("\n");
    return parseMaybeJSON(text, response_json_schema);
  },

  // Catch-all — anything speaking the /v1/chat/completions dialect
  // (OpenAI, Gemini-compat, Groq, Ollama/local offline LLM, etc.)
  async openai_compat({ prompt, response_json_schema }) {
    const body = {
      model: MODEL,
      messages: [{
        role: "user",
        content: response_json_schema ? prompt + schemaInstruction(response_json_schema) : prompt
      }]
    };
    if (response_json_schema) body.response_format = { type: "json_object" };
    const res = await fetch(`${BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`aiProvider(openai_compat): ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return parseMaybeJSON(text, response_json_schema);
  }
};

export async function invokeAI(payload) {
  const driver = drivers[PROVIDER];
  if (!driver) throw new Error(`aiProvider: unknown provider "${PROVIDER}"`);
  return driver(payload);
}
