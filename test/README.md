# Testing Documentation - Plyform UT Transformation Tracker

## 📋 Panoramica

Questo progetto utilizza **Vitest** come framework di testing con copertura completa del servizio Firebase.

## ✅ Stato Test

### Test Unitari
- **File**: `test/unit/services/firebase.test.ts`
- **Status**: ✅ 16/16 test passano (100%)
- **Coverage**: 100% Statements | 90% Branch | 100% Functions | 100% Lines
- **Durata**: ~40ms

## 🚀 Comandi Disponibili

```bash
# Esegui tutti i test
npm test

# Esegui test in modalità watch (auto-reload)
npm run test:watch

# Esegui solo test unitari
npm run test:unit

# Genera report coverage
npm run test:coverage

# Apri dashboard UI interattiva
npm run test:ui
```

## 📊 Coverage Report

Il report di coverage viene generato nella cartella `coverage/` quando esegui:

```bash
npm run test:coverage
```

Poi apri `coverage/index.html` nel browser per vedere il report dettagliato.

### Coverage Attuale

| File | Statements | Branch | Functions | Lines |
|------|-----------|--------|-----------|-------|
| **services/firebase.ts** | 100% | 90% | 100% | 100% |

## 🧪 Test Implementati

### Firebase Service (16 test)

#### Authentication
- ✅ `ensureAuth()` - Autentica utente anonimo se necessario
- ✅ `ensureAuth()` - Gestisce errori senza crashare

#### Connection Check
- ✅ `checkConnection()` - Ritorna true se Firestore è accessibile
- ✅ `checkConnection()` - Ritorna false su errore di connessione

#### Project Settings CRUD
- ✅ `getProjectSettings()` - Ritorna settings quando esistono
- ✅ `getProjectSettings()` - Ritorna null quando non esistono
- ✅ `getProjectSettings()` - Gestisce errori Firestore gracefully
- ✅ `saveProjectSettings()` - Salva con timestamp automatico
- ✅ `saveProjectSettings()` - Propaga errori se setDoc fallisce

#### Timestamp Management
- ✅ `updateLastSaved()` - Aggiorna solo il campo timestamp
- ✅ `updateLastSaved()` - Ritorna timestamp anche se il salvataggio fallisce (offline)

#### Data Formatting
- ✅ `formatDateTime()` - Formatta ISO date in locale it-IT
- ✅ `formatDateTime()` - Ritorna "Mai" per null/undefined

#### Data Seeding
- ✅ `seedInitialData()` - Popola DB se vuoto
- ✅ `seedInitialData()` - Salta seeding se DB ha già dati
- ✅ `seedInitialData()` - Lancia errore su fallimento seeding

## 🛠️ Architettura Test

### Setup Globale
**File**: `test/setup.ts`
- Cleanup automatico dopo ogni test
- Mock globali per Firebase (app, firestore, auth)
- Mock per window.alert e window.confirm

### Mock Utilities
**File**: `test/mocks/firebase.ts`
- `createMockQuerySnapshot()` - Simula QuerySnapshot Firestore
- `createMockDocSnapshot()` - Simula DocumentSnapshot Firestore
- `createMockBatch()` - Simula WriteBatch Firestore
- `createMockAuth()` - Simula Firebase Auth

### Test Fixtures
**File**: `test/mocks/fixtures.ts`
- Dati mock per EmergingNeed (6 esigenze strategiche)
- Dati mock per UserStory
- Dati mock per Task
- Dati mock per ProjectSettings
- Helper functions per creare dati mock custom

## 📝 Best Practices

### Scrivere Nuovi Test

1. **Organizzazione**: Raggruppa test correlati in `describe()` blocks
2. **Naming**: Usa nomi descrittivi che spiegano cosa viene testato
3. **Cleanup**: Usa `vi.clearAllMocks()` in `beforeEach()`
4. **Assertions**: Verifica sia il comportamento che gli effetti collaterali

Esempio:

```typescript
describe('MyFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should do something when condition is met', async () => {
    // Arrange
    const mockData = { foo: 'bar' };
    vi.mocked(someFunction).mockResolvedValue(mockData);

    // Act
    const result = await myFunction();

    // Assert
    expect(result).toEqual(mockData);
    expect(someFunction).toHaveBeenCalledTimes(1);
  });
});
```

### Mock Firebase

Per mockare chiamate Firestore nei test:

```typescript
import { createMockDocSnapshot, createMockQuerySnapshot } from '../mocks/firebase';

// Mock getDoc
vi.mocked(firestore.getDoc).mockResolvedValue(
  createMockDocSnapshot({ name: 'test' }, 'doc-id')
);

// Mock getDocs
vi.mocked(firestore.getDocs).mockResolvedValue(
  createMockQuerySnapshot([
    { id: '1', name: 'Item 1' },
    { id: '2', name: 'Item 2' }
  ])
);
```

## 🔍 Debug Test

### Test che fallisce?

```bash
# Esegui test specifico
npm test -- test/unit/services/firebase.test.ts

# Esegui in modalità debug con output dettagliato
npm test -- --reporter=verbose

# Esegui con UI interattiva per debug
npm run test:ui
```

### Console Log nei Test

I console.log() nei test vengono catturati da Vitest. Per vederli:

```typescript
it('my test', () => {
  console.log('Debug info:', someVariable);
  // ... test code
});
```

Poi esegui con:
```bash
npm test -- --reporter=verbose
```

## 🎯 Obiettivi Coverage

### Target Attuali
- ✅ **services/firebase.ts**: 100% (RAGGIUNTO)
- ⚠️ **pages/*.tsx**: 0% (Non testati - componenti React complessi)

### Perché Non Testiamo i Componenti?

I componenti React in `pages/` sono molto complessi (500-700 righe ciascuno) con:
- Multiple dipendenze esterne (Lucide icons, Layout)
- State management complesso (10+ useState hooks)
- HTML5 Drag & Drop API
- Real-time Firebase sync

**Raccomandazione**: Per testare l'UI, considera test E2E con Cypress o Playwright invece di test di integrazione React con mocking.

## 📚 Risorse

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library React](https://testing-library.com/react)
- [Firebase Testing](https://firebase.google.com/docs/rules/unit-tests)

## 🤝 Contribuire

Quando aggiungi nuove funzionalità:

1. Scrivi test per la logica di business
2. Mantieni coverage >70% per file critici
3. Esegui `npm test` prima di committare
4. Verifica che tutti i test passino in CI/CD

## 🐛 Troubleshooting

### "Cannot find module 'firebase/app'"
→ I mock sono definiti in `test/setup.ts` prima degli import

### "TypeError: Cannot read property 'currentUser' of undefined"
→ Mock `getAuth()` per ritornare `{ currentUser: null }`

### "ReferenceError: document is not defined"
→ Assicurati che `vitest.config.ts` usi `environment: 'happy-dom'`

### Test timeout dopo 5000ms
→ Aumenta timeout: `it('test', { timeout: 10000 }, async () => {})`

---

**Ultimo aggiornamento**: 2026-01-06
**Versione Framework**: Vitest 4.0.16
