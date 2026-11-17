# 夜市對話 · Night Market Talk

[![Made with pollinations.ai](https://raw.githubusercontent.com/pollinations/pollinations/123ed07456106a4f752c0a22c584e8cadd2db6a8/packages/ui/src/brand/badge-made-with.svg)](https://pollinations.ai/?ref=badge)

Two AI models act out a conversation at a Taiwan night-market stall, in Taiwanese Chinese, with pinyin, English and voices.

**Live:** https://night-market-talk.pollinations.app

You tick a stall (蚵仔煎, 珍珠奶茶, 雞排, 臭豆腐, 芒果冰), a customer, a situation and a level. Then one model plays the vendor and another plays the customer. Situations range from haggling and ordering for friends to not being able to make up your mind, or trying and failing to say goodbye. While they talk you can step in with something that happens, like 突然下雨了 ("it suddenly starts to rain"), and both of them react. At the end you get the useful words as a receipt you can copy into Anki.

It's built for people learning Mandarin in Taiwan: Traditional characters, Taiwan vocabulary and particles (喔、啦、欸), and the kind of exchange you actually have at a stall.

## How it uses Pollinations

- **Two text models talk to each other.** Each turn goes to `POST /v1/chat/completions` with the role's own persona. The vendor and the customer can be different models (MiniMax, GLM, Grok, GPT, Mistral), chosen on the page.
- **Voices.** Each line is read aloud with `openai/tts-1-hd` through `POST /v1/audio/speech`, with a different voice for each character. I picked it by having each candidate voice read test lines and transcribing them back: TTS-HD got about 96% of characters right; the Microsoft Mandarin voices got about 78% and paused for seconds at punctuation.
- **Word list.** One last call picks the eight most useful words from the conversation.
- **Users pay with their own Pollen.** The page uses [Pollinations Connect](https://github.com/pollinations/pollinations/blob/main/BRING_YOUR_OWN_POLLEN.md) (`<polli-connect>`), so visitors sign in and spend their own balance. A whole conversation with voices costs about a hundredth of a Pollen. The app holds no key.

The pinyin doesn't come from the model, because models get tones wrong. It comes from a dictionary ([pinyin-pro](https://github.com/zh-lx/pinyin-pro)): the text is mapped to Simplified for the lookup (a character map built from [OpenCC](https://github.com/BYVoid/OpenCC)), then Taiwan readings (蚵 é, 垃圾 lè sè) and spoken particles (喔 o, 啦 la, 欸 ēi) are fixed on top.

## Files

| File | What it does |
| --- | --- |
| `index.html`, `style.css`, `app.js` | The page |
| `prompts.js` | Stalls, customers, situations, levels and the prompts |
| `engine.js` | API calls and turn-taking (runs in the browser and in Node) |
| `pinyin.js`, `t2s.js` | Dictionary pinyin with Taiwan readings |
| `demo/` | The sample conversation shown before you connect |
| `tools/make-demo.mjs` | Regenerates the sample: `POLLINATIONS_API_KEY=sk_... node tools/make-demo.mjs` |

No build step: it's static files. To run it locally, serve the folder (`python3 -m http.server 8765`) and open http://localhost:8765.

## Notes

- No Taiwanese Chinese voice is available yet, so the accent isn't Taiwanese. The words and vocabulary are.
- The lines are written by AI and can be wrong. Check anything you plan to memorise.

MIT licence.
