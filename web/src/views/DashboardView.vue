<script setup>
import { computed } from 'vue'
import { usePonds } from '../composables/usePonds'
import TodayExecutionSchedule from '../components/TodayExecutionSchedule.vue'
import SimulatedBanner from '../components/SimulatedBanner.vue'
import PageIntro from '../components/PageIntro.vue'

const { ponds, globalFarmMetrics } = usePonds()

const pondNeedsAttention = (pond) => {
  const oxygen = pond.telemetry?.do ?? 6
  const ammonia = pond.telemetry?.ammonia ?? 0
  return oxygen < 5 || ammonia > 0.05
}

const attentionCount = computed(() => ponds.value.filter(pondNeedsAttention).length)

const alertCount = computed(() => {
  return ponds.value.filter((pond) => {
    const oxygen = pond.telemetry?.do ?? 6
    const ammonia = pond.telemetry?.ammonia ?? 0
    return oxygen < 4 || ammonia > 0.07
  }).length
})

const overviewStatus = computed(() => {
  if (attentionCount.value === 0) return 'No pond needs attention right now.'
  const count = attentionCount.value
  return count === 1 ? '1 pond needs attention.' : `${count} ponds need attention.`
})

const pondAssessments = computed(() => {
  return ponds.value.map((pond) => {
    let status = 'Water is stable. Keep the daily check.'
    let keyAction = 'Check this pond today.'

    if (pond.id === 'K01') {
      status = 'Ready to harvest. The fish are near the target weight.'
      keyAction = 'Schedule a partial harvest of 300 kg and cut feed 10% before sampling.'
    } else if (pond.id === 'K02') {
      status = 'Growing well. Ammonia is low and the fish are using feed efficiently.'
      keyAction = 'Keep aeration at 75% and add 600 g of molasses after the afternoon feed.'
    } else if (pond.id === 'K03') {
      status = 'The nursery is stable. Plan a size grade within five days.'
      keyAction = 'Grade fish near 100 g within five days and move them to a grower pond.'
    } else if (pond.id === 'K04') {
      status = 'The biofloc is stable. Keep today’s feed and molasses plan.'
      keyAction = 'Keep the plan: four feeds today and one molasses dose.'
    } else if (pondNeedsAttention(pond)) {
      status = 'This pond needs a closer look before the next feed.'
      keyAction = 'Check oxygen and ammonia, then decide the next dose.'
    }

    const targetHarvestWeight = pond.targetHarvestWeightGrams || 850
    const harvestProgress = Math.min(100, Math.round((pond.avgWeightGrams / targetHarvestWeight) * 100))

    return {
      ...pond,
      status,
      keyAction,
      targetHarvestWeight,
      harvestProgress
    }
  })
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
      <div class="kpi-card">
        <span class="kpi-lbl">Ponds that need attention</span>
        <span class="kpi-num">{{ attentionCount }}</span>
      </div>
      <div class="kpi-card">
        <span class="kpi-lbl">Alerts</span>
        <span class="kpi-num">{{ alertCount }}</span>
      </div>
    </div>

    <p class="gloss">
      DO is dissolved oxygen. TAN is total ammonia. FCR is kilograms of feed for each kilogram of fish gained.
    </p>

    <div class="assessment-cards-grid">
      <article
        v-for="item in pondAssessments"
        :key="item.id"
        class="pond-card"
      >
        <header class="card-head">
          <span class="pond-id">{{ item.id }}</span>
          <h2 class="pond-name">{{ item.name }}</h2>
        </header>
        <p class="pond-status">{{ item.status }}</p>
        <dl class="readings">
          <div>
            <dt>Oxygen (DO)</dt>
            <dd>{{ item.telemetry?.do || 6.2 }} mg/L</dd>
          </div>
          <div>
            <dt>Ammonia (TAN)</dt>
            <dd>{{ item.telemetry?.ammonia || 0.02 }} mg/L</dd>
          </div>
        </dl>
        <div class="harvest">
          <div class="harvest-head">
            <span>Harvest progress</span>
            <span>{{ item.harvestProgress }}%</span>
          </div>
          <div class="prog-track" role="progressbar" :aria-valuenow="item.harvestProgress" aria-valuemin="0" aria-valuemax="100" :aria-label="'Harvest progress for ' + item.name">
            <div class="prog-fill" :style="{ width: item.harvestProgress + '%' }"></div>
          </div>
          <span class="harvest-detail">{{ item.avgWeightGrams }} g of {{ item.targetHarvestWeight }} g</span>
        </div>
        <p class="today-action">
          <span class="today-label">Today’s action</span>
          {{ item.keyAction }}
        </p>
      </article>
    </div>

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
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.kpi-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kpi-lbl,
.harvest-detail,
.today-label,
.gloss {
  font-family: var(--font-sans);
  color: var(--text-secondary);
}

.kpi-lbl {
  font-size: 0.82rem;
  font-weight: 600;
}

.kpi-num {
  font-family: var(--font-mono);
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--text-primary);
}

.kpi-note {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.gloss {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.45;
}

.assessment-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.pond-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.pond-id {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--sky-700);
}

.pond-name {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.pond-status,
.today-action {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
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
  gap: 2px;
}

.readings dt,
.harvest-head,
.today-label {
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.readings dd {
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.95rem;
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
  margin-top: 6px;
}

.prog-fill {
  height: 100%;
  background: var(--emerald-600);
}

.harvest-detail {
  display: block;
  margin-top: 4px;
  font-size: 0.75rem;
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
}
</style>
