import { STALLS, CUSTOMERS, GOALS, LEVELS, MODELS, customerVoice } from "./prompts.js";
import { nextLine, wordList, speak, isOver, setPinyin } from "./engine.js";
import { makePinyin } from "./pinyin.js";

const PINYIN_LIB = "https://cdn.jsdelivr.net/npm/pinyin-pro@3.26.0/+esm";
let pinyinReady = null;
const loadPinyin = () => (pinyinReady ||= import(PINYIN_LIB).then((lib) => setPinyin(makePinyin(lib))).catch(() => {}));

const $ = (s) => document.querySelector(s);
const connect = $("polli-connect");
const script = $("#script");
const startBtn = $("#start");
const stopBtn = $("#stop");
const stepin = $("#stepin");
const PLAY_ICON = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1l7 4-7 4z"/></svg>';
const STOP_ICON = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 2h6v6H2z"/></svg>';

let apiKey = null;
let running = false;
let stopRequested = false;
let history = [];

/* ---------- setup sheet ---------- */
function radios(container, name, items, labelFn, checkedId) {
  container.innerHTML = items
    .map(
      (it) => `<label><input type="radio" name="${name}" value="${it.id}"${it.id === checkedId ? " checked" : ""}><span>${labelFn(it)}</span></label>`
    )
    .join("");
}
radios($("#opt-stall"), "stall", STALLS, (s) => `<b>${s.dish}</b>${s.dishEn}`, "oyster");
radios($("#opt-customer"), "customer", CUSTOMERS, (c) => `<b>${c.name}</b>${c.nameEn}`, "newcomer");
radios($("#opt-goal"), "goal", GOALS, (g) => `<b>${g.label}</b>${g.en}`, "deal");
radios($("#opt-level"), "level", LEVELS, (l) => `<b>${l.label}</b>${l.en}`, "a2");
for (const [sel, def] of [["#model-vendor", MODELS[0].id], ["#model-customer", MODELS[1].id]]) {
  $(sel).innerHTML = MODELS.map((m) => `<option value="${m.id}"${m.id === def ? " selected" : ""}>${m.label}</option>`).join("");
}
const picked = (name, list) => list.find((x) => x.id === document.querySelector(`input[name=${name}]:checked`).value);

$("#opt-hide-en").addEventListener("change", (e) => script.classList.toggle("hide-en", e.target.checked));
script.addEventListener("click", (e) => {
  if (e.target.classList.contains("en")) e.target.classList.add("shown");
});

/* ---------- connect ---------- */
function syncKey() {
  apiKey = connect?.apiKey || null;
  startBtn.textContent = apiKey ? "開始 Start" : "Connect to start";
  $("#hint").hidden = !!apiKey;
}
connect?.addEventListener("change", syncKey);
customElements.whenDefined("polli-connect").then(syncKey).catch(() => {});
syncKey();

/* ---------- rendering ---------- */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function lineEl({ who, name, model, zh, pinyin, en }) {
  const li = document.createElement("li");
  li.className = `line ${who}`;
  if (who === "note") {
    li.innerHTML = `<div class="who">旁白</div><p class="zh">${esc(zh)}</p>`;
    return li;
  }
  li.innerHTML = `<div class="who">${esc(name)}<small>${esc(model)}</small></div>
    <div><p class="zh" lang="zh-Hant-TW">${esc(zh)}</p><p class="py">${esc(pinyin)}</p><p class="en">${esc(en)}</p></div>
    <button type="button" class="play" aria-label="Play this line">${PLAY_ICON}</button>`;
  return li;
}

function typingEl(who, name) {
  const li = document.createElement("li");
  li.className = `line ${who} typing`;
  li.innerHTML = `<div class="who">${esc(name)}</div><div><p class="zh"><span class="dots">thinking</span></p></div>`;
  return li;
}

// One shared player. Safari only lets audio play after a network wait if the element
// was first played during a tap, so Start "unlocks" it with a moment of silence.
const player = new Audio();
let finishCurrent = null;
let unlocked = false;

function silentWav() {
  const n = 800, v = new DataView(new ArrayBuffer(44 + n));
  const str = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  str(0, "RIFF"); v.setUint32(4, 36 + n, true); str(8, "WAVEfmt "); v.setUint32(16, 16, true);
  v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true); v.setUint16(34, 8, true); str(36, "data"); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([v], { type: "audio/wav" }));
}

function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  player.src = silentWav();
  player.play().catch(() => {});
}

function stopAudio() {
  player.pause();
  finishCurrent?.();
}

function playSource(btn, src) {
  stopAudio();
  return new Promise((resolve) => {
    const done = () => {
      if (finishCurrent !== done) return;
      finishCurrent = null;
      player.onended = player.onerror = null;
      btn.classList.remove("playing");
      btn.innerHTML = PLAY_ICON;
      resolve();
    };
    finishCurrent = done;
    btn.classList.add("playing");
    btn.innerHTML = STOP_ICON;
    player.onended = done;
    player.onerror = done;
    player.src = src;
    player.play().catch(done);
  });
}

// Each spoken line keeps a promise for its audio URL, made on first need.
function wireAudio(li, getUrl) {
  const btn = li.querySelector(".play");
  let urlP = null;
  const url = () => (urlP ||= getUrl());
  btn.addEventListener("click", async () => {
    if (btn.classList.contains("playing")) return stopAudio();
    btn.disabled = true;
    try {
      const u = await url();
      btn.disabled = false;
      await playSource(btn, u);
    } catch {
      btn.disabled = false;
      btn.title = "Couldn't load this voice";
    }
  });
  return { btn, url };
}

/* ---------- sample conversation ---------- */
async function showSample() {
  try {
    const demo = await (await fetch("demo/demo.json")).json();
    $("#scene-title").textContent = demo.title;
    script.innerHTML = "";
    for (const l of demo.lines) {
      const li = lineEl(l);
      script.append(li);
      if (l.audio) wireAudio(li, async () => l.audio);
    }
    renderWords(demo.words);
  } catch {
    $("#scene-title").textContent = "Set the scene and press Start";
  }
}

function renderWords(words) {
  if (!words?.length) return;
  $("#words").innerHTML = words
    .map((w) => `<li><b lang="zh-Hant-TW">${esc(w.zh)}</b><i>${esc(w.pinyin)}</i><span>${esc(w.en)}</span></li>`)
    .join("");
  $("#receipt").hidden = false;
  $("#copy-words").onclick = async () => {
    const tsv = words.map((w) => `${w.zh}\t${w.pinyin}\t${w.en}`).join("\n");
    try {
      await navigator.clipboard.writeText(tsv);
      $("#copy-words").textContent = "Copied";
    } catch {
      $("#copy-words").textContent = "Couldn't copy";
    }
  };
}

/* ---------- live conversation ---------- */
function errorText(e) {
  if (e.status === 401 || e.status === 403) return "Your Pollinations connection has expired. Disconnect and connect again.";
  if (e.status === 402) return "Your Pollen balance or this app's budget is used up. Top up or reconnect with a bigger budget.";
  return "A model didn't answer. Press Start to try again, or pick another model.";
}

async function run() {
  const stall = picked("stall", STALLS);
  const customer = picked("customer", CUSTOMERS);
  const goal = picked("goal", GOALS);
  const level = picked("level", LEVELS);
  const models = { vendor: $("#model-vendor").value, customer: $("#model-customer").value };
  const label = (id) => MODELS.find((m) => m.id === id)?.label || id;
  const voiceOn = () => $("#opt-voice").checked;

  running = true;
  stopRequested = false;
  history = [];
  stopAudio();
  script.innerHTML = "";
  $("#receipt").hidden = true;
  $("#scene-title").textContent = `${stall.dish} · ${goal.label} ${goal.en} · ${level.en}`;
  startBtn.disabled = true;
  stopBtn.hidden = false;
  await loadPinyin();
  stepin.hidden = false;

  const spoken = [];
  let lastAudio = Promise.resolve();
  let who = "customer";
  try {
    while (!stopRequested && !isOver(spoken, goal)) {
      const name = who === "vendor" ? stall.vendor : customer.name;
      const voice = who === "vendor" ? stall.voice : customerVoice(stall, customer);
      const typing = typingEl(who, name);
      script.append(typing);
      const line = await nextLine(apiKey, models[who], { role: who, stall, customer, goal, level, history });
      await lastAudio;
      typing.remove();
      if (stopRequested) break;
      spoken.push(line);
      history.push({ who, zh: line.zh });
      const li = lineEl({ who, name, model: label(models[who]), ...line });
      script.append(li);
      const key = apiKey;
      const { btn, url } = wireAudio(li, async () => URL.createObjectURL(await speak(key, line.zh, voice)));
      if (voiceOn()) {
        lastAudio = url()
          .then((u) => (stopRequested ? null : playSource(btn, u)))
          .catch(() => {});
      }
      who = who === "vendor" ? "customer" : "vendor";
    }
    script.querySelector(".typing")?.remove();
    await lastAudio;
    if (spoken.length >= 4) {
      const words = await wordList(apiKey, models.vendor, history).catch(() => []);
      renderWords(words);
    }
  } catch (e) {
    script.querySelector(".typing")?.remove();
    const li = document.createElement("li");
    li.className = "line error";
    li.innerHTML = `<div class="who">!</div><p class="zh">${esc(errorText(e))}</p>`;
    script.append(li);
  } finally {
    running = false;
    startBtn.disabled = false;
    stopBtn.hidden = true;
    stepin.hidden = true;
  }
}

$("#setup").addEventListener("submit", (e) => {
  e.preventDefault();
  if (running) return;
  if (!apiKey) {
    $("#hint").hidden = false;
    connect?.scrollIntoView({ behavior: "smooth", block: "center" });
    connect?.querySelector("button")?.focus();
    return;
  }
  unlockAudio();
  run();
});
stopBtn.addEventListener("click", () => {
  stopRequested = true;
  stopAudio();
});
stepin.addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("#note").value.trim();
  if (!v || !running) return;
  history.push({ who: "note", zh: v });
  const li = lineEl({ who: "note", zh: v });
  const typing = script.querySelector(".typing");
  typing ? script.insertBefore(li, typing) : script.append(li);
  $("#note").value = "";
});

showSample();
