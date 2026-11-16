#!/usr/bin/env python3
"""Scarica e ottimizza le foto elencate in ambiente/_media.tsv.
Formato riga: <url>\t<percorso relativo a ambiente/>  (es. foo/m/3.jpg)
Salta i file già presenti. Scrive ambiente/_media_report.json con dimensioni ed esiti."""
import io, json, os, sys, time, urllib.request, ssl
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
TSV = os.path.join(ROOT, '_media.tsv')
REP = os.path.join(ROOT, '_media_report.json')
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0 Safari/537.36')
ctx = ssl.create_default_context(); ctx.check_hostname = False; ctx.verify_mode = ssl.CERT_NONE

report = {}
if os.path.exists(REP):
    try: report = json.load(open(REP))
    except Exception: report = {}

def job(line):
    url, rel = line
    dest = os.path.join(ROOT, rel)
    if os.path.exists(dest) and rel in report and report[rel].get('ok'):
        return rel, report[rel]
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    last = ''
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8',
                                                        'Referer': '/'.join(url.split('/')[:3]) + '/'})
            data = urllib.request.urlopen(req, timeout=25, context=ctx).read()
            im = Image.open(io.BytesIO(data))
            im = ImageOps.exif_transpose(im)
            w0, h0 = im.size
            if w0 < 360 or h0 < 240:
                return rel, {'ok': False, 'err': f'troppo piccola {w0}x{h0}', 'url': url}
            png = rel.endswith('.png')
            if png:
                im = im.convert('RGBA')
                im.thumbnail((900, 900))
                im.save(dest, 'PNG', optimize=True)
            else:
                im = im.convert('RGB')
                im.thumbnail((2200, 2200), Image.LANCZOS)
                im.save(dest, 'JPEG', quality=80, optimize=True, progressive=True)
            w, h = im.size
            # luminosità media (per scegliere testo chiaro/scuro sopra)
            lum = sum(im.convert('L').resize((16, 16)).getdata()) / 256
            return rel, {'ok': True, 'w': w0, 'h': h0, 'sw': w, 'sh': h, 'lum': round(lum), 'kb': os.path.getsize(dest) // 1024, 'url': url}
        except Exception as e:
            last = str(e)[:140]
            time.sleep(1.5)
    return rel, {'ok': False, 'err': last, 'url': url}

lines = []
for ln in open(TSV, encoding='utf-8'):
    ln = ln.rstrip('\n')
    if not ln or ln.startswith('#'): continue
    u, r = ln.split('\t')[:2]
    lines.append((u.strip(), r.strip()))

with ThreadPoolExecutor(12) as ex:
    for rel, res in ex.map(job, lines):
        report[rel] = res
json.dump(report, open(REP, 'w'), indent=0, sort_keys=True)
ok = sum(1 for v in report.values() if v.get('ok'))
print(f'foto ok {ok} / {len(report)}')
