# Manuale Utente - AI Contract Intelligence Platform

## Introduzione

La piattaforma AI Contract Intelligence è lo strumento centralizzato per la gestione e l'analisi dei rischi contrattuali del Gruppo. Utilizza l'IA per automatizzare la revisione legale, garantendo standard uniformi tra le diverse aziende del gruppo.

## Accesso al Sistema

1. Navigare all'indirizzo della piattaforma.
2. Cliccare su **"Sign In with Corporate ID"**.
3. Il sistema riconoscerà automaticamente il livello di accesso:
    * **Direttore**: Accesso completo a tutte le aziende.
    * **Admin Azienda**: Accesso limitato ai propri contratti.

---

## Funzionalità Principali

### 1. Dashboard Esecutiva

Il pannello di controllo offre una visione immediata dello stato di rischio.

* **Traffic Light Widget**: Mostra il numero di contratti ad Alto (Rosso), Medio (Giallo) e Basso (Verde) rischio.
* **Filtro Azienda**: (Solo Direttore) Permette di isolare i dati di una specifica controllata.
* **Feed Recente**: Lista cronologica degli ultimi documenti analizzati.

### 2. Caricamento e Analisi Automatica

* Cliccare su **"+ New Analysis"**.
* Caricare il file PDF (sono supportati anche documenti scansionati).
* Il sistema impiegherà circa 10-20 secondi per:
  * Digitalizzare il testo (OCR Google Cloud).
  * Identificare i rischi (AWS Bedrock AI).
  * Generare il report preliminare.

### 3. Editor di Revisione (Split-Screen)

Questa è l'area di lavoro principale.

* **Vista Sinistra**: Documento originale.
* **Vista Destra**: Analisi dell'Intelligenza Artificiale.
* **Navigazione**: Cliccando su un box di rischio a destra, il PDF a sinistra scorre automaticamente alla pagina e riga esatta.
* **Azioni**:
  * **Modify**: Se l'AI ha sbagliato o è troppo severa, correggi il giudizio. Il sistema imparerà da questa correzione.
  * **Reject**: Respingi il contratto se i rischi sono inaccettabili.
  * **Approve**: Valida l'analisi e archivia il contratto.

### 4. Esportazione Report

Per le riunioni di allineamento strategico:

1. Andare su "Settings" o "Reports".
2. Selezionare il periodo (Mese/Trimestre).
3. Cliccare **"Export to Excel"**.
4. Il file generato contiene una matrice dei rischi per azienda, pronta per la discussione.
