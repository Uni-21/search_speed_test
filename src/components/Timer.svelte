<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { t } from '../lib/i18n.js';

  export let startedAt: number | null = null;

  let elapsedMs = 0;
  let interval: number;

  function formatTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  function updateTimer() {
    if (startedAt) {
      elapsedMs = Date.now() - startedAt;
    }
  }

  onMount(() => {
    interval = setInterval(updateTimer, 100);
  });

  onDestroy(() => {
    if (interval) {
      clearInterval(interval);
    }
  });

  $: {
    updateTimer();
  }
</script>

<div class="timer">
  <span class="label">{t('time')}:</span>
  <span class="time">{formatTime(elapsedMs)}</span>
</div>

<style>
  .timer {
    font-size: 1.2rem;
    font-weight: bold;
    text-align: center;
    margin: 1rem 0;
  }
  
  .label {
    color: #666;
  }
  
  .time {
    color: #333;
    margin-left: 0.5rem;
  }
</style>