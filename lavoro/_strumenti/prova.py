#!/usr/bin/env python3
"""Percorre la prova su tutte le pagine di lavoro/ a 390 px.

Uso, dalla radice del repo:  python3 lavoro/_strumenti/prova.py
Serve Playwright (pip install playwright) e Chrome in /usr/bin/google-chrome.
"""
import asyncio, functools, http.server, json, os, threading

from playwright.async_api import async_playwright

QUI = os.path.dirname(os.path.abspath(__file__))
RADICE = os.path.dirname(os.path.dirname(QUI))
PORTA = 8765
SLUG = [a["slug"] for a in json.load(open(os.path.join(QUI, "aziende.json"), encoding="utf-8"))]


class Muto(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a, **k):
        pass


def servi():
    gestore = functools.partial(Muto, directory=RADICE)
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", PORTA), gestore)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv


async def main():
    srv = servi()
    guasti = 0
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
        for s in SLUG:
            pg = await ctx.new_page()
            errori = []
            pg.on("pageerror", lambda e: errori.append(str(e)))
            await pg.goto("http://127.0.0.1:%d/lavoro/%s/" % (PORTA, s))
            await pg.evaluate("document.fonts.ready")
            caratteri = await pg.evaluate("[...document.fonts].every(f => f.status === 'loaded')")
            largo = await pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            await pg.click("#schermo button.pieno")
            domande = []
            for _ in range(4):
                domande.append(await pg.inner_text("#schermo .domanda"))
                await pg.click("#schermo .opzione >> nth=0")
            await pg.fill("#nome-prova", "Luca")
            await pg.click("#schermo button.pieno")
            await pg.click("#schermo button.pieno")
            arrivo = await pg.inner_text("#schermo")
            ok = caratteri and largo == 0 and not errori and "Nuova candidatura: Luca" in arrivo
            guasti += 0 if ok else 1
            print("OK " if ok else "NO ", s, "| caratteri", caratteri, "| scorrimento", largo, "| errori", errori[:1])
            print("    ", " / ".join(domande))
            await pg.close()
        await b.close()
    srv.shutdown()
    raise SystemExit(1 if guasti else 0)


asyncio.run(main())
