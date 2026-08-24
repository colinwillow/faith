/* ════════════════════════════════════════════════════════════
   faithudall.com — theme toggle and scroll reveals.
   ════════════════════════════════════════════════════════════ */

(() => {
  "use strict";

  const root = document.documentElement;
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FAST = /[?&]fast/.test(location.search); // dev: skip intros for screenshots

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
  // on load — only an intentional click through the toggle animates
  root.classList.add("no-transition");
  try {
    const saved = /[?&]dark/.test(location.search) ? "dark" : localStorage.getItem(THEME_KEY);
    if (saved) setTheme(saved);
  } catch (e) { /* private mode: theme just doesn't persist */ }
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("no-transition")));

  document.getElementById("theme-flip").addEventListener("click", () => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
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

  document.getElementById("year").textContent = new Date().getFullYear();
})();
