import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const NEUTRAL = new THREE.Color(0x99a0ad);
const MUSCLE_BASE = new THREE.Color(0xb2b8c4);
const SELECTED = new THREE.Color(0xe0452f);
const HL_LIGHT = new THREE.Color(0xf3b0a4);
const HL_DARK = new THREE.Color(0x8a1a08);

function coreMat() {
  return new THREE.MeshStandardMaterial({ color: NEUTRAL, roughness: 0.75, metalness: 0.05 });
}
function muscleMat() {
  return new THREE.MeshStandardMaterial({ color: MUSCLE_BASE, roughness: 0.6, metalness: 0.05 });
}

function sphere(sx, sy, sz, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  return m;
}
function cyl(rTop, rBot, h, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 18), mat);
  m.position.set(x, y, z);
  return m;
}

// Builds the mannequin. Returns { group, muscleMeshes: {muscleName: [mesh,...]} }
function buildBody(bodyType) {
  const isMan = bodyType === 'man';
  const sw = isMan ? 0.21 : 0.17; // shoulder half-width
  const hw = isMan ? 0.11 : 0.135; // hip half-width
  const ms = isMan ? 1.12 : 1.0; // muscle bulk

  const group = new THREE.Group();
  const muscles = {};
  const addMuscle = (name, mesh, parent = group) => {
    mesh.userData.muscle = name;
    mesh.scale.multiplyScalar(ms);
    (muscles[name] ??= []).push(mesh);
    parent.add(mesh);
  };

  // --- core / neutral body ---
  const core = coreMat();
  group.add(sphere(hw, 0.1, 0.09, 0, 0, 0, core)); // pelvis
  group.add(cyl(0.105, hw * 0.9, 0.22, 0, 0.16, 0, core)); // waist
  group.add(sphere(sw * 0.82, 0.17, 0.11, 0, 0.38, 0, core)); // ribcage
  group.add(cyl(0.034, 0.042, 0.12, 0, 0.545, 0, core)); // neck
  const head = sphere(0.085, 0.1, 0.09, 0, 0.7, 0, core);
  group.add(head);
  // shoulder bridge
  group.add(cyl(0.045, 0.045, sw * 2, 0, 0.5, 0, core).rotateZ(Math.PI / 2));

  // --- torso muscles ---
  for (const side of [-1, 1]) {
    addMuscle('Chest', sphere(0.062, 0.052, 0.05, side * 0.06, 0.42, 0.075, muscleMat()));
    addMuscle('Obliques', sphere(0.032, 0.09, 0.05, side * 0.1, 0.2, 0.03, muscleMat()));
    addMuscle('Traps', sphere(0.055, 0.038, 0.05, side * 0.06, 0.53, -0.015, muscleMat()));
    addMuscle('Lats', sphere(0.055, 0.095, 0.042, side * 0.08, 0.31, -0.06, muscleMat()));
    addMuscle('Glutes', sphere(0.07, 0.07, 0.06, side * 0.06, -0.02, -0.06, muscleMat()));
  }
  addMuscle('Abs', sphere(0.07, 0.115, 0.04, 0, 0.2, 0.075, muscleMat()));
  addMuscle('Lower Back', sphere(0.062, 0.065, 0.038, 0, 0.13, -0.07, muscleMat()));

  // --- arms ---
  for (const side of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(side * (sw + 0.02), 0.5, 0);
    arm.rotation.z = side * -0.1;
    const core2 = coreMat();
    arm.add(cyl(0.036, 0.032, 0.26, 0, -0.13, 0, core2)); // upper arm
    arm.add(sphere(0.032, 0.032, 0.032, 0, -0.27, 0, core2)); // elbow
    arm.add(cyl(0.03, 0.024, 0.24, 0, -0.4, 0, core2)); // forearm core
    arm.add(sphere(0.028, 0.05, 0.032, 0, -0.55, 0, core2)); // hand
    addMuscle('Shoulders', sphere(0.052, 0.055, 0.052, 0, 0.005, 0, muscleMat()), arm);
    addMuscle('Biceps', sphere(0.036, 0.075, 0.038, 0, -0.13, 0.024, muscleMat()), arm);
    addMuscle('Triceps', sphere(0.036, 0.08, 0.038, 0, -0.13, -0.024, muscleMat()), arm);
    addMuscle('Forearms', sphere(0.034, 0.085, 0.034, 0, -0.36, 0.005, muscleMat()), arm);
    group.add(arm);
  }

  // --- legs ---
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.09, -0.05, 0);
    leg.rotation.z = side * -0.03;
    const core3 = coreMat();
    leg.add(cyl(0.068, 0.05, 0.45, 0, -0.22, 0, core3)); // thigh
    leg.add(sphere(0.045, 0.045, 0.045, 0, -0.45, 0, core3)); // knee
    leg.add(cyl(0.045, 0.03, 0.4, 0, -0.66, 0, core3)); // shin
    leg.add(sphere(0.04, 0.03, 0.09, 0, -0.88, 0.04, core3)); // foot
    addMuscle('Quads', sphere(0.055, 0.17, 0.05, 0, -0.2, 0.035, muscleMat()), leg);
    addMuscle('Hamstrings', sphere(0.05, 0.15, 0.045, 0, -0.22, -0.035, muscleMat()), leg);
    addMuscle('Calves', sphere(0.042, 0.12, 0.045, 0, -0.6, -0.025, muscleMat()), leg);
    group.add(leg);
  }

  group.position.y = 0.06;
  return { group, muscles };
}

/**
 * Spinnable 3D body.
 * props:
 *  - bodyType: 'woman' | 'man'
 *  - selected: array of muscle names shown in solid red
 *  - highlights: { muscle: intensity 0..1 } shown light→dark red (workout load)
 *  - onToggle(muscle): called when a muscle is clicked/tapped
 *  - height: css height (default 340)
 */
export default function BodyModel({ bodyType = 'woman', selected = [], highlights = {}, onToggle, height = 340 }) {
  const mountRef = useRef(null);
  const stateRef = useRef({});
  const propsRef = useRef({});
  propsRef.current = { selected, highlights, onToggle };

  // scene setup (once)
  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
    camera.position.set(0, 0.05, 2.75);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x666677, 1.1));
    const dir = new THREE.DirectionalLight(0xffffff, 1.4);
    dir.position.set(2, 3, 4);
    scene.add(dir);
    const dir2 = new THREE.DirectionalLight(0xaabbff, 0.5);
    dir2.position.set(-2, 1, -3);
    scene.add(dir2);

    const st = stateRef.current;
    st.scene = scene;
    st.camera = camera;
    st.renderer = renderer;
    st.raycaster = new THREE.Raycaster();
    st.rotY = 0;

    const resize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // drag to rotate / click to select
    let dragging = false;
    let moved = 0;
    let lastX = 0;
    const el = renderer.domElement;
    el.style.touchAction = 'none';
    el.style.cursor = 'grab';

    const onDown = (e) => {
      dragging = true;
      moved = 0;
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
    };
    const onMove = (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      moved += Math.abs(dx);
      lastX = e.clientX;
      st.rotY += dx * 0.012;
      if (st.body) st.body.rotation.y = st.rotY;
    };
    const onUp = (e) => {
      if (!dragging) return;
      dragging = false;
      if (moved < 6 && propsRef.current.onToggle && st.muscles) {
        const rect = el.getBoundingClientRect();
        const p = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        st.raycaster.setFromCamera(p, camera);
        const meshes = Object.values(st.muscles).flat();
        const hits = st.raycaster.intersectObjects(meshes, false);
        if (hits.length) propsRef.current.onToggle(hits[0].object.userData.muscle);
      }
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);

    let raf;
    const loop = () => {
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      renderer.dispose();
      mount.removeChild(el);
    };
  }, []);

  // (re)build body when bodyType changes
  useEffect(() => {
    const st = stateRef.current;
    if (st.body) {
      st.scene.remove(st.body);
      st.body.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
    const { group, muscles } = buildBody(bodyType);
    group.rotation.y = st.rotY;
    st.scene.add(group);
    st.body = group;
    st.muscles = muscles;
    applyColors(st, propsRef.current);
  }, [bodyType]);

  // recolor when selection/highlights change
  useEffect(() => {
    applyColors(stateRef.current, propsRef.current);
  }, [selected, highlights]);

  return (
    <div className="body-model-wrap">
      <div ref={mountRef} style={{ width: '100%', height }} />
      <div className="body-model-hint">drag to spin · tap a muscle</div>
    </div>
  );
}

function applyColors(st, { selected, highlights }) {
  if (!st.muscles) return;
  const sel = new Set(selected);
  for (const [name, meshes] of Object.entries(st.muscles)) {
    let color = MUSCLE_BASE;
    let emissive = 0;
    if (sel.has(name)) {
      color = SELECTED;
      emissive = 0.25;
    } else if (highlights[name] != null) {
      color = new THREE.Color().lerpColors(HL_LIGHT, HL_DARK, Math.min(1, highlights[name]));
      emissive = 0.12;
    }
    for (const m of meshes) {
      m.material.color.copy(color);
      m.material.emissive.copy(color).multiplyScalar(emissive);
    }
  }
}
