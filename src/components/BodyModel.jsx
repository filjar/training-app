import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const NEUTRAL = new THREE.Color(0x9aa1ad);
const SELECTED = new THREE.Color(0xe0452f);
const HL_LIGHT = new THREE.Color(0xf0a596);
const HL_DARK = new THREE.Color(0x8f1c0a);
const BORDER_IDLE = new THREE.Color(0x7f8aa2); // faint outline of an unselected muscle area

function coreMat() {
  return new THREE.MeshStandardMaterial({ color: NEUTRAL, roughness: 0.8, metalness: 0.04 });
}

function sphere(sx, sy, sz, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), mat);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  return m;
}
// Capsule (rounded cylinder) — a limb segment. Oriented along Y.
function capsule(r, len, x, y, z, mat) {
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 8, 20), mat);
  m.position.set(x, y, z);
  return m;
}

// ---- muscle-area overlays -------------------------------------------------
// Each muscle is a thin "sticker" laid on the body surface: a rounded patch
// that is invisible when idle (only its outline shows, to aid tapping) and
// fills with red when selected or shaded by workout load. This keeps the body
// mesh itself a plain visual, so any realistic base model can sit underneath.

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// Gentle outward bulge so a patch hugs a rounded surface instead of floating flat.
function bulgeZ(x, y, w, h, curve) {
  const nx = x / (w / 2), ny = y / (h / 2);
  return curve * Math.max(0, 1 - nx * nx) * Math.max(0, 1 - ny * ny);
}

function makeArea(w, h, curve) {
  const shape = roundedRectShape(w, h, Math.min(w, h) * 0.42);

  const fillGeo = new THREE.ShapeGeometry(shape, 18);
  const pos = fillGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setZ(i, bulgeZ(pos.getX(i), pos.getY(i), w, h, curve));
  }
  pos.needsUpdate = true;
  fillGeo.computeVertexNormals();
  const fill = new THREE.Mesh(
    fillGeo,
    new THREE.MeshBasicMaterial({
      color: SELECTED.clone(),
      transparent: true,
      opacity: 0,
      // Front-face only: a patch is tappable only when its muscle actually
      // faces the camera, so a click can't pass through the torso and grab a
      // muscle on the far side.
      side: THREE.FrontSide,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -6,
      polygonOffsetUnits: -6,
    }),
  );
  fill.renderOrder = 2;

  const outline = shape
    .getPoints(56)
    .map((p) => new THREE.Vector3(p.x, p.y, bulgeZ(p.x, p.y, w, h, curve)));
  const border = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(outline),
    new THREE.LineBasicMaterial({ color: BORDER_IDLE.clone(), transparent: true, opacity: 0.7 }),
  );
  border.renderOrder = 3;

  const group = new THREE.Group();
  group.add(fill, border);
  fill.userData.border = border;
  return { group, fill };
}

const UP_Z = new THREE.Vector3(0, 0, 1);

// Places a muscle area centred at (x,y,z) on the surface, facing `face`.
function placeArea(muscles, name, parent, x, y, z, face, w, h, curve = 0.02) {
  const { group, fill } = makeArea(w, h, curve);
  const f = new THREE.Vector3(...face).normalize();
  group.quaternion.setFromUnitVectors(UP_Z, f);
  group.position.set(x, y, z);
  fill.userData.muscle = name;
  (muscles[name] ??= []).push(fill);
  parent.add(group);
}

// Builds the body: a plain neutral base mesh plus the selectable muscle areas.
// Returns { group, muscles: { name: [fillMesh,...] } }.
function buildBody(bodyType) {
  const isMan = bodyType === 'man';
  const sw = isMan ? 0.205 : 0.165; // shoulder half-width
  const hipR = isMan ? 0.125 : 0.142;
  const waistR = isMan ? 0.107 : 0.097;
  const chestR = isMan ? 0.152 : 0.126;
  const zf = 0.82; // torso front/back flattening

  const group = new THREE.Group();
  const muscles = {};
  const core = coreMat();

  // --- base body (plain neutral visual) ---
  const profile = [
    [0.03, -0.16], [0.09, -0.12], [hipR, -0.03], [hipR * 0.94, 0.06],
    [waistR, 0.17], [waistR * 1.06, 0.25], [chestR * 0.9, 0.34], [chestR, 0.43],
    [chestR * 0.9, 0.5], [0.088, 0.54], [0.05, 0.57],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const torso = new THREE.Mesh(new THREE.LatheGeometry(profile, 32), core);
  torso.scale.z = zf;
  group.add(torso);
  group.add(capsule(0.04, 0.05, 0, 0.605, 0, core)); // neck
  group.add(sphere(0.088, 0.108, 0.094, 0, 0.725, 0.006, core)); // head
  const yoke = capsule(0.05, sw * 1.55, 0, 0.5, -0.005, core);
  yoke.rotation.z = Math.PI / 2;
  group.add(yoke);

  // --- torso muscle areas ---
  const front = chestR * zf; // approx front surface z at the chest
  for (const s of [-1, 1]) {
    placeArea(muscles, 'Chest', group, s * 0.058, 0.44, front - 0.01, [s * 0.5, 0.1, 1], 0.092, 0.082);
    placeArea(muscles, 'Obliques', group, s * 0.09, 0.2, 0.06, [s * 0.7, -0.1, 0.8], 0.05, 0.12);
    placeArea(muscles, 'Traps', group, s * 0.05, 0.53, -0.03, [s * 0.2, 0.5, -0.8], 0.07, 0.055);
    placeArea(muscles, 'Lats', group, s * 0.086, 0.33, -0.072, [s * 0.4, 0, -0.9], 0.07, 0.14);
    placeArea(muscles, 'Glutes', group, s * 0.062, -0.05, -0.062, [s * 0.15, -0.2, -0.95], 0.09, 0.085);
  }
  placeArea(muscles, 'Abs', group, 0, 0.24, front - 0.02, [0, 0, 1], 0.09, 0.18);
  placeArea(muscles, 'Lower Back', group, 0, 0.17, -0.086, [0, 0, -1], 0.1, 0.09);

  // --- arms ---
  for (const s of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(s * (sw + 0.008), 0.5, 0);
    arm.rotation.z = s * -0.09;
    const c = coreMat();
    arm.add(capsule(0.033, 0.2, 0, -0.14, 0, c)); // upper arm
    arm.add(capsule(0.027, 0.19, 0, -0.4, 0.004, c)); // forearm
    arm.add(sphere(0.03, 0.052, 0.034, 0, -0.56, 0.004, c)); // hand
    group.add(arm);

    placeArea(muscles, 'Shoulders', arm, 0, 0.015, 0.008, [s * 0.5, 0.55, 0.5], 0.078, 0.075);
    placeArea(muscles, 'Biceps', arm, 0, -0.13, 0.034, [0, 0, 1], 0.05, 0.13);
    placeArea(muscles, 'Triceps', arm, 0, -0.14, -0.034, [0, 0, -1], 0.05, 0.13);
    placeArea(muscles, 'Forearms', arm, 0, -0.37, 0.028, [0, 0, 1], 0.045, 0.16);
  }

  // --- legs ---
  for (const s of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(s * 0.078, -0.06, 0);
    leg.rotation.z = s * -0.02;
    const c = coreMat();
    leg.add(capsule(0.058, 0.34, 0, -0.24, 0, c)); // thigh
    leg.add(capsule(0.042, 0.32, 0, -0.62, 0.002, c)); // shin
    leg.add(sphere(0.042, 0.03, 0.095, 0, -0.9, 0.04, c)); // foot
    group.add(leg);

    placeArea(muscles, 'Quads', leg, 0, -0.24, 0.058, [0, 0, 1], 0.085, 0.24);
    placeArea(muscles, 'Hamstrings', leg, 0, -0.26, -0.058, [0, 0, -1], 0.08, 0.22);
    placeArea(muscles, 'Calves', leg, 0, -0.6, -0.042, [0, 0, -1], 0.07, 0.14);
  }

  group.position.y = 0.09;
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
 *  - summary: short text shown on the bar while the model is minimized
 */
const CAM_DIST = 2.75;
const MAX_ZOOM = 3.5;
// Half the world height the camera sees at zoom 1 (fov 40°).
const VIEW_HALF = CAM_DIST * Math.tan((20 * Math.PI) / 180);

export default function BodyModel({ bodyType = 'woman', selected = [], highlights = {}, onToggle, height = 340, summary }) {
  const mountRef = useRef(null);
  const [zoomed, setZoomed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const stateRef = useRef({});
  const propsRef = useRef({});
  propsRef.current = { selected, highlights, onToggle };

  // scene setup (once)
  useEffect(() => {
    const mount = mountRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 20);
    camera.position.set(0, 0.05, CAM_DIST);
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
    st.zoom = 1;
    st.panY = 0;

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

    const el = renderer.domElement;
    el.style.cursor = 'grab';

    // Zoom moves the camera in; once zoomed, vertical drags pan up/down the
    // body. At zoom 1 vertical swipes are left to the browser (touch-action:
    // pan-y) so the page still scrolls when a finger lands on the model.
    const applyView = () => {
      const maxPan = VIEW_HALF * (1 - 1 / st.zoom);
      st.panY = Math.max(-maxPan, Math.min(maxPan, st.panY));
      camera.position.set(0, 0.05 + st.panY, CAM_DIST / st.zoom);
      camera.lookAt(0, st.panY, 0);
      const isZoomed = st.zoom > 1.01;
      el.style.touchAction = isZoomed ? 'none' : 'pan-y';
      setZoomed(isZoomed);
    };
    st.setZoom = (z) => {
      st.zoom = Math.max(1, Math.min(MAX_ZOOM, z));
      applyView();
    };
    applyView();

    // drag to rotate (and pan when zoomed) / pinch to zoom / tap to select
    const pointers = new Map();
    let moved = 0;
    let pinch = null; // { dist, zoom } at the start of a two-finger gesture
    const pinchDist = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    const onDown = (e) => {
      if (pointers.size === 0) moved = 0;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      el.setPointerCapture(e.pointerId);
      if (pointers.size === 2) {
        pinch = { dist: pinchDist() || 1, zoom: st.zoom };
        moved = Infinity; // a pinch never counts as a tap
      }
    };
    const onMove = (e) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x;
      const dy = e.clientY - p.y;
      p.x = e.clientX;
      p.y = e.clientY;
      if (pointers.size >= 2) {
        if (pinch) st.setZoom(pinch.zoom * (pinchDist() / pinch.dist));
        return;
      }
      moved += Math.abs(dx) + Math.abs(dy);
      st.rotY += (dx * 0.012) / Math.sqrt(st.zoom);
      if (st.body) st.body.rotation.y = st.rotY;
      if (st.zoom > 1.01) {
        st.panY += (dy * 2 * VIEW_HALF) / (st.zoom * (mount.clientHeight || 1));
        applyView();
      }
    };
    const onUp = (e) => {
      if (!pointers.delete(e.pointerId)) return;
      if (pointers.size < 2) pinch = null;
      if (pointers.size > 0 || e.type === 'pointercancel') return;
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
    // Trackpad pinch arrives as ctrl+wheel; plain wheel is left alone so the
    // page keeps scrolling.
    const onWheel = (e) => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      st.setZoom(st.zoom * Math.exp(-e.deltaY * 0.01));
    };
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);
    el.addEventListener('wheel', onWheel, { passive: false });

    let raf;
    const loop = () => {
      if (mount.clientHeight) renderer.render(scene, camera); // skip while minimized
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      el.removeEventListener('wheel', onWheel);
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

  const zoomBy = (f) => stateRef.current.setZoom?.(stateRef.current.zoom * f);

  return (
    <div className={`body-model-wrap ${collapsed ? 'collapsed' : ''}`}>
      <div className="body-model-stage">
        <div ref={mountRef} style={{ width: '100%', height: collapsed ? 0 : height, overflow: 'hidden' }} />
        {!collapsed && (
          <>
            <div className="body-model-zoom">
              <button className="icon-btn" title="Zoom in" onClick={() => zoomBy(1.4)}>+</button>
              <button className="icon-btn" title="Zoom out" disabled={!zoomed} onClick={() => zoomBy(1 / 1.4)}>−</button>
              {zoomed && (
                <button className="icon-btn" title="Reset zoom" onClick={() => stateRef.current.setZoom(1)}>reset</button>
              )}
            </div>
            {!zoomed && <div className="body-model-hint">drag to spin · pinch to zoom · tap a muscle</div>}
          </>
        )}
      </div>
      <button className="body-model-toggle" onClick={() => setCollapsed(!collapsed)}>
        {collapsed ? (
          <>
            <span className="body-model-summary">{summary || 'Body model hidden'}</span>
            <span>Show body ▾</span>
          </>
        ) : (
          <span>Hide body ▴</span>
        )}
      </button>
    </div>
  );
}

function applyColors(st, { selected, highlights }) {
  if (!st.muscles) return;
  const sel = new Set(selected);
  for (const [name, fills] of Object.entries(st.muscles)) {
    // Decide this muscle's look: idle (outline only), selected (solid red), or
    // load-shaded (light→dark red by intensity).
    let fillColor = SELECTED;
    let fillOpacity = 0;
    let borderColor = BORDER_IDLE;
    let borderOpacity = 0.7;
    if (sel.has(name)) {
      fillColor = SELECTED;
      fillOpacity = 0.62;
      borderColor = SELECTED;
      borderOpacity = 1;
    } else if (highlights[name] != null) {
      fillColor = new THREE.Color().lerpColors(HL_LIGHT, HL_DARK, Math.min(1, highlights[name]));
      fillOpacity = 0.55;
      borderColor = fillColor;
      borderOpacity = 0.95;
    }
    for (const fill of fills) {
      fill.material.color.copy(fillColor);
      fill.material.opacity = fillOpacity;
      const border = fill.userData.border;
      if (border) {
        border.material.color.copy(borderColor);
        border.material.opacity = borderOpacity;
      }
    }
  }
}
