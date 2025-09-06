import type { Question } from './types.js';
import pool1Data from '../../data/pool-1.json';

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function selectRandomQuestions(questions: Question[], count: number): Question[] {
  if (questions.length <= count) {
    return shuffleArray(questions);
  }
  
  const shuffled = shuffleArray(questions);
  return shuffled.slice(0, count);
}

export async function loadQuestions(): Promise<Question[]> {
  try {
    const pool1: Question[] = pool1Data;
    
    const selectedQuestions = selectRandomQuestions(pool1, 10);
    
    return selectedQuestions;
  } catch (error) {
    console.error('Failed to load questions:', error);
    return [];
  }
}