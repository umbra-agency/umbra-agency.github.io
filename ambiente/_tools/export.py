#!/usr/bin/env python3
"""Foglio lead + email di outreach per le demo ambiente. Uso: python3 export.py leads.json out.xlsx out.csv"""
import json, sys, os, csv
sys.path.insert(0, os.path.dirname(__file__))
import build
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment
from openpyxl.utils import get_column_letter

BASE = 'https://umbra-agency.github.io/ambiente/'
STILE = {'T': 'Territorio (scuro, terreno 3D)', 'I': 'Istituzionale (chiaro, editoriale)', 'X': 'Industria (scuro, particelle 3D)'}

def email(d, link):
    g = (d.get('gancio') or '').strip()
    if g and not g.endswith('.'): g += '.'
    sub = f"{d['nome']}: anteprima del nuovo sito"
    body = f"""Buongiorno,

{g + chr(10) + chr(10) if g else ''}vi abbiamo preparato un'anteprima del sito nuovo di {d['nome']}, già costruita con i vostri servizi, le vostre certificazioni e le foto che avete pubblicato:
{link}

Per un'azienda come la vostra il sito non serve a fare traffico: è il primo controllo che fanno comuni, uffici acquisti e chi vi deve scegliere in un appalto, e il primo posto dove guarda un autista che cerca lavoro. Deve dire in dieci secondi chi siete, cosa fate e che siete in regola.

L'anteprima è gratuita. Se vi piace: acconto del 25%, saldo quando il sito è online, rimborso completo entro 30 giorni. Hosting, privacy e cookie li gestiamo noi.

Vi va di darci un'occhiata e dirmi cosa ne pensate?

Matteo
Umbra Agency · umbragency.it · WhatsApp +39 351 461 8847

Se non vi interessa basta rispondere "no" e non vi scrivo più."""
    return sub, body

def main(lp, xp, cp):
    leads = json.load(open(lp, encoding='utf-8'))
    res = {r['slug']: r for r in json.load(open(os.path.join(build.ROOT, '_build.json')))}
    rows = []
    for L in leads:
        d = build.norm(L); r = res.get(d['slug'], {})
        link = BASE + d['slug'] + '/'
        sub, body = email(d, link)
        rows.append({
            'Classe': d.get('classe'), 'Punteggio': d.get('punteggio'), 'Azienda': d['nome'], 'Ragione sociale': d.get('ragione_sociale'),
            'Regione': d.get('regione'), 'Prov.': d['prov'], 'Comune': d.get('comune'),
            'Email': d.get('email'), 'Fonte email': d.get('email_fonte') or d.get('fonte_email'), 'Telefono': d.get('telefono'), 'Sito attuale': d.get('sito'),
            'Stato sito': d.get('stato_sito'), 'Difetti sito': '; '.join(d.get('difetti_sito') or []) if isinstance(d.get('difetti_sito'), list) else d.get('difetti_sito'),
            'Settore': d['sector'], 'Dipendenti stimati': d.get('dipendenti_stimati'), 'Anno': d['anno'],
            'Certificazioni': ', '.join(d['cert']), 'Link demo': link, 'Stile demo': STILE.get(r.get('arch'), ''),
            'Foto proprie in demo': r.get('foto_proprie'), 'Logo': 'sì' if r.get('logo') else 'no',
            'Motivo classe': d.get('motivo_classe'), 'Oggetto email': sub, 'Testo email': body,
        })
    order = {'A': 0, 'B': 1, 'C': 2}
    rows.sort(key=lambda x: (order.get(str(x['Classe'])[:1], 3), -(x['Punteggio'] or 0)))
    wb = Workbook(); ws = wb.active; ws.title = 'Lead ambiente Nord Est'
    cols = list(rows[0].keys()); ws.append(cols)
    for r in rows: ws.append([r[c] for c in cols])
    hdr = PatternFill('solid', fgColor='111111')
    for c in ws[1]: c.font = Font(bold=True, color='FFFFFF'); c.fill = hdr; c.alignment = Alignment(vertical='center', wrap_text=True)
    widths = {'Azienda': 30, 'Ragione sociale': 30, 'Email': 30, 'Sito attuale': 30, 'Difetti sito': 50, 'Link demo': 52, 'Testo email': 80, 'Oggetto email': 40, 'Motivo classe': 40, 'Certificazioni': 30, 'Stile demo': 30}
    for i, c in enumerate(cols, 1): ws.column_dimensions[get_column_letter(i)].width = widths.get(c, 13)
    for row in ws.iter_rows(min_row=2):
        for c in row: c.alignment = Alignment(vertical='top', wrap_text=cols[c.column - 1] in ('Testo email', 'Difetti sito', 'Motivo classe'))
        link = row[cols.index('Link demo')]; link.hyperlink = link.value; link.font = Font(color='1155CC', underline='single')
    fills = {'A': 'E3F4E8', 'B': 'FFF6DB', 'C': 'F1F1F1'}
    for row in ws.iter_rows(min_row=2):
        f = fills.get(str(row[0].value)[:1])
        if f: row[0].fill = PatternFill('solid', fgColor=f)
    ws.freeze_panes = 'D2'; ws.auto_filter.ref = ws.dimensions
    wb.save(xp)
    with open(cp, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=cols, delimiter=';'); w.writeheader(); w.writerows(rows)
    from collections import Counter
    print(len(rows), Counter(str(r['Classe'])[:1] for r in rows), 'con email', sum(1 for r in rows if r['Email']))

if __name__ == '__main__':
    main(*sys.argv[1:4])
