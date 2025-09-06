<script lang="ts">
  import { goto } from '$app/navigation';
  import { t } from '../lib/i18n.js';
  import { loadQuestions } from '../features/quiz/loader.js';
  import { quizStore } from '../features/quiz/quiz.store.js';

  async function startQuiz() {
    const questions = await loadQuestions();
    if (questions.length > 0) {
      quizStore.start(questions);
      goto('/quiz');
    } else {
      alert('問題の読み込みに失敗しました');
    }
  }
</script>

<svelte:head>
  <title>{t('title')}</title>
</svelte:head>

<div class="container">
  <h1 class="title">{t('title')}</h1>
  <p class="description">{t('description')}</p>
  <button class="start-button" on:click={startQuiz}>
    {t('start')}
  </button>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    text-align: center;
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .title {
    font-size: 2.5rem;
    font-weight: bold;
    color: #333;
    margin-bottom: 2rem;
  }

  .description {
    font-size: 1.2rem;
    line-height: 1.6;
    color: #666;
    margin-bottom: 3rem;
    max-width: 600px;
  }

  .start-button {
    font-size: 1.5rem;
    font-weight: bold;
    padding: 1rem 3rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }

  .start-button:hover {
    background-color: #45a049;
    transform: translateY(-2px);
  }

  .start-button:active {
    transform: translateY(0);
  }
</style>
