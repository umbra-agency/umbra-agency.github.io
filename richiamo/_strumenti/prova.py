#!/usr/bin/env python3
"""Percorre ogni anteprima «Richiamo» a 390 px. Uso: python3 richiamo/_strumenti/prova.py [cartella-foto]"""
import asyncio, functools, http.server, json, os, sys, threading, urllib.parse
from playwright.async_api import async_playwright
QUI = os.path.dirname(os.path.abspath(__file__)); RADICE = os.path.dirname(os.path.dirname(QUI))
AZ = json.load(open(os.path.join(QUI, "aziende.json"), encoding="utf-8")); FOTO = sys.argv[1] if len(sys.argv) > 1 else None
class M(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a, **k): pass
async def main():
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 8767), functools.partial(M, directory=RADICE)); threading.Thread(target=srv.serve_forever, daemon=True).start()
    guasti = 0
    if FOTO: os.makedirs(FOTO, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, reduced_motion="reduce")
        for a in AZ:
            pg = await ctx.new_page(); err = []; pg.on("pageerror", lambda e: err.append(str(e)))
            await pg.goto("http://127.0.0.1:8767/richiamo/%s/" % a["slug"]); await pg.evaluate("document.fonts.ready")
            fonts = await pg.evaluate("[...document.fonts].every(f => f.status === 'loaded')")
            largo = await pg.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            testo0 = await pg.inner_text("#chat")
            if FOTO: await pg.screenshot(path=os.path.join(FOTO, a["slug"] + ".png"), full_page=True)
            await pg.click("#avanti"); bloccato = await pg.is_disabled("#avanti")
            await pg.click(".avviso .scelte button >> nth=0"); dopo = await pg.inner_text("#chat")
            await pg.click("#avanti"); await pg.click("#avanti")
            wa = urllib.parse.unquote(await pg.get_attribute("#avviso-wa", "href")); somma = await pg.is_visible("#somma")
            margine = await pg.inner_text("#e-margine")
            ok = fonts and largo == 0 and not err and a["azienda"] in testo0 and bloccato and "dopo il vostro ok" in dopo and wa.startswith("https://wa.me/?text=Marta vuole procedere") and somma and "€" in margine
            guasti += 0 if ok else 1
            print("OK " if ok else "NO ", a["slug"], "| scorr.", largo, "| err", err[:1], "| margine", margine)
            await pg.close()
        await b.close()
    raise SystemExit(1 if guasti else 0)
asyncio.run(main())
