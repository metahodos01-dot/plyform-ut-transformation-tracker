# AI Contract Intelligence Platform

## Technical Architecture & Security Whitepaper

**Version 1.0 - Gennaio 2026**

---

## Executive Summary

La **AI Contract Intelligence Platform** è una soluzione Enterprise SaaS progettata per automatizzare l'analisi legale di contratti commerciali all'interno di gruppi aziendali complessi. Il sistema sfrutta l'Intelligenza Artificiale Generativa (LLM) di ultima generazione per identificare rischi legali, anomalie e clausole critiche con un livello di precisione "human-in-the-loop".

L'architettura è costruita secondo i principi di **Security-by-Design** e **Privacy-by-Default**, garantendo la totale sovranità dei dati per ogni entità del gruppo (Multi-Tenancy) e la piena conformità al GDPR grazie all'utilizzo di modelli AI "Zero Retention".

---

## 1. Architettura Tecnica

Il sistema è basato su un'infrastruttura Cloud-Native Serverless, che garantisce scalabilità automatica, alta disponibilità e costi ottimizzati in base all'utilizzo.

### 1.1 Stack Tecnologico

| Componente | Tecnologia | Ruolo |
| :--- | :--- | :--- |
| **Frontend** | Next.js 15+ (React) | Interfaccia utente reattiva e ottimizzata per Edge Network. |
| **UI Framework** | Tailwind CSS + Shadcn/UI | Design system moderno, accessibile e responsive. |
| **Backend** | Google Firebase (Serverless) | Gestione Api, Database e Autenticazione senza server management. |
| **Database** | Cloud Firestore (NoSQL) | Database documentale real-time per alta scalabilità. |
| **OCR Engine** | Google Cloud Document AI | Estrazione testo ad alta fedeltà da PDF scansionati. |
| **AI Model** | Claude 3.5 Sonnet (via AWS Bedrock) | LLM avanzato con context window di 200k token per analisi profonda. |

### 1.2 Flusso dei Dati (Data Flow)

1. **Ingestion Sicura**: L'utente carica il PDF crittografato nel bucket di storage isolato per Tenant.
2. **Enterprise OCR**: Google Document AI processa il documento, digitalizzando anche testo manoscritto o scansionato con bassa risoluzione.
3. **Context Construction**: Il sistema prepara il contesto per l'IA, mappando ogni frase alle coordinate fisiche (Pagina/Riga) originali.
4. **Inference Privata**: La richiesta viene inviata ad AWS Bedrock in un tunnel cifrato. Nessun dato viene salvato o usato per il training del modello pubblico.
5. **Risk Analysis**: L'IA restituisce un JSON strutturato con i rischi identificati, che viene salvato su Firestore.
6. **Visualizzazione**: L'Editor Split-Screen mostra il documento originale ed evidenzia i rischi, permettendo al revisore umano di validare o correggere.

---

## 2. Strategia di Sicurezza & Compliance

La sicurezza è il pilastro fondante della piattaforma, progettata per trattare dati sensibili e confidenziali.

### 2.1 Multi-Tenant Isolation

La piattaforma garantisce che i dati di ogni azienda del gruppo (es. Company A, Company B) siano visibili *solo* agli utenti autorizzati di quell'azienda, pur permettendo una supervisione centralizzata al Group Director.

**Meccanismo: Row-Level Security (RLS)**
Utilizziamo le Security Rules di Firestore per applicare controlli di accesso a livello di database kernel. Esempio logico di regola:

```javascript
match /contracts/{contractId} {
  allow read: if isGroupDirector() || (isAuthenticated() && resource.data.companyId == user.companyId);
}
```

* **Group Director**: Visibilità totale (Read/Write) su tutte le entità.
* **Company Admin**: Accesso strettamente limitato ai documenti della propria Legal Entity.

### 2.2 AI Safety & GDPR Compliance

L'utilizzo di Generative AI in ambito legale richiede garanzie assolute sulla privacy dei dati.

* **Provider**: AWS Bedrock (Regione EU: Francoforte / US-East-1).
* **Zero Data Retention**: AWS garantisce contrattualmente che **nessun input o output** processato viene memorizzato nei log o utilizzato per addestrare i modelli base di Anthropic o Amazon. I dati sono volatili e esistono solo per la durata dell'inferenza.
* **Private Isolation**: L'inferenza avviene in un ambiente VPC (Virtual Private Cloud) isolato, non su API pubbliche condivise.

### 2.3 Crittografia

* **At Rest**: Tutti i dati (PDF, Analisi, Feedback) sono crittografati a riposo (AES-256) negli storage di Google Cloud.
* **In Transit**: Tutte le comunicazioni API avvengono esclusivamente su canali cifrati TLS 1.3.

---

## 3. Scalabilità e Futuro

L'architettura Serverless permette di scalare da 10 a 10.000 contratti analizzati al giorno senza modifiche infrastrutturali. Il sistema è predisposto per l'integrazione futura con:

* **Firma Digitale** (es. DocuSign/Adobe Sign).
* **ERP Aziendali** (es. SAP/Salesforce) per l'importazione automatica.
