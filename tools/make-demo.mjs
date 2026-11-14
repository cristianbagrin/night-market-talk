// Generates demo/demo.json and demo/*.mp3, the sample shown before a visitor connects.
// Usage: POLLINATIONS_API_KEY=sk_... node tools/make-demo.mjs
import { writeFile } from "node:fs/promises";
import { STALLS, CUSTOMERS, GOALS, LEVELS, MODELS, customerVoice } from "../prompts.js";
import { nextLine, wordList, speak, isOver, setPinyin } from "../engine.js";
import { makePinyin } from "../pinyin.js";
import * as pinyinPro from "pinyin-pro";
setPinyin(makePinyin(pinyinPro));

const key = process.env.POLLINATIONS_API_KEY;
const stall = STALLS.find((s) => s.id === "oyster");
const customer = CUSTOMERS.find((c) => c.id === "newcomer");
const goal = GOALS.find((g) => g.id === "deal");
const level = LEVELS.find((l) => l.id === "a2");
const models = { vendor: MODELS[0].id, customer: MODELS[1].id };
const label = (id) => MODELS.find((m) => m.id === id).label;

const history = [], spoken = [], lines = [];
let who = "customer";
while (!isOver(spoken, goal)) {
  const line = await nextLine(key, models[who], { role: who, stall, customer, goal, level, history });
  spoken.push(line);
  history.push({ who, zh: line.zh });
  const i = lines.length;
  const voice = who === "vendor" ? stall.voice : customerVoice(stall, customer);
  await writeFile(`demo/${i}.mp3`, Buffer.from(await (await speak(key, line.zh, voice)).arrayBuffer()));
  lines.push({ who, name: who === "vendor" ? stall.vendor : customer.name, model: label(models[who]), zh: line.zh, pinyin: line.pinyin, en: line.en, audio: `demo/${i}.mp3` });
  console.log(who, line.zh, "|", line.pinyin, "|", line.en, line.end);
  who = who === "vendor" ? "customer" : "vendor";
}
const words = await wordList(key, models.vendor, history);
await writeFile("demo/demo.json", JSON.stringify({ title: `Sample: ${stall.dish} · ${goal.label} ${goal.en} · ${level.en}`, lines, words }, null, 1));
console.log(words);
