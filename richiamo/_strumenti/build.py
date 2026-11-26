#!/usr/bin/env python3
"""Genera le anteprime «Richiamo preventivi»: richiamo/<slug>/index.html.

Uso, dalla radice del repo:  python3 richiamo/_strumenti/build.py [cartella]
Una voce per azienda in aziende.json; lo scenario (messaggi, resoconto, conto)
viene dal settore. Questa cartella non viene pubblicata (pages.yml la toglie).
"""
import html, json, os, sys, urllib.parse

QUI = os.path.dirname(os.path.abspath(__file__))
leggi = lambda n: open(os.path.join(QUI, n), encoding="utf-8").read()
TPL, MARCHIO = leggi("template.html"), leggi("marchio.svg")
AZIENDE = json.loads(leggi("aziende.json"))
e = lambda s: html.escape(str(s), quote=True)
euro = lambda n: f"{int(n):,}".replace(",", ".") + " €"

# Per settore: numero e importo del preventivo d'esempio, la spiegazione offerta nel primo richiamo,
# il dubbio della cliente, la risposta pronta, l'invito del giorno 6, la domanda finale, il resoconto, il conto.
SETTORI = {
 "serramenti": dict(numero=184, importo=11400, spiega="la differenza tra i due tipi di vetro",
    dubbio="Buongiorno, sì l'ho visto. Sinceramente è più alto di un altro che ho ricevuto.", dubbio_t="ha un dubbio sul prezzo",
    risposta="La capiamo, è giusto confrontare. Nel nostro prezzo sono compresi la posa e lo smaltimento dei vecchi infissi. Se ci manda l'altro preventivo li guardiamo insieme, voce per voce.",
    invito="se le fa comodo passiamo per le misure definitive: bastano venti minuti e non la impegna a nulla. Meglio giovedì o sabato mattina?",
    si="Quando potete venire per le misure?", si_t="Chiede quando potete passare per le misure.",
    seguiti=41, soldi=38600, lavori=4,
    righe=[("Gianni R.", "Portoncino d'ingresso", 3200, "risposta", "Ha risposto", "Chiede se è compresa la posa: aspetta voi"),
           ("Famiglia T.", "12 finestre", 16800, "", "In attesa", "Secondo richiamo giovedì"),
           ("Luisa M.", "Zanzariere e tapparelle", 2900, "ok", "Accettato", "Ha confermato venerdì"),
           ("Aldo P.", "Vetrata scorrevole", 8700, "no", "Chiuso", "Ha scelto un altro: nessun altro messaggio")],
    conto=dict(mese=30, valore=9000, chiusi=3, margine=30)),
 "stufe": dict(numero=96, importo=5800, spiega="la differenza tra i due modelli",
    dubbio="Buongiorno, sì l'ho visto. Mi chiedevo quanto tempo serve per l'installazione.", dubbio_t="chiede i tempi",
    risposta="I tempi precisi glieli diamo dopo il sopralluogo, che è gratuito e non la impegna. Le proponiamo due date questa settimana?",
    invito="se le fa comodo passiamo per il sopralluogo: è gratuito e non la impegna a nulla. Meglio giovedì o sabato mattina?",
    si="Quando potete venire per il sopralluogo?", si_t="Chiede quando potete passare per il sopralluogo.",
    seguiti=33, soldi=19400, lavori=4,
    righe=[("Gianni R.", "Caminetto a legna", 7400, "risposta", "Ha risposto", "Chiede della canna fumaria: aspetta voi"),
           ("Famiglia T.", "Cucina a legna", 4900, "", "In attesa", "Secondo richiamo giovedì"),
           ("Luisa M.", "Inserto per camino", 3300, "ok", "Accettato", "Ha confermato venerdì"),
           ("Aldo P.", "Stufa a legna", 2600, "no", "Chiuso", "Ha scelto un altro: nessun altro messaggio")],
    conto=dict(mese=25, valore=4500, chiusi=4, margine=30)),
 "bagni": dict(numero=61, importo=9800, spiega="che cosa è compreso nei lavori",
    dubbio="Buongiorno, sì l'ho visto. Mi chiedevo quanto durano i lavori.", dubbio_t="chiede quanto durano i lavori",
    risposta="I tempi glieli scriviamo nero su bianco dopo il sopralluogo, che è gratuito e non la impegna. Le proponiamo due date questa settimana?",
    invito="se le fa comodo passiamo per il sopralluogo: è gratuito e non la impegna a nulla. Meglio giovedì o sabato mattina?",
    si="Quando potete venire per il sopralluogo?", si_t="Chiede quando potete passare per il sopralluogo.",
    seguiti=18, soldi=27300, lavori=3,
    righe=[("Gianni R.", "Doccia al posto della vasca", 4600, "risposta", "Ha risposto", "Chiede quanto durano i lavori: aspetta voi"),
           ("Famiglia T.", "Due bagni", 17500, "", "In attesa", "Secondo richiamo giovedì"),
           ("Luisa M.", "Bagno di servizio", 6200, "ok", "Accettato", "Ha confermato venerdì"),
           ("Aldo P.", "Rifacimento bagno", 8900, "no", "Chiuso", "Ha scelto un altro: nessun altro messaggio")],
    conto=dict(mese=15, valore=10000, chiusi=3, margine=30)),
 "fotovoltaico": dict(numero=143, importo=13900, spiega="come abbiamo calcolato il risparmio",
    dubbio="Buongiorno, sì l'ho visto. Sinceramente è più alto di un altro che ho ricevuto.", dubbio_t="ha un dubbio sul prezzo",
    risposta="La capiamo, è giusto confrontare. Se ci manda l'altro preventivo li guardiamo insieme, voce per voce: pannelli, batteria, garanzie.",
    invito="se le fa comodo passiamo per il sopralluogo sul tetto: è gratuito e non la impegna a nulla. Meglio giovedì o sabato mattina?",
    si="Quando potete venire per il sopralluogo?", si_t="Chiede quando potete passare per il sopralluogo.",
    seguiti=52, soldi=44800, lavori=4,
    righe=[("Gianni R.", "Pompa di calore", 9600, "risposta", "Ha risposto", "Chiede i tempi di installazione: aspetta voi"),
           ("Famiglia T.", "Fotovoltaico da 4,5 kW", 8400, "", "In attesa", "Secondo richiamo giovedì"),
           ("Luisa M.", "Batteria di accumulo", 6800, "ok", "Accettato", "Ha confermato venerdì"),
           ("Aldo P.", "Tre climatizzatori", 4200, "no", "Chiuso", "Ha scelto un altro: nessun altro messaggio")],
    conto=dict(mese=40, valore=9000, chiusi=2, margine=25)),
}


def pagina(a):
    s = SETTORI[a["settore"]]
    az, n, imp = a["azienda"], s["numero"], s["importo"]
    giorni = [
     dict(n=0, q="martedì, ore 17:20", d="Martedì", p="Mandate il preventivo n. %d per email, come sempre. Con un indirizzo in più in copia." % n,
          voi="Niente. Il primo messaggio parte da solo.",
          m=[dict(k="esce", x="Buonasera Marta, qui %s. Le abbiamo appena mandato per email il preventivo per %s. Se qualcosa non è chiaro ci scriva pure qui." % (az, a["prodotto"]), q="17:22, partito da solo")]),
     dict(n=2, q="giovedì, ore 10:05", d="Giovedì", p="Nessuna risposta. Parte il primo richiamo, e Marta risponde.", voi="",
          scelta=dict(t="Marta ha risposto: %s." % s["dubbio_t"], p="La risposta è già pronta. La inviate così, la cambiate, oppure la chiamate voi."),
          m=[dict(k="esce", x="Buongiorno Marta, è riuscita a guardare il preventivo? Se vuole le spieghiamo in due righe %s." % s["spiega"], q="10:05, partito da solo"),
             dict(k="entra", x=s["dubbio"], q="13:40"),
             dict(k="esce", x=s["risposta"], q="13:52, partito dopo il vostro ok", dopo=True)]),
     dict(n=6, q="lunedì, ore 9:30", d="Lunedì", p="Marta non ha più scritto. Parte il secondo richiamo.", voi="Niente.",
          m=[dict(k="esce", x="Buongiorno Marta, " + s["invito"], q="9:30, partito da solo")]),
     dict(n=13, q="lunedì, ore 17:00", d="Lunedì", p="Ultimo messaggio: chiede solo un sì o un no. E Marta dice sì.", voi="Una telefonata.",
          fine=dict(t="Marta vuole procedere.", p="Preventivo n. %d, %s. %s Chiamatela." % (n, euro(imp), s["si_t"])),
          m=[dict(k="esce", x="Buonasera Marta, teniamo aperto il preventivo o lo chiudiamo? Ci basta un sì o un no, così non la disturbiamo più.", q="17:00, partito da solo"),
             dict(k="entra", x="Buonasera, scusate il ritardo. Abbiamo deciso: procediamo con voi. " + s["si"], q="18:42")]),
    ]
    cifre = [(str(s["seguiti"]), "preventivi seguiti questo mese", ""), ("1", "cliente da chiamare oggi", ""),
             ("1", "risposta che aspetta voi", ""), (euro(s["soldi"]), "accettati questo mese dopo un richiamo (%d lavori)" % s["lavori"], "soldi")]
    righe = [("Marta B.", a["breve"], imp, "chiama", "Da chiamare", "Vuole procedere")] + s["righe"]
    def riga(r):
        return ('<div class="riga%s"><div class="testi"><div class="chi">%s</div><div class="lav">%s</div></div><div class="imp num">%s</div>'
                '<div class="poi"><span class="stato %s">%s</span><span>%s</span></div></div>') % (
                " chiusa" if r[3] == "no" else "", e(r[0]), e(r[1]), euro(r[2]), r[3] if r[3] != "no" else "", e(r[4]), e(r[5]))
    wa = "https://wa.me/393514618847?text=" + urllib.parse.quote("Buongiorno, ho visto l'anteprima sul richiamo dei preventivi preparata per %s. Vorrei fare il conto sui nostri numeri." % az)
    dati = dict(numero=n, importo=imp, giorni=giorni, conto=s["conto"])
    mappa = {
     "TITOLO": e("Preventivi senza risposta: anteprima per %s | Umbra" % az), "AZIENDA": e(az),
     "FATTO": e(a["fatto"]), "FATTO_POI": "Ogni preventivo che parte da lì, poi, va seguito.",
     "CIFRE": "".join('<div class="%s"><b class="num">%s</b><span>%s</span></div>' % (c[2], e(c[0]), e(c[1])) for c in cifre),
     "RIGHE": "".join(riga(r) for r in righe),
     "WA": e(wa), "FONTE": e("Il dato sul vostro sito viene da %s, letto il 26 novembre 2026." % a["sito"]),
     "JSON": json.dumps(dati, ensure_ascii=False).replace("</", "<\\/"),
     "MARCHIO": MARCHIO, "MARCHIO_INTRO": MARCHIO.replace("um)", "um-i)").replace('id="um"', 'id="um-i"'),
    }
    out = TPL
    for k, v in mappa.items():
        out = out.replace("{{" + k + "}}", v)
    assert "{{" not in out, a["slug"]
    return out


if __name__ == "__main__":
    dest = sys.argv[1] if len(sys.argv) > 1 else os.path.dirname(QUI)
    for a in AZIENDE:
        d = os.path.join(dest, a["slug"]); os.makedirs(d, exist_ok=True)
        open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(pagina(a))
    print("generate", len(AZIENDE), "pagine in", dest)
