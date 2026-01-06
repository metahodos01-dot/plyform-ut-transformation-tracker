import { EmergingNeed, UserStory, Task, ProjectSettings, TeamMember } from '@/types';

// Mock Team Members
export const mockTeamMembers: TeamMember[] = [
  { id: 'tm-1', name: 'Leonardo', role: 'Tecnico UT' },
  { id: 'tm-2', name: 'Ramponi', role: 'UT Manager' },
  { id: 'tm-3', name: 'Marco', role: 'Produzione' },
  { id: 'tm-4', name: 'Anna', role: 'Qualità' },
];

// Mock Project Settings
export const mockProjectSettings: ProjectSettings = {
  startDate: '2025-01-06',
  team: mockTeamMembers,
  lastUpdated: '2025-01-06T10:00:00.000Z',
};

// Mock Emerging Needs
export const mockEmergingNeeds: EmergingNeed[] = [
  {
    id: 'need-1',
    description: 'Implementare Feedback Loop Bidirezionale UT-Produzione',
    originator: 'Responsabile Produzione',
    date: '2025-01-01',
    reason: 'Migliorare comunicazione e ridurre errori',
    status: 'CONFIRMED',
    priority: 'URGENT',
    orderIndex: 0,
    aiAnalysis: {
      impactLevel: 'HIGH',
      explanation: 'Impatto significativo sulla qualità e sicurezza',
      timestamp: '2025-01-02T10:00:00.000Z',
    },
  },
  {
    id: 'need-2',
    description: 'Rinnovo Certificazione NADCAP 2026',
    originator: 'Direzione Qualità',
    date: '2025-01-01',
    reason: 'Mantenimento certificazione critica',
    status: 'CONFIRMED',
    priority: 'URGENT',
    orderIndex: 1,
    aiAnalysis: {
      impactLevel: 'HIGH',
      explanation: 'Criticità elevata per business',
      timestamp: '2025-01-02T10:00:00.000Z',
    },
  },
  {
    id: 'need-3',
    description: 'Adeguamento Standard Part 21',
    originator: 'Ufficio Tecnico',
    date: '2025-01-02',
    reason: 'Conformità normativa',
    status: 'CONFIRMED',
    priority: 'HIGH',
    orderIndex: 2,
  },
  {
    id: 'need-4',
    description: 'Ottimizzazione Layout Lean Piaggio',
    originator: 'Plant Manager',
    date: '2025-01-03',
    reason: 'Efficienza produttiva',
    status: 'PENDING',
    priority: 'MEDIUM',
    orderIndex: 3,
  },
];

// Mock User Stories
export const mockUserStories: UserStory[] = [
  {
    id: 'story-1',
    needId: 'need-1',
    needDescription: 'Implementare Feedback Loop Bidirezionale UT-Produzione',
    role: 'Tecnico UT',
    action: 'ricevere feedback strutturato dalla Produzione',
    benefit: 'migliorare la qualità dei processi e ridurre gli errori',
    complexity: 'M',
    definitionOfReady: '- Need confermato\n- Team identificato',
    definitionOfDone: '- Modulo feedback attivo\n- Test completati\n- Documentazione aggiornata',
    assignedTo: ['Leonardo', 'Marco'],
    status: 'CONFIRMED',
    duration: 3,
  },
  {
    id: 'story-2',
    needId: 'need-2',
    needDescription: 'Rinnovo Certificazione NADCAP 2026',
    role: 'Quality Manager',
    action: 'preparare documentazione NADCAP',
    benefit: 'garantire rinnovo certificazione',
    complexity: 'L',
    definitionOfReady: '- Requisiti NADCAP identificati\n- Team allocato',
    definitionOfDone: '- Documentazione completa\n- Audit interno passato\n- Gap chiusi',
    assignedTo: ['Anna', 'Ramponi'],
    status: 'CONFIRMED',
    duration: 5,
  },
  {
    id: 'story-3',
    needId: 'need-1',
    needDescription: 'Implementare Feedback Loop Bidirezionale UT-Produzione',
    role: 'Responsabile Produzione',
    action: 'segnalare problematiche in tempo reale',
    benefit: 'ridurre i tempi di risoluzione',
    complexity: 'S',
    definitionOfReady: '- Canale comunicazione definito',
    definitionOfDone: '- Sistema attivo\n- Training completato',
    assignedTo: ['Marco'],
    status: 'INTEGRATED',
    duration: 2,
  },
];

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: 'task-1',
    description: 'Setup modulo feedback bidirezionale',
    completed: false,
    assignedTo: 'Leonardo',
    duration: 2,
    definitionOfDone: '- Modulo configurato\n- Test funzionali OK',
    generatedFromNeedId: 'need-1',
    generatedFromStoryId: 'story-1',
  },
  {
    id: 'task-2',
    description: 'Formazione team su nuovo processo',
    completed: false,
    assignedTo: 'Ramponi',
    duration: 1.5,
    definitionOfDone: '- Training erogato\n- Feedback raccolti',
    generatedFromNeedId: 'need-1',
    generatedFromStoryId: 'story-1',
  },
  {
    id: 'task-3',
    description: 'Documentazione NADCAP Sezione 1',
    completed: true,
    assignedTo: 'Anna',
    duration: 3,
    completedAt: '2025-01-05',
    notes: 'Completata revisione documentazione',
    definitionOfDone: '- Documenti aggiornati\n- Review completata',
    generatedFromNeedId: 'need-2',
    generatedFromStoryId: 'story-2',
  },
  {
    id: 'task-4',
    description: 'Test sistema feedback Lesson Learned',
    completed: false,
    assignedTo: 'Marco',
    duration: 2,
    attendees: 'Leonardo, Marco, Anna',
    definitionOfDone: '- Test eseguiti\n- Report generato',
  },
];

// Mock Day Plan Data (usato per integration tests)
export const mockDayPlanData = [
  {
    day: 1,
    title: 'Kick-off & Visione',
    focus: 'Allineamento Strategico',
    tasks: [
      { ...mockTasks[0], id: 'd1-t1' },
      { ...mockTasks[1], id: 'd1-t2' },
    ],
  },
  {
    day: 2,
    title: 'Coinvolgimento Stakeholder',
    focus: 'Collaborazione',
    tasks: [
      { ...mockTasks[2], id: 'd2-t1' },
    ],
  },
  {
    day: 3,
    title: 'Setup Organizzativo',
    focus: 'Metodologia',
    tasks: [
      { ...mockTasks[3], id: 'd3-t1' },
    ],
  },
];

// Helper per creare mock data varianti
export const createMockNeed = (overrides: Partial<EmergingNeed> = {}): EmergingNeed => ({
  id: `need-${Date.now()}`,
  description: 'Test Need Description',
  originator: 'Test Originator',
  date: new Date().toISOString().split('T')[0],
  reason: 'Test Reason',
  status: 'PENDING',
  priority: 'MEDIUM',
  orderIndex: 0,
  ...overrides,
});

export const createMockStory = (overrides: Partial<UserStory> = {}): UserStory => ({
  id: `story-${Date.now()}`,
  needId: 'need-1',
  role: 'Test Role',
  action: 'test action',
  benefit: 'test benefit',
  complexity: 'M',
  definitionOfReady: 'Test DoR',
  definitionOfDone: 'Test DoD',
  assignedTo: ['Leonardo'],
  status: 'PENDING',
  duration: 2,
  ...overrides,
});

export const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: `task-${Date.now()}`,
  description: 'Test Task',
  completed: false,
  duration: 1,
  ...overrides,
});
