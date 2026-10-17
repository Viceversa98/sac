<script setup>
import { computed } from 'vue'
import { usePonds } from '../composables/usePonds'
import { assessPond } from '../pondHealth'
import TodayExecutionSchedule from '../components/TodayExecutionSchedule.vue'
import SimulatedBanner from '../components/SimulatedBanner.vue'
import PageIntro from '../components/PageIntro.vue'
import PondVerdict from '../components/PondVerdict.vue'

const { ponds, globalFarmMetrics } = usePonds()

const verdictRank = { Unhealthy: 0, Watch: 1, Healthy: 2 }

const pondAssessments = computed(() => {
  return ponds.value
    .map((pond) => ({
      ...pond,
      health: assessPond(pond)
    }))
    .sort((left, right) => {
      const rankGap = (verdictRank[left.health.verdict] ?? 9) - (verdictRank[right.health.verdict] ?? 9)
      if (rankGap !== 0) return rankGap
      return String(left.id).localeCompare(String(right.id))
    })
})

const pondsNeedingLook = computed(() => {
  return pondAssessments.value.filter((pond) => pond.health.verdict !== 'Healthy')
})

const alertReadings = computed(() => {
  return pondAssessments.value.flatMap((pond) => {
    return pond.health.problems.map((problem) => ({
      key: `${pond.id}-${problem.id}`,
      pondId: pond.id,
      pondName: pond.name,
      label: problem.label,
      value: problem.value,
      call: problem.call,
      reason: problem.reason
    }))
  })
})

const overviewStatus = computed(() => {
  if (pondsNeedingLook.value.length === 0) return 'No pond needs attention right now.'
  const count = pondsNeedingLook.value.length
  return count === 1 ? '1 pond needs attention.' : `${count} ponds need attention.`
})
</script>

<template>
  <div class="pond-overview-view">
    <SimulatedBanner />
    <PageIntro
      title="Overview"
      purpose="This farm view shows which ponds are ready and what to do today."
      :status="overviewStatus"
    />

    <div class="assessment-cards-grid">
      <article
        v-for="item in pondAssessments"
        :key="item.id"
        class="pond-card"
        :class="`pond-card--${item.health.verdict.toLowerCase()}`"
      >
        <header class="card-head">
          <div class="card-titles">
            <span class="pond-id">{{ item.id }}</span>
            <h2 class="pond-name">{{ item.name }}</h2>
          </div>
          <p class="glance-verdict" :class="`glance-verdict--${item.health.verdict.toLowerCase()}`">
            {{ item.health.verdict }}
          </p>
        </header>
        <PondVerdict :assessment="item.health" :hide-word="true" />
      </article>
    </div>

    <h2 class="secondary-title">Farm totals</h2>
    <div class="farm-kpis">
      <div class="kpi-card">
        <span class="kpi-lbl">Fish weight</span>
        <span class="kpi-num">{{ globalFarmMetrics.totalBiomassKg.toLocaleString() }} kg</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-lbl">Feed per kg of fish</span>
        <span class="kpi-num">{{ globalFarmMetrics.fcr }}</span>
        <span class="kpi-note">Lower is better.</span>
      </div>
      <div class="kpi-card kpi-card--list">
        <span class="kpi-lbl">Ponds that need attention</span>
        <span class="kpi-num">{{ pondsNeedingLook.length }}</span>
        <p v-if="pondsNeedingLook.length === 0" class="kpi-empty">None.</p>
        <ul v-else class="kpi-list">
          <li v-for="pond in pondsNeedingLook" :key="pond.id">
            <span class="kpi-pond">{{ pond.id }} {{ pond.name }}</span>
            <span class="kpi-verdict">{{ pond.health.verdict }}</span>
            <span class="kpi-reason">{{ pond.health.reason }}</span>
          </li>
        </ul>
      </div>
      <div class="kpi-card kpi-card--list">
        <span class="kpi-lbl">Alerts</span>
        <span class="kpi-num">{{ alertReadings.length }}</span>
        <p v-if="alertReadings.length === 0" class="kpi-empty">None.</p>
        <ul v-else class="kpi-list">
          <li v-for="alert in alertReadings" :key="alert.key">
            <span class="kpi-pond">{{ alert.pondId }} {{ alert.pondName }}</span>
            <span class="kpi-reason">{{ alert.label }} {{ alert.value }} is {{ alert.call.toLowerCase() }}.</span>
          </li>
        </ul>
      </div>
    </div>

    <p class="gloss">
      DO is dissolved oxygen. TAN is total ammonia. FCR is kilograms of feed for each kilogram of fish gained.
    </p>

    <TodayExecutionSchedule />
  </div>
</template>

<style scoped>
.pond-overview-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.farm-kpis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.kpi-card--list {
  grid-column: 1 / -1;
}

.kpi-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.kpi-lbl,
.harvest-detail,
.today-label,
.gloss {
  font-family: var(--font-sans);
  color: var(--text-secondary);
}

.kpi-lbl {
  font-size: var(--text-sm);
  font-weight: 600;
}

.secondary-title {
  margin: 8px 0 0;
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text-secondary);
}

.kpi-num {
  font-family: var(--font-mono);
  font-size: var(--text-lg);
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
}

.kpi-note,
.kpi-empty,
.kpi-reason {
  font-size: var(--text-sm);
  color: var(--text-secondary);
}

.kpi-empty {
  margin: 0;
  color: var(--text-primary);
}

.kpi-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  min-width: 0;
}

.kpi-list li {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}

.kpi-pond,
.kpi-verdict,
.kpi-reason {
  overflow-wrap: anywhere;
}

.kpi-pond,
.kpi-verdict {
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--text-primary);
}

.gloss {
  margin: 0;
  font-size: var(--text-sm);
  line-height: 1.5;
  max-width: 68ch;
}

.assessment-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.pond-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
}

.pond-card--watch {
  border-color: var(--amber-700);
}

.pond-card--unhealthy {
  border-color: var(--rose-700);
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.card-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.pond-id {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  font-weight: 700;
  color: var(--sky-700);
}

.pond-name {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}

.glance-verdict {
  margin: 0;
  flex-shrink: 0;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: var(--text-lg);
  font-weight: 700;
  line-height: 1.2;
}

.glance-verdict--healthy {
  background: var(--emerald-50);
  color: var(--emerald-800);
}

.glance-verdict--watch {
  background: var(--amber-50);
  color: var(--amber-800);
}

.glance-verdict--unhealthy {
  background: var(--rose-50);
  color: var(--rose-800);
}

.pond-status,
.today-action {
  margin: 0;
  font-size: var(--text-md);
  line-height: 1.5;
  color: var(--text-primary);
}

.readings {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin: 0;
}

.readings div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.readings dt,
.harvest-head,
.today-label {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--text-secondary);
}

.readings dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--text-primary);
}

.harvest-head {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-sans);
}

.harvest-head span:last-child,
.harvest-detail {
  font-family: var(--font-mono);
}

.prog-track {
  height: 8px;
  border-radius: 999px;
  background: var(--bg-surface-subtle);
  overflow: hidden;
  margin-top: 8px;
}

.prog-fill {
  height: 100%;
  background: var(--emerald-600);
}

.harvest-detail {
  display: block;
  margin-top: 4px;
  font-size: var(--text-xs);
}

.today-action {
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}

.today-label {
  display: block;
  margin-bottom: 2px;
}

@media (max-width: 900px) {
  .farm-kpis,
  .assessment-cards-grid {
    grid-template-columns: 1fr;
  }

  .card-head {
    flex-wrap: wrap;
  }

  .kpi-card--list {
    grid-column: auto;
  }
}
</style>
