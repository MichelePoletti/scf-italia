# Le SCF italiane — fatturati e produttività per consulente

Pagina interattiva sulle **109 società di consulenza finanziaria (SCF)** iscritte all'albo OCF:
quanto fatturano, quanto guadagnano e quanti consulenti finanziari ci lavorano.

👉 **[Apri la pagina](https://michelepoletti.github.io/scf-italia/)**

## Cosa mostra

- **109 società**, **522 rapporti di consulenza**, **51,2 milioni** di giro d'affari aggregato
- Fatturato mediano per consulente: **98.303 €**
- Crescita a perimetro costante: **+19,1% l'anno** (CAGR 2022-2024)
- Il risultato controintuitivo: **più consulenti ha una SCF, meno produce ciascuno**
  (129.757 € per le boutique fino a 3 consulenti contro 48.545 € per le reti da 8 in su)

**Come si legge il dato.** Il contratto di consulenza è fra il cliente e la società: è la SCF
a fatturare all'investitore l'intera parcella, mentre il consulente fattura alla società le
proprie provvigioni. Il fatturato di una SCF è quindi il ricavo *completo* dell'attività di
tutti i suoi consulenti — e infatti, dei 514 consulenti legati a una SCF, **495 (il 96%)
operano esclusivamente tramite essa**.

Il divario è dunque reale, non contabile. Due le spiegazioni: **essere iscritti non significa
produrre** (l'albo registra un rapporto, non un portafoglio, e le reti che reclutano in fretta
portano in albo consulenti ancora senza clienti), e **i segmenti di clientela sono diversi**
(poche famiglie con patrimoni grandi contro molti clienti retail con ticket piccoli).

## Fonti

| | |
|---|---|
| Albo | [OCF — elenchi iscritti](https://www.organismocf.it/portal/web/portale-ocf/elenchi-iscritti), aggiornati al 26/07/2026 |
| Bilanci | Registro imprese, ultimo esercizio depositato |

Il conteggio dei consulenti è verificato per doppio incrocio — quelli elencati nella scheda di
ogni SCF e quelli ricavati dall'elenco dei consulenti autonomi: **522 = 522**, zero
disallineamenti. Tutte e 109 le società sono agganciate al registro imprese con verifica di
denominazione *e* comune.

## Limiti

- Il fatturato è quello del bilancio depositato: per le società con attività diverse dalla
  consulenza finanziaria include tutto, non solo le parcelle.
- 25 società non hanno un bilancio disponibile (19 sono nate dal 2024 e non l'hanno ancora
  dovuto depositare), quindi il giro d'affari reale del settore è un po' superiore.
- Gli esercizi non sono tutti omogenei; il confronto di crescita usa il perimetro costante
  proprio per correggere questa distorsione.

## Struttura

```
index.html   pagina e stili
app.js       grafici in SVG e interazioni, nessuna dipendenza esterna
data.js      dataset delle 109 società
```

Tutto statico: si apre servendo la cartella con un qualsiasi web server
(`python -m http.server`) o via GitHub Pages.

---

I dati sono forniti a scopo informativo e non costituiscono consulenza finanziaria.
