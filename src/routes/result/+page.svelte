<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { t } from '../../lib/i18n.js';
  import { quizStore } from '../../features/quiz/quiz.store.js';
  import { calculateResult } from '../../features/quiz/scorer.js';
  import GradeBadge from '../../components/GradeBadge.svelte';
  import type { Result } from '../../features/quiz/types.js';

  let result: Result | null = null;
  
  $: session = $quizStore;
  
  // リアクティブに結果を再計算
  $: if (session.status === 'finished' && !result && session.startedAt) {
    console.log('Reactive calculation triggered');
    if (session.finishedAt) {
      const totalTimeMs = session.finishedAt - session.startedAt;
      result = calculateResult(session.answers, totalTimeMs);
    } else {
      result = calculateResult(session.answers, 300000);
    }
    console.log('Reactive result:', result);
  }

  onMount(() => {
    console.log('Result page mounted, session:', session);
    
    if (session.status !== 'finished') {
      console.log('Session not finished, redirecting to home');
      goto('/');
      return;
    }

    console.log('Session status is finished');
    console.log('startedAt:', session.startedAt);
    console.log('finishedAt:', session.finishedAt);
    console.log('answers:', session.answers);

    if (session.startedAt && session.finishedAt) {
      const totalTimeMs = session.finishedAt - session.startedAt;
      console.log('Calculating result with totalTimeMs:', totalTimeMs);
      result = calculateResult(session.answers, totalTimeMs);
      console.log('Result calculated:', result);
    } else {
      // フォールバック: finishedAtが設定されていない場合
      console.error('Missing timing data, using fallback calculation');
      console.log('startedAt:', session.startedAt, 'finishedAt:', session.finishedAt);
      result = calculateResult(session.answers, 300000); // 5分としてフォールバック
      console.log('Fallback result calculated:', result);
    }
  });

  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function restartQuiz() {
    quizStore.reset();
    goto('/');
  }
</script>

<svelte:head>
  <title>{t('title')} - {t('result.title')}</title>
</svelte:head>

<div class="container">
  <h1 class="title">{t('result.title')}</h1>
  
  {#if result}
    <div class="result-content">
      <div class="grade-section">
        <GradeBadge grade={result.grade} score={result.totalScorePct} />
      </div>
      
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">{t('result.time')}</div>
          <div class="stat-value">{formatTime(result.totalTimeMs)}</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">{t('result.accuracy')}</div>
          <div class="stat-value">{Math.round(result.accuracyPct)}%</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">{t('result.speed_score')}</div>
          <div class="stat-value">{Math.round(result.speedScorePct)}%</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">正解数</div>
          <div class="stat-value">{result.correctCount} / 10</div>
        </div>
        
        <div class="stat-item">
          <div class="stat-label">{t('result.skipped')}</div>
          <div class="stat-value">{result.skippedCount}問</div>
        </div>
        
        <div class="stat-item total-score">
          <div class="stat-label">{t('result.score')}</div>
          <div class="stat-value">{Math.round(result.totalScorePct)}点</div>
        </div>
      </div>
      
      <div class="actions">
        <button class="restart-button" on:click={restartQuiz}>
          {t('restart')}
        </button>
      </div>
    </div>
  {:else}
    <div class="loading">
      <p>結果を計算中...</p>
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    min-height: 100vh;
  }

  .title {
    text-align: center;
    font-size: 2.5rem;
    color: #333;
    margin-bottom: 3rem;
  }

  .result-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3rem;
  }

  .grade-section {
    margin-bottom: 1rem;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    width: 100%;
    max-width: 600px;
  }

  .stat-item {
    text-align: center;
    padding: 1.5rem;
    background-color: #f8f9fa;
    border-radius: 12px;
    border: 1px solid #e9ecef;
  }

  .stat-item.total-score {
    background-color: #e3f2fd;
    border-color: #2196F3;
  }

  .stat-label {
    font-size: 0.9rem;
    color: #666;
    margin-bottom: 0.5rem;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: #333;
  }

  .total-score .stat-value {
    color: #2196F3;
  }

  .actions {
    margin-top: 2rem;
  }

  .restart-button {
    font-size: 1.3rem;
    font-weight: bold;
    padding: 1rem 2.5rem;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.2s, transform 0.1s;
  }

  .restart-button:hover {
    background-color: #45a049;
    transform: translateY(-2px);
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    font-size: 1.2rem;
    color: #666;
  }

  @media (max-width: 768px) {
    .stats-grid {
      grid-template-columns: 1fr;
    }
    
    .title {
      font-size: 2rem;
    }
  }
</style>