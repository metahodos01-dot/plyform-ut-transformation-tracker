# Simulazione Flusso: "Contratto Fornitura Alpha"

Questa simulazione descrive come la piattaforma **AI Contract Intelligence** processa un documento reale, dal caricamento all'export.

**Scenario**: L'Azienda 2 carica un contratto di fornitura "legacy" (scansione PDF del 2018) di 15 pagine.

---

### FASE 1: Caricamento e OCR (Google Cloud)

**Input**: `Fornitura_Alpha_2018.pdf` (Immagine scansionata, leggermente inclinata).

**Log di Sistema**:

```log
[10:00:01] Upload avviato da Admin Azienda 2.
[10:00:03] Rilevato PDF Scansionato. Attivazione Google Cloud Document AI.
[10:00:05] Elaborazione OCR in corso...
[10:00:08] OCR Completato.
           - Pagine processate: 15
           - Qualità riconoscimento: 98.7%
           - Mappatura coordinate: 4500 segmenti testo salvati.
```

**Risultato Intermedio (Dato Strutturato)**:
Il sistema ora "vede" il testo anche se era un'immagine.
> *"Il presente contratto si rinnova tacitamente per anni 5..."* (Trovato a: Pagina 3, righe 12-14)

---

### FASE 2: Analisi Intelligenza (AWS Bedrock + Claude)

**Input**: Testo estratto + Prompt di Sicurezza ("Cerca rischi legali, focus su rinnovi e penali").

**Log di Sistema**:

```log
[10:00:09] Connessione sicura a AWS Bedrock (eu-central-1).
[10:00:09] Invio payload context (15k token) a Claude 3.5 Sonnet.
[10:00:15] Risposta AI ricevuta. Parsing JSON...
```

**Output AI (JSON Grezzo)**:

```json
{
  "summary": "Contratto standard di fornitura industriale con clausole di lock-in aggressive.",
  "clauses": [
    {
      "text": "Il contratto si rinnova tacitamente per ulteriori 5 anni in assenza di disdetta inviata 24 mesi prima.",
      "risk": "HIGH",
      "comment": "Rinnovo automatico con preavviso irragionevole (24 mesi). Standard di mercato è 6-12 mesi.",
      "location": { "page": 3, "line": 12 }
    },
    {
       "text": "Foro competente esclusivo: Isole Cayman.",
       "risk": "HIGH",
       "comment": "Giurisdizione non standard per contratto EU, alti costi legali.",
       "location": { "page": 14, "line": 5 }
    }
  ]
}
```

---

### FASE 3: Revisione Umana (Feedback Loop)

**Azione Utente (Direttore)**:

1. Il Direttore apre il documento.
2. Vede il **Box Rosso** a Pagina 3.
3. Conferma il rischio "Rinnovo 5 anni" → **APPROVA ANALISI**.
4. Vede il **Box Rosso** a Pagina 14 ("Isole Cayman").
5. *Intervento*: "Non è un rischio, è una holding nota."
6. Clicca **"Modify"** -> Cambia rischio in **LOW**.

**Log di Apprendimento**:

```log
[10:05:00] Feedback salvato in Firestore 'training_data'.
           - Clause: "Foro competente... Isole Cayman"
           - Old Risk: HIGH
           - New Risk: LOW
           - User: Paolo Picchio
           *Il modello userà questo pattern per future analisi di questa holding.*
```

---

### FASE 4: Export e Reporting

Il contratto viene salvato con stato **"Revisionato con Riserva"**.
Nel report Excel mensile apparirà una riga rossa per l'Azienda 2, evidenziando il "Rinnovo automatico 5 anni" come punto da discutere al prossimo board.
