
export enum Difficulty {
  BEGINNER = 'Principiante',
  INTERMEDIATE = 'Intermedio',
  ADVANCED = 'Avanzado',
  COMBOS = 'Combos & Ritmo'
}

export interface Routine {
  id: string;
  title: string;
  difficulty: Difficulty;
  duration: string;
  objective: string;
  exercises: string[];
  rest: string;
}

export interface DayPlan {
  day: number;
  type: 'workout' | 'rest' | 'active_recovery';
  routineId?: string;
  description: string;
}

export interface Program {
  id: string;
  name: string;
  days: number;
  description: string;
  frequency: string;
  schedule: DayPlan[];
}

export interface Equipment {
  name: string;
  type: string;
  description: string;
  bestFor: string;
  image: string;
}
