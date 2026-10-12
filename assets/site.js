(function () {
  // Sticky header state
  var header = document.querySelector('.site-header');
  function onScroll() { if (header) header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile nav
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }
    });
  }

  // Reveal on scroll
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  // Logo marquee: duplicate track for a seamless loop
  document.querySelectorAll('.marquee-track').forEach(function (t) {
    Array.prototype.slice.call(t.children).forEach(function (c) {
      var d = c.cloneNode(true); d.setAttribute('aria-hidden', 'true'); t.appendChild(d);
    });
  });

  // Forms -> Formspree
  document.querySelectorAll('form[data-formspree]').forEach(function (form) {
    var box = form.closest('.form');
    var submit = form.querySelector('button[type="submit"]');
    function sync() { if (submit) submit.disabled = false; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var btn = form.querySelector('button[type="submit"]');
      var label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
      if (box) box.classList.remove('failed');
      fetch(form.getAttribute('data-formspree'), {
        method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }
      }).then(function (r) {
        if (!r.ok) throw new Error('bad status');
        if (box) box.classList.add('sent');
        if (window.gtag) window.gtag('event', 'generate_lead', { form_id: form.id || 'form' });
      }).catch(function () {
        if (box) box.classList.add('failed');
      }).then(function () {
        if (btn) { btn.innerHTML = label; sync(); }
      });
    });
  });

  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
