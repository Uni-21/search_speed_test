import { GRADES, type Answer, type Result } from './types.js';

const BASE_TIME_SECONDS = 300; // 10 questions × 30 seconds

function clamp(min: number, value: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateResult(
  answers: Answer[], 
  totalTimeMs: number
): Result {
  const totalQuestions = 10;
  const correctCount = answers.filter(a => a.correct && !a.skipped).length;
  const skippedCount = answers.filter(a => a.skipped).length;
  
  const accuracyPct = (correctCount / totalQuestions) * 100;
  
  const elapsedSeconds = totalTimeMs / 1000;
  const speedScorePct = clamp(0, (BASE_TIME_SECONDS / elapsedSeconds) * 100, 100);
  
  const totalScorePct = 0.7 * accuracyPct + 0.3 * speedScorePct;
  
  const grade = getGrade(totalScorePct);

  return {
    totalTimeMs,
    correctCount,
    skippedCount,
    accuracyPct,
    speedScorePct,
    totalScorePct,
    grade
  };
}

function getGrade(totalScore: number): string {
  const thresholds = [
    98, 95, 92, 88, 84, 80, 76, 72, 68, 64,
    60, 56, 52, 48, 44, 40, 36, 32, 28, 0
  ];
  
  for (let i = 0; i < thresholds.length; i++) {
    if (totalScore >= thresholds[i]) {
      return GRADES[i];
    }
  }
  
  return GRADES[GRADES.length - 1];
}