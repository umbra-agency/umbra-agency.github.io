#!/usr/bin/env python3
"""Genera le anteprime «candidature dirette» (Trova operai), una per azienda.

Uso, dalla radice del repo:
    python3 lavoro/_strumenti/build.py              rigenera lavoro/<slug>/index.html
    python3 lavoro/_strumenti/build.py <cartella>   scrive altrove, per le prove

Dati: aziende.json, una voce per azienda (vedi LEGGIMI.md).
I caratteri stanno in lavoro/f/*.woff2 e sono condivisi da tutte le pagine:
non rimetterli dentro le pagine in base64, il sito è già al limite di peso.
Questa cartella non viene pubblicata: la toglie .github/workflows/pages.yml.
"""
import html, json, sys, os, urllib.parse

QUI = os.path.dirname(os.path.abspath(__file__))
TPL = open(os.path.join(QUI, "template.html"), encoding="utf-8").read()
FONTS = open(os.path.join(QUI, "fonts-link.css"), encoding="utf-8").read()
MARCHIO = open(os.path.join(QUI, "marchio.svg"), encoding="utf-8").read()
AZIENDE = json.load(open(os.path.join(QUI, "aziende.json"), encoding="utf-8"))

def e(s):
    return html.escape(s, quote=True)

def c2size(testo):
    n = len(testo)
    if n <= 9: return "3.5rem"
    if n <= 13: return "2.7rem"
    return "2.15rem"

def a_citta(nome):
    """«a Varmo», ma «ad Aviano»: la d eufonica solo davanti alla stessa vocale."""
    return ("ad " if nome[:1].lower() == "a" else "a ") + nome


def pagina(a):
    linguette = "".join('<span%s>%s</span>' % (' class="via"' if i == 5 else '', e(a["breve"])) for i in range(9))
    paesi = '<li class="casa">%s</li>' % e(a["citta_breve"]) + "".join("<li>%s</li>" % e(p) for p in a["paesi"])
    wa_testo = "Buongiorno, ho visto l'anteprima preparata per %s. Vorrei saperne di più." % a["azienda"]
    wa = "https://wa.me/393514618847?text=" + urllib.parse.quote(wa_testo)
    dati = dict(azienda=a["azienda"], sigla=a["sigla"], lui=a["lui"], cittaBreve=a["citta_breve"],
                titoloAnnuncio=a["titolo_annuncio"], chips=a["chips"], domande=a["domande"])
    js = json.dumps(dati, ensure_ascii=False).replace("</", "<\\/")
    mappa = {
        "TITOLO": e("Candidature per %s: la prova | Umbra" % a["azienda"]),
        "AZIENDA": e(a["azienda"]), "CITTA": e(a["citta"]), "CITTA_BREVE": e(a["citta_breve"]),
        "H1": e(a["h1"]), "C2SIZE": c2size(a["cartello"]), "CARTELLO": e(a["cartello"]), "CARTELLO2": e(a["cartello2"]),
        "LINGUETTE": linguette, "FRASE": e(a["frase"]), "FONTE": e(a["fonte"]), "LUI": e(a["lui"]), "VEDE": e(a.get("vede", "lui")), "A_CITTA": e(a_citta(a["citta"])), "CHI": e(a["chi"]),
        "PAESI": paesi, "PERCHI": e(a["perchi"]), "WA": e(wa), "JSON": js, "FONTS": FONTS, "MARCHIO": MARCHIO, "MARCHIO_INTRO": MARCHIO.replace("um)", "um-i)").replace('id="um"', 'id="um-i"'),
    }
    out = TPL
    for k, v in mappa.items():
        out = out.replace("{{" + k + "}}", v)
    assert "{{" not in out, "segnaposto rimasto in " + a["slug"]
    return out

if __name__ == "__main__":
    dest = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(QUI)
    for a in AZIENDE:
        d = os.path.join(dest, a["slug"])
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(pagina(a))
    print("generate", len(AZIENDE), "pagine in", dest)
