/* ════════════════════════════════════════════════════════════
   faithudall.com — the swarm, and the small machinery.

   The name is not typed anywhere on the page. It's written by
   a few hundred paper scraps, each carrying its own slice of
   the real letterforms — so when they settle, the word is
   pixel-crisp type, not an approximation of it. Moving scraps
   trail a whisper of their accent; settled scraps are pure ink.
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
    if (mode) themeMetas.forEach((m) => (m.content = mode === "dark" ? "#211a12" : "#faf4e9"));
  }

  try {
    const saved = /[?&]dark/.test(location.search) ? "dark" : localStorage.getItem(THEME_KEY);
    if (saved) setTheme(saved);
  } catch (e) { /* private mode: theme just doesn't persist */ }

  /* ── the swarm ─────────────────────────────────────────── */

  const swarm = (() => {
    const WORD = "Faith";
    const canvas = document.getElementById("swarm");
    const ctx = canvas.getContext("2d");
    const slot = canvas.parentElement;

    let W = 0, H = 0, DPR = 1, tile = 8, CX = 0, CY = 0;
    let parts = [];
    let art = null;            // the word, rasterized once, black
    let tintInk = null;        // ink-coloured copy
    let tintAcc = [];          // coral / marigold / sage copies
    let intro0 = 0;            // when the current assembly began
    let running = false, visible = true, raf = 0;
    let bloom = 0, bloomTarget = 0;

    const css = (name) => getComputedStyle(root).getPropertyValue(name).trim();

    const mouse = { x: -9e3, y: -9e3, str: 0, on: false };

    function fontFor(px) { return `700 ${px}px "Bricolage Grotesque", "Avenir Next", "Segoe UI", sans-serif`; }

    /* the mark is brush-lettered artwork (alpha-only PNG); the
       colour comes from the tint pass, so themes still work.
       until it loads — or if it never does — type stands in. */
    const wordImg = new Image();
    let wordOk = true; // flips off if the image taints the canvas (file:// previews)
    wordImg.src = "images/word-faith.png";
    wordImg.decode().then(() => settle(), () => {});

    /* rasterize the mark once at device resolution */
    function buildArt() {
      const c = document.createElement("canvas");
      c.width = Math.max(2, W * DPR);
      c.height = Math.max(2, H * DPR);
      const g = c.getContext("2d");
      g.scale(DPR, DPR);
      // the mark fills only part of its box — the rest is margin
      // the swarm can swirl through without ever touching an edge
      if (wordOk && wordImg.complete && wordImg.naturalWidth > 0) {
        const s = Math.min((W * 0.62) / wordImg.naturalWidth, (H * 0.62) / wordImg.naturalHeight);
        const dw = wordImg.naturalWidth * s, dh = wordImg.naturalHeight * s;
        g.drawImage(wordImg, (W - dw) / 2, (H - dh) / 2, dw, dh);
        return c;
      }
      // fallback: set the word in type, centered by its real metrics
      g.font = fontFor(100);
      const m100 = g.measureText(WORD);
      const size = Math.min(H * 0.56, ((W * 0.6) / m100.width) * 100);
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
        tintAcc = [tint(css("--coral")), tint(css("--marigold")), tint(css("--sage"))];
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
      tintAcc = [tint(css("--coral")), tint(css("--marigold")), tint(css("--sage"))];

      const sample = document.createElement("canvas");
      sample.width = W; sample.height = H;
      const sg = sample.getContext("2d");
      sg.drawImage(art, 0, 0, W, H);
      let data;
      try {
        data = sg.getImageData(0, 0, W, H).data;
      } catch (err) {
        // the artwork tainted the canvas (file:// preview) — fall
        // back to type and re-run cleanly
        if (wordOk) { wordOk = false; settle(); }
        return;
      }

      tile = Math.max(4, Math.round(H / 36));
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

      // ~13% of scraps carry an accent (coral, marigold, or sage); the rest are ink.
      //
      // the assembly is a deterministic spiral, not a physics chase.
      // every scrap is a point on a circle around the word's centre;
      // it travels — eased in and out, zero velocity at both ends —
      // from its scattered starting angle/radius to the exact
      // angle/radius of its target, always turning the same way it
      // started turning. because start and end are both plotted in
      // polar terms around the same centre, the path is a clean
      // spiral that always, exactly, lands on time: no force to
      // integrate, no tail to wait out, nothing to snap at the finish.
      CX = W * 0.5; CY = H * 0.5;
      const maxR = H * 0.46; // scatter stays comfortably inside the canvas on every axis

      parts = targets.map((t, i) => {
        const tx = t.x, ty = t.y;
        const rT = Math.hypot(tx - CX, ty - CY);
        const aT = Math.atan2(ty - CY, tx - CX);

        // sqrt spacing gives an even *area* density across the
        // scatter disc, rather than clumping near its centre
        const r0 = maxR * Math.sqrt(0.1 + Math.random() * 0.9);
        const a0 = Math.random() * Math.PI * 2;

        // mostly one rotational direction — a coherent vortex, not
        // independent spins — with a little turning the other way
        const spinDir = i % 5 === 0 ? -1 : 1;
        let fwd = aT - a0;
        fwd = Math.atan2(Math.sin(fwd), Math.cos(fwd)); // shortest signed delta
        if (spinDir > 0 && fwd < 0) fwd += Math.PI * 2;
        if (spinDir < 0 && fwd > 0) fwd -= Math.PI * 2;
        // fwd alone is already the natural one-directional path to
        // the target — up to a full revolution, never more. (Adding
        // a further whole loop on top would let the two stack to
        // nearly two revolutions for an unlucky start angle — a
        // wild, inconsistent sweep, not an elegant one.)
        const totalTravel = fwd;

        const x0 = CX + Math.cos(a0) * r0, y0 = CY + Math.sin(a0) * r0;

        return {
          tx, ty, sx: tx * DPR, sy: ty * DPR,
          a0, r0, rDelta: rT - r0, totalTravel,
          x: x0, y: y0, px: x0, py: y0,
          vx: 0, vy: 0,
          dur: 1900 + Math.random() * 500,
          phase: Math.random() * 400, // staggers when each scrap finishes
          k: 0.05 + Math.random() * 0.035,   // settled-state hold, for cursor interplay
          damp: 0.82 + Math.random() * 0.05,
          max: (5 + Math.random() * 4) * (H / 260),
          acc: i % 23 === 0 ? 0 : i % 23 === 7 ? 1 : i % 23 === 15 ? 2 : -1,
          loose: 0,
        };
      });

      if (FAST) for (const p of parts) { p.x = p.tx; p.y = p.ty; p.px = p.x; p.py = p.y; }

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

      const ink = hex2rgb(css("--ink") || "#33291e");
      const accCols = [hex2rgb(css("--coral") || "#e15a3a"), hex2rgb(css("--marigold") || "#f0a63a"), hex2rgb(css("--sage") || "#7c9d69")];
      const fleeR = tile * 7;

      for (const p of parts) {
        p.px = p.x; p.py = p.y;
        const t = Math.min(1, Math.max(0, (now - intro0 - p.phase) / p.dur));

        if (t < 1) {
          // the spiral tween: position is computed directly from
          // the eased path, not integrated from a velocity — so it
          // is exactly on its target the instant t reaches 1
          const te = sstep(t);
          const rad = p.r0 + p.rDelta * te;
          const ang = p.a0 + p.totalTravel * te;
          p.x = CX + Math.cos(ang) * rad;
          p.y = CY + Math.sin(ang) * rad;
          p.vx = 0; p.vy = 0;
        } else {
          // settled: held at rest by a spring, so the cursor can
          // still nudge a scrap loose and let it drift back
          p.vx += (p.tx - p.x) * p.k;
          p.vy += (p.ty - p.y) * p.k;
          p.vx *= p.damp; p.vy *= p.damp;

          if (mouse.str > 0.01) {
            const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
            const d = Math.hypot(mdx, mdy);
            if (d < fleeR && d > 0.5) {
              const f = ((1 - d / fleeR) * 3.1 * mouse.str) / d;
              p.vx += mdx * f; p.vy += mdy * f;
              p.loose = 1;
            }
          }

          const sp = Math.hypot(p.vx, p.vy);
          if (sp > p.max) { p.vx *= p.max / sp; p.vy *= p.max / sp; }
          p.x += p.vx; p.y += p.vy;
          if (p.loose && sp < 0.35) p.loose = 0;
        }

        // belt-and-suspenders: nothing is ever allowed past the
        // canvas edge, whatever the path did to get there
        if (p.x < -tile) p.x = -tile; else if (p.x > W + tile) p.x = W + tile;
        if (p.y < -tile) p.y = -tile; else if (p.y > H + tile) p.y = H + tile;

        const dvx = p.x - p.px, dvy = p.y - p.py;
        const speed = Math.hypot(dvx, dvy);
        const still = t >= 1 && !p.loose &&
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
          // in flight the scraps stay axis-aligned — calmer, more
          // deliberate than confetti
          ctx.drawImage(tintInk, p.sx, p.sy, ts, ts, p.x, p.y, tile, tile);

          // fast scraps trail a whisper of their accent
          if (speed > 0.9) {
            const tt = Math.min(1, speed / p.max);
            const c = p.acc >= 0 ? accCols[p.acc] : accCols[0];
            const r = Math.round(ink[0] + (c[0] - ink[0]) * tt);
            const g = Math.round(ink[1] + (c[1] - ink[1]) * tt);
            const b = Math.round(ink[2] + (c[2] - ink[2]) * tt);
            ctx.strokeStyle = `rgba(${r},${g},${b},${0.35 * tt + 0.08})`;
            ctx.lineWidth = 1.2;
            ctx.lineCap = "round";
            ctx.beginPath();
            ctx.moveTo(p.x - dvx * 1.4 + tile / 2, p.y - dvy * 1.4 + tile / 2);
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
      document.fonts.load(`700 100px "Bricolage Grotesque"`).then(() => settle());
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
