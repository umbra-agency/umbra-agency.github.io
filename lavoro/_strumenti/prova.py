#!/usr/bin/env python3
"""Percorre le due pagine di ogni azienda di aziende.json a 390 px.

Uso, dalla radice del repo:  python3 lavoro/_strumenti/prova.py [cartella-foto]
Serve Playwright (pip install playwright) e Chrome in /usr/bin/google-chrome.
Controlla: caratteri caricati, nessuno scorrimento orizzontale, nessun errore,
la prova fino alla notifica, il pulsante WhatsApp, il conto, e la candidatura
completa sulla pagina dei candidati. Con una cartella salva anche le foto.
"""
import asyncio, functools, http.server, json, os, sys, threading, urllib.parse

from playwright.async_api import async_playwright

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(os.path.dirname(QUI))
PORTA = 8765
AZIENDE = json.load(open(os.path.join(QUI, "aziende.json"), encoding="utf-8"))
FOTO = sys.argv[1] if len(sys.argv) > 1 else None


class Muto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a, **k):
        pass


def servi():
    gestore = functools.partial(Muto, directory=RADICE)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORTA), gestore)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


async def base(pg):
    await pg.evaluate("document.fonts.ready")
    caratteri = await pg.evaluate("[...document.fonts].every(f => f.status === 'loaded')")
    largo = await pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    return caratteri, largo


async def main():
    srv = servi()
    guasti = 0
    if FOTO:
        os.makedirs(FOTO, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
        for a in AZIENDE:
            s = a["slug"]
            # --- presentazione ---
            pg = await ctx.new_page()
            errori = []
            pg.on("pageerror", lambda e: errori.append(str(e)))
            await pg.goto("http://127.0.0.1:%d/lavoro/%s/" % (PORTA, s))
            caratteri, largo = await base(pg)
            if FOTO:
                await pg.screenshot(path=os.path.join(FOTO, s + "-1-intera.png"), full_page=True)
            await pg.click("#schermo button.pieno")
            for _ in range(4):
                await pg.click("#schermo .opzione >> nth=0")
            await pg.fill("#nome-prova", "Luca")
            await pg.click("#schermo button.pieno")
            await pg.click("#schermo button.pieno")
            arrivo = await pg.inner_text("#schermo")
            vera = await pg.evaluate("!document.getElementById('vera').hidden")
            wa = urllib.parse.unquote(await pg.get_attribute("#vera-wa", "href"))
            quando = await pg.inner_text("#quando")
            mese = await pg.inner_text("#r-mese")
            anno = await pg.inner_text("#r-anno")
            resta = await pg.inner_text("#r-resta")
            c = a["conto"]
            atteso = c["persone"] * c["ore"] * c["eur"] * 21 * 12
            anno_n = int(anno.replace(".", "").replace("€", "").strip())
            if FOTO:
                await pg.locator("#prova").screenshot(path=os.path.join(FOTO, s + "-2-notifica.png"))
            ok1 = (caratteri and largo == 0 and not errori and "Nuova candidatura: " + a["ruolo"] in arrivo and "Luca" in arrivo
                   and vera and wa.startswith("https://wa.me/?text=Nuova candidatura") and "Luca" in wa and anno_n == atteso)
            print("OK " if ok1 else "NO ", s, "| caratteri", caratteri, "| scorr.", largo, "| errori", errori[:1], "| esce", quando, "|", mese, "/", anno, "/", resta)
            await pg.close()
            # --- pagina candidati ---
            pg = await ctx.new_page()
            errori2 = []
            pg.on("pageerror", lambda e: errori2.append(str(e)))
            await pg.goto("http://127.0.0.1:%d/lavoro/%s/candidati/" % (PORTA, s))
            caratteri2, largo2 = await base(pg)
            if FOTO:
                await pg.screenshot(path=os.path.join(FOTO, s + "-3-candidati.png"), full_page=True)
            for _ in range(4):
                await pg.click("#passo .opzione >> nth=0")
            await pg.click("#c-invia")
            errore = await pg.inner_text("#passo .errore")
            await pg.fill("#c-nome", "Luca Bianchi")
            await pg.fill("#c-tel", "333 000 00 00")
            await pg.click("#c-invia")
            testo = await pg.inner_text("#passo")
            wa2 = urllib.parse.unquote(await pg.get_attribute("#c-wa", "href"))
            torna = await pg.get_attribute(".avviso a", "href")
            ok2 = (caratteri2 and largo2 == 0 and not errori2 and errore and "Luca Bianchi" in testo and "non viene inviata" in testo
                   and wa2.startswith("https://wa.me/?text=Candidatura: " + a["ruolo"]) and torna == "../")
            print("OK " if ok2 else "NO ", s + "/candidati", "| caratteri", caratteri2, "| scorr.", largo2, "| errori", errori2[:1])
            guasti += (0 if ok1 else 1) + (0 if ok2 else 1)
            await pg.close()
        await b.close()
    srv.shutdown()
    raise SystemExit(1 if guasti else 0)


asyncio.run(main())
