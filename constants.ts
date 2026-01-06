
import { DayPlan, Status } from './types';

export const PILLARS = [
  { 
    title: "Adozione di Strumenti Agile", 
    desc: "Creazione di un modello agile propedeutico al 2026 e replicabile per il gruppo All-Ways.", 
    icon: "Zap" 
  },
  { 
    title: "Comunicazione Bidirezionale", 
    desc: "Flusso UT-Produzione fluido e reattivo (Lesson Learned), essenziale per la sicurezza e il mantenimento NADCAP.", 
    icon: "MessageCircle" 
  },
  { 
    title: "Misurazione e KPI", 
    desc: "Acquisizione di consapevolezza sulle performance reali per evolvere da semplici esecutori a partner strategici.", 
    icon: "BarChart" 
  },
  { 
    title: "Visibilità Sistemica", 
    desc: "Rendere trasparente l'impatto trasversale dell'UT sui processi aziendali e sulla marginalità.", 
    icon: "Activity" 
  }
];

// Default duration is usually 1h or 2h for these workshops/meetings
export const INITIAL_PLAN: DayPlan[] = [
  {
    day: 1,
    title: "Kick-off & Visione",
    focus: "Allineamento Strategico",
    tasks: [
      { id: "d1-t1", description: "Riunione Kick-off Team UT: Obiettivi e Metodo", completed: false, assignedTo: "Leonardo", duration: 2 },
      { id: "d1-t2", description: "Condivisione roadmap NADCAP e Part 21", completed: false, duration: 2 }
    ]
  },
  {
    day: 2,
    title: "Coinvolgimento Stakeholder",
    focus: "Collaborazione",
    tasks: [
      { id: "d2-t1", description: "Tavolo di confronto con Responsabile Produzione", completed: false, assignedTo: "PM", duration: 2 },
      { id: "d2-t2", description: "Condivisione approccio integrato ai processi", completed: false, duration: 2 }
    ]
  },
  {
    day: 3,
    title: "Setup Organizzativo",
    focus: "Metodologia",
    tasks: [
      { id: "d3-t1", description: "Workshop: Strumenti di gestione Agile", completed: false, duration: 3 },
      { id: "d3-t2", description: "Organizzazione backlog attività correnti", completed: false, duration: 2 }
    ]
  },
  {
    day: 4,
    title: "Operatività Integrata",
    focus: "Routine",
    tasks: [
      { id: "d4-t1", description: "Primo stand-up meeting di coordinamento", completed: false, duration: 1 },
      { id: "d4-t2", description: "Prioritizzazione congiunta delle attività", completed: false, duration: 2 }
    ]
  },
  {
    day: 5,
    title: "Analisi Flussi",
    focus: "Processi",
    tasks: [
      { id: "d5-t1", description: "Mappatura interfaccia attuale UT-Produzione", completed: false, duration: 3 },
      { id: "d5-t2", description: "Identificazione aree di ottimizzazione informativa", completed: false, duration: 2 }
    ]
  },
  {
    day: 6,
    title: "Evoluzione Processi",
    focus: "Design",
    tasks: [
      { id: "d6-t1", description: "Proposta nuovo flusso di feedback (Lesson Learned)", completed: false, duration: 2 },
      { id: "d6-t2", description: "Definizione canali di comunicazione standard", completed: false, duration: 2 }
    ]
  },
  {
    day: 7,
    title: "Metriche di Successo",
    focus: "Monitoraggio",
    tasks: [
      { id: "d7-t1", description: "Definizione indicatori di performance (KPI)", completed: false, duration: 2 },
      { id: "d7-t2", description: "Condivisione obiettivi qualità e tempi", completed: false, duration: 2 }
    ]
  },
  {
    day: 8,
    title: "Visual Management",
    focus: "Trasparenza",
    tasks: [
      { id: "d8-t1", description: "Setup dashboard visuale in ufficio", completed: false, duration: 3 },
      { id: "d8-t2", description: "Presentazione metriche al team allargato", completed: false, duration: 2 }
    ]
  },
  {
    day: 9,
    title: "Integrazione Funzionale",
    focus: "Sinergia",
    tasks: [
      { id: "d9-t1", description: "Workshop congiunto Comm/Prod/Qualità", completed: false, duration: 3 },
      { id: "d9-t2", description: "Analisi valore su progetto pilota", completed: false, duration: 2 }
    ]
  },
  {
    day: 10,
    title: "Review & Prossimi Passi",
    focus: "Futuro",
    tasks: [
      { id: "d10-t1", description: "Review risultati Sprint 1 con Management", completed: false, duration: 2 },
      { id: "d10-t2", description: "Pianificazione Roadmap verso NADCAP 2026", completed: false, duration: 2 }
    ]
  }
];
