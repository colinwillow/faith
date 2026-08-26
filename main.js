/* ════════════════════════════════════════════════════════════
   faithudall.com — the quiet machinery.

   In the hero: a faint dot-grid plane breathes with a slow sine
   swell (the field), and the dots in the wordmark's letterforms
   pulse terracotta. The 3D apple lives in apple3d.js. Everything
   else is small — a progress hairline, letters that arrive one
   by one, a slow parallax, and a theme that changes as a circle
   sweeping out from the half-moon toggle.
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

  /* ── the field ──────────────────────────────────────────
     a grid of small squares behind the hero, each lifted and
     brightened by a slow layered sine swell — a plane breathing,
     drawn faint enough to read as texture, not content. */

  const field = (() => {
    const canvas = document.getElementById("field");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const hero = canvas.parentElement;

    let W = 0, H = 0, DPR = 1;
    let raf = 0, visible = true, lastT = 0, t = 0;
    const SP = 34; // grid spacing

    function size() {
      const r = hero.getBoundingClientRect();
      if (r.width < 8) return false;
      DPR = Math.min(2, devicePixelRatio || 1);
      W = Math.round(r.width); H = Math.round(r.height);
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      return true;
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (let gy = 0; gy * SP < H + SP; gy++) {
        for (let gx = 0; gx * SP < W + SP; gx++) {
          const x0 = gx * SP + (gy % 2) * (SP / 2); // offset rows: a woven grid
          const y0 = gy * SP;
          // the swell: two incommensurate waves and a slow diagonal
          const z =
            Math.sin(x0 * 0.011 + t * 0.5) * Math.cos(y0 * 0.009 - t * 0.34) +
            0.5 * Math.sin((x0 + y0) * 0.006 + t * 0.21);
          const n = (z + 1.5) / 3; // 0..1
          const x = x0 + z * 2.2;
          const y = y0 + z * 5.5;
          const s = 1.2 + n * 1.1;
          const accent = (gx * 7 + gy * 13) % 29 === 0;
          const a = 0.055 + n * (accent ? 0.16 : 0.115);
          ctx.fillStyle = accent
            ? `rgba(168, 103, 76, ${a.toFixed(3)})`
            : `rgba(90, 66, 42, ${a.toFixed(3)})`;
          ctx.fillRect(x, y, s, s);
        }
      }
    }

    function frame(now) {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(50, now - (lastT || now)) / 1000;
      lastT = now;
      t += dt * 0.55;
      draw();
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (!raf && visible && !REDUCED && !FAST) { lastT = 0; raf = requestAnimationFrame(frame); }
    }

    function boot() {
      if (!size()) { setTimeout(boot, 100); return; }
      t = 2.4;
      if (REDUCED || FAST) { draw(); return; }
      start();
    }

    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    }).observe(canvas);

    let rT;
    addEventListener("resize", () => {
      clearTimeout(rT);
      rT = setTimeout(() => { if (size() && (REDUCED || FAST)) draw(); }, 150);
    });

    boot();
  })();

  /* ── theme flip: a circle sweeping out from the toggle ──── */

  const flip = document.getElementById("theme-flip");
  flip.addEventListener("click", (e) => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const change = () => {
      setTheme(next);
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
