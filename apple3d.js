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

  const SIZE = 150; // render size; CSS scales the canvas responsively
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.setSize(SIZE, SIZE, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

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

  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.quadraticCurveTo(0.16, 0.11, 0.32, 0.02);
  leafShape.quadraticCurveTo(0.16, -0.055, 0, 0);
  const leaf = new THREE.Mesh(
    new THREE.ShapeGeometry(leafShape, 12),
    new THREE.MeshStandardMaterial({ color: 0x5e7c42, roughness: 0.65, side: THREE.DoubleSide })
  );
  leaf.position.set(0.05, 0.6, 0.01);
  leaf.rotation.set(-0.55, 0.15, 0.4);
  group.add(leaf);

  group.rotation.x = 0.16; // a touch of top view, so the dimple reads

  let raf = 0, visible = true, lastT = 0, t = 0;
  let speed = 1, speedTarget = 1;

  function render() { renderer.render(scene, camera); }

  function frame(now) {
    raf = 0;
    if (!visible) return;
    const dt = Math.min(50, now - (lastT || now)) / 1000;
    lastT = now;
    speed += (speedTarget - speed) * 0.06;
    t += dt * speed;
    group.rotation.y += 0.45 * speed * dt;
    group.position.y = Math.sin(t * 1.6) * 0.045; // period ≈ 3.93s, matched by the CSS shadow
    render();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (!raf && visible && !STATIC) { lastT = 0; raf = requestAnimationFrame(frame); }
  }

  if (STATIC) {
    group.rotation.y = 0.7;
    render();
  } else {
    start();

    // curiosity: it turns a little faster when the cursor is near
    addEventListener("pointermove", (e) => {
      const r = canvas.getBoundingClientRect();
      const d = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
      speedTarget = d < 240 ? 2.2 : 1;
    }, { passive: true });

    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    }).observe(canvas);
  }
}
