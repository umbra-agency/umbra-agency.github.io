/* Immobildream · landing «Lavora con noi»
   Il candidato scrive il suo nome e lo vede sul biglietto. L'assistente fa il primo colloquio con le domande
   decise dall'agenzia, propone un ruolo e prepara per la selezione un profilo con punteggio e priorità.
   In anteprima: regole scritte da Umbra, nessun dato inviato. Online: un modello AI con i criteri dell'agenzia. */
(function () {
  'use strict';
  var C = window.Casa, d = document, $ = C.$, $$ = C.$$, el = C.el, esc = C.esc;
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function lista(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1]; }

  /* ---------- il biglietto ---------- */
  var card = $('#biglietto'), scena = $('#scena'), hero = $('.apertura');
  var tx = 0, ty = 0, cx = 0, cy = 0, gira = 0, ga = 0, viva = true, raf = 0;
  function passo(now) {
    raf = 0; if (!viva) return;
    cx += (tx - cx) * .07; cy += (ty - cy) * .07; ga += (gira - ga) * .085;
    var t = now / 1000, f = C.reduce ? 0 : 1;
    card.style.setProperty('--rx', (8 - cy * 10 + Math.sin(t * .8) * 1.2 * f).toFixed(2) + 'deg');
    card.style.setProperty('--ry', (-16 + cx * 17 + Math.cos(t * .62) * 1.8 * f + ga * 180).toFixed(2) + 'deg');
    card.style.setProperty('--rz', (-4 + ga * 7 + Math.sin(t * .5) * .5 * f).toFixed(2) + 'deg');
    card.style.setProperty('--gx', (50 + cx * 40).toFixed(1) + '%'); card.style.setProperty('--gy', (36 + cy * 40).toFixed(1) + '%');
    if (!C.reduce || Math.abs(gira - ga) > .002 || Math.abs(tx - cx) > .002) raf = requestAnimationFrame(passo);
  }
  function sveglia() { if (!raf && viva) raf = requestAnimationFrame(passo); }
  if (card) {
    hero.addEventListener('pointermove', function (e) { if (e.pointerType === 'touch') return; var r = scena.getBoundingClientRect(); tx = Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / (r.width * .9))); ty = Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / (r.height * .9))); sveglia(); }, { passive: true });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; });
    var volta = function () { gira = gira ? 0 : 1; sveglia(); };
    card.addEventListener('click', volta);
    card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); volta(); } });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { viva = es[0].isIntersecting; sveglia(); }).observe(hero);
    sveglia();
  }
  var nome = '', inp = $('#nome');
  function setNome(v) {
    nome = v.replace(/\s+/g, ' ').replace(/^\s/, '').slice(0, 38);
    $$('.js-nome').forEach(function (b) {
      var n = nome.trim(); b.textContent = n || 'Il tuo nome'; b.classList.toggle('vuoto', !n);
      b.style.setProperty('--s', n.length > 31 ? .5 : n.length > 26 ? .6 : n.length > 21 ? .72 : n.length > 17 ? .85 : 1);   // i nomi lunghi si stringono, senza uscire dal biglietto
    });
  }
  inp.addEventListener('input', function () { setNome(inp.value); });
  $('#nomeF').addEventListener('submit', function (e) { e.preventDefault(); vai(); });
  function setRuolo(n) { $$('.js-ruolo').forEach(function (s) { s.textContent = n; }); }
  function vai() { $('#colloquio').scrollIntoView(); parti(); if (!C.coarse) setTimeout(function () { $('#txt').focus({ preventScroll: true }); }, 900); }

  /* ---------- i ruoli (dalla pagina «Lavora con noi» dell'agenzia) ---------- */
  var R = {
    tm: { n: 'Team Manager', c: 'Hai una squadra di consulenti. O sai metterla in piedi.', s: 'Abilitazione. Una squadra già operativa, o la capacità di costruirla in tempi brevi.', t: ['Provvigioni tra le più alte del settore', 'Un incentivo per ogni incarico', 'Incentivi sul fatturato della squadra', 'Contatti di proprietari che vogliono vendere', 'Fotografie, video e virtual tour', 'Pubblicità a carico dell’azienda'] },
    ag: { n: 'Agente immobiliare', c: 'Acquisisci e vendi da anni, su case di fascia medio-alta e di pregio.', s: 'Abilitazione. Esperienza consolidata su immobili residenziali di fascia medio-alta e di pregio.', t: ['Provvigioni tra le più alte del settore', 'Un incentivo per ogni incarico', 'Contatti di proprietari che vogliono vendere', 'Pubblicità a carico dell’azienda', 'Nessun vincolo di zona', 'Autonomia operativa'] },
    co: { n: 'Consulente immobiliare', c: 'Sai trattare e chiudere. Vuoi una zona tua e qualcuno che ti insegni il resto.', s: 'Esperienza in acquisizione e vendita. Capacità di relazione e di trattativa. Voglia di obiettivi.', t: ['Provvigioni tra le più alte del settore', 'Un incentivo per ogni incarico', 'Academy con un tutor', 'Zona di competenza riservata', 'Contatti di proprietari che vogliono vendere', 'Fotografie, video e virtual tour'] },
    nc: { n: 'Agente nuove costruzioni', c: 'Vendi appartamenti in cantiere, per conto dei costruttori.', s: 'Abilitazione. Esperienza nelle vendite immobiliari. Ottime capacità di comunicazione e di relazione.', t: ['Un portafoglio di immobili già pronto', 'Provvigioni sulle vendite', 'Visibilità extra su portali e social', 'Una postazione negli uffici vicino al cantiere'] }
  };
  var ORD = ['tm', 'ag', 'co', 'nc'], rSel = 'ag', pref = null, rl = $('#ruoliL'), verdetto = null;
  ORD.forEach(function (id, i) {
    var b = el('button'); b.type = 'button'; b.setAttribute('role', 'tab'); b.setAttribute('data-r', id); b.id = 'tab-' + id; b.textContent = R[id].n;
    b.onclick = function () { ruolo(id, true); };
    b.addEventListener('keydown', function (e) { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var o = $$('button', rl)[(i + (e.key === 'ArrowDown' ? 1 : ORD.length - 1)) % ORD.length]; o.focus(); o.click(); } });
    rl.appendChild(b);
  });
  function ruolo(id, anim) {
    rSel = id; var r = R[id];
    $$('button', rl).forEach(function (b) { var on = b.getAttribute('data-r') === id; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    $('#ruolo').setAttribute('aria-labelledby', 'tab-' + id);
    $('#rC').textContent = r.c; $('#rS').textContent = r.s; $('#rT').innerHTML = r.t.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    $('#rB').textContent = 'Candidati come ' + (id === 'tm' ? 'Team Manager' : r.n.toLowerCase());
    if (!verdetto) setRuolo(r.n);
    var p = $('#ruolo'); if (anim && !C.reduce && p.animate) p.animate([{ opacity: .3 }, { opacity: 1 }], { duration: 480, easing: 'ease-out' });
  }
  $('#rB').onclick = function () { var era = partita; pref = rSel; vai(); if (era && !verdetto) A.dice('<p>' + R[rSel].n + ', bene. Lo segno come ruolo che ti interessa.</p>'); };

  /* ---------- capire una presentazione scritta a mano ---------- */
  function fold(s) { return s.toLowerCase().replace(/[àáâä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[’`´]/g, '\''); }
  var NUM = { un: 1, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10, dodici: 12, quindici: 15, venti: 20, trenta: 30 };
  var NW = '(\\d{1,3}|un[oa]?|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|dodici|quindici|venti|trenta)';
  function num(s) { return /^\d/.test(s) ? +s : NUM[s] || 0; }
  var ZONE = [['roma nord', 'Roma Nord'], ['parioli', 'Parioli'], ['pinciano', 'Pinciano'], ['trieste', 'Trieste'], ['coppede', 'Coppedè'], ['salario', 'Salario'], ['prati', 'Prati'], ['centro storico', 'Centro storico'], ['flaminio', 'Flaminio'], ['vigna clara', 'Vigna Clara'], ['vigna stelluti', 'Vigna Stelluti'], ['corso francia', 'Corso Francia'], ['fleming', 'Fleming'], ['balduina', 'Balduina'], ['monte mario', 'Monte Mario'], ['cortina', 'Cortina d’Ampezzo']];
  function capisce(raw) {
    var t = fold(raw), o = { zone: [] }, m;
    if (/non\s+(?:ho|sono)[^.,;]{0,26}(?:patentino|abilitat\w+|abilitazione)|senza\s+(?:patentino|abilitazione)/.test(t)) o.lic = 'no';
    else if (/sto\s+(?:facendo|prendendo|studiando)[^.,;]{0,26}(?:patentino|abilitazione|corso|esame)|corso\s+abilitante|patentino\s+in\s+corso/.test(t)) o.lic = 'corso';
    else if (/patentino|abilitat[oa]|abilitazione|iscritt[oa]\s+(?:al\s+)?(?:rea|ruolo)/.test(t)) o.lic = 'si';
    if ((m = /(?:vendo|vendevo|lavoro|vengo)\s+(?:da[il]?\s+|nel(?:le|la|l')?\s*|in\s+|come\s+)?(auto|assicurazion\w+|banc\w+|finanz\w+|moda|telefonia|energia|abbigliamento|arredamento)/.exec(t))) o.altro = m[1];
    else if (/altro\s+settore|nessuna\s+esperienza|senza\s+esperienza|prima\s+esperienza|sto\s+iniziando|comincio\s+(?:adesso|ora)/.test(t)) o.zero = 1;
    if ((m = new RegExp('da\\s+(?:circa\\s+|oltre\\s+|piu\\s+di\\s+)?' + NW + '\\s+ann[io]').exec(t)) || (m = new RegExp(NW + '\\s+ann[io]\\s+(?:di\\s+)?(?:esperienza|vendite|nel|nell|in\\s|come)').exec(t))) o.anni = num(m[1]);
    if ((m = new RegExp(NW + '\\s+(?:vendite|compravendite|rogiti|chiusure)').exec(t)) || (m = new RegExp('(?:venduto|chiuso|concluso)\\s+' + NW).exec(t))) o.vend = num(m[1]);
    if ((m = new RegExp('(?:squadra|team|gruppo)\\s+di\\s+' + NW).exec(t)) || (m = new RegExp(NW + '\\s+(?:collaboratori|consulenti|agenti|persone|colleghi)').exec(t))) o.team = num(m[1]);
    else if (/(?:ho|coordino|gestisco|guido|porto)\s+(?:una?|il\s+mio|la\s+mia)\s+(?:squadra|team|gruppo)/.test(t)) o.team = 3;
    else if (/da\s+sol[oa]|senza\s+squadra|per\s+conto\s+mio/.test(t)) o.team = 0;
    if (/partita\s+iva|p\.?\s?iva/.test(t)) o.iva = /non\s+ho|senza|aprire|aprirla/.test(t) ? 'pronto' : 'gia';
    else if (/dipendente|assunzione|contratto\s+(?:a\s+tempo|fisso)|posto\s+fisso/.test(t)) o.iva = 'dip';
    ZONE.forEach(function (z) { if (new RegExp('(^|[^a-z])' + z[0] + '(?![a-z])').test(t) && o.zone.indexOf(z[1]) < 0) o.zone.push(z[1]); });
    if (/nuov[ea]\s+costruzion\w+|cantier[ei]|costruttor\w+/.test(t)) o.nc = 1;
    return o;
  }
  function pieno(o) { var n = 0; ['lic', 'anni', 'vend', 'team', 'iva', 'altro', 'zero', 'nc'].forEach(function (k) { if (o[k] != null) n++; }); return n + (o.zone ? o.zone.length : 0); }
  function immAnni(p) { return p.altro ? 0 : (p.anni || 0); }

  var LIC = { si: 'Sì', corso: 'In corso', no: 'Non ancora' }, IVA = { gia: 'Ce l’ha già', pronto: 'Da aprire', dip: 'Cerca un contratto da dipendente' };
  function anniTxt(p) { var a = p.anni; if (a == null) return p.altro ? 'Altro settore (' + p.altro + ')' : null; if (!a) return p.altro ? 'Comincia adesso, viene da altro settore' : 'Comincia adesso'; return a + (a === 1 ? ' anno' : ' anni') + (p.altro ? ', altro settore (' + p.altro + ')' : ' nell’immobiliare'); }
  function teamTxt(p) { return p.team == null ? null : p.team ? 'Squadra di ' + p.team : 'Senza squadra'; }
  function scegli(p) {
    if ((p.team || 0) >= 2 && p.lic === 'si') return 'tm';
    if (p.nc && p.lic === 'si') return 'nc';
    if (p.lic === 'si' && immAnni(p) >= 2) return 'ag';
    return 'co';
  }

  /* ---------- il colloquio ---------- */
  var A = window.Assistente({ log: $('#log'), form: $('#say'), txt: $('#txt'), testo: testo });
  var Q = window.Quinte($('#quinte'));
  var P, attesa, primo, partita = false;
  function nuova(muta) { P = { zone: [] }; attesa = null; primo = ''; verdetto = null; A.azzera(); profilo(); setRuolo(R[rSel].n); if (!muta) saluta(); }
  function parti() { if (partita) return; partita = true; nuova(); }
  function saluta() {
    var n = nome.trim().split(' ')[0];
    A.dice('<p>Ciao' + (n ? ', ' + esc(n) : '') + '. Sono Dora, l’assistente di Immobildream, e faccio il primo colloquio.</p><p>Sono poche domande. Da quanto tempo vendi case?</p>', function (m) { domanda('anni', m); });
  }
  function metti(id, v, vuoto) { var dd = $('#' + id); if (!dd) return; if (v == null) { dd.className = ''; dd.removeAttribute('data-v'); dd.textContent = vuoto || 'da dire'; return; } if (dd.getAttribute('data-v') === v) return; dd.setAttribute('data-v', v); dd.className = 'si'; dd.innerHTML = '<span>' + esc(v) + '</span>'; }
  function profilo() {
    metti('pAnni', anniTxt(P)); metti('pLic', P.lic ? LIC[P.lic] : null); metti('pVend', P.vend != null ? String(P.vend) : P.vendSalta ? 'Non ancora' : null);
    metti('pTeam', teamTxt(P)); metti('pIva', P.iva ? IVA[P.iva] : null); metti('pZone', P.zone.length ? P.zone.join(', ') : P.zoneChieste ? 'Da vedere insieme' : null);
  }
  function unisci(o) {
    ['lic', 'anni', 'vend', 'team', 'iva', 'altro', 'zero', 'nc'].forEach(function (k) { if (o[k] != null) P[k] = o[k]; });
    (o.zone || []).forEach(function (z) { if (P.zone.indexOf(z) < 0) P.zone.push(z); });
    if (P.zero && P.anni == null) P.anni = 0;
  }
  var DOM = {
    anni: 'Da quanto tempo vendi case?',
    lic: 'Hai l’abilitazione da agente immobiliare, il patentino?',
    vend: 'Quante vendite hai chiuso negli ultimi dodici mesi?',
    team: 'Lavori per conto tuo o hai una squadra?',
    cosa: 'Di cosa ti occupi più volentieri?',
    iva: 'Qui si lavora da professionisti, a partita IVA. Per te va bene?',
    zone: 'In quali zone ti muovi meglio? Tocca quelle giuste, poi «Avanti».'
  };
  function prossima() {
    if (verdetto) return;
    if (P.anni == null && !P.altro) return chiedi('anni');
    if (P.anni == null && P.altro) P.anni = 0;
    if (!P.lic) return chiedi('lic');
    if (P.vend == null && !P.vendSalta) { if (immAnni(P) >= 1) return chiedi('vend'); P.vendSalta = 1; }
    if (P.team == null) { if (immAnni(P) >= 1) return chiedi('team'); P.team = 0; }
    if (!P.cosaChiesta && !P.nc) return chiedi('cosa');
    if (!P.iva) return chiedi('iva');
    if (!P.zoneChieste && !P.zone.length) return chiedi('zone');
    decidi();
  }
  function chiedi(k, intro) { attesa = k; A.dice('<p>' + (intro ? intro + ' ' : '') + DOM[k] + '</p>', function (m) { domanda(k, m); }); }
  function domanda(k, m) {
    attesa = k;
    function fatto(patch) { return function (v) { attesa = null; patch(v); profilo(); prossima(); }; }
    if (k === 'anni') A.scelte(m, [['Comincio adesso', 0], ['Da 1 a 3 anni', 2], ['Da 4 a 8 anni', 6], ['Da più di 8', 10], ['Vengo da un altro settore', -1]], fatto(function (v) { if (v < 0) { P.altro = P.altro || 'vendita'; P.anni = 0; } else P.anni = v; }));
    if (k === 'lic') A.scelte(m, [['Sì', 'si'], ['Lo sto prendendo', 'corso'], ['Non ancora', 'no']], fatto(function (v) { P.lic = v; }));
    if (k === 'vend') A.scelte(m, [['Fino a 3', 2], ['Da 4 a 8', 6], ['Da 9 a 15', 12], ['Più di 15', 18]], fatto(function (v) { P.vend = v; }));
    if (k === 'team') A.scelte(m, [['Senza squadra', 0], ['Una squadra di 2-4', 3], ['Una squadra di 5 o più', 6]], fatto(function (v) { P.team = v; }));
    if (k === 'cosa') A.scelte(m, [['Case di fascia medio-alta', 'case'], ['Immobili di pregio', 'pregio'], ['Nuove costruzioni', 'nc']], fatto(function (v) { P.cosaChiesta = 1; P.cosa = v; if (v === 'nc') P.nc = 1; }));
    if (k === 'iva') A.scelte(m, [['Sì, lavoro già così', 'gia'], ['Sì, la apro', 'pronto'], ['Cerco un contratto da dipendente', 'dip']], function (v) {
      attesa = null; P.iva = v; profilo();
      if (v === 'dip') A.dice('<p>Te lo dico come sta: in Immobildream si lavora in autonomia, a partita IVA. Se cerchi un contratto da dipendente, questa non è la strada giusta.</p><p>Se vuoi parlarne lo stesso, andiamo avanti.</p>');
      prossima();
    });
    if (k === 'zone') A.scelte(m, [['Parioli e Pinciano', 'Parioli e Pinciano'], ['Trieste e Salario', 'Trieste e Salario'], ['Prati', 'Prati'], ['Flaminio e Vigna Clara', 'Flaminio e Vigna Clara'], ['Centro storico', 'Centro storico'], ['Balduina e Monte Mario', 'Balduina e Monte Mario'], ['Altre zone', 'Altre zone'], ['Nessuna in particolare', null, 'nessuno']],
      fatto(function (v) { P.zoneChieste = 1; v.forEach(function (z) { if (P.zone.indexOf(z) < 0) P.zone.push(z); }); }), true);
  }
  function decidi() {
    var r = scegli(P), R0 = R[r]; verdetto = r;
    var perche = r === 'tm' ? 'Hai l’abilitazione e una squadra: è il profilo che serve per guidare un gruppo.'
      : r === 'nc' ? 'Hai l’abilitazione e ti interessano le nuove costruzioni.'
        : r === 'ag' ? 'Hai l’abilitazione e ' + immAnni(P) + ' anni sul campo.'
          : P.lic !== 'si' ? (P.altro ? 'Sai vendere, ma non hai ancora l’abilitazione. ' : 'Non hai ancora l’abilitazione. ') + 'Da consulente hai l’Academy, un tutor e una zona tua.'
            : 'Hai l’abilitazione ma pochi anni sul campo. Da consulente hai una zona tua e un tutor.';
    var altro = pref && pref !== r ? '<p>Mi avevi indicato ' + R[pref].n + '. Con queste risposte vedo meglio questo: in sede ne parlate.</p>' : '';
    A.dice('<p>Grazie. Per te vedo questo ruolo.</p><div class="verdetto"><span>Ruolo proposto</span><strong>' + R0.n + '</strong><ul>' + R0.t.slice(0, 4).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div><p>' + perche + '</p>' + altro, function () { setRuolo(R0.n); ruolo(r); });
    A.dice('<p>Il prossimo colloquio è di persona, in via Dora 2. Lasciami i tuoi contatti: ti richiama la selezione per fissarlo.</p>', function (m) { modulo(m); });
  }
  function modulo(m) {
    attesa = 'modulo';
    var f = el('div', 'modulo');
    f.innerHTML = '<label>Nome e cognome<input type="text" name="n" autocomplete="name"></label>' +
      '<label>Telefono<input type="tel" name="t" autocomplete="tel" inputmode="tel"></label>' +
      '<div><span style="display:block;margin-bottom:7px;font:500 15.5px/1.2 var(--sans)">Quando ti troviamo?</span><div class="scelte" role="group"><button type="button" class="scelta" aria-pressed="true">Mattina</button><button type="button" class="scelta" aria-pressed="false">Pomeriggio</button><button type="button" class="scelta" aria-pressed="false">Sera</button></div></div>' +
      '<label class="cv"><input type="file" name="cv" accept=".pdf,.doc,.docx,image/*"><span class="scelta">Allega il curriculum</span><span class="cvn">Con la fotografia: senza, non viene considerato. Se non l’hai qui, lo porti al colloquio.</span></label>' +
      '<label class="ok"><input type="checkbox" name="ok"><span>Va bene che Immobildream mi contatti per la selezione.</span></label>' +
      '<p class="sbaglio" role="alert" hidden></p><button type="button" class="btn">Invia la candidatura</button>';
    m.appendChild(f); A.giu();
    var nm = $('[name=n]', f), tl = $('[name=t]', f), cv = $('[name=cv]', f), ok = $('[name=ok]', f), er = $('.sbaglio', f), q = $$('.scelte .scelta', f), cvn = '';
    nm.value = nome.trim(); nm.addEventListener('input', function () { inp.value = nm.value; setNome(nm.value); });
    q.forEach(function (c) { c.onclick = function () { q.forEach(function (x) { x.setAttribute('aria-pressed', x === c); }); }; });
    cv.addEventListener('change', function () { if (cv.files && cv.files[0]) { cvn = cv.files[0].name; $('.cvn', f).textContent = cvn; } });
    $('.btn', f).onclick = function () {
      var msg = ''; nm.classList.remove('err'); tl.classList.remove('err');
      if (nm.value.trim().length < 2) { msg = 'Manca il nome.'; nm.classList.add('err'); nm.focus(); }
      else if (tl.value.replace(/\D/g, '').length < 8) { msg = 'Il numero sembra incompleto.'; tl.classList.add('err'); tl.focus(); }
      else if (!ok.checked) msg = 'Per richiamarti ci serve il tuo consenso: spunta la casella.';
      if (msg) { er.textContent = msg; er.hidden = false; A.giu(); return; }
      var qi = 0; q.forEach(function (x, i) { if (x.getAttribute('aria-pressed') === 'true') qi = i; });
      P.nome = nm.value.trim(); P.tel = tl.value.trim(); P.quando = ['in mattinata', 'nel pomeriggio', 'in serata'][qi]; P.cv = cvn; P.inviato = 1; attesa = null;
      setNome(P.nome); inp.value = P.nome;
      f.innerHTML = '<p style="font-size:16px;color:var(--ink-2)">' + esc(P.nome) + ' · ' + esc(P.tel) + ' · ' + P.quando + (cvn ? ' · ' + esc(cvn) : '') + '</p>';
      A.dice('<p><b>Fatto, ' + esc(P.nome.split(' ')[0]) + '.</b> La selezione ti richiama ' + P.quando + ' per fissare il colloquio in via Dora.</p><p>' + (cvn ? 'Il curriculum l’abbiamo.' : 'Porta il curriculum, con la fotografia.') + '</p>', function (m2) {
        var b = el('button', 'apri-quinte', '<i aria-hidden="true"></i>Dietro le quinte: cosa è arrivato all’agenzia'); b.type = 'button'; b.onclick = function () { Q.apri(scheda(P), b); };
        m2.appendChild(b);
        setTimeout(function () { Q.apri(scheda(P), b); }, C.reduce ? 300 : 1900);
      });
    };
    if (!C.coarse) setTimeout(function () { (nm.value ? tl : nm).focus({ preventScroll: true }); }, 60);
  }
  var INT = [
    [/fisso|stipendio|quanto\s+si\s+guadagna|provvigion|retribuzion|soldi/, 'Si guadagna con le vendite: provvigioni tra le più alte del settore e un incentivo per ogni incarico. In più c’è un fisso mensile. Le cifre te le dicono di persona, in via Dora.'],
    [/dove|sede|ufficio|indirizzo/, 'La sede è a Roma, in via Dora 2.'],
    [/chi\s+sei|robot|\bbot\b|intelligenza|\bai\b|umano|persona\s+vera/, 'Sono un’assistente AI. Faccio il primo colloquio e preparo il tuo profilo. Il secondo colloquio è con una persona.'],
    [/orari|part.?time|full.?time|remoto|smart/, 'Di orari e organizzazione parli in sede. Lavori in autonomia: le giornate le organizzi tu.'],
    [/formazione|academy|corso|tutor/, 'C’è un’Academy interna, con un tutor. E i primi tempi lavori accanto a chi ha più esperienza.']
  ];
  function testo(raw) {
    A.utente(raw); if (!partita) partita = true;
    var t = fold(raw), w = attesa, m;
    if (w === 'modulo') return A.dice('<p>Scrivi nome e telefono nei campi qui sopra.</p>');
    if (verdetto) return A.dice('<p>' + (P.inviato ? 'La candidatura c’è già. Ti richiamiamo noi.' : 'Il ruolo lo confermi in sede. Lasciami i contatti qui sopra e ti richiamano.') + '</p>');
    var o = capisce(raw);
    if (w === 'anni' && o.anni == null && (m = /\d{1,2}/.exec(raw))) o.anni = +m[0];
    if (w === 'vend' && o.vend == null && (m = /\d{1,3}/.exec(raw))) o.vend = +m[0];
    if (w === 'lic' && !o.lic) { if (/in\s+corso|sto\s+(?:prendendo|facendo|studiando)|quasi/.test(t)) o.lic = 'corso'; else if (/^s[iì]\b|certo|ce\s+l'ho/.test(t)) o.lic = 'si'; else if (/^no\b|non\s+ancora|non\s+ce\s+l'ho/.test(t)) o.lic = 'no'; }
    if (w === 'team' && o.team == null) { if (/\bsol[oa]\b|nessun|^no\b/.test(t)) o.team = 0; else if ((m = /\d{1,2}/.exec(raw))) o.team = +m[0]; }
    if (w === 'iva' && !o.iva) { if (/^s[iì]\b|va\s+bene|certo|\bok\b/.test(t)) o.iva = 'pronto'; else if (/^no\b/.test(t)) o.iva = 'dip'; }
    if (w === 'cosa' && !pieno(o)) { attesa = null; P.cosaChiesta = 1; P.cosa = /pregio|lusso|luxury/.test(t) ? 'pregio' : 'case'; return prossima(); }
    if (w === 'zone' && !pieno(o)) { attesa = null; P.zoneChieste = 1; if (raw.length > 2 && !/^no|nessun/.test(t)) P.zone.push(cap(raw.replace(/[.!?]+$/, '')).slice(0, 40)); profilo(); return prossima(); }
    if (!pieno(o)) {
      var a = null; INT.some(function (i) { if (i[0].test(t)) { a = i[1]; return true; } });
      A.dice('<p>' + (a || 'Qui non ho trovato quello che mi serve. Andiamo per domande.') + '</p>');
      if (w && DOM[w]) return chiedi(w);
      return prossima();
    }
    if (!primo) primo = raw;
    attesa = null; unisci(o); profilo();
    if (pieno(o) >= 2) {
      var a2 = []; if (P.anni != null) a2.push(P.anni ? P.anni + (P.anni === 1 ? ' anno' : ' anni') + (P.altro ? ' in un altro settore' : ' nell’immobiliare') : 'cominci adesso');
      if (P.vend != null) a2.push(P.vend + ' vendite negli ultimi dodici mesi'); if (P.lic) a2.push(P.lic === 'si' ? 'abilitazione sì' : P.lic === 'corso' ? 'abilitazione in corso' : 'abilitazione non ancora');
      if (P.team != null) a2.push(P.team ? 'una squadra di ' + P.team : 'senza squadra'); if (P.zone.length) a2.push(lista(P.zone));
      A.dice('<p>Segnato: ' + a2.join(', ') + '.</p>');
    }
    prossima();
  }

  /* ---------- il profilo e il punteggio che arrivano alla selezione ---------- */
  function scheda(p) {
    var r = verdetto || scegli(p), k = [], tot = 0;
    function add(nome, v, max) { k.push([nome, v, max]); tot += v; }
    add('Abilitazione: ' + (p.lic ? LIC[p.lic].toLowerCase() : 'non detta'), p.lic === 'si' ? 25 : p.lic === 'corso' ? 14 : 5, 25);
    var a = immAnni(p); add('Esperienza: ' + (anniTxt(p) || 'non detta').toLowerCase(), a > 8 ? 20 : a >= 4 ? 16 : a >= 1 ? 10 : 4, 20);
    add('Vendite in 12 mesi: ' + (p.vend != null ? p.vend : 'non ancora'), p.vend == null ? 3 : p.vend > 15 ? 20 : p.vend >= 9 ? 16 : p.vend >= 4 ? 10 : 5, 20);
    add(p.team ? 'Porta una squadra di ' + p.team : 'Lavora senza squadra', (p.team || 0) >= 5 ? 15 : (p.team || 0) >= 2 ? 12 : 6, 15);
    add('Partita IVA: ' + (p.iva ? IVA[p.iva].toLowerCase() : 'non detto'), p.iva === 'gia' ? 15 : p.iva === 'pronto' ? 12 : 0, 15);
    var z = p.zone.filter(function (x) { return x !== 'Altre zone'; }).length; add(z ? 'Conosce zone che seguite' : 'Zone da vedere insieme', z ? 5 : 2, 5);
    var pr = tot >= 75 ? 'A' : tot >= 50 ? 'B' : 'C';
    var perche = pr === 'A' ? 'Da incontrare subito' : pr === 'B' ? 'Da incontrare' : 'Da valutare, o da formare';
    var nota = p.iva === 'dip' ? 'Cerca un contratto da dipendente: chiarirlo prima di fissare il colloquio.'
      : r === 'tm' ? 'Chiedere quante persone della squadra porterebbe, e in che tempi.'
        : r === 'nc' ? 'Chiedere su quali cantieri ha lavorato e con quali costruttori.'
          : r === 'ag' ? ((p.vend || 0) >= 9 ? 'Volume alto: chiedere degli incarichi che ha in corso.' : 'Chiedere degli incarichi in corso e delle zone che copre.')
            : p.lic !== 'si' ? 'Da avviare all’abilitazione: verificare la disponibilità per l’Academy.' : 'Pochi anni sul campo: valutare zona e tutor.';
    var nomeC = p.nome || '(nome e cognome)', tel = p.tel || '(telefono)';
    var testo = 'Ruolo proposto: ' + R[r].n + '. ' + cap(anniTxt(p) || 'Esperienza non detta') + '; abilitazione: ' + (p.lic ? LIC[p.lic].toLowerCase() : 'non detta') +
      (p.vend != null ? '; ' + p.vend + ' vendite negli ultimi dodici mesi' : '') + '. ' + (p.team ? 'Porta una squadra di ' + p.team + '. ' : 'Lavora senza squadra. ') +
      'Partita IVA: ' + (p.iva ? IVA[p.iva].toLowerCase() : 'non detto') + '. ' + (p.zone.length ? 'Zone: ' + p.zone.join(', ') + '. ' : '') +
      (p.cosa === 'pregio' ? 'Preferisce gli immobili di pregio. ' : p.cosa === 'nc' ? 'Preferisce le nuove costruzioni. ' : '') + nota + ' Richiamare ' + (p.quando || 'in mattinata') + '.';
    var mail = '<b>Oggetto: Nuova candidatura · ' + esc(R[r].n) + ' · priorità ' + pr + ' (' + tot + '/100)</b>\n\nNome: ' + esc(nomeC) + '\nTelefono: ' + esc(tel) + '\nRichiamare: ' + (p.quando || 'in mattinata') + '\nCurriculum: ' + (p.cv ? 'allegato (' + esc(p.cv) + ')' : 'lo porta al colloquio') +
      '\n\n' + esc(testo) + '\n\nPunteggio: ' + tot + ' su 100\n' + k.map(function (x) { return '· ' + esc(x[0]) + ': ' + x[1] + ' su ' + x[2]; }).join('\n') +
      (primo ? '\n\nParole del candidato:\n«' + esc(primo) + '»' : '') + '\n\nProvenienza: landing «Lavora con noi»';
    var wa = '<b>Nuova candidatura · priorità ' + pr + ' (' + tot + '/100)</b>\n' + esc(nomeC) + ', ' + esc(tel) + '\n' + esc(R[r].n) + ' · ' + esc((anniTxt(p) || 'esperienza non detta').toLowerCase()) + '\nAbilitazione: ' + (p.lic ? LIC[p.lic].toLowerCase() : 'non detta') + '\nRichiamare ' + (p.quando || 'in mattinata');
    return { priorita: pr, punti: tot, perche: perche, criteri: k, profilo: testo, mail: mail, wa: wa };
  }
  $('#qEs').onclick = function () {
    var era = primo, v = verdetto; primo = 'Ho l’abilitazione, 12 anni di esperienza, coordino una squadra di 4 consulenti tra Parioli e Flaminio. 30 vendite negli ultimi dodici mesi.'; verdetto = null;
    var s = scheda({ lic: 'si', anni: 12, vend: 30, team: 4, iva: 'gia', zone: ['Parioli', 'Flaminio'], cosa: 'pregio', quando: 'nel pomeriggio' });
    primo = era; verdetto = v; Q.apri(s, this);
  };

  $$('#prove .scelta').forEach(function (c) {
    c.onclick = function () { if (A.occupato()) return; partita = true; nuova(true); A.batti(c.getAttribute('data-t'), function (s) { testo(s); }); };
  });

  P = { zone: [] };
  ruolo('ag');
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es, io) { if (es[0].isIntersecting) { parti(); io.disconnect(); } }, { threshold: .15 }).observe($('.chat'));
  else parti();
  window.__imm = { capisce: capisce, scegli: scegli, scheda: scheda, stato: function () { return P; }, testo: testo };
})();
