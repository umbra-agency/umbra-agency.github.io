/* Immobildream Prestigio · landing «Vendere»
   Dora in anteprima: capisce la descrizione con regole scritte a mano, senza chiamate esterne.
   Online, al posto di parse() e intent() risponde un modello AI; il resto della pagina non cambia. */
(function () {
  'use strict';
  var d = document, de = d.documentElement, U = window.U || {};
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }
  function el(t, c, h) { var e = d.createElement(t); if (c) e.className = c; if (h != null) e.innerHTML = h; return e; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, coarse = matchMedia('(pointer: coarse)').matches;
  var nointro = reduce || /[?&]nointro/.test(location.search);
  var eur = function (n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  function lista(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1]; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ---------- apertura ---------- */
  var hint = $('.hero__luce span');
  if (hint) hint.textContent = hint.getAttribute(coarse ? 'data-touch' : 'data-fine');
  setTimeout(function () { de.classList.add('is-lit'); }, nointro ? 200 : 2500);
  var moved = false;
  function onMove() { if (moved || !de.classList.contains('is-lit')) return; moved = true; setTimeout(function () { de.classList.add('is-moved'); }, 2600); }
  addEventListener('pointermove', onMove, { passive: true }); addEventListener('touchstart', onMove, { passive: true });

  /* etichetta dell'anteprima: come nel motore Umbra, ma da telefono resta chiusa per non coprire il bottone */
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
    var sayF = $('#say'); if (sayF && 'IntersectionObserver' in window) new IntersectionObserver(function (en) { away.c = en[0].isIntersecting; setAway(); }).observe(sayF);
    setTimeout(function () {
      d.body.appendChild(tg);
      if (innerWidth > 1100) { auto = true; requestAnimationFrame(function () { requestAnimationFrame(function () { if (auto) tog(true); }); }); setTimeout(function () { if (auto) { auto = false; tog(false); } }, 6500); }
      setTimeout(function () { tg.classList.add('is-mini'); }, 9000);
    }, nointro ? 500 : 2900);
  })();

  /* ---------- zone ---------- */
  var Z = {
    parioli: { n: 'Parioli', pre: 'ai Parioli', code: 'Q. II', eur: 6900, band: [6000, 9500], k: ['parioli', 'piazza euclide', 'viale bruno buozzi', 'via archimede', 'piazza ungheria', 'villa glori', 'piazza delle muse'], d: 'Tra Villa Borghese, Villa Glori e Villa Ada. Il quartiere delle palazzine d’autore.', t: 'Attici con terrazzo, grandi rappresentanze', it: 'tra Villa Borghese e Villa Ada, nel quartiere delle palazzine d’autore', en: 'between Villa Borghese and Villa Ada, in the quarter of Rome’s architect-designed palazzine', enP: 'in Parioli' },
    pinciano: { n: 'Pinciano', pre: 'al Pinciano', code: 'Q. III', eur: 7000, band: [6000, 9800], k: ['pinciano', 'via pinciana', 'villa borghese', 'piazza verdi'], d: 'A ridosso di Villa Borghese, tra ambasciate e palazzi di inizio Novecento.', t: 'Piani alti con affaccio sul parco', it: 'a ridosso di Villa Borghese, tra le ambasciate e i palazzi di inizio Novecento', en: 'on the edge of Villa Borghese, among embassies and early twentieth-century buildings', enP: 'in Pinciano' },
    trieste: { n: 'Trieste', pre: 'nel quartiere Trieste', code: 'Q. XVII', eur: 5900, band: [5000, 7800], k: ['quartiere trieste', 'corso trieste', 'coppede', 'piazza mincio', 'via dora', 'via tagliamento', 'piazza buenos aires', 'piazza caprera', 'piazza istria', 'trieste'], d: 'Da corso Trieste a piazza Mincio, con le architetture del Quartiere Coppedè. Qui abbiamo la sede.', t: 'Appartamenti d’epoca, villini', it: 'tra corso Trieste e le architetture del Quartiere Coppedè', en: 'between Corso Trieste and the architecture of the Coppedè district', enP: 'in the Trieste quarter' },
    salario: { n: 'Salario', pre: 'al Salario', code: 'Q. IV', eur: 5700, band: [4800, 7500], k: ['salario', 'piazza fiume', 'villa albani'], it: 'tra piazza Fiume e Villa Albani', en: 'between Piazza Fiume and Villa Albani', enP: 'in Salario' },
    prati: { n: 'Prati', pre: 'a Prati', code: 'R. XXII', eur: 6400, band: [5500, 8500], k: ['prati', 'cola di rienzo', 'piazza cavour', 'piazza mazzini', 'viale mazzini', 'della vittoria', 'piazza risorgimento', 'via ottaviano', 'piazza dei quiriti'], d: 'Viali alberati e palazzi umbertini tra il Tevere e San Pietro.', t: 'Appartamenti d’epoca ristrutturati', it: 'tra i viali alberati e i palazzi umbertini di Prati, a pochi minuti da San Pietro', en: 'among the tree-lined avenues of Prati, a few minutes from St Peter’s', enP: 'in Prati' },
    centro: { n: 'Centro Storico', pre: 'in Centro Storico', code: 'Rioni', tg: 'Campo Marzio', tc: 'R. IV', eur: 8300, band: [7500, 13000], k: ['centro storico', 'piazza di spagna', 'tridente', 'via del babuino', 'via margutta', 'piazza del popolo', 'piazza navona', 'pantheon', 'campo de\' fiori', 'campo dei fiori', 'campo marzio', 'via giulia', 'fontana di trevi', 'via veneto', 'ludovisi', 'via condotti', 'piazza farnese', 'via del corso', 'in centro', 'centro di roma'], d: 'Il Tridente: piazza di Spagna, via Margutta, piazza del Popolo.', t: 'Attici e piani nobili', it: 'nel cuore del Centro Storico di Roma', en: 'in the heart of Rome’s historic centre', enP: 'in the historic centre' },
    aventino: { n: 'Aventino', pre: 'all’Aventino', code: 'R. XII', eur: 7000, band: [6000, 10000], k: ['aventino', 'san saba', 'giardino degli aranci', 'circo massimo', 'santa sabina'], d: 'Il colle più silenzioso del centro, tra il Giardino degli Aranci e il Circo Massimo.', t: 'Villini, appartamenti con giardino', it: 'sul colle più silenzioso di Roma, tra il Giardino degli Aranci e il Circo Massimo', en: 'on the quietest hill in Rome, between the Orange Garden and the Circus Maximus', enP: 'on the Aventine' },
    flaminio: { n: 'Flaminio', pre: 'al Flaminio', code: 'Q. I', eur: 5700, band: [4800, 7500], k: ['flaminio', 'maxxi', 'piazza mancini', 'viale tiziano', 'ponte della musica', 'via guido reni'], d: 'Tra il MAXXI, il Ponte della Musica e il Tevere.', t: 'Appartamenti luminosi, piani alti', it: 'tra il MAXXI, il Ponte della Musica e il Tevere', en: 'between the MAXXI museum, Ponte della Musica and the Tiber', enP: 'in Flaminio' },
    vignaclara: { n: 'Vigna Clara', pre: 'a Vigna Clara', code: 'Roma Nord', eur: 5000, band: [4200, 6800], k: ['vigna clara', 'collina fleming', 'fleming', 'ponte milvio', 'vigna stelluti', 'corso francia', 'tor di quinto'], d: 'Il verde di Roma Nord, a due passi da Ponte Milvio.', t: 'Grandi metrature con terrazzo e box', it: 'nel verde di Roma Nord, a due passi da Ponte Milvio', en: 'in the green of northern Rome, a short walk from Ponte Milvio', enP: 'in Vigna Clara' },
    camilluccia: { n: 'Camilluccia', pre: 'alla Camilluccia', code: 'Roma Nord', eur: 4900, band: [4000, 7000], k: ['camilluccia'], it: 'tra i giardini e le ville della Camilluccia', en: 'among the gardens and villas of the Camilluccia', enP: 'in the Camilluccia area' },
    balduina: { n: 'Balduina', pre: 'alla Balduina', code: 'Q. XIV', eur: 4200, band: [3600, 5500], k: ['balduina', 'monte mario', 'medaglie d\'oro'], it: 'sulla collina della Balduina, con Roma ai piedi', en: 'on the Balduina hill, with Rome below', enP: 'in Balduina' },
    monti: { n: 'Monti', pre: 'a Monti', code: 'R. I', eur: 6800, band: [5800, 9500], k: ['rione monti', 'via dei serpenti', 'colosseo', 'fori imperiali', 'via panisperna', 'monti'], d: 'Il primo rione di Roma, tra via dei Serpenti e il Colosseo.', t: 'Piccoli attici, case con affaccio', it: 'tra i vicoli del rione Monti, a pochi passi dal Colosseo', en: 'among the lanes of the Monti district, a few steps from the Colosseum', enP: 'in Monti' },
    trastevere: { n: 'Trastevere', pre: 'a Trastevere', code: 'R. XIII', eur: 6600, band: [5500, 9000], k: ['trastevere', 'gianicolo', 'via della lungara', 'piazza trilussa'], d: 'Ai piedi del Gianicolo, tra piazza Trilussa e via della Lungara.', t: 'Ultimi piani con terrazzo', it: 'a Trastevere, ai piedi del Gianicolo', en: 'in Trastevere, at the foot of the Janiculum', enP: 'in Trastevere' },
    monteverde: { n: 'Monteverde Vecchio', pre: 'a Monteverde Vecchio', code: 'Q. XII', eur: 5200, band: [4300, 6800], k: ['monteverde', 'villa pamphili', 'villa pamphilj', 'gianicolense', 'villa sciarra'], it: 'tra Villa Sciarra e Villa Pamphilj, nel verde di Monteverde Vecchio', en: 'between Villa Sciarra and Villa Pamphilj, in leafy Monteverde Vecchio', enP: 'in Monteverde Vecchio' },
    nomentano: { n: 'Nomentano', pre: 'al Nomentano', code: 'Q. V', eur: 5000, band: [4200, 6500], k: ['nomentano', 'villa torlonia', 'piazza bologna', 'via nomentana', 'porta pia'], it: 'lungo la Nomentana, accanto a Villa Torlonia', en: 'along Via Nomentana, next to Villa Torlonia', enP: 'in Nomentano' },
    eur: { n: 'EUR', pre: 'all’EUR', code: 'Q. XXXII', eur: 4300, band: [3600, 5800], k: ['eur', 'e.u.r', 'laghetto', 'viale europa'], d: 'Viali razionalisti, il laghetto, ville e attici con il verde intorno.', t: 'Ville e attici panoramici', it: 'tra i viali e le architetture razionaliste dell’EUR', en: 'among the avenues and rationalist architecture of EUR', enP: 'in EUR' },
    appia: { n: 'Appia Antica', pre: 'sull’Appia Antica', code: 'Roma Sud', eur: 5400, band: [4200, 8500], k: ['appia antica', 'appia pignatelli', 'via appia', 'ardeatina', 'caffarella'], it: 'nel parco dell’Appia Antica', en: 'in the Appia Antica park', enP: 'on the Appia Antica' },
    olgiata: { n: 'Olgiata', pre: 'all’Olgiata', code: 'Cassia', eur: 3300, band: [2600, 4500], k: ['olgiata', 'la storta', 'giustiniana', 'cassia'], it: 'nel comprensorio dell’Olgiata, tra il verde e il golf', en: 'in the Olgiata estate, among greenery and the golf course', enP: 'in Olgiata' },
    palocco: { n: 'Casal Palocco', pre: 'a Casal Palocco', code: 'Roma Sud', eur: 2900, band: [2400, 3800], k: ['casal palocco', 'casalpalocco', 'infernetto', 'axa'], it: 'tra i giardini di Casal Palocco', en: 'among the gardens of Casal Palocco', enP: 'in Casal Palocco' },
    cortina: { n: 'Cortina d’Ampezzo', pre: 'a Cortina d’Ampezzo', code: 'Dolomiti', legno: 1, eur: 15500, band: [11000, 22000], k: ['cortina d\'ampezzo', 'cortina', 'ampezzo', 'corso italia', 'pocol', 'tofane', 'faloria'], d: 'La conca ampezzana, tra le Tofane e il Cristallo.', t: 'Chalet, appartamenti in centro', it: 'nella conca di Cortina d’Ampezzo, tra le Tofane e il Cristallo', en: 'in the Cortina d’Ampezzo basin, between the Tofane and Monte Cristallo', enP: 'in Cortina d’Ampezzo' },
    roma: { n: 'Roma', pre: 'a Roma', code: 'Roma', eur: 4500, band: [3500, 6500], k: [], it: 'a Roma', en: 'in Rome', enP: 'in Rome', largo: 1 }
  };
  var ORDER = ['cortina', 'parioli', 'pinciano', 'centro', 'prati', 'aventino', 'trastevere', 'flaminio', 'vignaclara', 'camilluccia', 'balduina', 'monteverde', 'nomentano', 'salario', 'appia', 'olgiata', 'palocco', 'eur', 'trieste', 'monti'];
  var WALL = ['parioli', 'pinciano', 'trieste', 'prati', 'centro', 'aventino', 'flaminio', 'vignaclara', 'monti', 'trastevere', 'eur', 'cortina'];
  function rx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  ORDER.forEach(function (id) {
    Z[id].re = Z[id].k.map(function (k) { return new RegExp('(^|[^a-z])((?:(?:ai|al|alla|a|in|zona|quartiere|rione)\\s+|all\'|sull\')?' + rx(k) + ')(?![a-z])'); });
  });

  /* ---------- capire la frase ---------- */
  function fold(s) {
    return s.toLowerCase().replace(/[àáâä]/g, 'a').replace(/[èéêë]/g, 'e').replace(/[ìíîï]/g, 'i').replace(/[òóôö]/g, 'o').replace(/[ùúûü]/g, 'u').replace(/[’`´]/g, '\'');
  }
  var ORD = ['', 'primo', 'secondo', 'terzo', 'quarto', 'quinto', 'sesto', 'settimo', 'ottavo', 'nono', 'decimo'];
  var ORDEN = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  var TIPI = [
    [/\bsuperattico\b/, 'Superattico', 'm', 'attico', 'penthouse'], [/\battico\b/, 'Attico', 'm', 'attico', 'penthouse'],
    [/\bvillino\b/, 'Villino', 'm', 'villa', 'villa'], [/\bvill(?:a|etta)\b(?!\s+(?:borghese|ada|torlonia|glori|pamphil|sciarra|albani|paganini|chigi))/, 'Villa', 'f', 'villa', 'villa'],
    [/\bcasale\b/, 'Casale', 'm', 'villa', 'country house'], [/\bchalet\b/, 'Chalet', 'm', 'chalet', 'chalet'], [/\bloft\b/, 'Loft', 'm', 'app', 'loft'],
    [/\bmansarda\b/, 'Mansarda', 'f', 'mans', 'attic apartment'], [/\bintero\s+stabile\b|\bpalazzina\b/, 'Intero stabile', 'm', 'stabile', 'entire building'],
    [/\bpiano\s+nobile\b/, 'Piano nobile', 'm', 'nobile', 'piano nobile apartment'], [/\bappartamento\b/, 'Appartamento', 'm', 'app', 'apartment'],
    [/\bmonolocale\b/, 'Monolocale', 'm', 'app', 'studio apartment'], [/\bbilocale\b/, 'Bilocale', 'm', 'app', 'two-room apartment'], [/\btrilocale\b/, 'Trilocale', 'm', 'app', 'three-room apartment'], [/\bquadrilocale\b/, 'Quadrilocale', 'm', 'app', 'four-room apartment'], [/\bcasa\b/, 'Casa', 'f', 'app', 'home']
  ];
  var UN = '(?:mq|m2|m²|metri(?:\\s*quadr\\w*)?)';
  function piano(n) {
    var adj = n <= 1 ? -.02 : n === 2 ? 0 : n <= 4 ? .02 : .04;
    return n <= 10 ? { n: n, l: cap(ORD[n]) + ' piano', ph: 'al ' + ORD[n] + ' piano', en: 'on the ' + ORDEN[n] + ' floor', enL: cap(ORDEN[n]) + ' floor', adj: adj }
      : { n: n, l: n + '° piano', ph: 'al ' + n + '° piano', en: 'on the ' + n + 'th floor', enL: n + 'th floor', adj: adj };
  }
  function parse(raw) {
    var t = fold(raw), o = { dot: {}, marks: [] }, m, i, j;
    function mark(a, b, k) { o.marks.push([a, b, k]); }
    function hit(re, k) { var x = re.exec(t); if (x) mark(x.index, x.index + x[0].length, k); return x; }
    // zona (via Cortina d'Ampezzo è una strada di Roma Nord, non la località)
    m = /\b(?:via|viale)\s+cortina(?:\s+d'ampezzo)?/.exec(t);
    if (m) { o.zona = 'camilluccia'; mark(m.index, m.index + m[0].length, 'zona'); }
    else for (i = 0; i < ORDER.length && !o.zona; i++) for (j = 0; j < Z[ORDER[i]].re.length; j++) {
      m = Z[ORDER[i]].re[j].exec(t);
      if (m) { o.zona = ORDER[i]; mark(m.index + m[1].length, m.index + m[0].length, 'zona'); break; }
    }
    // zona non in elenco: un nome proprio dopo «a», «zona», «quartiere»
    if (!o.zona && (m = /(?:^|[\s,;])((?:a|ad|in zona|zona|quartiere)\s+((?:[A-Z][a-z\u00E0-\u00F9'\u2019]+)(?:\s+[A-Z][a-z\u00E0-\u00F9'\u2019]+)?))/.exec(raw))) {
      o.zona = 'roma'; if (!/^roma$/i.test(m[2])) o.zonaTxt = m[2]; mark(m.index + m[0].length - m[1].length, m.index + m[0].length, 'zona');
    }
    // tipologia
    for (i = 0; i < TIPI.length; i++) { m = hit(TIPI[i][0], 'tipo'); if (m) { o.tipo = { l: TIPI[i][1], g: TIPI[i][2], k: TIPI[i][3], en: TIPI[i][4] }; break; } }
    // esterni, con eventuale metratura propria
    var ext = [];
    m = new RegExp('(\\d{1,4})\\s*' + UN + '\\s+di\\s+terrazz\\w*').exec(t) || new RegExp('terrazz\\w*(?:\\s+(?:panoramic\\w+|privat\\w+|abitabil\\w+|a\\s+livello))?(?:\\s+(?:di|da)\\s+(?:circa\\s+)?(\\d{1,4})\\s*' + UN + ')?').exec(t);
    if (m) { o.terr = { mq: m[1] ? +m[1] : 0 }; mark(m.index, m.index + m[0].length, 'est'); ext.push([m.index, m.index + m[0].length]); }
    m = new RegExp('giardin\\w*(?!\\s+degli\\s+aranci)(?:\\s+(?:privat\\w+|condominial\\w+))?(?:\\s+(?:di|da)\\s+(?:circa\\s+)?(\\d{1,5})\\s*' + UN + ')?').exec(t);
    if (m) { o.giard = { mq: m[1] ? +m[1] : 0 }; mark(m.index, m.index + m[0].length, 'est'); ext.push([m.index, m.index + m[0].length]); }
    if (hit(/(?:(?:\d+|due|tre|quattro)\s+)?balcon\w*/, 'est')) o.balc = 1;
    if (hit(/\bpiscina\b/, 'est')) o.dot.piscina = 1;
    // superficie: la metratura più grande che non appartiene a terrazzo o giardino
    var re = new RegExp('(\\d{2,4})\\s*' + UN, 'g'), best = null;
    while ((m = re.exec(t))) {
      var inside = ext.some(function (e) { return m.index >= e[0] && m.index < e[1]; });
      if (!inside && (!best || +m[1] > +best[1])) best = m;
    }
    if (best) { o.mq = +best[1]; mark(best.index, best.index + best[0].length, 'mq'); }
    // piano
    if ((m = hit(/ultimo\s+piano/, 'piano'))) o.piano = { l: 'Ultimo piano', ph: 'all’ultimo piano', en: 'on the top floor', enL: 'Top floor', adj: .05 };
    else if ((m = hit(/pian(?:o\s+)?terr(?:a|eno)/, 'piano'))) o.piano = { l: 'Piano terra', ph: 'al piano terra', en: 'on the ground floor', enL: 'Ground floor', adj: -.07 };
    else if ((m = hit(/(?:piano\s+)?rialzato/, 'piano'))) o.piano = { l: 'Piano rialzato', ph: 'al piano rialzato', en: 'on the raised ground floor', enL: 'Raised ground floor', adj: -.05 };
    else if ((m = hit(/pian[oi]\s+alt[oi]/, 'piano'))) o.piano = { l: 'Piano alto', ph: 'a un piano alto', en: 'on a high floor', enL: 'High floor', adj: .03 };
    else if ((m = hit(/(primo|secondo|terzo|quarto|quinto|sesto|settimo|ottavo|nono|decimo)\s+piano/, 'piano'))) o.piano = piano(ORD.indexOf(m[1]));
    else if ((m = hit(/(\d{1,2})\s*(?:°|º|o|esimo)?\s*piano\b(?!\s+nobile)/, 'piano')) || (m = hit(/\bpiano\s+(\d{1,2})\b/, 'piano'))) o.piano = piano(Math.max(1, +m[1]));
    // stato
    if (hit(/da\s+(?:ristrutturare|rimodernare|sistemare|rinnovare|rifare|ammodernare)/, 'stato')) o.stato = { l: 'Da ristrutturare', k: 'da', adj: -.14, en: 'To be renovated' };
    else if (hit(/(?:(?:finemente|completamente|appena|totalmente)\s+)?(?:ristrutturat|rinnovat|rifatt)\w+|\bnuov[oa]\b|ottim[oe]\s+(?:stato|condizioni)|pari\s+al\s+nuovo/, 'stato')) o.stato = { l: 'Ristrutturato', k: 'ok', adj: .10, en: 'Renovated' };
    else if (hit(/(?:in\s+)?buon[oe]?\s+(?:stato|condizioni)|\babitabile\b|ben\s+tenut\w+/, 'stato')) o.stato = { l: 'Buono stato', k: 'buono', adj: 0, en: 'Good condition' };
    // dotazioni
    if (hit(/\bbox(?:\s+auto)?\b|\bgarage\b|autorimessa/, 'dot')) o.dot.box = 1;
    if (hit(/post[oi]\s+auto/, 'dot')) o.dot.posto = 1;
    if (hit(/\bvista\b(?:\s+(?:sulle|sulla|sugli|sul|sui|su|aperta|panoramica)(?:\s+[\w']+){0,2})?|panoramic\w+|\baffacci\w*/, 'dot')) o.dot.vista = 1;
    if (hit(/portier\w*|portineria/, 'dot')) o.dot.portiere = 1;
    if (hit(/(?:(?:palazzo|stabile|edificio)\s+)?d'epoca|\bliberty\b|\bsignorile\b|soffitti\s+alti|affresc\w+|cassettoni/, 'dot')) o.dot.epoca = 1;
    if (hit(/senza\s+ascensore|no\s+ascensore|priv\w+\s+di\s+ascensore/, 'dot')) o.dot.noasc = 1; else if (hit(/\bascensore\b/, 'dot')) o.dot.asc = 1;
    if (hit(/\bcamin(?:o|etto)\b/, 'dot')) o.dot.camino = 1;
    if (hit(/\bcantina\b/, 'dot')) o.dot.cantina = 1;
    // segni: in ordine, senza sovrapposizioni
    o.marks.sort(function (a, b) { return a[0] - b[0] || b[1] - a[1]; });
    var clean = [], end = -1; o.marks.forEach(function (k) { if (k[0] >= end) { clean.push(k); end = k[1]; } }); o.marks = clean;
    return o;
  }
  function filled(o) { var n = 0; ['zona', 'tipo', 'mq', 'piano', 'terr', 'giard', 'balc', 'stato'].forEach(function (k) { if (o[k]) n++; }); return n + Object.keys(o.dot).length; }
  function merge(s, o) {
    ['zona', 'zonaTxt', 'tipo', 'mq', 'piano', 'terr', 'giard', 'balc', 'stato'].forEach(function (k) { if (o[k] != null) s[k] = o[k]; });
    if (o.zona && o.zona !== 'roma') delete s.zonaTxt;
    for (var k in o.dot) { s.dot[k] = 1; if (k === 'asc') delete s.dot.noasc; if (k === 'noasc') delete s.dot.asc; }
    return s;
  }
  var DEF = { l: 'Appartamento', g: 'm', k: 'app', en: 'apartment' };
  function indip(t) { return t.k === 'villa' || t.k === 'chalet' || t.k === 'stabile'; }
  function luogo(s) { return s.zona === 'roma' && s.zonaTxt ? 'in zona ' + s.zonaTxt : Z[s.zona].pre; }
  function frase(s) {
    var t = s.tipo || DEF, a = t.g === 'f' ? 'una' : t.l === 'Chalet' ? 'uno' : 'un', out = a + ' ' + t.l.toLowerCase();
    if (s.mq) out += ' di ' + s.mq + ' mq';
    if (s.zona) out += ' ' + luogo(s);
    if (s.piano && !indip(t) && !(t.k === 'attico' && /ultimo/i.test(s.piano.l))) out += ', ' + s.piano.ph;
    var con = [];
    if (s.terr) con.push(s.terr.mq ? 'terrazzo di ' + s.terr.mq + ' mq' : 'terrazzo');
    if (s.giard) con.push('giardino'); if (s.dot.piscina) con.push('piscina'); if (s.balc) con.push('balconi');
    if (s.dot.box) con.push('box auto'); if (s.dot.posto) con.push('posto auto'); if (s.dot.vista) con.push('vista aperta'); if (s.dot.portiere) con.push('portiere'); if (s.dot.camino) con.push('camino');
    if (con.length) out += ', con ' + lista(con);
    if (s.dot.epoca) out += ', in palazzo d’epoca';
    if (s.stato) out += ', ' + (s.stato.k === 'ok' ? (t.g === 'f' ? 'ristrutturata' : 'ristrutturato') : s.stato.k === 'da' ? 'da ristrutturare' : 'in buono stato');
    return out;
  }
  function stima(s) {
    if (!s.zona || !s.mq) return null;
    var z = Z[s.zona], t = s.tipo || DEF, f = [], mult = 1;
    function add(l, p) { if (!p) return; mult += p; f.push({ l: l, p: p }); }
    if (t.k === 'attico') add(t.l, .12); else if (t.k === 'villa') add(t.l, .05); else if (t.k === 'chalet') add('Chalet', .10); else if (t.k === 'mans') add('Mansarda', -.03); else if (t.k === 'nobile') add('Piano nobile', .08);
    if (s.piano && !indip(t) && t.k !== 'attico') add(s.piano.l, s.piano.adj);
    if (s.terr) add(s.terr.mq ? 'Terrazzo di ' + s.terr.mq + ' mq' : 'Terrazzo', s.terr.mq ? Math.min(.22, Math.round(30 * s.terr.mq / s.mq) / 100) : .07);
    if (s.giard) add('Giardino', t.k === 'villa' ? .03 : .06);
    if (s.balc) add('Balconi', .02);
    if (s.dot.piscina) add('Piscina', .05);
    if (s.dot.vista) add('Vista aperta', .06);
    if (s.dot.box) add('Box auto', .035); else if (s.dot.posto) add('Posto auto', .02);
    if (s.dot.epoca) add('Palazzo d’epoca', .03);
    if (s.dot.portiere) add('Portiere', .015);
    if (s.dot.noasc && !indip(t)) add('Senza ascensore', -.05);
    if (s.stato) add(s.stato.l, s.stato.adj);
    var v = z.eur * s.mq * mult, sp = z.largo ? .12 : .065, step = v >= 1e6 ? 10000 : 5000;
    var lo = Math.round(v * (1 - sp) / step) * step, hi = Math.round(v * (1 + sp + .01) / step) * step;
    return { lo: lo, hi: hi, f: f, z: z, mlo: Math.round(lo / s.mq / 50) * 50, mhi: Math.round(hi / s.mq / 50) * 50 };
  }
  function pct(p) { var n = Math.round(p * 1000) / 10; return (n > 0 ? '+' : '−') + String(Math.abs(n)).replace('.', ',') + '%'; }

  /* ---------- la conversazione ---------- */
  var log = $('#log'), form = $('#say'), txt = $('#txt');
  var S = { dot: {} }, firstRaw = '', awaiting = null, asked = {}, given = false, chain = Promise.resolve(), sent = false, altro = '';
  /* fuori zona e immobili commerciali: Dora non stima, passa al consulente */
  var FUORI = /\b(?:a|ad|in|di|vicino\s+a)\s+(milano|napoli|torino|firenze|bologna|venezia|genova|palermo|bari|verona|catania|padova|brescia|bergamo|perugia|cagliari|pescara|ancona|trento|bolzano|parma|modena|pisa|siena|lecce|salerno|latina|viterbo|frosinone|rieti|civitavecchia|fiumicino|anzio|nettuno|fregene|santa\s+marinella|bracciano|tivoli|frascati|grottaferrata|sabaudia|san\s+felice\s+circeo|formia|gaeta|terracina|pomezia|ladispoli|cerveteri|manziana|capalbio|porto\s+ercole|ansedonia|forte\s+dei\s+marmi|portofino|capri|porto\s+cervo|courmayeur|madonna\s+di\s+campiglio)\b/;
  var COMM = /(?:^|\b(?:un|uno|il|mio|nostro|vendo|vendere|ho)\s+)(negozio|ufficio|capannone|magazzino|laboratorio|studio\s+professionale)\b|\b(locale\s+commerciale|attivita\s+commerciale|intero\s+stabile|stabile\s+intero|palazzina\s+intera)\b/;
  function down() { requestAnimationFrame(function () { log.scrollTo ? log.scrollTo({ top: log.scrollHeight, behavior: reduce ? 'auto' : 'smooth' }) : (log.scrollTop = log.scrollHeight); }); }
  function say(html, after) {
    chain = chain.then(function () {
      return new Promise(function (res) {
        var m = el('div', 'msg msg--d', '<span class="sig" aria-hidden="true">D</span><div class="b"><span class="dots" aria-label="Dora sta scrivendo"><i></i><i></i><i></i></span></div>');
        log.appendChild(m); down();
        setTimeout(function () { var b = $('.b', m); b.innerHTML = html; if (after) after(b); down(); res(); }, reduce ? 40 : 480 + Math.min(820, html.replace(/<[^>]+>/g, '').length * 7));
      });
    });
    return chain;
  }
  function chips(b, list) {
    var w = el('div', 'msg__chips');
    list.forEach(function (c) {
      var x = el('button', 'chip'); x.type = 'button'; x.textContent = c[0];
      x.onclick = function () { $$('button', w).forEach(function (y) { y.disabled = true; y.style.pointerEvents = 'none'; y.style.opacity = y === x ? '1' : '.4'; }); x.setAttribute('aria-pressed', 'true'); c[1](c[0]); };
      w.appendChild(x);
    });
    b.appendChild(w);
  }
  function user(raw, marks) {
    var h = '', p = 0;
    (marks || []).forEach(function (k) { h += esc(raw.slice(p, k[0])) + '<mark data-k="' + k[2] + '">' + esc(raw.slice(k[0], k[1])) + '</mark>'; p = k[1]; });
    h += esc(raw.slice(p));
    var m = el('div', 'msg msg--u', h); log.appendChild(m); down();
    $$('mark', m).forEach(function (x, i) { setTimeout(function () { x.classList.add('on'); }, 260 + i * 170); });
  }
  function put(id, v) {
    var dd = $('#' + id); if (!dd || dd.getAttribute('data-v') === v) return;
    dd.setAttribute('data-v', v); dd.className = 'ok'; dd.innerHTML = '<span>' + esc(v) + '</span>';
  }
  function scheda() {
    var t = S.tipo, z = S.zona && Z[S.zona];
    if (z) {
      var name = S.zona === 'roma' && S.zonaTxt ? S.zonaTxt : z.n, tg = $('#tg');
      if ($('#tgB').textContent !== name) {
        tg.classList.toggle('targa--legno', !!z.legno);
        $('#tgS').textContent = S.zona === 'roma' ? 'Roma' : z.code; $('#tgB').textContent = name.length > 24 ? name.slice(0, 23) + '…' : name;
        if (!reduce && tg.animate) tg.animate([{ transform: 'scale(.965)', filter: 'brightness(1.12)' }, { transform: 'none', filter: 'none' }], { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    }
    if (t) put('kTipo', t.l); else if (given) put('kTipo', 'Appartamento');
    if (S.mq) put('kMq', S.mq + ' mq');
    var tt = t || DEF;
    if (indip(tt)) put('kPiano', 'Indipendente'); else if (S.piano) put('kPiano', S.piano.l); else if (tt.k === 'attico') put('kPiano', 'Ultimo piano');
    var e = []; if (S.terr) e.push(S.terr.mq ? 'Terrazzo di ' + S.terr.mq + ' mq' : 'Terrazzo'); if (S.giard) e.push('Giardino'); if (S.dot.piscina) e.push('Piscina'); if (S.balc) e.push('Balconi');
    if (e.length) put('kEst', e.join(', '));
    if (S.stato) put('kStato', S.stato.l);
    var q = []; if (S.dot.box) q.push('Box auto'); if (S.dot.posto) q.push('Posto auto'); if (S.dot.vista) q.push('Vista aperta'); if (S.dot.portiere) q.push('Portiere'); if (S.dot.epoca) q.push('Palazzo d’epoca'); if (S.dot.asc) q.push('Ascensore'); if (S.dot.noasc) q.push('Senza ascensore'); if (S.dot.camino) q.push('Camino'); if (S.dot.cantina) q.push('Cantina');
    if (q.length) put('kDot', q.join(', '));
  }
  var shown = { lo: 0, hi: 0 };
  function showEst(r) {
    var box = $('#stima'), v = $('#stV'); box.hidden = false;
    $('#stM').textContent = 'Circa ' + eur(r.mlo) + ' – ' + eur(r.mhi) + ' € al mq. Base di zona: ' + eur(r.z.eur) + ' € al mq.';
    $('#stF').innerHTML = r.f.map(function (x) { return '<li class="' + (x.p > 0 ? 'su' : 'giu') + '"><span>' + esc(x.l) + '</span><b>' + pct(x.p) + '</b></li>'; }).join('');
    var a = { lo: shown.lo || r.lo * .8, hi: shown.hi || r.hi * .8 }, t0 = performance.now(); shown = { lo: r.lo, hi: r.hi };
    (function tick(now) {
      var k = reduce ? 1 : Math.min(1, (now - t0) / 1100), e = 1 - Math.pow(1 - k, 4);
      v.textContent = eur(Math.round((a.lo + (r.lo - a.lo) * e) / 1000) * 1000) + ' – ' + eur(Math.round((a.hi + (r.hi - a.hi) * e) / 1000) * 1000) + ' €';
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  var ZC = ['parioli', 'pinciano', 'trieste', 'prati', 'centro', 'aventino', 'flaminio', 'vignaclara', 'cortina'];
  function ask(k) {
    awaiting = k; asked[k] = 1;
    if (k === 'zona') say('<p>Dove si trova?</p>', function (b) {
      chips(b, ZC.map(function (id) { return [Z[id].n, function (l) { answer(l, { zona: id }); }]; }).concat([['Altra zona', function (l) { user(l); awaiting = 'zona'; say('<p>Mi scriva il quartiere o la via. Se è una zona che non ho in tabella, la passo direttamente al consulente.</p>'); }]]));
    });
    if (k === 'mq') say('<p>Quanto è grande, più o meno?</p>', function (b) {
      chips(b, [['Fino a 100 mq', 90], ['100–150 mq', 125], ['150–250 mq', 200], ['Oltre 250 mq', 300]].map(function (c) { return [c[0], function (l) { answer(l, { mq: c[1] }); }]; }));
    });
    if (k === 'stato') say('<p>E com’è messa, oggi?</p>', function (b) {
      chips(b, [['Ristrutturato', { l: 'Ristrutturato', k: 'ok', adj: .10, en: 'Renovated' }], ['Buono stato', { l: 'Buono stato', k: 'buono', adj: 0, en: 'Good condition' }], ['Da ristrutturare', { l: 'Da ristrutturare', k: 'da', adj: -.14, en: 'To be renovated' }]].map(function (c) { return [c[0], function (l) { answer(l, { stato: c[1] }); }]; }));
    });
  }
  function next() {
    if (!S.zona) return ask('zona');
    if (!S.mq) return ask('mq');
    if (!S.stato && !asked.stato) return ask('stato');
    estimate();
  }
  function estimate() {
    var r = stima(S); if (!r) return;
    var was = given; given = true; scheda();
    function reveal() { showEst(r); refreshSheet(true); }
    var top = r.f.slice().sort(function (a, b) { return Math.abs(b.p) - Math.abs(a.p); }).slice(0, 2).map(function (x) { return x.l.toLowerCase() + ' (' + pct(x.p) + ')'; });
    var card = '<div class="est"><span>Stima indicativa</span><strong>' + eur(r.lo) + ' – ' + eur(r.hi) + ' €</strong><em>Circa ' + eur(r.mlo) + ' – ' + eur(r.mhi) + ' € al mq</em></div>';
    var richiama = ['Sì, richiamatemi', function (l) { user(l); modulo(); }];
    if (was) return say('<p>Corretto. Con questo, siamo qui:</p>' + card + (sent ? '' : '<p>Quando vuole la faccio richiamare.</p>'), function (b) { reveal(); if (!sent) chips(b, [richiama]); });
    say('<p>Per ' + frase({ tipo: S.tipo, mq: S.mq, zona: S.zona, zonaTxt: S.zonaTxt, dot: {} }) + ', oggi, siamo qui:</p>' + card + (top.length ? '<p>Pesano di più: ' + lista(top) + '.</p>' : '') + (r.z.largo ? '<p>È una zona che non ho in tabella, quindi l’intervallo è largo. Lo stringe il consulente.</p>' : ''), reveal);
    say('<p>È un intervallo, non un prezzo. Quello si decide in casa, con un consulente che la vede. Vuole che la richiamiamo?</p>', function (b) {
      chips(b, [richiama, ['Aggiungo un dettaglio', function (l) { user(l); say('<p>Dica pure. Terrazzo, box, vista, portiere, ascensore: quello che c’è, e rifaccio i conti.</p>'); if (!coarse) txt.focus(); }]]);
    });
  }
  function answer(label, patch) { user(label); awaiting = null; merge(S, Object.assign({ dot: {} }, patch)); scheda(); next(); }
  var INT = [
    [/gratis|gratuit|cost[ao]|pagare|pagamento|quanto\s+(?:mi\s+)?costa/, 'Niente. Né la stima né il sopralluogo.'],
    [/provvigion|commission|percentuale|compenso/, 'Di provvigione le parla il consulente, insieme alla strategia. Prima di allora non firma niente.'],
    [/quanto\s+tempo|tempi|in\s+quanto|quando\s+si\s+vende|velocemente/, 'Dipende da zona, prezzo e stato. Al sopralluogo il consulente porta i tempi medi di vendita della sua zona.'],
    [/chi\s+sei|sei\s+un|robot|\bbot\b|intelligenza|umano|persona\s+vera|\bai\b/, 'Sono un’assistente AI. Prendo nota e faccio la stima. Da lì in poi la segue un consulente, in persona.'],
    [/privacy|\bdati\b|riservat/, 'I suoi dati li vede Immobildream, e basta. Se vuole vendere senza farlo sapere, lo dica al consulente: niente cartello, niente annuncio.'],
    [/affitt|locazion/, 'Seguiamo anche le locazioni. Mi dica della casa e la passo al consulente.'],
    [/telefon|chiamar|parlare\s+con|consulente|appuntamento|sopralluogo/, 'I consulenti rispondono tutti i giorni, festivi compresi, allo 06 3200007. Oppure mi lascia il numero e la richiamiamo noi.'],
    [/dove\s+siete|sede|indirizzo|ufficio/, 'La sede è a Roma, in via Dora 2, nel Quartiere Coppedè.'],
    [/^(?:buon\s?giorno|buona\s?sera|salve|ciao)\b/, 'Buongiorno. Mi dica della casa: dov’è, quanto è grande, a che piano.'],
    [/grazie/, 'Grazie a lei.']
  ];
  function handle(raw) {
    raw = raw.trim(); if (!raw) return;
    var t0 = fold(raw), fz = !given && !sent && FUORI.exec(t0), cm = !given && !sent && !fz && COMM.exec(t0);
    if (fz || cm) {
      user(raw); if (!firstRaw) firstRaw = raw; awaiting = null;
      altro = fz ? 'Fuori zona: ' + fz[1].replace(/(^|\s)([a-z])(?!ei\s|i\s)/g, function (x, a, b) { return a + b.toUpperCase(); }) : 'Immobile commerciale: ' + (cm[1] || cm[2]);
      say('<p>' + (fz ? 'Fuori da Roma e da Cortina d’Ampezzo non faccio stime: i valori cambiano troppo da un comune all’altro. Mi lasci nome e telefono: un consulente la richiama e le dice se possiamo seguirla.' : 'Negozi, uffici e stabili interi non li stimo io: il valore dipende dalla via, dalle vetrine, da chi c’è dentro. Mi lasci nome e telefono e la richiama un consulente.') + '</p>', function (b) {
        chips(b, [['Sì, richiamatemi', function (l) { user(l); modulo(); }], ['Ho anche una casa a Roma', function (l) { user(l); altro = ''; say('<p>Bene. Mi dica dov’è e quanto è grande.</p>'); if (!coarse) txt.focus(); }]]);
      });
      return;
    }
    altro = '';
    var r = parse(raw), w = awaiting, m; awaiting = null;
    if (w === 'mq' && !r.mq && (m = /\d{2,4}/.exec(raw))) { r.mq = +m[0]; r.marks = [[m.index, m.index + m[0].length, 'mq']]; }
    var n = filled(r);
    if (!n) {
      var t = fold(raw), a = null; INT.some(function (i) { if (i[0].test(t)) { a = i[1]; return true; } });
      if (!a && w === 'zona' && raw.length > 2) { r.zona = 'roma'; r.zonaTxt = cap(raw.replace(/[.!?]+$/, '')); r.marks = [[0, raw.length, 'zona']]; n = 1; }
      else {
        user(raw);
        say('<p>' + (a || 'Qui non ho trovato dati sulla casa. Andiamo per ordine.') + '</p>');
        if (!given) { if (a && S.zona && S.mq) return; return next(); }
        return;
      }
    }
    user(raw, r.marks);
    if (!firstRaw) firstRaw = raw;
    var before = filled(S);
    merge(S, r);
    setTimeout(scheda, reduce ? 0 : 320);
    if (!given && (n >= 2 || !before)) say('<p>Ho preso nota: ' + frase(S) + '.</p>');
    setTimeout(next, reduce ? 0 : 340);
  }
  /* modulo di contatto dentro la conversazione */
  function modulo() {
    if (sent) return say('<p>La richiesta c’è già. La richiamiamo noi.</p>');
    say('<p>' + (altro ? 'Nome e telefono, e la richiama un consulente.' : 'Nome e telefono, e la richiama un consulente senior. La telefonata serve solo a fissare il sopralluogo.') + '</p>', function (b) {
      var f = el('div', 'mini');
      f.innerHTML = '<label>Nome e cognome<input type="text" name="n" autocomplete="name"></label>' +
        '<label>Telefono<input type="tel" name="t" autocomplete="tel" inputmode="tel"></label>' +
        '<div><label style="margin-bottom:7px">Quando la troviamo?</label><div class="mini__q" role="group" aria-label="Fascia oraria"><button type="button" class="chip" aria-pressed="true">Mattina</button><button type="button" class="chip" aria-pressed="false">Pomeriggio</button><button type="button" class="chip" aria-pressed="false">Sera</button></div></div>' +
        '<label class="mini__ok"><input type="checkbox" name="ok"><span>Va bene che Immobildream mi richiami per la valutazione.</span></label>' +
        '<p class="mini__e" hidden></p><button type="button" class="btn">Mi faccia richiamare</button>';
      b.appendChild(f);
      var q = $$('.mini__q .chip', f);
      q.forEach(function (c) { c.onclick = function () { q.forEach(function (x) { x.setAttribute('aria-pressed', x === c); }); }; });
      $('.btn', f).onclick = function () {
        var nm = $('[name=n]', f), tl = $('[name=t]', f), ok = $('[name=ok]', f), er = $('.mini__e', f), msg = '';
        nm.classList.remove('err'); tl.classList.remove('err');
        if (nm.value.trim().length < 2) { msg = 'Manca il nome.'; nm.classList.add('err'); nm.focus(); }
        else if (tl.value.replace(/\D/g, '').length < 8) { msg = 'Il numero sembra incompleto.'; tl.classList.add('err'); tl.focus(); }
        else if (!ok.checked) msg = 'Per richiamarla ci serve il suo consenso: spunti la casella.';
        if (msg) { er.textContent = msg; er.hidden = false; return; }
        var when = q.filter(function (x) { return x.getAttribute('aria-pressed') === 'true'; })[0].textContent;
        var name = nm.value.trim(), tel = tl.value.trim(); sent = true;
        f.innerHTML = '<p style="font:400 15px/1.5 var(--sans);color:var(--ink2)">' + esc(name) + ' · ' + esc(tel) + ' · ' + when.toLowerCase() + '</p>';
        var quando = when === 'Mattina' ? 'in mattinata' : when === 'Pomeriggio' ? 'nel pomeriggio' : 'in serata';
        say(altro ? '<p><b>Fatto, ' + esc(name.split(' ')[0]) + '.</b> Un consulente la richiama ' + quando + '.</p>' : '<p><b>Fatto, ' + esc(name.split(' ')[0]) + '.</b> Un consulente senior la richiama ' + quando + ' per fissare il sopralluogo.</p><p>La strategia di vendita la legge prima di firmare qualsiasi cosa.</p>');
        setTimeout(function () { quinte({ n: name, t: tel, w: quando }); }, reduce ? 200 : 2300);
      };
      if (!coarse) setTimeout(function () { $('[name=n]', f).focus({ preventScroll: true }); }, 60);
    });
  }
  /* invio e scrittura */
  function grow() { txt.style.height = 'auto'; txt.style.height = Math.min(140, txt.scrollHeight) + 'px'; }
  txt.addEventListener('input', grow);
  txt.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event('submit', { cancelable: true })); } });
  form.addEventListener('submit', function (e) { e.preventDefault(); if (typing) return; var v = txt.value; txt.value = ''; grow(); handle(v); });
  var typing = false;
  function reset() {
    S = { dot: {} }; firstRaw = ''; awaiting = null; asked = {}; given = false; sent = false; altro = ''; shown = { lo: 0, hi: 0 }; chain = Promise.resolve();
    log.innerHTML = ''; $('#stima').hidden = true;
    ['kTipo', 'kMq', 'kPiano', 'kEst', 'kStato', 'kDot'].forEach(function (id) { var x = $('#' + id); x.className = ''; x.removeAttribute('data-v'); x.textContent = 'in attesa'; });
    $('#tg').classList.remove('targa--legno'); $('#tgS').textContent = 'Roma'; $('#tgB').textContent = 'La sua zona';
  }
  $$('#ex .chip').forEach(function (c) {
    c.onclick = function () {
      if (typing) return; typing = true; reset();
      var s = c.getAttribute('data-t'), i = 0; txt.value = ''; if (!coarse) txt.focus({ preventScroll: true });
      (function t() {
        i += reduce ? s.length : 2; txt.value = s.slice(0, i); grow();
        if (i < s.length) setTimeout(t, 16); else setTimeout(function () { typing = false; txt.value = ''; grow(); handle(s); }, reduce ? 0 : 380);
      })();
    };
  });
  $('#stB').onclick = function () { U.scrollTo ? U.scrollTo($('.chat')) : $('.chat').scrollIntoView(); modulo(); };
  say('<p>Buongiorno, sono Dora. Mi dica della casa: dov’è, quanto è grande, a che piano. Il resto lo chiedo io.</p>');

  /* ---------- dietro le quinte ---------- */
  var Q = $('#quinte'), qData = null, qCh = 'mail';
  function qDraw() {
    if (!qData) return;
    if (!stima(S)) {
      var nota = altro || 'Stima non calcolata';
      $('#qP').innerHTML = qCh === 'mail'
        ? '<b>Oggetto: Nuova richiesta dalla landing «Vendere» (da valutare)</b>\n\nNome: ' + esc(qData.n) + '\nTelefono: ' + esc(qData.t) + '\nRichiamare: ' + qData.w + '\n\nNota di Dora: ' + esc(nota) + '. Nessuna stima inviata.\n\nParole del proprietario:\n«' + esc(firstRaw || '') + '»\n\nProvenienza: landing «Vendere»'
        : '<b>Nuova richiesta (da valutare)</b>\n' + esc(qData.n) + ', ' + esc(qData.t) + '\n' + esc(nota) + '\nRichiamare ' + qData.w;
      $('#qPri').textContent = 'Da valutare. ' + nota;
      return;
    }
    var r = stima(S);
    var pr = r.hi >= 900000 ? 'A' : r.hi >= 500000 ? 'B' : 'C', t = S.tipo || DEF;
    var f = r.f.map(function (x) { return x.l + ' ' + pct(x.p); }).join(', ') || 'nessuno';
    $('#qP').innerHTML = qCh === 'mail'
      ? '<b>Oggetto: Nuova valutazione Prestigio, ' + esc(t.l.toLowerCase() + ' ' + luogo(S)) + ' (priorità ' + pr + ')</b>\n\nNome: ' + esc(qData.n) + '\nTelefono: ' + esc(qData.t) + '\nRichiamare: ' + qData.w + '\n\nImmobile: ' + esc(frase(S)) + '\nStima indicativa: ' + eur(r.lo) + ' – ' + eur(r.hi) + ' €\nFattori: ' + esc(f) + '\n\nParole del proprietario:\n«' + esc(firstRaw || frase(S)) + '»\n\nProvenienza: landing «Vendere»'
      : '<b>Nuova richiesta Prestigio (' + pr + ')</b>\n' + esc(qData.n) + ', ' + esc(qData.t) + '\n' + esc(cap(frase(S))) + '\nStima ' + eur(r.lo) + ' – ' + eur(r.hi) + ' €\nRichiamare ' + qData.w;
    $('#qPri').textContent = 'Priorità ' + pr + (pr === 'A' ? ': stima oltre 900.000 €' : pr === 'B' ? ': stima oltre 500.000 €' : ': stima sotto 500.000 €');
  }
  function quinte(o) { qData = o; qDraw(); Q.classList.add('on'); Q.setAttribute('aria-hidden', 'false'); }
  $('#qX').onclick = function () { Q.classList.remove('on'); Q.setAttribute('aria-hidden', 'true'); };
  $$('.quinte__tabs button').forEach(function (b) { b.onclick = function () { qCh = b.getAttribute('data-c'); $$('.quinte__tabs button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); qDraw(); }; });

  /* ---------- il muro delle targhe ---------- */
  var wall = $('#targhe'), zSel = null;
  WALL.forEach(function (id) {
    var z = Z[id], b = el('button'); b.type = 'button'; b.setAttribute('aria-pressed', 'false'); b.setAttribute('data-z', id);
    b.innerHTML = '<span class="targa' + (z.legno ? ' targa--legno' : '') + ((z.tg || z.n).length > 11 ? ' lunga' : '') + '"><small>' + esc(z.tc || z.code) + '</small><b>' + esc(z.tg || z.n) + '</b></span>';
    b.onclick = function () { pick(id); };
    wall.appendChild(b);
  });
  function pick(id) {
    zSel = id; var z = Z[id];
    $$('button', wall).forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-z') === id); });
    $('#zN').textContent = z.tg && z.tg !== z.n ? z.tg + ', ' + z.n : z.n; $('#zD').textContent = z.d;
    $('#zV').textContent = eur(z.band[0]) + ' – ' + eur(z.band[1]) + ' € al mq'; $('#zT').textContent = z.t;
    $('#zB').textContent = 'Valuti una casa ' + z.pre;
    var p = $('#zona'); if (!reduce && p.animate) p.animate([{ opacity: .25, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)' });
  }
  pick('parioli');
  $('#zB').onclick = function () {
    var id = zSel; U.scrollTo ? U.scrollTo($('#valutazione')) : $('#valutazione').scrollIntoView();
    if (given || filled(S)) reset();
    merge(S, { zona: id, dot: {} }); scheda(); asked.zona = 1; awaiting = null;
    say('<p>' + Z[id].n + '. Mi dica quanto è grande, a che piano e com’è messa.</p>');
    if (!coarse) setTimeout(function () { txt.focus({ preventScroll: true }); }, 900);
  };

  /* ---------- la scheda di presentazione ---------- */
  var EX = merge({ dot: {} }, parse('Attico di 180 mq ai Parioli, ultimo piano, terrazzo di 60 mq, box auto, vista aperta. Da ristrutturare.'));
  var lang = 'it', seen = false, tw = 0, lastKey = '';
  function sheet(s, L) {
    var z = Z[s.zona], t = s.tipo || DEF, it = L === 'it', f = t.g === 'f';
    var T = it ? t.l : cap(t.en), pre = it ? luogo(s) : z.enP, h;
    if (t.k === 'attico' && s.terr) h = it ? T + ' con terrazzo ' + pre : T + ' with terrace ' + pre;
    else if (t.k === 'villa' && (s.giard || s.dot.piscina)) h = it ? T + ' con ' + (s.dot.piscina ? 'giardino e piscina ' : 'giardino ') + pre : T + ' with ' + (s.dot.piscina ? 'garden and pool ' : 'garden ') + pre;
    else if (s.dot.epoca && t.k === 'app') h = it ? T + ' d’epoca ' + pre : 'Period ' + t.en + ' ' + pre;
    else if (s.dot.vista) h = it ? T + ' con vista ' + pre : T + ' with open views ' + pre;
    else if (s.terr) h = it ? T + ' con terrazzo ' + pre : T + ' with terrace ' + pre;
    else h = T + ' ' + pre;
    var top = t.k === 'attico' && !s.piano ? (it ? ' all’ultimo piano' : ' on the top floor') : s.piano && !indip(t) ? ' ' + (it ? s.piano.ph : s.piano.en) : '';
    var p = [];
    if (it) p.push(cap(z.it) + ', ' + (f ? 'una ' : t.l === 'Chalet' ? 'uno ' : 'un ') + t.l.toLowerCase() + ' di ' + s.mq + ' metri quadri' + top + '.');
    else p.push(cap(z.en) + ', ' + (/^[aeiou]/.test(t.en) ? 'an ' : 'a ') + s.mq + ' sq m ' + t.en + top + '.');
    if (s.terr) p.push(it ? 'Il terrazzo' + (s.terr.mq ? ' di ' + s.terr.mq + ' metri quadri' : '') + ' prolunga la zona giorno all’aperto.' : 'The ' + (s.terr.mq ? s.terr.mq + ' sq m ' : '') + 'terrace extends the living area outdoors.');
    if (s.giard) p.push(it ? 'Il giardino privato ' + (indip(t) ? 'la circonda e ' : '') + 'la separa dalla strada.' : 'A private garden sets it back from the street.');
    if (s.dot.piscina) p.push(it ? 'In giardino, la piscina.' : 'The garden has a swimming pool.');
    if (s.dot.vista) p.push(it ? 'Gli affacci sono aperti e portano luce in ogni stanza.' : 'Open views bring light into every room.');
    if (s.dot.epoca) p.push(it ? 'Il palazzo d’epoca conserva soffitti alti e proporzioni generose.' : 'The period building keeps its high ceilings and generous proportions.');
    if (s.dot.portiere) p.push(it ? 'Il palazzo ha il servizio di portineria.' : 'The building has a concierge service.');
    if (s.balc && !s.terr) p.push(it ? 'I balconi danno aria alle stanze.' : 'Balconies open the rooms to the air.');
    if (s.dot.box) p.push(it ? 'Completa la proprietà il box auto.' : 'A private garage completes the property.');
    if (s.stato) p.push(s.stato.k === 'ok' ? (it ? (f ? 'Ristrutturata con cura, è pronta da abitare.' : 'Ristrutturato con cura, è pronto da abitare.') : 'Carefully renovated and ready to move into.')
      : s.stato.k === 'da' ? (it ? 'È da ristrutturare: gli spazi si prestano a un progetto su misura.' : 'To be renovated: the layout lends itself to a tailor-made project.')
        : (it ? 'In buono stato, si abita subito e si personalizza nel tempo.' : 'In good condition, ready to live in and to personalise over time.'));
    p.push(it ? 'Visite riservate, su appuntamento.' : 'Private viewings by appointment.');
    var facts = [s.mq + (it ? ' mq' : ' sq m')];
    if (indip(t)) facts.push(it ? 'Indipendente' : 'Detached'); else if (s.piano) facts.push(it ? s.piano.l : s.piano.enL); else if (t.k === 'attico') facts.push(it ? 'Ultimo piano' : 'Top floor');
    if (s.terr) facts.push((it ? 'Terrazzo' : 'Terrace') + (s.terr.mq ? ' ' + s.terr.mq + (it ? ' mq' : ' sq m') : ''));
    if (s.giard) facts.push(it ? 'Giardino' : 'Garden');
    if (s.dot.box) facts.push(it ? 'Box auto' : 'Garage');
    if (s.stato) facts.push(it ? s.stato.l : s.stato.en);
    return { h: h, p: p.join(' '), f: facts };
  }
  function refreshSheet(force) {
    var mine = given && S.zona && S.mq, s = mine ? S : EX, o = sheet(s, lang), key = lang + '|' + o.h + '|' + o.p;
    if (key === lastKey && !force) return; lastKey = key;
    $('#fRif').textContent = lang === 'it' ? 'Scheda di presentazione, bozza' : 'Property presentation, draft';
    $('#fCap').textContent = lang === 'it' ? 'Fotografia d’esempio' : 'Sample photograph';
    $('#fN').textContent = lang === 'it' ? (mine ? 'Bozza scritta da Dora dalle sue parole.' : 'Un esempio. Racconti la sua casa a Dora e la bozza si riscrive.') : (mine ? 'Draft written by Dora from the owner’s description.' : 'An example. Describe your home to Dora and the draft is rewritten with your details.');
    $('#fF').innerHTML = o.f.map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('');
    var H = $('#fH'), P = $('#fP'); clearInterval(tw);
    if (reduce || !seen) { H.textContent = o.h; P.textContent = o.p; P.classList.remove('typing'); return; }
    H.textContent = o.h; if (H.animate) H.animate([{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'ease-out' });
    var i = 0; P.textContent = ''; P.classList.add('typing');
    tw = setInterval(function () { i += 3; P.textContent = o.p.slice(0, i); if (i >= o.p.length) { clearInterval(tw); P.classList.remove('typing'); } }, 16);
  }
  $$('.lingua button').forEach(function (b) { b.onclick = function () { lang = b.getAttribute('data-l'); $$('.lingua button').forEach(function (x) { x.setAttribute('aria-pressed', x === b); }); $('.foglio').setAttribute('lang', lang); refreshSheet(true); }; });
  refreshSheet(true);
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es, io) { if (es[0].isIntersecting) { seen = true; refreshSheet(true); io.disconnect(); } }, { threshold: .35 }).observe($('.foglio'));
  else seen = true;

  /* ---------- la riga del metodo ---------- */
  var passi = $('#passi');
  if (passi && U.onScroll) U.onScroll(function () {
    var r = passi.getBoundingClientRect(), vh = innerHeight;
    passi.style.setProperty('--t', Math.max(0, Math.min(1, (vh * .92 - r.top) / (vh * .55))).toFixed(3));
  });
  if (U.refresh) U.refresh();
  window.__dora = { parse: parse, stima: stima, state: function () { return S; }, handle: handle };
})();
