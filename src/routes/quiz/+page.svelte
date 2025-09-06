<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { t } from '../../lib/i18n.js';
  import { quizStore } from '../../features/quiz/quiz.store.js';
  import Timer from '../../components/Timer.svelte';
  import AnswerForm from '../../components/AnswerForm.svelte';

  let answerForm: AnswerForm;
  let showCorrectNotification = false;
  let showIncorrectNotification = false;

  $: session = $quizStore;
  $: currentQuestion = session.questions[session.currentIndex];

  onMount(() => {
    if (session.status !== 'running') {
      goto('/');
      return;
    }
  });

  async function handleAnswer(event: CustomEvent<{ value: string }>) {
    await quizStore.answer(event.detail.value);
    
    // 最新の状態を取得
    const currentSession = $quizStore;
    const currentAnswer = currentSession.answers[currentSession.currentIndex];
    
    if (currentAnswer.correct) {
      // 正解時は通知を表示してすぐに次に進む
      showCorrectNotification = true;
      setTimeout(() => {
        showCorrectNotification = false;
      }, 2000);
      handleNext();
    } else {
      // 不正解時もトースト通知で表示
      showIncorrectNotification = true;
      setTimeout(() => {
        showIncorrectNotification = false;
      }, 3000); // 不正解は少し長めに表示
    }
  }

  function handleNext() {
    quizStore.next();
    
    if ($quizStore.status !== 'finished') {
      // フォーカスを次の問題用にリセット
      setTimeout(() => {
        if (answerForm) {
          answerForm.focusInput();
        }
      }, 100);
    }
  }

  function goToResult() {
    goto('/result');
  }

  function handleSkip() {
    quizStore.skip();
    handleNext();
  }
</script>

<svelte:head>
  <title>{t('title')} - {t('question')} {session.currentIndex + 1}</title>
</svelte:head>

{#if session.status === 'running'}
  <div class="container">
    {#if showCorrectNotification}
      <div class="correct-notification">
        ✅ 正解です！
      </div>
    {/if}
    
    {#if showIncorrectNotification}
      <div class="incorrect-notification">
        ❌ 不正解です
      </div>
    {/if}
    
    <div class="header">
      <div class="question-number">
        {session.status === 'finished' ? 'クイズ完了' : `${t('question')} ${session.currentIndex + 1} / 10`}
      </div>
      <Timer startedAt={session.startedAt} />
    </div>
    
    <div class="question-content">
      {#if session.status === 'finished'}
        <h2 class="completion-text">お疲れさまでした！<br>全ての問題が完了しました。</h2>
        <div class="result-button-container">
          <button class="result-button" on:click={goToResult}>
            結果を見る
          </button>
        </div>
      {:else if currentQuestion}
        <h2 class="question-text">{currentQuestion.prompt}</h2>
        
        <AnswerForm 
          bind:this={answerForm}
          on:answer={handleAnswer}
          on:skip={handleSkip}
        />
      {/if}
    </div>
  </div>
{:else}
  <div class="loading">
    <p>問題を読み込み中...</p>
  </div>
{/if}

<style>
  .container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    position: relative;
  }

  .correct-notification {
    position: fixed;
    top: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: #4CAF50;
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    font-size: 1.2rem;
    font-weight: bold;
    z-index: 1000;
    animation: slideDown 0.3s ease-out;
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }

  .incorrect-notification {
    position: fixed;
    top: 2rem;
    left: 50%;
    transform: translateX(-50%);
    background-color: #f44336;
    color: white;
    padding: 1rem 2rem;
    border-radius: 8px;
    font-size: 1.2rem;
    font-weight: bold;
    z-index: 1000;
    animation: slideDown 0.3s ease-out;
    box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-100%);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 3rem;
    padding: 1rem;
    background-color: #f5f5f5;
    border-radius: 8px;
  }

  .question-number {
    font-size: 1.1rem;
    font-weight: bold;
    color: #333;
  }

  .question-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .question-text {
    font-size: 2rem;
    text-align: center;
    color: #333;
    margin-bottom: 3rem;
    line-height: 1.4;
  }

  .completion-text {
    font-size: 2rem;
    text-align: center;
    color: #333;
    margin-bottom: 3rem;
    line-height: 1.4;
  }

  .result-button-container {
    text-align: center;
  }

  .result-button {
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

  .result-button:hover {
    background-color: #45a049;
    transform: translateY(-2px);
  }

  .result-button:active {
    transform: translateY(0);
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    font-size: 1.2rem;
    color: #666;
  }

  @media (max-width: 768px) {
    .header {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }

    .question-text {
      font-size: 1.5rem;
    }
  }
</style>