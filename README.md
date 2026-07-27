# Le SCF italiane — fatturati e produttività per consulente

Pagina interattiva sulle **109 società di consulenza finanziaria (SCF)** iscritte all'albo OCF:
quanto fatturano, quanto guadagnano e quanti consulenti finanziari ci lavorano.

👉 **[Apri la pagina](https://michelepoletti.github.io/scf-italia/)**

## Cosa mostra

- **109 società**, **522 rapporti di consulenza**, **51,2 milioni** di giro d'affari aggregato
- Fatturato mediano per consulente: **98.303 €**
- Crescita a perimetro costante: **+19,1% l'anno** (CAGR 2022-2024)
- Il numero di consulenti spiega **meno di un quarto** della variabilità del fatturato
  (R² 0,23). In mediana le SCF fino a 3 consulenti fatturano 129.757 € per consulente contro
  48.545 € di quelle con 8 o più — ma dentro quest'ultimo gruppo si va da 2.108 € a 272.325 €

**Come si legge il dato.** Il contratto di consulenza è fra il cliente e la società: è la SCF
a fatturare all'investitore l'intera parcella, mentre il consulente fattura alla società le
proprie provvigioni. Il fatturato di una SCF è quindi il ricavo *completo* dell'attività di
tutti i suoi consulenti — e infatti, dei 514 consulenti legati a una SCF, **495 (il 96%)
operano esclusivamente tramite essa**.

Il divario fra le classi è dunque reale e non contabile, e non dipende dall'età delle società
(a parità di anzianità resta 2,4 volte). **Ma queste fonti non dicono perché.** Contengono
bilanci e iscrizioni all'albo: nulla sui clienti, sulle masse in consulenza o sui contratti.
Un fatturato basso per consulente può voler dire clienti piccoli, parcelle basse o consulenti
iscritti che non hanno ancora prodotto — da questi numeri le tre ipotesi sono indistinguibili.

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
