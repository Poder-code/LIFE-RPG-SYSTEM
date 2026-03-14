export type TaskCategory =
  | 'Físico'
  | 'Mental'
  | 'Profesional'
  | 'Finanzas'
  | 'Orden'
  | 'Relaciones'
  | 'Disciplina';

// Prioridad percibida por el usuario dentro del día
export type TaskPriority = 'Obligatoria' | 'Principal' | 'Secundaria';

export interface TaskDefinition {
  id: string;
  titulo: string;
  descripcion?: string;
  // Campo histórico: se mantiene por compatibilidad pero la prioridad real es "prioridad"
  obligatoria: boolean;
  minutosEstimados: number;
  categoria: TaskCategory;
  dificultad: 1 | 2 | 3 | 4 | 5;
  impacto: 1 | 2 | 3 | 4 | 5;
  // Nueva estructura de prioridad explícita
  prioridad: TaskPriority;
  // Deadline opcional para esta tarea concreta (HH:MM, hora local del día)
  deadline?: string;
  // Si es verdadera y la prioridad es Obligatoria, reaparece automáticamente cada día
  esPermanente?: boolean;
}

export type BloqueDia = 'Mañana' | 'Tarde' | 'Noche';

export interface TareaPlanificada extends TaskDefinition {
  inicio: string; // ISO date-time
  fin: string;
  minutosReales?: number;
  completada: boolean;
  bloqueDia: BloqueDia;
}

export interface PlanDiario {
  id: string;
  fecha: string; // YYYY-MM-DD
  tareas: TareaPlanificada[];
  minutosTotales: number;
  horaDespertar: string;
  // Hora sugerida de sueño para conseguir un descanso saludable antes de despertar
  horaDormir: string;
  // Deadline global aplicado a tareas obligatorias (si existe)
  deadlineGlobal?: string;
  // Indicadores de sobrecarga y sugerencias del motor inteligente
  alertaSobrecarga?: string;
  sugerencias?: string[];
}

// Personal Development System Models
export type ProductiveMindType = 'Executor' | 'Strategist' | 'Builder' | 'Explorer';

export type ScoreLevel = 'Low' | 'Medium' | 'High' | 'Elite';

export type ProgressLevel = 1 | 2 | 3 | 4 | 5; // 1: Disorganization, 2: Basic Control, 3: Consistency, 4: Optimization, 5: Mastery

export interface UserProfile {
  id: string;
  userId: string;
  disciplineScore: number;
  resilienceScore: number;
  habitsScore: number;
  strategyScore: number;
  mindType: ProductiveMindType;
  disciplineLevel: ProgressLevel;
  resilienceLevel: ProgressLevel;
  habitsLevel: ProgressLevel;
  strategyLevel: ProgressLevel;
  executionLevel: ProgressLevel;
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DiagnosticQuestion {
  id: string;
  category: 'Discipline' | 'Habits' | 'Resilience' | 'Strategic Mindset';
  question: string;
  weight: number; // 1-5, how much this question contributes to the score
}

export interface DiagnosticResult {
  category: string;
  score: number;
  level: ScoreLevel;
  answers: { questionId: string; answer: number }[];
}

export type EventType = 'exam' | 'assignment' | 'study' | 'reminder' | 'personal';

export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: EventType;
  date: Date;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'low' | 'medium' | 'high';
  progress: number; // 0-100
  subtasks: string[]; // Array of Subtask IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface Subtask {
  id: string;
  userId: string;
  title: string;
  date: Date;
  duration: number; // in minutes
  completed: boolean;
  parentEvent: string; // CalendarEvent ID
  createdAt: Date;
  updatedAt: Date;
}

export interface PlannerTask {
  id: string;
  userId: string;
  title: string;
  duration: number;
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  completed: boolean;
  date: string; // YYYY-MM-DD
  createdAt: Date;
}

export interface ProgressMap {
  userId: string;
  areas: {
    discipline: ProgressLevel;
    habits: ProgressLevel;
    resilience: ProgressLevel;
    strategy: ProgressLevel;
    execution: ProgressLevel;
  };
  totalLevel: number;
  unlockedAreas: string[];
}
