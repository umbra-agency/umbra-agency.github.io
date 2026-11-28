/* Immobildream · la casa di via Dora
   Comportamenti comuni: apertura Umbra, etichetta dell'anteprima, testata, fotografie che si avvicinano, lingua. */
(function () {
  'use strict';
  var d = document, de = d.documentElement, b = d.body;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(pointer: coarse)').matches;
  var C = window.Casa = { reduce: reduce, coarse: coarse, lang: 'it' };
  de.classList.add('js');

  function el(t, c, h) { var e = d.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  C.el = el;
  C.$ = function (s, c) { return (c || d).querySelector(s); };
  C.$$ = function (s, c) { return [].slice.call((c || d).querySelectorAll(s)); };
  C.esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- da dove si arriva ---------- */
  var daPorta = false;
  try { var t = +sessionStorage.getItem('imm-porta'); if (t && Date.now() - t < 9000) daPorta = true; sessionStorage.removeItem('imm-porta'); } catch (e) {}
  var nointro = C.nointro = reduce || daPorta || /[?&]nointro/.test(location.search);
  C.daPorta = daPorta;

  /* ---------- apertura Umbra (stesso disegno del motore comune) ---------- */
  var hold = nointro ? 0 : 1150;
  if (hold) {
    var it = el('div', 'u-intro', '<div><i></i><b>umbra</b><small></small></div>');
    it.setAttribute('aria-hidden', 'true');
    it.querySelector('small').textContent = b.getAttribute('data-umbra') || 'anteprima riservata';
    b.appendChild(it); setTimeout(function () { it.remove(); }, 2150);
  }
  if (daPorta && !reduce) { var ar = el('div', 'arrivo'); ar.setAttribute('aria-hidden', 'true'); b.appendChild(ar); setTimeout(function () { ar.remove(); }, 1400); }
  setTimeout(function () { de.classList.add('is-in'); }, hold);
  C.hold = hold;

  /* ---------- etichetta dell'anteprima ---------- */
  (function () {
    var note = b.getAttribute('data-nota'); if (!note) return;
    var tg = el('div', 'u-tag', '<p></p><button type="button" aria-expanded="false"><i></i>Anteprima Umbra per Immobildream</button>');
    tg.querySelector('p').textContent = note;
    var tb = tg.querySelector('button'), auto = false;
    function tog(o) { tg.classList.toggle('is-open', o); tb.setAttribute('aria-expanded', o); }
    tb.setAttribute('aria-label', 'Anteprima Umbra per Immobildream: leggi la nota');
    tb.onclick = function () { auto = false; tog(!tg.classList.contains('is-open')); };
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') tog(false); });
    addEventListener('scroll', function () { if (auto && scrollY > 160) { auto = false; tog(false); } tg.classList.toggle('mini', scrollY > 240 && innerWidth < 900); }, { passive: true });
    /* si fa da parte quando si scrive o quando copre la conversazione, da telefono */
    var via = { f: false, c: false };
    function setVia() { var on = via.f || via.c; tg.classList.toggle('via', on); if (on) { auto = false; tog(false); } }
    d.addEventListener('focusin', function (e) { var x = e.target; via.f = !!(x && x.matches && x.matches('input:not([type=checkbox]):not([type=file]),textarea')); setVia(); });
    d.addEventListener('focusout', function () { via.f = false; setVia(); });
    C.tagVia = function (on) { via.c = !!on; setVia(); };
    setTimeout(function () {
      b.appendChild(tg);
      if (innerWidth > 1100 && !b.hasAttribute('data-nota-chiusa')) { auto = true; requestAnimationFrame(function () { requestAnimationFrame(function () { if (auto) tog(true); }); }); setTimeout(function () { if (auto) { auto = false; tog(false); } }, 6000); }
    }, hold + (daPorta ? 1500 : 1700));
  })();

  /* ---------- testata e stato dello scroll ---------- */
  var hero = d.querySelector('[data-apertura]'), tick = false, pars = C.$$('[data-par]');
  function run() {
    tick = false; var y = scrollY, vh = innerHeight;
    de.classList.toggle('giu', y > 24);
    if (hero) de.classList.toggle('oltre', y > hero.offsetHeight - 120);
    if (!reduce) for (var i = 0; i < pars.length; i++) {
      var r = pars[i].getBoundingClientRect();
      if (r.bottom > -80 && r.top < vh + 80) {
        var p = (r.top + r.height / 2 - vh / 2) / vh;            // -.5 … .5 mentre attraversa lo schermo
        pars[i].style.setProperty('--par', (p * (+pars[i].getAttribute('data-par') || 24)).toFixed(1) + 'px');
      }
    }
  }
  function req() { if (!tick) { tick = true; requestAnimationFrame(run); } }
  addEventListener('scroll', req, { passive: true }); addEventListener('resize', req); run();

  /* ---------- in vista ---------- */
  var vis = C.$$('.avvicina,.svela');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('vista'); io.unobserve(e.target); } }); }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    vis.forEach(function (e) { io.observe(e); });
  } else vis.forEach(function (e) { e.classList.add('vista'); });

  /* ---------- lingua: i testi inglesi stanno accanto a quelli italiani, in data-en ---------- */
  var lis = [];
  C.onLang = function (f) { lis.push(f); };
  C.t = function (it, en) { return C.lang === 'en' && en != null ? en : it; };
  var sw = C.$$('.lingua button');
  function setLang(l, silent) {
    if (l === C.lang) return; C.lang = l; de.lang = l;
    C.$$('[data-en]').forEach(function (e) {
      if (e._it == null) e._it = e.innerHTML;
      e.innerHTML = l === 'en' ? e.getAttribute('data-en') : e._it;
    });
    ['placeholder', 'aria-label', 'alt', 'content'].forEach(function (a) {
      C.$$('[data-en-' + a + ']').forEach(function (e) {
        if (e['_it' + a] == null) e['_it' + a] = e.getAttribute(a);
        e.setAttribute(a, l === 'en' ? e.getAttribute('data-en-' + a) : e['_it' + a]);
      });
    });
    sw.forEach(function (x) { x.setAttribute('aria-pressed', x.getAttribute('data-l') === l); });
    try { sessionStorage.setItem('imm-lang', l); } catch (e) {}
    if (!silent) lis.forEach(function (f) { f(l); });
  }
  C.setLang = setLang;
  if (sw.length) {
    sw.forEach(function (x) { x.onclick = function () { setLang(x.getAttribute('data-l')); }; });
    var m = /[?&]lang=(en|it)/.exec(location.search), saved = null;
    try { saved = sessionStorage.getItem('imm-lang'); } catch (e) {}
    if (m ? m[1] === 'en' : saved === 'en') setLang('en', true);
  }

  /* ---------- tra una stanza e l'altra: niente apertura Umbra, e ?nointro resta ---------- */
  var keep = /[?&]nointro/.test(location.search);
  C.$$('a[data-nav]').forEach(function (a) {
    if (keep && a.getAttribute('href').indexOf('nointro') < 0) a.setAttribute('href', a.getAttribute('href') + '?nointro');
    a.addEventListener('click', function () { try { sessionStorage.setItem('imm-porta', String(Date.now())); } catch (e) {} });
  });

  /* ---------- le strisce che scorrono di lato si raggiungono anche da tastiera ---------- */
  function strisce() {
    C.$$('.vede__l,.frasi,.voci__g').forEach(function (e) {
      if (e.scrollWidth > e.clientWidth + 4) e.setAttribute('tabindex', '0'); else e.removeAttribute('tabindex');
    });
  }
  strisce(); addEventListener('load', strisce); addEventListener('resize', strisce);

  /* ---------- pagina ripresa dalla cronologia ---------- */
  addEventListener('pageshow', function (e) { if (e.persisted) { var a = d.querySelector('.arrivo'); if (a) a.remove(); de.classList.add('is-in'); } });
})();
