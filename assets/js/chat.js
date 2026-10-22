/* =========================================================
   💬 CHAT — a private room for two (with photos 📸)
   ========================================================= */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const CFG = (typeof UNIVERSE !== "undefined" && UNIVERSE.chat) ? UNIVERSE.chat : { messages: [], chips: [], replies: [], smart: [], photoReplies: [] };

  const body = $("#chatBody");
  if (!body) return;

  const form = $("#chatForm");
  const input = $("#chatInput");
  const chips = $("#chatChips");
  const statusEl = $("#chatStatus");
  const shell = document.querySelector(".chat-shell");
  const fileInput = $("#chatFile");
  const attachBtn = $("#chatAttach");
  const preview = $("#chatPreview");

  const ME = { key: "nawaal", name: "Nawaal", avatar: "🌙" };
  const THEM = { key: "ayman", name: "Ayman", avatar: "🪐" };

  const HEARTS = ["💗", "💕", "❤️", "💖", "💘", "✨", "🌸", "⭐"];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const LOG_KEY = "universe.chat.v1";

  /* =========================================================
     HELPERS
     ========================================================= */
  function clock() {
    const d = new Date();
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function toast(msg) {
    if (typeof window.universeToast === "function") { window.universeToast(msg); return; }
    const t = $("#toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("is-on");
    setTimeout(function () { t.classList.remove("is-on"); }, 3200);
  }

  function miniBurst(count, originEl) {
    if (reduceMotion) return;
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    if (originEl && originEl.getBoundingClientRect) {
      const r = originEl.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
    }
    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.className = "fx";
      el.textContent = HEARTS[(Math.random() * HEARTS.length) | 0];
      el.style.left = (cx + (Math.random() * 120 - 60)) + "px";
      el.style.top = (cy + (Math.random() * 80 - 40)) + "px";
      el.style.setProperty("--dx", (Math.random() * 160 - 80) + "px");
      el.style.setProperty("--rot", (Math.random() * 400 - 200) + "deg");
      el.style.animationDuration = (2.6 + Math.random() * 2) + "s";
      document.body.appendChild(el);
      (function (node) { setTimeout(function () { node.remove(); }, 5200); })(el);
    }
  }

  function scrollDown(smooth) {
    body.scrollTo({ top: body.scrollHeight, behavior: smooth === false ? "auto" : "smooth" });
  }

  /* =========================================================
     CHAT LOG — fariinaha waa la keydiyaa (localStorage)
     ========================================================= */
  function loadLog() {
    try {
      const raw = window.localStorage.getItem(LOG_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      return (data && Array.isArray(data.messages)) ? data.messages : null;
    } catch (err) { return null; }
  }

  function saveLog() {
    try {
      window.localStorage.setItem(LOG_KEY, JSON.stringify({ v: 1, messages: log }));
    } catch (err) {
      toast("Kaydin ayaan la marin karin — sawirrada way ka baxaan");
    }
  }

  /* =========================================================
     PHOTOS — sawirrada aan dirnay
     ========================================================= */
  const pending = [];      /* sawirrada aan diyaar garo (preview) */
  const Photos = window.UniversePhotos;

  function renderPreview() {
    if (!preview) return;
    preview.innerHTML = "";
    preview.hidden = pending.length === 0;
    pending.forEach(function (p, i) {
      const item = document.createElement("div");
      item.className = "chat__thumb";

      const img = document.createElement("img");
      img.src = p.url;
      img.alt = p.name || "Sawir";

      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "chat__thumb-x";
      rm.setAttribute("aria-label", "Ka saar sawirka");
      rm.textContent = "✕";
      rm.addEventListener("click", function () {
        URL.revokeObjectURL(p.url);
        pending.splice(i, 1);
        renderPreview();
      });

      item.appendChild(img);
      item.appendChild(rm);
      preview.appendChild(item);
    });
  }

  async function addFiles(files) {
    const images = (files || []).filter(function (f) { return /^image\//i.test(f.type || ""); });
    if (!images.length) { toast("Fadlan sawir iyo keliya dooro 📸"); return; }
    if (!Photos) { toast("Sawirrada ayaa hadda ma shaqeyn ❌"); return; }

    for (let i = 0; i < images.length; i++) {
      try {
        pending.push(await Photos.prepare(images[i]));
      } catch (err) {
        toast(err && err.message ? err.message : "Sawirka ayaan qaadin karin");
      }
    }
    renderPreview();
    if (input) input.focus();
  }

  function clearPending() {
    pending.forEach(function (p) { URL.revokeObjectURL(p.url); });
    pending.length = 0;
    renderPreview();
  }

  /* ---------- photo inside a message ---------- */
  function openPhoto(fig) {
    const open = window.openUniverseLightbox;
    if (typeof open === "function") { open(fig); return; }
    const src = fig.getAttribute("data-src");
    if (src) window.open(src, "_blank");
  }

  function photoEl(p, mine, caption) {
    const fig = document.createElement("figure");
    fig.className = "msg__photo";
    fig.setAttribute("data-src", p.src || "");
    fig.setAttribute("data-cap", p.cap || caption || "");
    fig.setAttribute("tabindex", "0");
    fig.setAttribute("role", "button");
    fig.setAttribute("aria-label", (p.alt || "Our photo") + " — tap to make it bigger");

    const img = document.createElement("img");
    img.alt = p.alt || "Our photo";
    img.loading = "lazy";

    if (p.src) {
      img.src = p.src;
    } else if (p.id && Photos) {
      fig.classList.add("msg__photo--loading");
      Photos.url(p.id).then(function (url) {
        if (!url) { fig.classList.remove("msg__photo--loading"); fig.classList.add("msg__photo--missing"); return; }
        fig.setAttribute("data-src", url);
        img.src = url;
        fig.classList.remove("msg__photo--loading");
      });
    }

    img.addEventListener("error", function () {
      fig.classList.remove("msg__photo--loading");
      fig.classList.add("msg__photo--missing");
    });
    fig.appendChild(img);

    if (p.cap) {
      const cap = document.createElement("figcaption");
      cap.textContent = p.cap;
      fig.appendChild(cap);
    }

    /* sawirrada aan aan dirnay → ammaan iyo download */
    if (mine && p.id && Photos) {
      const actions = document.createElement("div");
      actions.className = "msg__actions";

      const pin = document.createElement("button");
      pin.type = "button";
      pin.className = "msg__act";
      pin.textContent = Photos.isPinned(p.id) ? "✅ In memories" : "📌 Memories";
      pin.title = "Ku dar sawirka gallery-ga Memories";
      pin.addEventListener("click", function (e) {
        e.stopPropagation();
        const cap = (caption || "").trim() || "Sawirkeena 📸";
        if (Photos.isPinned(p.id)) {
          Photos.unpin(p.id).then(function () {
            pin.textContent = "📌 Memories";
            toast("Sawirka waa ka baxday Memories");
          });
        } else {
          Photos.pin({ id: p.id }, cap, "From our chat 💌").then(function (added) {
            pin.textContent = added ? "✅ In memories" : "📌 Memories";
            toast(added ? "📸 Sawirka waa hadda Memories-gay ku jiraa" : "Horey wuu jiray");
          });
        }
      });

      const save = document.createElement("button");
      save.type = "button";
      save.className = "msg__act";
      save.textContent = "⬇️ Save";
      save.title = "Kaydi sawirka kombuyuutarka";
      save.addEventListener("click", function (e) {
        e.stopPropagation();
        Photos.download(p.id, p.name).then(function (ok) {
          if (ok) toast("⬇️ Sawirka waa la soo baxay");
        });
      });

      actions.appendChild(pin);
      actions.appendChild(save);
      fig.appendChild(actions);
    }

    fig.addEventListener("click", function () { openPhoto(fig); });
    fig.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPhoto(fig); }
    });

    return fig;
  }

  /* =========================================================
     RENDER
     ========================================================= */
  function messageEl(msg) {
    const mine = msg.from === ME.key;
    const who = mine ? ME : THEM;
    const wrap = document.createElement("div");
    wrap.className = "msg" + (mine ? " msg--me" : "");

    const av = document.createElement("span");
    av.className = "msg__avatar";
    av.setAttribute("aria-hidden", "true");
    av.textContent = who.avatar;

    const bubble = document.createElement("div");
    bubble.className = "msg__bubble " + (mine ? "msg__bubble--me" : "msg__bubble--them");

    if (msg.text) {
      const text = document.createElement("p");
      text.className = "msg__text";
      text.textContent = msg.text;
      bubble.appendChild(text);
    }

    const photos = [];
    if (msg.image) {
      photos.push({ id: null, src: msg.image, cap: msg.imageCap || "", alt: msg.imageAlt || "Our photo" });
    }
    (msg.images || []).forEach(function (im) {
      photos.push({ id: im.id, cap: im.cap || "", alt: im.alt || "Our photo", name: im.name });
    });
    photos.forEach(function (p) {
      bubble.appendChild(photoEl(p, mine, msg.text));
    });

    const meta = document.createElement("div");
    meta.className = "msg__meta";
    const nm = document.createElement("span");
    nm.textContent = who.name;
    const tm = document.createElement("time");
    tm.textContent = msg.time || clock();
    meta.appendChild(nm);
    meta.appendChild(tm);

    bubble.appendChild(meta);
    wrap.appendChild(av);
    wrap.appendChild(bubble);
    return wrap;
  }

  function addMessage(msg) {
    const full = Object.assign(
      { id: "m" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), time: clock(), ts: Date.now() },
      msg
    );
    log.push(full);
    const el = messageEl(full);
    body.appendChild(el);
    scrollDown();
    saveLog();
    return el;
  }

  function typingOn() {
    const el = document.createElement("div");
    el.className = "chat__typing";
    el.id = "chatTyping";
    el.innerHTML =
      '<span class="msg__avatar" aria-hidden="true">' + THEM.avatar + '</span>' +
      '<span class="chat__dots" aria-label="' + THEM.name + ' is typing"><i></i><i></i><i></i></span>';
    body.appendChild(el);
    scrollDown();
  }

  function typingOff() {
    const el = $("#chatTyping");
    if (el) el.remove();
  }

  /* =========================================================
     REPLY ENGINE — su'aalaha si sax ah loo jawaabo
     (keywords → intent → jawaabta la macaamilay)
     ========================================================= */
  function normalize(str) {
    return String(str == null ? "" : str)
      .toLowerCase()
      .replace(/[‘’]/g, "'")
      .replace(/[^\p{L}\p{N}\s']/gu, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function escapeRe(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function cap(s) {
    s = String(s == null ? "" : s).trim();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  }

  function lowerFirst(s) {
    s = String(s == null ? "" : s).trim();
    return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  }

  /* 0 = aan la helin, 1 = gudbood, 2+ = calaamad dhab ah */
  function keyScore(key, norm, raw) {
    const k = normalize(key);
    if (!k) {
      /* emoji / calaamad kale → raadi qoraal dhabta ah */
      return String(raw).indexOf(String(key)) !== -1 ? 2 : 0;
    }
    if (norm.indexOf(k) === -1) return 0;
    const words = k.split(" ").length;
    const whole = new RegExp("(^|[^\\p{L}\\p{N}])" + escapeRe(k) + "([^\\p{L}\\p{N}]|$)", "u").test(norm);
    return whole ? 2 + (words - 1) : 1;
  }

  function intentScore(intent, norm, raw) {
    let score = 0, weight = 0;
    (intent.keys || []).forEach(function (key) {
      const s = keyScore(key, norm, raw);
      if (s > 0) { score += s; weight += normalize(key).length || String(key).length; }
    });
    return { score: score, weight: weight };
  }

  /* ugu dhaqsaha badan ee ku habboon */
  function bestIntent(norm, raw, form, weak) {
    let best = null;
    (CFG.intents || []).forEach(function (intent) {
      if (!!intent.form !== !!form) return;
      if (!!intent.weak !== !!weak) return;
      const s = intentScore(intent, norm, raw);
      if (!s.score) return;
      const total = s.score + (intent.priority || 0);
      const cand = { intent: intent, score: s.score, total: total, weight: s.weight };
      if (!best || cand.total > best.total || (cand.total === best.total && cand.weight > best.weight)) best = cand;
    });
    return best;
  }

  function recallHit(norm, raw) {
    let hit = false;
    (CFG.intents || []).forEach(function (intent) {
      if (!intent.recall) return;
      if (intentScore(intent, norm, raw).score > 0) hit = true;
    });
    return hit;
  }

  /* waxa laga soo haddaa su'aasha */
  const QUESTION_LEADS = [
    "do you still remember", "do you remember", "did you remember", "can you remember",
    "have you forgotten", "do you know", "did you know", "do you think", "do you want",
    "do you like", "do you have", "do you feel", "did you", "do you", "are you", "is it",
    "can you", "could you", "will you", "would you", "have you", "has he", "has she",
    "have they", "do i", "did i", "have i", "am i", "shall we",
    "what do you", "what does", "what is", "what are", "what was", "what about",
    "who is", "who are", "who was", "where is", "where are", "when is", "when did",
    "when was",     "how about", "how do you", "how did you", "how are you", "how is", "how was", "how were",
    "why did", "why do", "why is", "why are", "why does", "what's", "how's", "where's",
    "tell me", "i want to know", "remind me", "remember"
  ];

  function extractTopic(text) {
    let t = normalize(text);
    let changed = true;
    while (changed) {
      changed = false;
      for (let i = 0; i < QUESTION_LEADS.length; i++) {
        const lead = QUESTION_LEADS[i];
        if (t.indexOf(lead + " ") === 0) { t = t.slice(lead.length + 1); changed = true; break; }
      }
    }
    t = t.replace(/[?!.]+$/, "").trim();
    t = t.replace(/\b(anyway|though|please|ok|okay|really|actually|maybe|now)$/g, "").trim();
    if (t.length > 90) t = t.slice(0, 90).trim() + "…";
    return t;
  }

  function fill(tpl, topic, raw) {
    return String(tpl)
      .replace(/\{topic\}/g, topic ? cap(topic) : "that")
      .replace(/\{raw\}/g, String(raw == null ? "" : raw));
  }

  function pickOne(pool) {
    const list = (pool || []).filter(Boolean);
    if (!list.length) return "";
    return list[Math.floor(Math.random() * list.length)];
  }

  /* waaxidda su'aasha (content) ama qaabka su'aasha (haa/kuwaa) */
  function detectIntent(norm, raw) {
    /* 1. mowduuc gaar ah */
    const content = bestIntent(norm, raw, false, false);
    if (content && content.score >= 2) return content.intent;
    /* 2. mowduuc guud (xusuus, fikir) — kaliya haddii kale ma jiro */
    const weak = bestIntent(norm, raw, false, true);
    if (weak && weak.score >= 2) return weak.intent;
    /* 3. qaabka su'aasha */
    const form = bestIntent(norm, raw, true);
    if (form) return form.intent;
    return null;
  }

  function pickReply(text, hasPhoto) {
    if (hasPhoto) {
      const photo = pickOne(CFG.photoReplies || []);
      if (photo) return cap(fill(photo, extractTopic(text), text));
    }

    const raw = String(text == null ? "" : text);
    const norm = normalize(raw);
    const topic = extractTopic(raw);
    const intent = detectIntent(norm, raw);

    /* 1. wax ku habboon (ubax, caafimaad, shaqo…) */
    if (intent && !intent.form) {
      let reply = fill(pickOne(intent.replies), topic, raw);
      if (intent.id !== "recall" && recallHit(norm, raw)) {
        reply = "I remember it perfectly 🥺 — " + lowerFirst(reply);
      }
      return cap(reply);
    }

    /* 2. nooca su'aasha (haa/kuwaa, maxay…) */
    if (intent && intent.form) {
      return cap(fill(pickOne(intent.replies), topic, raw));
    }

    /* 3. su'aal aan la aqoon karin */
    if (/\?$/.test(norm)) {
      const wh = (CFG.intents || []).filter(function (i) { return i.id === "wh"; })[0];
      if (wh) return cap(fill(pickOne(wh.replies), topic, raw));
    }

    /* 4. fallback */
    const pool = (CFG.replies || []).filter(Boolean);
    if (!pool.length) return "I'm right here, my love 💗";
    return cap(fill(pool[Math.floor(Math.random() * pool.length)], topic, raw));
  }

  /* fudud ayuu u qaadan karaa in la eego waxa chatbotku u jawaabo */
  window.universeChat = {
    reply: pickReply,
    intent: function (text) {
      const it = detectIntent(normalize(text), String(text == null ? "" : text));
      return it ? it.id : "none";
    }
  };


  /* sawir naaga ah oo ka yimid gallery-ga websaytka */
  function sitePhoto() {
    const mem = (typeof UNIVERSE !== "undefined" && UNIVERSE.memories) ? UNIVERSE.memories : [];
    const list = mem.filter(function (m) { return m && m.src; });
    if (!list.length) return null;
    const m = list[Math.floor(Math.random() * list.length)];
    return { id: null, src: m.src, cap: m.caption || "", alt: m.caption || "Our photo" };
  }

  let busy = false;
  const queue = [];

  function replyTo(text, hasPhoto) {
    queue.push({ text: text, hasPhoto: !!hasPhoto });
    if (busy) return;
    nextReply();
  }

  function nextReply() {
    if (!queue.length) { busy = false; return; }
    const job = queue.shift();
    busy = true;
    typingOn();
    setTimeout(function () {
      typingOff();
      const reply = { from: THEM.key, text: pickReply(job.text, job.hasPhoto), time: clock() };
      const photo = job.hasPhoto ? sitePhoto() : (Math.random() < 0.3 ? sitePhoto() : null);
      if (photo) {
        reply.image = photo.src;
        reply.imageCap = photo.cap;
        reply.imageAlt = photo.alt;
      }
      const el = addMessage(reply);
      miniBurst(6, el);
      nextReply();
    }, 1100 + Math.random() * 900);
  }

  /* =========================================================
     SEND
     ========================================================= */
  async function send(text) {
    const clean = String(text || "").trim();
    const list = pending.slice();
    if (!clean && !list.length) return;

    const metas = [];
    if (list.length) {
      if (!Photos) { toast("Sawirrada ayaa hadda ma shaqeyn ❌"); return; }
      for (let i = 0; i < list.length; i++) {
        try {
          metas.push(await Photos.save(list[i]));
        } catch (err) {
          toast(err && err.message ? err.message : "Sawirka ayaan qaadin karin");
        }
      }
    }
    clearPending();

    const el = addMessage({ from: ME.key, text: clean, images: metas });
    miniBurst(4, el);
    replyTo(clean, metas.length > 0);
  }

  /* =========================================================
     SETUP
     ========================================================= */
  if (statusEl && CFG.status) statusEl.textContent = CFG.status;

  let log = loadLog();
  if (!log) {
    log = (CFG.messages || []).map(function (m, i) {
      return Object.assign({ id: "seed" + i, ts: 0 }, m);
    });
  }

  const day = document.createElement("div");
  day.className = "chat__day";
  day.textContent = "This morning 🌙";
  body.appendChild(day);

  log.forEach(function (m) { body.appendChild(messageEl(m)); });
  scrollDown(false);

  (CFG.chips || []).forEach(function (text) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "chat__chip";
    b.textContent = text;
    b.addEventListener("click", function () {
      send(text);
      if (input) input.focus();
    });
    chips.appendChild(b);
  });

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const val = input ? input.value : "";
      if (input) input.value = "";
      send(val);
    });
  }

  /* ---------- attach a photo ---------- */
  if (attachBtn && fileInput) {
    attachBtn.addEventListener("click", function () { fileInput.click(); });
    fileInput.addEventListener("change", function () {
      const files = Array.prototype.slice.call(fileInput.files || []);
      fileInput.value = "";
      if (files.length) addFiles(files);
    });
  }

  /* ---------- drag & drop ---------- */
  if (shell) {
    ["dragenter", "dragover"].forEach(function (ev) {
      shell.addEventListener(ev, function (e) {
        const types = (e.dataTransfer && e.dataTransfer.types) ? Array.prototype.slice.call(e.dataTransfer.types) : [];
        if (types.indexOf("Files") === -1) return;
        e.preventDefault();
        shell.classList.add("is-drop");
      });
    });
    ["dragleave", "dragend"].forEach(function (ev) {
      shell.addEventListener(ev, function (e) {
        if (e.relatedTarget && shell.contains(e.relatedTarget)) return;
        shell.classList.remove("is-drop");
      });
    });
    shell.addEventListener("drop", function (e) {
      e.preventDefault();
      shell.classList.remove("is-drop");
      const files = (e.dataTransfer && e.dataTransfer.files)
        ? Array.prototype.slice.call(e.dataTransfer.files)
        : [];
      if (files.length) addFiles(files);
    });
  }

  /* ---------- paste a photo ---------- */
  document.addEventListener("paste", function (e) {
    const target = e.target;
    const inChat = (shell && shell.contains(target)) || target === input;
    if (!inChat) return;
    const items = (e.clipboardData && e.clipboardData.items) ? e.clipboardData.items : null;
    if (!items) return;
    const files = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === "file" && /^image\//i.test(items[i].type || "")) {
        const f = items[i].getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length) { e.preventDefault(); addFiles(files); }
  });

  /* Ayman writes first, once the room is seen */
  if ("IntersectionObserver" in window) {
    let greeted = false;
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting || greeted) return;
        greeted = true;
        io.disconnect();
        setTimeout(function () {
          typingOn();
          setTimeout(function () {
            typingOff();
            addMessage({
              from: THEM.key,
              text: "You came 🥺 I've been waiting to talk to you all day.",
              time: clock()
            });
            miniBurst(10);
          }, 1400);
        }, 900);
      });
    }, { threshold: 0.25 });
    io.observe(body);
  }
})();
