# 📸 Sawirrada (Photos) — hagaha

Halkan waa sawirrada dhabta ah ee bogga. Magacu waa `images/` folder-ka ka hor.
Waa **27 sawir**: `us-01.jpg` ilaa `us-27.jpg`.

> 💡 **Chat-ka hadda sawirrada diri karaa** — faataad!
> See [Chat-ka & sawirrada](#-chat-ka--sawirrada) hoos.

## Sida loo beddelo

1. Sawir cusub u soo gal (copy) `images/` folder-ka gudihiisa.
2. Magaca u beddel `us-28.jpg`, `us-29.jpg`, ... (tir tir ah oo kale).
3. `assets/js/data.js` faylka khor u dhaqaqi `memories` qaybta:

```js
memories: [
  { src: "images/us-01.jpg", icon: "🌅", caption: "Where it all began", note: "the beginning", a: "#7a3fb0", b: "#ff6fa5" },
  { src: "images/us-28.jpg", icon: "💫", caption: "Caption-ka cusub",   note: "note-ka cusub",  a: "#3a1560", b: "#c86fa0" }
]
```

4. Refresh-bogga (Ctrl + F5).

> Sawir kasta oo `images/` ku jira waa `memories` array-ka ku qoran, sidoo kale
> `og-cover.jpg` waa sawirka og-image (preview-ka baraha bulshada).

## Talooyin

- **Format:** `.jpg` ama `.webp` (webp ayaa ka fudud).
- **Cabbir:** 1200 x 1500 pixels (4:5) ayaa ugu wanaagsan; grid-ka wuxuu
  3:4 (`object-fit: cover`) isticmaalaa, markaa sawirka oo aad dheereeysan
  wuu qaab ka beddelmaa.
- **Miisaan:** 1 MB ka yar, si aan website-gu dheereeyo.
- `a` iyo `b` waa **color codes** placeholder-ka (fadhi madow oo kala duwan).
  Haddii sawir la soo galo, labadaba way qarsoon dhaafan.

## Tusale

| Magac | Cabbir | Miisaan |
|---|---|---|
| `us-01.jpg` | 720x1280 | 64 KB |
| `us-02.jpg` | 720x1280 | 53 KB |
| `us-03.jpg` | 810x1080 | 76 KB |
| `us-04.jpg` | 810x1080 | 123 KB |
| `us-05.jpg` | 720x1280 | 88 KB |
| `us-06.jpg` | 720x1280 | 32 KB |
| `us-07.jpg` | 810x1080 | 94 KB |
| `us-08.jpg` | 960x1280 | 88 KB |
| `us-09.jpg` | 1080x1166 | 209 KB |
| `us-10.jpg` | 960x1280 | 83 KB |
| `us-11.jpg` | 499x1080 | 46 KB |
| `us-12.jpg` | 960x1280 | 127 KB |
| `us-13.jpg` | 720x1280 | 75 KB |
| `us-14.jpg` | 576x1280 | 52 KB |
| `us-15.jpg` | 720x720 | 37 KB |
| `us-16.jpg` | 720x1280 | 38 KB |
| `us-17.jpg` | 720x603 | 38 KB |
| `us-18.jpg` | 608x1080 | 32 KB |
| `us-19.jpg` | 233x318 | 9 KB |
| `us-20.jpg` | 720x1280 | 67 KB |
| `us-21.jpg` | 720x960 | 32 KB |
| `us-22.jpg` | 720x960 | 53 KB |
| `us-23.jpg` | 720x1280 | 67 KB |
| `us-24.jpg` | 720x960 | 148 KB |
| `us-25.jpg` | 720x1157 | 24 KB |
| `us-26.jpg` | 720x1280 | 50 KB |
| `us-27.jpg` | 720x960 | 15 KB |
| `og-cover.jpg` | preview | — |

> Magac kasta waa `src` — waa kala duwan, sawir kasta wuxuu muuqataa.

---

## 💬 Chat-ka & sawirrada

Chat-ka hadda wuxuu **sigi karaa sawirro**. Saddexda hab:

| Hab | Sida |
|---|---|
| 📎 Button | button-ka 📎 ee ku yaal chat-ka → sawir dooro → **Send** |
| 🖐️ Drag & drop | sawirka soo qaado oo ku daale chat-ka |
| 📋 Paste | sawirka copy-gel (Ctrl+C) → chat-ka → **Ctrl + V** |

Sawir kasta oo la diriyo:

1. **Wuu yar yaraanayaa** (max 1600px, JPEG) si boggu degdeg loo u furo.
2. **Wuu la keydiyaa** browser-ka (IndexedDB) → fariinhii iyo sawirkuna wuu
   haystaan marka la refresh garo.
3. Hoos ku waxaa ku jira **📌 Memories** (uu gal gallery-ga *Memories*) iyo
   **⬇️ Save** (uu ka baxo kombuyuutarka).

### Sawirka si aan loo keydin karin (oo bogga u noqon doonaa)

Sawirrada la diriyo waxay ku noqon karaan **qayb bogga** sidan:

1. Chat-ka sawirka dib u eeg → **⬇️ Save** → faylka wuxuu u soo baxaa.
2. Faylka u geli `images/` folder-ka (magac u beddel, tusaale `us-30.jpg`).
3. `assets/js/data.js` → `memories` array-ka ku dar:

```js
{ src: "images/us-30.jpg", icon: "📸", caption: "Caption-ka cusub", note: "note-ka cusub", a: "#7a3fb0", b: "#ff6fa5" }
```

4. Refresh (Ctrl + F5).

> ⚠️ Sawirrada chat-ka ku keydaan waxay ku jiraan **browser-ka gudihiisa**
> (computer-ka / telefoonka). Si ay bogga u noqdaan meel kale (tir badan oo
> dad ah), waa in la soo baxaa **⬇️ Save** oo la geliyo `images/`.

---

## 🤖 Chat-ka wuxuu su'aalaha si sax ah uu u jawaabo

Jawaabaha chatbot-ka waxay ku xiran yihiin **`assets/js/data.js`** →
`chat.intents`. Hal intent = hal mowduuc:

```js
{
  id: "flower",                                  // magac (uniq)
  keys: ["flower", "ubax", "rose"],              // calaamadaha la raadiyo
  replies: ["jawaabta 1", "jawaabta 2"]         // jawaabaha la dooran karo
}
```

Xigaaradaha waxtar leh:

| Xigaarad | Waa maxay |
|---|---|
| `priority` | u dhaqso (tusaale `0.6` = had iyo jeer u dhaqso) |
| `weak: true` | kaliya haddii mowduuc kale uu ma jiro |
| `form: true` | nooca su'aasha (`yesno`, `wh`) — kaliya haddii wax kale ma jiro |
| `recall: true` | su'aal xusuus leh |
| `{topic}` | waxa laga soo haddaa su'aashaada |
| `{raw}` | fariinhii sida uu yimid |

Si loo **hubiyo** waxa chatbotku jawaabo:

```js
universeChat.intent("Do you remember the first flower?")  // → "flower"
universeChat.reply("Do you remember the first flower?")    // → jawaabta
```

`console.log()` ayaa lagu debug-garaa browser-ka (F12 → Console).
