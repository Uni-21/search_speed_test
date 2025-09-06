import { writable } from 'svelte/store';
import type { QuizSession, Question, Answer } from './types.js';
import { normalize } from './normalizer.js';
import { checkAnswer } from './hasher.js';

const initialSession: QuizSession = {
  status: 'idle',
  startedAt: null,
  finishedAt: null,
  currentIndex: 0,
  questions: [],
  answers: []
};

function createQuizStore() {
  const { subscribe, set, update } = writable<QuizSession>(initialSession);

  return {
    subscribe,
    
    start(questions: Question[]) {
      const now = Date.now();
      update(session => ({
        ...session,
        status: 'running',
        startedAt: now,
        finishedAt: null,
        currentIndex: 0,
        questions,
        answers: Array(10).fill(null).map(() => ({
          value: '',
          correct: false,
          skipped: false,
          timeMs: 0
        }))
      }));
    },

    async answer(value: string) {
      const normalizedValue = normalize(value);
      
      update(session => {
        if (session.status !== 'running') return session;
        
        const currentQuestion = session.questions[session.currentIndex];
        if (!currentQuestion) return session;

        const timeMs = Date.now() - (session.startedAt || 0);
        
        const newAnswers = [...session.answers];
        newAnswers[session.currentIndex] = {
          value,
          correct: false,
          skipped: false,
          timeMs
        };

        return {
          ...session,
          answers: newAnswers
        };
      });

      let currentSession: QuizSession;
      const unsubscribe = subscribe(s => currentSession = s);
      unsubscribe();

      const currentQuestion = currentSession!.questions[currentSession!.currentIndex];
      const isCorrect = await checkAnswer(normalizedValue, currentQuestion.acceptedHash);
      
      update(session => {
        const newAnswers = [...session.answers];
        newAnswers[session.currentIndex].correct = isCorrect;
        return {
          ...session,
          answers: newAnswers
        };
      });
    },

    skip() {
      update(session => {
        if (session.status !== 'running') return session;
        
        const timeMs = Date.now() - (session.startedAt || 0);
        const newAnswers = [...session.answers];
        newAnswers[session.currentIndex] = {
          value: '',
          correct: false,
          skipped: true,
          timeMs
        };

        return {
          ...session,
          answers: newAnswers
        };
      });
    },

    next() {
      update(session => {
        if (session.status !== 'running') return session;
        
        const nextIndex = session.currentIndex + 1;
        
        if (nextIndex >= 10) {
          return {
            ...session,
            status: 'finished',
            finishedAt: Date.now()
          };
        }

        return {
          ...session,
          currentIndex: nextIndex
        };
      });
    },

    reset() {
      set(initialSession);
    }
  };
}

export const quizStore = createQuizStore();