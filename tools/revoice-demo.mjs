// Re-records the audio in demo/ from demo/demo.json's text with the current voices.
// Usage: POLLINATIONS_API_KEY=sk_... node tools/revoice-demo.mjs
import { readFile, writeFile } from "node:fs/promises";
import { STALLS, CUSTOMERS, customerVoice } from "../prompts.js";
import { speak } from "../engine.js";
const key = process.env.POLLINATIONS_API_KEY;
const d = JSON.parse(await readFile("demo/demo.json", "utf8"));
const stall = STALLS.find((s) => s.vendor === d.lines.find((l) => l.who === "vendor").name);
const customer = CUSTOMERS.find((c) => c.name === d.lines.find((l) => l.who === "customer").name);
for (const l of d.lines) {
  if (!l.audio) continue;
  const voice = l.who === "vendor" ? stall.voice : customerVoice(stall, customer);
  await writeFile(l.audio, Buffer.from(await (await speak(key, l.zh, voice)).arrayBuffer()));
  console.log(l.audio, voice);
}
