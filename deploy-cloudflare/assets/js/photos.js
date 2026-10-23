/* =========================================================
   🖼️ PHOTOS — sawirrada: compress, keydi, oo ku jiro bogga
   (Photos are compressed, stored on the device and can be
   pinned into the Memories gallery of the website.)
   ========================================================= */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const DB_NAME = "universe-photos";
  const DB_VERSION = 2;
  const STORE = "photos";
  const LS_FALLBACK = "universe.photos.fallback.v1";
  const PIN_KEY = "universe.pins.v1";
  const MAX_SIDE = 1600;
  const JPEG_QUALITY = 0.82;

  /* =========================================================
     1. STORAGE — IndexedDB marka hore, localStorage backup
     ========================================================= */
  let dbPromise = null;
  const urlCache = new Map();

  /* had iyo jeer ha aan u xazin — haddii uusan ka soo baxdo, localStorage ayaan u fallback gareeynaa */
  function withTimeout(promise, ms, message) {
    return new Promise(function (resolve, reject) {
      const timer = setTimeout(function () { reject(new Error(message || "Waa la dhakhso badanay")); }, ms);
      Promise.resolve(promise).then(function (v) { clearTimeout(timer); resolve(v); },
        function (e) { clearTimeout(timer); reject(e); });
    });
  }

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      if (!window.indexedDB) { reject(new Error("IndexedDB ma jiro")); return; }
      let done = false;
      const win = function (db) { if (done) return; done = true; resolve(db); };
      const fail = function (err) { if (done) return; done = true; reject(err); };
      const timer = setTimeout(function () {
        fail(new Error("IndexedDB waa ka dhakhso badan"));
      }, 2500);

      let req;
      try { req = window.indexedDB.open(DB_NAME, DB_VERSION); }
      catch (err) { clearTimeout(timer); fail(err); return; }

      req.onupgradeneeded = function () {
        const db = req.result;
        /* haddii uu store-ka jirin, halkan ayaa loo abuurayaa */
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
      };
      req.onsuccess = function () { clearTimeout(timer); win(req.result); };
      req.onerror = function () { clearTimeout(timer); fail(req.error || new Error("IndexedDB error")); };
      req.onblocked = function () { clearTimeout(timer); fail(new Error("IndexedDB waa xannibaa")); };
    });
    return dbPromise;
  }

  function idb(mode, run) {
    return openDB().then(function (db) {
      return new Promise(function (resolve, reject) {
        let done = false;
        const win = function (v) { if (done) return; done = true; resolve(v); };
        const fail = function (e) { if (done) return; done = true; reject(e); };
        const timer = setTimeout(function () { fail(new Error("Kaydin waa ka dhakhso badan")); }, 8000);
        let tx;
        try { tx = db.transaction(STORE, mode); }
        catch (err) { clearTimeout(timer); fail(err); return; }
        const req = run(tx.objectStore(STORE));
        tx.oncomplete = function () { clearTimeout(timer); win(req && "result" in req ? req.result : undefined); };
        tx.onerror = function () { clearTimeout(timer); fail(tx.error || new Error("Kaydin ayaan guuldarey")); };
        tx.onabort = function () { clearTimeout(timer); fail(tx.error || new Error("Kaydin waa la joojiyay")); };
      });
    });
  }

  function fallbackRead() {
    try { return JSON.parse(window.localStorage.getItem(LS_FALLBACK) || "{}"); }
    catch (err) { return {}; }
  }

  function fallbackWrite(obj) {
    try { window.localStorage.setItem(LS_FALLBACK, JSON.stringify(obj)); return true; }
    catch (err) { return false; }
  }

  function blobToDataURL(blob) {
    return new Promise(function (resolve, reject) {
      const fr = new FileReader();
      fr.onload = function () { resolve(fr.result); };
      fr.onerror = function () { reject(fr.error); };
      fr.readAsDataURL(blob);
    });
  }

  function dataURLToBlob(url) {
    const parts = String(url).split(",");
    const mime = (parts[0].match(/:(.*?);/) || [null, "image/jpeg"])[1];
    const bin = atob(parts[1] || "");
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return new Blob([buf], { type: mime });
  }

  async function store(id, blob) {
    try {
      await idb("readwrite", function (store) { return store.put(blob, id); });
      return "idb";
    } catch (err) {
      const all = fallbackRead();
      all[id] = await blobToDataURL(blob);
      if (!fallbackWrite(all)) {
        throw new Error("Sawirrada ayaan si buuxda keydin karin — boogu wax yar oo kale 🙂");
      }
      return "local";
    }
  }

  async function load(id) {
    try {
      const blob = await idb("readonly", function (store) { return store.get(id); });
      if (blob) return blob;
    } catch (err) { /* ku dar localStorage */ }
    const url = fallbackRead()[id];
    return url ? dataURLToBlob(url) : null;
  }

  async function drop(id) {
    try { await idb("readwrite", function (store) { return store.delete(id); }); } catch (err) {}
    const all = fallbackRead();
    if (all[id]) { delete all[id]; fallbackWrite(all); }
    if (urlCache.has(id)) {
      URL.revokeObjectURL(urlCache.get(id));
      urlCache.delete(id);
    }
  }

  /* =========================================================
     2. COMPRESS — sawir wuu yar yaraaneyo si degdeg loo keydiyo
     ========================================================= */
  function loadImage(file) {
    return new Promise(function (resolve, reject) {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); resolve(img); };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Sawirka ayaan akhrin karin")); };
      img.src = url;
    });
  }

  function canvasBlob(canvas, type, quality) {
    return new Promise(function (resolve) {
      canvas.toBlob(function (blob) { resolve(blob); }, type, quality);
    });
  }

  async function compress(file) {
    const img = await loadImage(file);
    const w0 = img.naturalWidth || img.width;
    const h0 = img.naturalHeight || img.height;
    const scale = Math.min(1, MAX_SIDE / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * scale));
    const h = Math.max(1, Math.round(h0 * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);

    let type = /png/i.test(file.type) ? "image/png" : "image/jpeg";
    let blob = await canvasBlob(canvas, type, type === "image/jpeg" ? JPEG_QUALITY : undefined);
    if (!blob) { type = "image/jpeg"; blob = await canvasBlob(canvas, type, JPEG_QUALITY); }
    if (type === "image/png" && blob.size > 1200000) {
      type = "image/jpeg";
      blob = await canvasBlob(canvas, type, JPEG_QUALITY);
    }
    return { blob: blob, w: w, h: h };
  }

  /* =========================================================
     3. PINS — sawirrada la «pin» gareeyay → Memories gallery
     ========================================================= */
  function readPins() {
    try {
      const list = JSON.parse(window.localStorage.getItem(PIN_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (err) { return []; }
  }

  function writePins(list) {
    try { window.localStorage.setItem(PIN_KEY, JSON.stringify(list)); } catch (err) {}
  }

  function escapeHTML(str) {
    return String(str == null ? "" : str).replace(/[&<>"']/g, function (c) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c];
    });
  }

  async function renderPins() {
    const grid = $("#memGrid");
    if (!grid) return;
    $$(".mem--pin", grid).forEach(function (el) { el.remove(); });

    const pins = readPins();
    for (let i = 0; i < pins.length; i++) {
      const pin = pins[i];
      const url = await Photos.url(pin.id);
      if (!url) continue;

      const caption = pin.caption || "Sawirkeena";
      const note = pin.note || "From our chat 💌";

      const fig = document.createElement("figure");
      fig.className = "mem mem--pin is-in";
      fig.setAttribute("data-src", url);
      fig.setAttribute("data-cap", caption);
      fig.setAttribute("data-icon", "📸");
      fig.setAttribute("tabindex", "0");
      fig.setAttribute("role", "button");
      fig.setAttribute("aria-label", caption);
      fig.innerHTML =
        '<img class="mem__img" src="' + url + '" alt="' + escapeHTML(caption) + '" loading="lazy" />' +
        '<span class="mem__veil"></span>' +
        '<span class="mem__zoom">⤢</span>' +
        '<figcaption class="mem__cap">' + escapeHTML(caption) +
        '<span class="mem__note">' + escapeHTML(note) + "</span></figcaption>";

      const open = function () {
        if (typeof window.openUniverseLightbox === "function") window.openUniverseLightbox(fig);
      };
      fig.addEventListener("click", open);
      fig.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });

      grid.appendChild(fig);
    }
  }

  /* =========================================================
     4. PUBLIC API
     ========================================================= */
  const Photos = {
    /* diyaar garo sawirka (compress + preview) */
    async prepare(file) {
      if (!file || !/^image\//i.test(file.type || "")) {
        throw new Error("Fadlan sawir iyo keliya dooro 📸");
      }
      const out = await compress(file);
      return {
        blob: out.blob,
        w: out.w,
        h: out.h,
        size: out.blob.size,
        name: file.name || "sawir",
        type: out.blob.type,
        url: URL.createObjectURL(out.blob)
      };
    },

    /* keydi sawirka oo uu id leeyo */
    async save(prepared) {
      const id = "ph_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
      await withTimeout(store(id, prepared.blob), 12000, "Sawirka ayaan keydin karin");
      return {
        id: id,
        w: prepared.w,
        h: prepared.h,
        size: prepared.size,
        name: prepared.name,
        type: prepared.type
      };
    },

    /* URL-ka sawirka (oo la keydiyay) */
    url(id) {
      if (!id) return Promise.resolve(null);
      if (urlCache.has(id)) return Promise.resolve(urlCache.get(id));
      return withTimeout(load(id), 12000, "Sawirka ayaan la keeni karin")
        .then(function (blob) {
          if (!blob) return null;
          const url = URL.createObjectURL(blob);
          urlCache.set(id, url);
          return url;
        });
    },

    blob: load,
    remove: drop,

    /* ---- Memories gallery ---- */
    isPinned: function (id) {
      return readPins().some(function (p) { return p.id === id; });
    },
    pin: async function (meta, caption, note) {
      const pins = readPins();
      if (pins.some(function (p) { return p.id === meta.id; })) return false;
      pins.unshift({
        id: meta.id,
        caption: caption || "Sawirkeena 📸",
        note: note || "From our chat 💌",
        ts: Date.now()
      });
      writePins(pins);
      await renderPins();
      return true;
    },
    unpin: async function (id) {
      writePins(readPins().filter(function (p) { return p.id !== id; }));
      await renderPins();
    },
    renderPins: renderPins,

    /* saar sawirka kombuyuutarka gudihiisa */
    download: async function (id, name) {
      const blob = await withTimeout(load(id), 12000, "Sawirka ayaan la keeni karin");
      if (!blob) return false;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = String(name || "sawir").replace(/\.[a-z0-9]+$/i, "") + ".jpg";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
      return true;
    },

    /* tirada sawirrada la keydiyay */
    count: function () {
      return readPins().length;
    }
  };

  window.UniversePhotos = Photos;
})();
