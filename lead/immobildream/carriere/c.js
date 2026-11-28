/* Immobildream · landing «Entra in squadra»
   Dora in anteprima: capisce la presentazione del candidato con regole scritte a mano, senza chiamate esterne.
   Online, al posto di leggi() risponde un modello AI con le regole di selezione dell'agenzia. */
(function () {
  'use strict';
  var d = document, de = d.documentElement, U = window.U || {};
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }
  function el(t, c, h) { var e = d.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function lista(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1]; }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, coarse = matchMedia('(pointer: coarse)').matches;
  var nointro = reduce || /[?&]nointro/.test(location.search);

  /* etichetta dell'anteprima */
  (function () {
    var note = d.body.getAttribute('data-nota'); if (!note) return;
    var tg = el('div', 'u-tag', '<p></p><button type="button" aria-expanded="false"><i></i>Anteprima Umbra</button>'); $('p', tg).textContent = note;
    var tb = $('button', tg), tog = function (o) { tg.classList.toggle('is-open', o); tb.setAttribute('aria-expanded', o); };
    tb.setAttribute('aria-label', 'Anteprima Umbra: leggi la nota');
    var auto = false;
    tb.onclick = function () { auto = false; tog(!tg.classList.contains('is-open')); };
    addEventListener('scroll', function () { if (auto && (window.pageYOffset || 0) > 140) { auto = false; tog(false); } }, { passive: true });
    /* si fa da parte quando si scrive: da telefono non deve coprire il campo */
    var away = { f: false, c: false }, setAway = function () { var on = away.f || away.c; tg.classList.toggle('is-away', on); if (on) { auto = false; tog(false); } };
    d.addEventListener('focusin', function (e) { var t = e.target; away.f = !!(t && t.matches && t.matches('input:not([type=checkbox]):not([type=file]),textarea')); setAway(); });
    d.addEventListener('focusout', function () { away.f = false; setAway(); });
    var seen = {};
    function watch(sel, key) { var n = $(sel); if (n && 'IntersectionObserver' in window) new IntersectionObserver(function (en) { seen[key] = en[0].isIntersecting; away.c = !!(seen.say || seen.nome); setAway(); }).observe(n); }
    watch('#say', 'say'); if (innerWidth <= 900) watch('#nomeF', 'nome');
    setTimeout(function () {
      d.body.appendChild(tg);
      if (innerWidth > 1180 && innerHeight > 700) { auto = true; requestAnimationFrame(function () { requestAnimationFrame(function () { if (auto) tog(true); }); }); setTimeout(function () { if (auto) { auto = false; tog(false); } }, 6500); }
      setTimeout(function () { tg.classList.add('is-mini'); }, 9000);
    }, nointro ? 500 : 2900);
  })();

  /* ---------- il biglietto ---------- */
  var card = $('#carta'), scene = $('#scena'), hero = $('.hero');
  var tx = 0, ty = 0, cx = 0, cy = 0, flip = 0, fa = 0, live = true, raf = 0;
  function loop(now) {
    raf = 0; if (!live) return;
    cx += (tx - cx) * .07; cy += (ty - cy) * .07; fa += (flip - fa) * .085;
    var t = now / 1000, f = reduce ? 0 : 1;
    card.style.setProperty('--rx', (9 - cy * 11 + Math.sin(t * .8) * 1.3 * f).toFixed(2) + 'deg');
    card.style.setProperty('--ry', (-16 + cx * 18 + Math.cos(t * .62) * 2 * f + fa * 180).toFixed(2) + 'deg');
    card.style.setProperty('--rz', (-5 + fa * 9 + Math.sin(t * .5) * .6 * f).toFixed(2) + 'deg');
    card.style.setProperty('--gx', (50 + cx * 42).toFixed(1) + '%'); card.style.setProperty('--gy', (38 + cy * 42).toFixed(1) + '%');
    if (!reduce || Math.abs(flip - fa) > .002 || Math.abs(tx - cx) > .002) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && live) raf = requestAnimationFrame(loop); }
  if (card) {
    card.classList.add('viva'); card.style.transition = 'none';
    hero.addEventListener('pointermove', function (e) { var r = scene.getBoundingClientRect(); tx = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / (r.width * .9))); ty = Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / (r.height * .9))); kick(); }, { passive: true });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
    var gira = function () { flip = flip ? 0 : 1; kick(); };
    card.addEventListener('click', gira);
    card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); gira(); } });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { live = es[0].isIntersecting; kick(); }).observe(hero);
    kick();
  }
  var nome = '', inp = $('#nome');
  function setNome(v) {
    nome = v.replace(/\s+/g, ' ').replace(/^\s/, '').slice(0, 38);
    $$('.js-nome').forEach(function (b) {
      var n = nome.trim(); b.textContent = n || 'Il tuo nome'; b.classList.toggle('vuoto', !n);
      b.style.setProperty('--s', n.length > 31 ? .52 : n.length > 24 ? .62 : n.length > 19 ? .74 : n.length > 15 ? .86 : 1); // i nomi lunghi si stringono, senza uscire dal biglietto
    });
  }
  inp.addEventListener('input', function () { setNome(inp.value); });
  $('#nomeF').addEventListener('submit', function (e) { e.preventDefault(); go(); });
  function setRuolo(n) { $$('.js-ruolo').forEach(function (s) { s.textContent = n; }); }
  function go() { U.scrollTo ? U.scrollTo($('#colloquio')) : $('#colloquio').scrollIntoView(); if (!started) greet(); if (!coarse) setTimeout(function () { txt.focus({ preventScroll: true }); }, 900); }

  /* ---------- le righe che si accendono ---------- */
  var righe = $$('#patti li'), giro = $('#giroL'), giroLi = $$('#giroL li');
  function onScroll() {
    var vh = innerHeight, i, r;
    for (i = 0; i < righe.length; i++) { r = righe[i].getBoundingClientRect(); if (r.bottom > -200 && r.top < vh + 200) righe[i].style.setProperty('--k', Math.max(0, Math.min(1, (vh * .86 - r.top - r.height * .5) / (vh * .3))).toFixed(3)); }
    if (giro) { r = giro.getBoundingClientRect(); var t = Math.max(0, Math.min(1, (vh * .82 - r.top) / (vh * .5))); giro.style.setProperty('--t', t.toFixed(3)); for (i = 0; i < giroLi.length; i++) giroLi[i].style.setProperty('--o', Math.max(0, Math.min(1, t * 6.4 - i)).toFixed(3)); }
  }
  if (U.onScroll) U.onScroll(onScroll); else { addEventListener('scroll', onScroll, { passive: true }); onScroll(); }
  addEventListener('resize', onScroll);

  /* ---------- i ruoli (dalla pagina «Lavora con noi» di immobildream.it) ---------- */
  var R = {
    tm: { n: 'Team Manager', c: 'Hai una squadra di consulenti. O sai metterla in piedi in fretta.', s: 'Abilitazione. Una squadra già operativa, o la capacità di costruirla in tempi brevi.', t: ['Un incentivo per ogni incarico', 'Provvigioni tra le più alte del settore', 'Incentivi sul fatturato della squadra', 'Contatti di proprietari che vogliono vendere', 'Foto, video e virtual tour', 'Pubblicità su portali e social'] },
    ag: { n: 'Agente immobiliare', c: 'Acquisisci e vendi da anni. Case di fascia medio-alta, case di lusso.', s: 'Abilitazione. Esperienza consolidata su immobili residenziali di fascia medio-alta e luxury.', t: ['Un incentivo per ogni incarico', 'Provvigioni tra le più alte del settore', 'Contatti di proprietari che vogliono vendere', 'Pubblicità su portali e social', 'Nessun vincolo di zona', 'Autonomia operativa'] },
    co: { n: 'Consulente immobiliare', c: 'Sai trattare e chiudere. Vuoi una zona tua e qualcuno che ti insegni il resto.', s: 'Esperienza in acquisizione e vendita su fascia medio-alta e luxury. Capacità di relazione e di trattativa. Voglia di obiettivi.', t: ['Un incentivo per ogni incarico', 'Provvigioni tra le più alte del settore', 'Academy con un tutor', 'Zona di competenza riservata', 'Contatti di proprietari che vogliono vendere', 'Foto, video e virtual tour', 'Pubblicità su portali e social'] },
    nc: { n: 'Agente nuove costruzioni', c: 'Vendi appartamenti in cantiere, a Roma.', s: 'Abilitazione. Esperienza nelle vendite immobiliari. Ottime capacità di comunicazione e di relazione.', t: ['Un portafoglio di immobili già pronto', 'Provvigioni sulle vendite', 'Visibilità extra su portali e social', 'Una postazione negli uffici vicino al cantiere'] }
  };
  var rSel = 'ag', pref = null, rl = $('#ruoliL');
  ['tm', 'ag', 'co', 'nc'].forEach(function (id) {
    var b = el('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('data-r', id); b.textContent = R[id].n; b.onclick = function () { ruolo(id, true); }; rl.appendChild(b);
  });
  function ruolo(id, anim) {
    rSel = id; var r = R[id];
    $$('button', rl).forEach(function (b) { b.setAttribute('aria-selected', b.getAttribute('data-r') === id); });
    $('#rC').textContent = r.c; $('#rS').textContent = r.s; $('#rT').innerHTML = r.t.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    $('#rB').textContent = 'Candidati come ' + r.n.toLowerCase().replace('team manager', 'Team Manager');
    if (!verdetto) setRuolo(r.n);
    var p = $('#ruolo'); if (anim && !reduce && p.animate) p.animate([{ opacity: .2, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
  $('#rB').onclick = function () { var was = started; pref = rSel; go(); if (was && !verdetto) say('<p>' + R[rSel].n + ', bene. Dimmi in due righe che agente sei.</p>'); };

  /* ---------- capire la presentazione ---------- */
  function fold(s) { return s.toLowerCase().replace(/[àáâä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[’`´]/g, '\''); }
  var NUM = { un: 1, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, dodici: 12, quindici: 15, venti: 20, trenta: 30 };
  var NW = '(\\d{1,3}|un[oa]?|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|dodici|quindici|venti|trenta)';
  function num(s) { return /^\d/.test(s) ? +s : NUM[s] || 0; }
  var ZONE = [['roma nord', 'Roma Nord'], ['roma sud', 'Roma Sud'], ['parioli', 'Parioli'], ['pinciano', 'Pinciano'], ['trieste', 'Trieste'], ['coppede', 'Coppedè'], ['prati', 'Prati'], ['centro storico', 'Centro Storico'], ['flaminio', 'Flaminio'], ['vigna clara', 'Vigna Clara'], ['fleming', 'Fleming'], ['ponte milvio', 'Ponte Milvio'], ['balduina', 'Balduina'], ['monteverde', 'Monteverde'], ['trastevere', 'Trastevere'], ['aventino', 'Aventino'], ['eur', 'EUR'], ['talenti', 'Talenti'], ['montesacro', 'Montesacro'], ['monte sacro', 'Montesacro'], ['nomentano', 'Nomentano'], ['salario', 'Salario'], ['cassia', 'Cassia'], ['olgiata', 'Olgiata'], ['ostia', 'Ostia'], ['labaro', 'Labaro'], ['laurentin', 'Laurentina'], ['ponte di nona', 'Ponte di Nona'], ['cortina', 'Cortina d’Ampezzo']];
  function leggi(raw) {
    var t = fold(raw), o = { zone: [], marks: [] }, m;
    function mark(a, b) { o.marks.push([a, b]); }
    function hit(re) { var x = re.exec(t); if (x) mark(x.index, x.index + x[0].length); return x; }
    // abilitazione
    if (hit(/non\s+(?:ho|sono)[^.,;]{0,26}(?:patentino|abilitat\w+|abilitazione)|senza\s+(?:patentino|abilitazione)/)) o.lic = 'no';
    else if (hit(/sto\s+(?:facendo|prendendo|studiando)[^.,;]{0,26}(?:patentino|abilitazione|corso|esame)|corso\s+abilitante|patentino\s+in\s+corso/)) o.lic = 'corso';
    else if (hit(/(?:ho\s+il\s+)?patentino|abilitat[oa]|abilitazione|iscritt[oa]\s+(?:al\s+)?(?:rea|ruolo)/)) o.lic = 'si';
    // altro settore
    if ((m = hit(/(?:vendo|vendevo|lavoro|vengo)\s+(?:da[il]?\s+|nel(?:le|la|l')?\s*|in\s+|come\s+)?(auto|assicurazion\w+|banc\w+|finanz\w+|moda|telefonia|energia|abbigliamento|arredamento|retail)/))) o.altro = m[1];
    else if (hit(/altro\s+settore|non\s+(?:ho\s+mai\s+)?(?:lavorato|venduto)\s+(?:nell'|in\s+)?immobiliare|nessuna\s+esperienza|non\s+ho\s+(?:alcuna\s+|molta\s+)?esperienza|senza\s+esperienza|zero\s+esperienza|prima\s+esperienza|sto\s+iniziando|comincio\s+(?:adesso|ora)|mai\s+(?:fatto|lavorato|venduto)/)) o.zero = 1;
    // anni
    if ((m = hit(new RegExp('da\\s+(?:circa\\s+|oltre\\s+|piu\\s+di\\s+)?' + NW + '\\s+ann[io]'))) || (m = hit(new RegExp(NW + '\\s+ann[io]\\s+(?:di\\s+)?(?:esperienza|vendite|nel|nell|in\\s|come|da\\s|tra|sul)')))) o.anni = num(m[1]);
    else if ((m = new RegExp(NW + '\\s+ann[io]').exec(t)) && !/ho\s+\d{2}\s+ann[io](?!\s+di)/.test(t)) { o.anni = num(m[1]); mark(m.index, m.index + m[0].length); }
    else if ((m = hit(/\bdal\s+(19[89]\d|20[0-2]\d)\b/))) o.anni = Math.max(0, new Date().getFullYear() - +m[1]);
    // vendite
    if ((m = hit(new RegExp(NW + '\\s+(?:vendite|compravendite|rogiti|transazioni|chiusure|(?:immobili|case|appartamenti)\\s+vendut[ie])'))) || (m = hit(new RegExp('(?:venduto|chiuso|concluso)\\s+' + NW)))) o.vend = num(m[1]);
    // squadra
    if ((m = hit(new RegExp('(?:squadra|team|gruppo)\\s+di\\s+' + NW + '(?:\\s+(?:consulenti|agenti|persone|collaboratori))?'))) || (m = hit(new RegExp(NW + '\\s+(?:collaboratori|consulenti|agenti|persone|ragazzi|colleghi)')))) o.team = num(m[1]);
    else if (hit(/(?:ho|coordino|gestisco|guido|porto)\s+(?:una?|il\s+mio|la\s+mia)\s+(?:squadra|team|gruppo)/)) o.team = 3;
    else if (hit(/da\s+sol[oa]|in\s+autonomia|senza\s+squadra/)) o.team = 0;
    // zone e interessi
    ZONE.forEach(function (z) { var x = new RegExp('(^|[^a-z])' + z[0] + '(?![a-z])').exec(t); if (x && o.zone.indexOf(z[1]) < 0) { o.zone.push(z[1]); mark(x.index + x[1].length, x.index + x[0].length); } });
    if (hit(/nuov[ea]\s+costruzion\w+|cantier[ei]|costruttor\w+/)) o.nc = 1;
    if (hit(/\blusso\b|luxury|\bpregio\b|medio[- ]alt\w+|prestigio/)) o.lux = 1;
    o.marks.sort(function (a, b) { return a[0] - b[0] || b[1] - a[1]; });
    var clean = [], end = -1; o.marks.forEach(function (k) { if (k[0] >= end) { clean.push(k); end = k[1]; } }); o.marks = clean;
    return o;
  }
  function pieno(o) { var n = 0; ['lic', 'anni', 'vend', 'team', 'altro', 'zero', 'nc', 'lux'].forEach(function (k) { if (o[k] != null) n++; }); return n + (o.zone ? o.zone.length : 0); }
  function unisci(p, o) {
    ['lic', 'anni', 'vend', 'team', 'altro', 'zero', 'nc', 'lux'].forEach(function (k) { if (o[k] != null) p[k] = o[k]; });
    (o.zone || []).forEach(function (z) { if (p.zone.indexOf(z) < 0) p.zone.push(z); });
    if (p.zero && p.anni == null) p.anni = 0;
    return p;
  }
  function immAnni(p) { return p.altro ? 0 : (p.anni || 0); }
  function scegli(p) {
    if ((p.team || 0) >= 2 && p.lic === 'si') return 'tm';
    if (p.nc && p.lic === 'si') return 'nc';
    if (p.lic === 'si' && immAnni(p) >= 2) return 'ag';
    return 'co';
  }
  function classe(p, r) {
    if (r === 'tm' || (p.lic === 'si' && (p.vend || 0) >= 8)) return 'A';
    if (p.lic === 'si' || (p.anni || 0) >= 2) return 'B';
    return 'C';
  }
  function anniTxt(p) { var a = p.anni; if (a == null) return null; if (!a) return 'Comincia adesso'; return a + (a === 1 ? ' anno' : ' anni') + (p.altro ? ', altro settore (' + p.altro + ')' : ' nell’immobiliare'); }
  var LIC = { si: 'Sì', corso: 'In corso', no: 'Non ancora' };
  function teamTxt(p) { return p.team == null ? null : p.team ? p.team + ' persone' : 'Lavora da solo'; }
  function riassunto(p) {
    var a = [];
    if (p.anni != null) a.push(p.anni ? p.anni + (p.anni === 1 ? ' anno' : ' anni') + (p.altro ? ' in un altro settore (' + p.altro + ')' : ' nell’immobiliare') : 'cominci adesso');
    if (p.vend != null) a.push(p.vend + ' vendite negli ultimi dodici mesi');
    if (p.lic) a.push(p.lic === 'si' ? 'patentino sì' : p.lic === 'corso' ? 'patentino in corso' : 'patentino non ancora');
    if (p.team != null) a.push(p.team ? 'una squadra di ' + p.team : 'da solo');
    if (p.zone.length) a.push(lista(p.zone));
    if (p.nc) a.push('interesse per le nuove costruzioni');
    return a.join(', ');
  }

  /* ---------- il colloquio ---------- */
  var log = $('#log'), form = $('#say'), txt = $('#txt');
  var P = { zone: [] }, primo = '', attesa = null, chiesto = {}, verdetto = null, chain = Promise.resolve(), started = false, inviato = false, app = {};
  function down() { requestAnimationFrame(function () { log.scrollTo ? log.scrollTo({ top: log.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }) : (log.scrollTop = log.scrollHeight); }); }
  function say(html, after) {
    chain = chain.then(function () {
      return new Promise(function (res) {
        var m = el('div', 'msg msg--d', '<span class="sig" aria-hidden="true">D</span><div class="b"><span class="dots" aria-label="Dora sta scrivendo"><i></i><i></i><i></i></span></div>');
        log.appendChild(m); down();
        setTimeout(function () { var b = $('.b', m); b.innerHTML = html; if (after) after(b); down(); res(); }, reduce ? 40 : 420 + Math.min(760, html.replace(/<[^>]+>/g, '').length * 6));
      });
    });
    return chain;
  }
  function chips(b, list) {
    var w = el('div', 'msg__chips');
    list.forEach(function (c) {
      var x = el('button', 'chip'); x.type = 'button'; x.textContent = c[0];
      x.onclick = function () { $$('button', w).forEach(function (y) { y.disabled = true; y.style.pointerEvents = 'none'; y.style.opacity = y === x ? '1' : '.35'; }); x.setAttribute('aria-pressed', 'true'); c[1](c[0]); };
      w.appendChild(x);
    });
    b.appendChild(w);
  }
  function user(raw, marks) {
    var h = '', p = 0;
    (marks || []).forEach(function (k) { h += esc(raw.slice(p, k[0])) + '<mark>' + esc(raw.slice(k[0], k[1])) + '</mark>'; p = k[1]; });
    h += esc(raw.slice(p));
    var m = el('div', 'msg msg--u', h); log.appendChild(m); down();
    $$('mark', m).forEach(function (x, i) { setTimeout(function () { x.classList.add('on'); }, 240 + i * 150); });
  }
  function put(id, v) { var dd = $('#' + id); if (!dd || v == null || dd.getAttribute('data-v') === v) return; dd.setAttribute('data-v', v); dd.className = 'ok'; dd.innerHTML = '<span>' + esc(v) + '</span>'; }
  function profilo() {
    put('pAnni', anniTxt(P)); put('pLic', P.lic ? LIC[P.lic] : null); put('pVend', P.vend != null ? String(P.vend) : null); put('pTeam', teamTxt(P));
    put('pZone', P.zone.length ? P.zone.join(', ') : null); if (app.txt) put('pApp', app.txt);
  }
  function greet() {
    started = true; var n = nome.trim().split(' ')[0];
    say('<p>Ciao' + (n ? ', ' + esc(n) : '') + '. Sono Dora, faccio il primo colloquio per Immobildream.</p><p>Dimmi in due righe che agente sei: da quanto vendi, quanto hai chiuso l’anno scorso, se hai il patentino, se hai una squadra.</p>');
  }
  function chiedi(k) {
    attesa = k; chiesto[k] = (chiesto[k] || 0) + 1;
    function risp(l, patch) { user(l); attesa = null; unisci(P, Object.assign({ zone: [] }, patch)); profilo(); avanti(); }
    if (k === 'lic') say('<p>Hai il patentino?</p>', function (b) { chips(b, [['Sì', { lic: 'si' }], ['Lo sto prendendo', { lic: 'corso' }], ['No', { lic: 'no' }]].map(function (c) { return [c[0], function (l) { risp(l, c[1]); }]; })); });
    if (k === 'anni') say('<p>Da quanto vendi case?</p>', function (b) { chips(b, [['Comincio adesso', 0], ['1–3 anni', 2], ['4–8 anni', 6], ['Più di 8', 10]].map(function (c) { return [c[0], function (l) { risp(l, { anni: c[1] }); }]; })); });
    if (k === 'team') say('<p>Lavori da solo o hai una squadra?</p>', function (b) { chips(b, [['Da solo', 0], ['2–4 persone', 3], ['5 o più', 6]].map(function (c) { return [c[0], function (l) { risp(l, { team: c[1] }); }]; })); });
    if (k === 'vend') say('<p>Quante vendite hai chiuso negli ultimi dodici mesi?</p>', function (b) { chips(b, [['Fino a 3', 2], ['4–8', 6], ['9–15', 12], ['Più di 15', 18]].map(function (c) { return [c[0], function (l) { risp(l, { vend: c[1] }); }]; })); });
  }
  function avanti() {
    if (verdetto) return;
    function da(k) { return P[k] == null && (chiesto[k] || 0) < 2; } // una domanda senza risposta si rifà una volta, poi si va avanti
    if (da('lic')) return chiedi('lic');
    if (da('anni')) return chiedi('anni');
    if (da('team') && P.lic === 'si' && immAnni(P) >= 4) return chiedi('team');
    if (da('vend') && P.lic === 'si' && immAnni(P) >= 2) return chiedi('vend');
    decidi();
  }
  function decidi() {
    var r = scegli(P), R0 = R[r]; verdetto = r;
    var perche = r === 'tm' ? 'Hai il patentino e una squadra di ' + P.team + ': è il profilo che serve per guidare un gruppo.'
      : r === 'nc' ? 'Hai il patentino e vieni dalle vendite in cantiere.'
        : r === 'ag' ? 'Hai il patentino e ' + immAnni(P) + ' anni sul campo.'
          : P.lic == null ? 'Del patentino non mi hai detto, quindi parto dal ruolo da consulente: Academy, un tutor, una zona tua. In sede vedete se è quello giusto.'
            : P.lic !== 'si' ? (P.altro ? 'Sai vendere, ma non hai ancora il patentino. ' : 'Non hai ancora il patentino. ') + 'Da consulente hai l’Academy, un tutor e una zona tua.'
            : 'Hai il patentino ma pochi anni sul campo. Da consulente hai una zona tua e un tutor.';
    var altro = pref && pref !== r ? '<p>Mi avevi detto ' + R[pref].n + '. Con questi dati vedo meglio questo, ma in sede ne parlate.</p>' : '';
    say('<p>Per te vedo questo posto.</p><div class="verd"><span>Ruolo</span><strong>' + R0.n + '</strong><ul>' + R0.t.slice(0, 4).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div><p>' + perche + '</p>' + altro, function () { setRuolo(R0.n); ruolo(r); });
    say('<p>Il secondo colloquio è di persona, in via Dora 2. Quando puoi?</p>', function (b) { chips(b, giorni().map(function (g) { return [g.s, function (l) { user(l); app.g = g; ora(); }]; })); });
  }
  var GG = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'], MM = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
  function giorni() {
    var out = [], x = new Date(); x.setHours(12, 0, 0, 0);
    while (out.length < 4) { x.setDate(x.getDate() + 1); var w = x.getDay(); if (w === 0) continue; out.push({ s: cap(GG[w].slice(0, 3)) + ' ' + x.getDate() + ' ' + MM[x.getMonth()].slice(0, 3), l: GG[w] + ' ' + x.getDate() + ' ' + MM[x.getMonth()], sab: w === 6 }); }
    return out;
  }
  function ora() {
    say('<p>A che ora?</p>', function (b) { chips(b, (app.g.sab ? ['9:30', '11:00', '12:00'] : ['10:00', '12:30', '16:00', '18:30']).map(function (h) { return [h, function (l) { user(l); app.h = h; app.txt = cap(app.g.l) + ', ' + h; profilo(); modulo(); }]; })); });
  }
  function modulo() {
    say('<p>Ultima cosa: come ti troviamo.</p>', function (b) {
      var f = el('div', 'mini');
      f.innerHTML = '<label>Nome e cognome<input type="text" name="n" autocomplete="name"></label>' +
        '<label>Telefono<input type="tel" name="t" autocomplete="tel" inputmode="tel"></label>' +
        '<label class="mini__f"><input type="file" name="cv" accept=".pdf,.doc,.docx,image/*"><span class="chip">Allega il CV</span><span class="cvn">Con la foto: senza, la candidatura non viene letta. Se non l’hai qui, lo porti al colloquio.</span></label>' +
        '<label class="mini__ok"><input type="checkbox" name="ok"><span>Va bene che Immobildream mi contatti per la selezione.</span></label>' +
        '<p class="mini__e" hidden></p><button type="button" class="btn btn--r">Prenota il colloquio</button>';
      b.appendChild(f);
      var nm = $('[name=n]', f), tl = $('[name=t]', f), cv = $('[name=cv]', f), ok = $('[name=ok]', f), er = $('.mini__e', f);
      nm.value = nome.trim(); nm.addEventListener('input', function () { inp.value = nm.value; setNome(nm.value); });
      cv.addEventListener('change', function () { if (cv.files && cv.files[0]) { $('.cvn', f).textContent = cv.files[0].name; app.cv = cv.files[0].name; } });
      $('.btn', f).onclick = function () {
        var msg = ''; nm.classList.remove('err'); tl.classList.remove('err');
        if (nm.value.trim().length < 2) { msg = 'Manca il nome.'; nm.classList.add('err'); nm.focus(); }
        else if (tl.value.replace(/\D/g, '').length < 8) { msg = 'Il numero sembra incompleto.'; tl.classList.add('err'); tl.focus(); }
        else if (!ok.checked) msg = 'Per fissare il colloquio ci serve il tuo consenso: spunta la casella.';
        if (msg) { er.textContent = msg; er.hidden = false; return; }
        var name = nm.value.trim(), tel = tl.value.trim(); inviato = true; setNome(name); inp.value = name;
        f.innerHTML = '<p style="font:400 15px/1.5 var(--f);color:#333">' + esc(name) + ' · ' + esc(tel) + (app.cv ? ' · ' + esc(app.cv) : '') + '</p>';
        say('<p><b>Fatto, ' + esc(name.split(' ')[0]) + '.</b> Ti aspettiamo ' + app.g.l + ' alle ' + app.h + ', in via Dora 2.</p><p>' + (app.cv ? 'Il CV l’abbiamo.' : 'Porta il CV, con la foto.') + '</p>');
        setTimeout(function () { quinte({ n: name, t: tel }); }, reduce ? 200 : 2200);
      };
      if (!coarse) setTimeout(function () { (nm.value ? tl : nm).focus({ preventScroll: true }); }, 60);
    });
  }
  function handle(raw) {
    raw = raw.trim(); if (!raw) return;
    if (!started) started = true;
    var o = leggi(raw), w = attesa, m; attesa = null;
    if (w === 'anni' && o.anni == null && (m = /\d{1,2}/.exec(raw))) { o.anni = +m[0]; o.marks = [[m.index, m.index + m[0].length]]; }
    if (w === 'vend' && o.vend == null && (m = /\d{1,3}/.exec(raw))) { o.vend = +m[0]; o.marks = [[m.index, m.index + m[0].length]]; }
    if (w === 'lic' && !o.lic) { var t = fold(raw); if (/in\s+corso|sto\s+(?:prendendo|facendo|studiando)|quasi|a\s+breve/.test(t)) o.lic = 'corso'; else if (/^s[iì]\b|certo|ce\s+l'ho|^ok\b/.test(t)) o.lic = 'si'; else if (/^no\b|non\s+ancora|non\s+ce\s+l'ho/.test(t)) o.lic = 'no'; }
    if (w === 'team' && o.team == null) { var t2 = fold(raw); if (/\bsol[oa]\b|nessun|^no\b/.test(t2)) o.team = 0; else if ((m = /\d{1,2}/.exec(raw))) { o.team = +m[0]; o.marks = [[m.index, m.index + m[0].length]]; } }
    var n = pieno(o);
    user(raw, o.marks);
    if (verdetto) return say('<p>' + (inviato ? 'È già tutto fissato. Per cambiare giorno chiama lo 06 3200007.' : 'Il ruolo lo confermi in sede. Scegli il giorno qui sopra e chiudiamo.') + '</p>');
    if (!n) {
      var q = fold(raw), a = /fisso|stipendio|quanto\s+si\s+guadagna|provvigion|soldi|retribuzion/.test(q) ? 'Si guadagna su quello che si vende: provvigioni tra le più alte del settore e un incentivo per ogni incarico. Le condizioni complete si vedono in sede, con chi passa la selezione.'
        : /dove|sede|ufficio|indirizzo/.test(q) ? 'In via Dora 2, a Roma. Gli uffici sono quelli di Roma Parioli.'
          : /chi\s+sei|robot|\bbot\b|intelligenza|\bai\b|umano/.test(q) ? 'Sono un’assistente AI. Faccio il primo colloquio e fisso il secondo, che è con una persona.'
            : /orari|part.?time|full.?time|remoto|smart/.test(q) ? 'Di orari e organizzazione parli in sede. Io raccolgo il profilo e fisso l’incontro.'
              : /^(?:ciao|salve|buon\s?giorno|buona\s?sera)\b/.test(q) ? 'Ciao. Dimmi che agente sei: anni, vendite, patentino, squadra.' : null;
      say('<p>' + (a || 'Qui non ho trovato quello che mi serve. Andiamo per domande.') + '</p>');
      return avanti();
    }
    if (!primo) primo = raw;
    unisci(P, o); setTimeout(profilo, reduce ? 0 : 300);
    if (n >= 2) say('<p>Segnato: ' + riassunto(P) + '.</p>');
    setTimeout(avanti, reduce ? 0 : 320);
  }
  function grow() { txt.style.height = 'auto'; txt.style.height = Math.min(130, txt.scrollHeight) + 'px'; }
  txt.addEventListener('input', grow);
  txt.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); } });
  var typing = false;
  form.addEventListener('submit', function (e) { e.preventDefault(); if (typing) return; var v = txt.value; txt.value = ''; grow(); handle(v); });
  function reset() {
    P = { zone: [] }; primo = ''; attesa = null; chiesto = {}; verdetto = null; inviato = false; app = {}; chain = Promise.resolve(); log.innerHTML = '';
    [['pAnni', 'da dire'], ['pLic', 'da dire'], ['pVend', 'da dire'], ['pTeam', 'da dire'], ['pZone', 'da dire'], ['pApp', 'da fissare']].forEach(function (x) { var e = $('#' + x[0]); e.className = ''; e.removeAttribute('data-v'); e.textContent = x[1]; });
    setRuolo(R[rSel].n);
  }
  $$('#ex .chip').forEach(function (c) {
    c.onclick = function () {
      if (typing) return; typing = true; reset(); started = true;
      var s = c.getAttribute('data-t'), i = 0; txt.value = ''; if (!coarse) txt.focus({ preventScroll: true });
      (function t() { i += reduce ? s.length : 2; txt.value = s.slice(0, i); grow(); if (i < s.length) setTimeout(t, 15); else setTimeout(function () { typing = false; txt.value = ''; grow(); handle(s); }, reduce ? 0 : 360); })();
    };
  });
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es, io) { if (es[0].isIntersecting) { if (!started) greet(); io.disconnect(); } }, { threshold: .2 }).observe($('.chat'));
  else greet();

  /* ---------- dietro le quinte ---------- */
  var Q = $('#quinte');
  function quinte(o) {
    var r = verdetto, c = classe(P, r);
    var nota = r === 'tm' ? 'Chiedere quanti della squadra lo seguirebbero, e in che tempi.'
      : r === 'nc' ? 'Chiedere su quali cantieri ha lavorato e con quali costruttori.'
        : r === 'ag' ? ((P.vend || 0) >= 8 ? 'Volume alto. Chiedere del portafoglio incarichi attuale.' : 'Chiedere degli incarichi in corso e delle zone che copre.')
          : P.lic == null ? 'Abilitazione non dichiarata: chiederla subito.' : P.lic !== 'si' ? 'Da avviare all’abilitazione. Verificare la disponibilità per l’Academy.' : 'Pochi anni sul campo. Valutare zona e tutor.';
    $('#qP').innerHTML = '<b>Oggetto: Candidatura, ' + esc(o.n) + ', ' + R[r].n.toLowerCase() + ' (classe ' + c + ')</b>\n\nColloquio: ' + app.g.l + ', ' + app.h + ', via Dora 2\nTelefono: ' + esc(o.t) + '\nCV: ' + (app.cv ? 'allegato (' + esc(app.cv) + ')' : 'lo porta al colloquio') +
      '\n\nEsperienza: ' + (anniTxt(P) || 'non indicata') + '\nAbilitazione: ' + (P.lic ? LIC[P.lic].toLowerCase() : 'non indicata') + '\nVendite, ultimi 12 mesi: ' + (P.vend != null ? P.vend : 'non indicate') + '\nSquadra: ' + (teamTxt(P) || 'non indicata').toLowerCase() + '\nZone: ' + (P.zone.length ? P.zone.join(', ') : 'non indicate') +
      (primo ? '\n\nParole del candidato:\n«' + esc(primo) + '»' : '') + '\n\nNota di Dora: ' + nota + '\n\nProvenienza: landing «Lavora con noi»';
    $('#qPri').textContent = 'Classe ' + c + (c === 'A' ? (r === 'tm' ? ': abilitato, con squadra' : ': abilitato, ' + P.vend + ' vendite in 12 mesi') : c === 'B' ? ': abilitato o con esperienza di vendita' : ': da formare');
    Q.classList.add('on'); Q.setAttribute('aria-hidden', 'false');
  }
  $('#qX').onclick = function () { Q.classList.remove('on'); Q.setAttribute('aria-hidden', 'true'); };

  ruolo('ag');
  if (U.refresh) U.refresh();
  window.__dora = { leggi: leggi, scegli: scegli, classe: classe, unisci: unisci };
})();
