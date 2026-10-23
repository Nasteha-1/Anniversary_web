/* =========================================================
   ✨ MOTION & POLISH — scroll progress, 3D tilt, parallax
   ========================================================= */
(function () {
  "use strict";

  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TILT_SELECTOR = ".planet, .dream, .tl-card, .mem, .countdown__cell";
  const MAX_TILT = 8;

  /* ---------- thin gradient progress bar ---------- */
  function initScrollProgress() {
    const bar = $("#scrollProgress");
    if (!bar) return;

    let raf = null;
    function paint() {
      raf = null;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
      bar.classList.toggle("is-on", window.scrollY > 12);
    }
    function request() { if (!raf) raf = requestAnimationFrame(paint); }

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    paint();
  }

  /* ---------- subtle 3D tilt that follows the pointer ---------- */
  function initTilt() {
    if (reduceMotion || !window.matchMedia("(pointer: fine)").matches) return;

    $$(TILT_SELECTOR).forEach(function (el) { el.classList.add("tilt"); });

    let current = null;

    function reset(el) {
      if (!el) return;
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    }

    function follow(e) {
      if (!current) return;
      const r = current.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      current.style.setProperty("--ry", (px * MAX_TILT * 2).toFixed(2) + "deg");
      current.style.setProperty("--rx", (-py * MAX_TILT * 2).toFixed(2) + "deg");
    }

    document.addEventListener("pointermove", function (e) {
      const card = e.target && e.target.closest ? e.target.closest(TILT_SELECTOR) : null;
      if (card !== current) {
        reset(current);
        current = card;
        if (current) current.classList.add("tilt");
      }
      follow(e);
    }, { passive: true });

    document.addEventListener("pointerout", function (e) {
      if (!e.relatedTarget && current) { reset(current); current = null; }
    });

    window.addEventListener("blur", function () { reset(current); current = null; });
  }

  /* ---------- gentle nebula parallax on scroll ---------- */
  function initParallax() {
    if (reduceMotion) return;

    const layers = [
      { el: $(".nebula--1"), f: 0.16 },
      { el: $(".nebula--2"), f: -0.12 },
      { el: $(".nebula--3"), f: 0.09 }
    ].filter(function (l) { return l.el; });
    if (!layers.length) return;

    let raf = null;
    function paint() {
      raf = null;
      const y = window.scrollY;
      layers.forEach(function (l) {
        l.el.style.setProperty("--py", (y * l.f).toFixed(1) + "px");
      });
    }
    function request() { if (!raf) raf = requestAnimationFrame(paint); }

    window.addEventListener("scroll", request, { passive: true });
    paint();
  }

  /* ---------- little pop when the clock ticks ---------- */
  function initCountdownPop() {
    if (reduceMotion || !window.MutationObserver) return;

    ["cdDays", "cdHours", "cdMins", "cdSecs"].forEach(function (id) {
      const el = document.getElementById(id);
      if (!el) return;
      let last = el.textContent;
      const obs = new MutationObserver(function () {
        const value = el.textContent;
        if (value === last) return;
        last = value;
        el.classList.remove("is-tick");
        void el.offsetWidth;
        el.classList.add("is-tick");
      });
      obs.observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  function boot() {
    initScrollProgress();
    initTilt();
    initParallax();
    initCountdownPop();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { requestAnimationFrame(boot); });
  } else {
    requestAnimationFrame(boot);
  }
})();
