/* Immobildream · l'assistente
   Motore della conversazione, comune alle due landing: fa una domanda alla volta, accetta il tocco o il testo,
   e alla fine mostra «dietro le quinte» il profilo e il punteggio che arrivano all'agenzia.
   In anteprima risponde con regole scritte da Umbra. Online, al loro posto c'è un modello AI con le domande e i criteri dell'agenzia. */
(function () {
  'use strict';
  var C = window.Casa, d = document, el = C.el, esc = C.esc;

  window.Assistente = function (o) {
    var log = o.log, form = o.form, txt = o.txt, chain = Promise.resolve(), occupato = false, gen = 0;
    function giu() { requestAnimationFrame(function () { log.scrollTop = log.scrollHeight; }); }

    function dice(html, dopo) {
      var g = gen;
      chain = chain.then(function () {
        if (g !== gen) return;
        return new Promise(function (res) {
          var m = el('div', 'msg msg--a', '<span class="punti" role="img" aria-label="' + C.t('sta scrivendo', 'typing') + '"><i></i><i></i><i></i></span>');
          log.appendChild(m); giu();
          var n = html.replace(/<[^>]+>/g, '').length;
          setTimeout(function () {
            if (g !== gen) { res(); return; }
            m.innerHTML = html; if (dopo) dopo(m); giu(); res();
          }, C.reduce ? 30 : 380 + Math.min(760, n * 6));
        });
      });
      return chain;
    }
    function utente(t) { var m = el('div', 'msg msg--u'); m.textContent = t; log.appendChild(m); giu(); }

    /* scelte a tocco: lista di [etichetta, valore]; multi = più risposte e un «Avanti» */
    function scelte(m, lista, fatto, multi) {
      var w = el('div', 'scelte'), sel = [];
      w.setAttribute('role', 'group');
      function chiudi(tenute) { [].forEach.call(w.querySelectorAll('button'), function (x) { x.disabled = true; if (tenute.indexOf(x) >= 0) x.setAttribute('aria-pressed', 'true'); }); }
      lista.forEach(function (c) {
        var x = el('button', 'scelta'); x.type = 'button'; x.textContent = c[0]; if (multi) x.setAttribute('aria-pressed', 'false');
        x.onclick = function () {
          if (!multi) { chiudi([x]); utente(c[0]); fatto(c[1], c[0]); return; }
          if (c[2] === 'nessuno') { sel = [{ b: x, c: c }]; [].forEach.call(w.querySelectorAll('.scelta:not(.scelta--vai)'), function (y) { y.setAttribute('aria-pressed', y === x); }); return; }
          var i = -1; sel.forEach(function (s, k) { if (s.b === x) i = k; });
          sel = sel.filter(function (s) { if (s.c[2] === 'nessuno') { s.b.setAttribute('aria-pressed', 'false'); return false; } return true; });
          if (i >= 0) { sel = sel.filter(function (s) { return s.b !== x; }); x.setAttribute('aria-pressed', 'false'); }
          else { sel.push({ b: x, c: c }); x.setAttribute('aria-pressed', 'true'); }
        };
        w.appendChild(x);
      });
      if (multi) {
        var v = el('button', 'scelta scelta--vai'); v.type = 'button'; v.textContent = C.t('Avanti', 'Continue');
        v.onclick = function () {
          var vals = sel.filter(function (s) { return s.c[2] !== 'nessuno'; });
          chiudi(sel.map(function (s) { return s.b; }).concat([v]));
          var lab = sel.length ? sel.map(function (s) { return s.c[0]; }).join(', ') : C.t('Niente di questo', 'None of these');
          utente(lab); fatto(vals.map(function (s) { return s.c[1]; }), lab);
        };
        w.appendChild(v);
      }
      m.appendChild(w); giu();
      return w;
    }

    function cresce() { txt.style.height = 'auto'; txt.style.height = Math.min(132, txt.scrollHeight) + 'px'; }
    txt.addEventListener('input', cresce);
    txt.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); } });
    form.addEventListener('submit', function (e) { e.preventDefault(); if (occupato) return; var v = txt.value.trim(); txt.value = ''; cresce(); if (v) o.testo(v); });

    /* un esempio che si scrive da solo */
    function batti(s, poi) {
      if (occupato) return; occupato = true; var i = 0; txt.value = '';
      (function t() { i += C.reduce ? s.length : 2; txt.value = s.slice(0, i); cresce(); if (i < s.length) setTimeout(t, 15); else setTimeout(function () { occupato = false; txt.value = ''; cresce(); poi(s); }, C.reduce ? 0 : 340); })();
    }
    function azzera() { gen++; chain = Promise.resolve(); occupato = false; log.innerHTML = ''; }

    /* l'etichetta Umbra non deve coprire il campo di scrittura, da telefono */
    if ('IntersectionObserver' in window && C.tagVia) new IntersectionObserver(function (en) { C.tagVia(en[0].isIntersecting); }).observe(form);

    return { dice: dice, utente: utente, scelte: scelte, batti: batti, azzera: azzera, giu: giu, occupato: function () { return occupato; } };
  };

  /* ---------- dietro le quinte ---------- */
  window.Quinte = function (root) {
    var q = root, dati = null, canale = 'mail', ultimo = null;
    var X = q.querySelector('[data-q="chiudi"]'), tabs = [].slice.call(q.querySelectorAll('.quinte__tab button'));
    function disegna() {
      if (!dati) return;
      q.querySelector('[data-q="lettera"]').textContent = dati.priorita;
      q.querySelector('[data-q="punti"]').textContent = dati.punti + ' su 100';
      q.querySelector('[data-q="perche"]').textContent = dati.perche;
      q.querySelector('[data-q="criteri"]').innerHTML = dati.criteri.map(function (k) {
        return '<li><span>' + esc(k[0]) + '</span><b>' + k[1] + ' su ' + k[2] + '</b><i style="--v:' + Math.round(100 * k[1] / k[2]) + '"></i></li>';
      }).join('');
      q.querySelector('[data-q="profilo"]').textContent = dati.profilo;
      q.querySelector('[data-q="testo"]').innerHTML = canale === 'mail' ? dati.mail : dati.wa;
    }
    function apri(x, daChi) { dati = x; ultimo = daChi || d.activeElement; disegna(); q.classList.add('su'); q.setAttribute('aria-hidden', 'false'); if (C.tagVia) C.tagVia(true); setTimeout(function () { X.focus({ preventScroll: true }); }, 60); }
    function chiudi() { q.classList.remove('su'); q.setAttribute('aria-hidden', 'true'); if (C.tagVia) C.tagVia(false); if (ultimo && ultimo.focus) ultimo.focus({ preventScroll: true }); }
    X.onclick = chiudi;
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && q.classList.contains('su')) chiudi(); });
    tabs.forEach(function (t) { t.onclick = function () { canale = t.getAttribute('data-c'); tabs.forEach(function (y) { y.setAttribute('aria-pressed', y === t); }); disegna(); }; });
    return { apri: apri, chiudi: chiudi };
  };
})();
