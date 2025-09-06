<script lang="ts">
  export let grade: string;
  export let score: number;

  function getGradeColor(grade: string): string {
    const colors: Record<string, string> = {
      'God': '#FFD700',
      'Genius': '#FF6B35', 
      'SSS': '#FF1744',
      'SS': '#E91E63',
      'S': '#9C27B0',
      'A+': '#673AB7',
      'A': '#3F51B5',
      'A-': '#2196F3',
      'B+': '#03A9F4',
      'B': '#00BCD4',
      'B-': '#009688',
      'C+': '#4CAF50',
      'C': '#8BC34A',
      'C-': '#CDDC39',
      'D+': '#FFEB3B',
      'D': '#FFC107',
      'D-': '#FF9800',
      'E+': '#FF5722',
      'E': '#795548',
      'E-': '#607D8B'
    };
    return colors[grade] || '#999';
  }

  $: gradeColor = getGradeColor(grade);
</script>

<div class="grade-badge" style="background-color: {gradeColor}">
  <div class="grade-text">{grade}</div>
  <div class="score-text">{Math.round(score)}点</div>
</div>

<style>
  .grade-badge {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    border-radius: 12px;
    color: white;
    text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    min-width: 120px;
  }

  .grade-text {
    font-size: 2rem;
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .score-text {
    font-size: 1rem;
    opacity: 0.9;
  }
</style>