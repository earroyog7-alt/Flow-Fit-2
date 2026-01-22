
import { Difficulty, Routine, Program, Equipment, DayPlan } from './types';

export const ROUTINES: Routine[] = [
  // PRINCIPIANTE (5)
  { id: 'b1', title: 'Fundamentos del Salto', difficulty: Difficulty.BEGINNER, duration: '10 min', objective: 'Coordinación básica y resistencia inicial', exercises: ['30s Salto básico', '30s Descanso', '10 rondas'], rest: '30s entre intervalos' },
  { id: 'b2', title: 'Ritmo Constante', difficulty: Difficulty.BEGINNER, duration: '12 min', objective: 'Mantener el salto sin interrupciones', exercises: ['45s Salto básico', '15s Descanso', '12 rondas'], rest: '15s entre intervalos' },
  { id: 'b3', title: 'Despertar de Pantorrillas', difficulty: Difficulty.BEGINNER, duration: '15 min', objective: 'Fortalecimiento de tren inferior', exercises: ['30s Salto alternado', '30s Descanso', '15 rondas'], rest: '30s entre intervalos' },
  { id: 'b4', title: 'Primeros Pasos Boxer', difficulty: Difficulty.BEGINNER, duration: '10 min', objective: 'Introducción al paso de boxeador', exercises: ['30s Boxer Step lento', '30s Descanso', '10 rondas'], rest: '30s entre intervalos' },
  { id: 'b5', title: 'Resistencia 50/50', difficulty: Difficulty.BEGINNER, duration: '20 min', objective: 'Sesión larga de baja intensidad', exercises: ['60s Salto básico', '60s Descanso', '10 rondas'], rest: '60s entre intervalos' },

  // INTERMEDIO (5)
  { id: 'i1', title: 'Quema de Grasa HIIT', difficulty: Difficulty.INTERMEDIATE, duration: '20 min', objective: 'Maximizar gasto calórico y agilidad', exercises: ['45s Boxer step', '15s Descanso', '45s Rodillas altas', '15s Descanso', '10 rondas'], rest: '15s entre intervalos' },
  { id: 'i2', title: 'Agilidad Lateral', difficulty: Difficulty.INTERMEDIATE, duration: '18 min', objective: 'Movimiento en varios planos', exercises: ['40s Saltos laterales', '20s Descanso', '40s Skier step', '20s Descanso', '9 rondas'], rest: '20s entre intervalos' },
  { id: 'i3', title: 'Intervalos Piramidales', difficulty: Difficulty.INTERMEDIATE, duration: '22 min', objective: 'Control de la fatiga progresiva', exercises: ['30s Salto veloz', '30s Descanso', '60s Salto veloz', '30s Descanso', '90s Salto veloz', '30s Descanso', '5 rondas'], rest: '30s entre intervalos' },
  { id: 'i4', title: 'Boxer Flow Pro', difficulty: Difficulty.INTERMEDIATE, duration: '25 min', objective: 'Dominio del paso de boxeador fluido', exercises: ['60s Boxer step fluido', '20s Descanso', '15 rondas'], rest: '20s entre intervalos' },
  { id: 'i5', title: 'Dúo Dinámico', difficulty: Difficulty.INTERMEDIATE, duration: '20 min', objective: 'Alternar saltos y básicos', exercises: ['45s Doble giro básico', '15s Descanso', '45s Sprint básico', '15s Descanso', '10 rondas'], rest: '15s entre intervalos' },

  // AVANZADO (5)
  { id: 'a1', title: 'Potencia Explosiva', difficulty: Difficulty.ADVANCED, duration: '20 min', objective: 'Rendimiento deportivo y Double Unders', exercises: ['60s Double Unders', '20s Descanso', '60s Crossovers', '20s Descanso', '10 rondas'], rest: '20s entre intervalos' },
  { id: 'a2', title: 'Triple Amenaza', difficulty: Difficulty.ADVANCED, duration: '25 min', objective: 'Resistencia en alta velocidad', exercises: ['45s Double Unders', '45s Sprint pies alternos', '45s Crossovers', '15s Descanso', '8 rondas'], rest: '15s entre intervalos' },
  { id: 'a3', title: 'Maestría en Crossovers', difficulty: Difficulty.ADVANCED, duration: '15 min', objective: 'Coordinación compleja de brazos', exercises: ['60s Crossovers constantes', '20s Descanso', '11 rondas'], rest: '20s entre intervalos' },
  { id: 'a4', title: 'Tabata Infernal', difficulty: Difficulty.ADVANCED, duration: '16 min', objective: 'Máximo VO2 Max', exercises: ['20s Sprint máximo', '10s Descanso', '32 rondas'], rest: '10s entre intervalos' },
  { id: 'a5', title: 'Desafío Double Under', difficulty: Difficulty.ADVANCED, duration: '30 min', objective: 'Resistencia pura en dobles', exercises: ['2 min Salto libre enfocado en dobles', '1 min Descanso activo', '10 rondas'], rest: '1 min entre bloques' },

  // COMBOS & RITMO (5)
  { id: 'c1', title: 'The Beat Master', difficulty: Difficulty.COMBOS, duration: '15 min', objective: 'Sincronizar saltos con 130 BPM', exercises: ['60s Salto a tempo', '20s Descanso', '60s Combo 1-2 (Básico-Boxer)', '20s Descanso', '8 rondas'], rest: '20s entre intervalos' },
  { id: 'c2', title: 'Flow & Style', difficulty: Difficulty.COMBOS, duration: '18 min', objective: 'Fluidez en transiciones de trucos', exercises: ['45s Side Swings to Jump', '45s Crossovers', '30s Descanso', '9 rondas'], rest: '30s entre intervalos' },
  { id: 'c3', title: 'Disco Jump Fever', difficulty: Difficulty.COMBOS, duration: '12 min', objective: 'Coordinación rítmica rápida', exercises: ['30s Heel-Toe Step', '30s Side Straddle', '30s Descanso', '8 rondas'], rest: '30s entre intervalos' },
  { id: 'c4', title: 'Maestro de Transiciones', difficulty: Difficulty.COMBOS, duration: '20 min', objective: 'Cambios de ritmo sin fallos', exercises: ['60s Básico-Lateral-Boxer-High Knees', '30s Descanso', '13 rondas'], rest: '30s entre intervalos' },
  { id: 'c5', title: 'Rhythm Marathon', difficulty: Difficulty.COMBOS, duration: '25 min', objective: 'Mantener el "Flow" en estado de fatiga', exercises: ['90s Estilo libre con música activa', '30s Descanso', '10 rondas'], rest: '30s entre bloques' }
];

const generateSchedule = (totalDays: number, level: 'beginner' | 'intermediate' | 'advanced'): DayPlan[] => {
  const schedule: DayPlan[] = [];
  const routinePrefix = level === 'beginner' ? 'b' : level === 'intermediate' ? 'i' : 'a';
  
  for (let i = 1; i <= totalDays; i++) {
    if (i % 4 === 0) {
      schedule.push({ day: i, type: 'rest', description: 'Descanso total para recuperación muscular.' });
    } else if (i % 7 === 0) {
      schedule.push({ day: i, type: 'active_recovery', description: 'Caminata ligera o estiramientos profundos.' });
    } else {
      const routineIndex = (i % 5) + 1;
      schedule.push({ 
        day: i, 
        type: 'workout', 
        routineId: `${routinePrefix}${routineIndex}`,
        description: `Entrenamiento de enfoque en ${level}.`
      });
    }
  }
  return schedule;
};

export const PROGRAMS: Program[] = [
  {
    id: 'p7',
    name: 'Desafío de 7 Días: Kickstart',
    days: 7,
    description: 'Ideal para despertar el cuerpo y aprender la técnica básica sin lesiones.',
    frequency: 'Diario (15 min)',
    schedule: generateSchedule(7, 'beginner')
  },
  {
    id: 'p14',
    name: '14 Días: Transformación Cardio',
    days: 14,
    description: 'Enfocado en mejorar la capacidad pulmonar y coordinación rítmica.',
    frequency: '5 días/semana (25 min)',
    schedule: generateSchedule(14, 'intermediate')
  },
  {
    id: 'p30',
    name: '30 Días: Flow Pro',
    days: 30,
    description: 'Programa completo para dominar trucos, double unders y quemar grasa de forma masiva.',
    frequency: '6 días/semana (35 min)',
    schedule: generateSchedule(30, 'advanced')
  }
];

export const EQUIPMENTS: Equipment[] = [
  {
    name: 'Cuerda Segmentada (Beaded)',
    type: 'Feedback táctil',
    description: 'Tiene cuentas de plástico que hacen ruido al golpear el suelo, proporcionando un excelente feedback auditivo y rítmico.',
    bestFor: 'Trucos de coordinación y estilo libre',
    image: 'https://images.unsplash.com/photo-1658421868478-436d6a5952d7?auto=format&fit=crop&q=80&w=800'
  }
];
