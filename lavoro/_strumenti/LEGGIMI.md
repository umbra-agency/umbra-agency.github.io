# Anteprime «candidature dirette» (Trova operai)

Per ogni azienda due pagine, pubblicate su `umbra-agency.github.io/lavoro/<slug>/`:

- `lavoro/<slug>/` — la presentazione per il titolare: la prova nel telefono, cosa è già
  pronto (pagina, domande, due annunci), quanto vale il posto vuoto, come si parte.
- `lavoro/<slug>/candidati/` — la bozza della pagina dove ci si candida, scritta con i dati
  del loro annuncio. Non invia niente: alla fine mostra il messaggio e il pulsante
  «Guardatela dentro WhatsApp» (senza numero: sceglie chi la apre a chi mandarla).

Questa cartella serve solo a generarle e non viene pubblicata.

## Rigenerare le pagine

Dalla radice del repo:

    python3 lavoro/_strumenti/build.py

Riscrive le due pagine per ogni voce di `aziende.json` (modelli: `template.html` e
`candidati.html`). Le dieci pagine del 25 novembre usano il primo modello e si
rigenerano con `build-v1.py` (`template-v1.html`, `aziende-v1.json`); Forti Giorgio e
Franceschino Loris sono passate al modello nuovo e stanno in `aziende.json`.

## Aggiungere un'azienda

Aggiungere una voce in `aziende.json`. I campi:

| Campo | Cosa contiene |
|---|---|
| `slug`, `regione` | nome della cartella e del link; regione, per il foglio di invio |
| `azienda`, `ragione`, `breve`, `sigla` | nome come lo scriverebbero loro, ragione sociale, nome corto per le linguette (massimo 14 caratteri), due lettere |
| `citta`, `citta_breve`, `prov` | sede di lavoro dell'annuncio |
| `h1`, `h1sotto` | il beneficio, non il servizio: «Il saldatore che cercate un lavoro ce l'ha già.» e la riga che spiega come lo si raggiunge |
| `cartello`, `cartello2` | il mestiere in maiuscolo e la riga sotto, sul cartello «cercasi» |
| `frase`, `fonte`, `url_fonte`, `data_annuncio` | cosa hanno pubblicato, dove e quando: solo fatti verificati sull'annuncio |
| `lui`, `chi`, `perchi`, `ruolo` | «un saldatore», «chi salda già», «per la ricerca del saldatore», «saldatore» (finisce nel titolo della candidatura) |
| `titolo_annuncio`, `chips`, `tessera` | titolo, tre etichette e le tre righe del riquadro dell'annuncio nel telefono |
| `domande` | due domande sul mestiere, ognuna con testo `t`, etichetta `e` e opzioni `o`. Distanza e disponibilità le aggiunge la pagina |
| `paesi` | sei comuni entro 30 km |
| `conto` | valori di partenza del conto: `persone`, `ore`, `eur`; facoltative le tre etichette `l_persone`, `l_ore`, `l_eur` |
| `cand` | la pagina dei candidati: `cerca`, `h1`, `sotto`, `blocchi` (titolo `t` e voci `v`) |
| `annunci` | i due annunci: righe del riquadro `t1` `t2` `t3`, `testo`, `titolo` |

## Regole che ogni pagina rispetta

- `noindex`, nessun indice della cartella: la pagina la vede solo chi riceve il link.
- In testa e in fondo c'è scritto che è un'anteprima di Umbra, non una pagina dell'azienda.
- Nessuna delle due pagine invia dati: né a Umbra né all'azienda.
- Solo fatti presi dall'annuncio, con fonte e data. La paga compare solo se l'annuncio la dichiara.
- Gli annunci nominano l'azienda e sono rivolti a persone di entrambi i sessi; niente età.
- I numeri del conto sono esempi dichiarati tali e modificabili. Il prezzo non compare.
- Contatto: solo il pulsante WhatsApp di Umbra.

## Prova

    python3 lavoro/_strumenti/prova.py [cartella-foto]

Apre le due pagine di ogni azienda a 390 px: caratteri caricati, nessuno scorrimento
orizzontale, la prova fino alla notifica, il pulsante WhatsApp, il conto, la candidatura
completa. Con una cartella salva anche le foto. Serve Playwright con Chrome.
