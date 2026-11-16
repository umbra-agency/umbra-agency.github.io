#!/usr/bin/env python3
"""Genera le demo servizi ambientali: ambiente/<slug>/index.html da leads.json.
Uso: python3 build.py leads.json [--media-only]"""
import json, os, re, sys, html, colorsys, unicodedata, hashlib, urllib.parse

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
V = '1'
UMBRA_WA = '393514618847'
E = lambda s: html.escape(str(s or ''), quote=True)

# ---------------------------------------------------------------- util
def slugify(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    s = re.sub(r'\b(s\.?r\.?l\.?s?|s\.?p\.?a\.?|s\.?n\.?c\.?|s\.?a\.?s\.?|soc\.?\s*coop\.?|societa|cooperativa|gmbh|kg|ohg|&\s*c\.?)\b', ' ', s)
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return re.sub(r'-+', '-', s)[:48].strip('-')

def hrgb(h):
    h = (h or '').strip().lstrip('#')
    if len(h) == 3: h = ''.join(c * 2 for c in h)
    if not re.fullmatch(r'[0-9a-fA-F]{6}', h): return None
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
def rgbh(c): return '#%02x%02x%02x' % tuple(max(0, min(255, round(x * 255))) for x in c)
def lum(c):
    f = lambda x: x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4
    r, g, b = map(f, c); return .2126 * r + .7152 * g + .0722 * b
def contrast(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True); return (la + .05) / (lb + .05)
def with_l(c, l):
    h, _, s = colorsys.rgb_to_hls(*c); return colorsys.hls_to_rgb(h, l, s)

def pick_accent(cols):
    best, bs = None, -1
    for h in cols or []:
        c = hrgb(h)
        if not c: continue
        hh, l, s = colorsys.rgb_to_hls(*c)
        if l > .93 or l < .08: continue
        score = s * (1 - abs(l - .5))
        if score > bs: best, bs = c, score
    return best

def tone_accent(c, dark):
    """accento leggibile: su fondo scuro chiaro e saturo, su fondo chiaro abbastanza scuro"""
    if c is None: c = hrgb('#3fa37a')
    h, l, s = colorsys.rgb_to_hls(*c)
    s = max(s, .45)
    if dark:
        bg = hrgb('#0c0f11'); l = max(l, .5)
        c = colorsys.hls_to_rgb(h, l, s)
        while contrast(c, bg) < 6.5 and l < .82: l += .03; c = colorsys.hls_to_rgb(h, l, s)
        txt = c
    else:
        c = colorsys.hls_to_rgb(h, min(max(l, .28), .55), s)
        bg = hrgb('#f3f1ec'); t = c; tl = min(l, .45)
        while contrast(t, bg) < 5 and tl > .1: tl -= .03; t = colorsys.hls_to_rgb(h, tl, s)
        txt = t
    on = (1, 1, 1) if contrast(c, (1, 1, 1)) >= 3.2 else hrgb('#0b0b0b')
    return rgbh(c), rgbh(txt), rgbh(on)

def num_parts(s):
    """'45 mezzi' -> (45, 'mezzi', prefisso, suffisso)"""
    m = re.search(r'(\d{1,3}(?:[.\s]\d{3})+|\d+(?:[.,]\d+)?)', s or '')
    if not m: return None
    raw = m.group(1); n = raw.replace(' ', '').replace('.', '') if re.search(r'[.\s]\d{3}', raw) else raw.replace(',', '.')
    try: val = float(n)
    except: return None
    pre = s[:m.start()].strip(); post = s[m.end():].strip()
    return val, pre, post

PROV = {'VR': 'Verona', 'VI': 'Vicenza', 'PD': 'Padova', 'TV': 'Treviso', 'VE': 'Venezia', 'RO': 'Rovigo', 'BL': 'Belluno',
        'UD': 'Udine', 'PN': 'Pordenone', 'GO': 'Gorizia', 'TS': 'Trieste', 'TN': 'Trento', 'BZ': 'Bolzano'}

# ---------------------------------------------------------------- settori
SECT = [
 ('spurghi', r'spurg|autospurg|fogn|fosse|video.?ispez|canal|condott|disostruz|pozzi neri|sgorg|kanal'),
 ('bonifica', r'bonific|amianto|eternit|siti contaminati|caratterizzaz'),
 ('impianto', r'impiant|selezion|recuper|riciclo|riciclag|stoccagg|trattament|piattaform|centro di raccolta|compost'),
 ('cantiere', r'demoliz|inert|scav|movimento terra|macerie|edil'),
 ('container', r'container|cassoni|scarrabil|noleggio cass|press-?container|compattator'),
 ('spazzamento', r'spazzament|pulizia strad|spazzatric|lavaggio strad|neve|sgombero neve'),
 ('raccolta', r'raccolt|trasport|rifiut|porta a porta|igiene urban|differenziat|ecologic'),
 ('disinfestazione', r'disinfest|derattizz|sanificaz|zanzar|igiene ambient'),
 ('consulenza', r'consulen|formular|mud|adr|pratiche|analisi|laborator'),
]
STOCK = {'raccolta': 6, 'spazzamento': 4, 'impianto': 6, 'notte': 5, 'territorio': 4, 'cantiere': 5, 'bonifica': 3, 'container': 2, 'camion': 3}
STOCK_FOR = {'spurghi': 'camion', 'bonifica': 'bonifica', 'impianto': 'impianto', 'cantiere': 'cantiere', 'container': 'container',
             'spazzamento': 'spazzamento', 'raccolta': 'raccolta', 'disinfestazione': 'territorio', 'consulenza': 'territorio'}

def sector_of1(text):
    t = (text or '').lower()
    for k, rx in SECT:
        if re.search(rx, t): return k
    return None

def sector_of(text, items=None):
    if items:
        from collections import Counter
        c = Counter(s for s in (sector_of1(x) for x in items) if s)
        if c:
            best = max(c.values()); order = [k for k, _ in SECT]
            return sorted([k for k, v in c.items() if v == best], key=order.index)[0]
    return sector_of1(text) or 'raccolta'

SERV_DESC = {
 'spurghi': 'Spurgo e pulizia di fosse, pozzetti e condotte, con mezzi attrezzati e smaltimento autorizzato di quanto aspirato.',
 'bonifica': 'Rimozione e smaltimento in sicurezza, con piano di lavoro, confinamento dell\'area e trasporto a impianto autorizzato.',
 'impianto': 'Ricezione, selezione e avvio a recupero dei materiali, perché tornino a essere risorse.',
 'cantiere': 'Demolizioni, scavi e gestione degli inerti, con separazione dei materiali in cantiere.',
 'container': 'Cassoni e container posizionati dove servono e ritirati pieni, con trasporto all\'impianto.',
 'spazzamento': 'Pulizia di strade, piazze e aree pubbliche con mezzi meccanizzati e operatori.',
 'raccolta': 'Ritiro e trasporto dei rifiuti con mezzi autorizzati, dal produttore all\'impianto di destinazione.',
 'disinfestazione': 'Interventi programmati e su chiamata per ambienti pubblici e privati.',
 'consulenza': 'Pratiche, registri e adempimenti ambientali seguiti per conto del cliente.',
}
CYCLE = {
 'spurghi': [('Chiamata', 'Ci dite dove e cosa: fossa, pozzetto, condotta, urgenza.'), ('Sopralluogo', 'Valutiamo accesso, volumi e mezzo adatto.'),
             ('Intervento', 'Aspirazione, lavaggio e, se serve, video-ispezione.'), ('Trasporto', 'Il refluo va a un impianto autorizzato, con formulario.'),
             ('Documenti', 'Vi restano i documenti di trasporto e smaltimento.')],
 'bonifica': [('Sopralluogo', 'Verifica del materiale e delle condizioni dell\'area.'), ('Piano di lavoro', 'Presentato all\'organo di vigilanza prima di iniziare.'),
              ('Bonifica', 'Rimozione con area confinata e operatori protetti.'), ('Smaltimento', 'Trasporto a impianto autorizzato, con formulario.'),
              ('Restituzione', 'L\'area torna utilizzabile, con la documentazione finale.')],
 'impianto': [('Conferimento', 'Il materiale arriva in impianto e viene pesato.'), ('Controllo', 'Verifica di codici, documenti e qualità del carico.'),
              ('Selezione', 'Separazione per tipologia di materiale.'), ('Recupero', 'Ciò che è recuperabile torna in filiera.'), ('Nuova materia', 'Il materiale esce come risorsa.')],
 'cantiere': [('Sopralluogo', 'Rilievo del cantiere e dei materiali presenti.'), ('Pianificazione', 'Mezzi, tempi e autorizzazioni.'),
              ('Demolizione', 'Smontaggio selettivo, materiali separati.'), ('Inerti', 'Gli inerti prendono la via del recupero.'), ('Consegna', 'Area pulita e documentazione completa.')],
}
CYCLE_DEFAULT = [('Richiesta', 'Ci dite cosa serve, dove e con quali tempi.'), ('Pianificazione', 'Mezzi, percorsi e autorizzazioni.'),
                 ('Raccolta', 'Ritiro con mezzi autorizzati.'), ('Trasporto', 'All\'impianto di destinazione, con formulario.'), ('Recupero', 'Ciò che è recuperabile torna materia.')]

# ---------------------------------------------------------------- icone
IC = {
 'ar': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
 'wa': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.6 14.1c-.2.7-1.4 1.3-1.9 1.3-.5.1-1.1.1-1.8-.1a16 16 0 0 1-1.6-.6c-2.9-1.2-4.7-4.1-4.9-4.3-.1-.2-1.2-1.6-1.2-3s.8-2.2 1-2.5c.3-.3.6-.4.8-.4h.6c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.6 2.1 1.1 1 2 1.3 2.3 1.4.3.2.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.1.1.7-.1 1.4Z"/></svg>',
 'ph': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>',
 'cert': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="9" r="6"/><path d="m9 9 2 2 4-4M8.5 14 7 22l5-3 5 3-1.5-8"/></svg>',
}

# ---------------------------------------------------------------- dati lead
def norm(L):
    d = dict(L)
    d['nome'] = (d.get('nome') or d.get('ragione_sociale') or '').strip()
    d['slug'] = d.get('slug') or slugify(d['nome'])
    d['servizi'] = [s.strip(' .') for s in (d.get('servizi') or []) if s and len(s.strip()) > 2][:8]
    d['cert'] = [c for c in (d.get('certificazioni') or []) if c][:8]
    d['nk'] = [n for n in (d.get('numeri_chiave') or []) if n][:4]
    d['foto'] = [u for u in (d.get('foto_urls') or []) if isinstance(u, str) and u.startswith('http')][:8]
    d['sector'] = sector_of(' '.join(d['servizi']) + ' ' + (d.get('claim') or '') + ' ' + d['nome'], d['servizi'] + [d['nome']])
    d['prov'] = (d.get('provincia') or '').upper()[:2]
    d['gen'] = d.get('generazione_famiglia') or d.get('generazione/famiglia') or d.get('generazione')
    if not d.get('anno_fondazione'):
        for s in d.get('numeri_chiave') or []:
            m = re.search(r'\bdal (\d{4})\b', s, re.I)
            if m: d['anno_fondazione'] = m.group(1); break
    if isinstance(d.get('telefono'), str): d['telefono'] = re.split(r'\s*[/;,]\s*|\s+-\s+', d['telefono'])[0].strip()
    if isinstance(d.get('email'), str): d['email'] = re.split(r'[\s;,/]+', d['email'].strip())[0]
    if isinstance(d.get('indirizzo'), str): d['indirizzo'] = re.sub(r'\s*\(.*?\)', '', d['indirizzo'].split(';')[0]).split(',')[0].strip()
    d['provn'] = PROV.get(d['prov'], d.get('provincia') or '')
    try: d['anno'] = int(str(d.get('anno_fondazione'))[:4])
    except: d['anno'] = None
    if d['anno'] and not (1850 < d['anno'] < 2026): d['anno'] = None
    return d

def media_plan(d):
    """righe per _media.tsv: foto loro + logo"""
    rows = []
    for i, u in enumerate(d['foto']):
        rows.append((u, f"{d['slug']}/m/{i + 1}.jpg"))
    lu = d.get('logo_url')
    if isinstance(lu, str) and lu.startswith('http') and not lu.lower().endswith('.svg'):
        rows.append((lu, f"{d['slug']}/m/logo.png"))
    return rows

def stock(cat, i):
    n = STOCK.get(cat, 4); return f"../_stock/{cat}-{(i % n) + 1}.jpg"

# ---------------------------------------------------------------- foto scelte
class Photos:
    def __init__(self, d, rep):
        self.d = d; self.items = []; seen = set()
        pre = d['slug'] + '/m/'
        keys = sorted([k for k in rep if k.startswith(pre) and k.endswith('.jpg') and rep[k].get('ok')], key=lambda k: (0 if '/m/s' not in k else 1, k))
        for k in keys:
            r = rep[k]; hh = r.get('hash')
            if hh and hh in seen: continue
            seen.add(hh); self.items.append({'src': k[len(d['slug']) + 1:], 'w': r['w'], 'h': r['h'], 'lum': r.get('lum', 120)})
        self.items.sort(key=lambda x: -(min(x['w'], 2200) * (1.2 if x['w'] >= x['h'] else .8)))
        self.cat = STOCK_FOR.get(d['sector'], 'raccolta'); self.k = 0; self.used = set()
        h = int(hashlib.md5(d['slug'].encode()).hexdigest(), 16); self.off = h % 7
        lr = rep.get(f"{d['slug']}/m/logo.png", {})
        self.logo = 'm/logo.png' if lr.get('ok') and os.path.exists(os.path.join(ROOT, d['slug'], 'm', 'logo.png')) else None
        self.logo_light = False
        if self.logo:
            from PIL import Image
            im = Image.open(os.path.join(ROOT, d['slug'], 'm', 'logo.png')).convert('RGBA'); im.thumbnail((120, 120))
            px = [(r, g, b) for r, g, b, a in im.getdata() if a > 180]
            if px:
                lm = sum(.299 * r + .587 * g + .114 * b for r, g, b in px) / len(px)
                opaque = len(px) / (im.size[0] * im.size[1])
                self.logo_light = lm > 205 and opaque < .9
    def big(self, minw=1300):
        return [x for x in self.items if x['w'] >= minw]
    def hero(self):
        b = [x for x in self.items if x['w'] >= 1500 and x['w'] >= x['h']]
        if b: self.used.add(b[0]['src']); return b[0]['src'], True
        return stock('notte' if self.d['_arch'] == 'X' else 'territorio' if self.d['_arch'] == 'T' else self.cat, self.off), False
    def next(self, minw=700, cat=None):
        for lim in (minw, 560):
            for x in self.items:
                if x['src'] not in self.used and x['w'] >= lim:
                    self.used.add(x['src']); return x['src']
        ok = [x for x in self.items if x['w'] >= 560]
        if len(ok) >= 3:
            self.k += 1; return ok[self.k % len(ok)]['src']
        self.k += 1; return stock(cat or self.cat, self.off + self.k)
    def fb(self, cat=None):
        self.k += 1; return stock(cat or self.cat, self.off + self.k + 3)
    def own_count(self): return len(self.items)

def img_tag(src, alt, fb):
    return f'<img src="{E(src)}" data-fb="{E(fb)}" alt="{E(alt)}" loading="lazy" decoding="async">'

def img(src, alt, fb, cls='', eager=False, ar=None):
    st = f' style="--ar:{ar}"' if ar else ''
    return (f'<div class="ph {cls}"{st}><img src="{E(src)}" data-fb="{E(fb)}" alt="{E(alt)}" '
            f'{"fetchpriority=\"high\"" if eager else "loading=\"lazy\""} decoding="async"></div>')

# ---------------------------------------------------------------- testi
def hero_title(d, arch):
    s = d['sector']; c = d.get('comune') or ''; pv = d['provn']; a = d['anno']
    pick = int(hashlib.md5((d['slug'] + arch).encode()).hexdigest(), 16)
    T = {
     'spurghi': [['Reti e fosse,', '<em>libere</em>', 'e in regola.'], ['Lo spurgo', 'fatto <em>come si deve</em>.'], ['Quando si intasa,', 'arriviamo <em>noi</em>.']],
     'bonifica': [['Bonifiche', '<em>in sicurezza</em>,', 'documentate.'], ['L\'amianto,', 'tolto <em>a regola</em>', 'd\'arte.']],
     'impianto': [['Quello che', 'scartate torna', '<em>materia</em>.'], ['Dal rifiuto', 'alla <em>risorsa</em>.']],
     'cantiere': [['Demolire,', 'separare,', '<em>recuperare</em>.'], ['Cantieri puliti,', 'inerti <em>recuperati</em>.']],
     'container': [['Il cassone', 'giusto, <em>al momento</em>', 'giusto.'], ['Container', 'e trasporto', '<em>senza attese</em>.']],
     'spazzamento': [['Strade pulite,', 'città <em>in ordine</em>.'], ['Il territorio', 'di ' + E(pv or c) + ',', '<em>in ordine</em>.']],
     'raccolta': [['Servizi ambientali', 'per ' + E(pv or c), '<em>' + (f'dal {a}' if a else 'e dintorni') + '</em>.'], ['Rifiuti gestiti,', 'territorio', '<em>in ordine</em>.'], ['Raccolta e trasporto', '<em>senza pensieri</em>.']],
     'disinfestazione': [['Ambienti sani,', '<em>interventi</em>', 'programmati.']],
     'consulenza': [['Gli adempimenti', 'ambientali,', '<em>seguiti da noi</em>.']],
    }
    opts = T.get(s, T['raccolta']); t = opts[pick % len(opts)]
    if arch == 'X': t = [re.sub(r'<em>(.*?)</em>', r'<em>\1</em>', x) for x in t]
    return t

def say_text(d):
    nm = E(d['nome']); parts = []
    srv = [s.lower() for s in d['servizi'][:3]]
    where = E(d.get('comune') or d['provn'])
    if d['anno']: parts.append(f"Dal {d['anno']} {nm} lavora da {where}")
    else: parts.append(f"{nm} lavora da {where}")
    if srv:
        lst = ', '.join(E(x) for x in srv[:-1]) + (' e ' if len(srv) > 1 else '') + E(srv[-1])
        parts[-1] += f": {lst}"
    clienti = d.get('comuni_o_clienti_serviti')
    if clienti and isinstance(clienti, str) and len(clienti) < 90: parts[-1] += f", per {E(clienti[0].lower() + clienti[1:])}"
    txt = parts[0] + '.'
    if d['cert']: txt += f" Con <em>{len(d['cert'])} certificazion{'e' if len(d['cert']) == 1 else 'i'}</em> a garanzia."
    words = re.split(r'(\s+)', txt); out = []
    inem = False
    for w in words:
        if not w.strip(): out.append(w); continue
        out.append(f'<span class="w">{w}</span>')
    return ''.join(out)

UNITS = [(r'mezz|automezz|veicol|camion', 'mezzi'), (r'comun', 'comuni serviti'), (r'provinc', 'province servite'), (r'sed[ei]', 'sedi'),
         (r'client', 'clienti'), (r'container|cassoni', 'container'), (r'dipendent|addett|collaborator', 'persone'), (r'interventi', 'interventi'),
         (r'impiant|centri di recupero', 'impianti'), (r'm²|mq|metri quadr', 'm² di piattaforma'), (r'generazion', 'generazioni'), (r'km', 'km')]
WORDNUM = {'due': 2, 'tre': 3, 'quattro': 4, 'cinque': 5, 'sei': 6}
def stats(d):
    out = []
    if d['anno']: out.append((str(2026 - d['anno']), 2026 - d['anno'], 'anni di attività'))
    for s in d['nk']:
        sl = s.lower()
        if re.search(r"capitale|fatturat|€|euro|copyright|fonte|registro|iscritt|\d{1,2}:\d{2}|categoria|cat\.|dal \d{4}|anni '|anni ’|elencat|schede|linee|viste|lingue", sl): continue
        if re.search(r'\b(h24|24\s*/\s*7|24 ?ore|24h)\b', sl):
            out.append(('24h', None, 'pronto intervento')); continue
        if 'anni' in sl:
            if d['anno']: continue
            m = re.search(r'(\d{2,3})\+?\s*anni', sl)
            if m: out.append((('+' if re.search(r'oltre|più|\+', sl) else '') + m.group(1), None, 'anni di esperienza'))
            continue
        for w, n in WORDNUM.items(): sl = re.sub(r'\b' + w + r'\b', str(n), sl)
        m = re.search(r'(\d{1,3}(?:[.\s]\d{3})+|\d+(?:,\d+)?)\s*(%)?', sl)
        if not m: continue
        raw = m.group(1)
        try: val = float(raw.replace('.', '').replace(' ', '').replace(',', '.'))
        except: continue
        if m.group(2):
            lab = re.sub(r'^[\d.,%\s]+', '', s).strip()[:40]
            if lab: out.append((raw + '%', None, lab))
            continue
        lab = None
        for rx, l in UNITS:
            if re.search(rx, sl[m.end():m.end() + 30]): lab = l; break
        if not lab: continue
        pre = '+' if re.search(r'oltre|più di|\+', sl) else ''
        disp = pre + (f'{int(val):,}'.replace(',', '.') if val == int(val) else raw)
        out.append((disp, None if pre or val != int(val) else val, lab))
    seen = set(); res = []
    for disp, v, l in out:
        if l in seen: continue
        seen.add(l); res.append((disp, v, l))
    if len(res) < 2 and d['cert']: res.append((str(len(d['cert'])), len(d['cert']), 'certificazioni e iscrizioni'))
    if len(res) < 2 and len(d['servizi']) >= 3: res.append((str(len(d['servizi'])), len(d['servizi']), 'servizi, un solo referente'))
    return res[:3]

def stat_html(disp, v):
    if v is None: return E(disp)
    return f'<span data-to="{v:g}">{E(disp)}</span>'

def nfmt(v):
    if v == int(v): v = int(v); return f'{v:,}'.replace(',', '.'), str(v)
    return str(v).replace('.', ','), str(v)

def cert_info(c):
    cl = c.lower()
    if '14001' in cl: return 'ISO 14001', 'Gestione ambientale'
    if '9001' in cl: return 'ISO 9001', 'Qualità'
    if '45001' in cl or '18001' in cl: return 'ISO 45001', 'Salute e sicurezza'
    if 'emas' in cl: return 'EMAS', 'Registrazione ambientale europea'
    if 'albo' in cl: return 'Albo Gestori Ambientali', c if len(c) < 60 else 'Iscrizione all\'Albo'
    if 'sa8000' in cl or 'sa 8000' in cl: return 'SA8000', 'Responsabilità sociale'
    if '39001' in cl: return 'ISO 39001', 'Sicurezza stradale'
    if 'soa' in cl: return 'SOA', c
    if 'white list' in cl or 'whitelist' in cl: return 'White list', 'Iscrizione in prefettura'
    if 'rating' in cl: return 'Rating di legalità', c
    return c[:40], ''

def tel_href(t):
    t = re.sub(r'[^\d+]', '', t or '')
    if not t: return ''
    if not t.startswith('+'): t = '+39' + t
    return 'tel:' + t

# ---------------------------------------------------------------- blocchi comuni
def nav(d, P, arch, dark):
    logo = P.logo
    if logo:
        b = f'<img src="{logo}" alt="{E(d["nome"])}">'
        if P.logo_light and not dark: b = f'<span>{E(d["nome"])}</span>'
        elif dark and not P.logo_light: b = f'<span class="brand__chip">{b}</span>'
    else:
        b = f'<span>{E(d["nome"])}</span>'
    links = ''.join(f'<a href="#{a}">{t}</a>' for a, t in d['_nav'])
    return f'''<header class="nav"><div class="wrap nav__in"><a class="brand" href="#top" aria-label="{E(d['nome'])}">{b}</a>
<nav class="nav__links" aria-label="Sezioni">{links}</nav><a class="btn btn--g" href="#contatti">Contattaci</a></div></header>'''

def contacts(d, arch):
    tel = d.get('telefono'); em = d.get('email'); ind = ', '.join(x for x in [d.get('indirizzo'), d.get('comune'), d['prov'] and f"({d['prov']})"] if x)
    rows = []
    if tel: rows.append(f'<a href="{tel_href(tel)}"><span>Telefono</span><b>{E(tel)}</b></a>')
    if em: rows.append(f'<a href="mailto:{E(em)}"><span>Email</span><b>{E(em)}</b></a>')
    if ind: rows.append(f'<a href="https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(d["nome"] + " " + ind)}" target="_blank" rel="noopener"><span>Sede</span><b>{E(ind)}</b></a>')
    q = urllib.parse.quote((d.get('indirizzo') or '') + ' ' + (d.get('comune') or '') + ' ' + d['prov'])
    mp = f'<div class="map rv"><iframe title="Mappa della sede" loading="lazy" src="https://maps.google.com/maps?q={q}&z=14&output=embed"></iframe></div>' if ind else ''
    srv_opts = ''.join(f'<option>{E(s)}</option>' for s in d['servizi'][:8]) + '<option>Altro</option>'
    h2 = {'T': 'Parliamo del <em>vostro</em> servizio.', 'I': 'Un preventivo, <em>senza giri</em>.', 'X': 'Chiamate. <em>Arriviamo.</em>'}[arch]
    return f'''<section class="sec" id="contatti" style="background:var(--bg2)"><div class="wrap ct">
<div><p class="eye rv"><i></i>Contatti</p><h2 class="h-l rv" style="margin-top:22px">{h2}</h2>
<p class="lead muted rv" style="margin-top:24px">Enti, aziende e privati: indicateci il servizio e la zona, vi rispondiamo con tempi e preventivo.</p>
<div class="ct__list rv">{''.join(rows)}</div>{mp}</div>
<form class="form rv" novalidate><div class="row2"><label>Nome e cognome<input name="n" autocomplete="name"></label><label>Ente o azienda<input name="a" autocomplete="organization"></label></div>
<div class="row2"><label>Email<input name="e" type="email" autocomplete="email"></label><label>Telefono<input name="t" type="tel" autocomplete="tel"></label></div>
<label>Servizio<select name="s">{srv_opts}</select></label><label>Comune dell'intervento<input name="c"></label>
<label>Messaggio<textarea name="m" placeholder="Cosa serve, quantità indicative, tempi"></textarea></label>
<button class="btn btn--p" type="submit">Richiedi il preventivo {IC['ar']}</button>
<p class="form__ok">Anteprima: in produzione la richiesta arriva direttamente nella vostra casella email.</p>
<p class="form__demo">Modulo dimostrativo dell'anteprima.</p></form></div></section>'''

def join(d, P, arch):
    src = P.next(1000, 'camion'); fb = P.fb('camion')
    em = d.get('email')
    href = f'mailto:{E(em)}?subject=Candidatura' if em else '#contatti'
    return f'''<section class="sec" id="lavora" style="padding-top:0"><div class="wrap"><div class="join">{img(src, 'Mezzi e squadra di ' + d['nome'], fb, 'par')}
<div class="join__c"><p class="eye" style="color:rgba(255,255,255,.7)"><i></i>Lavora con noi</p><h2 class="h-m">Autisti, operatori, tecnici: <em>cerchiamo persone</em> che conoscono il territorio.</h2>
<p>Mandateci il vostro curriculum: lo leggiamo tutto, e vi richiamiamo.</p><div><a class="btn btn--p" href="{href}">Invia la candidatura {IC['ar']}</a></div></div></div></div></section>'''

def umbra(d):
    return f'''<section class="ub" aria-label="Anteprima Umbra"><div class="wrap ub__in"><div>
<p class="ub__k">Anteprima riservata · preparata per {E(d['nome'])}</p>
<h2>Questo è il vostro sito, <em>se lo volete.</em></h2>
<p>Abbiamo usato le foto e le informazioni già pubbliche dell'azienda. L'anteprima è gratuita: se vi piace, acconto del 25% e saldo quando il sito è online, con rimborso completo entro 30 giorni dalla messa online. Hosting, dominio, privacy e cookie li gestiamo noi.</p></div>
<div><div class="ub__b"><a class="btn btn--p" href="https://wa.me/{UMBRA_WA}?text={urllib.parse.quote('Ciao, ho visto l anteprima del sito per ' + d['nome'])}" target="_blank" rel="noopener">{IC['wa']} Scrivici su WhatsApp</a>
<a class="btn btn--g" href="mailto:info@umbragency.it?subject={urllib.parse.quote('Anteprima sito ' + d['nome'])}">info@umbragency.it</a></div>
<p style="margin-top:22px"><span class="ub__logo">umbra<sup>®</sup></span> &nbsp;studio web · umbragency.it</p></div></div></section>'''

def footer(d):
    srv = ''.join(f'<li>{E(s)}</li>' for s in d['servizi'][:6])
    rs = d.get('ragione_sociale') or d['nome']; piva = d.get('piva')
    ind = ', '.join(x for x in [d.get('indirizzo'), d.get('comune'), d['prov']] if x)
    soc = []
    s = d.get('social') or {}
    if isinstance(s, dict):
        for k in ('facebook', 'instagram', 'linkedin'):
            if s.get(k): soc.append(f'<li><a href="{E(s[k])}" target="_blank" rel="noopener">{k.capitalize()}</a></li>')
    elif isinstance(s, list):
        for u in s:
            if isinstance(u, str) and u.startswith('http'):
                k = 'Facebook' if 'facebook' in u else 'Instagram' if 'instagram' in u else 'LinkedIn' if 'linkedin' in u else 'Social'
                soc.append(f'<li><a href="{E(u)}" target="_blank" rel="noopener">{k}</a></li>')
    tel = d.get('telefono'); em = d.get('email')
    short = re.sub(r'\b(s\.?r\.?l\.?|s\.?p\.?a\.?|s\.?n\.?c\.?|s\.?a\.?s\.?)\b\.?', '', d['nome'], flags=re.I).strip(' .,-')
    return f'''<footer class="ft"><div class="wrap"><div class="ft__g">
<div><b>{E(rs)}</b><p>{E(ind)}</p>{f'<p>P.IVA {E(piva)}</p>' if piva else ''}</div>
<div><b>Servizi</b><ul>{srv}</ul></div>
<div><b>Contatti</b><ul>{f'<li><a href="{tel_href(tel)}">{E(tel)}</a></li>' if tel else ''}{f'<li><a href="mailto:{E(em)}">{E(em)}</a></li>' if em else ''}</ul></div>
<div><b>Seguici</b><ul>{''.join(soc) or '<li>—</li>'}</ul></div></div>
<div class="ft__name" aria-hidden="true" style="font-size:clamp(34px,{min(11, round(150 / max(6, len(short)), 2))}vw,190px)">{E(short)}</div>
<div class="ft__bot"><span>© 2026 {E(rs)}{f' · P.IVA {E(piva)}' if piva else ''}</span><span>Privacy · Cookie</span><span>Anteprima realizzata da Umbra Agency</span></div></div></footer>'''

def fab(d):
    tel = d.get('telefono')
    if not tel: return ''
    return f'<div class="fab"><a href="{tel_href(tel)}">{IC["ph"]} Chiama</a></div>'

# ---------------------------------------------------------------- architetture
SPEC = [
 (r'tubaz|tubatur|guasti|perdit', 'Ricerca guasti e interventi su tubazioni e scarichi, anche interrati.'),
 (r'bagni|wc chimic|servizi igienic', 'Noleggio e manutenzione di bagni chimici per cantieri ed eventi.'),
 (r'oli usat|olio', 'Ritiro di oli usati e lubrificanti esausti, con avvio a rigenerazione.'),
 (r'metall|ferros|rottam', 'Ritiro e recupero di metalli ferrosi e non ferrosi.'),
 (r'carta|cartone', 'Raccolta e recupero di carta e cartone.'),
 (r'legno', 'Recupero del legno da imballaggi, cantieri e manutenzioni.'),
 (r'analisi|laborator|campionam', 'Analisi e caratterizzazione dei rifiuti in laboratorio.'),
 (r'video|telecamer', 'Ispezione delle condotte con telecamera: si vede il problema prima di scavare.'),
 (r'amianto|eternit', 'Rimozione di coperture e manufatti in amianto con piano di lavoro, confinamento e smaltimento autorizzato.'),
 (r'disostruz|sturat|sgorg', 'Disostruzione di scarichi e tubazioni con attrezzature ad alta pressione.'),
 (r'fosse|biologic|pozzi neri|degrassat|imhoff', 'Svuotamento e pulizia di fosse biologiche, Imhoff e degrassatori.'),
 (r'idrodinam|alta pressione|lavaggio condott|pulizia condott|fognatur|reti fognar', 'Pulizia di reti e condotte con getto ad alta pressione e aspirazione.'),
 (r'cassoni|scarrabil|container|press', 'Cassoni e container posizionati dove servono e ritirati pieni, con trasporto all\'impianto.'),
 (r'pericolos', 'Gestione dei rifiuti pericolosi con mezzi e imballaggi a norma, dalla classificazione allo smaltimento.'),
 (r'speciali', 'Ritiro e trasporto di rifiuti speciali da aziende e cantieri, con formulario e impianto di destinazione autorizzato.'),
 (r'urbani|porta a porta|differenziat|igiene urbana', 'Raccolta dei rifiuti urbani e differenziati per comuni e consorzi.'),
 (r'spazzament|pulizia strad|spazzatric|piazzal', 'Pulizia di strade, piazzali e aree pubbliche con spazzatrici e operatori.'),
 (r'neve|sgombero', 'Sgombero neve e trattamento antighiaccio su strade e piazzali.'),
 (r'demoliz', 'Demolizioni con separazione dei materiali e avvio a recupero degli inerti.'),
 (r'inert|macerie|frantum', 'Recupero e lavorazione degli inerti, che tornano utilizzabili in edilizia.'),
 (r'bonific', 'Bonifiche con piano di intervento, messa in sicurezza dell\'area e smaltimento autorizzato.'),
 (r'selezion|recuper|riciclo|riciclag', 'Selezione dei materiali e avvio a recupero, perché tornino risorse.'),
 (r'intermediaz|commercio', 'Intermediazione: troviamo l\'impianto giusto per ogni rifiuto, con tutti i documenti.'),
 (r'consulen|mud|registr|adr|pratich', 'Pratiche, registri e adempimenti ambientali seguiti per conto del cliente.'),
 (r'disinfest|derattizz|zanzar', 'Disinfestazioni e derattizzazioni programmate per enti, aziende e condomini.'),
 (r'sanificaz|pulizi', 'Pulizie e sanificazioni di ambienti e impianti, con prodotti e procedure certificati.'),
 (r'verde|sfalci|potatur', 'Manutenzione del verde e gestione degli sfalci.'),
 (r'noleggio', 'Noleggio di mezzi e attrezzature, con o senza operatore.'),
 (r'trasport', 'Trasporto conto terzi con mezzi autorizzati all\'Albo Gestori Ambientali.'),
 (r'serbatoi|cisterne', 'Bonifica e pulizia di serbatoi e cisterne.'),
]
def services_list(d):
    out = []
    for s in d['servizi'] or ['Servizi ambientali']:
        sec = sector_of(s); desc = None
        for rx, dd in SPEC:
            if re.search(rx, s.lower()): desc = dd; break
        sec1 = sector_of1(s) or d['sector']
        out.append((s, desc or SERV_DESC.get(sec1, SERV_DESC['raccolta']), sec1))
    return out

def cycle_for(d): return CYCLE.get(d['sector'], CYCLE_DEFAULT)

def arch_T(d, P):
    hsrc, own = P.hero()
    title = hero_title(d, 'T'); st = stats(d)
    eye = ' <i></i> '.join(E(x) for x in [d['servizi'][0] if d['servizi'] else 'Servizi ambientali', d.get('comune'), f"dal {d['anno']}" if d['anno'] else d['provn']] if x)
    stats_h = ''.join(f'<div class="stat"><b>{stat_html(ds, v)}</b><span>{E(l)}</span></div>' for ds, v, l in st[:3])
    sub = E(d.get('claim') or f"{d['nome']}: {', '.join(d['servizi'][:3]).lower()}.")
    hero = f'''<section class="heroT" id="top"><div class="heroT__fallback">{img(hsrc, d['nome'], stock('territorio', 1), eager=True)}</div><div class="heroT__veil"></div>
<div class="heroT__geo">{E((d.get('comune') or '').upper())}{' · ' + E(d['prov']) if d['prov'] else ''}<br><b>●</b> {E(d.get('regione') or '')}</div>
<div class="heroT__c wrap"><div class="heroT__grid"><div><p class="eye ln"><span>{eye}</span></p><h1 class="h-xl">{''.join(f'<span class="ln"><span>{x}</span></span>' for x in title)}</h1>
<div class="heroT__side rv"><p>{sub}</p><div class="heroT__ctas"><a class="btn btn--p" href="#contatti">Richiedi un preventivo {IC['ar']}</a><a class="btn btn--g" href="#servizi">I servizi</a></div></div></div>
<figure class="heroT__card rv" style="margin:0"><img src="{E(hsrc)}" data-fb="{E(stock('territorio', 1))}" alt="{E(d['nome'])}" fetchpriority="high"><figcaption><b>●</b> {E(d.get('comune') or '')}{(' · dal ' + str(d['anno'])) if d['anno'] else ''}</figcaption></figure></div>
{f'<div class="heroT__stats rv">{stats_h}</div>' if stats_h else ''}</div></section>'''
    man = f'''<section class="sec" id="azienda"><div class="wrap manT"><div><p class="eye rv"><i></i>L'azienda</p><p class="say" style="margin-top:30px">{say_text(d)}</p></div>
<div class="manT__ph img-rv">{img(P.next(800), 'Attività di ' + d['nome'], P.fb())}</div></div></section>'''
    cards = ''
    for i, (s, desc, sec) in enumerate(services_list(d)):
        cards += f'''<article class="hs__card">{img(P.next(700, STOCK_FOR.get(sec)), s, P.fb(STOCK_FOR.get(sec)))}<div class="hs__txt"><span class="n">{i + 1:02d}</span><h3 class="h-s">{E(s)}</h3><p>{E(desc)}</p></div></article>'''
    n = len(services_list(d))
    hs = f'''<section class="hs" id="servizi"><div class="hs__pin"><div class="wrap hs__top"><div><p class="eye rv"><i></i>Servizi</p><h2 class="h-l rv" style="margin-top:20px">Cosa facciamo, <em>per esteso</em>.</h2></div>
<p class="hs__count"><b>01</b> / {n:02d}</p></div><div class="hs__track">{cards}<div class="hs__end"><h3 class="h-m">Un solo referente per <em>tutto il servizio</em>.</h3><a class="btn btn--p" href="#contatti">Parliamone {IC['ar']}</a></div></div></div></section>'''
    cyc = cycle_for(d); import math
    R = 220; C = 300
    nodes = ''.join(f'<g class="cyc__dot"><circle cx="{C + R * math.cos(-math.pi / 2 + i * 2 * math.pi / len(cyc)):.1f}" cy="{C + R * math.sin(-math.pi / 2 + i * 2 * math.pi / len(cyc)):.1f}" r="7"/></g>' for i in range(len(cyc)))
    its = ''.join(f'<div class="cyc__it" data-t="{E(t)}"><span class="n">{i + 1:02d}</span><div><h3 class="h-s">{E(t)}</h3><p>{E(p)}</p></div></div>' for i, (t, p) in enumerate(cyc))
    cycs = f'''<section class="sec" id="metodo" style="background:var(--bg2)"><div class="wrap"><div class="sec-h"><div><p class="eye rv"><i></i>Il metodo</p><h2 class="h-l rv" style="margin-top:20px">Un ciclo <em>chiuso</em>, passo per passo.</h2></div>
<p class="lead muted rv">Ogni intervento segue lo stesso percorso: tracciabile, documentato, senza passaggi lasciati al caso.</p></div>
<div class="cyc"><div class="cyc__svg"><svg viewBox="0 0 600 600" aria-hidden="true"><circle cx="300" cy="300" r="{R}" fill="none" stroke="var(--line)" stroke-width="1.5"/>
<circle class="cyc__path" cx="300" cy="300" r="{R}" fill="none" stroke="var(--acc)" stroke-width="2.5" transform="rotate(-90 300 300)" stroke-linecap="round"/>
<circle cx="300" cy="300" r="150" fill="none" stroke="var(--line)" stroke-dasharray="2 8"/>{nodes}</svg>
<div class="cyc__mid"><div><span>fase</span><b>{E(cyc[0][0])}</b></div></div></div><div class="cyc__list">{its}</div></div></div></section>
<style>.cyc__dot circle{{fill:var(--bg2);stroke:var(--mute);stroke-width:2;transition:.5s}}.cyc__dot.on circle{{fill:var(--acc);stroke:var(--acc)}}</style>'''
    open_t = d.get('claim') or f"{d['nome']}, {d.get('comune') or d['provn']}."
    opn = f'''<section class="open"><div class="open__pin"><div class="open__ph">{img(P.next(1200, 'notte'), d['nome'], P.fb('notte'))}</div>
<div class="open__t"><p class="eye" style="justify-content:center;color:rgba(255,255,255,.75)">{E(d.get('comune') or '')}{' · ' + E(d['provn']) if d['provn'] else ''}</p><h2 class="h-l">{E(open_t)}</h2></div></div></section>'''
    certs = ''
    if d['cert']:
        cc = ''.join(f'<div class="cert rv">{IC["cert"]}<div><b>{E(cert_info(c)[0])}</b><span>{E(cert_info(c)[1])}</span></div></div>' for c in d['cert'])
        certs = f'''<section class="sec" id="certificazioni"><div class="wrap"><div class="sec-h"><div><p class="eye rv"><i></i>Certificazioni</p><h2 class="h-l rv" style="margin-top:20px">Le carte <em>in regola</em>.</h2></div>
<p class="lead muted rv">Le certificazioni e le iscrizioni dichiarate dall'azienda, in chiaro, dove un ufficio acquisti le cerca.</p></div><div class="certs">{cc}</div></div></section>'''
    order = [man, hs, cycs, opn, certs, join(d, P, 'T')]
    if int(hashlib.md5(d['slug'].encode()).hexdigest(), 16) % 2: order = [man, hs, opn, cycs, certs, join(d, P, 'T')]
    return hero + ''.join(order)

def arch_I(d, P):
    hsrc, own = P.hero()
    title = hero_title(d, 'I'); st = stats(d)
    eye = ' <i></i> '.join(E(x) for x in [d.get('comune'), d['provn'], f"dal {d['anno']}" if d['anno'] else None] if x)
    cards = ''.join(f'<div class="tcard"><b>{stat_html(ds, v)}</b><span>{E(l)}</span></div>' for ds, v, l in st[:3])
    sub = E(d.get('claim') or f"{', '.join(d['servizi'][:3])}.")
    hero = f'''<section class="heroI" id="top"><div class="wrap heroI__top"><div><p class="eye ln"><span>{eye}</span></p><h1 class="h-xl" style="margin-top:22px">{''.join(f'<span class="ln"><span>{x}</span></span>' for x in title)}</h1></div>
<div class="rv"><p>{sub}</p><a class="btn btn--p" href="#contatti">Richiedi un preventivo {IC['ar']}</a></div></div>
<div class="heroI__frame"><div class="heroI__stick"><div class="heroI__ph"><img src="{E(hsrc)}" data-fb="{E(stock('territorio', 2))}" alt="{E(d['nome'])}" fetchpriority="high"></div>
{f'<div class="heroI__cards">{cards}</div>' if cards else ''}</div></div></section>'''
    story = ''
    if d['anno']:
        gen = d.get('gen')
        items = [(d['anno'], f"Nasce {E(d['nome'])} a {E(d.get('comune') or d['provn'])}.")]
        if gen and isinstance(gen, str) and len(gen) < 140: items.append(('Famiglia', E(gen[0].upper() + gen[1:]) + ('' if gen.endswith('.') else '.')))
        if d['cert']: items.append(('Qualità', f"{len(d['cert'])} certificazioni e iscrizioni: {E(', '.join(cert_info(c)[0] for c in d['cert'][:4]))}."))
        items.append(('Oggi', E(', '.join(d['servizi'][:4])) + '.'))
        tl = ''.join(f'<div class="tl__it rv"><b>{E(a)}</b><p>{b}</p></div>' for a, b in items)
        story = f'''<section class="sec" id="azienda"><div class="wrap story"><div><p class="eye rv"><i></i>La storia</p><h2 class="h-l rv" style="margin-top:22px"><em>{2026 - d['anno']} anni</em> sullo stesso territorio.</h2>
<div class="img-rv ph" style="aspect-ratio:4/3;border-radius:12px;margin-top:44px">{img_tag(P.next(800), d['nome'], P.fb())}</div></div><div class="tl">{tl}</div></div></section>'''
    else:
        story = f'''<section class="sec" id="azienda"><div class="wrap story"><div><p class="eye rv"><i></i>L'azienda</p><p class="say" style="margin-top:26px;font-family:var(--f-disp);font-weight:350">{say_text(d)}</p></div>
<div class="img-rv ph" style="aspect-ratio:4/5;border-radius:12px">{img_tag(P.next(800), d['nome'], P.fb())}</div></div></section>'''
    rows = ''
    for i, (s, desc, sec) in enumerate(services_list(d)):
        src = P.next(700, STOCK_FOR.get(sec)); fb = P.fb(STOCK_FOR.get(sec))
        rows += f'''<div class="idx__row rv" data-img="{E(src)}" data-fb="{E(fb)}"><span class="n">{i + 1:02d}</span><h3>{E(s)}</h3><p>{E(desc)}</p><span class="ar">{IC['ar']}</span>{img(src, s, fb, 'idx__img')}</div>'''
    idx = f'''<section class="sec" id="servizi" style="background:var(--bg3)"><div class="wrap"><div class="sec-h"><div><p class="eye rv"><i></i>Servizi</p><h2 class="h-l rv" style="margin-top:20px">Tutto il servizio, <em>un interlocutore</em>.</h2></div>
<p class="lead muted rv">Per comuni, aziende e privati di {E(d['provn'] or d.get('comune') or 'tutta la zona')}.</p></div><div class="idx">{rows}</div></div>
<div class="cursor-ph" aria-hidden="true"><img alt=""></div></section>'''
    cyc = cycle_for(d)
    phs = ''.join(f'<img src="{E(P.next(900))}" data-fb="{E(P.fb())}" alt="" class="{"on" if i == 0 else ""}">' for i in range(len(cyc)))
    steps = ''.join(f'<div class="meth__step" data-i="{i}"><p class="n">Fase {i + 1:02d}</p><h3 class="h-m">{E(t)}</h3><p>{E(p)}</p></div>' for i, (t, p) in enumerate(cyc))
    meth = f'''<section class="sec" id="metodo"><div class="wrap"><p class="eye rv"><i></i>Come lavoriamo</p><h2 class="h-l rv" style="margin:20px 0 40px;max-width:14ch">Ogni passaggio, <em>tracciato</em>.</h2>
<div class="meth"><div class="meth__ph">{phs}</div><div>{steps}</div></div></div></section>'''
    seals = ''
    if d['cert']:
        ss = ''.join(f'<div class="seal rv"><i>{IC['cert']}</i><div><b>{E(cert_info(c)[0])}</b><span>{E(cert_info(c)[1])}</span></div></div>' for c in d['cert'])
        seals = f'''<section class="sec" id="certificazioni" style="padding-top:0"><div class="wrap"><div class="sec-h"><h2 class="h-m rv">Certificazioni e <em>iscrizioni</em></h2><p class="muted rv">Dichiarate dall'azienda e consultabili su richiesta.</p></div><div class="seals">{ss}</div></div></section>'''
    gal = ''
    if P.own_count() >= 3:
        g = ''.join(f'<div class="ph g{i + 1} par img-rv"><img src="{E(P.next(600))}" data-fb="{E(P.fb())}" alt="{E(d["nome"])}" loading="lazy"></div>' for i in range(4))
        gal = f'<section class="sec" style="padding-top:0"><div class="wrap"><div class="gal">{g}</div></div></section>'
    return hero + story + idx + meth + seals + gal + join(d, P, 'I')

def arch_X(d, P):
    hsrc, own = P.hero()
    title = hero_title(d, 'X'); st = stats(d)
    tick = ''.join(f'<span>{E(s)}</span>' for s in (d['servizi'] or ['Servizi ambientali'])) * 2
    hero = f'''<section class="heroX hero-dark" id="top"><div class="heroX__bg"><img src="{E(hsrc)}" data-fb="{E(stock('notte', 1))}" alt="{E(d['nome'])}" fetchpriority="high"></div>
<div class="heroX__tag">{E(d['nome'].upper())}<br>{E((d.get('comune') or '').upper())} · {E(d['prov'])}{('<br>EST. ' + str(d['anno'])) if d['anno'] else ''}</div>
<div class="heroX__c wrap"><p class="eye ln" style="color:rgba(255,255,255,.65)"><span>{E(d['provn'] or d.get('regione') or '')} <i></i> {E(d['servizi'][0] if d['servizi'] else 'Ambiente')}</span></p>
<h1 class="h-xl">{''.join(f'<span class="ln"><span>{x}</span></span>' for x in title)}</h1>
<div class="heroX__meta rv"><p>{E(d.get('claim') or ', '.join(d['servizi'][:3]))}</p><div class="heroX__ctas"><a class="btn btn--p" href="#contatti">Preventivo {IC['ar']}</a>{f'<a class="btn btn--g" href="{tel_href(d.get("telefono"))}">{E(d.get("telefono"))}</a>' if d.get('telefono') else ''}</div></div></div>
<div class="tick" aria-hidden="true"><div class="tick__in">{tick}</div></div></section>'''
    big = ''
    if st:
        bb = ''.join(f'<div class="big__it rv"><b>{stat_html(ds, v)}</b><span>{E(l)}</span></div>' for ds, v, l in st[:3])
        big = f'''<section class="sec" id="azienda"><div class="wrap"><p class="eye rv"><i></i>{E(d['nome'])} in numeri</p><h2 class="h-m rv" style="margin:22px 0 60px;max-width:22ch">{E(d.get('claim') or 'Numeri dichiarati, non promesse.')}</h2>
<div class="big" style="--cols:{len(st[:3])}">{bb}</div></div></section>'''
    sl = services_list(d)[:8]
    bx = ''
    for i, (s, desc, sec) in enumerate(sl):
        bx += f'<article class="bx">{img(P.next(700, STOCK_FOR.get(sec)), s, P.fb(STOCK_FOR.get(sec)))}<div class="bx__t"><span class="n">{i + 1:02d} / {len(sl):02d}</span><h3>{E(s)}</h3><p>{E(desc)}</p></div></article>'
    bento = f'''<section class="sec" id="servizi" style="padding-top:0"><div class="wrap"><div class="sec-h"><h2 class="h-l rv">Servizi <em>operativi</em></h2><p class="lead muted rv">Mezzi propri, personale formato, documenti in ordine. Dalla chiamata al formulario.</p></div>
<div class="bento n{len(sl)}">{bx}</div></div></section>'''
    cyc = cycle_for(d)
    pr = ''.join(f'<div class="proc__st"><span class="n">{i + 1:02d}</span><h3>{E(t)}</h3><p>{E(p)}</p></div>' for i, (t, p) in enumerate(cyc))
    proc = f'''<section class="sec" id="metodo" style="background:var(--bg2)"><div class="wrap"><p class="eye rv"><i></i>Procedura</p><h2 class="h-l rv" style="margin:20px 0 70px">Cinque passaggi. <em>Zero sorprese.</em></h2>
<div class="proc" style="--steps:{len(cyc)}"><div class="proc__line"><i></i></div>{pr}</div></div></section>'''
    strip = ''
    if P.own_count() >= 3:
        figs = ''
        for _ in range(min(6, max(3, P.own_count()))):
            figs += f'<figure>{img(P.next(500), d["nome"], P.fb(), ar="4/3")}<figcaption>{E(d["nome"])}</figcaption></figure>'
        strip = f'''<section class="sec" id="flotta" style="padding-bottom:60px"><div class="wrap"><div class="sec-h"><h2 class="h-l rv">Sul <em>campo</em></h2><p class="muted rv">Trascinate per scorrere.</p></div></div><div class="strip">{figs}</div></section>'''
    cl = ''
    if d['cert']:
        rows = ''.join(f'<div class="rv"><b>{E(cert_info(c)[0])}</b><span>{E(cert_info(c)[1])}</span></div>' for c in d['cert'])
        cl = f'''<section class="sec" id="certificazioni" style="padding-top:60px"><div class="wrap" style="display:grid;gap:40px;grid-template-columns:repeat(auto-fit,minmax(300px,1fr))"><div><p class="eye rv"><i></i>Conformità</p><h2 class="h-m rv" style="margin-top:20px">Certificati <em>e iscrizioni</em></h2></div><div class="clist">{rows}</div></div></section>'''
    return hero + big + bento + proc + strip + cl + join(d, P, 'X')

FONTS = {
 'T': 'family=Inter+Tight:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400',
 'I': 'family=Fraunces:ital,opsz,wght,SOFT@0,9..144,300..600,0..100;1,9..144,300..500,0..100&family=Figtree:wght@400;500;600;700&family=Instrument+Serif:ital@1&family=Inter+Tight:wght@500;700',
 'X': 'family=Archivo:wdth,wght@62..125,400..900&family=JetBrains+Mono:wght@400;500&family=Instrument+Serif:ital@1&family=Inter+Tight:wght@500;700',
}

def choose_arch(d, P):
    if d.get('stile') in ('T', 'I', 'X'): return d['stile']
    h = int(hashlib.md5(d['slug'].encode()).hexdigest(), 16)
    a = ['T', 'I', 'X'][h % 3]
    if d['anno'] and d['anno'] < 1985 and h % 2: a = 'I'
    if a == 'X' and not P.big(1300): a = 'T' if h % 2 else 'I'
    return a

def brand_color(slug, files):
    from PIL import Image
    from collections import Counter
    import colorsys as cs
    for f, weight_min in files:
        fp = os.path.join(ROOT, slug, f)
        if not os.path.exists(fp): continue
        try:
            im = Image.open(fp).convert('RGBA'); im.thumbnail((160, 160))
            c = Counter()
            for r, g, b, a in im.getdata():
                if a < 200: continue
                h, l, s = cs.rgb_to_hls(r / 255, g / 255, b / 255)
                if s < .38 or l < .16 or l > .86: continue
                c[(round(h * 24) % 24)] += 1
            tot = im.size[0] * im.size[1]
            if not c: continue
            hb, n = c.most_common(1)[0]
            if n / tot < weight_min: continue
            px = [(r, g, b) for r, g, b, a in im.getdata() if a >= 200]
            sel = [p for p in px if (lambda h, l, s: s >= .38 and .16 <= l <= .86 and round(h * 24) % 24 == hb)(*cs.rgb_to_hls(p[0] / 255, p[1] / 255, p[2] / 255))]
            r = sum(p[0] for p in sel) / len(sel); g = sum(p[1] for p in sel) / len(sel); b = sum(p[2] for p in sel) / len(sel)
            return '#%02x%02x%02x' % (int(r), int(g), int(b)), f
        except Exception:
            continue
    return None, None

def build(L, rep):
    d = norm(L); P = Photos(d, rep)
    arch = choose_arch(d, P); d['_arch'] = arch
    dark = arch in ('T', 'X')
    base = pick_accent(d.get('colori_brand'))
    src = 'sito'
    if base is None:
        files = [('m/logo.png', .04)] + [(x['src'], .12) for x in P.items[:4]]
        hx, src = brand_color(d['slug'], files)
        base = hrgb(hx) if hx else None
    d['_colsrc'] = src if base else 'default'
    if base is None:
        pal = ['#2f8f6a', '#1f6fa8', '#e07b24', '#3c8d3a', '#0f7c86', '#c8a12a', '#5a7f2b', '#2a5f9e']
        base = hrgb(pal[int(hashlib.md5(d['slug'].encode()).hexdigest(), 16) % len(pal)])
    acc, acct, on = tone_accent(base, dark)
    nav_items = [('azienda', 'Azienda'), ('servizi', 'Servizi'), ('metodo', 'Metodo')]
    if d['cert']: nav_items.append(('certificazioni', 'Certificazioni'))
    nav_items.append(('lavora', 'Lavora con noi'))
    d['_nav'] = nav_items
    body = {'T': arch_T, 'I': arch_I, 'X': arch_X}[arch](d, P)
    seed = int(hashlib.md5(d['slug'].encode()).hexdigest(), 16) % 90 + 3
    title = f"{d['nome']} · {', '.join(d['servizi'][:2]) or 'Servizi ambientali'} · {d.get('comune') or ''}"
    desc = d.get('claim') or f"{d['nome']}: {', '.join(d['servizi'][:4])}. {d.get('comune') or ''} ({d['prov']})."
    libs = '<script src="../_assets/v/gsap.min.js" defer></script><script src="../_assets/v/ScrollTrigger.min.js" defer></script><script src="../_assets/v/lenis.min.js" defer></script>'
    if arch in ('T', 'X'): libs += '<script src="../_assets/v/three.min.js" defer></script>'
    page = f'''<!doctype html><html lang="it" class="a-{arch}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{E(title)}</title><meta name="description" content="{E(desc[:160])}"><meta name="robots" content="noindex,nofollow">
<meta property="og:title" content="{E(d['nome'])} · anteprima del nuovo sito"><meta property="og:description" content="{E(desc[:160])}">
<meta name="theme-color" content="{'#0b0f12' if arch == 'T' else '#0d0d0c' if arch == 'X' else '#f3f1ec'}">
<link rel="stylesheet" href="../_assets/amb.css?v={V}">
<style>:root{{--acc:{acc};--acc-text:{acct};--on-acc:{on}}}</style>
<script>(function(){{var h=document.documentElement;h.classList.add('js');try{{if(matchMedia('(prefers-reduced-motion: reduce)').matches)h.classList.add('rm');if(/[?&]intro=0/.test(location.search)||sessionStorage.getItem('amb-intro')==='1')h.classList.add('no-intro')}}catch(e){{}}setTimeout(function(){{if(!h.classList.contains('ok'))h.classList.remove('js')}},4000)}})();window.AZ={{acc:"{acc}",seed:{seed}}};</script>
{libs}<script src="../_assets/amb.js?v={V}" defer></script></head>
<body class="{'hero-dark' if dark else ''}">
<div class="intro" id="intro" role="dialog" aria-label="Anteprima preparata da Umbra"><div><div class="intro__ec"></div><p class="intro__k">Anteprima riservata</p>
<p class="intro__t">Il nuovo sito di <em>{E(d['nome'])}</em></p><p class="intro__by"><b>umbra®</b> studio web</p></div><div class="intro__bar"><i></i></div></div>
{nav(d, P, arch, dark)}<main>{body}{contacts(d, arch)}</main>{umbra(d)}{footer(d)}{fab(d)}</body></html>'''
    out = os.path.join(ROOT, d['slug']); os.makedirs(out, exist_ok=True)
    open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(page)
    return {'slug': d['slug'], 'arch': arch, 'acc': acc, 'colsrc': d['_colsrc'], 'foto_proprie': P.own_count(), 'logo': bool(P.logo), 'sector': d['sector']}

if __name__ == '__main__':
    leads = json.load(open(sys.argv[1], encoding='utf-8'))
    rep_p = os.path.join(ROOT, '_media_report.json')
    rep = json.load(open(rep_p)) if os.path.exists(rep_p) else {}
    if '--media-only' in sys.argv:
        rows = []; sites = []
        for L in leads:
            n = norm(L); rows += media_plan(n)
            if isinstance(n.get('sito'), str) and n['sito'].startswith('http'): sites.append((n['slug'], n['sito'].split(' ')[0]))
        with open(os.path.join(ROOT, '_sites.tsv'), 'w', encoding='utf-8') as f:
            f.write('# slug\tsito\n')
            for s, u in sites: f.write(f'{s}\t{u}\n')
        with open(os.path.join(ROOT, '_media.tsv'), 'w', encoding='utf-8') as f:
            f.write('# url\tpercorso\n')
            for u, r in rows: f.write(f'{u}\t{r}\n')
        print('righe media', len(rows)); sys.exit()
    res = [build(L, rep) for L in leads]
    json.dump(res, open(os.path.join(ROOT, '_build.json'), 'w'), indent=1)
    from collections import Counter
    print(len(res), Counter(r['arch'] for r in res))
