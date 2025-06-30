<script lang="ts">
  import type { QueueStats } from '$lib/types/queue';

  export let stats: QueueStats;
  export let compact: boolean = false;
  export let showLabels: boolean = true;

  // Calculate totals for overview
  $: totalWords =
    stats.passive.total +
    stats.active.total +
    stats.review1.total +
    stats.review2.total +
    stats.review3.total;
  $: totalAvailable =
    stats.passive.available +
    stats.active.available +
    stats.review1.available +
    stats.review2.available +
    stats.review3.available;
  $: totalScheduled =
    stats.passive.scheduled +
    stats.active.scheduled +
    stats.review1.scheduled +
    stats.review2.scheduled +
    stats.review3.scheduled;

  // Stage display configuration
  const stageConfig = [
    {
      key: 'passive' as const,
      label: 'Passive',
      description: 'Learning language → Native',
      color: 'bg-blue-100 text-blue-800',
      icon: '📚'
    },
    {
      key: 'active' as const,
      label: 'Active',
      description: 'Native → Learning language',
      color: 'bg-green-100 text-green-800',
      icon: '✍️'
    },
    {
      key: 'review1' as const,
      label: 'Review 1',
      description: 'Short-term review',
      color: 'bg-yellow-100 text-yellow-800',
      icon: '🔄'
    },
    {
      key: 'review2' as const,
      label: 'Review 2',
      description: 'Medium-term review',
      color: 'bg-orange-100 text-orange-800',
      icon: '🔁'
    },
    {
      key: 'review3' as const,
      label: 'Review 3',
      description: 'Long-term review',
      color: 'bg-purple-100 text-purple-800',
      icon: '⭐'
    }
  ];
</script>

<div class="queue-stats" class:compact>
  {#if showLabels}
    <h3 class="stats-title">Queue Statistics</h3>
  {/if}

  <!-- Overview Section -->
  <div class="overview-section">
    <div class="overview-card">
      <div class="overview-stat">
        <span class="stat-value">{totalAvailable}</span>
        <span class="stat-label">Ready to study</span>
      </div>
      <div class="overview-stat">
        <span class="stat-value">{totalScheduled}</span>
        <span class="stat-label">Scheduled</span>
      </div>
      <div class="overview-stat">
        <span class="stat-value">{stats.learned}</span>
        <span class="stat-label">Learned</span>
      </div>
    </div>
  </div>

  <!-- Stage Details -->
  <div class="stages-section">
    {#each stageConfig as stage (stage.key)}
      {@const stageStats = stats[stage.key]}
      <div class="stage-card" class:has-available={stageStats.available > 0}>
        <div class="stage-header">
          <span class="stage-icon">{stage.icon}</span>
          <div class="stage-info">
            <h4 class="stage-title">{stage.label}</h4>
            {#if !compact}
              <p class="stage-description">{stage.description}</p>
            {/if}
          </div>
          <div class="stage-badge {stage.color}">
            {stageStats.total}
          </div>
        </div>

        {#if !compact || stageStats.available > 0 || stageStats.scheduled > 0}
          <div class="stage-details">
            <div class="detail-item">
              <span class="detail-label">Available now:</span>
              <span class="detail-value" class:highlight={stageStats.available > 0}>
                {stageStats.available}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Scheduled:</span>
              <span class="detail-value">{stageStats.scheduled}</span>
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <!-- Progress Bar -->
  {#if totalWords > 0}
    <div class="progress-section">
      <div class="progress-bar">
        <div
          class="progress-fill learned"
          style="width: {(stats.learned / (totalWords + stats.learned)) * 100}%"
          title="Learned words"
        ></div>
        <div
          class="progress-fill available"
          style="width: {(totalAvailable / (totalWords + stats.learned)) * 100}%"
          title="Available for study"
        ></div>
        <div
          class="progress-fill scheduled"
          style="width: {(totalScheduled / (totalWords + stats.learned)) * 100}%"
          title="Scheduled for later"
        ></div>
      </div>
      <div class="progress-legend">
        <div class="legend-item">
          <div class="legend-color learned"></div>
          <span>Learned ({stats.learned})</span>
        </div>
        <div class="legend-item">
          <div class="legend-color available"></div>
          <span>Available ({totalAvailable})</span>
        </div>
        <div class="legend-item">
          <div class="legend-color scheduled"></div>
          <span>Scheduled ({totalScheduled})</span>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .queue-stats {
    background-color: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    border: 1px solid #e5e7eb;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .queue-stats.compact {
    padding: 1rem;
    gap: 1rem;
  }

  .stats-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #111827;
    margin-bottom: 1rem;
  }

  .compact .stats-title {
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  /* Overview Section */
  .overview-section {
    border-bottom: 1px solid #f3f4f6;
    padding-bottom: 1rem;
  }

  .overview-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #f9fafb;
    border-radius: 0.5rem;
    padding: 1rem;
  }

  .compact .overview-card {
    padding: 0.75rem;
  }

  .overview-stat {
    text-align: center;
  }

  .stat-value {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: #111827;
  }

  .compact .stat-value {
    font-size: 1.25rem;
  }

  .stat-label {
    font-size: 0.875rem;
    color: #4b5563;
    margin-top: 0.25rem;
  }

  .compact .stat-label {
    font-size: 0.75rem;
  }

  /* Stages Section */
  .stages-section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .compact .stages-section {
    gap: 0.5rem;
  }

  .stage-card {
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    transition: all 0.2s;
  }

  .stage-card.has-available {
    border-color: #93c5fd;
    background-color: #eff6ff;
  }

  .compact .stage-card {
    padding: 0.75rem;
  }

  .stage-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .stage-icon {
    font-size: 1.25rem;
    margin-right: 0.75rem;
  }

  .compact .stage-icon {
    font-size: 1.125rem;
    margin-right: 0.5rem;
  }

  .stage-info {
    flex: 1;
  }

  .stage-title {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
  }

  .stage-description {
    font-size: 0.75rem;
    color: #4b5563;
    margin-top: 0.25rem;
  }

  .stage-badge {
    padding: 0.25rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .stage-details {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #f3f4f6;
    display: flex;
    justify-content: space-between;
  }

  .compact .stage-details {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
  }

  .detail-item {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .detail-label {
    font-size: 0.75rem;
    color: #4b5563;
  }

  .detail-value {
    font-size: 0.875rem;
    font-weight: 500;
    color: #111827;
    margin-top: 0.25rem;
  }

  .detail-value.highlight {
    color: #2563eb;
    font-weight: 600;
  }

  /* Progress Section */
  .progress-section {
    padding-top: 1rem;
    border-top: 1px solid #f3f4f6;
  }

  .progress-bar {
    width: 100%;
    height: 0.75rem;
    background-color: #e5e7eb;
    border-radius: 9999px;
    overflow: hidden;
    display: flex;
  }

  .progress-fill {
    height: 100%;
    transition: all 0.3s;
  }

  .progress-fill.learned {
    background-color: #10b981;
  }

  .progress-fill.available {
    background-color: #3b82f6;
  }

  .progress-fill.scheduled {
    background-color: #9ca3af;
  }

  .progress-legend {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 0.75rem;
  }

  .compact .progress-legend {
    gap: 1rem;
    margin-top: 0.5rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    font-size: 0.75rem;
    color: #4b5563;
  }

  .legend-color {
    width: 0.75rem;
    height: 0.75rem;
    border-radius: 9999px;
    margin-right: 0.5rem;
  }

  .legend-color.learned {
    background-color: #10b981;
  }

  .legend-color.available {
    background-color: #3b82f6;
  }

  .legend-color.scheduled {
    background-color: #9ca3af;
  }

  /* Responsive adjustments */
  @media (max-width: 640px) {
    .overview-card {
      flex-direction: column;
      gap: 0.5rem;
    }

    .overview-stat {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }

    .stat-value {
      font-size: 1.125rem;
    }

    .progress-legend {
      flex-direction: column;
      gap: 0.25rem;
    }
  }
</style>
