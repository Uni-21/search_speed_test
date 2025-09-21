export type Question = {
  id: string;
  prompt: string;
  type: 'text';
  acceptedHash: string[];
  tags?: string[];
  genre: '知識' | '思考力' | '知識＋思考力';
  difficulty: 1 | 2 | 3 | 4 | 5;
};

export type Answer = {
  value: string;
  correct: boolean;
  skipped: boolean;
  timeMs: number;
};

export type QuizSession = {
  status: 'idle' | 'running' | 'finished';
  startedAt: number | null;
  finishedAt: number | null;
  currentIndex: number;
  questions: Question[];
  answers: Answer[];
};

export type Result = {
  totalTimeMs: number;
  correctCount: number;
  skippedCount: number;
  accuracyPct: number;
  speedScorePct: number;
  totalScorePct: number;
  grade: string;
};

export const GRADES = [
  'God', 'Genius', 'SSS', 'SS', 'S', 'A+', 'A', 'A-', 'B+', 'B',
  'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E+', 'E', 'E-'
] as const;

export type Grade = typeof GRADES[number];