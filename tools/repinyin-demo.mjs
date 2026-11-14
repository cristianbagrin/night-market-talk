// Recomputes the pinyin in demo/demo.json from its Chinese text (no API calls).
import { readFile, writeFile } from "node:fs/promises";
import * as pinyinPro from "pinyin-pro";
import { makePinyin } from "../pinyin.js";
const py = makePinyin(pinyinPro);
const d = JSON.parse(await readFile("demo/demo.json", "utf8"));
for (const x of [...d.lines, ...d.words]) x.pinyin = py(x.zh);
await writeFile("demo/demo.json", JSON.stringify(d, null, 1));
for (const x of [...d.lines, ...d.words]) console.log(x.zh, "|", x.pinyin);
