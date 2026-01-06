
export enum Status {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  BLOCKED = 'BLOCKED'
}

export type NeedStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'INTEGRATED';
export type StoryStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'INTEGRATED';
export type PriorityLevel = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
export type Complexity = 'XS' | 'S' | 'M' | 'L' | 'XL';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
}

export interface ProjectSettings {
  startDate: string; // ISO Date YYYY-MM-DD
  team: TeamMember[];
  lastUpdated?: string; // ISO Date String of last global save
}

export interface DayPlan {
  day: number;
  title: string;
  focus: string;
  tasks: Task[];
}

export interface Task {
  id: string;
  description: string;
  completed: boolean;
  assignedTo?: string; // e.g., "Leonardo", "Ramponi"
  duration: number; // Duration in hours (default 1)
  
  // Execution details
  completedAt?: string; // ISO Date YYYY-MM-DD
  attendees?: string; // Comma separated names
  notes?: string; // Description of activity performed
  definitionOfDone?: string; // Criteria for completion
  
  // Link back to need/story
  generatedFromNeedId?: string;
  generatedFromStoryId?: string;
}

export interface EmergingNeed {
  id: string;
  description: string;
  originator: string; // Who requested it
  date: string; // When
  reason: string; // Why
  status: NeedStatus;
  priority: PriorityLevel;
  orderIndex: number; // For manual sorting
  aiAnalysis?: {
    impactLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    explanation: string;
    timestamp: string;
  };
}

export interface UserStory {
  id: string;
  needId: string; // Linked EmergingNeed ID
  needDescription?: string; // Denormalized for display
  
  // Agile Format
  role: string;   // "As a..."
  action: string; // "I want to..."
  benefit: string; // "So that..."
  
  complexity: Complexity;
  definitionOfReady: string; // DoR
  definitionOfDone: string; // DoD
  
  assignedTo: string[]; // List of names
  status: StoryStatus;
  duration: number; // Estimated hours for execution
}

export interface KPIMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
}

export interface LogEntry {
  id: string;
  date: string;
  message: string;
  type: 'info' | 'warning' | 'success';
}
