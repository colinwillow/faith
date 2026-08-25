/* ════════════════════════════════════════════════════════════
   faithudall.com — the quiet machinery.

   The showpiece is the thread: one thin line wandering the hero
   like a pencil that never lifts, curious about your cursor.
   Everything else is small — a progress hairline, letters that
   arrive one by one, a slow parallax, and a theme that changes
   as a circle sweeping out from the little half-moon you clicked.
   ════════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  const root = document.documentElement;
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FAST = /[?&]fast/.test(location.search); // dev: settle everything instantly for screenshots
  if (FAST) root.classList.add("fastfx");

  /* ── theme ── remembered per visitor ── */

  const THEME_KEY = "faith-theme";
  const themeMetas = document.querySelectorAll('meta[name="theme-color"]');

  function setTheme(mode) {
    if (mode === "dark") root.dataset.theme = "dark";
    else delete root.dataset.theme;
    if (mode) themeMetas.forEach((m) => (m.content = mode === "dark" ? "#15120f" : "#faf6f3"));
  }

  // suppress transitions while the saved theme is applied, so a
  // returning dark-theme visitor never sees a light-to-dark sweep
  root.classList.add("no-transition");
  try {
    const saved = /[?&]dark/.test(location.search) ? "dark" : localStorage.getItem(THEME_KEY);
    if (saved) setTheme(saved);
  } catch (e) { /* private mode: theme just doesn't persist */ }
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("no-transition")));

  /* ── the thread ─────────────────────────────────────────── */

  const thread = (() => {
    const canvas = document.getElementById("thread");
    if (!canvas) return { retint() {} };
    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;

    let W = 0, H = 0, DPR = 1;
    let visible = true, raf = 0, lastT = 0;
    const mouse = { x: -9e3, y: -9e3, str: 0, on: false };

    const css = (n) => getComputedStyle(root).getPropertyValue(n).trim();
    const rgb = (hex) => {
      const n = parseInt(hex.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };

    // two wanderers: the accent leads, a fainter ink line keeps
    // it company at its own pace. LEN points ≈ a long silk ribbon.
    const LEN = 560, BUCKETS = 20;
    const makeLine = (seed, speed, alpha, colorVar) => ({
      seed, speed, alpha, colorVar,
      x: 0, y: 0, h: seed * 2.4,
      t: seed * 1000,
      pts: null, head: 0, count: 0,
    });
    const lines = [
      makeLine(1.7, 2.1, 0.5, "--accent"),
      makeLine(4.1, 1.55, 0.15, "--ink"),
    ];

    const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

    function size() {
      const r = hero.getBoundingClientRect();
      if (r.width < 8) return false;
      DPR = Math.min(2, devicePixelRatio || 1);
      W = Math.round(r.width); H = Math.round(r.height);
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ctx.lineCap = "round";
      for (const L of lines) {
        L.pts = new Float32Array(LEN * 2);
        L.head = 0; L.count = 0;
        L.x = W * (0.2 + 0.6 * ((L.seed * 7.3) % 1));
        L.y = H * (0.25 + 0.5 * ((L.seed * 3.1) % 1));
      }
      return true;
    }

    /* one step of wandering: a slowly-breathing curvature, a pull
       back from the edges, a polite swerve around the middle
       (where the wordmark lives), and a soft lean toward the
       cursor when it's near — curiosity, not pursuit */
    function step(L, dtn) {
      L.t += dtn;
      let turn =
        0.026 * Math.sin(L.t * 0.0082 + L.seed) +
        0.017 * Math.sin(L.t * 0.0029 + L.seed * 2.2);

      const m = 36;
      if (L.x < m || L.x > W - m || L.y < m || L.y > H - m) {
        turn += wrap(Math.atan2(H / 2 - L.y, W / 2 - L.x) - L.h) * 0.06;
      }

      // the clear zone is an ellipse over the text block — left of
      // centre on the wide layout, centred when the hero stacks —
      // so the line frames the words instead of crossing them
      const tx = W > 700 ? W * 0.33 : W * 0.5;
      const cdx = L.x - tx, cdy = L.y - H * 0.44;
      const nd = Math.hypot(cdx / (W * 0.36), cdy / (H * 0.34));
      if (nd < 1 && nd > 0.01) {
        turn += wrap(Math.atan2(cdy, cdx) - L.h) * 0.05 * (1 - nd);
      }

      if (mouse.str > 0.01) {
        const d = Math.hypot(mouse.x - L.x, mouse.y - L.y);
        if (d < 300 && d > 8) {
          turn += wrap(Math.atan2(mouse.y - L.y, mouse.x - L.x) - L.h) *
                  0.035 * (1 - d / 300) * mouse.str;
        }
      }

      L.h += turn * dtn;
      L.x += Math.cos(L.h) * L.speed * dtn;
      L.y += Math.sin(L.h) * L.speed * dtn;
      L.x = Math.max(2, Math.min(W - 2, L.x));
      L.y = Math.max(2, Math.min(H - 2, L.y));

      L.pts[L.head * 2] = L.x;
      L.pts[L.head * 2 + 1] = L.y;
      L.head = (L.head + 1) % LEN;
      if (L.count < LEN) L.count++;
    }

    /* the ribbon fades along its own length — drawn in a few
       alpha buckets so it stays cheap */
    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = 1.1;
      for (const L of lines) {
        if (L.count < 2) continue;
        const [r, g, b] = rgb(css(L.colorVar) || "#a8674c");
        const per = Math.ceil(L.count / BUCKETS);
        for (let bk = 0; bk < BUCKETS; bk++) {
          const a = Math.pow((bk + 1) / BUCKETS, 1.7) * L.alpha;
          ctx.strokeStyle = `rgba(${r},${g},${b},${a})`;
          ctx.beginPath();
          let started = false;
          const from = bk * per, to = Math.min(L.count - 1, (bk + 1) * per);
          for (let i = from; i <= to; i++) {
            const idx = ((L.head - L.count + i) % LEN + LEN) % LEN;
            const x = L.pts[idx * 2], y = L.pts[idx * 2 + 1];
            if (!started) { ctx.moveTo(x, y); started = true; }
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }
    }

    function frame(now) {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(40, now - (lastT || now));
      lastT = now;
      const dtn = Math.max(0.5, Math.min(2.5, dt / 16.7));
      mouse.str += ((mouse.on ? 1 : 0) - mouse.str) * (mouse.on ? 0.25 : 0.06);
      for (const L of lines) step(L, dtn);
      draw();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (!raf && visible && !REDUCED && !FAST) { lastT = 0; raf = requestAnimationFrame(frame); }
    }

    // static mode: pre-wander a while, draw once
    function drawStatic() {
      for (const L of lines) for (let i = 0; i < 900; i++) step(L, 1);
      draw();
    }

    function boot() {
      if (!size()) { setTimeout(boot, 80); return; }
      if (REDUCED || FAST) drawStatic();
      else start();
    }

    addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.on = mouse.y > -60 && mouse.y < r.height + 60;
    }, { passive: true });
    addEventListener("pointerleave", () => (mouse.on = false), { passive: true });

    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    }).observe(canvas);

    let rT;
    addEventListener("resize", () => {
      clearTimeout(rT);
      rT = setTimeout(() => { if (size() && (REDUCED || FAST)) drawStatic(); }, 150);
    });

    boot();

    return { retint() { if (REDUCED || FAST) draw(); } };
  })();

  /* ── theme flip: a circle sweeping out from the toggle ──── */

  const flip = document.getElementById("theme-flip");
  flip.addEventListener("click", (e) => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const change = () => {
      setTheme(next);
      thread.retint();
      try { localStorage.setItem(THEME_KEY, next); } catch (err) {}
    };
    if (REDUCED || !document.startViewTransition) { change(); return; }

    // the snapshots do the visuals; mute the CSS transitions so
    // the two layers don't both animate
    root.classList.add("no-transition");
    const r = flip.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const vt = document.startViewTransition(change);
    vt.ready.then(() => {
      const radius = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy));
      root.animate(
        { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${radius}px at ${cx}px ${cy}px)`] },
        { duration: 650, easing: "cubic-bezier(0.22, 0.61, 0.36, 1)", pseudoElement: "::view-transition-new(root)" }
      );
    }).catch(() => {});
    vt.finished.finally(() => {
      requestAnimationFrame(() => root.classList.remove("no-transition"));
    });
  });

  /* ── reveals: a quiet fade and rise, staggered ──────────── */

  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".hero, .section").forEach((s) => {
    if (FAST || REDUCED) {
      s.classList.add("in");
      s.querySelectorAll(".t-fx").forEach((el) => (el.style.transition = "none"));
    } else {
      io.observe(s);
    }
  });

  /* ── the eyebrow arrives one letter at a time ───────────── */

  const eyebrow = document.querySelector(".hero__eyebrow");
  if (eyebrow && !FAST && !REDUCED) {
    const text = eyebrow.textContent;
    eyebrow.setAttribute("aria-label", text);
    eyebrow.textContent = "";
    [...text].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "ltr";
      s.style.setProperty("--l", i);
      s.setAttribute("aria-hidden", "true");
      s.textContent = ch;
      eyebrow.appendChild(s);
    });
  }

  /* ── scroll: progress hairline + a slow parallax ────────── */

  const progress = document.querySelector(".progress");
  const plxImgs = REDUCED ? [] : [...document.querySelectorAll(".tile img")];
  let sRaf = 0;
  function onScroll() {
    if (sRaf) return;
    sRaf = requestAnimationFrame(() => {
      sRaf = 0;
      const max = document.documentElement.scrollHeight - innerHeight;
      if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
      for (const img of plxImgs) {
        const r = img.parentElement.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) continue;
        const c = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        img.style.setProperty("--p", `${(-c * 14).toFixed(1)}px`);
      }
    });
  }
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  document.getElementById("year").textContent = new Date().getFullYear();
})();
