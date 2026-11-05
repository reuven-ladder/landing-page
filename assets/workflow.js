// Workflow: one project, three stages (documents → quantities → reviewed estimate).
// Desktop: the visual sticks beside the steps and follows the step in view.
// Phones: the same, with the visual stuck to the bottom of the screen and the steps scrolling above it.
(function () {
  var wf = document.querySelector('.wf');
  if (!wf) return;
  var vis = wf.querySelector('.wf-vis');
  var steps = [].slice.call(wf.querySelectorAll('.wf-steps li'));

  function set(n) {
    vis.setAttribute('data-stage', n);
    steps.forEach(function (s) { s.classList.toggle('on', s.getAttribute('data-step') === String(n)); });
  }
  set(1);

  wf.querySelectorAll('[data-go]').forEach(function (b) {
    b.addEventListener('click', function () { set(b.getAttribute('data-go')); });
  });

  if ('IntersectionObserver' in window) {
    // the step is read in the middle of the space left for text: the whole screen on desktop,
    // the band above the visual on phones
    var phone = matchMedia('(max-width:960px)').matches;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) set(e.target.getAttribute('data-step')); });
    }, { rootMargin: phone ? '-25% 0px -60% 0px' : '-45% 0px -45% 0px' });
    steps.forEach(function (s) { io.observe(s); });
    // the scan line is an SVG animation that re-lays out every frame: run it only while the visual is on screen
    new IntersectionObserver(function (en) { vis.classList.toggle('in-view', en[0].isIntersecting); }).observe(vis);
  } else vis.classList.add('in-view');
})();
