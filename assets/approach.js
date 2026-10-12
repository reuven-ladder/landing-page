// Ladder approach world: one ink-drawn building, one roof assembly followed from documents to a cost decision.
// Beats: 0 intro · 1 information spread out · 2 questions need examination · 3 AI connects · 4 how we work (opaque, scene holds) · 5 professionals evaluate · 6 decision
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

const root = document.getElementById('world');
const canvas = root.querySelector('canvas');
const beats = [...document.querySelectorAll('section[data-beat]')];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); } catch (e) { renderer = null; }
if (!renderer || !renderer.getContext()) root.classList.add('no-gl');
else { root.classList.add('gl-on'); start(); }

function start() {
  const INK = new THREE.Color(0x1d1d1b), PAPER = new THREE.Color(0xf7f5ef);
  const BLUE = new THREE.Color(0x3f63d5), RED = new THREE.Color(0xd9480f), OCHRE = new THREE.Color(0xe2a23a), GREEN = new THREE.Color(0x1f9d55);
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const sm = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
  const lerp = (a, b, k) => a + (b - a) * k;
  const win = (p, a, b, c, d) => sm((p - a) / (b - a)) * (1 - sm((p - c) / (d - c)));
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

  const dpr = Math.min(devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.5, 600);
  const uTime = { value: 0 };
  const lineMats = [];

  /* ---------- materials ---------- */
  const inkVert = /* glsl */`
    varying vec3 vN; varying vec3 vW;
    void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
  const inkFrag = /* glsl */`
    uniform vec3 uPaper, uInk, uTint; uniform float uTintAmt, uOpacity, uTone, uDpr, uGlass;
    varying vec3 vN; varying vec3 vW;
    float hl(float a, float sp, float w){
      vec2 p = gl_FragCoord.xy / uDpr;
      float v = dot(p, vec2(cos(a), sin(a)));
      float d = abs(mod(v, sp) - sp * .5);
      return 1. - smoothstep(w * .5, w * .5 + .9, d);
    }
    void main(){
      vec3 L = normalize(vec3(-.45, .85, .55));
      float lit = clamp(dot(normalize(vN), L) * .5 + .5, 0., 1.);
      float dark = clamp(1. - lit + uTone, 0., 1.);
      float h = 0.;
      if (dark > .40) h = max(h, hl(.785, 6., .9) * .7);
      if (dark > .62) h = max(h, hl(-.785, 6., .9) * .7);
      if (dark > .82) h = max(h, hl(.15, 3.6, .8) * .8);
      if (uGlass > .5) {
        float band = step(.62, fract(vW.x * .16 + vW.y * .11));
        h = max(h, hl(1.05, 5., .8) * band * .55);
      }
      vec3 base = mix(uPaper, uTint, uTintAmt * .32);
      if (uGlass > .5) base = mix(base, vec3(.93, .94, .95), .5);
      vec3 col = mix(base, mix(uInk, uTint, uTintAmt * .85), h);
      gl_FragColor = vec4(col, uOpacity);
    }`;
  function inkMat(o = {}) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uPaper: { value: PAPER.clone() }, uInk: { value: INK.clone() }, uTint: { value: (o.tint || BLUE).clone() },
        uTintAmt: { value: 0 }, uOpacity: { value: 1 }, uTone: { value: o.tone || 0 }, uDpr: { value: dpr }, uGlass: { value: o.glass ? 1 : 0 }
      },
      vertexShader: inkVert, fragmentShader: inkFrag, transparent: true,
      polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1
    });
  }
  function lineMat(o = {}) {
    const m = new LineMaterial({ color: o.color || INK, linewidth: o.w || 1.25, transparent: true, opacity: o.opacity == null ? 1 : o.opacity, dashed: !!o.dashed, dashSize: o.dash || 0.35, gapSize: o.gap || 0.3, depthWrite: false });
    lineMats.push(m);
    return m;
  }

  /* ---------- part builder ---------- */
  function Part(name) {
    const geos = { fill: [], glass: [], dark: [] };
    const p = { name, group: new THREE.Group(), mats: {}, lines: null, ghost: null, anchor: new THREE.Vector3() };
    p.box = (w, h, d, x, y, z, kind = 'fill') => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); geos[kind].push(g); return p; };
    p.done = (ghost) => {
      const all = [];
      for (const k of Object.keys(geos)) {
        if (!geos[k].length) continue;
        const g = mergeGeometries(geos[k]);
        const m = inkMat({ glass: k === 'glass', tone: k === 'dark' ? 0.42 : 0 });
        p.mats[k] = m;
        p.group.add(new THREE.Mesh(g, m));
        all.push(...geos[k]);
      }
      const eg = new THREE.EdgesGeometry(mergeGeometries(all), 25);
      const lg = new LineSegmentsGeometry().fromEdgesGeometry(eg);
      p.lineMat = lineMat();
      p.lines = new LineSegments2(lg, p.lineMat);
      p.group.add(p.lines);
      if (ghost) {
        // dashed outline, slightly proud of the part: "provisional"
        p.ghostMat = lineMat({ color: OCHRE, w: 2.2, dashed: true, dash: 0.4, gap: 0.3, opacity: 0 });
        p.ghost = new LineSegments2(lg, p.ghostMat);
        p.ghost.computeLineDistances();
        p.ghost.scale.setScalar(1.012);
        p.group.add(p.ghost);
      }
      const bb = new THREE.Box3().setFromObject(p.group);
      bb.getCenter(p.anchor);
      return p;
    };
    p.setOpacity = (a) => {
      for (const k in p.mats) p.mats[k].uniforms.uOpacity.value = a;
      p.lineMat.opacity = a;
    };
    p.setTint = (amt, col) => { for (const k in p.mats) { p.mats[k].uniforms.uTintAmt.value = amt; if (col) p.mats[k].uniforms.uTint.value.copy(col); } p.lineMat.color.copy(INK).lerp(col || BLUE, amt); };
    p.setGhost = (a, col) => { if (p.ghostMat) { p.ghostMat.opacity = a; if (col) p.ghostMat.color.copy(col); p.ghost.visible = a > 0.01; } };
    return p;
  }

  /* ---------- building ---------- */
  const P = {};
  const mk = (n) => (P[n] = Part(n));
  const bld = new THREE.Group();

  const body = mk('body').box(10, 15, 7, 0, 7.5, 0);
  for (let f = 1; f <= 4; f++) body.box(10.3, 0.28, 7.3, 0, f * 3, 0);
  body.box(10.3, 0.5, 7.3, 0, 15.1, 0);
  for (let f = 0; f < 5; f++) for (let k = 0; k < 4; k++) body.box(0.14, 1.5, 0.9, 5.05, f * 3 + 1.55, -2.55 + k * 1.7, 'dark');
  body.box(10, 0.6, 0.25, 0, 15.3, -3.4).box(0.25, 0.6, 7, -4.9, 15.3, 0);
  body.done();

  const cw = mk('cw');
  cw.box(9.6, 11.7, 0.12, 0, 9.1, 3.56, 'glass');
  for (let k = 1; k < 10; k++) cw.box(0.09, 11.7, 0.22, -4.8 + k * 0.96, 9.1, 3.6);
  for (let f = 1; f < 5; f++) cw.box(9.6, 0.08, 0.22, 0, f * 3 + 1.6, 3.6);
  cw.done();

  const st = mk('store');
  for (let k = 0; k < 6; k++) st.box(1.25, 2.2, 0.12, -4.0 + k * 1.6, 1.15, 3.56, 'glass');
  st.done();

  // roof assembly: deck, tapered insulation, membrane. Explodes while it is examined.
  mk('deck').box(9.4, 0.12, 6.4, 0, 15.38, 0).done();
  mk('insul').box(9.4, 0.22, 6.4, 0, 15.55, 0).box(9.4, 0.12, 3.2, 0, 15.72, -1.6).done();
  mk('memb').box(9.4, 0.05, 6.4, 0, 15.83, 0).done(true);
  const rtu = mk('rtu').box(2.6, 1.3, 2, -1.8, 16.05, -0.6).box(2.2, 2.3, 2.2, 2.4, 16.55, -1.9);
  for (let k = 0; k < 5; k++) rtu.box(2.4, 0.05, 0.05, -1.8, 16.72, -1.4 + k * 0.4);
  rtu.done();

  const pod = mk('podium').box(8, 4.5, 5, 9, 2.25, 1).box(8.2, 0.35, 5.2, 9, 4.6, 1);
  pod.box(1.4, 0.6, 1.4, 7.5, 5.1, 0.4).box(1.4, 0.6, 1.4, 10.4, 5.1, 0.4);
  for (let k = 0; k < 4; k++) if (k !== 1 && k !== 2) pod.box(1.1, 2.2, 0.12, 6.1 + k * 1.95, 2.2, 3.56, 'glass');
  pod.box(2, 2.6, 0.12, 9, 1.3, 3.56, 'glass');
  for (let k = 0; k < 3; k++) pod.box(0.14, 1.6, 1.0, 13.05, 2.3, -0.4 + k * 1.5, 'dark');
  pod.done();

  mk('canopy').box(3.2, 0.25, 1.8, 9, 3.15, 4.4).box(0.12, 3.05, 0.12, 7.6, 1.5, 5.15).box(0.12, 3.05, 0.12, 10.4, 1.5, 5.15).done();
  mk('site').box(3.2, 0.05, 9, 9, 0.03, 9.6).done();
  for (const k in P) bld.add(P[k].group);

  // hatched ground shadow (light from front-left)
  {
    const off = new THREE.Vector2(15 * 0.53, -15 * 0.65);
    const pts = [];
    [[-5, -3.5], [5, -3.5], [5, 3.5], [-5, 3.5]].forEach(([x, z]) => { pts.push(new THREE.Vector2(x, z), new THREE.Vector2(x + off.x, z + off.y)); });
    const hull = convexHull(pts);
    const sg = new THREE.ShapeGeometry(new THREE.Shape(hull.map((v) => new THREE.Vector2(v.x, -v.y))));
    sg.rotateX(-Math.PI / 2); sg.translate(0, 0.02, 0);
    const shm = inkMat({ tone: 0.62 }); shm.uniforms.uOpacity.value = 0.55; shm.depthWrite = false;
    bld.add(new THREE.Mesh(sg, shm));
  }
  scene.add(bld);
  function convexHull(ps) {
    ps = ps.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lo = [], up = [];
    for (const p of ps) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of ps.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }

  /* ---------- ground ---------- */
  const groundMat = new THREE.ShaderMaterial({
    uniforms: { uInk: { value: INK } },
    transparent: true, depthWrite: false,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 uInk; varying vec3 vW;
      float gl(float v, float s){ float d = abs(fract(v/s - .5) - .5) * s; return 1. - smoothstep(0., fwidth(v) * 1.2, d); }
      void main(){
        float r = length(vW.xz * vec2(.55, 1.));
        float fade = 1. - smoothstep(18., 70., r);
        float g = max(gl(vW.x, 3.), gl(vW.z, 3.));
        gl_FragColor = vec4(uInk, g * .13 * fade);
      }`
  });
  groundMat.extensions = { derivatives: true };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), groundMat);
  ground.rotation.x = -Math.PI / 2; scene.add(ground);

  /* ---------- grass ---------- */
  const blocked = (x, z) => (x > -6.2 && x < 13.8 && z > -4.6 && z < 6.2) || (x > 7.1 && x < 10.9 && z > 4 && z < 15);
  const N = 16000, off = new Float32Array(N * 4);
  let n = 0;
  while (n < N) {
    const x = (rnd() - 0.5) * 140, z = (rnd() - 0.5) * 100 + 4;
    const r = Math.hypot(x * 0.55, z);
    if (rnd() < sm((r - 20) / 40) || blocked(x, z)) continue;
    off.set([x, z, 0.55 + rnd() * 1.1, rnd() * 6.283], n * 4); n++;
  }
  const blade = new THREE.InstancedBufferGeometry();
  const bp = new THREE.PlaneGeometry(0.065, 1, 1, 4); bp.translate(0, 0.5, 0);
  blade.index = bp.index; blade.attributes.position = bp.attributes.position; blade.attributes.uv = bp.attributes.uv;
  blade.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4));
  blade.instanceCount = N;
  const grassMat = new THREE.ShaderMaterial({
    uniforms: { uTime, uInk: { value: INK } }, side: THREE.DoubleSide,
    vertexShader: `attribute vec4 aOff; uniform float uTime; varying float vY;
      void main(){
        vec3 p = position; float t = uv.y; vY = t;
        p.x *= (1. - t * .85);
        float c = cos(aOff.w), s = sin(aOff.w);
        vec3 q = vec3(p.x * c, p.y * aOff.z, p.x * s);
        float w = sin(uTime * 1.3 + aOff.x * .18 + aOff.y * .11) * .5 + sin(uTime * 2.1 + aOff.w) * .2;
        q.x += (w * .35 + .12 * sin(aOff.w)) * t * t * aOff.z;
        q.z += .1 * t * t * aOff.z * cos(aOff.w);
        gl_Position = projectionMatrix * viewMatrix * vec4(q + vec3(aOff.x, 0., aOff.y), 1.);
      }`,
    fragmentShader: `uniform vec3 uInk; varying float vY; void main(){ gl_FragColor = vec4(mix(mix(uInk, vec3(.62,.62,.6), .28), vec3(.72,.72,.7), vY * .7), 1.); }`
  });
  const grass = new THREE.Mesh(blade, grassMat); grass.frustumCulled = false; scene.add(grass);

  /* ---------- trees ---------- */
  const trees = [];
  function tree(x, z, s) {
    const t = new THREE.Group(); t.position.set(x, 0, z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.16 * s, 3 * s, 6), inkMat({ tone: 0.3 }));
    trunk.position.y = 1.5 * s; t.add(trunk);
    const geo = new THREE.IcosahedronGeometry(1.7 * s, 2);
    const pa = geo.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i); const k = 1 + 0.12 * Math.sin(v.x * 3.1 + v.y * 2.3) * Math.cos(v.z * 2.7); v.multiplyScalar(k); v.y *= 1.08; pa.setXYZ(i, v.x, v.y, v.z); }
    geo.computeVertexNormals();
    const crown = new THREE.Group(); crown.position.y = 3.6 * s;
    crown.add(new THREE.Mesh(geo, inkMat()));
    const hull = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide }));
    hull.scale.setScalar(1.045); crown.add(hull);
    t.add(crown);
    const sg = new THREE.CircleGeometry(1.9 * s, 20); sg.rotateX(-Math.PI / 2); sg.scale(1.4, 1, 0.6); sg.translate(1.6 * s, 0.03, -1.2 * s);
    const sm2 = inkMat({ tone: 0.62 }); sm2.uniforms.uOpacity.value = 0.5; sm2.depthWrite = false;
    t.add(new THREE.Mesh(sg, sm2));
    t.userData.ph = rnd() * 6; scene.add(t); trees.push(t);
  }
  [[-12, 6, 1], [-9, -9, 1.2], [17, -6, 1.1], [19, 6, 1.25], [3, 12, 0.95], [-4, 15, 1.1], [15, 14, 0.9], [-26, 18, 1.2], [27, 19, 1]]
    .forEach(([x, z, s]) => tree(x, z, s));

  // walkway
  const wk = [];
  for (let z = 6; z < 15; z += 0.9) wk.push(7.4, 0.05, z, 10.6, 0.05, z);
  wk.push(7.4, 0.05, 5.6, 7.4, 0.05, 15, 10.6, 0.05, 5.6, 10.6, 0.05, 15);
  const wg = new LineSegmentsGeometry(); wg.setPositions(wk);
  scene.add(new LineSegments2(wg, lineMat({ w: 0.9, opacity: 0.55 })));

  /* ---------- documents ---------- */
  function sheetTex(id, kind) {
    const c = document.createElement('canvas'); c.width = 640; c.height = 448;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 640, 448);
    x.strokeStyle = '#1d1d1b'; x.fillStyle = '#1d1d1b';
    x.lineWidth = 3; x.strokeRect(14, 14, 612, 420);
    x.lineWidth = 2; x.strokeRect(500, 14, 126, 420);
    [90, 150, 210, 300].forEach((y) => { x.beginPath(); x.moveTo(500, y); x.lineTo(626, y); x.stroke(); });
    let fs = 34; x.font = `700 ${fs}px "JetBrains Mono", monospace`;
    while (x.measureText(id).width > 104 && fs > 16) { fs -= 2; x.font = `700 ${fs}px "JetBrains Mono", monospace`; }
    x.fillText(id, 512, 400);
    x.font = '500 14px "JetBrains Mono", monospace'; x.fillText('PROJECT SET', 512, 50); x.fillText(kind, 512, 130);
    x.lineWidth = 2.2;
    let s = id.charCodeAt(1) * 7 + id.length * 13;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const textLines = (x0, y0, n, w, gap) => { for (let i = 0; i < n; i++) x.fillRect(x0, y0 + i * gap, w * (0.55 + r() * 0.45), 5); };
    if (kind === 'ELEVATION') {
      x.strokeRect(60, 110, 380, 270);
      for (let i = 1; i < 5; i++) { x.beginPath(); x.moveTo(60, 110 + i * 54); x.lineTo(440, 110 + i * 54); x.stroke(); }
      for (let i = 1; i < 10; i++) { x.beginPath(); x.moveTo(60 + i * 38, 164); x.lineTo(60 + i * 38, 380); x.stroke(); }
    } else if (kind === 'SECTION') {
      x.strokeRect(70, 210, 360, 170); x.strokeRect(150, 170, 200, 40);
      x.setLineDash([10, 8]); x.beginPath(); x.moveTo(330, 210); x.lineTo(430, 150); x.stroke(); x.setLineDash([]);
      x.beginPath(); x.arc(380, 160, 26, 0, 6.3); x.stroke();
    } else if (kind === 'SPECIFICATION') {
      x.font = '700 22px "JetBrains Mono", monospace'; x.fillText('PART 2 · PRODUCTS', 50, 70);
      textLines(50, 100, 10, 400, 30);
    } else if (kind === 'SCHEDULE') {
      for (let i = 0; i < 9; i++) { x.beginPath(); x.moveTo(40, 70 + i * 38); x.lineTo(470, 70 + i * 38); x.stroke(); }
      [40, 120, 230, 340, 470].forEach((cx) => { x.beginPath(); x.moveTo(cx, 70); x.lineTo(cx, 374); x.stroke(); });
      x.fillRect(40, 70, 430, 38);
    } else if (kind === 'ADDENDUM') {
      x.font = '700 22px "JetBrains Mono", monospace'; x.fillText('REVISED', 50, 70);
      textLines(50, 100, 4, 400, 30);
      // revision cloud + delta
      x.strokeStyle = '#d9480f'; x.lineWidth = 3;
      x.beginPath(); for (let a = 0; a < 6.3; a += 0.42) x.arc(250 + Math.cos(a) * 150, 300 + Math.sin(a) * 60, 22, a - 1.4, a + 1.4); x.stroke();
      x.beginPath(); x.moveTo(420, 230); x.lineTo(450, 280); x.lineTo(390, 280); x.closePath(); x.stroke();
    } else if (kind === 'QUOTE') {
      x.font = '700 22px "JetBrains Mono", monospace'; x.fillText('SUPPLIER QUOTE', 50, 70);
      textLines(50, 100, 5, 260, 30);
      for (let i = 0; i < 4; i++) x.fillRect(360, 250 + i * 30, 90, 6);
      x.fillRect(50, 380, 400, 3);
    } else {
      for (let i = 0; i < 7; i++) x.strokeRect(50 + r() * 260, 60 + r() * 200, 60 + r() * 150, 40 + r() * 120);
      x.beginPath(); for (let i = 0; i < 12; i++) { const y = 60 + i * 30; x.moveTo(40, y); x.lineTo(470, y); } x.globalAlpha = 0.12; x.stroke(); x.globalAlpha = 1;
    }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  // [id, kind, x, y, z, rotY, appears at progress]
  const DOCS = [
    ['A-502', 'ROOF PLAN', -17, 9.5, 5, 0.42, 0],
    ['A-301', 'ELEVATION', -22, 14.5, 0, 0.5, 0],
    ['A-601', 'DOOR PLAN', -14.5, 16.5, -3, 0.36, 0],
    ['S-201', 'SECTION', -24.5, 7.5, 7, 0.55, 0],
    ['A-501', 'ROOF PLAN', -9, 26, -5, 0.3, 0.3],
    ['07 54 23', 'SPECIFICATION', 1.5, 29.5, -9, 0.05, 0.42],
    ['ADD. 3', 'ADDENDUM', 12, 26, -5, -0.3, 0.54],
    ['M-401', 'SCHEDULE', 22, 18, -6, -0.35, 0.66],
    ['GLAZING', 'QUOTE', 24, 9.5, 2, -0.5, 0.76],
    ['08 44 13', 'SPECIFICATION', -30, 20, -6, 0.6, 0.84],
    ['A-801', 'SCHEDULE', -24, 27, -12, 0.45, 0.88],
    ['ADD. 4', 'ADDENDUM', 17, 28, -14, -0.25, 0.96],
    ['RTU', 'QUOTE', 31, 17, -8, -0.6, 1.04],
    ['D-101', 'DEMO PLAN', -36, 10, 3, 0.7, 1.12],
    ['P-201', 'PLUMBING', -20, 30, -16, 0.3, 1.2]
  ];
  const sheets = {};
  DOCS.forEach(([id, kind, x, y, z, ry, at], i) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(-0.08, ry, 0.03 * (i % 2 ? 1 : -1));
    const shMat = new THREE.MeshBasicMaterial({ color: INK.clone(), transparent: true });
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.48), shMat);
    sh.position.set(0.22, -0.22, -0.02); g.add(sh);
    const pgMat = new THREE.MeshBasicMaterial({ map: sheetTex(id, kind), transparent: true });
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.48), pgMat));
    g.userData = { base: y, ph: i * 1.3, at, shMat, pgMat };
    scene.add(g); sheets[id] = g;
  });

  /* ---------- evidence trails (document -> curtain wall) ---------- */
  function trail(fromId, toPart, lift, col) {
    const a = sheets[fromId].position.clone(), b = toPart.anchor.clone();
    const m = a.clone().lerp(b, 0.5); m.y = Math.max(a.y, b.y) + lift;
    const curve = new THREE.QuadraticBezierCurve3(a, m, b);
    const pts = []; curve.getPoints(60).forEach((p) => pts.push(p.x, p.y, p.z));
    const lg = new LineGeometry(); lg.setPositions(pts);
    const mat = lineMat({ color: col, w: 4, dashed: true, dash: 0.05, gap: 0.55, opacity: 0 });
    const l = new Line2(lg, mat); l.computeLineDistances(); scene.add(l);
    return mat;
  }
  const EVIDENCE = ['A-501', '07 54 23', 'ADD. 3'];
  const trails = EVIDENCE.map((id) => trail(id, P.memb, 1.5, BLUE));

  /* ---------- HTML anchors ---------- */
  const ov = document.getElementById('ov');
  const anchors = [...ov.querySelectorAll('[data-at]')].map((el) => {
    const [obj, ...rest] = el.dataset.at.split('.');
    const part = rest.join('.');
    const dy = parseFloat(el.dataset.dy || 0), dx = parseFloat(el.dataset.dx || 0);
    const pos = obj === 'sheet'
      ? () => sheets[part].position.clone().add(new THREE.Vector3(dx, 2.6 + dy, 0))
      : () => P[part || obj].anchor.clone().add(P[part || obj].group.position).add(new THREE.Vector3(dx, dy, 0));
    return { el, pos };
  });
  const v3 = new THREE.Vector3();

  /* ---------- deadline panel ---------- */
  const docCount = document.getElementById('doc-count');
  let shownCount = '';

  /* ---------- camera keyframes ---------- */
  const K = [
    { p: [30, 21, 47], t: [-9.5, 7.5, 0], m: [2, 9, 0] },          // 0 intro
    { p: [30, 30, 84], t: [-12, 15, -4], m: [-2, 17, -4] },        // 1 information spread out
    { p: [24, 34, 38], t: [-7, 16, 0], m: [7, 14, 0] },            // 2 questions need examination
    { p: [14, 36, 64], t: [2, 19, -2], m: [0, 20, -2], s: -0.05 }, // 3 AI connects
    { p: [24, 34, 40], t: [-7, 16, 0], m: [0, 16, 0] },            // 4 professionals evaluate
    { p: [32, 26, 60], t: [-2, 8, 0], m: [3, 11, 0], s: -0.1 }     // 5 decision
  ];

  /* ---------- scroll ---------- */
  let target = 0, prog = 0;
  function readScroll() {
    const vc = innerHeight * 0.5;
    const cs = beats.map((b) => { const r = b.getBoundingClientRect(); return r.top + r.height / 2; });
    let p = 0;
    if (vc <= cs[0]) p = 0;
    else if (vc >= cs[cs.length - 1]) p = cs.length - 1;
    else for (let i = 0; i < cs.length - 1; i++) if (vc >= cs[i] && vc < cs[i + 1]) { p = i + (vc - cs[i]) / (cs[i + 1] - cs[i]); break; }
    target = p;
    const story = document.getElementById('story').getBoundingClientRect();
    root.classList.toggle('off', story.bottom < 0);
    document.body.dataset.beat = Math.round(p);
  }
  addEventListener('scroll', readScroll, { passive: true });

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 760 ? 44 : 30;
    camera.updateProjectionMatrix();
    lineMats.forEach((m) => m.resolution.set(w, h));
  }
  addEventListener('resize', () => { resize(); readScroll(); });
  resize(); readScroll(); prog = target;

  /* ---------- beat → scene ---------- */
  //            hero  when  today  bias  ·dept·      rules  past  people  decision
  const BX = [0,    1,    2,     3,    3.5,  4.5,  5,     6,    7,      8];
  const BY = [0,    0.4,  1,     2,    2.5,  2.5,  3,     3.6,  4,      5];
  function remap(x) {
    if (x <= BX[0]) return BY[0];
    for (let i = 0; i < BX.length - 1; i++) if (x < BX[i + 1]) return lerp(BY[i], BY[i + 1], (x - BX[i]) / (BX[i + 1] - BX[i]));
    return BY[BY.length - 1];
  }

  /* ---------- frame ---------- */
  const cp = new THREE.Vector3(), ct = new THREE.Vector3(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  const tint = new THREE.Color();
  let last = performance.now();

  function frame(now) {
    requestAnimationFrame(frame);
    if (root.classList.contains('off')) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    uTime.value += reduce ? 0 : dt;
    prog += (target - prog) * (reduce ? 1 : Math.min(1, dt * 3.2));
    // story beats (0-8) → scene progress (0-5); beat 4 is an opaque walkthrough, so the world holds still behind it
    const p = remap(prog), T = uTime.value;
    const mob = innerWidth < 760;

    // camera
    const i = Math.min(K.length - 2, Math.floor(p)), f = sm(p - i);
    cp.fromArray(K[i].p).lerp(tmpA.fromArray(K[i + 1].p), f);
    ct.fromArray(mob && K[i].m ? K[i].m : K[i].t).lerp(tmpB.fromArray(mob && K[i + 1].m ? K[i + 1].m : K[i + 1].t), f);
    cp.x += Math.sin(T * 0.13) * 0.9; cp.y += Math.sin(T * 0.17) * 0.4;
    camera.position.copy(cp); camera.lookAt(ct);
    const sh = lerp(K[i].s || 0, K[i + 1].s || 0, f) * (mob ? 0 : 1);
    camera.setViewOffset(innerWidth, innerHeight, -sh * innerWidth, 0, innerWidth, innerHeight);

    // scene weights
    const doc = win(p, 0.3, 0.8, 1.4, 1.9);         // three documents each hold part of the roof
    const q = win(p, 1.5, 2, 2.5, 3);               // build-up, quantity and allowance are open questions
    const ev = win(p, 2.5, 3, 3.6, 4.1);            // AI connects them into one scope
    const jdg = win(p, 3.5, 4, 4.6, 5.1);           // a professional corrects, reviews and compares
    const del = sm((p - 4.5) / 0.5);                // the decision
    const focus = Math.max(win(p, 1.5, 2, 4.4, 4.9), del);
    const explode = Math.max(q, jdg * 0.75);

    // documents: accumulate in beat 1, recede once the roof is the subject
    Object.entries(sheets).forEach(([id, s]) => {
      const u = s.userData;
      const inA = u.at === 0 ? 1 : sm((p - u.at) / 0.14);
      const isEv = EVIDENCE.includes(id);
      const dim = 1 - focus * (isEv ? (1 - ev) * 0.6 + del * 0.3 : 0.82);
      const a = inA * dim;
      s.visible = a > 0.01;
      s.position.y = u.base + (1 - inA) * 5 + Math.sin(T * 0.8 + u.ph) * 0.25;
      s.scale.setScalar(0.8 + 0.2 * inA);
      s.rotation.z = Math.sin(T * 0.5 + u.ph) * 0.02;
      u.pgMat.opacity = a; u.shMat.opacity = a;
      u.shMat.color.copy(INK).lerp(BLUE, isEv ? Math.max(doc, ev) : 0);
    });
    if (docCount) {
      // illustrative document count that keeps growing while the due date holds
      const g = clamp((p - 0.3) / 1.0);
      const txt = String(Math.round(lerp(38, 214, g)));
      if (txt !== shownCount) { docCount.textContent = txt; shownCount = txt; }
    }

    // roof assembly: layers lift apart while examined, ochre while open, blue once reviewed
    P.insul.group.position.y = explode * 2.4;
    P.memb.group.position.y = explode * 4.8;
    P.rtu.setOpacity(1 - explode * 0.85);
    P.rtu.group.visible = explode < 0.9;
    tint.copy(OCHRE).lerp(BLUE, Math.max(ev, jdg, del));
    ['deck', 'insul', 'memb'].forEach((k, j) => P[k].setTint(Math.max(q, ev, jdg, del * 0.8) * (0.75 + 0.25 * j / 2), tint));
    P.memb.setGhost(q * (1 - ev), OCHRE);

    trails.forEach((m, j) => { m.opacity = ev * sm((p - 2.55 - j * 0.12) / 0.25); m.dashOffset -= dt * 1.4; });

    trees.forEach((t) => { t.rotation.z = Math.sin(T * 0.7 + t.userData.ph) * 0.012; t.rotation.x = Math.sin(T * 0.5 + t.userData.ph) * 0.01; });

    // HTML anchors
    const W = innerWidth, H = innerHeight;
    camera.updateMatrixWorld();
    const vis = { doc, q };
    anchors.forEach((a) => {
      const show = vis[a.el.dataset.show] || 0;
      v3.copy(a.pos()).project(camera);
      const x = (v3.x * 0.5 + 0.5) * W, y = (-v3.y * 0.5 + 0.5) * H;
      a.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      a.el.classList.toggle('on', show > 0.5 && v3.z < 1);
    });

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
