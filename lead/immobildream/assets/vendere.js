/* Immobildream · landing «Vendere»
   L'assistente fa al proprietario le domande decise dall'agenzia, lascia una stima indicativa
   e prepara per l'agenzia un profilo con punteggio e priorità.
   In anteprima: regole scritte da Umbra, valori di zona d'esempio, nessun dato inviato.
   Online: al posto di capisce() e delle risposte fisse c'è un modello AI; la stima arriva dal valutometro di Immobildream. */
(function () {
  'use strict';
  var C = window.Casa, d = document, $ = C.$, $$ = C.$$, el = C.el, esc = C.esc, T = C.t;
  var eur = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  function lista(a, e) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' ' + (e || 'e') + ' ' + a[a.length - 1]; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- le zone: valori d'esempio, da sostituire con quelli dell'agenzia ---------- */
  var Z = {
    parioli:       { n: 'Parioli', pre: 'ai Parioli', enP: 'in Parioli', code: 'Q. II', eur: 6900, band: [6000, 9500], k: ['parioli', 'piazza euclide', 'viale bruno buozzi', 'via archimede', 'piazza ungheria', 'villa glori', 'piazza delle muse'], d: 'Tra Villa Borghese, Villa Glori e Villa Ada.', den: 'Between Villa Borghese, Villa Glori and Villa Ada.' },
    pinciano:      { n: 'Pinciano', pre: 'al Pinciano', enP: 'in Pinciano', code: 'Q. III', eur: 7000, band: [6000, 9800], k: ['pinciano', 'via pinciana', 'villa borghese', 'piazza verdi'], d: 'A ridosso di Villa Borghese, tra ambasciate e palazzi di inizio Novecento.', den: 'On the edge of Villa Borghese, among embassies and early twentieth-century buildings.' },
    trieste:       { n: 'Trieste', pre: 'nel quartiere Trieste', enP: 'in the Trieste quarter', code: 'Q. XVII', eur: 5900, band: [5000, 7800], k: ['quartiere trieste', 'corso trieste', 'coppede', 'piazza mincio', 'via dora', 'via tagliamento', 'piazza buenos aires', 'piazza istria', 'trieste'], d: 'Da corso Trieste a piazza Mincio, con le architetture del Quartiere Coppedè. Qui c’è la nostra sede.', den: 'From Corso Trieste to Piazza Mincio, with the architecture of the Coppedè district. Our office is here.' },
    salario:       { n: 'Salario', pre: 'al Salario', enP: 'in Salario', code: 'Q. IV', eur: 5700, band: [4800, 7500], k: ['salario', 'piazza fiume', 'villa albani', 'via salaria'], d: 'Tra piazza Fiume e Villa Albani.', den: 'Between Piazza Fiume and Villa Albani.' },
    flaminio:      { n: 'Flaminio', pre: 'al Flaminio', enP: 'in Flaminio', code: 'Q. I', eur: 5700, band: [4800, 7500], k: ['flaminio', 'maxxi', 'piazza mancini', 'viale tiziano', 'ponte della musica', 'villaggio olimpico'], d: 'Tra il MAXXI, il Ponte della Musica e il Tevere.', den: 'Between the MAXXI, Ponte della Musica and the Tiber.' },
    prati:         { n: 'Prati', pre: 'a Prati', enP: 'in Prati', code: 'R. XXII', eur: 6400, band: [5500, 8500], k: ['prati', 'cola di rienzo', 'piazza cavour', 'piazza mazzini', 'viale mazzini', 'piazza risorgimento'], d: 'Viali alberati e palazzi umbertini, tra il Tevere e San Pietro.', den: 'Tree-lined avenues and late nineteenth-century buildings, between the Tiber and St Peter’s.' },
    spagna:        { n: 'Piazza di Spagna', pre: 'a piazza di Spagna', enP: 'near Piazza di Spagna', code: 'R. IV', eur: 9800, band: [8500, 14000], k: ['piazza di spagna', 'tridente', 'via del babuino', 'via margutta', 'piazza del popolo', 'via condotti', 'via dei condotti', 'campo marzio'], d: 'Il Tridente: via Condotti, via Margutta, piazza del Popolo.', den: 'The Tridente: Via Condotti, Via Margutta, Piazza del Popolo.' },
    navona:        { n: 'Piazza Navona', pre: 'a piazza Navona', enP: 'near Piazza Navona', code: 'R. VI', eur: 8800, band: [7500, 12500], k: ['piazza navona', 'navona', 'pantheon', 'campo de\' fiori', 'campo dei fiori', 'via giulia', 'parione', 'piazza farnese'], d: 'Il cuore barocco, tra il Pantheon e il Tevere.', den: 'The baroque heart, between the Pantheon and the Tiber.' },
    vignastelluti: { n: 'Vigna Stelluti', pre: 'a Vigna Stelluti', enP: 'in Vigna Stelluti', code: 'Roma Nord', eur: 5100, band: [4300, 6900], k: ['vigna stelluti'], d: 'La via dei negozi di Roma Nord, a un passo da Vigna Clara.', den: 'The shopping street of northern Rome, a step from Vigna Clara.' },
    vignaclara:    { n: 'Vigna Clara', pre: 'a Vigna Clara', enP: 'in Vigna Clara', code: 'Roma Nord', eur: 5000, band: [4200, 6800], k: ['vigna clara', 'collina fleming', 'fleming', 'ponte milvio'], d: 'Il verde di Roma Nord, a due passi da Ponte Milvio.', den: 'The green side of northern Rome, a short walk from Ponte Milvio.' },
    corsofrancia:  { n: 'Corso Francia', pre: 'a corso Francia', enP: 'on Corso Francia', code: 'Roma Nord', eur: 4600, band: [3900, 6200], k: ['corso francia', 'corso di francia', 'tor di quinto'], d: 'Dal Villaggio Olimpico al Fleming, oltre il Tevere.', den: 'From the Olympic Village to Fleming, across the Tiber.' },
    balduina:      { n: 'Balduina', pre: 'alla Balduina', enP: 'in Balduina', code: 'Q. XIV', eur: 4200, band: [3600, 5500], k: ['balduina', 'medaglie d\'oro'], d: 'Sulla collina, con Roma ai piedi e la cupola all’orizzonte.', den: 'On the hill, with Rome below and the dome on the horizon.' },
    montemario:    { n: 'Monte Mario', pre: 'a Monte Mario', enP: 'on Monte Mario', code: 'Roma Nord', eur: 3900, band: [3200, 5000], k: ['monte mario'], d: 'Il colle più alto di Roma, tra la riserva e l’Osservatorio.', den: 'The highest hill in Rome, between the nature reserve and the Observatory.' },
    cortina:       { n: 'Cortina d’Ampezzo', pre: 'a Cortina d’Ampezzo', enP: 'in Cortina d’Ampezzo', code: 'Dolomiti', legno: 1, eur: 15500, band: [11000, 22000], k: ['cortina d\'ampezzo', 'cortina', 'ampezzo'], d: 'La conca ampezzana, tra le Tofane e il Cristallo.', den: 'The Ampezzo basin, between the Tofane and Monte Cristallo.' },
    centro:        { n: 'Centro storico', pre: 'in centro storico', enP: 'in the historic centre', code: 'Rioni', eur: 9000, band: [7500, 14000], k: ['centro storico', 'in centro', 'centro di roma'] },
    roma:          { n: 'Roma', pre: 'a Roma', enP: 'in Rome', code: 'Roma', eur: 4500, band: [3500, 6500], k: [], largo: 1 }
  };
  var ORDINE = ['cortina', 'parioli', 'pinciano', 'spagna', 'navona', 'centro', 'prati', 'flaminio', 'vignastelluti', 'vignaclara', 'corsofrancia', 'balduina', 'montemario', 'salario', 'trieste'];
  var MURO = ['parioli', 'pinciano', 'trieste', 'salario', 'flaminio', 'prati', 'spagna', 'navona', 'vignaclara', 'vignastelluti', 'corsofrancia', 'balduina', 'montemario', 'cortina'];
  function rx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  ORDINE.forEach(function (id) { Z[id].re = Z[id].k.map(function (k) { return new RegExp('(^|[^a-z])' + rx(k) + '(?![a-z])'); }); });
  function nomeZ(id) { return Z[id].n; }
  function luogo(s) { return s.fuori ? (s.fuoriTxt ? T('a ', 'in ') + s.fuoriTxt : T('fuori Roma', 'outside Rome')) : s.zona === 'roma' && s.zonaTxt ? T('in zona ', 'in the ') + s.zonaTxt + T('', ' area') : T(Z[s.zona].pre, Z[s.zona].enP); }

  /* ---------- il muro delle targhe ---------- */
  var muro = $('#targhe'), zSel = 'parioli';
  MURO.forEach(function (id) {
    var z = Z[id], b = el('button'); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('data-z', id);
    b.innerHTML = '<span class="targa' + (z.legno ? ' targa--legno' : '') + '"><small>' + esc(z.code) + '</small>' + esc(z.n) + '</span>';
    b.onclick = function () { scegliZona(id, true); };
    muro.appendChild(b);
  });
  function scegliZona(id, anim) {
    zSel = id; var z = Z[id];
    $$('button', muro).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-z') === id); });
    $('#zN').textContent = z.n; $('#zD').textContent = T(z.d, z.den);
    $('#zV').textContent = eur(z.band[0]) + ' – ' + eur(z.band[1]) + T(' € al mq', ' € per sq m');
    $('#zB').textContent = T('Valuti una casa ' + z.pre, 'Value a home ' + z.enP);
    var p = $('#zona'); if (anim && !C.reduce && p.animate) p.animate([{ opacity: .3 }, { opacity: 1 }], { duration: 520, easing: 'ease-out' });
  }
  scegliZona('parioli');
  $('#zB').onclick = function () {
    mostra('a'); $('#stima').scrollIntoView();
    partita = true; nuova(true); S.zona = zSel; scheda();
    A.dice(T('<p>' + Z[zSel].n + ', bene. Che tipo di casa è?</p>', '<p>' + Z[zSel].n + ', very well. What kind of home is it?</p>'), function (m) { domanda('tipo', m); });
  };

  /* ---------- le due linguette: domande o valutometro ---------- */
  var lg = $$('.linguette button');
  function mostra(k) {
    lg.forEach(function (b) { var on = b.id === 'lg-' + k; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; $('#' + b.getAttribute('aria-controls')).hidden = !on; });
  }
  lg.forEach(function (b, i) {
    b.onclick = function () { mostra(b.id.slice(3)); };
    b.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { var o = lg[(i + 1) % lg.length]; o.focus(); o.click(); } });
  });

  /* ---------- capire una frase scritta a mano ---------- */
  function fold(s) { return s.toLowerCase().replace(/[àáâä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[’`´]/g, '\''); }
  var UN = '(?:mq|m2|m²|metri(?:\\s*quadr\\w*)?|sq\\.?\\s*m(?:et\\w+)?|sqm|square\\s+met\\w+)';
  var TIPI = [
    [/\b(?:super)?attico\b|\bpenthouse\b/, 'attico'], [/\bvillino\b|\bvill(?:a|etta)\b(?!\s+(?:borghese|ada|torlonia|glori|pamphil|sciarra|albani))|\bcasale\b|\bchalet\b|\bdetached\b/, 'villa'],
    [/\bnegozio\b|\bufficio\b|\bcapannone\b|\bmagazzino\b|\bintero\s+stabile\b|\bpalazzina\b|\blocale\s+commerciale\b|\bshop\b|\boffice\b/, 'altro'],
    [/\bappartamento\b|\bbilocale\b|\btrilocale\b|\bquadrilocale\b|\bmonolocale\b|\bpiano\s+nobile\b|\bapartment\b|\bflat\b/, 'app']
  ];
  var FUORI = /\b(?:a|ad|in|di|on|near)\s+(milano|napoli|torino|firenze|bologna|venezia|genova|palermo|bari|verona|capri|ischia|positano|amalfi|porto\s+cervo|porto\s+ercole|capalbio|ansedonia|forte\s+dei\s+marmi|portofino|courmayeur|madonna\s+di\s+campiglio|anzio|fregene|santa\s+marinella|sabaudia|san\s+felice\s+circeo|bracciano|manziana|tivoli|frascati|viterbo|latina)\b/;
  function capisce(raw) {
    var t = fold(raw), o = { piu: {} }, m, i, j;
    if ((m = FUORI.exec(t))) { o.fuori = 1; o.fuoriTxt = m[1].replace(/(^|\s)([a-z])(?!ei\s|i\s)/g, function (x, a, b) { return a + b.toUpperCase(); }); }
    else if (/\bfuori\s+roma\b|\boutside\s+rome\b/.test(t)) o.fuori = 1;
    else if ((m = /\b(?:via|viale)\s+cortina(?:\s+d'ampezzo)?/.exec(t))) { o.zona = 'roma'; o.zonaTxt = 'via Cortina d’Ampezzo'; }
    else for (i = 0; i < ORDINE.length && !o.zona; i++) for (j = 0; j < Z[ORDINE[i]].re.length; j++) if (Z[ORDINE[i]].re[j].test(t)) { o.zona = ORDINE[i]; break; }
    for (i = 0; i < TIPI.length; i++) if (TIPI[i][0].test(t)) { o.tipo = TIPI[i][1]; break; }
    // esterni: la loro metratura non è quella della casa
    var est = [];
    m = new RegExp('(\\d{1,4})\\s*' + UN + '\\s+(?:di|of)\\s+terra\\w*').exec(t) || new RegExp('terra[zc]\\w*(?:\\s+(?:di|da|of)\\s+(?:circa\\s+)?(\\d{1,4})\\s*' + UN + ')?').exec(t);
    if (m && /terra[zc]/.test(m[0])) { o.piu.terrazzo = 1; est.push([m.index, m.index + m[0].length]); }
    m = new RegExp('giardin\\w*|\\bgarden\\b').exec(t); if (m && !/giardino\s+degli\s+aranci/.test(t)) { o.piu.giardino = 1; est.push([m.index, m.index + m[0].length + 22]); }
    if (/balcon/.test(t)) o.piu.balconi = 1;
    if (/\bbox\b|\bgarage\b|posto\s+auto|autorimessa|parking/.test(t)) o.piu.box = 1;
    if (/\bvista\b|panoramic|\baffacci|\bview/.test(t)) o.piu.vista = 1;
    if (/portier|portineria|concierge/.test(t)) o.piu.portiere = 1;
    var re = new RegExp('(\\d{2,4})\\s*' + UN, 'g'), best = null;
    while ((m = re.exec(t))) { var dentro = est.some(function (e) { return m.index >= e[0] && m.index < e[1]; }); if (!dentro && (!best || +m[1] > +best[1])) best = m; }
    if (best) o.mq = +best[1];
    if (/ultimo\s+piano|top\s+floor/.test(t)) o.piano = 'ultimo';
    else if (/pian(?:o\s+)?terr(?:a|eno)|rialzato|ground\s+floor/.test(t)) o.piano = 'terra';
    else if (/(primo|secondo|first|second)\s+(?:piano|floor)|\b[12]\s*(?:°|º|o)?\s*piano/.test(t)) o.piano = 'basso';
    else if (/(terzo|quarto|quinto|sesto|settimo|ottavo|third|fourth|fifth|sixth|seventh)\s+(?:piano|floor)|\b(?:[3-9]|1\d)\s*(?:°|º|o)?\s*piano|pian[oi]\s+alt[oi]|high\s+floor/.test(t)) o.piano = 'alto';
    if (/da\s+(?:ristrutturare|rimodernare|sistemare|rinnovare|rifare)|needs?\s+renovat|to\s+(?:be\s+)?renovate/.test(t)) o.stato = 'da';
    else if (/ristrutturat|rinnovat|rifatt|\bnuov[oa]\b|ottim[oe]\s+(?:stato|condizioni)|\brenovated\b|excellent\s+condition/.test(t)) o.stato = 'ok';
    else if (/buon[oe]?\s+(?:stato|condizioni)|abitabile|ben\s+tenut|good\s+condition/.test(t)) o.stato = 'buono';
    return o;
  }
  function pieno(o) { var n = 0; ['zona', 'fuori', 'tipo', 'mq', 'piano', 'stato'].forEach(function (k) { if (o[k]) n++; }); return n + Object.keys(o.piu).length; }

  /* ---------- le parole per dirlo ---------- */
  var TIPO = { app: ['Appartamento', 'Apartment', 'un appartamento', 'an apartment'], attico: ['Attico', 'Penthouse', 'un attico', 'a penthouse'], villa: ['Villa o villino', 'Villa', 'una villa', 'a villa'], altro: ['Altro', 'Other', 'un immobile', 'a property'] };
  var PIANO = { terra: ['Terra o rialzato', 'Ground or raised', -.06], basso: ['Primo o secondo', 'First or second', -.01], alto: ['Dal terzo in su', 'Third or higher', .03], ultimo: ['Ultimo piano', 'Top floor', .05] };
  var STATO = { ok: ['Ristrutturata', 'Renovated', .10, 'ristrutturata', 'renovated'], buono: ['In buono stato', 'Good condition', 0, 'in buono stato', 'in good condition'], da: ['Da ristrutturare', 'Needs renovation', -.14, 'da ristrutturare', 'needing renovation'] };
  var PIU = { terrazzo: ['Terrazzo', 'Terrace', .08], balconi: ['Balconi', 'Balconies', .02], box: ['Box o posto auto', 'Garage or parking', .035], giardino: ['Giardino', 'Garden', .05], vista: ['Vista aperta', 'Open view', .06], portiere: ['Portiere', 'Concierge', .015] };
  var TEMPI = { subito: ['Appena possibile', 'As soon as possible', 25], anno: ['Entro un anno', 'Within a year', 18], capire: ['Per ora voglio solo capire', 'For now I just want to understand', 6] };
  var LIBERA = { libera: ['È libera', 'It is vacant', 10], abito: ['Ci abito', 'I live there', 7], affitto: ['È affittata', 'It is rented out', 4] };
  var L = function (a) { return T(a[0], a[1]); };

  function stimabile(s) { return !!s.zona && !s.fuori && (!s.tipo || s.tipo !== 'altro'); }
  function stima(s) {
    if (!stimabile(s) || !s.mq) return null;
    var z = Z[s.zona], mult = 1;
    if (s.tipo === 'attico') mult += .12; else if (s.tipo === 'villa') mult += .05;
    if (s.tipo === 'app' && s.piano) mult += PIANO[s.piano][2];
    if (s.stato) mult += STATO[s.stato][2];
    for (var k in s.piu) if (PIU[k]) mult += PIU[k][2];
    var v = z.eur * s.mq * mult, sp = z.largo ? .12 : .07, passo = v >= 1e6 ? 10000 : 5000;
    var lo = Math.round(v * (1 - sp) / passo) * passo, hi = Math.round(v * (1 + sp) / passo) * passo;
    return { lo: lo, hi: hi, mlo: Math.round(lo / s.mq / 50) * 50, mhi: Math.round(hi / s.mq / 50) * 50 };
  }
  function frase(s, it) {
    var en = it ? false : C.lang === 'en', t = s.tipo ? TIPO[s.tipo] : ['', '', 'una casa', 'a home'], out = en ? t[3] : t[2];
    if (s.mq) out += en ? ' of ' + s.mq + ' sq m' : ' di ' + s.mq + ' mq';
    if (s.zona || s.fuori) out += ' ' + (it ? luogoIt(s) : luogo(s));
    if (s.tipo === 'app' && s.piano) out += ', ' + (en ? { ultimo: 'top floor', terra: 'ground or raised floor', basso: 'first or second floor', alto: 'on a higher floor' }[s.piano] : { ultimo: 'ultimo piano', terra: 'piano terra o rialzato', basso: 'primo o secondo piano', alto: 'piano alto' }[s.piano]);
    var con = Object.keys(s.piu).map(function (k) { return (en ? PIU[k][1] : PIU[k][0]).toLowerCase(); });
    if (con.length) out += en ? ', with ' + lista(con, 'and') : ', con ' + lista(con);
    if (s.stato) out += ', ' + (en ? STATO[s.stato][4] : (s.tipo === 'villa' || !s.tipo ? STATO[s.stato][3] : STATO[s.stato][3].replace(/ristrutturata/, 'ristrutturato')));
    return out;
  }
  function luogoIt(s) { return s.fuori ? (s.fuoriTxt ? 'a ' + s.fuoriTxt : 'fuori Roma') : s.zona === 'roma' && s.zonaTxt ? 'in zona ' + s.zonaTxt : Z[s.zona].pre; }

  /* ---------- la conversazione ---------- */
  var log = $('#log'), A = window.Assistente({ log: log, form: $('#say'), txt: $('#txt'), testo: testo });
  var Q = window.Quinte($('#quinte'));
  var S, attesa, primo;
  function nuova(muta) {
    S = { piu: {} }; attesa = null; primo = '';
    A.azzera(); scheda(); $('#cifra').hidden = true;
    if (!muta) saluta();
  }
  function saluta() {
    var h = new Date().getHours(), s = h < 13 ? T('Buongiorno', 'Good morning') : h < 18 ? T('Buon pomeriggio', 'Good afternoon') : T('Buonasera', 'Good evening');
    A.dice(T('<p>' + s + '. Sono Dora, l’assistente di Immobildream.</p><p>Le faccio qualche domanda sulla casa: bastano due minuti. Dove si trova?</p>',
      '<p>' + s + '. I am Dora, Immobildream’s assistant.</p><p>I will ask a few questions about your home: it takes two minutes. Where is it?</p>'), function (m) { domanda('zona', m); });
  }
  function metti(id, v) { var dd = $('#' + id); if (!dd) return; if (v == null) { dd.className = ''; dd.removeAttribute('data-v'); dd.textContent = T('in attesa', 'waiting'); return; } if (dd.getAttribute('data-v') === v) return; dd.setAttribute('data-v', v); dd.className = 'si'; dd.innerHTML = '<span>' + esc(v) + '</span>'; }
  function scheda() {
    metti('kZona', S.fuori ? (S.fuoriTxt || T('Fuori Roma', 'Outside Rome')) : S.zona ? (S.zona === 'roma' && S.zonaTxt ? S.zonaTxt : Z[S.zona].n) : null);
    metti('kTipo', S.tipo ? L(TIPO[S.tipo]) : null);
    metti('kMq', S.mq ? S.mq + T(' mq', ' sq m') : null);
    metti('kPiano', S.tipo === 'villa' ? T('Indipendente', 'Detached') : S.tipo === 'attico' && !S.piano ? L(PIANO.ultimo) : S.piano ? L(PIANO[S.piano]) : null);
    metti('kStato', S.stato ? L(STATO[S.stato]) : null);
    var p = Object.keys(S.piu).map(function (k) { return L(PIU[k]); });
    metti('kPiu', p.length ? p.join(', ') : S.piuChiesto ? T('Niente da segnalare', 'Nothing to add') : null);
    var r = stima(S);
    if (r && S.stimaData) {
      $('#cifra').hidden = false; $('#cV').textContent = eur(r.lo) + ' – ' + eur(r.hi) + ' €';
      $('#cM').textContent = T('Circa ' + eur(r.mlo) + ' – ' + eur(r.mhi) + ' € al mq', 'About ' + eur(r.mlo) + ' – ' + eur(r.mhi) + ' € per sq m');
    }
  }
  function unisci(o) {
    if (o.fuori) { S.fuori = 1; if (o.fuoriTxt) S.fuoriTxt = o.fuoriTxt; delete S.zona; }
    if (o.zona) { S.zona = o.zona; S.zonaTxt = o.zonaTxt; delete S.fuori; delete S.fuoriTxt; }
    ['tipo', 'mq', 'piano', 'stato'].forEach(function (k) { if (o[k] != null) S[k] = o[k]; });
    for (var k in o.piu) { S.piu[k] = 1; S.piuChiesto = 1; }
  }

  /* una domanda alla volta: quelle sulla casa, poi quelle che servono all'agenzia per dare la priorità */
  function prossima() {
    if (S.fuori && !S.fuoriTxt && !S.fuoriChiesto) return chiedi('fuori');
    if (!S.zona && !S.fuori) return chiedi('zona');
    if (!S.tipo) return chiedi('tipo');
    if (!S.mq && !S.mqChiesto) return chiedi('mq');
    if (stimabile(S)) {
      if (S.tipo === 'app' && !S.piano) return chiedi('piano');
      if (!S.stato) return chiedi('stato');
      if (!S.piuChiesto) return chiedi('piu');
    }
    if (!S.stimaData) return daStima();
    if (!S.tempi) return chiedi('tempi');
    if (!S.libera) return chiedi('libera');
    if (S.altri == null) return chiedi('altri');
    if (!S.proposto) return proponi();
  }
  var DOM = {
    zona: ['Dove si trova la casa?', 'Where is the home?'],
    fuori: ['Seguiamo anche case fuori Roma. Mi scrive dove si trova?', 'We also handle homes outside Rome. Could you tell me where it is?'],
    tipo: ['Che tipo di casa è?', 'What kind of home is it?'],
    mq: ['Quanto è grande, più o meno?', 'How large is it, roughly?'],
    piano: ['A che piano si trova?', 'Which floor is it on?'],
    stato: ['E com’è messa, oggi?', 'And what condition is it in today?'],
    piu: ['Cos’ha in più? Tocchi quello che c’è, poi «Avanti».', 'What else does it have? Tap what applies, then “Continue”.'],
    tempi: ['Quando pensa di vendere?', 'When are you thinking of selling?'],
    libera: ['Oggi la casa è libera?', 'Is the home vacant today?'],
    altri: ['È la sola casa che sta valutando, o ne ha altre?', 'Is this the only property you are considering, or do you have others?']
  };
  function chiedi(k, intro) { attesa = k; A.dice('<p>' + (intro ? intro + ' ' : '') + L(DOM[k]) + '</p>', function (m) { domanda(k, m); }); }
  function domanda(k, m) {
    attesa = k;
    function fatto(patch) { return function (v) { attesa = null; patch(v); scheda(); prossima(); }; }
    if (k === 'zona') A.scelte(m, ['parioli', 'pinciano', 'trieste', 'salario', 'prati', 'flaminio', 'centro', 'vignaclara', 'balduina', 'cortina'].map(function (id) { return [Z[id].n, id]; }).concat([[T('Altra zona di Roma', 'Another area of Rome'), '_altra'], [T('Fuori Roma', 'Outside Rome'), '_fuori']]),
      function (v) {
        if (v === '_fuori') { S.fuori = 1; attesa = null; scheda(); return prossima(); }
        if (v === '_altra') { attesa = 'zonaTxt'; return A.dice(T('<p>Mi scriva il quartiere o la via.</p>', '<p>Please write the neighbourhood or the street.</p>')); }
        attesa = null; S.zona = v; scheda(); prossima();
      });
    if (k === 'fuori') { S.fuoriChiesto = 1; A.scelte(m, [['Cortina d’Ampezzo', 'cortina'], [T('Un’altra località: la scrivo', 'Somewhere else: I will write it'), '_scrivo']], function (v) {
      if (v === 'cortina') { attesa = null; delete S.fuori; S.zona = 'cortina'; scheda(); return prossima(); }
      attesa = 'fuori'; if (!C.coarse) $('#txt').focus({ preventScroll: true });
    }); }
    if (k === 'tipo') A.scelte(m, ['app', 'attico', 'villa', 'altro'].map(function (id) { return [id === 'altro' ? T('Negozio, ufficio o altro', 'Shop, office or other') : L(TIPO[id]), id]; }), fatto(function (v) { S.tipo = v; }));
    if (k === 'mq') { S.mqChiesto = 1; A.scelte(m, [[T('Fino a 80 mq', 'Up to 80 sq m'), 70], [T('Da 80 a 120', '80 to 120'), 100], [T('Da 120 a 180', '120 to 180'), 150], [T('Da 180 a 250', '180 to 250'), 215], [T('Oltre 250 mq', 'Over 250 sq m'), 300]], fatto(function (v) { S.mq = v; })); }
    if (k === 'piano') A.scelte(m, ['terra', 'basso', 'alto', 'ultimo'].map(function (id) { return [L(PIANO[id]), id]; }), fatto(function (v) { S.piano = v; }));
    if (k === 'stato') A.scelte(m, ['ok', 'buono', 'da'].map(function (id) { return [L(STATO[id]), id]; }), fatto(function (v) { S.stato = v; }));
    if (k === 'piu') A.scelte(m, Object.keys(PIU).map(function (id) { return [L(PIU[id]), id]; }).concat([[T('Niente di questo', 'None of these'), null, 'nessuno']]), fatto(function (v) { S.piuChiesto = 1; v.forEach(function (x) { S.piu[x] = 1; }); }), true);
    if (k === 'tempi') A.scelte(m, Object.keys(TEMPI).map(function (id) { return [L(TEMPI[id]), id]; }), fatto(function (v) { S.tempi = v; }));
    if (k === 'libera') A.scelte(m, Object.keys(LIBERA).map(function (id) { return [L(LIBERA[id]), id]; }), fatto(function (v) { S.libera = v; }));
    if (k === 'altri') A.scelte(m, [[T('Solo questa', 'Only this one'), 0], [T('Ne ho altre', 'I have others'), 1]], fatto(function (v) { S.altri = v; }));
  }
  function daStima() {
    S.stimaData = 1; var r = stima(S);
    if (r) {
      scheda();
      A.dice(T('<p>Grazie. Per ' + frase(S) + ', oggi siamo qui:</p>', '<p>Thank you. For ' + frase(S) + ', today we are here:</p>') +
        '<div class="stimina"><span>' + T('Stima indicativa', 'Indicative estimate') + '</span><strong>' + eur(r.lo) + ' – ' + eur(r.hi) + ' €</strong><em>' + T('Circa ' + eur(r.mlo) + ' – ' + eur(r.mhi) + ' € al mq', 'About ' + eur(r.mlo) + ' – ' + eur(r.mhi) + ' € per sq m') + '</em></div>' +
        T('<p>È un intervallo, non un prezzo. Il prezzo si decide in casa, con un consulente che la vede.</p>', '<p>It is a range, not a price. The price is decided at the home, with a consultant who has seen it.</p>'));
      chiedi('tempi', T('Ancora tre domande veloci, così il consulente arriva preparato.', 'Three more quick questions, so the consultant arrives prepared.'));
    } else {
      A.dice(S.fuori ? T('<p>Grazie. Fuori Roma la stima non la faccio io: i valori cambiano troppo da un luogo all’altro. Prendo nota e la passo a un consulente.</p>', '<p>Thank you. Outside Rome I do not give the estimate myself: values vary too much from place to place. I will take note and pass it to a consultant.</p>')
        : T('<p>Grazie. Negozi, uffici e stabili interi non li stimo io: il valore dipende dalla via, dalle vetrine, da chi c’è dentro. Prendo nota e la passo a un consulente.</p>', '<p>Thank you. I do not estimate shops, offices or whole buildings myself: the value depends on the street, the frontage, the tenants. I will take note and pass it to a consultant.</p>'));
      chiedi('tempi', T('Ancora tre domande veloci.', 'Three more quick questions.'));
    }
  }
  function proponi() {
    S.proposto = 1; attesa = 'contatto';
    A.dice(T('<p>Ho tutto. Se vuole, un consulente la richiama per fissare il sopralluogo: è gratuito e non la impegna.</p>', '<p>I have everything. If you wish, a consultant will call you back to arrange the visit: it is free and commits you to nothing.</p>'), function (m) {
      A.scelte(m, [[T('Sì, richiamatemi', 'Yes, call me back'), 1], [T('Per ora no, grazie', 'Not for now, thank you'), 0]], function (v) {
        if (v) return modulo();
        attesa = null;
        A.dice(T('<p>Va bene. La stima resta qui accanto. Quando vuole ci trova allo 06 3200007, tutti i giorni, compresi i festivi.</p>', '<p>Very well. The estimate stays here beside you. Whenever you like, you can reach us on 06 3200007, every day, holidays included.</p>'), function (m2) {
          A.scelte(m2, [[T('Ci ho ripensato: richiamatemi', 'On second thoughts: call me back'), 1]], function () { modulo(); });
        });
      });
    });
  }
  function modulo() {
    if (S.inviato) return A.dice(T('<p>La richiesta c’è già. La richiamiamo noi.</p>', '<p>Your request is already in. We will call you.</p>'));
    attesa = 'modulo';
    A.dice(T('<p>Mi lascia nome e telefono?</p>', '<p>May I have your name and phone number?</p>'), function (m) {
      var f = el('div', 'modulo');
      f.innerHTML = '<label>' + T('Nome e cognome', 'Full name') + '<input type="text" name="n" autocomplete="name"></label>' +
        '<label>' + T('Telefono', 'Phone') + '<input type="tel" name="t" autocomplete="tel" inputmode="tel"></label>' +
        '<div><span style="display:block;margin-bottom:7px;font:500 15.5px/1.2 var(--sans)">' + T('Quando la troviamo?', 'When is a good time?') + '</span><div class="scelte" role="group"><button type="button" class="scelta" aria-pressed="true">' + T('Mattina', 'Morning') + '</button><button type="button" class="scelta" aria-pressed="false">' + T('Pomeriggio', 'Afternoon') + '</button><button type="button" class="scelta" aria-pressed="false">' + T('Sera', 'Evening') + '</button></div></div>' +
        '<label class="ok"><input type="checkbox" name="ok"><span>' + T('Va bene che Immobildream mi richiami per la valutazione.', 'I agree to Immobildream calling me back about the valuation.') + '</span></label>' +
        '<p class="sbaglio" role="alert" hidden></p><button type="button" class="btn">' + T('Mi faccia richiamare', 'Call me back') + '</button>';
      m.appendChild(f); A.giu();
      var q = $$('.scelte .scelta', f);
      q.forEach(function (c) { c.onclick = function () { q.forEach(function (x) { x.setAttribute('aria-pressed', x === c); }); }; });
      $('.btn', f).onclick = function () {
        var nm = $('[name=n]', f), tl = $('[name=t]', f), ok = $('[name=ok]', f), er = $('.sbaglio', f), msg = '';
        nm.classList.remove('err'); tl.classList.remove('err');
        if (nm.value.trim().length < 2) { msg = T('Manca il nome.', 'Your name is missing.'); nm.classList.add('err'); nm.focus(); }
        else if (tl.value.replace(/\D/g, '').length < 8) { msg = T('Il numero sembra incompleto.', 'The number looks incomplete.'); tl.classList.add('err'); tl.focus(); }
        else if (!ok.checked) msg = T('Per richiamarla ci serve il suo consenso: spunti la casella.', 'To call you back we need your consent: please tick the box.');
        if (msg) { er.textContent = msg; er.hidden = false; A.giu(); return; }
        var qi = 0; q.forEach(function (x, i) { if (x.getAttribute('aria-pressed') === 'true') qi = i; });
        S.nome = nm.value.trim(); S.tel = tl.value.trim(); S.quando = ['in mattinata', 'nel pomeriggio', 'in serata'][qi]; S.inviato = 1; attesa = null;
        var qEn = ['in the morning', 'in the afternoon', 'in the evening'][qi];
        f.innerHTML = '<p style="font-size:16px;color:var(--ink-2)">' + esc(S.nome) + ' · ' + esc(S.tel) + ' · ' + T(S.quando, qEn) + '</p>';
        A.dice(T('<p><b>Fatto, ' + esc(S.nome.split(' ')[0]) + '.</b> Un consulente la richiama ' + S.quando + ' per fissare il sopralluogo.</p><p>Fino all’incarico non ci deve niente.</p>',
          '<p><b>Done, ' + esc(S.nome.split(' ')[0]) + '.</b> A consultant will call you ' + qEn + ' to arrange the visit.</p><p>Until the mandate, you owe us nothing.</p>'), function (m2) {
          var b = el('button', 'apri-quinte', '<i aria-hidden="true"></i>Dietro le quinte: cosa è arrivato all’agenzia'); b.type = 'button'; b.onclick = function () { Q.apri(profilo(S), b); };
          m2.appendChild(b);
          setTimeout(function () { Q.apri(profilo(S), b); }, C.reduce ? 300 : 1900);
        });
      };
      if (!C.coarse) setTimeout(function () { $('[name=n]', f).focus({ preventScroll: true }); }, 60);
    });
  }

  /* risposte a quello che la gente chiede davvero, a metà conversazione */
  var INT = [
    [/gratis|gratuit|quanto\s+(?:mi\s+)?costa|pagare|\bfree\b|how\s+much.*cost/, 'Niente. Né la stima né il sopralluogo.', 'Nothing. Neither the estimate nor the visit.'],
    [/provvigion|commission|percentuale/, 'Di provvigione le parla il consulente, insieme alla strategia. Prima di allora non firma niente.', 'Your consultant will discuss commission with you, together with the strategy. Until then you sign nothing.'],
    [/quanto\s+tempo|in\s+quanto|tempi\s+di\s+vendita|how\s+long/, 'Dipende dalla casa, dal prezzo e dal momento. Non diamo tempi prima di averla vista.', 'It depends on the home, the price and the moment. We give no timescale before seeing it.'],
    [/chi\s+sei|robot|\bbot\b|intelligenza|umano|persona\s+vera|\bai\b|are\s+you\s+(?:a\s+)?(?:human|real)/, 'Sono un’assistente AI. Prendo nota e faccio una stima. Da lì in poi la segue un consulente, in persona.', 'I am an AI assistant. I take notes and give an estimate. From there a consultant looks after you, in person.'],
    [/privacy|\bdati\b|riservat|\bdata\b|confidential/, 'I suoi dati li vede Immobildream, e nessun altro. Il suo nome e la sua casa non compaiono mai in pagina.', 'Your details are seen by Immobildream, and no one else. Your name and your home never appear on our pages.'],
    [/telefon|chiamar|parlare\s+con|consulente|appuntamento|sopralluogo|speak|call/, 'I consulenti rispondono tutti i giorni, compresi i festivi, allo 06 3200007. Oppure finiamo qui e la richiamiamo noi.', 'Consultants answer every day, holidays included, on 06 3200007. Or we finish here and call you back.'],
    [/dove\s+siete|sede|indirizzo|where\s+are\s+you|address/, 'Siamo a Roma, in via Dora 2, nel Quartiere Coppedè.', 'We are in Rome, at Via Dora 2, in the Coppedè district.']
  ];
  function testo(raw) {
    A.utente(raw);
    var t = fold(raw), w = attesa, m;
    if (w === 'modulo') return A.dice(T('<p>Scriva nome e telefono nei campi qui sopra.</p>', '<p>Please write your name and phone number in the fields above.</p>'));
    if (w === 'zonaTxt') { attesa = null; var z = capisce(raw); if (z.zona || z.fuori) unisci(z); else { S.zona = 'roma'; S.zonaTxt = cap(raw.replace(/[.!?]+$/, '')).slice(0, 40); } scheda(); return prossima(); }
    if (w === 'fuori') { attesa = null; var f = capisce(raw); if (f.zona) unisci(f); else { S.fuori = 1; S.fuoriTxt = (f.fuoriTxt || cap(raw.replace(/[.!?]+$/, ''))).slice(0, 40); unisci({ tipo: f.tipo, mq: f.mq, piu: f.piu }); } scheda(); return prossima(); }
    var o = capisce(raw);
    if (w === 'mq' && !o.mq && (m = /\d{2,4}/.exec(raw))) o.mq = +m[0];
    if (w === 'tempi' && !pieno(o)) { var tv = /subito|appena|presto|urgent|soon|asap/.test(t) ? 'subito' : /anno|mesi|year|months/.test(t) ? 'anno' : /capire|curios|vedere|non\s+so|understand|not\s+sure/.test(t) ? 'capire' : null; if (tv) { attesa = null; S.tempi = tv; return prossima(); } }
    if (w === 'libera' && !pieno(o)) { var lv = /affitt|inquilin|rent|tenant/.test(t) ? 'affitto' : /abit|vivo|viviamo|live/.test(t) ? 'abito' : /libera|vuota|vacant|empty|^s[iì]\b|^yes\b/.test(t) ? 'libera' : null; if (lv) { attesa = null; S.libera = lv; return prossima(); } }
    if (w === 'altri' && !pieno(o)) { var av = /altr|piu\s+di|divers|others|several|portfolio/.test(t) ? 1 : /solo|sola|unica|only|just/.test(t) ? 0 : null; if (av != null) { attesa = null; S.altri = av; return prossima(); } }
    if (!pieno(o)) {
      var a = null; INT.some(function (i) { if (i[0].test(t)) { a = T(i[1], i[2]); return true; } });
      A.dice('<p>' + (a || T('Qui non ho trovato quello che mi serve. Andiamo per ordine.', 'I could not find what I need there. Let us go step by step.')) + '</p>');
      if (w && DOM[w]) return chiedi(w);
      if (!S.proposto) return prossima();
      return;
    }
    if (!primo) primo = raw;
    var era = S.stimaData; attesa = null; unisci(o); scheda();
    if (era) { var r = stima(S); if (r) A.dice(T('<p>Corretto. Con questo siamo a ' + eur(r.lo) + ' – ' + eur(r.hi) + ' €.</p>', '<p>Noted. With that we are at ' + eur(r.lo) + ' – ' + eur(r.hi) + ' €.</p>')); }
    else if (pieno(o) >= 2) A.dice(T('<p>Ho preso nota: ' + frase(S) + '.</p>', '<p>I have noted: ' + frase(S) + '.</p>'));
    prossima();
  }

  /* ---------- il profilo e il punteggio che arrivano all'agenzia (sempre in italiano) ---------- */
  function profilo(s) {
    var r = stima(s), k = [], tot = 0;
    function add(nome, v, max) { k.push([nome, v, max]); tot += v; }
    var seguita = !s.fuori && s.zona && s.zona !== 'roma';
    add(seguita ? 'Zona tra quelle seguite' : s.fuori ? 'Fuori Roma' : 'Altra zona di Roma', seguita ? 25 : s.fuori ? 15 : 12, 25);
    add(r ? 'Valore stimato: fino a ' + eur(r.hi) + ' €' : 'Valore: da stimare di persona', r ? (r.hi >= 1e6 ? 25 : r.hi >= 5e5 ? 20 : r.hi >= 3e5 ? 12 : 6) : 12, 25);
    add('Tempi: ' + (s.tempi ? TEMPI[s.tempi][0].toLowerCase() : 'non detti'), s.tempi ? TEMPI[s.tempi][2] : 8, 25);
    add('Casa: ' + (s.libera ? { libera: 'libera', abito: 'abitata da chi vende', affitto: 'affittata' }[s.libera] : 'non detto'), s.libera ? LIBERA[s.libera][2] : 5, 10);
    add(s.altri ? 'Ha altri immobili' : 'Un solo immobile', s.altri ? 15 : 5, 15);
    var pr = tot >= 75 ? 'A' : tot >= 50 ? 'B' : 'C';
    var casa = cap(frase(s, true)) + '.';
    var testo = casa + ' ' + (r ? 'Stima indicativa data online: ' + eur(r.lo) + ' – ' + eur(r.hi) + ' €.' : 'Nessuna stima data online: da valutare di persona.') +
      ' ' + (s.tempi === 'subito' ? 'Vuole vendere appena possibile.' : s.tempi === 'anno' ? 'Pensa di vendere entro un anno.' : 'Per ora vuole capire quanto vale.') +
      ' ' + (s.libera === 'libera' ? 'La casa è libera.' : s.libera === 'abito' ? 'Oggi ci abita.' : s.libera === 'affitto' ? 'La casa è affittata: chiedere del contratto.' : '') +
      (s.altri ? ' Ha altri immobili: vale la pena parlare dell’intero patrimonio.' : '') +
      (C.lang === 'en' ? ' Ha risposto in inglese.' : '') + ' Richiamare ' + (s.quando || 'in mattinata') + '.';
    var perche = pr === 'A' ? 'Da richiamare per primi' : pr === 'B' ? 'Da richiamare in giornata' : 'Da seguire con calma';
    var nome = s.nome || '(nome e cognome)', tel = s.tel || '(telefono)';
    var mail = '<b>Oggetto: Nuova richiesta di valutazione · ' + esc(s.fuori ? (s.fuoriTxt || 'fuori Roma') : (s.zona === 'roma' && s.zonaTxt ? s.zonaTxt : Z[s.zona].n)) + ' · priorità ' + pr + ' (' + tot + '/100)</b>\n\n' +
      'Nome: ' + esc(nome) + '\nTelefono: ' + esc(tel) + '\nRichiamare: ' + (s.quando || 'in mattinata') + '\n\n' + esc(testo) + '\n\nPunteggio: ' + tot + ' su 100\n' +
      k.map(function (x) { return '· ' + esc(x[0]) + ': ' + x[1] + ' su ' + x[2]; }).join('\n') + (primo ? '\n\nParole di chi vende:\n«' + esc(primo) + '»' : '') + '\n\nProvenienza: landing «Vendere»';
    var wa = '<b>Nuova richiesta · priorità ' + pr + ' (' + tot + '/100)</b>\n' + esc(nome) + ', ' + esc(tel) + '\n' + esc(casa) + (r ? '\nStima ' + eur(r.lo) + ' – ' + eur(r.hi) + ' €' : '\nDa stimare di persona') + '\nRichiamare ' + (s.quando || 'in mattinata');
    return { priorita: pr, punti: tot, perche: perche, criteri: k, profilo: testo, mail: mail, wa: wa };
  }
  /* un esempio pronto, per vedere il riquadro senza compilare */
  $('#qEs').onclick = function () {
    var era = primo; primo = 'Attico di 180 mq ai Parioli, ultimo piano, terrazzo e box auto. Da ristrutturare.';
    var es = { zona: 'parioli', tipo: 'attico', mq: 180, stato: 'da', piu: { terrazzo: 1, box: 1 }, tempi: 'anno', libera: 'abito', altri: 1, quando: 'nel pomeriggio', stimaData: 1 };
    var lang = C.lang; C.lang = 'it'; var p = profilo(es); C.lang = lang; primo = era;
    Q.apri(p, this);
  };

  /* ---------- gli esempi che si scrivono da soli ---------- */
  $$('#prove .scelta').forEach(function (c) {
    c.onclick = function () {
      if (A.occupato()) return; partita = true; nuova(true);
      A.batti(T(c.getAttribute('data-t'), c.getAttribute('data-t-en')), function (s) { testo(s); });
    };
  });

  /* ---------- lingua: si ricomincia nella lingua scelta ---------- */
  C.onLang(function () { scegliZona(zSel); nuova(); });

  /* la conversazione comincia quando la si vede */
  var partita = false;
  function parti() { if (partita) return; partita = true; nuova(); }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es, io) { if (es[0].isIntersecting) { parti(); io.disconnect(); } }, { threshold: .15 }).observe($('.chat'));
  else parti();
  S = { piu: {} };

  window.__imm = { capisce: capisce, stima: stima, profilo: profilo, stato: function () { return S; }, testo: testo };
})();
