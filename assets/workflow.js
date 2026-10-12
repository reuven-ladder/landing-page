// Workflow: one project, three stages (documents → quantities → reviewed estimate).
// Desktop: the visual sticks beside the steps and follows the step in view.
// Phones: each step gets its own still copy of the visual at that stage.
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

  // Phone copies: one still per step, so the process reads without scrolling tricks.
  steps.forEach(function (s) {
    var c = vis.cloneNode(true);
    c.classList.add('wf-still');
    c.setAttribute('data-stage', s.getAttribute('data-step'));
    c.removeAttribute('aria-label');
    c.setAttribute('aria-hidden', 'true');
    var tabs = c.querySelector('.wf-tabs');
    if (tabs) tabs.remove();
    s.appendChild(c);
  });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) set(e.target.getAttribute('data-step')); });
    }, { rootMargin: '-45% 0px -45% 0px' });
    steps.forEach(function (s) { io.observe(s); });
  }
})();
