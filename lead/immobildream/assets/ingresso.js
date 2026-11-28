/* Immobildream · l'ingresso
   Le porte si aprono al passaggio del mouse. Al clic (o al tocco) si spalancano e si entra: la facciata si avvicina fino a riempire lo schermo. */
(function () {
  'use strict';
  var C = window.Casa, d = document, sc = d.getElementById('facciata'), velo = d.getElementById('velo');
  var porte = C.$$('[data-porta]'), andando = false;
  var keep = /[?&]nointro/.test(location.search);
  if (keep) C.$$('a[href$="/"]').forEach(function (a) { if (!/^https?:/.test(a.getAttribute('href'))) a.setAttribute('href', a.getAttribute('href') + '?nointro'); });

  function entra(p) {
    if (andando) return; andando = true;
    var href = p.href;
    try { sessionStorage.setItem('imm-porta', String(Date.now())); } catch (e) {}
    if (C.reduce || !sc.animate) { location.href = href; return; }
    p.classList.add('aperta');
    var apre = 620;                                         // il tempo di vedere le ante che si spalancano
    var v = p.querySelector('.porta__vano').getBoundingClientRect();
    var s = Math.max(innerWidth / v.width, innerHeight / v.height) * 1.06;
    var cx = v.left + v.width / 2, cy = v.top + v.height * .46;
    sc.style.transformOrigin = cx + 'px ' + (cy + scrollY) + 'px';
    sc.style.willChange = 'transform';
    sc.animate([{ transform: 'none' }, { transform: 'translate(' + (innerWidth / 2 - cx) + 'px,' + (innerHeight / 2 - cy) + 'px) scale(' + s + ')' }],
      { duration: 1250, delay: apre, easing: 'cubic-bezier(.62,0,.3,1)', fill: 'forwards' });
    velo.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, delay: apre + 880, easing: 'ease-in', fill: 'forwards' });
    setTimeout(function () { location.href = href; }, apre + 1320);
  }
  porte.forEach(function (p) {
    p.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button) return;
      e.preventDefault(); entra(p);
    });
  });
  /* tornando indietro la facciata è di nuovo chiusa */
  addEventListener('pageshow', function (e) {
    if (!e.persisted) return; andando = false;
    porte.forEach(function (p) { p.classList.remove('aperta'); });
    (sc.getAnimations ? sc.getAnimations() : []).concat(velo.getAnimations ? velo.getAnimations() : []).forEach(function (a) { a.cancel(); });
    sc.style.willChange = '';
  });
})();
