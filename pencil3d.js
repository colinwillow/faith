/* ════════════════════════════════════════════════════════════
   The pencil — a small hexagonal pencil twirling beside the
   Days heading. Built from six lathe-free primitives (graphite,
   sharpened wood, hex barrel, ferrule, eraser), tipped over and
   spun around the vertical so it turns the way a pencil does
   between two fingers, with a slow bob under it.

   Room, lights and loop come from stage3d.js.
   ════════════════════════════════════════════════════════════ */

import { createStage, driveLoop } from "./stage3d.js";

const canvas = document.getElementById("pencil");
if (canvas) {
  const stage = createStage(canvas, {
    camPos: [0, 0.25, 4.0],
    lookAt: [0, 0, 0],
    key: 2.3,
    fill: 0.6,
  });
  const { THREE, group } = stage;

  /* built nose-down along +Y from the graphite point at 0 up to
     the eraser at 1.9, then hung off a pivot at its own middle so
     the spin goes through the barrel and not through the tip */
  const pencil = new THREE.Group();
  pencil.position.y = -0.95;
  group.add(pencil);

  const HEX = 6;
  const part = (geo, mat, y) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.y = y;
    pencil.add(m);
    return m;
  };
  // flat shading is the whole point of a hex pencil — six facets
  // catching the key light one at a time as it turns
  const facet = (color, o = {}) =>
    new THREE.MeshStandardMaterial({ color, flatShading: true, roughness: 0.5, ...o });

  // graphite: the last 0.1 tapering to an actual point
  part(new THREE.CylinderGeometry(0.05, 0.0, 0.1, HEX), facet(0x2b2724, { roughness: 0.62 }), 0.05);
  // the sharpened cone of bare wood
  part(new THREE.CylinderGeometry(0.13, 0.05, 0.22, HEX), facet(0xe0c091, { roughness: 0.78 }), 0.21);
  // the painted barrel
  part(new THREE.CylinderGeometry(0.13, 0.13, 1.3, HEX), facet(0xd8a33f, { roughness: 0.38 }), 0.97);
  // the ferrule, turned metal and round rather than faceted
  part(
    new THREE.CylinderGeometry(0.136, 0.136, 0.13, 20),
    new THREE.MeshStandardMaterial({ color: 0xb6ada0, metalness: 0.95, roughness: 0.28 }),
    1.685
  );
  // and the eraser
  part(
    new THREE.CylinderGeometry(0.122, 0.128, 0.15, 20),
    new THREE.MeshStandardMaterial({ color: 0xc9776a, roughness: 0.85 }),
    1.835
  );

  /* rotation order is XYZ, so z tips the pencil over first and y
     then swings that tipped axis around the vertical — a twirl,
     not a cartwheel. x adds a slow nod on top of it. */
  const TILT = 0.52;
  group.rotation.z = TILT;

  driveLoop(canvas, stage, (dt, t) => {
    group.rotation.y += 0.85 * dt;
    group.rotation.x = Math.sin(t * 0.7) * 0.13;
    group.rotation.z = TILT + Math.sin(t * 0.45) * 0.07;
    group.position.y = Math.sin(t * 1.15) * 0.07;
  }, () => {
    group.rotation.y = 0.9;
  });
}
