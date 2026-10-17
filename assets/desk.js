// Ladder · Why Ladder: an estimator's desk, seen from behind, with a scroll-driven camera.
// The scene is drawn once (rough.js pencil strokes, plain SVG if the CDN is unavailable);
// scrolling moves a 2D camera across four parallax layers and switches the screens' state.

const INK = '#1d1d1b';
const W = 1600, H = 1000;
const stage = document.getElementById('stage');
const body = document.body;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

let rough = null;
try { rough = (await import('https://cdn.jsdelivr.net/npm/roughjs@4.6.6/bundled/rough.esm.js')).default; } catch (e) { rough = null; }

/* ---------------- drawing ---------------- */
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
const hatch = (a = .5, gap = 6, angle = -41, extra) => Object.assign({ fill: `rgba(29,29,27,${a})`, fillStyle: 'hachure', hachureGap: gap, hachureAngle: angle, fillWeight: .7 }, extra);

function plain(t, a) {
  switch (t) {
    case 'rectangle': return el('rect', { x: a[0], y: a[1], width: a[2], height: a[3] });
    case 'line': return el('line', { x1: a[0], y1: a[1], x2: a[2], y2: a[3] });
    case 'ellipse': return el('ellipse', { cx: a[0], cy: a[1], rx: a[2] / 2, ry: a[3] / 2 });
    case 'circle': return el('circle', { cx: a[0], cy: a[1], r: a[2] / 2 });
    case 'path': return el('path', { d: a[0] });
    case 'polygon': return el('polygon', { points: a[0].map(p => p.join(',')).join(' ') });
    case 'linearPath': return el('polyline', { points: a[0].map(p => p.join(',')).join(' ') });
  }
}

function draw(layerId, shapes) {
  const svg = document.querySelector(`#${layerId} svg`);
  const g = svg.querySelector('g.rough');
  const rc = rough ? rough.svg(svg) : null;
  shapes.forEach((s, i) => {
    const o = Object.assign({ stroke: INK, strokeWidth: 1.6, roughness: 1.15, bowing: .9, seed: 11 + i * 17 }, s.o || {});
    const wrap = el('g', s.c ? { class: s.c } : {});
    if (s.style) wrap.setAttribute('style', s.style);
    if (s.solid) { const u = plain(s.t, s.a); u.setAttribute('class', 'solid'); wrap.appendChild(u); }
    let n;
    if (rc) n = rc[s.t](...s.a, o);
    else { n = plain(s.t, s.a); n.setAttribute('fill', s.solid ? 'none' : (o.fill ? 'rgba(29,29,27,.12)' : 'none')); n.setAttribute('stroke', o.stroke); n.setAttribute('stroke-width', o.strokeWidth); }
    wrap.appendChild(n);
    g.appendChild(wrap);
  });
}

// seeded jitter so the pile looks the same on every load
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

/* L0 · room */
const room = [
  { t: 'rectangle', a: [70, 90, 270, 300], o: { strokeWidth: 2.2 } },
  { t: 'line', a: [205, 92, 205, 388] },
  { t: 'line', a: [72, 240, 338, 240] },
  { t: 'rectangle', a: [55, 390, 300, 14], o: hatch(.45, 4) },
  // shelf + binders
  { t: 'line', a: [360, 262, 610, 262], o: { strokeWidth: 2.6 } },
  { t: 'line', a: [380, 262, 380, 284] }, { t: 'line', a: [590, 262, 590, 284] },
  // this bid's estimate, filed with the others
  { t: 'rectangle', a: [552, 168, 30, 94], o: hatch(.12, 8, 60, { strokeWidth: 1.8 }), solid: true, c: 'nb' },
  { t: 'rectangle', a: [372, 166, 26, 96], o: hatch(.35, 5, 60) },
  { t: 'rectangle', a: [402, 176, 24, 86], o: hatch(.2, 7, 60) },
  { t: 'rectangle', a: [430, 160, 30, 102], o: hatch(.45, 4, 60) },
  { t: 'rectangle', a: [464, 182, 22, 80], o: hatch(.25, 6, 60) },
  { t: 'polygon', a: [[[492, 262], [514, 262], [542, 192], [520, 184]]], o: hatch(.3, 5, 30) },
  // clock
  { t: 'circle', a: [1450, 150, 108], o: { strokeWidth: 2.4 }, solid: true },
  { t: 'circle', a: [1450, 150, 92], o: { strokeWidth: .8, roughness: .6 } },
  // pinned drawing
  { t: 'rectangle', a: [1336, 250, 150, 108], solid: true },
  { t: 'linearPath', a: [[[1352, 270], [1470, 270], [1470, 340], [1352, 340], [1352, 270]]], o: { strokeWidth: 1 } },
  { t: 'linearPath', a: [[[1352, 300], [1410, 300], [1410, 340]]], o: { strokeWidth: 1 } },
  { t: 'linearPath', a: [[[1430, 270], [1430, 318], [1470, 318]]], o: { strokeWidth: 1 } },
  { t: 'circle', a: [1344, 257, 6], o: hatch(.9, 1.5) }, { t: 'circle', a: [1478, 257, 6], o: hatch(.9, 1.5) },
  // desk
  { t: 'polygon', a: [[[140, 640], [1460, 640], [1560, 770], [40, 770]]], o: hatch(.16, 16, -12, { strokeWidth: 2.2, fillWeight: .6 }), solid: true },
  { t: 'polygon', a: [[[40, 770], [1560, 770], [1560, 802], [40, 802]]], o: hatch(.5, 4, -50, { strokeWidth: 2 }), solid: true },
  { t: 'rectangle', a: [72, 802, 26, 198], o: hatch(.45, 5) },
  { t: 'rectangle', a: [1502, 802, 26, 198], o: hatch(.45, 5) },
];
for (let k = 0; k < 12; k++) {
  const a = k / 12 * Math.PI * 2, r1 = 40, r2 = k % 3 ? 44 : 47;
  room.push({ t: 'line', a: [1450 + Math.sin(a) * r1, 150 - Math.cos(a) * r1, 1450 + Math.sin(a) * r2, 150 - Math.cos(a) * r2], o: { strokeWidth: k % 3 ? 1.2 : 2.2, roughness: .5 } });
}
draw('L0', room);
// spine labels and dust on the old binders
(function spines() {
  const g = document.querySelector('#L0 svg');
  [['2019', 385, 236], ['2020', 414, 240], ['2021', 445, 236], ['2022', 475, 244], ['2023', 517, 236]].forEach(([t, x, y]) => {
    const n = el('text', { class: 'spine', x, y, transform: `rotate(-90 ${x} ${y})` }); n.textContent = t; g.appendChild(n);
  });
  const nb = el('text', { class: 'spine nbt', x: 572, y: 250, transform: 'rotate(-90 572 250)' }); nb.textContent = 'This bid'; g.appendChild(nb);
  g.appendChild(el('path', { class: 'dust', d: 'M374 164 h22 M404 174 h20 M432 158 h26 M466 180 h18' }));
})();

// skyline in the window: towers, a crane, lit windows
(function skyline() {
  const g = document.querySelector('#L0 .skyline');
  g.appendChild(el('path', { class: 'bld', d: 'M78 382 V306 H108 V382 M114 382 V276 H146 V382 M154 382 V322 H196 V382 M212 382 V290 H238 V382 M246 382 V334 H292 V382 M298 382 V300 H332 V382' }));
  g.appendChild(el('path', { class: 'crane', d: 'M262 382 V176 M262 196 l8 -10 M262 214 l8 -10 M262 232 l8 -10 M262 250 l8 -10 M262 268 l8 -10' }));
  // the jib slews slowly, the hook trolleys along it
  const jib = el('g', { class: 'jib' });
  jib.appendChild(el('path', { class: 'crane', d: 'M232 186 H330 M262 176 L300 186 M262 176 L236 186' }));
  const hook = el('g', { class: 'hook' });
  hook.appendChild(el('path', { class: 'crane', d: 'M316 186 V214 M309 214 h14 M310 214 v8 h12 v-8' }));
  jib.appendChild(hook); g.appendChild(jib);
  [[84, 316], [94, 330], [120, 286], [134, 300], [120, 330], [162, 334], [180, 346], [218, 300], [226, 322], [254, 346], [276, 356], [306, 312], [318, 336], [134, 356]].forEach(([x, y]) => g.appendChild(el('rect', { class: 'lit', x, y, width: 6, height: 7 })));
})();

/* L1 · monitors */
draw('L1', [
  { t: 'rectangle', a: [300, 330, 400, 270], o: { strokeWidth: 2.4 } },
  { t: 'rectangle', a: [300, 589, 400, 11], o: hatch(.55, 3) },
  { t: 'polygon', a: [[[488, 600], [512, 600], [517, 640], [483, 640]]], o: hatch(.4, 4) },
  { t: 'ellipse', a: [500, 644, 130, 16], o: hatch(.45, 4), solid: true },
  { t: 'rectangle', a: [730, 290, 560, 330], o: { strokeWidth: 2.6 } },
  { t: 'rectangle', a: [730, 607, 560, 13], o: hatch(.55, 3) },
  { t: 'polygon', a: [[[996, 620], [1024, 620], [1030, 646], [990, 646]]], o: hatch(.4, 4) },
  { t: 'ellipse', a: [1010, 650, 170, 18], o: hatch(.45, 4), solid: true },
]);

/* L2 · desk objects */
const mug = (x, y, w, h, c) => [
  { t: 'path', a: [`M${x + w} ${y + h * .25} q${w * .4} 0 ${w * .4} ${h * .28} q0 ${h * .28} -${w * .4} ${h * .28}`], o: { strokeWidth: 2 }, c },
  { t: 'rectangle', a: [x, y, w, h], o: hatch(.18, 7, 80), solid: true, c },
  { t: 'ellipse', a: [x + w / 2, y, w, w * .26], o: hatch(.7, 2.5), solid: true, c },
];
const tube = (x0, y0, x1, y1, r, c) => {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L * r, ny = dx / L * r;
  return [
    { t: 'polygon', a: [[[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]], o: hatch(.14, 9, 10), solid: true, c },
    { t: 'ellipse', a: [x1, y1, r * 2, r * .9], o: { strokeWidth: 1.4 }, solid: true, c },
  ];
};
const desk = [
  // lamp
  { t: 'ellipse', a: [175, 664, 92, 18], o: hatch(.5, 3.5), solid: true },
  { t: 'path', a: ['M175 658 L212 522 L300 476'], o: { strokeWidth: 3.2 } },
  { t: 'circle', a: [212, 522, 12], o: hatch(.8, 2), solid: true },
  { t: 'polygon', a: [[[270, 452], [350, 468], [336, 506], [256, 490]]], o: hatch(.55, 3.5, 20), solid: true },
  // a cat, warm under the lamp
  { t: 'path', a: ['M300 646 q26 -2 34 -24 q6 -16 -4 -22'], o: { strokeWidth: 4, roughness: .7 }, c: 'tail' },
  { t: 'ellipse', a: [282, 640, 76, 50], o: hatch(.42, 4.5, 75), solid: true, c: 'cat' },
  { t: 'polygon', a: [[[246, 604], [250, 584], [262, 598]]], o: hatch(.6, 2.5), solid: true, c: 'cat ears' },
  { t: 'polygon', a: [[[270, 597], [282, 582], [285, 603]]], o: hatch(.6, 2.5), solid: true, c: 'cat ears' },
  { t: 'circle', a: [264, 614, 40], o: hatch(.42, 4.5, 75), solid: true, c: 'cat' },
  { t: 'ellipse', a: [262, 664, 26, 9], solid: true, c: 'cat' },
  { t: 'ellipse', a: [292, 665, 26, 9], solid: true, c: 'cat' },
  // papers
  { t: 'polygon', a: [[[420, 646], [604, 656], [596, 690], [410, 684]]], solid: true },
  { t: 'polygon', a: [[[360, 662], [562, 652], [576, 702], [350, 712]]], solid: true },
  { t: 'linearPath', a: [[[376, 676], [520, 668]]], o: { strokeWidth: 1 } },
  { t: 'linearPath', a: [[[378, 688], [490, 682]]], o: { strokeWidth: 1 } },
  { t: 'rectangle', a: [500, 674, 54, 22], o: { strokeWidth: 1 } },
  { t: 'polygon', a: [[[604, 702], [656, 690], [658, 699], [606, 711]]], o: { fill: '#FFDD64', fillStyle: 'solid', strokeWidth: 1.4 } },
  // keyboard + mouse
  { t: 'polygon', a: [[[690, 692], [1000, 692], [1012, 728], [678, 728]]], o: hatch(.22, 6, -41, { fillStyle: 'cross-hatch' }), solid: true },
  { t: 'ellipse', a: [1066, 712, 28, 38], solid: true, c: 'mouse' },
  // the first coffee
  ...mug(1150, 652, 46, 54, 'mug'),
  // rolled drawings leaning on the wall
  ...tube(1314, 642, 1334, 452, 13),
  ...tube(1350, 642, 1386, 470, 13),
  ...tube(1384, 642, 1428, 498, 12),
];
// the pile of plans: 6 base sheets and 12 that arrive with the addenda
for (let i = 0; i < 18; i++) {
  const y0 = 714 - i * 5.4, dx = (rnd() - .5) * 18, dr = (rnd() - .5) * 8;
  desk.push({
    t: 'polygon', a: [[[1308 + dx, y0 + dr], [1502 + dx, y0 - 8], [1530 + dx, y0 + 12 - dr], [1326 + dx, y0 + 22]]],
    o: { strokeWidth: 1.3, roughness: 1.4 }, solid: true, c: i < 6 ? 'sheet' : 'sheet xs', style: `--i:${i - 6}`,
  });
}
desk.push(
  ...mug(1218, 636, 40, 46, 'mug m1'),
  ...mug(596, 628, 40, 46, 'mug m2'),
  ...mug(1262, 694, 44, 50, 'mug m3'),
  { t: 'circle', a: [1124, 744, 34], o: { roughness: 2.8, strokeWidth: 1.4 }, solid: true, c: 'crum' },
  { t: 'path', a: ['M1110 740 q8 -8 16 2 q6 8 14 -4 M1114 752 q10 4 18 -4'], o: { strokeWidth: 1, roughness: 1.6 }, c: 'crum' },
  { t: 'circle', a: [430, 742, 28], o: { roughness: 2.8, strokeWidth: 1.4 }, solid: true, c: 'crum' },
  { t: 'path', a: ['M418 738 q8 -6 14 2 q6 6 12 -4'], o: { strokeWidth: 1, roughness: 1.6 }, c: 'crum' },
  { t: 'circle', a: [1238, 760, 30], o: { roughness: 2.8, strokeWidth: 1.4 }, solid: true, c: 'crum' },
);
draw('L2', desk);

/* L3 · the estimator, from behind */
draw('L3', [
  { t: 'path', a: ['M470 1000 C 478 905, 515 835, 600 806 C 650 792, 685 784, 700 772 L 742 772 C 758 784, 794 792, 846 806 C 930 836, 966 905, 974 1000 Z'], o: hatch(.2, 9, 70, { strokeWidth: 2 }), solid: true },
  { t: 'rectangle', a: [697, 728, 48, 52], o: hatch(.15, 6, 70), solid: true },
  { t: 'path', a: ['M684 780 L720 808 L756 780'], o: { strokeWidth: 1.8 } },
  { t: 'path', a: ['M880 812 C 950 826, 1004 846, 1022 846 C 1036 846, 1052 800, 1060 740 L 1082 744 C 1078 800, 1060 870, 1030 880 C 990 886, 930 872, 892 860 Z'], o: hatch(.22, 8, 60, { strokeWidth: 1.8 }), solid: true, c: 'arm-r' },
  { t: 'ellipse', a: [1071, 728, 34, 26], solid: true, c: 'arm-r' },
  { t: 'path', a: ['M572 812 C 520 826, 470 846, 470 868 C 474 888, 524 880, 560 858 C 610 818, 662 760, 704 728 L 688 712 C 642 744, 602 792, 572 812 Z'], o: hatch(.22, 8, 60, { strokeWidth: 1.8 }), solid: true, c: 'arm-n' },
  { t: 'ellipse', a: [697, 718, 34, 24], solid: true, c: 'arm-n' },
  { t: 'ellipse', a: [656, 700, 18, 34], solid: true, c: 'head' },
  { t: 'ellipse', a: [784, 700, 18, 34], solid: true, c: 'head' },
  { t: 'ellipse', a: [720, 686, 128, 150], o: hatch(.75, 3.6, 68, { strokeWidth: 2.2, fillWeight: .9 }), solid: true, c: 'head' },
  { t: 'line', a: [782, 678, 826, 628], o: { strokeWidth: 4.5, roughness: .5 }, c: 'head' },
  { t: 'line', a: [826, 628, 834, 618], o: { strokeWidth: 2, roughness: .3 }, c: 'head' },
  { t: 'path', a: ['M574 814 C 548 800, 556 772, 596 762 C 616 742, 636 722, 652 706 L 678 720 C 656 744, 636 772, 622 790 C 604 810, 592 822, 574 814 Z'], o: hatch(.22, 8, 60, { strokeWidth: 1.8 }), solid: true, c: 'arm-t' },
  { t: 'ellipse', a: [664, 702, 30, 44], solid: true, c: 'arm-t' },
  { t: 'path', a: ['M572 1000 V902 Q572 862 618 858 H852 Q898 862 898 902 V1000 Z'], o: hatch(.45, 5.5, -45, { strokeWidth: 2.2 }), solid: true },
]);

/* ---------------- camera ---------------- */
const layers = [...stage.querySelectorAll('.layer')].map(n => ({ n, d: +n.dataset.depth }));
const beats = [...document.querySelectorAll('.story .beat')];
const xs = [...stage.querySelectorAll('#L2 .xs')];

// what each beat looks at, in world units
const SHOTS = [
  { x: 240, y: 40, w: 1360, h: 960, m: { x: 250, y: 260, w: 1120, h: 740 } }, // 0 wide, from behind
  { x: 300, y: 230, w: 1280, h: 540 }, // 1 every input on the desk, tagged
  { x: 292, y: 300, w: 730, h: 330 },  // 2 the takeoff tool on the left monitor
  { x: 560, y: 80, w: 1020, h: 700 },  // 3 the night: pile, clock, coffee, bid results
  { x: 300, y: 110, w: 780, h: 520 },  // 4 the estimate is filed on the shelf
  { x: 728, y: 278, w: 566, h: 346 },  // 5 the spreadsheet, up close
  { x: 738, y: 296, w: 546, h: 316 },  // 6 Ladder: agents read
  { x: 860, y: 296, w: 424, h: 316 },  // 7 the engineer steers
  { x: 738, y: 296, w: 546, h: 316 },  // 8 the log
  { x: 0, y: 0, w: 1600, h: 1000 },    // 9 wide, morning
];

let vw = 0, vh = 0, mobile = false, keys = [], shots = [], sref = 1;
function avail(i) {
  const top = 68;
  if (mobile) return i === 0 ? { x: 12, y: vh * .56, w: vw - 24, h: vh * .42 } : { x: 12, y: top + 6, w: vw - 24, h: vh * .5 - top };
  const x0 = Math.min(620, vw * .5);
  return { x: x0, y: top + 16, w: vw - x0 - 24, h: vh - top - 32 };
}
function layout() {
  vw = innerWidth; vh = innerHeight; mobile = vw <= 760;
  sref = Math.min(vw / W, (vh - 68) / H);
  shots = SHOTS.map((s, i) => {
    const r = mobile && s.m ? s.m : s, A = avail(i);
    const S = Math.min(A.w / r.w, A.h / r.h);
    return { S, cx: r.x + r.w / 2, cy: r.y + r.h / 2, ax: A.x + A.w / 2, ay: A.y + A.h / 2 };
  });
  // scroll keys: each beat holds while its section is centred (tall sections hold longer)
  keys = beats.map((b, i) => {
    const top = b.offsetTop, h = b.offsetHeight, c = top + h / 2 - vh / 2, hold = Math.max(0, h - vh * 1.35);
    return { i, a: Math.max(0, c - hold / 2), b: Math.max(0, c + hold / 2) };
  });
  update(true);
}

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const piece = (pts, x) => { if (x <= pts[0][0]) return pts[0][1]; for (let k = 1; k < pts.length; k++) if (x <= pts[k][0]) { const [x0, y0] = pts[k - 1], [x1, y1] = pts[k]; return lerp(y0, y1, (x - x0) / (x1 - x0)); } return pts[pts.length - 1][1]; };

// position along the story: integer while a beat holds, fractional between beats
function where(y) {
  for (let k = 0; k < keys.length; k++) {
    const K = keys[k];
    if (y <= K.a) { if (k === 0) return { pc: 0, sub: 0 }; const P = keys[k - 1]; return { pc: k - 1 + (y - P.b) / (K.a - P.b), sub: 1 }; }
    if (y <= K.b) return { pc: k, sub: K.b > K.a ? (y - K.a) / (K.b - K.a) : 0 };
  }
  return { pc: keys.length - 1, sub: 1 };
}

let cam = null, target = null, raf = 0, lastBeat = -1, lastStep = 0;
function camAt(pc) {
  const i = Math.floor(pc), t = ease(clamp(pc - i)), A = shots[Math.min(i, shots.length - 1)], B = shots[Math.min(i + 1, shots.length - 1)];
  return { S: Math.exp(lerp(Math.log(A.S), Math.log(B.S), t)), cx: lerp(A.cx, B.cx, t), cy: lerp(A.cy, B.cy, t), ax: lerp(A.ax, B.ax, t), ay: lerp(A.ay, B.ay, t) };
}
function apply(c) {
  const z = c.S / sref;
  for (const L of layers) {
    const k = c.S * Math.pow(Math.max(z, 1), L.d - 1);
    const px = c.cx + (c.cx - 800) * (L.d - 1) * .6, py = c.cy + (c.cy - 640) * (L.d - 1) * .6;
    L.n.style.transform = `translate(${c.ax}px,${c.ay}px) scale(${k}) translate(${-px}px,${-py}px)`;
  }
  layers[3].n.style.opacity = 1 - ease(clamp((z - 1.2) / .55));
  layers[2].n.style.opacity = 1 - ease(clamp((z - 2) / .3)); // the lamp would poke into the close-up of the left monitor
}
function tick() {
  raf = 0;
  const f = reduce ? 1 : .13;
  let moving = false;
  for (const k in target) {
    const d = target[k] - cam[k];
    cam[k] += d * f;
    if (Math.abs(d) > (k === 'S' ? 1e-4 : .05)) moving = true; else cam[k] = target[k];
  }
  apply(cam);
  if (moving) raf = requestAnimationFrame(tick);
}

/* ---------------- story state ---------------- */
const hh = document.getElementById('hh'), mh = document.getElementById('mh');
const sky = stage.querySelector('.sky'), pg = document.getElementById('pg'), pgs = document.getElementById('pgs'), pdfName = document.getElementById('pdf-name');
const mix = (a, b, t) => '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
const toasts = [...stage.querySelectorAll('.toast')];
const steps = [...document.querySelectorAll('.steps li')];

function story(pc, sub) {
  const night = piece([[0, .35], [1, .5], [2, .72], [3, 1], [5.4, 1], [6, 0]], pc);
  stage.style.setProperty('--night', night.toFixed(3));
  stage.style.setProperty('--wall', mix([250, 250, 247], [226, 225, 217], night));
  sky.style.fill = pc > 5.5 ? mix([223, 234, 243], [46, 58, 88], night) : mix([236, 214, 182], [31, 42, 68], clamp((night - .35) / .65));

  // the clock runs from early evening to the small hours, then on to the next morning
  const min = piece([[0, 1120], [1, 1170], [2, 1275], [3, 1430], [4, 1500], [5, 1570], [5.4, 1590], [6, 2010], [9, 2100]], pc);
  hh.setAttribute('transform', `rotate(${(min / 60 % 12) * 30} 1450 150)`);
  mh.setAttribute('transform', `rotate(${(min % 60) * 6} 1450 150)`);

  const late = pc < 5.65;
  const cls = stage.classList;
  cls.toggle('m1', late && pc > 1.6); cls.toggle('m2', late && pc > 2.5); cls.toggle('m3', late && pc > 3.3);
  cls.toggle('crums', late && pc > 3.2);
  cls.toggle('tired', pc > 2.85 && pc < 5.6);
  cls.toggle('tags', pc > .6 && pc < 1.4);
  cls.toggle('filed', pc > 3.7 && late);
  cls.toggle('past-rfi', pc > 1.55 && late);
  cls.toggle('missed-rfi', pc > 1.85 && late);
  cls.toggle('grown', pc > 2.55 && late);
  cls.toggle('ref', pc > 3.3 && late);
  cls.toggle('nr', pc > 3.5 && pc < 4.2);
  cls.toggle('ladder', pc >= 5.65);
  cls.toggle('day', pc >= 5.65);

  const extra = late ? Math.round(clamp((pc - 2.3) / 1.4) * xs.length) : 0;
  xs.forEach((n, k) => n.classList.toggle('on', k < extra));
  toasts.forEach((n, k) => n.classList.toggle('on', late && pc > 2.5 + k * .11));

  const docs = Math.round(piece([[2.5, 38], [3.8, 212]], pc));
  if (pc > 2.6 && late) { pdfName.textContent = 'Set_ADD4_combined.pdf'; pg.textContent = Math.round(piece([[2.6, 12], [3.8, 41]], pc)); pgs.textContent = docs; }
  else { pdfName.textContent = 'A-101_concept.pdf'; pg.textContent = '1'; pgs.textContent = '3'; }

  // the walkthrough inside Ladder: four steps across the tall beat
  const beat = Math.round(pc);
  const step = beat < 6 ? 1 : beat === 6 ? 1 + Math.min(1, Math.floor(sub * 2)) : beat === 7 ? 3 + Math.min(1, Math.floor(sub * 2)) : 4;
  if (beat !== lastBeat) { body.dataset.beat = beat; lastBeat = beat; }
  const view = beat <= 6 ? 'sheets' : beat === 7 ? (step < 4 ? 'sheets' : 'est') : beat === 8 ? 'log' : 'est';
  if (stage.dataset.view !== view) stage.dataset.view = view;
  if (step !== lastStep) { stage.dataset.step = step; steps.forEach(li => li.classList.toggle('on', +li.dataset.s === step)); lastStep = step; }
}

function update(jump) {
  if (!keys.length) return;
  const { pc, sub } = where(scrollY);
  story(pc, sub);
  target = camAt(pc);
  if (!cam || jump) { cam = { ...target }; apply(cam); return; }
  if (!raf) raf = requestAnimationFrame(tick);
}

// the takeoff counter clicks on while the takeoff beat is at rest
const tkN = document.getElementById('tk-n'), tkM = [...stage.querySelectorAll('.tk-m circle')];
let tk = 0;
setInterval(() => {
  if (body.dataset.beat !== '2' || stage.classList.contains('scrolling') || reduce) return;
  tk = (tk + 1) % tkM.length;
  tkM.forEach((c, k) => c.classList.toggle('on', k <= tk));
  tkN.textContent = 79 + tk;
}, 750);

// ambient motion (clock, clouds, the estimator working) plays only while the page is at rest
let restT = 0;
addEventListener('scroll', () => {
  update(false);
  stage.classList.add('scrolling');
  clearTimeout(restT);
  restT = setTimeout(() => stage.classList.remove('scrolling'), 220);
}, { passive: true });
addEventListener('resize', layout);
document.fonts && document.fonts.ready.then(layout);
layout();
stage.classList.add('ready');
