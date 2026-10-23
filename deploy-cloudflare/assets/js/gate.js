/* =========================================================
   🔐 SECRET GATE — password + secret questions
   Waad ka beddeshi karo: assets/js/data.js -> UNIVERSE.gate
   ========================================================= */
(function () {
  "use strict";

  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  const DEFAULTS = {
    passwordHash: "64cf6a0478bf5b41d60224c6e7b3b404743d3b444e6b588b2b84dbe2229181f6",
    questions: [
      { icon: "❤️", question: "What is my name?", options: ["Nawaal", "Ayaan", "Hani"], answer: 0 },
      { icon: "🌹", question: "What is the most special thing in our relationship?", options: ["Our memories", "Our love ❤️", "Our conversations"], answer: 1 },
      { icon: "💋", question: "Who loves you the most?", options: ["Your friends", "Someone else", "Your Nawaal ❤️"], answer: 2 },
      { icon: "🫶", question: "What is my favorite name for you?", options: ["My King 👑", "My Baby ❤️", "My Everything 💍"], answer: 2 }
    ]
  };

  const CFG = (typeof UNIVERSE !== "undefined" && UNIVERSE.gate) ? UNIVERSE.gate : DEFAULTS;
  const PASSWORD_HASH = String(CFG.passwordHash || DEFAULTS.passwordHash).trim().toLowerCase();
  const QUESTIONS = (CFG.questions && CFG.questions.length) ? CFG.questions : DEFAULTS.questions;

  async function sha256(text) {
    if (!window.crypto || !window.crypto.subtle) {
      throw new Error("This gate needs HTTPS (secure connection).");
    }
    const buf = await window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, "0"); }).join("");
  }

  const gate = $("#gate");
  if (!gate) return;

  const passScreen = $("#gatePass");
  const quizScreen = $("#gateQuiz");
  const doneScreen = $("#gateDone");
  const card = $(".gate__card", passScreen);
  const form = $("#gateForm");
  const input = $("#gatePassInput");
  const passMsg = $("#gateMsg");
  const quizKicker = $("#quizKicker");
  const quizQuestion = $("#quizQuestion");
  const quizOptions = $("#quizOptions");
  const quizMsg = $("#quizMsg");
  const quizBar = $("#quizBar");
  const enterBtn = $("#gateEnter");

  const HEARTS = ["💗", "💕", "❤️", "💖", "💘", "✨", "🌸", "⭐"];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- tiny heart animation ---------- */
  function miniBurst(count, originEl) {
    if (reduceMotion) return;
    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    if (originEl && originEl.getBoundingClientRect) {
      const r = originEl.getBoundingClientRect();
      cx = r.left + r.width / 2;
      cy = r.top + r.height / 2;
    }
    for (let i = 0; i < count; i++) {
      const el = document.createElement("span");
      el.className = "fx";
      el.textContent = HEARTS[(Math.random() * HEARTS.length) | 0];
      el.style.left = (cx + (Math.random() * 130 - 65)) + "px";
      el.style.top = (cy + (Math.random() * 90 - 45)) + "px";
      el.style.setProperty("--dx", (Math.random() * 170 - 85) + "px");
      el.style.setProperty("--rot", (Math.random() * 420 - 210) + "deg");
      el.style.animationDuration = (2.6 + Math.random() * 2.2) + "s";
      el.style.animationDelay = (Math.random() * 0.4) + "s";
      document.body.appendChild(el);
      (function (node) { setTimeout(function () { node.remove(); }, 5600); })(el);
    }
  }

  /* ---------- screens ---------- */
  function show(screen) {
    $$(".gate__screen", gate).forEach(function (s) { s.classList.remove("is-active"); });
    screen.classList.add("is-active");
    window.scrollTo(0, 0);
  }

  function shake(el) {
    if (!el) return;
    el.classList.remove("is-shake");
    void el.offsetWidth;
    el.classList.add("is-shake");
  }

  /* ---------- step 1: password ---------- */
  function failPassword(text) {
    passMsg.textContent = text;
    passMsg.classList.remove("is-ok");
    input.classList.add("is-bad");
    shake(card);
    if (input.select) input.select();
  }

  async function checkPassword() {
    const value = String(input.value || "").trim().toLowerCase();
    if (!value) { failPassword("Write the secret word first, my love dY'"); return; }
    let ok = false;
    try { ok = (await sha256(value)) === PASSWORD_HASH; }
    catch (err) { failPassword(err.message || "Could not check the password."); return; }
    if (ok) {
      input.classList.remove("is-bad");
      input.classList.add("is-good");
      input.disabled = true;
      passMsg.textContent = "Correct, my love ❤️ Opening our universe…";
      passMsg.classList.add("is-ok");
      miniBurst(12, input);
      setTimeout(function () {
        show(quizScreen);
        startQuiz();
      }, 700);
    } else {
      failPassword("Oops, my love! Try again. 💕");
    }
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      checkPassword();
    });
  }

  /* ---------- step 2: questions ---------- */
  let qIndex = 0;

  function startQuiz() {
    qIndex = 0;
    if (quizBar) quizBar.style.width = "0%";
    renderQuestion();
  }

  function renderQuestion() {
    const q = QUESTIONS[qIndex];
    if (!q) { show(doneScreen); return; }

    quizKicker.textContent = "Question " + (qIndex + 1) + " " + (q.icon || "❤️");
    quizQuestion.textContent = q.question;
    quizMsg.textContent = "";
    quizMsg.classList.remove("is-ok");
    quizOptions.innerHTML = "";

    q.options.forEach(function (opt, i) {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "gate__opt";
      b.textContent = String.fromCharCode(65 + i) + ". " + opt;
      b.addEventListener("click", function () { choose(i, b, q); });
      quizOptions.appendChild(b);
    });

    if (quizBar) quizBar.style.width = Math.round((qIndex / QUESTIONS.length) * 100) + "%";
  }

  function choose(i, btn, q) {
    if (i === q.answer) {
      btn.classList.add("is-right");
      $$(".gate__opt", quizOptions).forEach(function (b) { b.disabled = true; });
      quizMsg.textContent = "Correct, my love! You know us so well. 💖";
      quizMsg.classList.add("is-ok");
      miniBurst(8, btn);
      if (quizBar) quizBar.style.width = Math.round(((qIndex + 1) / QUESTIONS.length) * 100) + "%";

      qIndex++;
      setTimeout(function () {
        if (qIndex >= QUESTIONS.length) {
          show(doneScreen);
          miniBurst(28);
        } else {
          renderQuestion();
        }
      }, 1200);
    } else {
      btn.classList.add("is-wrong");
      btn.disabled = true;
      quizMsg.textContent = "Not quite, my love 💕 Try again.";
      quizMsg.classList.remove("is-ok");
      miniBurst(3, btn);
      setTimeout(function () {
        btn.classList.remove("is-wrong");
        btn.disabled = false;
      }, 750);
    }
  }

  /* ---------- step 3: enter the universe ---------- */
  function enterUniverse() {
    const loader = $("#loader");
    gate.classList.add("is-gone");
    if (loader) loader.style.display = "none";
    document.body.classList.remove("is-locked");
    window.scrollTo(0, 0);
    setTimeout(function () { if (gate.parentNode) gate.parentNode.removeChild(gate); }, 900);

    const event = new CustomEvent("universe:unlocked", { cancelable: true });
    document.dispatchEvent(event);
    if (!event.defaultPrevented) {
      const start = $("#enterBtn");
      if (start) setTimeout(function () { start.click(); }, 150);
    }
  }

  if (enterBtn) enterBtn.addEventListener("click", enterUniverse);

  /* ---------- start ---------- */
  show(passScreen);
  if (input) setTimeout(function () { try { input.focus(); } catch (e) {} }, 300);
})();
