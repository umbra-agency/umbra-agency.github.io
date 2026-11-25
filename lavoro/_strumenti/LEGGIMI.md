# Anteprime «candidature dirette» (Trova operai)

Una pagina per azienda, pubblicata su `umbra-agency.github.io/lavoro/<slug>/`.
Questa cartella serve solo a generarle e non viene pubblicata.

## Rigenerare le pagine

Dalla radice del repo:

    python3 lavoro/_strumenti/build.py

Riscrive `lavoro/<slug>/index.html` per ogni voce di `aziende.json`.

## Aggiungere un'azienda

Aggiungere una voce in `aziende.json`. I campi:

| Campo | Cosa contiene |
|---|---|
| `slug` | nome della cartella e del link |
| `azienda`, `ragione`, `breve`, `sigla` | nome come lo scriverebbero loro, ragione sociale, nome corto per le linguette, due lettere |
| `citta`, `citta_breve`, `prov` | sede di lavoro dell'annuncio |
| `h1` | titolo: «Cercate un …. Portiamo l'annuncio sul suo telefono.» |
| `cartello`, `cartello2` | il mestiere in maiuscolo e la riga sotto, sul cartello «cercasi» |
| `frase`, `fonte`, `url_fonte`, `data_annuncio` | cosa hanno pubblicato, dove e quando: solo fatti verificati sull'annuncio |
| `lui`, `chi`, `perchi`, `vede` | «un saldatore», «chi salda già», «per la ricerca del saldatore», «lui» (o «uno di loro» al plurale) |
| `titolo_annuncio`, `chips` | titolo e tre etichette dell'annuncio nel telefono, prese dal loro annuncio |
| `domande` | due domande sul mestiere, ognuna con testo `t`, etichetta `e` e opzioni `o`. Distanza e disponibilità le aggiunge la pagina |
| `paesi` | sei comuni entro 30 km |

## Regole che ogni pagina rispetta

- `noindex`, nessun indice della cartella: la pagina la vede solo chi riceve il link.
- In testa e in fondo c'è scritto che è un'anteprima di Umbra, non una pagina dell'azienda.
- La prova non invia dati a nessuno.
- La frase sull'annuncio cita la fonte e la data. Niente che non sia nell'annuncio.
- Contatto: solo il pulsante WhatsApp di Umbra.

## Prova

    python3 lavoro/_strumenti/prova.py

Apre tutte le pagine a 390 px, controlla che i caratteri si carichino, che non ci sia
scorrimento orizzontale e percorre la prova fino alla notifica. Serve Playwright con Chrome.
