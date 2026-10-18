<script setup>
import { ref, computed } from 'vue'
import { usePonds } from '../composables/usePonds'
import { 
  Sparkles, 
  Droplets, 
  Thermometer, 
  Biohazard, 
  Activity, 
  Layers, 
  ChevronRight,
  Plus
} from 'lucide-vue-next'
import AddPondModal from './AddPondModal.vue'

const { ponds, selectedPondId, setPond } = usePonds()
const isAddModalOpen = ref(false)

// Overall cluster health assessment
const clusterHealth = computed(() => {
  const criticalCount = ponds.value.filter(p => p.status === 'CRITICAL' || p.status === 'KRITIS').length
  const cautionCount = ponds.value.filter(p => p.status === 'CAUTION' || p.status === 'WASPADA').length

  if (criticalCount > 0) {
    return {
      statusText: `${criticalCount} POND IN CRITICAL STATE`,
      badgeClass: 'badge-rose',
      dotClass: 'danger',
      synthesis: `Warning: ${criticalCount} pond is exhibiting critical parameter shifts (hypoxia/stress). Immediate aerator boost or intervention required.`
    }
  }

  if (cautionCount > 0) {
    return {
      statusText: `${cautionCount} POND REQUIRES ATTENTION`,
      badgeClass: 'badge-amber',
      dotClass: 'warning',
      synthesis: `Advisory: ${cautionCount} pond has elevated readings (ammonia/nitrogen deficit). Co-Pilot recommends organic carbon dosing.`
    }
  }

  return {
    statusText: `${ponds.value.length}/${ponds.value.length} PONDS OPTIMAL EQUILIBRIUM`,
    badgeClass: 'badge-emerald',
    dotClass: 'online',
    synthesis: `All ${ponds.value.length} biofloc production ponds are operating in healthy microbial equilibrium. Dissolved oxygen levels exceed safe thresholds (> 5.0 mg/L), biofloc microbial assimilation is stable, and ammonia levels remain safely negligible.`
  }
})

// Specific analysis for each pond
const pondCards = computed(() => {
  return ponds.value.map(p => {
    let assessmentNote = ''

    if (p.telemetry.do < 4.5) {
      assessmentNote = 'Hypoxia warning: Oxygen below safe threshold.'
    } else if (p.telemetry.ammonia > 0.04) {
      assessmentNote = 'Elevated TAN: Bacterial carbon deficit detected.'
    } else if (p.id === 'A') {
      assessmentNote = 'Kolam A. Simulated tilapia biofloc, 30 m³.'
    } else if (p.id === 'B') {
      assessmentNote = 'Kolam B. Simulated tilapia biofloc, 30 m³.'
    } else {
      assessmentNote = 'Simulated pond.'
    }

    return {
      ...p,
      biomassKg: Math.round(p.fishCount * p.avgWeightGrams / 1000),
      assessmentNote
    }
  })
})
</script>

<template>
  <div class="cluster-overview-section glass-panel">
    <!-- Top Header: Cluster Analysis & Macro State -->
    <div class="cluster-header">
      <div class="header-title-wrap">
        <div class="icon-avatar">
          <Activity class="header-icon" :size="20" aria-hidden="true" />
        </div>
        <div>
          <div class="title-badge-row">
            <h3 class="section-title">Choose a pond</h3>
            <span class="badge" :class="clusterHealth.badgeClass">
              {{ clusterHealth.statusText }}
            </span>
          </div>
          <span class="section-sub">Select a pond to read its water below.</span>
        </div>
      </div>

      <!-- Add Pond Button directly on Dashboard -->
      <button 
        id="btn-dash-add-pond" 
        class="btn-dash-add-pond font-mono"
        @click="isAddModalOpen = true"
        title="Register new production pond to cluster"
      >
        <Plus :size="14" aria-hidden="true" />
        <span>Add a pond</span>
      </button>
    </div>

    <!-- AI Executive Synthesis Banner -->
    <div class="synthesis-box">
      <div class="synthesis-icon">
        <Sparkles :size="16" class="text-purple" />
      </div>
      <div class="synthesis-text">
        <span class="synthesis-label font-display">Co-Pilot Executive Synthesis:</span>
        <p class="synthesis-p">{{ clusterHealth.synthesis }}</p>
      </div>
    </div>

    <!-- Single, Unified 4-Pond Cards Grid (No Duplication!) -->
    <div class="ponds-grid">
      <button 
        v-for="pond in pondCards" 
        :key="pond.id"
        :id="'btn-pond-' + pond.id"
        type="button"
        class="pond-tab-card"
        :aria-pressed="selectedPondId === pond.id"
        :class="{ 
          active: selectedPondId === pond.id,
          'has-danger': pond.status === 'CRITICAL' || pond.status === 'KRITIS',
          'has-warning': pond.status === 'CAUTION' || pond.status === 'WASPADA'
        }"
        @click="setPond(pond.id)"
      >
        <!-- Card Top Details -->
        <div class="card-head-row">
          <div class="pond-name-block">
            <div class="id-tag-row font-mono">
              <span class="pond-id-tag">{{ pond.id }}</span>
              <span class="pond-phase-tag">{{ pond.phase.split('(')[0].trim() }}</span>
            </div>
            <span class="pond-title-text font-display">{{ pond.name }}</span>
          </div>

          <span 
            class="badge" 
            :class="{
              'badge-emerald': pond.status === 'OPTIMAL',
              'badge-amber': pond.status === 'CAUTION' || pond.status === 'WASPADA',
              'badge-rose': pond.status === 'CRITICAL' || pond.status === 'KRITIS'
            }"
          >
            {{ pond.status }}
          </span>
        </div>

        <!-- Live Telemetry Snapshot -->
        <div class="mini-telemetry-row font-mono">
          <div class="mini-telemetry-item" title="Dissolved Oxygen">
            <span class="m-label">DO:</span>
            <span class="m-val" :class="pond.telemetry.do < 4.5 ? 'text-rose' : 'text-sky'">
              {{ pond.telemetry.do }}
            </span>
            <span class="m-unit">mg/L</span>
          </div>

          <div class="mini-telemetry-item" title="Water Temperature">
            <span class="m-label">Temp:</span>
            <span class="m-val">{{ pond.telemetry.temp }}</span>
            <span class="m-unit">°C</span>
          </div>

          <div class="mini-telemetry-item" title="Total ammonia nitrogen">
            <span class="m-label">TAN:</span>
            <span class="m-val" :class="pond.telemetry.ammonia > 0.04 ? 'text-amber' : 'text-emerald'">
              {{ pond.telemetry.ammonia }}
            </span>
            <span class="m-unit">mg/L</span>
          </div>
        </div>

        <!-- AI Pond Assessment Note -->
        <p class="pond-assessment-note">{{ pond.assessmentNote }}</p>

        <!-- Card Bottom Meta -->
        <div class="card-foot-row font-mono">
          <span class="foot-meta">Biomass: <strong>{{ pond.biomassKg }} kg</strong></span>
          <span class="foot-meta">Floc: <strong>{{ pond.telemetry.flocDensity }} mL/L</strong></span>
        </div>
      </button>
    </div>

    <!-- Add Pond Modal on Dashboard -->
    <AddPondModal 
      v-if="isAddModalOpen" 
      @close="isAddModalOpen = false" 
      @created="(p) => setPond(p.id)"
    />
  </div>
</template>

<style scoped>
.cluster-overview-section {
  padding: 14px 18px;
  margin-bottom: 16px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cluster-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-avatar {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--sky-50);
  border: 1px solid var(--sky-100);
  color: var(--sky-600);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.title-badge-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title {
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text-primary);
}

.section-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.btn-dash-add-pond {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 6px;
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  color: var(--sky-700);
  font-size: 0.7rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.btn-dash-add-pond:hover {
  background: var(--sky-600);
  color: #ffffff;
  border-color: var(--sky-600);
  box-shadow: 0 2px 5px rgba(2, 132, 199, 0.25);
}

/* Synthesis Callout Banner */
.synthesis-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--bg-surface);
  border: 1px solid var(--purple-100);
  border-left: 4px solid var(--purple-500);
  padding: 10px 14px;
  border-radius: 8px;
}

.synthesis-icon {
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: var(--purple-100);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.text-purple { color: var(--purple-600); }
.text-sky { color: var(--sky-600); }
.text-emerald { color: var(--emerald-600); }
.text-amber { color: var(--amber-600); }
.text-rose { color: var(--rose-600); }

.synthesis-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.synthesis-label {
  font-size: 0.76rem;
  font-weight: 700;
  color: var(--purple-800);
}

.synthesis-p {
  font-size: 0.78rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Responsive Ponds Unified Cards Grid */
.ponds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.pond-tab-card {
  padding: 12px 14px;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  box-shadow: var(--shadow-xs);
  transition: border-color 200ms ease, background-color 200ms ease;
  position: relative;
  cursor: pointer;
}

.pond-tab-card:hover {
  background: #ffffff;
  border-color: var(--sky-600);
}

.pond-tab-card.active {
  background: #ffffff;
  border-color: var(--sky-500);
  box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.25), var(--shadow-sm);
}

.pond-tab-card.has-danger {
  border-color: var(--rose-400);
  background: #fff5f5;
}

.pond-tab-card.has-warning {
  border-color: var(--amber-400);
}

.card-head-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.pond-name-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.id-tag-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pond-id-tag {
  font-size: 0.65rem;
  font-weight: 800;
  background: var(--sky-50);
  color: var(--sky-700);
  border: 1px solid var(--sky-200);
  padding: 1px 6px;
  border-radius: 4px;
}

.pond-phase-tag {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.pond-title-text {
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.25;
}

/* Mini Telemetry Snapshot */
.mini-telemetry-row {
  display: flex;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 5px 8px;
  font-size: 0.68rem;
}

.mini-telemetry-item {
  display: flex;
  align-items: baseline;
  gap: 3px;
}

.m-label {
  color: var(--text-muted);
  font-size: 0.62rem;
}

.m-val {
  font-weight: 700;
  color: var(--text-primary);
}

.m-unit {
  font-size: 0.58rem;
  color: var(--text-muted);
}

.pond-assessment-note {
  font-size: 0.68rem;
  color: var(--text-secondary);
  line-height: 1.35;
  flex: 1;
}

.card-foot-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: var(--text-muted);
  padding-top: 5px;
  border-top: 1px solid var(--border-subtle);
}

.foot-meta strong {
  color: var(--text-secondary);
}

@media (max-width: 1280px) {
  .ponds-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .cluster-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  .ponds-grid {
    grid-template-columns: 1fr;
  }
}
</style>
