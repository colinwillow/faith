/* ════════════════════════════════════════════════════════════
   faithudall.com — the quiet machinery.

   The showpiece is the apple: a wireframe apple spinning above
   Faith's open palm, ringed by two orbits carrying little beads
   at their own tilts and speeds — drawn by hand onto a canvas,
   no 3D library. It spins up a little when your cursor comes
   near. Everything else is small — a progress hairline, letters
   that arrive one by one, a slow parallax, and a theme that
   changes as a circle sweeping out from the half-moon toggle.
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

  /* ── the apple ──────────────────────────────────────────
     a lathe wireframe spun from an apple profile, projected by
     hand: meridians and parallels fade with depth, a stem and a
     terracotta leaf ride the spin, and two tilted orbit rings
     carry beads around it. It hovers, bobs, and casts a soft
     little shadow toward her palm. */

  const apple = (() => {
    const canvas = document.getElementById("apple");
    if (!canvas) return { redraw() {} };
    const ctx = canvas.getContext("2d");

    let S = 0, DPR = 1, CX = 0, CY = 0, R = 0;
    let raf = 0, visible = true, lastT = 0;
    let theta = 0.7, bobT = 0, speed = 1, speedTarget = 1;

    const css = (n) => getComputedStyle(root).getPropertyValue(n).trim();
    const INK = "42, 33, 24"; // the band is tan in every theme

    // apple silhouette: (y, radius) anchors from bottom to top —
    // squat, wide-shouldered, and doubling back at the top so the
    // stem sits in a real dimple — resampled with Catmull-Rom.
    // y is pre-squashed: apples are wider than they are tall.
    const SQUASH = 0.78;
    const ANCHORS = [
      [-0.92, 0.30], [-0.80, 0.62], [-0.45, 0.92], [-0.05, 1.02],
      [0.35, 0.99], [0.66, 0.84], [0.88, 0.52], [0.94, 0.26], [0.80, 0.10],
    ].map(([y, r]) => [y * SQUASH, r]);
    const PROFILE = [];
    (function resample() {
      const P = ANCHORS;
      const cr = (p0, p1, p2, p3, t) => {
        const t2 = t * t, t3 = t2 * t;
        return 0.5 * ((2 * p1) + (-p0 + p2) * t +
          (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
          (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
      };
      for (let i = 0; i < P.length - 1; i++) {
        const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
        for (let s = 0; s < 4; s++) {
          const t = s / 4;
          PROFILE.push([cr(p0[0], p1[0], p2[0], p3[0], t), cr(p0[1], p1[1], p2[1], p3[1], t)]);
        }
      }
      PROFILE.push(P[P.length - 1].slice());
    })();

    function size() {
      const r = canvas.getBoundingClientRect();
      if (r.width < 8) return false;
      DPR = Math.min(2, devicePixelRatio || 1);
      S = Math.round(r.width);
      canvas.width = S * DPR; canvas.height = Math.round(r.height) * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      CX = S / 2; CY = r.height * 0.47;
      R = S * 0.215;
      return true;
    }

    // rotate around Y by a, tilt around X, orthographic project
    function proj(x, y, z, a, tilt, cy) {
      const xr = x * Math.cos(a) + z * Math.sin(a);
      const zr = -x * Math.sin(a) + z * Math.cos(a);
      const yr = y * Math.cos(tilt) - zr * Math.sin(tilt);
      const zd = y * Math.sin(tilt) + zr * Math.cos(tilt);
      return [CX + xr * R, cy - yr * R, zd];
    }

    function seg(p, q, base, width, color) {
      const a = base * (0.32 + 0.68 * Math.max(0, Math.min(1, ((p[2] + q[2]) / 2 + 1.1) / 2.2)));
      ctx.strokeStyle = `rgba(${color}, ${a.toFixed(3)})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(p[0], p[1]);
      ctx.lineTo(q[0], q[1]);
      ctx.stroke();
    }

    function draw(now) {
      const h = canvas.height / DPR;
      ctx.clearRect(0, 0, S, h);
      const bob = Math.sin(bobT * 0.8) * 4;
      const cy = CY + bob;
      const tilt = -0.42 + 0.05 * Math.sin(bobT * 0.5);
      const accent = css("--accent") || "#a8674c";
      const ACC = accent.startsWith("#")
        ? `${parseInt(accent.slice(1, 3), 16)}, ${parseInt(accent.slice(3, 5), 16)}, ${parseInt(accent.slice(5, 7), 16)}`
        : "168, 103, 76";

      // soft shadow falling toward her palm
      const sg = ctx.createRadialGradient(CX, h * 0.9, 2, CX, h * 0.9, R * 1.1);
      sg.addColorStop(0, `rgba(${INK}, ${0.16 - bob * 0.008})`);
      sg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.save();
      ctx.translate(CX, h * 0.9);
      ctx.scale(1, 0.22);
      ctx.translate(-CX, -h * 0.9);
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, S, h * 2);
      ctx.restore();

      // orbit rings with beads — different tilts, speeds, directions
      const rings = [
        { rr: 1.75, tilt: 0.5, roll: 0.9, sp: 0.6, dir: 1, color: ACC, alpha: 0.5 },
        { rr: 2.05, tilt: -0.35, roll: -0.5, sp: 0.37, dir: -1, color: INK, alpha: 0.34 },
      ];
      for (const g of rings) {
        const pts = [];
        for (let i = 0; i <= 60; i++) {
          const a = (i / 60) * Math.PI * 2;
          let x = Math.cos(a) * g.rr, z = Math.sin(a) * g.rr, y = 0;
          let y2 = y * Math.cos(g.roll) - x * Math.sin(g.roll) * 0.35;
          pts.push(proj(x, y2, z, theta * g.sp * g.dir + g.dir, g.tilt, cy));
        }
        for (let i = 0; i < 60; i++) seg(pts[i], pts[i + 1], g.alpha, 1, g.color);
        // the bead
        const ba = bobT * g.sp * g.dir * 1.6 + g.dir * 2;
        let bx = Math.cos(ba) * g.rr, bz = Math.sin(ba) * g.rr;
        const bp = proj(bx, -bx * Math.sin(g.roll) * 0.35, bz, theta * g.sp * g.dir + g.dir, g.tilt, cy);
        const bA = 0.35 + 0.55 * Math.max(0, Math.min(1, (bp[2] + 1.1) / 2.2));
        ctx.fillStyle = `rgba(${g.color}, ${bA.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(bp[0], bp[1], 2.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // meridians
      const M = 10;
      for (let m = 0; m < M; m++) {
        const phi = (m / M) * Math.PI * 2;
        let prev = null;
        for (const [y, r] of PROFILE) {
          const p = proj(Math.cos(phi) * r, y, Math.sin(phi) * r, theta, tilt, cy);
          if (prev) seg(prev, p, 0.6, 1, INK);
          prev = p;
        }
      }
      // parallels
      for (const t of [0.16, 0.38, 0.6, 0.8]) {
        const idx = Math.min(PROFILE.length - 1, Math.round(t * PROFILE.length));
        const [y, r] = PROFILE[idx];
        let prev = null;
        for (let i = 0; i <= 48; i++) {
          const a = (i / 48) * Math.PI * 2;
          const p = proj(Math.cos(a) * r, y, Math.sin(a) * r, theta, tilt, cy);
          if (prev) seg(prev, p, 0.42, 1, INK);
          prev = p;
        }
      }

      // stem — rides the spin, rising out of the dimple
      const stem = [[0, 0.62], [0.02, 0.86], [0.09, 1.04], [0.19, 1.16]];
      let prev = null;
      for (const [x, y] of stem) {
        const p = proj(x, y, 0, theta, tilt, cy);
        if (prev) seg(prev, p, 0.9, 2, INK);
        prev = p;
      }
      // leaf — a small terracotta stroke off the stem tip
      const tip = proj(0.19, 1.16, 0, theta, tilt, cy);
      const end = proj(0.85, 1.44, 0.12, theta, tilt, cy);
      const midA = proj(0.46, 1.52, 0.06, theta, tilt, cy);
      const midB = proj(0.56, 1.1, 0.06, theta, tilt, cy);
      ctx.strokeStyle = `rgba(${ACC}, 0.8)`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(tip[0], tip[1]);
      ctx.quadraticCurveTo(midA[0], midA[1], end[0], end[1]);
      ctx.quadraticCurveTo(midB[0], midB[1], tip[0], tip[1]);
      ctx.stroke();
    }

    function frame(now) {
      raf = 0;
      if (!visible) return;
      const dt = Math.min(50, now - (lastT || now)) / 1000;
      lastT = now;
      speed += (speedTarget - speed) * 0.06;
      theta += 0.4 * speed * dt;
      bobT += dt * speed;
      draw(now);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (!raf && visible && !REDUCED && !FAST) { lastT = 0; raf = requestAnimationFrame(frame); }
    }

    function boot() {
      if (!size()) { setTimeout(boot, 100); return; }
      if (REDUCED || FAST) { draw(0); return; }
      start();
    }

    // curiosity: the apple spins up a touch when the cursor is near
    addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      speedTarget = d < 260 ? 2.4 : 1;
    }, { passive: true });

    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    }).observe(canvas);

    let rT;
    addEventListener("resize", () => {
      clearTimeout(rT);
      rT = setTimeout(() => { if (size() && (REDUCED || FAST)) draw(0); }, 150);
    });

    boot();

    return { redraw() { if (REDUCED || FAST) draw(0); } };
  })();

  /* ── theme flip: a circle sweeping out from the toggle ──── */

  const flip = document.getElementById("theme-flip");
  flip.addEventListener("click", (e) => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const change = () => {
      setTheme(next);
      apple.redraw();
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
