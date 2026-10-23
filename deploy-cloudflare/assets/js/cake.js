/* =========================================================
   🎂 CELEBRATION CAKE — happy anniversary
   ========================================================= */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const cake = $("#cake");
  if (!cake) return;

  const btn = $("#cakeBtn");
  const confetti = $("#cakeConfetti");
  const sinceEl = $("#cakeSince");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const COLORS = ["#ff6fa5", "#ffa8c5", "#b57bff", "#ffd166", "#7ee8c8", "#ffffff", "#ff8fb8"];

  /* ---------- confetti ---------- */
  function makeConfetti(count) {
    if (!confetti || reduceMotion) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("i");
      p.className = "confetto";
      p.style.left = (Math.random() * 100) + "vw";
      p.style.background = COLORS[Math.floor(Math.random() * COLORS.length)];
      p.style.animationDuration = (3.4 + Math.random() * 3) + "s";
      p.style.animationDelay = (Math.random() * 1.6) + "s";
      p.style.transform = "rotate(" + Math.round(Math.random() * 360) + "deg)";
      confetti.appendChild(p);
      (function (node) { setTimeout(function () { node.remove(); }, 9000); })(p);
    }
  }

  /* ---------- date ---------- */
  if (sinceEl) {
    const since = (typeof UNIVERSE !== "undefined" && UNIVERSE.since) ? UNIVERSE.since : "";
    const today = (typeof UNIVERSE !== "undefined" && UNIVERSE.today) ? UNIVERSE.today : "";
    if (since) {
      const d = new Date(since + "T00:00:00");
      if (!isNaN(d.getTime())) {
        let txt = "Together since " + d.toLocaleDateString("en-GB", {
          day: "numeric", month: "long", year: "numeric"
        });
        const t = today ? new Date(today + "T00:00:00") : null;
        if (t && !isNaN(t.getTime())) {
          const start = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
          const end = Date.UTC(t.getFullYear(), t.getMonth(), t.getDate());
          txt += " · " + Math.round((end - start) / 86400000) + " days";
        }
        sinceEl.textContent = txt;
      }
    }
  }

  /* ---------- show ---------- */
  function showCake() {
    cake.hidden = false;
    cake.classList.add("is-in");
    makeConfetti(46);
    setTimeout(function () { makeConfetti(22); }, 1400);
    if (btn) btn.focus();
  }

  /* ---------- blow out ---------- */
  let blown = false;
  function blowOut() {
    if (blown) return;
    blown = true;
    cake.classList.add("is-blown");
    makeConfetti(40);
    if (btn) {
      const label = btn.querySelector("span");
      if (label) label.textContent = "🎉 Enter Our Anniversary";
      btn.classList.remove("btn--glow");
    }
    const hint = $(".cake__hint");
    if (hint) hint.textContent = "Waxaa dhammaad! Tag ENTER si aad u galiyo anniversary-ga 💗";
  }

  /* ---------- enter ---------- */
  function enterUniverse() {
    if (!blown) { blowOut(); return; }
    cake.classList.add("is-gone");
    setTimeout(function () {
      if (cake.parentNode) cake.parentNode.removeChild(cake);
      const start = $("#enterBtn");
      if (start) start.click();
    }, 700);
  }

  if (btn) btn.addEventListener("click", enterUniverse);

  /* ---------- listen for the gate ---------- */
  document.addEventListener("universe:unlocked", function (e) {
    if (e && e.preventDefault) e.preventDefault();
    showCake();
  });
})();
