<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { t } from '../lib/i18n.js';

  const dispatch = createEventDispatcher<{
    answer: { value: string };
    skip: void;
    skipConfirm: void;
    next: void;
  }>();

  let inputValue = '';
  let inputElement: HTMLInputElement;

  function handleSubmit() {
    if (inputValue.trim()) {
      dispatch('answer', { value: inputValue.trim() });
      inputValue = '';
    }
  }

  function handleSkip() {
    dispatch('skipConfirm');
    inputValue = '';
  }

  function focusInput() {
    if (inputElement) {
      inputElement.focus();
    }
  }

  export { focusInput };
</script>

<div class="answer-form">
  <form on:submit|preventDefault={handleSubmit}>
    <input
      bind:this={inputElement}
      bind:value={inputValue}
      type="text"
      placeholder={t('answer_placeholder')}
      class="answer-input"
      autocomplete="off"
    />
    <div class="button-group">
      <button 
        type="submit" 
        class="submit-button"
        disabled={!inputValue.trim()}
      >
        回答
      </button>
      <button 
        type="button" 
        class="skip-button"
        on:click={handleSkip}
      >
        {t('skip')}
      </button>
    </div>
  </form>
</div>

<style>
  .answer-form {
    max-width: 500px;
    margin: 2rem auto;
  }

  .answer-input {
    width: 100%;
    padding: 1rem;
    font-size: 1.1rem;
    border: 2px solid #ddd;
    border-radius: 8px;
    margin-bottom: 1rem;
    box-sizing: border-box;
  }

  .answer-input:focus {
    outline: none;
    border-color: #4CAF50;
  }

  .button-group {
    display: flex;
    gap: 1rem;
    justify-content: center;
  }

  button {
    padding: 0.8rem 2rem;
    font-size: 1rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .submit-button {
    background-color: #4CAF50;
    color: white;
  }

  .submit-button:hover:not(:disabled) {
    background-color: #45a049;
  }

  .submit-button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }

  .skip-button {
    background-color: #f44336;
    color: white;
  }

  .skip-button:hover {
    background-color: #da190b;
  }
</style>