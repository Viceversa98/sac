<script setup>
import { computed } from 'vue'
import PondSelector from '../components/PondSelector.vue'
import TelemetryCards from '../components/TelemetryCards.vue'
import TodayExecutionSchedule from '../components/TodayExecutionSchedule.vue'
import BioflocScienceCard from '../components/BioflocScienceCard.vue'
import ActuatorMatrix from '../components/ActuatorMatrix.vue'
import TelemetryChart from '../components/TelemetryChart.vue'
import SimulatedBanner from '../components/SimulatedBanner.vue'
import PageIntro from '../components/PageIntro.vue'
import PondVerdict from '../components/PondVerdict.vue'
import { usePonds } from '../composables/usePonds'
import { assessPond } from '../pondHealth'

const { activePond } = usePonds()
const health = computed(() => assessPond(activePond.value))
</script>

<template>
  <div class="water-telemetry-view">
    <SimulatedBanner />
    <PageIntro
      title="Water"
      purpose="Readings for the selected pond. The chart is replayed data."
    />

    <section class="water-verdict" :aria-label="'Health for ' + activePond.name">
      <h2 class="water-verdict-title">{{ activePond.id }} {{ activePond.name }}</h2>
      <PondVerdict :assessment="health" />
    </section>

    <!-- Pond Selector Bar (Unified & Interactive) -->
    <PondSelector />

    <!-- Real-time Telemetry Condition Gauges (DO, pH, Temp, TAN, Floc, Biomass) -->
    <TelemetryCards />

    <!-- 24-Hour Water Quality History Chart with Safe Thresholds & Min/Max -->
    <TelemetryChart />

    <!-- Equipment & Actuator Matrix Controls -->
    <ActuatorMatrix />

    <!-- Compact Operations Hub: Today's Action Plan & Microbial Science -->
    <div class="operations-grid">
      <TodayExecutionSchedule />
      <BioflocScienceCard />
    </div>
  </div>
</template>

<style scoped>
.water-telemetry-view {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.water-verdict {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
  min-width: 0;
}

.water-verdict-title {
  margin: 0 0 8px;
  font-size: var(--text-lg);
  font-weight: 700;
  overflow-wrap: anywhere;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px 20px;
  box-shadow: var(--shadow-xs);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-box {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--sky-50);
  border: 1px solid var(--sky-100);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.view-title {
  font-size: 1.12rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.view-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.header-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.72rem;
  color: var(--emerald-700);
  background: var(--emerald-50);
  border: 1px solid var(--emerald-200);
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 700;
}

.operations-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 16px;
  align-items: stretch;
}

@media (max-width: 1100px) {
  .operations-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
