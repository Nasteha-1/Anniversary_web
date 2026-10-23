(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const SPOT_SELECTOR = ".planet, .dream, .tl-card, .countdown__cell, .future-quote, .mem";

  function initSpotlight() {
    if (!finePointer) return;

    document.addEventListener("pointermove", function (e) {
      const card = e.target && e.target.closest ? e.target.closest(SPOT_SELECTOR) : null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      if (!r.width || !r.height) return;
      card.style.setProperty("--mx", (((e.clientX - r.left) / r.width) * 100).toFixed(1) + "%");
      card.style.setProperty("--my", (((e.clientY - r.top) / r.height) * 100).toFixed(1) + "%");
    }, { passive: true });
  }

  function initMagnetic() {
    if (reduceMotion || !finePointer) return;

    const targets = $$(".btn, .nav__logo, .nav__music, .chat__attach, .chat__send");

    targets.forEach(function (el) {
      el.classList.add("magnetic");

      el.addEventListener("pointermove", function (e) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "translate(" + (px * 10).toFixed(2) + "px, " + (py * 10 - 2).toFixed(2) + "px)";
      }, { passive: true });

      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });
  }

  function initCustomCursor() {
    if (reduceMotion || !finePointer) return;

    const dot = document.createElement("div");
    const ring = document.createElement("div");
    dot.className = "cursor-dot";
    ring.className = "cursor-ring";
    dot.setAttribute("aria-hidden", "true");
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mx = -100, my = -100, rx = -100, ry = -100;
    let shown = false;

    document.addEventListener("pointermove", function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = "translate3d(" + mx + "px, " + my + "px, 0)";

      if (!shown) {
        shown = true;
        rx = mx;
        ry = my;
        document.body.classList.add("has-custom-cursor");
      }

      const target = e.target;
      const typing = !!(target && target.closest && target.closest("input, textarea, select"));
      document.body.classList.toggle("cursor-typing", typing);

      const interactive = !!(target && target.closest && target.closest(
        "a, button, [role='button'], .mem, .planet__body, .envelope__btn, .nav__burger"
      ));
      ring.classList.toggle("is-hover", interactive && !typing);
    }, { passive: true });

    document.addEventListener("pointerdown", function () {
      ring.classList.add("is-down");
    });

    document.addEventListener("pointerup", function () {
      ring.classList.remove("is-down");
    });

    document.addEventListener("mouseleave", function () {
      document.body.classList.remove("has-custom-cursor");
      shown = false;
    });

    document.addEventListener("mouseenter", function () {
      if (!shown) {
        shown = true;
        document.body.classList.add("has-custom-cursor");
      }
    });

    (function loop() {
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      ring.style.transform = "translate3d(" + rx.toFixed(2) + "px, " + ry.toFixed(2) + "px, 0)";
      requestAnimationFrame(loop);
    })();
  }

  function initHeroParallax() {
    if (reduceMotion || !finePointer) return;

    const hero = $(".hero");
    if (!hero) return;

    const layers = [
      { el: $(".hero__badge", hero), f: 14 },
      { el: $(".hero__title", hero), f: 26 },
      { el: $(".hero__sub", hero), f: 18 },
      { el: $(".countdown", hero), f: 10 }
    ].filter(function (l) { return l.el; });

    if (!layers.length) return;

    let tx = 0, ty = 0, cx = 0, cy = 0;

    window.addEventListener("pointermove", function (e) {
      tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });

    (function loop() {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      layers.forEach(function (l) {
        l.el.style.translate = (-cx * l.f).toFixed(2) + "px " + (-cy * l.f).toFixed(2) + "px";
      });
      requestAnimationFrame(loop);
    })();
  }

  function initNavAutoHide() {
    const nav = $("#nav");
    if (!nav) return;

    const links = $("#navLinks");
    let lastY = window.scrollY;

    window.addEventListener("scroll", function () {
      const y = window.scrollY;
      const delta = y - lastY;
      const menuOpen = links && links.classList.contains("is-open");

      if (menuOpen || y < 90) {
        nav.classList.remove("nav--hidden");
      } else if (delta > 6 && y > window.innerHeight * 0.7) {
        nav.classList.add("nav--hidden");
      } else if (delta < -6) {
        nav.classList.remove("nav--hidden");
      }

      lastY = y;
    }, { passive: true });
  }

  function initToTop() {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "to-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML = "<span aria-hidden='true'>↑</span>";
    document.body.appendChild(btn);

    let raf = null;

    function paint() {
      raf = null;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      btn.style.setProperty("--p", (ratio * 100).toFixed(1));
      btn.classList.toggle("is-on", window.scrollY > window.innerHeight * 0.8);
    }

    function request() {
      if (!raf) raf = requestAnimationFrame(paint);
    }

    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request);
    paint();

    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  function initReducedMotionCleanup() {
    if (!reduceMotion) return;
    document.body.style.setProperty("--mx", "50%");
    document.body.style.setProperty("--my", "50%");
  }

  function boot() {
    initSpotlight();
    initMagnetic();
    initCustomCursor();
    initHeroParallax();
    initNavAutoHide();
    initToTop();
    initReducedMotionCleanup();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      requestAnimationFrame(boot);
    });
  } else {
    requestAnimationFrame(boot);
  }
})();
