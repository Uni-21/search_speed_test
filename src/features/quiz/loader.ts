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

function selectRandomQuestionsByDifficulty(questions: Question[]): Question[] {
  // 難易度別の構成: 難易度5(1問), 難易度4(1問), 難易度3(3問), 難易度2(3問), 難易度1(2問)
  const difficultyComposition = [
    { difficulty: 5, count: 1 },
    { difficulty: 4, count: 1 },
    { difficulty: 3, count: 3 },
    { difficulty: 2, count: 3 },
    { difficulty: 1, count: 2 }
  ] as const;
  
  const selectedQuestions: Question[] = [];
  
  for (const { difficulty, count } of difficultyComposition) {
    const questionsOfDifficulty = questions.filter(q => q.difficulty === difficulty);
    
    if (questionsOfDifficulty.length === 0) {
      console.warn(`No questions found for difficulty ${difficulty}`);
      continue;
    }
    
    const shuffled = shuffleArray(questionsOfDifficulty);
    const selected = shuffled.slice(0, count);
    selectedQuestions.push(...selected);
  }
  
  // 最終的にシャッフルして出題順をランダムに
  return shuffleArray(selectedQuestions);
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
    
    // 難易度別構成での問題選択を試行
    const selectedQuestions = selectRandomQuestionsByDifficulty(pool1);
    
    // 十分な問題が選択されなかった場合は、従来の方式でフォールバック
    if (selectedQuestions.length < 10) {
      console.warn('Not enough questions for difficulty-based selection, falling back to random selection');
      return selectRandomQuestions(pool1, 10);
    }
    
    return selectedQuestions;
  } catch (error) {
    console.error('Failed to load questions:', error);
    return [];
  }
}