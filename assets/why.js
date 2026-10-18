// Why Ladder: the whole story as one GSAP timeline, played by scrolling.
// The desk is drawn into a single canvas from pre-rendered sprites; the monitors show real captures of
// the spreadsheet and of Ladder. The room is alive on its own (clock, sky, crane, cat, steam, the
// estimator, the screens), so the canvas redraws every frame while the story is on screen.
// The chapter text scrolls natively beside the scene (in a band below it on phones). Each chapter plays
// while its text is held in place; the camera moves while one text hands over to the next.
// The playhead glides toward the scroll position, so a fast flick still plays as one motion.
// Lenis smooths the mouse wheel only; touch scrolling stays native. No scroll hijacking, no snapping.
(function () {
  if (!window.gsap) return;
  const W = 1600, H = 1000, TOP = 68;
  const stage = document.getElementById('stage'), story = document.getElementById('story');
  const canvas = stage.querySelector('canvas'), ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = s => stage.querySelector(s), $$ = s => [...stage.querySelectorAll(s)];

  /* ---------- sprites: [x, y, w, h] in scene coordinates ---------- */
  const SPR = {
    room: [35.5, 85.5, 1529.5, 914.5], desk: [127, 443, 1410.5, 296.5], mug1: [1213, 627.5, 64.5, 59], mug2: [591.5, 618.5, 66, 60],
    mug3: [1258, 683, 70, 66], crum: [414, 724, 842, 54.5], pile: [1298, 609, 244.5, 98], tail: [297.5, 595.5, 43.5, 54.5],
    person: [464.5, 702.5, 515, 297.5], head: [643, 602.5, 194, 165.5], armr: [875.5, 711, 214.5, 174],
  };
  const SCR = ['xl', 'app-read', 'app-cov', 'app-sheets', 'app-est', 'app-log'];
  const MAIN = [744, 304, 532, 302], LEFT = [312, 342, 376, 246];
  const base = document.querySelector('link[href*="why.css"]').href.replace(/why\.css.*$/, 'why/');
  const img = {};
  [...Object.keys(SPR), ...SCR, 'left-spec', 'left-after'].forEach(n => { const i = new Image(); i.decoding = 'async'; i.onload = () => { img[n] = i; }; i.src = base + n + '.webp'; });
  const sprite = n => { const s = SPR[n], i = img[n]; if (i) ctx.drawImage(i, s[0], s[1], s[2], s[3]); };

  /* ---------- camera shots, in scene coordinates ---------- */
  const SHOT = {
    WIDE: { x: 100, y: 40, w: 1400, h: 960 }, JOB: { x: 40, y: 90, w: 1520, h: 900 },
    DEAD: { x: 600, y: 110, w: 960, h: 640 }, BIAS: { x: 290, y: 250, w: 1010, h: 420 },
    APP: { x: 734, y: 294, w: 552, h: 322 }, MON: { x: 690, y: 200, w: 640, h: 520 },
    ENG: { x: 430, y: 300, w: 900, h: 700 }, SIGN: { x: 560, y: 180, w: 860, h: 680 },
    SHELF: { x: 330, y: 100, w: 640, h: 440 },
  };
  const cam = r => ({ cx: r.x, cy: r.y, cw: r.w, ch: r.h });

  // everything the timeline animates; render() reads it
  const u = { ...cam(SHOT.WIDE), night: 0, scr: 0, left: 0, m1: 0, m2: 0, m3: 0, pile: 0, crum: 0,
    t0: 0, t1: 0, t2: 0, t3: 0, t4: 0, t5: 0, t6: 0, n0: 0, n1: 0, n2: 0, q0: 0, q1: 0, q2: 0, q3: 0, q4: 0, b0: 0, b1: 0, b2: 0,
    rd: 0, cnt: 0, cov: 0, cfix: 0, dA: 0, dB: 0, link: 0, flag: 0, bub: 0, type: 0, reply: 0, num: 0, count: 0, by: 0, dec: 0,
    sig: 0, k0: 0, k1: 0, k2: 0, trail: 0, stamp: 0, fx0: 0, fx1: 0, next: 0, d0: 0, d1: 0, d2: 0 };
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.inOut' } });
  const pop = (k, at, d = .35, ease = 'back.out(1.6)') => tl.to(u, { [k]: 1, duration: d, ease }, at);
  const out = (ks, at, d = .3) => tl.to(u, Object.assign({ duration: d, ease: 'power1.in' }, ...ks.map(k => ({ [k]: 0 }))), at);
  const move = (r, at, d = .8) => tl.to(u, { ...cam(r), duration: d }, at);
  const to = (k, v, at, d = .35, ease = 'power2.inOut') => tl.to(u, { [k]: v, duration: d, ease }, at);

  // the story, in timeline seconds. Each chapter starts at its section's data-t.
  // 01 · the job: a dozen sources around one desk
  move(SHOT.JOB, 1.2);
  ['t0', 't1', 't2', 't3', 't4', 't5'].forEach((k, i) => pop(k, 1.7 + i * .18));
  // 02 · under deadline: night falls, coffee and addenda pile up
  out(['t0', 't1', 't2', 't3', 't4', 't5'], 3.4);
  move(SHOT.DEAD, 3.45, .75);
  to('night', .5, 3.4, 2.4, 'none');
  pop('n0', 4.0); pop('n1', 4.15); pop('n2', 4.3);
  pop('m1', 4.2, .4, 'power2.out'); pop('m2', 4.7, .4, 'power2.out'); pop('m3', 5.2, .4, 'power2.out');
  to('pile', 1, 4.4, 1, 'none');
  ['q0', 'q1', 'q2', 'q3', 'q4'].forEach((k, i) => pop(k, 4.4 + i * .28, .3, 'power3.out'));
  // 03 · the human limit: the shortcuts, on the spreadsheet itself
  out(['n0', 'n1', 'n2', 'q0', 'q1', 'q2', 'q3', 'q4'], 5.8);
  move(SHOT.BIAS, 5.85, .7);
  to('night', .85, 5.8, 2.2, 'none');
  pop('crum', 6.0, .4, 'power2.out');
  pop('b2', 6.5);
  move(SHOT.APP, 6.95, .7);
  pop('b0', 7.35); pop('b1', 7.6);
  // 04 · one finding, start to finish
  out(['b0', 'b1', 'b2'], 8.2);
  to('night', 0, 8.3, .8);
  out(['m1', 'm2', 'm3', 'pile', 'crum'], 8.3, .5);
  to('scr', 1, 8.4, .4);
  //   1 · the agents read the set
  pop('rd', 8.9, .4, 'power3.out'); to('cnt', 1, 9.0, .8, 'power1.out');
  out(['rd'], 9.85); to('scr', 2, 9.9, .35); pop('cov', 10.0, .4, 'power3.out'); pop('cfix', 10.3, .3, 'power2.out');
  //   2 · the spec and the door schedule disagree
  out(['cov', 'cfix'], 10.6);
  to('scr', 3, 10.65, .35); move(SHOT.MON, 10.65, .6);
  pop('dA', 10.9, .5, 'back.out(1.4)'); pop('dB', 11.05, .5, 'back.out(1.4)');
  //   3 · the openings agent flags it
  pop('link', 11.85, .45, 'power2.out'); pop('flag', 12.15, .35, 'power2.out');
  to('left', 1, 12.2, .5);
  //   4 · the engineer challenges it
  out(['dA', 'dB', 'link', 'flag'], 13.0);
  move(SHOT.ENG, 13.05);
  pop('bub', 13.65, .4); to('type', 1, 13.95, 1.1, 'none'); pop('reply', 15.3);
  //   5 · the answer changes the quantity: the engineer's call
  out(['bub', 'reply'], 15.8);
  to('scr', 4, 15.85, .35); move(SHOT.MON, 15.85, .7);
  pop('num', 16.35, .45, 'power3.out'); to('count', 1, 16.65, .7, 'power1.inOut'); pop('by', 17.4, .3, 'power2.out'); pop('dec', 17.55, .35, 'power2.out');
  //   6 · the estimate keeps the decision and its basis
  out(['num', 'by', 'dec'], 17.9);
  move(SHOT.SIGN, 17.9, .7);
  pop('sig', 18.3, .45, 'power3.out');
  ['k0', 'k1', 'k2'].forEach((k, i) => pop(k, 18.55 + i * .15, .3, 'power2.out'));
  pop('trail', 19.05, .35, 'power2.out'); pop('stamp', 19.35, .3, 'back.out(2.2)');
  pop('fx0', 19.6, .3, 'power2.out'); pop('fx1', 19.75, .3, 'power2.out');
  // 05 · what carries forward: the log, then the bid filed on the shelf
  out(['sig', 'k0', 'k1', 'k2', 'trail', 'stamp', 'fx0', 'fx1'], 20.6);
  to('scr', 5, 20.65, .35); move(SHOT.APP, 20.65, .7);
  pop('next', 21.4, .4);
  out(['next'], 22.3); move(SHOT.SHELF, 22.3, .8); pop('t6', 22.9);
  // 06 · working with Ladder: what you receive
  out(['t6'], 23.6);
  move(SHOT.WIDE, 23.65, .9);
  ['d0', 'd1', 'd2'].forEach((k, i) => pop(k, 24.3 + i * .15, .4, 'back.out(1.5)'));
  tl.to({}, { duration: .8 }, 24.9);
  const STEPS = [8.2, 10.6, 11.8, 13.0, 15.8, 17.9];
  const MOVE = .45;

  /* ---------- elements ---------- */
  const el = {
    toasts: $$('.toast'), wt: $$('.wt').map(n => ({ n, x: +n.dataset.x, y: +n.dataset.y })),
    rd: $('.reading'), cnt: $('.reading .cnt'), cov: $('.cov'), cfix: $('.fr-c .fix'),
    dA: $('.ldoc.a'), dB: $('.ldoc.b'), link: $('.link i'), linkB: $('.link b'), flag: $('.flag'), bub: $('.bubble'), type: $('.bubble span'), reply: $('.reply'),
    num: $('.num'), n: $('.num .n'), by: $('.num-by'), zero: $('.num-v s'), dec: $('.dec'), sig: $('.sig'), kv: $$('.sig .kv'), trail: $('.trail'), stamp: $('.stamp'),
    fx: $$('.fixes .fix'), next: $('.next'), dl: $$('.dl'), dlBy: $('.dls-by'), steps: [...document.querySelectorAll('.fsteps li')],
  };
  // which timeline value shows each pinned thing
  let ti = 0, ni = 0, bi = 0;
  el.wt.forEach(w => { const c = w.n.classList; w.k = c.contains('tag') ? 't' + ti++ : c.contains('note') ? 'n' + ni++ : c.contains('bias') ? 'b' + bi++ : null; });
  const secs = [...story.querySelectorAll('.ch')].map(n => ({ n, tx: n.querySelector('.tx'), t: +n.dataset.t }));

  // style writes only when a value changes
  const put = (n, k, v) => { const c = n._c || (n._c = {}); if (c[k] !== v) { c[k] = v; n.style[k] = v; } };
  const show = (n, t, dy = 10, x = '') => {
    put(n, 'opacity', t.toFixed(3));
    put(n, 'visibility', t > .001 ? 'visible' : 'hidden');
    put(n, 'transform', `translate3d(0,${(dy * (1 - t)).toFixed(1)}px,0)${x}`);
  };

  /* ---------- layout: px from innerHeight; only a width change (or fonts arriving) re-lays out ---------- */
  let vw = 0, vh = 0, mobile = false, dpr = 1, sref = 1, lastW = -1, A = { x: 0, y: TOP, w: 1, h: 1 };
  let anchors = [], T = tl.duration();
  function layout(force) {
    if (!force && innerWidth === lastW) return;
    lastW = vw = innerWidth; vh = innerHeight; mobile = vw <= 760;
    dpr = Math.min(devicePixelRatio || 1, mobile ? 1.5 : 2);
    stage.style.height = vh + 'px';
    canvas.width = Math.round(vw * dpr); canvas.height = Math.round(vh * dpr);
    canvas.style.width = vw + 'px'; canvas.style.height = vh + 'px';

    // Each section = its text + a hold. While the text is held in place, the chapter plays; while one
    // text hands over to the next, the camera makes its move (the first MOVE seconds of each chapter).
    const k = vh * (mobile ? .55 : .5);
    secs.forEach(s => { s.n.style.height = ''; s.n.style.paddingTop = ''; s.tx.style.top = s.tx.style.bottom = ''; });
    secs.forEach(s => { s.th = s.tx.offsetHeight; });
    let band = 0;
    secs.forEach((s, i) => {
      const last = i === secs.length - 1;
      s.end = last ? T : secs[i + 1].t;
      s.hold = Math.max(0, s.end - s.t - (i ? MOVE : 0)) * k;
      if (mobile) {
        // pinned to the bottom of the screen; the next chapter's text pushes it up
        s.pin = vh - 12 - s.th;
        s.tx.style.bottom = '12px';
        // the intro fills the first screen, so its text is in place from the start
        // the last chapter ends the page: the bottom of the scroll is the end of the story
        s.n.style.height = Math.round((i ? s.th + (last ? 12 : 0) : Math.max(s.th, vh - TOP - 12)) + s.hold) + 'px';
        if (i > 0 && i < secs.length - 1) band = Math.max(band, s.th + 24);
      } else {
        // held at the middle of the screen
        s.pin = Math.max(TOP + 24, TOP + (vh - TOP - s.th) / 2);
        s.tx.style.top = s.pin + 'px';
        s.n.style.paddingTop = (s.pin - TOP) + 'px';
        s.n.style.height = Math.round(Math.max(s.pin - TOP + s.th, last ? vh - TOP : 0) + s.hold) + 'px';
      }
    });
    const y0 = scrollY;
    anchors = [];
    secs.forEach((s, i) => {
      s.top = s.n.getBoundingClientRect().top + y0; s.h = s.n.offsetHeight;
      const at = i ? (mobile ? s.top - s.pin : s.top - TOP) : 0;    // the moment its text settles
      anchors.push([at, i ? s.t + MOVE : 0], [at + s.hold, s.end]);
    });

    // where the scene sits: right of the text on desktop, above the text band on phones
    const col = mobile ? 0 : secs[0].n.offsetWidth;
    A = mobile ? { x: 0, y: TOP, w: vw, h: vh - TOP - Math.min(band, vh * .4) } : { x: col, y: TOP, w: vw - col - 16, h: vh - TOP };
    sref = Math.min(A.w / W, A.h / H);
    stage.style.setProperty('--ax', A.x + 'px'); stage.style.setProperty('--aw', A.w + 'px'); stage.style.setProperty('--ah', A.h + 'px');
  }

  // scroll position → story time, piecewise between the chapter anchors
  function timeAt(y) {
    if (y <= anchors[0][0]) return 0;
    for (let i = 1; i < anchors.length; i++) {
      const [a, ta] = anchors[i - 1], [b, tb] = anchors[i];
      if (y < b) return ta + (tb - ta) * (b > a ? (y - a) / (b - a) : 1);
    }
    return T;
  }
  // story time → scroll position (for tests and links)
  window.__whyY = t => { for (let i = 1; i < anchors.length; i++) { const [a, ta] = anchors[i - 1], [b, tb] = anchors[i]; if (t <= tb) return a + (b - a) * (tb > ta ? (t - ta) / (tb - ta) : 0); } return anchors[anchors.length - 1][0]; };

  /* ---------- render ---------- */
  let step = -1, cur = -1, on = true;
  function render(ms, dt) {
    const y = scrollY, target = timeAt(y);
    cur = cur < 0 || reduce ? target : cur + (target - cur) * (1 - Math.exp(-(dt || 16) / 260));
    if (Math.abs(target - cur) < .001) cur = target;
    tl.time(cur);
    if (!on) return;
    draw(reduce ? 0 : ms / 1000);

    // things pinned in the room follow the camera
    const S = scale(), cx = u.cx + u.cw / 2, cy = u.cy + u.ch / 2, ax = A.x + A.w / 2, ay = A.y + A.h / 2;
    el.wt.forEach(w => {
      // on desktop, anything the camera pushes under the text column fades out
      const sx = ax + (w.x - cx) * S, t = (w.k ? u[w.k] : 1) * (mobile ? 1 : Math.max(0, Math.min(1, (sx - A.x - 40) / 60)));
      put(w.n, 'opacity', t.toFixed(3));
      put(w.n, 'visibility', t > .001 ? 'visible' : 'hidden');
      put(w.n, 'transform', `translate3d(${sx.toFixed(1)}px,${(ay + (w.y - cy) * S + 8 * (1 - t)).toFixed(1)}px,0)`);
    });
    el.toasts.forEach((n, i) => show(n, u['q' + i], -10));

    show(el.rd, u.rd, 16);
    const c = String(Math.round(212 * u.cnt)); if (el.cnt.textContent !== c) el.cnt.textContent = c;
    show(el.cov, u.cov, 16); show(el.cfix, u.cfix, 8);
    show(el.dA, u.dA, 0, ` translateX(${(-40 * (1 - u.dA)).toFixed(1)}px)`);
    show(el.dB, u.dB, 0, ` translateX(${(40 * (1 - u.dB)).toFixed(1)}px)`);
    put(el.link, 'transform', mobile ? `scaleY(${u.link.toFixed(3)})` : `scaleX(${u.link.toFixed(3)})`);
    put(el.linkB, 'opacity', u.link.toFixed(3));
    show(el.flag, u.flag);
    show(el.bub, u.bub, 14);
    put(el.type, 'clipPath', `inset(0 ${(100 - 100 * u.type).toFixed(1)}% 0 0)`);
    show(el.reply, u.reply, -10);
    show(el.num, u.num, 16);
    const n = String(Math.round(8 * u.count)); if (el.n.textContent !== n) el.n.textContent = n;
    put(el.zero, 'opacity', Math.min(1, u.count * 3).toFixed(3));
    show(el.by, u.by, 6); show(el.dec, u.dec, 8);
    show(el.sig, u.sig, 16);
    el.kv.forEach((n, i) => show(n, u['k' + i], 8));
    show(el.trail, u.trail, 8);
    put(el.stamp, 'opacity', u.stamp.toFixed(3));
    put(el.stamp, 'transform', `rotate(-8deg) scale(${(1.6 - .6 * u.stamp).toFixed(3)})`);
    el.fx.forEach((n, i) => show(n, u['fx' + i], 8));
    show(el.next, u.next, 14);
    el.dl.forEach((n, i) => show(n, u['d' + i], 24, ` rotate(${((i - 1) * 3 * u['d' + i]).toFixed(2)}deg)`));
    show(el.dlBy, u.d2, 8);

    // the steps list follows the playhead
    const t = tl.time(), s = t < STEPS[0] - .01 ? -1 : STEPS.reduce((a, c, i) => (t >= c ? i : a), 0);
    if (s !== step) { step = s; el.steps.forEach((li, i) => { li.classList.toggle('on', i === s); li.classList.toggle('done', i < s); }); }

    // chapter text: fades as it leaves its place
    secs.forEach(c => {
      let top;
      if (mobile) top = Math.max(c.top - y, Math.min(c.top + c.h - c.th - y, c.pin));
      else top = Math.min(Math.max(c.pin, c.top + c.pin - TOP - y), c.top + c.h - c.th - y);
      const off = c.pin - top, o = off > 0 ? 1 - off / (mobile ? c.th * .8 : vh * .3) : 1 - (-off) / (mobile ? vh : vh * .6);
      put(c.tx, 'opacity', Math.max(0, Math.min(1, o)).toFixed(2));
    });
  }

  /* ---------- drawing ---------- */
  const scale = () => Math.min(A.w / u.cw, A.h / u.ch);
  const INK = '#1d1d1b', MONO = '"JetBrains Mono", ui-monospace, monospace';
  const P = d => new Path2D(d);
  const CLOUDS = [
    [P('M60 150 q6 -16 22 -12 q8 -14 24 -6 q16 -4 18 10 q12 2 8 12 h-70 q-10 -2 -2 -4z'), 70, 0],
    [P('M60 196 q5 -12 17 -9 q7 -11 19 -4 q12 -3 14 8 q9 2 6 9 h-54 q-8 -2 -2 -4z'), 95, .45],
    [P('M60 128 q4 -9 13 -7 q5 -8 14 -3 q9 -2 10 6 q7 1 5 7 h-41 q-6 -1 -1 -3z'), 120, .7],
  ];
  const BIRD = P('M0 0 q4 -4 8 0 q4 -4 8 0'), JIB = P('M232 186 H330 M262 176 L300 186 M262 176 L236 186'), HOOK = P('M316 186 V214 M309 214 h14 M310 214 v8 h12 v-8');
  const STEAM = [P('M1166 636 q-8 -14 0 -26 q8 -12 0 -26'), P('M1180 640 q-8 -14 0 -26 q8 -12 0 -26')];
  const PTR = P('M1 1 L1 15 L4.5 11.5 L7 17 L9.5 16 L7 10.5 L11.5 10.5 Z');
  const LIT = [[84, 316], [94, 330], [120, 286], [134, 300], [120, 330], [162, 334], [180, 346], [218, 300], [226, 322], [254, 346], [276, 356], [306, 312], [318, 336], [134, 356]];
  const RUNS = [[751, 439.6, 93], [751, 474.1, 93], [751, 508.7, 93]];
  const SHEETS = [[860, 356], [948, 356], [1036, 356], [860, 432], [948, 432], [1036, 432]];
  const mix = (a, b, t) => `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join()})`;
  const wave = (t, p) => .5 - .5 * Math.cos(t / p * Math.PI * 2);
  // a looping keyframe track: [[fraction, [values]], ...], eased between keys
  const keys = (t, per, ks) => {
    const f = (t % per) / per;
    for (let i = 1; i < ks.length; i++) if (f <= ks[i][0]) {
      const [a, va] = ks[i - 1], [b, vb] = ks[i], e = .5 - .5 * Math.cos((f - a) / (b - a) * Math.PI);
      return va.map((v, j) => v + (vb[j] - v) * e);
    }
    return ks[0][1];
  };
  // the clock: late afternoon, through the night, to the next morning
  const CLOCK = [[0, 1000], [3.4, 1030], [5.8, 1380], [8.2, 1530], [9.0, 1990], [26, 2100]];
  const clockAt = t => { for (let i = 1; i < CLOCK.length; i++) if (t <= CLOCK[i][0]) { const [a, va] = CLOCK[i - 1], [b, vb] = CLOCK[i]; return va + (vb - va) * (t - a) / (b - a); } return 2100; };

  function draw(now) {
    const N = u.night;
    const S = scale(), cx = u.cx + u.cw / 2, cy = u.cy + u.ch / 2, ax = A.x + A.w / 2, ay = A.y + A.h / 2, z = S / sref;
    const depth = d => {
      const k = S * Math.pow(Math.max(z, 1), d - 1), px = cx + (cx - 800) * (d - 1) * .6, py = cy + (cy - 640) * (d - 1) * .6;
      ctx.setTransform(dpr * k, 0, 0, dpr * k, dpr * (ax - px * k), dpr * (ay - py * k));
    };
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#fafaf7'; ctx.fillRect(0, 0, canvas.width, canvas.height);

    /* the window: sky, sun or moon, clouds and a bird drifting by */
    depth(1);
    ctx.save();
    ctx.beginPath(); ctx.rect(72, 92, 266, 296); ctx.clip();
    ctx.fillStyle = mix([223, 234, 243], [31, 42, 68], N); ctx.fillRect(72, 92, 266, 296);
    if (N < .99) { ctx.globalAlpha = 1 - N; ctx.fillStyle = '#FFDD64'; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(120, 140, 18, 0, 7); ctx.fill(); ctx.stroke(); }
    if (N > .01) { ctx.globalAlpha = N; ctx.fillStyle = '#f4efd9'; ctx.beginPath(); ctx.arc(292, 138, 13, 0, 7); ctx.fill(); }
    ctx.globalAlpha = .9 - N * .6; ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 1;
    CLOUDS.forEach(([p, per, ph]) => { ctx.save(); ctx.translate(-90 + 390 * ((now / per + ph) % 1), 0); ctx.fill(p); ctx.stroke(p); ctx.restore(); });
    if (N < .9) {
      const f = (now / 34) % 1;
      ctx.globalAlpha = 1 - N; ctx.lineWidth = 1.3;
      ctx.save(); ctx.translate(60 + 300 * f, 170 - 50 * f + Math.sin(now * 3) * 2); ctx.stroke(BIRD); ctx.restore();
    }
    ctx.restore();

    /* the room, the monitors and their screens */
    sprite('room');
    // lit windows in the towers, after dark
    if (N > .25) {
      ctx.fillStyle = '#FFDD64';
      LIT.forEach(([x, yy], i) => { const off = i % 3 === 0 && (now / 9 + i * .37) % 1 > .7; ctx.globalAlpha = off ? 0 : Math.min(1, N * 1.3 - .3); ctx.fillRect(x, yy, 6, 7); });
      ctx.globalAlpha = 1;
    }
    // the crane: the jib slews, the hook trolleys along it
    {
      const sl = keys(now, 26, [[0, [1]], [.45, [-.55]], [.55, [-.55]], [1, [1]]])[0], tr = -34 * wave(now, 13);
      ctx.save(); ctx.strokeStyle = INK; ctx.globalAlpha = .75; ctx.lineWidth = 1.3; ctx.lineJoin = 'round';
      ctx.translate(262, 186); ctx.scale(sl, 1); ctx.translate(-262, -186);
      ctx.stroke(JIB); ctx.translate(tr, 0); ctx.stroke(HOOK); ctx.restore();
    }
    // the clock
    {
      const min = clockAt(tl.time()), sec = Math.floor(now) % 60;
      const hand = (a, len, back, w, col) => {
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath();
        ctx.moveTo(1450 - Math.sin(a) * back, 150 + Math.cos(a) * back); ctx.lineTo(1450 + Math.sin(a) * len, 150 - Math.cos(a) * len); ctx.stroke();
      };
      hand((min / 60 % 12) / 12 * Math.PI * 2, 26, 0, 3.2, INK);
      hand((min % 60) / 60 * Math.PI * 2, 38, 0, 2.2, INK);
      if (!reduce) hand(sec / 60 * Math.PI * 2, 42, 8, 1, '#d9480f');
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(1450, 150, 3.5, 0, 7); ctx.fill();
    }
    screens(now);

    /* the desk and what piles up on it */
    depth(1.05);
    sprite('desk');
    [['pile', u.pile], ['mug1', u.m1], ['mug2', u.m2], ['mug3', u.m3], ['crum', u.crum]].forEach(([k, a]) => { if (a > .01) { ctx.globalAlpha = a; sprite(k); } });
    ctx.globalAlpha = 1;
    // the cat's tail
    {
      const r = keys(now, 4.5, [[0, [0]], [.4, [-14]], [.6, [6]], [1, [0]]])[0] * Math.PI / 180;
      ctx.save(); ctx.translate(300, 646); ctx.rotate(r); ctx.translate(-300, -646); sprite('tail'); ctx.restore();
    }
    // steam off the first coffee
    if (!reduce) {
      ctx.strokeStyle = '#7a7a74'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      STEAM.forEach((p, i) => {
        const f = ((now + i * 1.4) / 3.2) % 1;
        ctx.globalAlpha = f < .4 ? f / .4 * .7 : .7 * (1 - (f - .4) / .6);
        ctx.save(); ctx.translate(0, 6 - 20 * f); ctx.stroke(p); ctx.restore();
      });
      ctx.globalAlpha = 1;
    }

    /* the estimator: looks around, works the mouse */
    depth(1.32);
    sprite('person');
    {
      const r = keys(now, 9, [[0, [0]], [.3, [1.6]], [.55, [-.8]], [.75, [.4]], [1, [0]]])[0] * Math.PI / 180;
      ctx.save(); ctx.translate(720, 770); ctx.rotate(r); ctx.translate(-720, -770); sprite('head'); ctx.restore();
      const [mx, my] = keys(now, 3.4, [[0, [0, 0]], [.2, [3, -1.5]], [.45, [-2, 1]], [.7, [1.5, 2]], [1, [0, 0]]]);
      ctx.save(); ctx.translate(mx, my); sprite('armr'); ctx.restore();
    }

    /* evening: the room dims, the screens stay lit, the lamp glows */
    if (N > .002) {
      depth(1);
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = `rgba(120,132,180,${(N * .45).toFixed(3)})`;
      ctx.beginPath(); ctx.rect(-2000, -2000, 6000, 5000); ctx.rect(...MAIN); ctx.rect(...LEFT); ctx.fill('evenodd');
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(240, 640, 10, 240, 640, 260);
      g.addColorStop(0, `rgba(255,214,120,${(N * .35).toFixed(3)})`); g.addColorStop(1, 'rgba(255,214,120,0)');
      ctx.fillStyle = g; ctx.fillRect(-20, 380, 520, 520);
      ctx.globalCompositeOperation = 'source-over';
    }
    // desktop: the scene fades out under the text column
    if (!mobile && A.x > 0) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const g = ctx.createLinearGradient(A.x - 120, 0, A.x + 80, 0);
      g.addColorStop(0, 'rgba(250,250,247,1)'); g.addColorStop(1, 'rgba(250,250,247,0)');
      ctx.fillStyle = '#fafaf7'; ctx.fillRect(0, 0, A.x - 120, vh);
      ctx.fillStyle = g; ctx.fillRect(A.x - 120, 0, 200, vh);
    }
  }

  // the monitors: real captures, crossfaded by the story, with a little life on top
  function screens(now) {
    const [lx, ly, lw, lh] = LEFT;
    ctx.fillStyle = '#fbfbf8'; ctx.fillRect(lx, ly, lw, lh);
    if (img['left-spec'] && u.left < 1) { ctx.globalAlpha = 1 - u.left; ctx.drawImage(img['left-spec'], lx, ly, lw, lh); }
    if (img['left-after'] && u.left > 0) { ctx.globalAlpha = u.left; ctx.drawImage(img['left-after'], lx, ly, lw, lh); }
    ctx.globalAlpha = 1;
    const [x, y, w, h] = MAIN;
    ctx.fillStyle = '#fbfbf8'; ctx.fillRect(x, y, w, h);
    const i0 = Math.floor(u.scr), f = u.scr - i0;
    const layer = (i, a) => {
      if (a < .01 || !img[SCR[i]]) return;
      ctx.globalAlpha = a; ctx.drawImage(img[SCR[i]], x, y, w, h);
      if (i === 0) sheetLife(now, a); else if (i === 1) readLife(now);
      ctx.globalAlpha = 1;
    };
    layer(i0, 1); if (f > 0 && i0 + 1 < SCR.length) layer(i0 + 1, f);
  }
  function sheetLife(now, a) {
    // the caret in the formula bar, the pointer wandering, and the shortcuts once they're called out
    if (!reduce && Math.floor(now * 2) % 2) { ctx.fillStyle = INK; ctx.fillRect(899.5, 325.5, .6, 8); }
    if (!reduce && u.night < .6) {
      const [px, py] = keys(now, 9, [[0, [446, 120]], [.25, [300, 150]], [.45, [470, 200]], [.7, [380, 96]], [1, [446, 120]]]);
      ctx.save(); ctx.translate(744 + px, 304 + py); ctx.scale(.75, .75);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.fill(PTR); ctx.stroke(PTR); ctx.restore();
    }
    if (u.night > .3) {
      ctx.globalAlpha = a * Math.min(1, (u.night - .3) * 3);
      ctx.fillStyle = '#d9480f'; ctx.font = `700 7px ${MONO}`; ctx.fillText('(Not Responding)', 893, 311);
      ctx.globalAlpha = a;
    }
    [[1178, 412, u.b0], [1178, 512, u.b1]].forEach(([bx, by, t]) => { if (t > .01) { ctx.strokeStyle = `rgba(217,72,15,${t})`; ctx.lineWidth = 2; ctx.strokeRect(bx - 1, by - 1, 46, 21); } });
  }
  function readLife(now) {
    // the trade agents at work: progress running, each sheet scanned
    ctx.fillStyle = '#3F63D5';
    RUNS.forEach(([rx, ry, rw], i) => {
      const f = ((now / 1.5) + i / 3) % 1, x0 = Math.max(rx, rx + rw * (-.38 + 1.38 * f)), x1 = Math.min(rx + rw, rx + rw * (1.38 * f));
      if (x1 > x0) ctx.fillRect(x0, ry, x1 - x0, 2.5);
    });
    SHEETS.forEach(([sx, sy], i) => {
      const f = ((now / 2.2) + i * .17) % 1;
      ctx.fillStyle = 'rgba(63,99,213,.14)'; ctx.fillRect(sx + 1, sy + 1 + 64 * f, 80, 4);
      ctx.fillStyle = 'rgba(63,99,213,.7)'; ctx.fillRect(sx + 1, sy + 4 + 64 * f, 80, .8);
    });
  }

  /* ---------- scroll: Lenis for the wheel (touch stays native) ---------- */
  const lenis = window.Lenis && !reduce ? new Lenis({ lerp: .12, smoothWheel: true, anchors: true }) : null;
  window.__lenis = lenis;
  gsap.ticker.lagSmoothing(0);
  if (lenis) gsap.ticker.add(t => lenis.raf(t * 1000));

  layout(true);
  if (document.fonts) document.fonts.ready.then(() => layout(true));
  addEventListener('resize', () => layout());
  gsap.ticker.add((t, dt) => render(t * 1000, dt));

  // the stage hides (and stops drawing) once the story has scrolled away
  const io = new IntersectionObserver(([e]) => { on = e.isIntersecting; stage.classList.toggle('off', !on); });
  io.observe(story);
})();
