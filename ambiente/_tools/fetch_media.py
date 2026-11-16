#!/usr/bin/env python3
"""Scarica e ottimizza le foto per le demo ambiente (gira su GitHub Actions).
1) ambiente/_media.tsv : <url>\t<percorso relativo>  (foto indicate a mano)
2) ambiente/_sites.tsv : <slug>\t<sito>  -> legge home e pagine interne, prende le foto grandi e il logo
Salta ciò che è già scaricato. Scrive ambiente/_media_report.json."""
import io, json, os, re, ssl, time, urllib.request, urllib.parse, hashlib
from concurrent.futures import ThreadPoolExecutor
from html.parser import HTMLParser
from PIL import Image, ImageOps

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
REP = os.path.join(ROOT, '_media_report.json')
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE
report = {}
if os.path.exists(REP):
    try: report = json.load(open(REP))
    except Exception: report = {}

def get(url, timeout=25):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*', 'Accept-Language': 'it-IT,it;q=0.9',
                                               'Referer': '/'.join(url.split('/')[:3]) + '/'})
    r = urllib.request.urlopen(req, timeout=timeout, context=ctx)
    return r.read(), r.geturl()

def ahash(im):
    g = im.convert('L').resize((9, 8)); px = list(g.getdata())
    return ''.join('1' if px[r * 9 + c] > px[r * 9 + c + 1] else '0' for r in range(8) for c in range(8))

def save_img(data, dest, logo=False):
    im = Image.open(io.BytesIO(data)); im = ImageOps.exif_transpose(im); w0, h0 = im.size
    if logo:
        im = im.convert('RGBA'); im.thumbnail((800, 400)); im.save(dest, 'PNG', optimize=True)
    else:
        im = im.convert('RGB'); im.thumbnail((2200, 2200), Image.LANCZOS)
        im.save(dest, 'JPEG', quality=80, optimize=True, progressive=True)
    lum = sum(im.convert('L').resize((16, 16)).getdata()) / 256
    return {'ok': True, 'w': w0, 'h': h0, 'lum': round(lum), 'kb': os.path.getsize(dest) // 1024, 'hash': ahash(im)}

def job(line):
    url, rel = line
    dest = os.path.join(ROOT, rel)
    if os.path.exists(dest) and report.get(rel, {}).get('ok'): return rel, report[rel]
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    err = ''
    for _ in range(2):
        try:
            data, _u = get(url)
            im = Image.open(io.BytesIO(data)); w, h = im.size
            if w < 360 or h < 200: return rel, {'ok': False, 'err': f'piccola {w}x{h}', 'url': url}
            res = save_img(data, dest, rel.endswith('.png')); res['url'] = url; return rel, res
        except Exception as e:
            err = str(e)[:140]; time.sleep(1.2)
    return rel, {'ok': False, 'err': err, 'url': url}

# ---------------- scraping dei siti
class P(HTMLParser):
    def __init__(s): super().__init__(); s.imgs = []; s.links = []; s.logo = []
    def handle_starttag(s, tag, a):
        a = dict(a); low = ' '.join(str(v) for v in a.values()).lower()
        if tag == 'img':
            cands = []
            for k in ('data-src', 'data-lazy-src', 'data-original', 'src'):
                if a.get(k): cands.append(a[k])
            for k in ('srcset', 'data-srcset', 'data-lazy-srcset'):
                if a.get(k):
                    parts = [p.strip().split(' ') for p in a[k].split(',') if p.strip()]
                    def wv(p):
                        try: return int(re.sub(r'\D', '', p[1])) if len(p) > 1 else 0
                        except: return 0
                    parts.sort(key=wv, reverse=True)
                    if parts: cands.insert(0, parts[0][0])
            for c in cands[:2]:
                (s.logo if 'logo' in low else s.imgs).append(c)
        elif tag == 'meta' and a.get('property') in ('og:image', 'og:image:url') and a.get('content'):
            s.imgs.append(a['content'])
        elif tag == 'a' and a.get('href'): s.links.append(a['href'])
        elif tag == 'link' and 'icon' in (a.get('rel') or '') and a.get('href'): pass
        st = a.get('style') or ''
        for m in re.findall(r'url\(["\']?([^"\')]+)["\']?\)', st): s.imgs.append(m)

KW = re.compile(r'chi-?siamo|azienda|about|storia|servizi|mezzi|flotta|parco|automezzi|galler|foto|impiant|attrezzatur|lavori|cantier', re.I)
BAD = re.compile(r'logo|icon|favicon|sprite|banner-?cookie|flag|bandier|whatsapp|facebook|instagram|linkedin|youtube|placeholder|loader|spinner|pixel|captcha|map[s]?\.|marker|arrow|freccia|cert|iso-?\d|qrcode|avatar|\.svg|\.gif', re.I)
def norm_img(u):
    u = re.sub(r'-\d{2,4}x\d{2,4}(?=\.(jpe?g|png|webp)$)', '', u, flags=re.I)  # wordpress
    return u

def scrape(slug, site):
    found, logo = [], []
    try:
        html, base = get(site, 20); html = html.decode('utf-8', 'ignore')
    except Exception as e:
        return slug, [], [], str(e)[:100]
    pages = [(html, base)]
    p = P(); p.feed(html)
    host = urllib.parse.urlparse(base).netloc.replace('www.', '')
    inner = []
    for h in p.links:
        u = urllib.parse.urljoin(base, h)
        if urllib.parse.urlparse(u).netloc.replace('www.', '') == host and KW.search(u) and u not in inner and not re.search(r'\.(pdf|jpe?g|png|zip)$', u, re.I):
            inner.append(u)
    for u in inner[:6]:
        try:
            h2, b2 = get(u, 15); pages.append((h2.decode('utf-8', 'ignore'), b2))
        except Exception: pass
    for h, b in pages:
        pp = P(); pp.feed(h)
        for m in re.findall(r'url\(["\']?([^"\')]+\.(?:jpe?g|png|webp))', h, re.I): pp.imgs.append(m)
        for i in pp.imgs:
            u = urllib.parse.urljoin(b, i.strip())
            if not u.startswith('http') or BAD.search(u): continue
            if not re.search(r'\.(jpe?g|png|webp)(\?|$)', u, re.I) and 'og:image' not in u:
                if not re.search(r'jpe?g|png|webp', u, re.I): continue
            for c in (norm_img(u), u):
                if c not in found: found.append(c)
        for i in pp.logo:
            u = urllib.parse.urljoin(b, i.strip())
            if u.startswith('http') and u not in logo and not u.lower().endswith('.svg'): logo.append(u)
    return slug, found[:40], logo[:3], ''

def scrape_and_fetch(item):
    slug, site = item
    key = f'{slug}/_scrape'
    if report.get(key, {}).get('done'): return []
    s, imgs, logos, err = scrape(slug, site)
    out = [(key, {'done': True, 'n': len(imgs), 'err': err})]
    got, hashes = 0, set(v.get('hash') for k, v in report.items() if k.startswith(slug + '/m/') and v.get('ok'))
    os.makedirs(os.path.join(ROOT, slug, 'm'), exist_ok=True)
    for i, u in enumerate(imgs):
        if got >= 14: break
        rel = f'{slug}/m/s{i + 1}.jpg'; dest = os.path.join(ROOT, rel)
        try:
            data, _ = get(u, 20); im = Image.open(io.BytesIO(data)); w, h = im.size
            if w < 700 or h < 380 or w / h > 4 or h / w > 2.2: continue
            hh = ahash(ImageOps.exif_transpose(im))
            if hh in hashes: continue
            res = save_img(data, dest); res['url'] = u; res['scr'] = 1; hashes.add(res['hash'])
            out.append((rel, res)); got += 1
        except Exception: continue
    if not os.path.exists(os.path.join(ROOT, slug, 'm', 'logo.png')):
        for u in logos:
            try:
                data, _ = get(u, 15); im = Image.open(io.BytesIO(data))
                if im.size[0] < 60: continue
                rel = f'{slug}/m/logo.png'; res = save_img(data, os.path.join(ROOT, rel), True); res['url'] = u
                out.append((rel, res)); break
            except Exception: continue
    return out

lines = []
tsv = os.path.join(ROOT, '_media.tsv')
if os.path.exists(tsv):
    for ln in open(tsv, encoding='utf-8'):
        ln = ln.rstrip('\n')
        if ln and not ln.startswith('#') and '\t' in ln:
            u, r = ln.split('\t')[:2]; lines.append((u.strip(), r.strip()))
with ThreadPoolExecutor(12) as ex:
    for rel, res in ex.map(job, lines): report[rel] = res

sites = []
stsv = os.path.join(ROOT, '_sites.tsv')
if os.path.exists(stsv):
    for ln in open(stsv, encoding='utf-8'):
        ln = ln.rstrip('\n')
        if ln and not ln.startswith('#') and '\t' in ln:
            s, u = ln.split('\t')[:2]
            if u.startswith('http'): sites.append((s.strip(), u.strip()))
with ThreadPoolExecutor(10) as ex:
    for out in ex.map(scrape_and_fetch, sites):
        for rel, res in out: report[rel] = res

json.dump(report, open(REP, 'w'), indent=0, sort_keys=True)
ok = sum(1 for k, v in report.items() if v.get('ok'))
print(f'foto ok {ok}; siti {len(sites)}')
