import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Muscle ids baked into the models' `_MUSCLE` vertex attribute, in the order
// scripts/body/build_body.py writes them (0 = not a muscle).
const MUSCLES = [
  null, 'Chest', 'Shoulders', 'Traps', 'Biceps', 'Triceps', 'Forearms', 'Abs',
  'Obliques', 'Lats', 'Lower Back', 'Glutes', 'Quads', 'Hamstrings', 'Calves',
];

// Each muscle's border weight lives in one of four channels, chosen so that no
// two neighbouring muscles share a channel. Interpolating the channels
// separately keeps every outline clean even where two muscles meet.
const CHANNEL = {
  Shoulders: 0, Forearms: 0, Abs: 0, 'Lower Back': 0, Quads: 0, Calves: 0,
  Chest: 1, Traps: 1, Biceps: 1, Glutes: 1,
  Triceps: 2, Obliques: 2, Hamstrings: 2,
  Lats: 3,
};

const SKIN = new THREE.Color(0xc4bcb4); // the body surface
const OUTLINE = new THREE.Color(0x6f6a66); // border of an unselected muscle
const SELECTED = new THREE.Color(0xe0452f);
const HL_LIGHT = new THREE.Color(0xf0a596);
const HL_DARK = new THREE.Color(0x8f1c0a);

const BODY_HEIGHT = 1.86; // world units the model is scaled to, to fill the view
// A tap that lands just outside a muscle still selects it if one is this close.
const TAP_SLOP = 0.04;

const loader = new GLTFLoader();
const modelCache = {};

// Loads a body model once and returns its prepared geometry: centred, scaled,
// with smooth normals and the per-vertex muscle ids + weights split out of the
// packed `_MUSCLE` / `_MUSCLE2` attributes (id in the integer part, weight in
// the fraction). A weight crosses 0.5 exactly on that muscle's border.
function loadBody(bodyType) {
  modelCache[bodyType] ??= loader
    .loadAsync(`${import.meta.env.BASE_URL}models/${bodyType}.glb`)
    .then((gltf) => {
      let geo = null;
      gltf.scene.traverse((o) => { if (o.isMesh && !geo) geo = o.geometry; });
      geo.computeBoundingBox();
      const box = geo.boundingBox;
      const scale = BODY_HEIGHT / (box.max.y - box.min.y);
      geo.translate(-(box.max.x + box.min.x) / 2, -(box.max.y + box.min.y) / 2, -(box.max.z + box.min.z) / 2);
      geo.scale(scale, scale, scale);
      geo.computeVertexNormals();
      const n = geo.attributes.position.count;
      // Unpack into one (muscle id, weight) slot per channel.
      const ids = new Float32Array(n * 4);
      const weights = new Float32Array(n * 4);
      for (const src of [geo.attributes._muscle, geo.attributes._muscle2]) {
        for (let i = 0; i < n; i++) {
          const packed = src.getX(i);
          const id = Math.floor(packed + 1e-4);
          const w = Math.min(1, (packed - id) / 0.98);
          if (!id || w <= 0) continue;
          const slot = i * 4 + CHANNEL[MUSCLES[id]];
          if (w > weights[slot]) { ids[slot] = id; weights[slot] = w; }
        }
      }
      geo.deleteAttribute('_muscle');
      geo.deleteAttribute('_muscle2');
      geo.setAttribute('aMuscle', new THREE.BufferAttribute(ids, 4));
      geo.setAttribute('aWeight', new THREE.BufferAttribute(weights, 4));
      return { geo, ids, weights };
    });
  return modelCache[bodyType];
}

// Body material: standard shading, with each muscle region filled from a
// per-muscle palette and outlined. Fill and outline are cut where the
// interpolated weight crosses 0.5, so borders are smooth curves rather than
// following the mesh's triangles.
function makeBodyMaterial() {
  const palette = MUSCLES.map(() => new THREE.Vector4(0, 0, 0, 0)); // rgb + fill strength
  const material = new THREE.MeshStandardMaterial({ color: SKIN, roughness: 0.7, metalness: 0 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPalette = { value: palette };
    shader.uniforms.uOutline = { value: OUTLINE };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute vec4 aMuscle;
        attribute vec4 aWeight;
        uniform vec4 uPalette[${MUSCLES.length}];
        varying vec4 vWeight;
        varying vec4 vTint[4];`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vWeight = aWeight;
        for (int c = 0; c < 4; c++) vTint[c] = uPalette[int(aMuscle[c] + 0.5)] * aWeight[c];`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uOutline;
        varying vec4 vWeight;
        varying vec4 vTint[4];`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        for (int c = 0; c < 4; c++) {
          float w = vWeight[c];
          if (w < 1e-3) continue;
          float fw = max(fwidth(w), 1e-4);
          vec4 tint = vTint[c] / w;
          diffuseColor.rgb = mix(diffuseColor.rgb, tint.rgb, smoothstep(0.5 - fw, 0.5 + fw, w) * tint.a);
          float line = 1.0 - smoothstep(fw * 0.6, fw * 1.8, abs(w - 0.5));
          diffuseColor.rgb = mix(diffuseColor.rgb, mix(uOutline, tint.rgb * 0.7, tint.a), line * 0.7);
        }`);
  };
  material.userData.palette = palette;
  return material;
}

// Which muscle a tap at `point` on triangle `face` means: the muscle whose
// weight, interpolated at the tap, is inside its border — or failing that the
// closest muscle surface within TAP_SLOP.
function muscleAt(body, face, point) {
  const pos = body.geo.attributes.position;
  const tri = [face.a, face.b, face.c];
  const [a, b, c] = tri.map((i) => new THREE.Vector3().fromBufferAttribute(pos, i));
  const bary = new THREE.Triangle(a, b, c).getBarycoord(point, new THREE.Vector3()) || new THREE.Vector3(1, 0, 0);
  const sums = {};
  tri.forEach((i, k) => {
    for (let c = 0; c < 4; c++) {
      const id = body.ids[i * 4 + c];
      if (id) sums[id] = (sums[id] || 0) + bary.getComponent(k) * body.weights[i * 4 + c];
    }
  });
  let best = 0;
  let bestW = 0.5;
  for (const [id, w] of Object.entries(sums)) if (w >= bestW) { best = +id; bestW = w; }
  if (!best) {
    const v = new THREE.Vector3();
    let bestD = TAP_SLOP * TAP_SLOP;
    for (let i = 0; i < pos.count; i++) {
      for (let c = 0; c < 4; c++) {
        if (body.weights[i * 4 + c] < 0.5) continue;
        const d = v.fromBufferAttribute(pos, i).distanceToSquared(point);
        if (d < bestD) { bestD = d; best = body.ids[i * 4 + c]; }
      }
    }
  }
  return MUSCLES[best];
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
  const [loaded, setLoaded] = useState(false);
  const [touched, setTouched] = useState(false); // the hint goes away once the model has been used
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

    // Studio lighting: a low environment for fill, a strong key light from the
    // upper side so muscle definition casts shading, and a rim light from behind.
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.3;
    pmrem.dispose();
    const key = new THREE.DirectionalLight(0xffffff, 2.3);
    key.position.set(2.6, 3.2, 2.4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xdde6ff, 0.9);
    rim.position.set(-2.5, 2, -3);
    scene.add(rim);

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
      setTouched(true);
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
      if (st.mesh) st.mesh.rotation.y = st.rotY;
      if (st.zoom > 1.01) {
        st.panY += (dy * 2 * VIEW_HALF) / (st.zoom * (mount.clientHeight || 1));
        applyView();
      }
    };
    const onUp = (e) => {
      if (!pointers.delete(e.pointerId)) return;
      if (pointers.size < 2) pinch = null;
      if (pointers.size > 0 || e.type === 'pointercancel') return;
      if (moved < 6 && propsRef.current.onToggle && st.body) {
        const rect = el.getBoundingClientRect();
        const p = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1,
        );
        st.raycaster.setFromCamera(p, camera);
        const hit = st.raycaster.intersectObject(st.mesh, false)[0];
        // The hit point is in world space; the body only ever rotates, so undo that.
        const muscle = hit && muscleAt(st.body, hit.face, st.mesh.worldToLocal(hit.point.clone()));
        if (muscle) propsRef.current.onToggle(muscle);
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
      st.mesh?.material.dispose(); // the geometry is shared and cached, so it stays
      renderer.dispose();
      mount.removeChild(el);
    };
  }, []);

  // (re)load the body when bodyType changes
  useEffect(() => {
    const st = stateRef.current;
    let cancelled = false;
    loadBody(bodyType).then((body) => {
      if (cancelled) return;
      if (st.mesh) {
        st.scene.remove(st.mesh);
        st.mesh.material.dispose();
      }
      st.mesh = new THREE.Mesh(body.geo, makeBodyMaterial());
      st.mesh.rotation.y = st.rotY;
      st.scene.add(st.mesh);
      st.body = body;
      applyColors(st, propsRef.current);
      setLoaded(true);
    });
    return () => { cancelled = true; };
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
        {!loaded && !collapsed && <div className="body-model-loading">Loading body…</div>}
        {!collapsed && (
          <>
            <div className="body-model-zoom">
              <button className="icon-btn" title="Zoom in" onClick={() => zoomBy(1.4)}>+</button>
              <button className="icon-btn" title="Zoom out" disabled={!zoomed} onClick={() => zoomBy(1 / 1.4)}>−</button>
              {zoomed && (
                <button className="icon-btn" title="Reset zoom" onClick={() => stateRef.current.setZoom(1)}>reset</button>
              )}
            </div>
            {!zoomed && !touched && loaded && <div className="body-model-hint">drag to spin · pinch to zoom · tap a muscle</div>}
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
  if (!st.mesh) return;
  const sel = new Set(selected);
  // Per muscle: selected (solid red), load-shaded (light→dark red by
  // intensity), or idle (no fill, just the outline).
  st.mesh.material.userData.palette.forEach((slot, id) => {
    const name = MUSCLES[id];
    if (name && sel.has(name)) slot.set(SELECTED.r, SELECTED.g, SELECTED.b, 1);
    else if (name && highlights[name] != null) {
      const c = new THREE.Color().lerpColors(HL_LIGHT, HL_DARK, Math.min(1, highlights[name]));
      slot.set(c.r, c.g, c.b, 1);
    } else slot.set(0, 0, 0, 0);
  });
}
