/* ════════════════════════════════════════════════════════════
   The little studio the 3D props share — one warm room, one
   light rig, one loop that sleeps when nobody's looking.

   Each prop gets its own canvas and its own WebGL context; what
   they share is the setup, so a new prop is just geometry and a
   frame function.
   ════════════════════════════════════════════════════════════ */

import * as THREE from "three";
import { RoomEnvironment } from "./vendor/RoomEnvironment.js";

export const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const FAST = /[?&]fast/.test(location.search); // dev: hold one frame
export const STATIC = REDUCED || FAST;

export function createStage(canvas, opts = {}) {
  const {
    fov = 32,
    camPos = [0, 0.85, 4.4],
    lookAt = [0, 0.02, 0],
    env = 0.55,
    ambient = 0.5,
    key = 2.1,
    fill = 0.55,
  } = opts;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 20);
  camera.position.set(...camPos);
  camera.lookAt(...lookAt);

  // soft neutral room reflections — what makes the clearcoat and
  // the ferrule read as real surfaces rather than flat colour
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  if ("environmentIntensity" in scene) scene.environmentIntensity = env;

  scene.add(new THREE.AmbientLight(0xfff2e2, ambient));
  const keyLight = new THREE.DirectionalLight(0xffffff, key);
  keyLight.position.set(2.5, 3.5, 2.5);
  scene.add(keyLight);
  const fillLight = new THREE.DirectionalLight(0xffe6cc, fill);
  fillLight.position.set(-2.5, 1, -1.5);
  scene.add(fillLight);

  const group = new THREE.Group();
  scene.add(group);

  // the render buffer tracks the CSS box, so every breakpoint
  // draws at exactly the resolution it displays at
  function resize() {
    const w = canvas.clientWidth || 64;
    const h = canvas.clientHeight || 64;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  const render = () => renderer.render(scene, camera);
  return { THREE, scene, camera, renderer, group, render, resize };
}

/* Runs a prop's frame function: paused while offscreen, resized
   with the window, and reduced to a single still frame for
   anyone who asked for less motion. */
export function driveLoop(canvas, stage, onFrame, onStatic) {
  let raf = 0, visible = true, lastT = 0, t = 0;

  function frame(now) {
    raf = 0;
    if (!visible) return;
    const dt = Math.min(50, now - (lastT || now)) / 1000;
    lastT = now;
    t += dt;
    onFrame(dt, t);
    stage.render();
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (!raf && visible && !STATIC) { lastT = 0; raf = requestAnimationFrame(frame); }
  }

  let rT;
  addEventListener("resize", () => {
    clearTimeout(rT);
    rT = setTimeout(() => { stage.resize(); stage.render(); }, 150);
  });

  if (STATIC) {
    if (onStatic) onStatic();
    stage.render();
  } else {
    start();
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    }).observe(canvas);
  }

  return { isVisible: () => visible };
}
