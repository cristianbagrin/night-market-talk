// Runs the two-AI conversation. Works in the browser and in Node 22+.
import { buildMessages, buildWordList, parseLine, TTS_MODEL } from "./prompts.js";

const API = "https://gen.pollinations.ai";
export const MAX_LINES = 12;

// Set by the caller: text -> pinyin (see pinyin.js).
let toPinyin = () => "";
export const setPinyin = (fn) => (toPinyin = fn);

async function chat(key, model, messages) {
  const res = await fetch(`${API}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, response_format: { type: "json_object" }, max_tokens: 1500 }),
  });
  if (!res.ok) {
    const err = new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }
  const j = await res.json();
  return j.choices?.[0]?.message?.content ?? "";
}

export async function nextLine(key, model, ctx) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const line = parseLine(await chat(key, model, buildMessages(ctx)));
      return { ...line, pinyin: toPinyin(line.zh) };
    } catch (e) {
      lastErr = e;
      if (e.status && e.status < 500 && e.status !== 429) break;
    }
  }
  throw lastErr;
}

export async function wordList(key, model, history) {
  const raw = await chat(key, model, buildWordList(history));
  const m = String(raw).match(/\{[\s\S]*\}/);
  return (JSON.parse(m ? m[0] : raw).words || []).slice(0, 10).map((w) => ({ zh: w.zh, en: w.en, pinyin: toPinyin(w.zh) }));
}

export async function speak(key, text, voice) {
  const res = await fetch(`${API}/v1/audio/speech`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: TTS_MODEL, input: text, voice }),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  return res.blob();
}

// Decides whether the conversation is over after `lines` (spoken lines only).
export function isOver(lines) {
  const n = lines.length;
  if (n >= MAX_LINES) return true;
  if (n < 2) return false;
  return lines[n - 2].end; // the other side said goodbye and this one has answered
}
