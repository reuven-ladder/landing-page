// Workflow: one project, three stages (documents → quantities → reviewed estimate).
// Desktop: the visual sticks beside the steps and follows the step in view.
// Phones: the same, with the visual stuck above the steps.
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
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) set(e.target.getAttribute('data-step')); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }
})();
