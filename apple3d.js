/* ════════════════════════════════════════════════════════════
   The apple — a small glossy 3D apple turning above Faith's
   open palm. Lathe-built in code (no model file), lit like the
   studio, red with a proper stem dimple, stem, and leaf. It
   spins up a little when the cursor comes near, renders a single
   frame under reduced motion, and sleeps offscreen.
   ════════════════════════════════════════════════════════════ */

import * as THREE from "three";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

const canvas = document.getElementById("apple");
if (canvas) {
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const FAST = /[?&]fast/.test(location.search);
  const STATIC = REDUCED || FAST;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  // the render buffer tracks the CSS box, so desktop and mobile
  // each get exactly the resolution they display at
  function resize() {
    const w = canvas.clientWidth || 76;
    const h = canvas.clientHeight || 76;
    renderer.setSize(w, h, false);
  }
  resize();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
  camera.position.set(0, 0.85, 4.4);
  camera.lookAt(0, 0.02, 0);

  // soft neutral room reflections make the clearcoat read as glossy
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  if ("environmentIntensity" in scene) scene.environmentIntensity = 0.55;

  scene.add(new THREE.AmbientLight(0xfff2e2, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(2.5, 3.5, 2.5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe6cc, 0.55);
  fill.position.set(-2.5, 1, -1.5);
  scene.add(fill);

  const group = new THREE.Group();
  scene.add(group);

  // the apple body: a lathe profile from bottom centre, out around
  // the cheek, and back into the stem dimple
  const P = [
    [0.0, -0.60], [0.16, -0.585], [0.34, -0.52], [0.465, -0.36],
    [0.545, -0.12], [0.55, 0.06], [0.50, 0.24], [0.40, 0.38],
    [0.26, 0.455], [0.13, 0.43], [0.05, 0.33],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const body = new THREE.Mesh(
    new THREE.LatheGeometry(P, 64),
    new THREE.MeshPhysicalMaterial({
      color: 0x9c2226,
      roughness: 0.34,
      clearcoat: 0.65,
      clearcoatRoughness: 0.3,
    })
  );
  group.add(body);

  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.024, 0.05, 0.34, 10),
    new THREE.MeshStandardMaterial({ color: 0x4a3320, roughness: 0.9 })
  );
  stem.position.set(0.02, 0.48, 0);
  stem.rotation.z = -0.14;
  group.add(stem);

  /* a curled leaf, built as a little parametric sheet: it tapers
     to a point, cups across its width and arches along its length,
     and gets real normals so the light rolls over the curl */
  function leafGeometry(len = 0.34, halfW = 0.078, curl = 0.042, arch = 0.055) {
    const nU = 16, nV = 8, pos = [], uv = [], idx = [];
    for (let i = 0; i <= nU; i++) {
      const u = i / nU;
      const w = halfW * Math.pow(Math.sin(Math.PI * Math.pow(u, 0.8)), 0.75);
      for (let j = 0; j <= nV; j++) {
        const v = (j / nV) * 2 - 1;
        pos.push(u * len, v * w, curl * v * v + arch * Math.sin(Math.PI * u));
        uv.push(u, (v + 1) / 2);
      }
    }
    for (let i = 0; i < nU; i++) {
      for (let j = 0; j < nV; j++) {
        const a = i * (nV + 1) + j, b = a + nV + 1;
        idx.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  const leafGeo = leafGeometry();
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x5e7c42, roughness: 0.62, side: THREE.DoubleSide,
  });
  // each leaf rides a yaw pivot and lies close to horizontal, so
  // it keeps its face to the camera at every point of the spin
  // instead of vanishing edge-on the way an upright plane would
  [
    { s: 2.25, yaw: 0.35, y: 0.585, tilt: 0.42 },
    { s: 1.85, yaw: 2.55, y: 0.545, tilt: 0.28 },
    { s: 1.5, yaw: 4.45, y: 0.515, tilt: 0.5 },
  ].forEach(({ s, yaw, y, tilt }) => {
    const pivot = new THREE.Group();
    pivot.position.set(0.03, y, 0);
    pivot.rotation.y = yaw;
    const m = new THREE.Mesh(leafGeo, leafMat);
    m.scale.setScalar(s);
    m.position.set(0.035, 0, 0);
    m.rotation.x = -Math.PI / 2 + tilt;
    pivot.add(m);
    group.add(pivot);
  });

  const shadow = document.querySelector(".apple-shadow");

  let raf = 0, visible = true, lastT = 0, t = 0;
  let swayX = 0;
  /* the scroll lag: the page moves, the apple doesn't quite keep
     up, then springs after it and overshoots before it settles.
     under-damped on purpose (ζ ≈ 0.58) — that's the wobble. */
  let lagY = 0, lagV = 0, lastScroll = scrollY;
  const SPRING = 62, DAMP = 9;

  function render() { renderer.render(scene, camera); }

  /* the shadow is cast on her palm, not stuck to the apple: the
     higher the apple floats, the smaller and fainter it gets, and
     it slides along underneath as she sways */
  function castShadow() {
    if (!shadow) return;
    const lift = Math.max(-1, Math.min(1, group.position.y / 0.55));
    shadow.style.transform =
      `translateX(${(swayX * 74).toFixed(1)}px) scale(${(1 - lift * 0.34).toFixed(3)})`;
    shadow.style.opacity = (0.95 - lift * 0.45).toFixed(3);
  }

  function frame(now) {
    raf = 0;
    if (!visible) return;
    const dt = Math.min(50, now - (lastT || now)) / 1000;
    lastT = now;
    t += dt;

    // spring the scroll lag back to rest
    lagV += (-SPRING * lagY - DAMP * lagV) * dt;
    lagY += lagV * dt;

    // a steady turn around its own centre
    group.rotation.y += 0.55 * dt;
    // and a slow side-wave: it rocks like something hanging in air
    const sway = Math.sin(t * 0.8);
    group.rotation.z = sway * 0.17;
    group.rotation.x = 0.16 + Math.sin(t * 0.58) * 0.1;
    swayX = sway * 0.1;
    group.position.x = swayX;
    group.position.y = Math.sin(t * 1.1) * 0.2 + lagY;

    castShadow();
    render();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (!raf && visible && !STATIC) { lastT = 0; raf = requestAnimationFrame(frame); }
  }

  // the CSS box changes at the mobile breakpoint and on rotate
  let rT;
  addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(() => { resize(); render(); }, 150);
  });

  if (STATIC) {
    group.rotation.set(0.16, 0.7, 0);
    castShadow();
    render();
  } else {
    start();

    /* every scroll shoves the apple the other way — it falls
       behind the page, then chases its place and overshoots */
    addEventListener("scroll", () => {
      const y = scrollY;
      // only while it's on screen — otherwise the impulse would
      // pile up unseen and snap the moment it scrolled back in
      if (visible) {
        lagV -= (y - lastScroll) * 0.03;
        lagV = Math.max(-9, Math.min(9, lagV));
      }
      lastScroll = y;
    }, { passive: true });

    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    }).observe(canvas);
  }
}
