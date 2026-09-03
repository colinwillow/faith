/* ════════════════════════════════════════════════════════════
   The apple — a small glossy 3D apple turning above Faith's
   open palm. Lathe-built in code (no model file), lit like the
   studio, red with a proper stem dimple, stem and three curled
   leaves. It floats on a deep bob, rocks on a side-wave, turns
   steadily around its own centre, and lags behind the page when
   you scroll before springing back with an overshoot.

   The room, the lights and the loop come from stage3d.js —
   everything below is just this prop.
   ════════════════════════════════════════════════════════════ */

import { createStage, driveLoop, STATIC } from "./stage3d.js";

const canvas = document.getElementById("apple");
if (canvas) {
  const stage = createStage(canvas);
  const { THREE, group } = stage;

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
  let swayX = 0;
  /* the scroll lag: the page moves, the apple doesn't quite keep
     up, then springs after it and overshoots before it settles.
     under-damped on purpose (ζ ≈ 0.58) — that's the wobble. */
  let lagY = 0, lagV = 0, lastScroll = scrollY;
  const SPRING = 62, DAMP = 9;

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

  const loop = driveLoop(canvas, stage, (dt, t) => {
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
  }, () => {
    group.rotation.set(0.16, 0.7, 0);
    castShadow();
  });

  /* every scroll shoves the apple the other way — it falls behind
     the page, then chases its place and overshoots */
  if (!STATIC) {
    addEventListener("scroll", () => {
      const y = scrollY;
      // only while it's on screen — otherwise the impulse would
      // pile up unseen and snap the moment it scrolled back in
      if (loop.isVisible()) {
        lagV -= (y - lastScroll) * 0.03;
        lagV = Math.max(-9, Math.min(9, lagV));
      }
      lastScroll = y;
    }, { passive: true });
  }
}
