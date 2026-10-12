// "How we work" walkthrough: agents examine → findings gather → engineer sends a check back → estimate line.
// Four 5-second steps on a loop while in view. Lines are drawn between cards from their live positions.
(function () {
  var stage = document.getElementById('hww');
  var svg = document.getElementById('hww-lines');
  if (!stage || !svg) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var STEP_MS = 5000;

  // [from, to, step it appears on, style]
  var LINES = [
    ['d-a501', 'a-env', 1, 'in'], ['d-m401', 'a-mep', 1, 'in'], ['d-add3', 'a-mep', 1, 'in'],
    ['d-spec', 'a-int', 1, 'in'], ['d-a601', 'a-int', 1, 'in'],
    ['a-env', 'f1', 2, 'up'], ['a-mep', 'f2', 2, 'up'], ['a-int', 'f3', 2, 'up bad'],
    ['q1', 'a-int', 3, 'back'], ['a-int', 'd-a601', 3, 'back late'], ['a-int', 'd-g101', 3, 'back late'],
    ['a-int', 'f4', 3, 'up ret'],
    ['f4', 'e1', 4, 'out']
  ];
  var NS = 'http://www.w3.org/2000/svg';
  var paths = LINES.map(function (l) {
    var p = document.createElementNS(NS, 'path');
    p.setAttribute('class', 'ln ' + l[3]);
    p.dataset.step = l[2];
    svg.appendChild(p);
    return p;
  });

  function draw() {
    var box = stage.getBoundingClientRect();
    svg.setAttribute('viewBox', '0 0 ' + box.width + ' ' + box.height);
    LINES.forEach(function (l, i) {
      var a = document.getElementById(l[0]).getBoundingClientRect();
      var b = document.getElementById(l[1]).getBoundingClientRect();
      var rightward = b.left >= a.right - 4;
      var x1 = (rightward ? a.right : a.left) - box.left, y1 = a.top + a.height / 2 - box.top;
      var x2 = (rightward ? b.left : b.right) - box.left, y2 = b.top + b.height / 2 - box.top;
      var k = Math.max(30, Math.abs(x2 - x1) * 0.5) * (rightward ? 1 : -1);
      paths[i].setAttribute('d', 'M' + x1 + ',' + y1 + ' C' + (x1 + k) + ',' + y1 + ' ' + (x2 - k) + ',' + y2 + ' ' + x2 + ',' + y2);
    });
  }

  var step = 0, timer = null, visible = false;
  function show(n) {
    step = n;
    for (var i = 1; i <= 4; i++) stage.classList.toggle('s' + i, i <= n);
    stage.dataset.step = n;
    stage.querySelectorAll('[data-go]').forEach(function (b) {
      var g = +b.dataset.go;
      b.classList.toggle('on', g === n);
      b.classList.toggle('done', g < n);
      if (g === n) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    // restart the progress bar on the active step
    var on = stage.querySelector('[data-go].on');
    if (on) { on.classList.remove('run'); void on.offsetWidth; if (timer) on.classList.add('run'); }
    draw();
  }
  function tick() { show(step >= 4 ? 1 : step + 1); }
  function play() { if (timer || reduce) return; timer = setInterval(tick, STEP_MS); show(step || 1); }
  function stop() { clearInterval(timer); timer = null; }

  stage.querySelectorAll('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () { stop(); show(+b.dataset.go); if (visible) play(); });
  });

  if (reduce) show(4);
  else if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) { if (!step) step = 0; play(); } else stop();
    }, { threshold: 0.35 }).observe(stage);
    show(1);
  } else { show(4); }

  addEventListener('resize', draw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
})();
