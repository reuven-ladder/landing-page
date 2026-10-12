// Ladder story world: one ink-drawn site, driven by scroll.
// Beats: 0 hero (auto loop: documents → measured scope → priced estimate) · 1 three bids · 2 least complete · 3 gaps · 4 read+measure · 5 price · 6 review · 7 same building · 8 cta
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
  const BLUE = new THREE.Color(0x3f63d5), RED = new THREE.Color(0xd9480f), OCHRE = new THREE.Color(0xe2a23a);
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
    const p = { name, group: new THREE.Group(), mats: {}, lines: null, ghost: null, opacity: 1, anchor: new THREE.Vector3() };
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
        p.ghostMat = lineMat({ color: RED, w: 1.8, dashed: true, dash: 0.4, gap: 0.3, opacity: 0 });
        p.ghost = new LineSegments2(lg, p.ghostMat);
        p.ghost.computeLineDistances();
        p.group.add(p.ghost);
      }
      const bb = new THREE.Box3().setFromObject(p.group);
      bb.getCenter(p.anchor);
      return p;
    };
    p.setOpacity = (a) => {
      p.opacity = a;
      for (const k in p.mats) p.mats[k].uniforms.uOpacity.value = a;
      p.lineMat.opacity = a;
      p.group.children.forEach((c) => { if (c !== p.ghost) c.visible = a > 0.01; });
    };
    p.setTint = (amt, col) => { for (const k in p.mats) { p.mats[k].uniforms.uTintAmt.value = amt; if (col) p.mats[k].uniforms.uTint.value.copy(col); } p.lineMat.color.copy(INK).lerp(col || BLUE, amt); };
    p.setGhost = (a) => { if (p.ghostMat) { p.ghostMat.opacity = a; p.ghost.visible = a > 0.01; } };
    return p;
  }

  /* ---------- building ---------- */
  function building(ox, ghostParts = []) {
    const g = new THREE.Group(); g.position.x = ox;
    const P = {};
    const mk = (n) => (P[n] = Part(n));

    // tower body + slabs + side windows
    const body = mk('body').box(10, 15, 7, 0, 7.5, 0);
    for (let f = 1; f <= 4; f++) body.box(10.3, 0.28, 7.3, 0, f * 3, 0);
    body.box(10.3, 0.5, 7.3, 0, 15.1, 0);
    for (let f = 0; f < 5; f++) for (let k = 0; k < 4; k++) body.box(0.14, 1.5, 0.9, 5.05, f * 3 + 1.55, -2.55 + k * 1.7, 'dark');
    // parapet
    body.box(10, 0.6, 0.25, 0, 15.3, -3.4).box(0.25, 0.6, 7, -4.9, 15.3, 0);
    body.done();

    // curtain wall (front, floors 2-5)
    const cw = mk('cw');
    cw.box(9.6, 11.7, 0.12, 0, 9.1, 3.56, 'glass');
    for (let k = 1; k < 10; k++) cw.box(0.09, 11.7, 0.22, -4.8 + k * 0.96, 9.1, 3.6);
    for (let f = 1; f < 5; f++) cw.box(9.6, 0.08, 0.22, 0, f * 3 + 1.6, 3.6);
    cw.done();

    // storefront (front, ground floor)
    const st = mk('store');
    for (let k = 0; k < 6; k++) st.box(1.25, 2.2, 0.12, -4.0 + k * 1.6, 1.15, 3.56, 'glass');
    st.done();

    // roof membrane + units
    const roof = mk('roof').box(9.4, 0.06, 6.4, 0, 15.38, 0).done();
    const rtu = mk('rtu').box(2.6, 1.3, 2, -1.8, 16.05, -0.6).box(2.2, 2.3, 2.2, 2.4, 16.55, -1.9);
    for (let k = 0; k < 5; k++) rtu.box(2.4, 0.05, 0.05, -1.8, 16.72, -1.4 + k * 0.4);
    rtu.done(ghostParts.includes('rtu'));

    // podium
    const pod = mk('podium').box(8, 4.5, 5, 9, 2.25, 1).box(8.2, 0.35, 5.2, 9, 4.6, 1);
    pod.box(1.4, 0.6, 1.4, 7.5, 5.1, 0.4).box(1.4, 0.6, 1.4, 10.4, 5.1, 0.4);
    for (let k = 0; k < 4; k++) if (k !== 1 && k !== 2) pod.box(1.1, 2.2, 0.12, 6.1 + k * 1.95, 2.2, 3.56, 'glass');
    pod.box(2, 2.6, 0.12, 9, 1.3, 3.56, 'glass');
    for (let k = 0; k < 3; k++) pod.box(0.14, 1.6, 1.0, 13.05, 2.3, -0.4 + k * 1.5, 'dark');
    pod.done();

    // canopy on posts
    const can = mk('canopy').box(3.2, 0.25, 1.8, 9, 3.15, 4.4).box(0.12, 3.05, 0.12, 7.6, 1.5, 5.15).box(0.12, 3.05, 0.12, 10.4, 1.5, 5.15);
    can.done(ghostParts.includes('canopy'));

    // site paving
    const site = mk('site').box(3.2, 0.05, 9, 9, 0.03, 9.6).done(ghostParts.includes('site'));

    for (const k in P) g.add(P[k].group);

    // hatched ground shadow (light from front-left)
    const off = new THREE.Vector2(15 * 0.53, -15 * 0.65);
    const fp = [[-5, -3.5], [5, -3.5], [5, 3.5], [-5, 3.5]];
    const pts = []; fp.forEach(([x, z]) => { pts.push(new THREE.Vector2(x, z), new THREE.Vector2(x + off.x, z + off.y)); });
    const hull = convexHull(pts);
    const sh = new THREE.Shape(hull.map((v) => new THREE.Vector2(v.x, -v.y)));
    const sg = new THREE.ShapeGeometry(sh); sg.rotateX(-Math.PI / 2); sg.translate(0, 0.02, 0);
    const shm = inkMat({ tone: 0.62 }); shm.uniforms.uOpacity.value = 0.55; shm.depthWrite = false;
    const shMesh = new THREE.Mesh(sg, shm); g.add(shMesh);
    scene.add(g);
    return { g, P, shadow: shm };
  }
  function convexHull(ps) {
    ps = ps.slice().sort((a, b) => a.x - b.x || a.y - b.y);
    const cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
    const lo = [], up = [];
    for (const p of ps) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of ps.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }

  const SPREAD = 32;
  const A = building(0);
  const B = building(-SPREAD, ['rtu']);
  const Cb = building(SPREAD, ['canopy', 'site']);

  /* ---------- ground ---------- */
  const groundMat = new THREE.ShaderMaterial({
    uniforms: { uInk: { value: INK }, uPaper: { value: PAPER } },
    transparent: true, depthWrite: false,
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform vec3 uInk, uPaper; varying vec3 vW;
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
  const blocked = (x, z) => {
    for (const ox of [0, -SPREAD, SPREAD]) {
      const lx = x - ox;
      if (lx > -6.2 && lx < 13.8 && z > -4.6 && z < 6.2) return true;
      if (lx > 7.1 && lx < 10.9 && z > 4 && z < 15) return true;
    }
    return false;
  };
  const N = 22000, off = new Float32Array(N * 4);
  let n = 0;
  while (n < N) {
    const x = (rnd() - 0.5) * 170, z = (rnd() - 0.5) * 110 + 4;
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
  [[-12, 6, 1], [-9, -9, 1.2], [17, -6, 1.1], [19, 6, 1.25], [3, 12, 0.95], [-4, 15, 1.1], [15, 14, 0.9],
   [-SPREAD - 9, 5, 1], [-SPREAD + 17, 9, 1.1], [SPREAD - 9, 8, 1.05], [SPREAD + 19, 3, 1.2], [-26, 18, 1.2], [27, 19, 1]]
    .forEach(([x, z, s]) => tree(x, z, s));

  // walkway
  const wk = [];
  for (let z = 6; z < 15; z += 0.9) wk.push(7.4, 0.05, z, 10.6, 0.05, z);
  wk.push(7.4, 0.05, 5.6, 7.4, 0.05, 15, 10.6, 0.05, 5.6, 10.6, 0.05, 15);
  const wg = new LineSegmentsGeometry(); wg.setPositions(wk);
  scene.add(new LineSegments2(wg, lineMat({ w: 0.9, opacity: 0.55 })));

  /* ---------- drawing sheets ---------- */
  function sheetTex(id, kind) {
    const c = document.createElement('canvas'); c.width = 640; c.height = 448;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, 640, 448);
    x.strokeStyle = '#1d1d1b'; x.lineWidth = 3; x.strokeRect(14, 14, 612, 420);
    x.lineWidth = 2; x.strokeRect(500, 14, 126, 420);
    [90, 150, 210, 300].forEach((y) => { x.beginPath(); x.moveTo(500, y); x.lineTo(626, y); x.stroke(); });
    x.fillStyle = '#1d1d1b'; x.font = '700 34px "JetBrains Mono", monospace'; x.fillText(id, 512, 400);
    x.font = '500 14px "JetBrains Mono", monospace'; x.fillText('LADDER SET', 512, 50); x.fillText(kind, 512, 130);
    x.lineWidth = 2.2;
    let s = id.charCodeAt(2) * 7;
    const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    if (kind === 'ELEVATION') {
      x.strokeRect(60, 110, 380, 270);
      for (let i = 1; i < 5; i++) { x.beginPath(); x.moveTo(60, 110 + i * 54); x.lineTo(440, 110 + i * 54); x.stroke(); }
      for (let i = 1; i < 10; i++) { x.beginPath(); x.moveTo(60 + i * 38, 164); x.lineTo(60 + i * 38, 380); x.stroke(); }
    } else if (kind === 'SECTION') {
      x.strokeRect(70, 210, 360, 170); x.strokeRect(150, 170, 200, 40);
      x.setLineDash([10, 8]); x.beginPath(); x.moveTo(330, 210); x.lineTo(430, 150); x.stroke(); x.setLineDash([]);
      x.beginPath(); x.arc(380, 160, 26, 0, 6.3); x.stroke();
    } else {
      for (let i = 0; i < 7; i++) x.strokeRect(50 + r() * 260, 60 + r() * 200, 60 + r() * 150, 40 + r() * 120);
      x.beginPath(); for (let i = 0; i < 12; i++) { const y = 60 + i * 30; x.moveTo(40, y); x.lineTo(470, y); } x.globalAlpha = 0.12; x.stroke(); x.globalAlpha = 1;
    }
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  const sheets = {};
  [['A-501', 'ROOF PLAN', -17, 9.5, 5, 0.42], ['A-301', 'ELEVATION', -22, 14.5, 0, 0.5], ['A-601', 'DOOR PLAN', -14.5, 16.5, -3, 0.36], ['S-201', 'SECTION', -24.5, 7.5, 7, 0.55]]
    .forEach(([id, kind, x, y, z, ry], i) => {
      const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.set(-0.08, ry, 0.03 * (i % 2 ? 1 : -1));
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.48), new THREE.MeshBasicMaterial({ color: INK }));
      sh.position.set(0.22, -0.22, -0.02); g.add(sh);
      const pg = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 4.48), new THREE.MeshBasicMaterial({ map: sheetTex(id, kind) }));
      g.add(pg);
      const scan = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 0.09), new THREE.MeshBasicMaterial({ color: BLUE, transparent: true, opacity: 0 }));
      scan.position.set(-0.7, 0, 0.02); g.add(scan);
      g.userData = { base: y, ph: i * 1.3, shadow: sh, scan, page: pg };
      scene.add(g); sheets[id] = g;
    });

  /* ---------- trails (sheet -> element) ---------- */
  function trail(fromId, toPart, lift = 6) {
    const a = sheets[fromId].position.clone(), b = toPart.anchor.clone();
    const m = a.clone().lerp(b, 0.5); m.y = Math.max(a.y, b.y) + lift;
    const curve = new THREE.QuadraticBezierCurve3(a, m, b);
    const pts = []; curve.getPoints(60).forEach((p) => pts.push(p.x, p.y, p.z));
    const lg = new LineGeometry(); lg.setPositions(pts);
    const mat = lineMat({ color: OCHRE, w: 4, dashed: true, dash: 0.05, gap: 0.55, opacity: 0 });
    const l = new Line2(lg, mat); l.computeLineDistances(); scene.add(l);
    return mat;
  }
  const trails = [trail('A-501', A.P.roof), trail('A-301', A.P.cw, 3), trail('A-601', A.P.store, 2), trail('S-201', A.P.canopy, 4)];

  /* ---------- HTML anchors ---------- */
  const ov = document.getElementById('ov');
  const anchors = [...ov.querySelectorAll('[data-at]')].map((el) => {
    const [obj, part] = el.dataset.at.split('.');
    const dy = parseFloat(el.dataset.dy || 0);
    let pos;
    if (obj === 'sheet') pos = () => sheets[part].position.clone().add(new THREE.Vector3(0, 2.6 + dy, 0));
    else {
      const b = { A, B, C: Cb }[obj];
      pos = () => { const v = b.P[part].anchor.clone(); v.x += b.g.position.x; v.y += dy; return v; };
    }
    return { el, pos, vis: 0 };
  });
  const v3 = new THREE.Vector3();

  /* ---------- camera keyframes ---------- */
  const K = [
    { p: [30, 21, 47], t: [-9.5, 7.5, 0], m: [2, 9, 0] },      // 0 hero
    { p: [110, 40, 82], t: [-5, 7, 0], s: 0.12 }, // 1 three bids
    { p: [96, 30, 70], t: [6, 6, 2], s: 0.12 },   // 2 least complete
    { p: [-4, 15, 30], t: [-14, 11, 2] },        // 3 gaps (sheets)
    { p: [27, 20, 44], t: [-6, 8, 0], m: [3, 8, 1] },          // 4 read + measure
    { p: [30, 23, 50], t: [-12, 7.5, 0], m: [3, 6, 1] },       // 5 price
    { p: [28, 21, 46], t: [-12, 7.5, 0], m: [3, 6, 1] },       // 6 review
    { p: [110, 40, 82], t: [-5, 7, 0], s: 0.12 }, // 7 same building
    { p: [34, 30, 62], t: [-11, 6.5, 0], m: [2, 9, 0] }        // 8 cta
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

  /* ---------- frame ---------- */
  const cp = new THREE.Vector3(), ct = new THREE.Vector3(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3();
  let last = performance.now();
  const parts = (b, fn) => Object.values(b.P).forEach(fn);

  function frame(now) {
    requestAnimationFrame(frame);
    if (root.classList.contains('off')) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    uTime.value += reduce ? 0 : dt;
    prog += (target - prog) * (reduce ? 1 : Math.min(1, dt * 3.2));
    const p = prog, T = uTime.value;

    // camera
    const i = Math.min(K.length - 2, Math.floor(p)), f = sm(p - i);
    cp.fromArray(K[i].p).lerp(tmpA.fromArray(K[i + 1].p), f);
    const mob = innerWidth < 760;
    ct.fromArray(mob && K[i].m ? K[i].m : K[i].t).lerp(tmpB.fromArray(mob && K[i + 1].m ? K[i + 1].m : K[i + 1].t), f);
    cp.x += Math.sin(T * 0.13) * 0.9; cp.y += Math.sin(T * 0.17) * 0.4;
    camera.position.copy(cp); camera.lookAt(ct);
    const sh = lerp(K[i].s || 0, K[i + 1].s || 0, f) * (innerWidth < 760 ? 0 : 1);
    camera.setViewOffset(innerWidth, innerHeight, -sh * innerWidth, 0, innerWidth, innerHeight);

    // bidders
    const bids = Math.max(win(p, 0.45, 1, 2.25, 2.7), win(p, 6.45, 7, 8.5, 8.8));
    const missing = win(p, 1.3, 1.8, 2.5, 3);   // missing parts shown as red ghosts
    const fixed = sm((p - 6.4) / 0.6);          // after the addendum every bidder has every part
    [B, Cb].forEach((b) => {
      b.g.visible = bids > 0.01;
      b.shadow.uniforms.uOpacity.value = 0.55 * bids;
      parts(b, (pt) => {
        const isGhost = !!pt.ghost;
        pt.setOpacity(bids * (isGhost ? fixed : 1));
        pt.setGhost(isGhost ? missing * bids * (1 - fixed) : 0);
        if (isGhost) pt.setTint(win(p, 1.4, 2, 2.5, 3) * 0.6, RED);
      });
    });

    // hero loop: documents -> measured scope -> priced estimate, without scrolling
    const heroVis = 1 - sm(p / 0.6);
    const L = (T % 11) / 11;
    const hScan = win(L, 0.02, 0.08, 0.3, 0.36) * heroVis;
    const hMeas = win(L, 0.28, 0.36, 0.9, 0.97) * heroVis;
    root.classList.toggle('hero-price', win(L, 0.55, 0.6, 0.9, 0.95) * heroVis > 0.5);

    // gaps: canopy pulses red on A
    const gap = win(p, 2.5, 3, 3.6, 4.2);
    // measure: highlight A's parts one by one
    const meas = Math.max(win(p, 3.5, 4, 5.6, 6.2), hMeas);
    const hiParts = ['roof', 'cw', 'store'];
    hiParts.forEach((k, j) => A.P[k].setTint(meas * Math.max(sm((p - 3.55 - j * 0.12) / 0.3), heroVis), BLUE));
    A.P.canopy.setTint(Math.max(gap * (0.6 + 0.4 * Math.sin(T * 4)), meas * Math.max(sm((p - 3.95) / 0.3), heroVis)), RED);
    trails.forEach((m, j) => { m.opacity = meas * Math.max(sm((p - 3.55 - j * 0.12) / 0.3), heroVis); m.dashOffset -= dt * 1.4; });

    // sheets: bob, highlight on read, scan line
    const read = Math.max(win(p, 2.6, 3.2, 4.4, 5), hScan);
    Object.values(sheets).forEach((s, j) => {
      const u = s.userData;
      s.position.y = u.base + Math.sin(T * 0.8 + u.ph) * 0.25;
      s.rotation.z = Math.sin(T * 0.5 + u.ph) * 0.02;
      u.shadow.material.color.copy(INK).lerp(BLUE, read);
      s.visible = bids < 0.98;
      u.page.material.opacity = 1 - bids;
      u.page.material.transparent = bids > 0.01;
      u.shadow.visible = bids < 0.4;
      const sc = Math.max(win(p, 3.3, 3.7, 4.2, 4.6), hScan);
      u.scan.material.opacity = sc * 0.9;
      u.scan.position.y = 1.9 - ((T * 0.6 + j * 0.27) % 1) * 3.8;
    });

    trees.forEach((t) => { t.rotation.z = Math.sin(T * 0.7 + t.userData.ph) * 0.012; t.rotation.x = Math.sin(T * 0.5 + t.userData.ph) * 0.01; });

    // HTML anchors
    const W = innerWidth, H = innerHeight;
    camera.updateMatrixWorld();
    const vis = {
      bid: bids * (1 - fixed), miss: missing * (1 - fixed), gap, meas, ok: sm((p - 6.6) / 0.4) * win(p, 6.4, 7, 8.5, 8.8)
    };
    anchors.forEach((a) => {
      const show = vis[a.el.dataset.show] || 0;
      v3.copy(a.pos()).project(camera);
      const x = (v3.x * 0.5 + 0.5) * W, y = (-v3.y * 0.5 + 0.5) * H;
      const on = show > 0.5 && v3.z < 1;
      a.el.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;
      a.el.classList.toggle('on', on);
    });

    // HTML panels
    document.documentElement.style.setProperty('--bids', bids.toFixed(3));
    
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
