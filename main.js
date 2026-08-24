/* ════════════════════════════════════════════════════════════
   faithudall.com — the swarm, and the small machinery.

   the name is not typed anywhere on the page. it's written by
   a few hundred paper scraps, each carrying its own slice of
   the real letterforms — so when they settle, the word is
   pixel-crisp type, not an approximation of it. moving scraps
   warm toward their crayon; settled scraps are pure ink.
   ════════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  const root = document.documentElement;
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FAST = /[?&]fast/.test(location.search); // dev: skip intros for screenshots
  if (FAST) {
    const s = document.createElement("style");
    s.textContent = ".hero{min-height:640px}";
    document.head.append(s);
  }

  /* ── theme ── the saved choice lands before the swarm ever
     reads a colour, so there is nothing to flash ── */

  const THEME_KEY = "faith-theme";
  const themeMetas = document.querySelectorAll('meta[name="theme-color"]');

  function setTheme(mode) {
    if (mode === "dark") root.dataset.theme = "dark";
    else delete root.dataset.theme;
    // once a theme is chosen explicitly, both metas agree
    if (mode) themeMetas.forEach((m) => (m.content = mode === "dark" ? "#1a1510" : "#f7f0e3"));
  }

  try {
    const saved = /[?&]dark/.test(location.search) ? "dark" : localStorage.getItem(THEME_KEY);
    if (saved) setTheme(saved);
  } catch (e) { /* private mode: theme just doesn't persist */ }

  /* ── the swarm ─────────────────────────────────────────── */

  const swarm = (() => {
    const WORD = "faith";
    const canvas = document.getElementById("swarm");
    const ctx = canvas.getContext("2d");
    const slot = canvas.parentElement;

    let W = 0, H = 0, DPR = 1, tile = 8;
    let parts = [];
    let art = null;            // the word, rasterized once, black
    let tintInk = null;        // ink-coloured copy
    let tintAcc = [];          // [crayon, leaf] copies
    let intro0 = 0;            // when the current assembly began
    let running = false, visible = true, raf = 0;
    let bloom = 0, bloomTarget = 0;

    const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

    const mouse = { x: -9e3, y: -9e3, str: 0, on: false };

    function fontFor(px) { return `italic 460 ${px}px Fraunces, Georgia, serif`; }

    /* rasterize the word once at device resolution, centered by
       its real metrics — not by textBaseline's guess */
    function buildArt() {
      const c = document.createElement("canvas");
      c.width = Math.max(2, W * DPR);
      c.height = Math.max(2, H * DPR);
      const g = c.getContext("2d");
      g.scale(DPR, DPR);
      g.font = fontFor(100);
      const m100 = g.measureText(WORD);
      const size = Math.min(H * 0.9, ((W * 0.96) / m100.width) * 100);
      g.font = fontFor(size);
      g.textAlign = "center";
      const m = g.measureText(WORD);
      const asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
      g.fillStyle = "#000";
      g.fillText(WORD, W / 2, H / 2 + (asc - desc) / 2);
      return c;
    }

    /* colour copies via source-in — theme changes rebuild these
       two canvases and touch nothing else */
    function tint(color) {
      const c = document.createElement("canvas");
      c.width = art.width; c.height = art.height;
      const g = c.getContext("2d");
      g.drawImage(art, 0, 0);
      g.globalCompositeOperation = "source-in";
      g.fillStyle = color;
      g.fillRect(0, 0, c.width, c.height);
      return c;
    }

    function retint() {
      if (!art) return;
      requestAnimationFrame(() => {   // wait for the theme vars to land
        tintInk = tint(css("--ink"));
        tintAcc = [tint(css("--crayon")), tint(css("--leaf"))];
        if (REDUCED) drawStatic();
      });
    }

    /* scan the word's alpha on a coarse grid; every solid cell
       becomes a scrap that knows both where it lives and which
       slice of the letterform it carries */
    function settle() {
      const r = slot.getBoundingClientRect();
      if (r.width < 8 || r.height < 8) { setTimeout(settle, 60); return; }
      DPR = Math.min(2, devicePixelRatio || 1);
      W = Math.round(r.width); H = Math.round(r.height);
      canvas.width = W * DPR; canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      art = buildArt();
      tintInk = tint(css("--ink"));
      tintAcc = [tint(css("--crayon")), tint(css("--leaf"))];

      const sample = document.createElement("canvas");
      sample.width = W; sample.height = H;
      const sg = sample.getContext("2d");
      sg.drawImage(art, 0, 0, W, H);
      const data = sg.getImageData(0, 0, W, H).data;

      tile = Math.max(5, Math.round(H / 26));
      const targets = [];
      for (let y = 0; y < H - tile; y += tile) {
        for (let x = 0; x < W - tile; x += tile) {
          let hit = false;
          for (let sy = 0; sy < tile && !hit; sy += 2)
            for (let sx = 0; sx < tile && !hit; sx += 2)
              if (data[((y + sy) * W + (x + sx)) * 4 + 3] > 40) hit = true;
          if (hit) targets.push({ x, y });
        }
      }

      // ~9% of scraps carry crayon, ~4% carry leaf; the rest are ink
      parts = targets.map((t, i) => ({
        tx: t.x, ty: t.y,
        sx: t.x * DPR, sy: t.y * DPR,
        // everyone arrives from below the fold, already moving up —
        // the one direction nothing on a page ever falls in from
        x: Math.random() * W,
        y: H + 30 + Math.random() * H * 0.8,
        vx: (Math.random() - 0.5) * 2,
        vy: -(2 + Math.random() * 5),
        k: 0.02 + Math.random() * 0.04,
        damp: 0.86 + Math.random() * 0.07,
        max: (9 + Math.random() * 9) * (H / 150),
        rot: (Math.random() - 0.5) * 1.4,
        rv: (Math.random() - 0.5) * 0.12,
        acc: i % 11 === 0 ? 0 : i % 23 === 0 ? 1 : -1,
        loose: 0,
      }));

      intro0 = FAST ? -1e7 : performance.now();
      if (REDUCED) { drawStatic(); return; }
      start();
    }

    function drawStatic() {
      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(tintInk, 0, 0, W, H);
    }

    const sstep = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));
    const hex2rgb = (h) => {
      const n = parseInt(h.slice(1), 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    };

    function frame(now) {
      raf = 0;
      if (!visible) { running = false; return; }

      ctx.clearRect(0, 0, W, H);

      // the field of influence eases in fast and drains away slow
      mouse.str += ((mouse.on ? 1 : 0) - mouse.str) * (mouse.on ? 0.35 : 0.12);
      bloom += (bloomTarget - bloom) * 0.08;

      const lock = sstep((now - intro0 - 950) / 700); // assembly guarantee
      const ink = hex2rgb(css("--ink") || "#34291d");
      const accCols = [hex2rgb(css("--crayon") || "#c2542f"), hex2rgb(css("--leaf") || "#647d57")];
      const fleeR = tile * 7;

      for (const p of parts) {
        // underdamped spring toward home
        p.vx += (p.tx - p.x) * p.k;
        p.vy += (p.ty - p.y) * p.k;
        p.vx *= p.damp; p.vy *= p.damp;

        // cursor is a flee field, never a teleport
        if (mouse.str > 0.01) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < fleeR && d > 0.5) {
            const f = ((1 - d / fleeR) * 3.1 * mouse.str) / d;
            p.vx += dx * f; p.vy += dy * f;
            p.loose = 1;
          }
        }

        const sp = Math.hypot(p.vx, p.vy);
        if (sp > p.max) { p.vx *= p.max / sp; p.vy *= p.max / sp; }

        p.x += p.vx; p.y += p.vy;
        p.rot += p.rv;

        // the intro lock pulls everyone home so the word resolves
        if (lock > 0 && !p.loose) {
          p.x += (p.tx - p.x) * lock * 0.3;
          p.y += (p.ty - p.y) * lock * 0.3;
          p.vx *= 1 - lock * 0.4; p.vy *= 1 - lock * 0.4;
          p.rot *= 1 - lock * 0.25; p.rv *= 1 - lock * 0.25;
        }
        if (p.loose && sp < 0.35) p.loose = 0;

        const speed = Math.hypot(p.vx, p.vy);
        const still = speed < p.max * 0.03 && Math.abs(p.rv) < 0.01 && !p.loose &&
                      Math.abs(p.x - p.tx) < 0.8 && Math.abs(p.y - p.ty) < 0.8;
        const ts = tile * DPR;

        if (still) {
          // settled scraps blit their slice axis-aligned: crisp type
          ctx.drawImage(tintInk, p.sx, p.sy, ts, ts, p.tx, p.ty, tile, tile);
          if (bloom > 0.02 && p.acc >= 0) {
            ctx.globalAlpha = bloom * 0.9;
            ctx.drawImage(tintAcc[p.acc], p.sx, p.sy, ts, ts, p.tx, p.ty, tile, tile);
            ctx.globalAlpha = 1;
          }
        } else {
          ctx.save();
          ctx.translate(p.x + tile / 2, p.y + tile / 2);
          ctx.rotate(p.rot);
          ctx.drawImage(tintInk, p.sx, p.sy, ts, ts, -tile / 2, -tile / 2, tile, tile);
          ctx.restore();

          // fast scraps bleed their crayon; settled scraps are ink
          if (speed > 0.7) {
            const t = Math.min(1, speed / p.max);
            const c = p.acc >= 0 ? accCols[p.acc] : accCols[0];
            const r = Math.round(ink[0] + (c[0] - ink[0]) * t);
            const g = Math.round(ink[1] + (c[1] - ink[1]) * t);
            const b = Math.round(ink[2] + (c[2] - ink[2]) * t);
            ctx.strokeStyle = `rgba(${r},${g},${b},${0.5 * t + 0.15})`;
            ctx.lineWidth = 1.6;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(p.x - p.vx * 1.4 + tile / 2, p.y - p.vy * 1.4 + tile / 2);
            ctx.lineTo(p.x + tile / 2, p.y + tile / 2);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(frame);
      running = true;
    }

    function start() {
      if (!running && !raf && !REDUCED) raf = requestAnimationFrame(frame);
    }

    /* pointer — relative to the canvas, active only near it */
    addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.on =
        mouse.x > -40 && mouse.x < r.width + 40 &&
        mouse.y > -40 && mouse.y < r.height + 40;
      if (mouse.on) start();
    }, { passive: true });
    addEventListener("pointerleave", () => (mouse.on = false), { passive: true });

    /* warming: aiming at "say hello" blushes the word crayon */
    document.querySelectorAll("[data-warm]").forEach((el) => {
      el.addEventListener("pointerenter", () => { bloomTarget = 1; start(); });
      el.addEventListener("pointerleave", () => { bloomTarget = 0; });
    });

    /* the loop idles at zero cost offscreen */
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    }).observe(canvas);

    let rT;
    addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(settle, 120); });

    /* rasterize with the real Fraunces, not the fallback */
    if (document.fonts && document.fonts.ready) {
      document.fonts.load(`italic 460 100px Fraunces`).then(() => settle());
      document.fonts.ready.then(() => settle());
    }
    settle();

    return { retint };
  })();

  document.getElementById("theme-flip").addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(next);
    swarm.retint();
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
  });

  /* ── reveals: sections defocus and sink in, staggered ──── */

  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".hero, .section").forEach((s) => {
    if (FAST) { s.classList.add("in"); s.querySelectorAll(".t-fx").forEach((el) => (el.style.transition = "none")); }
    else io.observe(s);
  });

  /* ── the rings around the portrait are wound by the scrollbar ── */

  const arcs = [
    [document.querySelector(".arc--1"), 0.05],
    [document.querySelector(".arc--2"), -0.032],
    [document.querySelector(".arc--3"), 0.021],
  ];
  let arcRaf = 0;
  addEventListener("scroll", () => {
    if (arcRaf || REDUCED) return;
    arcRaf = requestAnimationFrame(() => {
      arcRaf = 0;
      const y = scrollY;
      for (const [el, f] of arcs) if (el) el.style.transform = `rotate(${y * f}deg)`;
    });
  }, { passive: true });

  document.getElementById("year").textContent = new Date().getFullYear();
})();
