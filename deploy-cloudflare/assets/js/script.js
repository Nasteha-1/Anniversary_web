/* =========================================================
   🌌 OUR LITTLE UNIVERSE — main script
   ========================================================= */
(function () {
  "use strict";

  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================
     0. TAARIIKH (dates) — since + "maanta" la xafidiyay
     ========================================================= */
  const parseDay = function (iso) {
    if (!iso) return null;
    const d = new Date(iso + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  };
  const fmtDay = function (d) {
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  };
  const dayStamp = function (d) { return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()); };
  const daysBetween = function (from, to) { return Math.round((dayStamp(to) - dayStamp(from)) / 86400000); };

  /* =========================================================
     1. STARFIELD CANVAS
     ========================================================= */
  const Starfield = (function () {
    const canvas = $("#starfield");
    if (!canvas) return { destroy() {} };
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, dpr = 1, stars = [], shooters = [], raf = null;
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const TINTS = ["255,255,255", "255,214,232", "206,186,255", "255,168,197"];

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      build();
    }

    function build() {
      const count = Math.min(340, Math.round((w * h) / 8200));
      stars = [];
      for (let i = 0; i < count; i++) {
        const z = Math.random();
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          z: z,
          r: 0.35 + z * 1.45,
          tw: 0.4 + Math.random() * 1.9,
          phase: Math.random() * Math.PI * 2,
          tint: TINTS[(Math.random() * TINTS.length) | 0],
          drift: (Math.random() - 0.5) * 0.045
        });
      }
    }

    function shoot() {
      const fromLeft = Math.random() > 0.5;
      shooters.push({
        x: fromLeft ? -60 : w + 60,
        y: Math.random() * h * 0.55,
        vx: (fromLeft ? 1 : -1) * (7 + Math.random() * 5),
        vy: 2.4 + Math.random() * 2.4,
        life: 0,
        max: 78 + Math.random() * 40,
        len: 130 + Math.random() * 90
      });
    }

    function drawStar(s, t) {
      const twinkle = 0.55 + 0.45 * Math.sin(t * 0.001 * s.tw + s.phase);
      const px = s.x + mouse.x * s.z * 14;
      const py = s.y + mouse.y * s.z * 14;
      const alpha = Math.max(0, Math.min(1, twinkle * (0.35 + s.z * 0.75)));
      ctx.beginPath();
      ctx.fillStyle = "rgba(" + s.tint + "," + alpha.toFixed(3) + ")";
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fill();

      if (s.z > 0.82) {
        ctx.beginPath();
        ctx.fillStyle = "rgba(" + s.tint + "," + (alpha * 0.22).toFixed(3) + ")";
        ctx.arc(px, py, s.r * 3.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function tick(t) {
      ctx.clearRect(0, 0, w, h);

      mouse.x += (mouse.tx - mouse.x) * 0.045;
      mouse.y += (mouse.ty - mouse.y) * 0.045;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.y += s.drift;
        if (s.y > h + 4) s.y = -4;
        if (s.y < -4) s.y = h + 4;
        drawStar(s, t);
      }

      for (let i = shooters.length - 1; i >= 0; i--) {
        const m = shooters[i];
        m.x += m.vx;
        m.y += m.vy;
        m.life++;
        const fade = 1 - m.life / m.max;
        if (fade <= 0) { shooters.splice(i, 1); continue; }
        const g = ctx.createLinearGradient(m.x, m.y, m.x - m.vx * m.len * 0.12, m.y - m.vy * m.len * 0.12);
        g.addColorStop(0, "rgba(255,255,255," + (0.9 * fade).toFixed(3) + ")");
        g.addColorStop(0.4, "rgba(255,168,197," + (0.4 * fade).toFixed(3) + ")");
        g.addColorStop(1, "rgba(255,168,197,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 1.7;
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(m.x - m.vx * m.len * 0.12, m.y - m.vy * m.len * 0.12);
        ctx.stroke();
      }

      raf = requestAnimationFrame(tick);
    }

    function init() {
      resize();
      let resizeTimer;
      window.addEventListener("resize", function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 180);
      });
      window.addEventListener("pointermove", function (e) {
        mouse.tx = (e.clientX / w - 0.5) * 2;
        mouse.ty = (e.clientY / h - 0.5) * 2;
      }, { passive: true });

      if (reduceMotion) {
        for (let i = 0; i < stars.length; i++) drawStar(stars[i], 0);
        return;
      }
      raf = requestAnimationFrame(tick);
      setInterval(function () { if (Math.random() > 0.35) shoot(); }, 4200);
    }

    return {
      init: init,
      destroy: function () { if (raf) cancelAnimationFrame(raf); }
    };
  })();

  /* =========================================================
     2. SOFT PIANO (Web Audio — no audio files needed)
     ========================================================= */
  const Piano = (function () {
    let ctx = null, master = null, wet = null, timer = null, nextTime = 0, step = 0, on = false;

    const CHORDS = [
      [57, 60, 64, 69],   // Am
      [53, 57, 60, 65],   // F
      [48, 52, 55, 60],   // C
      [55, 59, 62, 67]    // G
    ];
    const STEP = 0.52;    // seconds per arpeggio note

    const hz = function (m) { return 440 * Math.pow(2, (m - 69) / 12); };

    function build() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();

      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      // soft "hall" using feedback delay
      const delay = ctx.createDelay(1.0);
      delay.delayTime.value = 0.29;
      const fb = ctx.createGain();
      fb.gain.value = 0.36;
      const tone = ctx.createBiquadFilter();
      tone.type = "lowpass";
      tone.frequency.value = 2200;
      wet = ctx.createGain();
      wet.gain.value = 0.55;

      delay.connect(fb); fb.connect(tone); tone.connect(delay);
      delay.connect(wet); wet.connect(master);

      master._delay = delay;
      return true;
    }

    function voice(midi, time, dur, vol) {
      const f = hz(midi);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(vol, time + 0.03);
      g.gain.exponentialRampToValueAtTime(vol * 0.32, time + 0.28);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.setValueAtTime(2600, time);
      lp.frequency.exponentialRampToValueAtTime(700, time + dur);

      const o1 = ctx.createOscillator();
      o1.type = "triangle";
      o1.frequency.value = f;
      const o2 = ctx.createOscillator();
      o2.type = "sine";
      o2.frequency.value = f * 2;
      const g2 = ctx.createGain();
      g2.gain.value = 0.18;

      o1.connect(lp); o2.connect(g2); g2.connect(lp);
      lp.connect(g); g.connect(master); g.connect(master._delay);

      o1.start(time); o2.start(time);
      o1.stop(time + dur + 0.05); o2.stop(time + dur + 0.05);
    }

    function bass(midi, time, dur) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(0.11, time + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = hz(midi - 12);
      o.connect(g); g.connect(master);
      o.start(time); o.stop(time + dur + 0.05);
    }

    function schedule() {
      if (!on) return;
      while (nextTime < ctx.currentTime + 0.6) {
        const chord = CHORDS[(step / 8 | 0) % CHORDS.length];
        const note = chord[step % 4];
        const octave = (step % 8 === 4) ? 12 : 0;
        voice(note + octave, nextTime, STEP * 2.4, 0.085);
        if (step % 8 === 0) bass(chord[0], nextTime, STEP * 3.2);
        nextTime += STEP;
        step = (step + 1) % 32;
      }
    }

    return {
      get on() { return on; },
      start: function () {
        if (!ctx && !build()) return false;
        if (ctx.state === "suspended") ctx.resume();
        on = true;
        nextTime = ctx.currentTime + 0.15;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 2.2);
        if (!timer) timer = setInterval(schedule, 180);
        schedule();
        return true;
      },
      stop: function () {
        if (!ctx) return;
        on = false;
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
      },
      toggle: function () {
        if (on) { this.stop(); return false; }
        this.start();
        return true;
      },
      recenter: function () {
        if (ctx && on) nextTime = ctx.currentTime + 0.12;
      }
    };
  })();

  /* =========================================================
     3. RENDERING SECTIONS FROM data.js
     ========================================================= */
  function renderPlanets() {
    const wrap = $("#planetsRow");
    if (!wrap) return;
    wrap.innerHTML = UNIVERSE.planets.map(function (p, i) {
      return '' +
        '<article class="planet" data-reveal data-delay="' + i + '" style="--planet-a:' + p.color + ';--planet-glow:' + p.glow + '">' +
          '<div class="planet__stage">' +
            '<span class="planet__orbit"></span>' +
            '<span class="planet__orbit planet__orbit--inner"><i class="planet__moon"></i></span>' +
            '<div class="planet__body" tabindex="0" role="button" aria-label="' + p.name + ' — tap to hear it speak">' + p.icon + '</div>' +
            (p.ring ? '<span class="planet__ring"></span>' : '') +
          '</div>' +
          '<h4 class="planet__name">' + p.name + '</h4>' +
          '<p class="planet__tag">' + p.tagline + '</p>' +
          '<p class="planet__msg">' + p.message + '</p>' +
        '</article>';
    }).join("");

    $$(".planet__body").forEach(function (body) {
      const card = body.closest(".planet");
      const open = function () {
        const wasOpen = card.classList.contains("is-open");
        $$(".planet").forEach(function (c) { c.classList.remove("is-open"); });
        if (!wasOpen) {
          card.classList.add("is-open");
          burstHearts(8);
        }
      };
      body.addEventListener("click", open);
      body.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });
  }

  function renderTimeline() {
    const wrap = $("#timeline");
    if (!wrap) return;
    wrap.innerHTML = UNIVERSE.story.map(function (s, i) {
      return '' +
        '<div class="tl-item" data-reveal data-delay="' + (i % 2) + '">' +
          '<div class="tl-card">' +
            '<span class="tl-date">' + s.date + ' ' + s.icon + '</span>' +
            '<h4 class="tl-title">' + s.title + '</h4>' +
            '<p class="tl-text">' + s.text + '</p>' +
          '</div>' +
        '</div>';
    }).join("");
  }

  function renderMemories() {
    const wrap = $("#memGrid");
    if (!wrap) return;
    wrap.innerHTML = UNIVERSE.memories.map(function (m, i) {
      const ph = '<div class="mem__ph" style="--ph-a:' + (m.a || "#1e6fa8") + ';--ph-b:' + (m.b || "#6fd3ff") + '">' + m.icon + '<span>add your photo</span></div>';
      const img = m.src
        ? '<img class="mem__img" src="' + m.src + '" alt="' + m.caption + '" loading="lazy" onerror="this.remove()" />'
        : '';
      return '' +
        '<figure class="mem" data-reveal data-delay="' + (i % 3) + '" data-src="' + (m.src || "") + '" data-cap="' + m.caption + '" data-icon="' + m.icon + '" data-a="' + (m.a || "#1e6fa8") + '" data-b="' + (m.b || "#6fd3ff") + '" tabindex="0" role="button" aria-label="' + m.caption + '">' +
          ph + img +
          '<span class="mem__veil"></span>' +
          '<span class="mem__zoom">⤢</span>' +
          '<figcaption class="mem__cap">' + m.caption + '<span class="mem__note">' + m.note + '</span></figcaption>' +
        '</figure>';
    }).join("");

    $$(".mem").forEach(function (card) {
      const open = function () { openLightbox(card); };
      card.addEventListener("click", open);
      card.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
    });
  }

  function renderLetter() {
    const body = $("#letterBody");
    const sign = $("#letterSign");
    const date = $("#letterDate");
    if (!body) return;
    date.textContent = UNIVERSE.letter.date;
    body.innerHTML = UNIVERSE.letter.paragraphs.map(function (p, i) {
      return '<p class="' + (p.hi ? "hi" : "") + '" style="animation-delay:' + (i * 0.28) + 's">' + p.text + '</p>';
    }).join("");
    sign.textContent = UNIVERSE.letter.sign;
  }

  function renderDreams() {
    const wrap = $("#dreamsRow");
    if (!wrap) return;
    wrap.innerHTML = UNIVERSE.dreams.map(function (d, i) {
      return '' +
        '<article class="dream" data-reveal data-delay="' + (i % 4) + '">' +
          '<span class="dream__icon">' + d.icon + '</span>' +
          '<h4 class="dream__title">' + d.title + '</h4>' +
          '<p class="dream__text">' + d.text + '</p>' +
        '</article>';
    }).join("");
  }

  function renderMeta() {
    const ann = $("#anniversaryText");
    if (ann) ann.textContent = UNIVERSE.anniversaryLine;
    const fn = $("#footerName");
    if (fn) fn.textContent = UNIVERSE.partner;
    const fs = $("#footerSince");
    if (fs) {
      const sinceD = parseDay(UNIVERSE.since);
      const todayD = parseDay(UNIVERSE.today);
      if (sinceD) {
        let txt = "Together since " + fmtDay(sinceD);
        if (todayD) txt += " · " + daysBetween(sinceD, todayD) + " days · as of " + fmtDay(todayD);
        fs.textContent = txt;
      } else {
        fs.textContent = "Since " + UNIVERSE.since;
      }
    }
    const q = $(".future-quote p");
    if (q) q.textContent = "“" + UNIVERSE.finalQuote + "” ❤️";
    const f = $(".finale__small");
    if (f) f.textContent = UNIVERSE.finaleLine;
    document.title = "💗 Our Anniversary — " + UNIVERSE.me + " & " + UNIVERSE.partner;
  }

  /* =========================================================
     4. COUNTDOWN
     ========================================================= */
  function initCountdown() {
    const sinceDate = parseDay(UNIVERSE.since);
    const days = $("#cdDays"), hours = $("#cdHours"), mins = $("#cdMins"), secs = $("#cdSecs");
    if (!days || !sinceDate) return;
    const pad = function (n) { return String(n).padStart(2, "0"); };

    /* ---------- maanta ---------- */
    /* "Maanta" la xafidiyay (UNIVERSE.today). Haddii uusan jirin,
       la isticmaalayaa saacadda dhabta ah ee browser-ka. */
    const pinned = (typeof UNIVERSE !== "undefined" && UNIVERSE.today) ? UNIVERSE.today : "";
    const base = pinned ? new Date(pinned + "T00:00:00").getTime() : Date.now();
    const t0 = Date.now();

    /* ---------- xarfaha "as of" ---------- */
    const asOf = $("#cdAsOf");
    if (asOf) {
      const todayD = parseDay(pinned);
      asOf.textContent = "Since " + fmtDay(sinceDate) +
        (todayD ? " · as of " + fmtDay(todayD) : "");
    }

    /* Maalmooyinka waxaa loo xisaabiyaa calendar-ka (DST-safe). */
    const tick = function () {
      const now = new Date(base + (Date.now() - t0));
      const d = Math.round((dayStamp(now) - dayStamp(sinceDate)) / 86400000);
      days.textContent = d;
      hours.textContent = pad(now.getHours());
      mins.textContent = pad(now.getMinutes());
      secs.textContent = pad(now.getSeconds());
    };
    tick();
    setInterval(tick, 1000);
  }

  /* =========================================================
     5. REVEAL ON SCROLL + NAV
     ========================================================= */
  function initReveal() {
    const items = $$("[data-reveal]");
    items.forEach(function (el) {
      const d = el.getAttribute("data-delay");
      if (d) el.style.setProperty("--d", d);
    });
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -60px 0px" });
    items.forEach(function (el) { io.observe(el); });
  }

  function initNav() {
    const nav = $("#nav");
    const links = $("#navLinks");
    const burger = $("#navBurger");
    const sections = $$("main section[id]");

    const onScroll = function () {
      const y = window.scrollY;
      nav.classList.toggle("is-visible", y > window.innerHeight * 0.55);
      nav.classList.toggle("is-scrolled", y > 40);

      let current = "";
      sections.forEach(function (s) {
        if (s.getBoundingClientRect().top <= window.innerHeight * 0.42) current = s.id;
      });
      $$(".nav__links a").forEach(function (a) {
        a.classList.toggle("is-active", a.getAttribute("href") === "#" + current);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    if (burger && links) {
      burger.addEventListener("click", function () {
        const open = links.classList.toggle("is-open");
        burger.setAttribute("aria-expanded", String(open));
      });
      links.addEventListener("click", function (e) {
        if (e.target.tagName === "A") {
          links.classList.remove("is-open");
          burger.setAttribute("aria-expanded", "false");
        }
      });
    }
  }

  /* =========================================================
     6. LIGHTBOX
     ========================================================= */
  let lastFocused = null;
  function openLightbox(card) {
    const box = $("#lightbox"), img = $("#lightboxImg"), cap = $("#lightboxCap"), phBox = $("#lightboxPh");
    const src = card.getAttribute("data-src");
    const capText = card.getAttribute("data-cap") || "";
    const note = $(".mem__note", card);
    lastFocused = document.activeElement;

    if (src) {
      img.src = src;
      img.alt = capText;
      img.hidden = false;
      phBox.hidden = true;
    } else {
      img.hidden = true;
      img.removeAttribute("src");
      phBox.hidden = false;
      phBox.style.setProperty("--ph-a", card.getAttribute("data-a"));
      phBox.style.setProperty("--ph-b", card.getAttribute("data-b"));
      phBox.innerHTML = card.getAttribute("data-icon") + "<span>add your photo in images/</span>";
    }

    cap.innerHTML = capText + (note ? " <span class='mem__note'>" + note.textContent + "</span>" : "");
    box.hidden = false;
    document.body.classList.add("is-locked");
    $("#lightboxClose").focus();
  }
  function closeLightbox() {
    $("#lightbox").hidden = true;
    document.body.classList.remove("is-locked");
    if (lastFocused) lastFocused.focus();
  }
  function initLightbox() {
    $("#lightboxClose").addEventListener("click", closeLightbox);
    $("#lightbox").addEventListener("click", function (e) {
      if (e.target === this) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !$("#lightbox").hidden) closeLightbox();
    });
    window.openUniverseLightbox = openLightbox;
  }

  /* =========================================================
     7. ENVELOPE / LETTER
     ========================================================= */
  function initEnvelope() {
    const env = $("#envelope"), btn = $("#envelopeBtn"), paper = $("#letterPaper");
    if (!btn) return;
    btn.addEventListener("click", function () {
      env.classList.add("is-open");
      setTimeout(function () {
        paper.hidden = false;
        env.style.display = "none";
        paper.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        burstHearts(14);
      }, reduceMotion ? 0 : 700);
    });
  }

  /* =========================================================
     8. FLOATING HEARTS + TOAST
     ========================================================= */
  const HEARTS = ["💗", "💕", "❤️", "💖", "💘", "✨", "🌸", "⭐"];
  function burstHearts(count) {
    const reduce = reduceMotion;
    for (let i = 0; i < (reduce ? 0 : count); i++) {
      const el = document.createElement("span");
      el.className = "fx";
      el.textContent = HEARTS[(Math.random() * HEARTS.length) | 0];
      el.style.left = (8 + Math.random() * 84) + "vw";
      el.style.top = (72 + Math.random() * 22) + "vh";
      el.style.setProperty("--dx", (Math.random() * 160 - 80) + "px");
      el.style.setProperty("--rot", (Math.random() * 400 - 200) + "deg");
      el.style.animationDuration = (3.4 + Math.random() * 2.6) + "s";
      el.style.animationDelay = (Math.random() * 0.5) + "s";
      document.body.appendChild(el);
      (function (node) {
        setTimeout(function () { node.remove(); }, 6600);
      })(el);
    }
  }

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("is-on"); }, 3200);
  }
  window.universeToast = toast;

  /* =========================================================
     9. MUSIC BUTTON
     ========================================================= */
  function initMusic() {
    const btn = $("#musicBtn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      const playing = Piano.toggle();
      btn.setAttribute("aria-pressed", String(playing));
      toast(playing ? "♪ Our song is playing" : "🔇 Music muted");
    });
    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) Piano.recenter();
    });
  }

  /* =========================================================
     10. ENTER UNIVERSE
     ========================================================= */
  function initEnter() {
    const loader = $("#loader"), btn = $("#enterBtn");
    btn.addEventListener("click", function () {
      loader.classList.add("is-gone");
      document.body.classList.remove("is-locked");
      setTimeout(function () { loader.style.display = "none"; }, 1200);
      if (Piano.start()) {
        $("#musicBtn").setAttribute("aria-pressed", "true");
        toast("♪ Our song is playing — tap the speaker to mute");
      }
      burstHearts(18);
    });
  }

  /* =========================================================
     11. CURSOR GLOW
     ========================================================= */
  function initCursor() {
    if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;
    const glow = $("#cursorGlow");
    document.body.classList.add("has-pointer");
    let tx = 0, ty = 0, cx = 0, cy = 0;
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
    }, { passive: true });
    (function loop() {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      glow.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      requestAnimationFrame(loop);
    })();
  }

  /* =========================================================
     BOOT
     ========================================================= */
  function boot() {
    document.body.classList.add("is-locked");
    renderMeta();
    renderPlanets();
    renderTimeline();
    renderMemories();
    if (window.UniversePhotos) window.UniversePhotos.renderPins();
    renderLetter();
    renderDreams();
    initCountdown();
    initReveal();
    initNav();
    initLightbox();
    initEnvelope();
    initMusic();
    initEnter();
    initCursor();
    Starfield.init();

    const heartsBtn = $("#heartsBtn");
    if (heartsBtn) heartsBtn.addEventListener("click", function () { burstHearts(30); toast("💗 Sent, with all my love"); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
