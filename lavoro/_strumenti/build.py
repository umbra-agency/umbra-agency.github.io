#!/usr/bin/env python3
"""Genera le anteprime «candidature dirette» (Trova operai), versione 2.

Per ogni azienda di aziende.json scrive due pagine:
    lavoro/<slug>/index.html             la presentazione per il titolare
    lavoro/<slug>/candidati/index.html   la bozza della pagina dove ci si candida

Uso, dalla radice del repo:
    python3 lavoro/_strumenti/build.py              rigenera lavoro/<slug>/
    python3 lavoro/_strumenti/build.py <cartella>   scrive altrove, per le prove

I caratteri stanno in lavoro/f/*.woff2 e sono condivisi da tutte le pagine:
non rimetterli dentro le pagine in base64, il sito è già al limite di peso.
Questa cartella non viene pubblicata: la toglie .github/workflows/pages.yml.
Le dieci pagine del 25 novembre si rigenerano con build-v1.py.
"""
import html, json, sys, os, urllib.parse

QUI = os.path.dirname(os.path.abspath(__file__))
def leggi(nome):
    return open(os.path.join(QUI, nome), encoding="utf-8").read()

TPL = leggi("template.html")
CAND = leggi("candidati.html")
FONTS = leggi("fonts-link.css")
FONTS_CAND = FONTS.replace("url(../f/", "url(../../f/")
MARCHIO = leggi("marchio.svg")
AZIENDE = json.loads(leggi("aziende.json"))

L_PERSONE = "Persone che vi mancano"
L_ORE = "Ore al giorno che ognuna lavorerebbe per i clienti"
L_EUR = "Quanto fatturate per un'ora di quel lavoro"


def e(s):
    return html.escape(s, quote=True)

def c2size(testo):
    n = len(testo)
    if n <= 9: return "3.5rem"
    if n <= 13: return "2.7rem"
    if n <= 19: return "2.15rem"
    return "1.75rem"

def a_citta(nome):
    """«a Varmo», ma «ad Aviano»: la d eufonica solo davanti alla stessa vocale."""
    return ("ad " if nome[:1].lower() == "a" else "a ") + nome

def riempi(tpl, mappa, slug):
    out = tpl
    for k, v in mappa.items():
        out = out.replace("{{" + k + "}}", v)
    assert "{{" not in out, "segnaposto rimasto in " + slug
    return out

def dati_json(d):
    return json.dumps(d, ensure_ascii=False).replace("</", "<\\/")

def post(a, ann, chiara):
    return ('<div class="post"><div class="post-testa"><span class="avatar">%s</span><div><b>%s</b><small>Sponsorizzato</small></div></div>'
            '<p class="post-testo">%s</p>'
            '<div class="tessera%s"><span class="t1">%s</span><span class="t2">%s</span><span class="t3">%s</span></div>'
            '<div class="post-piede"><b>%s</b><span>Candidati ora</span></div></div>') % (
        e(a["sigla"]), e(a["azienda"]), e(ann["testo"]), " chiara" if chiara else "",
        e(ann["t1"]), e(ann["t2"]), e(ann["t3"]), e(ann["titolo"]))

def quesiti(a):
    tutte = a["domande"] + [
        {"t": "Quanto abiti lontano da %s?" % a["citta_breve"], "o": ["Meno di 10 km", "Tra 10 e 30 km", "Più di 30 km"]},
        {"t": "Quando potresti iniziare?", "o": ["Subito", "Entro un mese", "Più avanti"]},
    ]
    return "".join("<li><b>%s</b><span>%s</span></li>" % (e(q["t"]), e(" · ".join(q["o"]))) for q in tutte)


def presentazione(a):
    linguette = "".join('<span%s>%s</span>' % (' class="via"' if i == 5 else '', e(a["breve"])) for i in range(9))
    paesi = '<li class="casa">%s</li>' % e(a["citta_breve"]) + "".join("<li>%s</li>" % e(p) for p in a["paesi"])
    wa_testo = "Buongiorno, ho visto l'anteprima preparata per %s. Vorrei saperne di più." % a["azienda"]
    wa = "https://wa.me/393514618847?text=" + urllib.parse.quote(wa_testo)
    c = a["conto"]
    dati = dict(azienda=a["azienda"], sigla=a["sigla"], lui=a["lui"], cittaBreve=a["citta_breve"],
                titoloAnnuncio=a["titolo_annuncio"], chips=a["chips"], domande=a["domande"],
                ruolo=a["ruolo"], tessera=a["tessera"],
                conto=dict(persone=c["persone"], ore=c["ore"], eur=c["eur"]))
    mappa = {
        "TITOLO": e("Candidature per %s: la prova | Umbra" % a["azienda"]),
        "AZIENDA": e(a["azienda"]), "CITTA": e(a["citta"]), "CITTA_BREVE": e(a["citta_breve"]),
        "H1": e(a["h1"]), "H1SOTTO": e(a["h1sotto"]),
        "C2SIZE": c2size(a["cartello"]), "CARTELLO": e(a["cartello"]), "CARTELLO2": e(a["cartello2"]),
        "LINGUETTE": linguette, "FRASE": e(a["frase"]), "FONTE": e(a["fonte"]), "LUI": e(a["lui"]),
        "A_CITTA": e(a_citta(a["citta"])), "CHI": e(a["chi"]), "PAESI": paesi, "PERCHI": e(a["perchi"]),
        "POSTS": post(a, a["annunci"][0], False) + post(a, a["annunci"][1], True),
        "QUESITI": quesiti(a),
        "L_PERSONE": e(c.get("l_persone", L_PERSONE)), "L_ORE": e(c.get("l_ore", L_ORE)), "L_EUR": e(c.get("l_eur", L_EUR)),
        "WA": e(wa), "JSON": dati_json(dati), "FONTS": FONTS, "MARCHIO": MARCHIO,
        "MARCHIO_INTRO": MARCHIO.replace("um)", "um-i)").replace('id="um"', 'id="um-i"'),
    }
    return riempi(TPL, mappa, a["slug"])


def candidati(a):
    k = a["cand"]
    blocchi = "".join("<div><h2>%s</h2><ul>%s</ul></div>" % (e(b["t"]), "".join("<li>%s</li>" % e(v) for v in b["v"])) for b in k["blocchi"])
    dati = dict(azienda=a["azienda"], cittaBreve=a["citta_breve"], domande=a["domande"], ruolo=a["ruolo"])
    mappa = {
        "TITOLO": e("%s: %s | bozza Umbra" % (a["azienda"], k["h1"])),
        "AZIENDA": e(a["azienda"]), "SIGLA": e(a["sigla"]), "CITTA": e("%s (%s)" % (a["citta"], a["prov"])),
        "CERCA": e(k["cerca"]), "CAND_H1": e(k["h1"]), "CAND_SOTTO": e(k["sotto"]),
        "CHIPS": "".join("<li>%s</li>" % e(x) for x in a["chips"]),
        "BLOCCHI": blocchi, "FONTE": e(a["fonte"]), "FONTS": FONTS_CAND, "JSON": dati_json(dati),
    }
    return riempi(CAND, mappa, a["slug"] + "/candidati")


if __name__ == "__main__":
    dest = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(QUI)
    for a in AZIENDE:
        d = os.path.join(dest, a["slug"])
        os.makedirs(os.path.join(d, "candidati"), exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(presentazione(a))
        open(os.path.join(d, "candidati", "index.html"), "w", encoding="utf-8").write(candidati(a))
    print("generate", len(AZIENDE), "presentazioni e", len(AZIENDE), "pagine candidati in", dest)
