// Pinyin from a dictionary (pinyin-pro), not from the model. The text is mapped to Simplified first,
// because the dictionary knows Simplified best; Taiwan readings and spoken particles are fixed on top.
import { T, S } from "./t2s.js";

const SS = [...S];
const T2S = new Map([...T].map((c, i) => [c, SS[i]]));
const toSimplified = (s) => [...s].map((c) => T2S.get(c) ?? c).join("");

// Keys are Simplified.
export const TAIWAN_READINGS = {
  蚵仔煎: "é zǎi jiān", 蚵仔: "é zǎi", 蚵: "é", 垃圾: "lè sè", 星期: "xīng qí", 头发: "tóu fǎ", 企鹅: "qì é", 还钱: "huán qián", 归还: "guī huán",
  袋子: "dài zi", 盘子: "pán zi", 饺子: "jiǎo zi", 包子: "bāo zi", 位子: "wèi zi", 盒子: "hé zi",
  吗: "ma", 喔: "o", 啦: "la", 欸: "ēi", 耶: "ye", 呀: "ya", 齁: "hō", 吧: "ba", 呢: "ne", 啊: "a", 哦: "o", 啰: "luo", 唷: "yo", 哇: "wa",
};
const PUNCT = { "，": ",", "。": ".", "！": "!", "？": "?", "、": ",", "：": ":", "；": ";", "…": "…", "（": "(", "）": ")", "「": "“", "」": "”", "～": "~" };

export function makePinyin(lib) {
  lib.customPinyin(TAIWAN_READINGS);
  return (text) => {
    const parts = lib.pinyin(toSimplified(text), { type: "array", nonZh: "consecutive" });
    let out = "";
    for (const p of parts) {
      const t = p.replace(/[，。！？、：；…（）「」～]/g, (c) => PUNCT[c]);
      if (/^[,.!?:;…)”~]/.test(t)) out = out.trimEnd();
      out += t.replace(/([,.!?:;)”~])(?=[^\s,.!?:;…)”~])/g, "$1 ") + (/[(“]$/.test(t) ? "" : " ");
    }
    return out.replace(/\s+/g, " ").trim();
  };
}
