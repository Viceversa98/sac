<script setup>
import PondSelector from '../components/PondSelector.vue'
import TelemetryCards from '../components/TelemetryCards.vue'
import TodayExecutionSchedule from '../components/TodayExecutionSchedule.vue'
import BioflocScienceCard from '../components/BioflocScienceCard.vue'
import ActuatorMatrix from '../components/ActuatorMatrix.vue'
import TelemetryChart from '../components/TelemetryChart.vue'
import { Activity, Radio, Cpu, Sliders } from 'lucide-vue-next'
</script>

<template>
  <div class="water-telemetry-view">
    <!-- View Header -->
    <div class="view-header glass-panel">
      <div class="header-left">
        <div class="icon-box">
          <Activity :size="22" class="text-sky" />
        </div>
        <div>
          <h2 class="view-title font-display">Water Quality & Real-Time Telemetry</h2>
          <span class="view-sub font-mono">
            High-frequency multi-parameter sensor arrays, 24-hour historical curves, and automated actuator controls
          </span>
        </div>
      </div>
      <div class="header-status font-mono">
        <span class="pulse-dot online"></span>
        <span>RS485 Modbus Bus: 16 Sensors Polling (1.0 Hz)</span>
      </div>
    </div>

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
