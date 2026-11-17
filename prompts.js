// Stalls, goals, levels and the prompt builder. Shared by the page and tools/make-demo.mjs.

export const STALLS = [
  {
    id: "oyster",
    dish: "蚵仔煎",
    price: 80,
    dishEn: "Oyster omelette",
    vendor: "阿美姨",
    vendorEn: "Auntie Mei",
    voice: "nova",
    persona:
      "You are 阿美姨, 58, who has fried 蚵仔煎 (oyster omelette, NT$80 a plate) at 士林夜市 for thirty years. Warm and chatty, proud of your sweet-and-sour sauce, you call customers 帥哥 or 美女. You only give a small discount when someone buys two or more.",
  },
  {
    id: "tea",
    dish: "珍珠奶茶",
    price: 60,
    dishEn: "Bubble tea",
    vendor: "阿傑",
    vendorEn: "Jay",
    voice: "echo",
    persona:
      "You are 阿傑, 24, behind the counter of a small bubble tea stand at 饒河夜市. 珍珠奶茶 is NT$60 (中杯) or NT$70 (大杯). You always ask about sweetness (全糖、半糖、微糖、無糖) and ice (正常冰、少冰、去冰、熱的), and you like to recommend the 黑糖珍珠鮮奶.",
  },
  {
    id: "chicken",
    dish: "炸雞排",
    price: 90,
    dishEn: "Fried chicken cutlet",
    vendor: "大胖哥",
    vendorEn: "Big Brother Pang",
    voice: "alloy",
    persona:
      "You are 大胖哥, 40, loud and funny, frying 雞排 (NT$90, bigger than your face, you like to say) at 寧夏夜市. You always ask 要切嗎？要辣嗎？ and offer 胡椒粉 or 梅粉. There is often a line, so you speak fast.",
  },
  {
    id: "tofu",
    dish: "臭豆腐",
    price: 70,
    dishEn: "Stinky tofu",
    vendor: "阿伯",
    vendorEn: "Uncle Chen",
    voice: "onyx",
    persona:
      "You are 阿伯 (陳伯伯), 70, who sells 臭豆腐 at 南機場夜市: fried (炸的, NT$70) or in spicy broth (麻辣的, NT$90), served with 泡菜. Few words, dry humour, secretly delighted when someone brave tries it for the first time.",
  },
  {
    id: "mango",
    dish: "芒果冰",
    price: 150,
    dishEn: "Mango shaved ice",
    vendor: "小芳",
    vendorEn: "Fang",
    voice: "shimmer",
    persona:
      "You are 小芳, 30, who runs a shaved ice stand at 師大夜市 with her mother. 芒果冰 is NT$150 and big enough for two; you can add 煉乳 or a scoop of 芒果冰淇淋 for NT$20. Cheerful, likes to recommend sharing.",
  },
];

export const CUSTOMERS = [
  {
    id: "student",
    name: "小安",
    nameEn: "An, a local student",
    short: "local student",
    voice: "shimmer",
    altVoice: "nova",
    persona: "You are 小安, 20, a university student in Taipei, out with friends and short on money. Casual, a bit cheeky, very Taiwanese in how you talk.",
  },
  {
    id: "newcomer",
    name: "馬克",
    nameEn: "Mark, new in Taiwan",
    short: "new in Taiwan",
    voice: "echo",
    altVoice: "onyx",
    persona:
      "You are 馬克, 30, who moved to Taipei from abroad six months ago and is learning Chinese. You speak simple, polite Mandarin, sometimes ask what a word means, and are curious about everything.",
  },
];

export const GOALS = [
  { id: "deal", label: "殺價", en: "Haggle", brief: "You want to buy for yourself and a friend and try, politely, to get a small discount." },
  { id: "recommend", label: "問推薦", en: "Ask what's good", brief: "It's your first time at this stall. Ask what's good and how to order it, then order." },
  { id: "group", label: "幫朋友點", en: "Order for friends", brief: "You are ordering for three friends who each want something slightly different. Keep the order straight." },
  { id: "undecided", label: "猶豫不決", en: "Can't decide", brief: "You can't make up your mind and keep changing your order. Eventually decide." },
  {
    id: "goodbye",
    label: "說不出再見",
    endless: true,
    en: "Can't say goodbye",
    brief: "You've already paid and have your food. Now try to say goodbye politely, but each time the other person says something kind you feel you must reply, so the goodbye keeps going.",
    vendorBrief: "They have already paid and have their food; they are just saying goodbye. You are very friendly and always find one more kind thing to say.",
  },
];

export const LEVELS = [
  { id: "a2", label: "初級", en: "Beginner", brief: "a beginner learner (TOCFL A2): short sentences, everyday words, no idioms" },
  { id: "b1", label: "中級", en: "Intermediate", brief: "an intermediate learner (TOCFL B1): natural sentences, common night-market expressions" },
  { id: "b2", label: "高級", en: "Advanced", brief: "an advanced learner (TOCFL B2): fast, natural Taiwanese Chinese with everyday slang and particles" },
];

export const MODELS = [
  { id: "minimax/minimax-m3.1-flash", label: "MiniMax M3.1 Flash" },
  { id: "z-ai/glm-5.3-flash", label: "GLM 5.3 Flash" },
  { id: "mistralai/mistral-large-3", label: "Mistral Large 3" },
  { id: "x-ai/grok-4.20", label: "Grok 4.20" },
  { id: "openai/gpt-5.4-mini", label: "GPT-5.4 mini" },
];

// Chosen by transcribing test lines back: OpenAI TTS-HD got about 96% of characters right,
// the Microsoft zh-CN voices about 78%, with long pauses at punctuation.
export const TTS_MODEL = "openai/tts-1-hd";

// The customer never shares the vendor's voice.
export const customerVoice = (stall, customer) => (customer.voice === stall.voice ? customer.altVoice : customer.voice);

// Audio only: rare characters the voices misread, swapped for a common one with the same Mandarin sound.
const SAY_AS = { 蚵: "鵝" };
export const forSpeech = (text) => [...text].map((c) => SAY_AS[c] ?? c).join("");

const RULES = (level) =>
  [
    "Speak Mandarin (國語) the way people really talk at a Taiwan night market: Traditional characters, Taiwan vocabulary and particles (喔、啦、欸、耶、齁), never mainland terms. Don't switch into Taiwanese Hokkien (台語) beyond a loanword everyone uses.",
    `Pitch every line for ${level.brief}.`,
    "Say one short turn: one or two sentences, at most 35 characters. Never repeat or paraphrase the other person's last line; answer it.",
    "Stay at the stall and on the scene. Don't lecture or explain facts you aren't sure of.",
    'Reply with JSON only: {"zh": your line in Traditional Chinese, "en": a natural English translation, "end": true when this line is your final goodbye}.',
  ].join("\n");

// history: [{who: "vendor"|"customer"|"note", zh}]
export function buildMessages({ role, stall, customer, goal, level, history }) {
  const vendorName = stall.vendor;
  const custName = customer.name;
  const scene =
    role === "vendor"
      ? `${stall.persona}\nA customer you don't know is at your stall.${goal.vendorBrief ? " " + goal.vendorBrief : ""}`
      : `${customer.persona}\nYou are at ${stall.vendor}'s ${stall.dish} stall.\nYOUR GOAL: ${goal.brief}\nKeep steering toward your goal. When it's done (or clearly impossible), pay, say goodbye and set "end" to true.`;
  const system = `${scene}\n\n${RULES(level)}`;
  // The vendor doesn't know the customer's name, so it sees them as 客人.
  const label = (h) => (h.who === "vendor" ? vendorName : h.who === "customer" ? (role === "vendor" ? "客人" : custName) : "（旁白）");
  const transcript = history.length
    ? history.map((h) => `${label(h)}：${h.zh}`).join("\n")
    : "(Nothing has been said yet.)";
  const me = role === "vendor" ? vendorName : custName;
  const user = `Conversation so far:\n${transcript}\n\nLines marked （旁白） are things that just happened; react to them.\nWrite ${me}'s next line.`;
  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export function buildWordList(history) {
  const text = history.filter((h) => h.who !== "note").map((h) => h.zh).join("\n");
  return [
    {
      role: "system",
      content:
        'You make vocabulary lists for learners of Taiwanese Chinese. Pick the 8 most useful words or set phrases from the conversation (skip names and the most basic words like 你、我、好). Reply with JSON only: {"words": [{"zh": Traditional Chinese, "en": short English gloss}]}.',
    },
    { role: "user", content: text },
  ];
}

export function parseLine(raw) {
  const m = String(raw).match(/\{[\s\S]*\}/);
  const j = JSON.parse(m ? m[0] : raw);
  if (!j.zh) throw new Error("no line");
  return { zh: String(j.zh).trim(), en: String(j.en || "").trim(), end: j.end === true };
}
