# Plyform UT Transformation Tracker

> Applicazione web per la gestione della trasformazione digitale dell'Ufficio Tecnico verso metodologia Agile, con integrazione UT-Produzione e supporto per certificazioni NADCAP 2026 e Part 21 2026.

## 🎯 Funzionalità

### 📊 Dashboard
- Configurazione team cross-funzionale
- Sprint Velocity tracking (% task completati)
- Project Velocity (% storie integrate)
- Export report DOCX completo
- Visualizzazione 4 pilastri strategici

### 📋 Needs Analysis
- Registro esigenze strategiche con prioritizzazione
- IA analysis per valutazione impatto
- Drag-drop per riordinamento priorità
- Gestione status workflow (PENDING → CONFIRMED → INTEGRATED)
- Batch save operations

### 🎯 Objectives & KPI
- User Stories in formato Agile (Come/Voglio/Affinché)
- Copilot AI per generazione automatica storie
- DoR (Definition of Ready) e DoD (Definition of Done)
- Gestione complessità (XS, S, M, L, XL)
- Pianificazione automatica su 10 giorni (greedy scheduler)

### 📅 Execution Plan
- Piano operativo 10 giornate
- Drag-and-drop task tra giorni
- Validazione carico giornaliero (max 6h)
- Tracking completamento con timestamp
- Tracciabilità completa: task → story → need

## 🚀 Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Database**: Firebase (Firestore + Anonymous Auth)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **Export**: Docx + FileSaver
- **Testing**: Vitest 4.0 + React Testing Library

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/plyform-ut-transformation-tracker.git
cd plyform-ut-transformation-tracker

# Install dependencies
npm install

# Run development server
npm run dev
```

L'app sarà disponibile su `http://localhost:3000`

## 🔧 Configuration

### Firebase Setup

Il progetto usa Firebase per persistenza dati. Le credenziali sono già configurate in `services/firebase.ts`.

**Collections Firestore**:
- `tasks` - Task operativi
- `emerging_needs` - Esigenze strategiche
- `user_stories` - User Stories Agile
- `settings` - Configurazione progetto
- `project_logs` - Log attività

### Environment Variables

Opzionale: Crea `.env.local` per variabili custom:

```env
GEMINI_API_KEY=your_api_key_here
```

## 🧪 Testing

Il progetto include una suite completa di test unitari:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Open test UI dashboard
npm run test:ui
```

**Coverage attuale**:
- ✅ 16/16 test passano
- ✅ 100% coverage su `services/firebase.ts`
- ✅ Durata: ~35ms

## 📊 Project Structure

```
plyform-ut-transformation-tracker/
├── pages/
│   ├── Dashboard.tsx          # KPI e configurazione
│   ├── NeedsAnalysis.tsx      # Gestione esigenze
│   ├── ObjectivesKPI.tsx      # User Stories
│   └── ExecutionPlan.tsx      # Piano 10 giorni
├── components/
│   └── Layout.tsx             # Layout con sidebar
├── services/
│   └── firebase.ts            # Firebase integration
├── test/
│   ├── unit/                  # Unit tests
│   ├── mocks/                 # Mock utilities
│   └── README.md              # Test documentation
├── constants.ts               # Pilastri strategici + INITIAL_PLAN
├── types.ts                   # TypeScript interfaces
└── App.tsx                    # Main app + routing
```

## 🚢 Deployment

### Deploy su Vercel

1. **Collegare repository GitHub**:
   - Vai su [vercel.com](https://vercel.com)
   - Click "New Project"
   - Importa questo repository

2. **Configurazione Build**:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`

3. **Environment Variables**:
   - Nessuna variabile richiesta (Firebase config è pubblica)
   - Opzionale: Aggiungi `GEMINI_API_KEY` se usi AI features

4. **Deploy**: Click "Deploy" 🚀

### Deploy Manuale

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

I file buildati saranno in `dist/`

## 📚 Documentation

- [Test Documentation](test/README.md) - Guida completa ai test
- [Firebase Setup](services/firebase.ts) - Configurazione Firebase
- [Type Definitions](types.ts) - TypeScript interfaces

## 🎯 Pilastri Strategici

1. **Adozione Strumenti Agile** - Modello agile replicabile per il 2026
2. **Comunicazione Bidirezionale** - Flusso UT-Produzione con Lesson Learned
3. **Misurazione KPI** - Consapevolezza performance per evoluzione strategica
4. **Visibilità Sistemica** - Trasparenza impatto trasversale UT

## 🗓️ Workflow 10 Giorni

| Giorno | Focus | Obiettivo |
|--------|-------|-----------|
| 1 | Kick-off & Visione | Allineamento strategico |
| 2 | Stakeholder | Collaborazione |
| 3 | Setup | Metodologia Agile |
| 4 | Operatività | Routine integrata |
| 5 | Analisi Flussi | Processi UT-Produzione |
| 6 | Evoluzione | Design feedback loop |
| 7 | Metriche | KPI e monitoraggio |
| 8 | Visual Management | Dashboard trasparenza |
| 9 | Integrazione | Funzionale sistemica |
| 10 | Review | Roadmap futuro |

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start dev server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run test:ui      # Open test UI
npm run test:coverage # Generate coverage report
```

### Adding New Features

1. Scrivi test per la nuova funzionalità
2. Implementa la feature
3. Verifica che tutti i test passino
4. Mantieni coverage >70%

## 🐛 Troubleshooting

### Firebase Connection Issues
- Verifica le credenziali in `services/firebase.ts`
- Controlla le regole Firestore nel Firebase Console
- Verifica che Anonymous Auth sia abilitato

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Test Failures
```bash
# Run tests in watch mode per debug
npm run test:watch

# Run specific test file
npm test -- test/unit/services/firebase.test.ts
```

## 📝 License

Questo progetto è privato e proprietario di Plyform.

## 🤝 Contributing

Quando aggiungi nuove funzionalità:
1. Crea un branch: `git checkout -b feature/nome-feature`
2. Scrivi test per la nuova funzionalità
3. Implementa la feature
4. Esegui `npm test` per verificare
5. Commit: `git commit -m "feat: descrizione"`
6. Push: `git push origin feature/nome-feature`
7. Crea Pull Request

## 👥 Team

- **Ufficio Tecnico** - Leonardo, Ramponi
- **Produzione** - Marco
- **Qualità** - Anna

---

🤖 Built with [Claude Code](https://claude.com/claude-code)
