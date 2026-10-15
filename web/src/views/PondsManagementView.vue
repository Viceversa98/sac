<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePonds } from '../composables/usePonds'
import { useToast } from '../composables/useToast'
import { 
  Layers, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight, 
  Fish, 
  TrendingUp, 
  Award, 
  Scale, 
  ArrowRightLeft, 
  Sparkles,
  Calendar,
  Filter,
  Skull
} from 'lucide-vue-next'

import AddPondModal from '../components/AddPondModal.vue'
import PondGrowthDetailModal from '../components/PondGrowthDetailModal.vue'
import PondCycleActionModal from '../components/PondCycleActionModal.vue'
import PondMortalityModal from '../components/PondMortalityModal.vue'

const router = useRouter()
const { ponds, selectedPondId, setPond, globalFarmMetrics } = usePonds()
const { showToast } = useToast()

// Modal states
const isAddModalOpen = ref(false)
const selectedPondForDetail = ref(null)
const selectedPondForCycleAction = ref(null)
const selectedPondForMortality = ref(null)

// Filter state
const activeStatusFilter = ref('ALL') // 'ALL' | 'ACTIVE' | 'HARVESTED'

const filteredPonds = computed(() => {
  if (activeStatusFilter.value === 'ALL') return ponds.value
  if (activeStatusFilter.value === 'ACTIVE') {
    return ponds.value.filter(p => p.cycleStatus !== 'HARVESTED' && p.cycleStatus !== 'TRANSFERRED')
  }
  if (activeStatusFilter.value === 'HARVESTED') {
    return ponds.value.filter(p => p.cycleStatus === 'HARVESTED' || p.cycleStatus === 'TRANSFERRED')
  }
  return ponds.value
})

// Quick helper calculations
const getBiomassKg = (pond) => {
  return Math.round((pond.fishCount * pond.avgWeightGrams) / 1000)
}

const getDensity = (pond) => {
  const vol = pond.volumeM3 || 50
  return (getBiomassKg(pond) / vol).toFixed(1)
}

const getHarvestProgress = (pond) => {
  const target = pond.targetHarvestWeightGrams || 850
  return Math.min(100, Math.round((pond.avgWeightGrams / target) * 100))
}

const openDetail = (pond) => {
  selectedPondForDetail.value = pond
}

const openCycleAction = (pond) => {
  selectedPondForCycleAction.value = pond
}

const openMortality = (pond) => {
  selectedPondForMortality.value = pond
}

const inspectPond = (pondId) => {
  setPond(pondId)
  router.push('/')
}

const handleCycleActionCompleted = () => {
  // refresh or update modal state
  if (selectedPondForDetail.value) {
    selectedPondForDetail.value = ponds.value.find(p => p.id === selectedPondForDetail.value.id) || null
  }
}

const handleMortalityRecorded = () => {
  if (selectedPondForDetail.value) {
    selectedPondForDetail.value = ponds.value.find(p => p.id === selectedPondForDetail.value.id) || null
  }
}
</script>

<template>
  <div class="ponds-management-view">
    <!-- View Header -->
    <div class="view-header">
      <div class="header-left">
        <div class="icon-box">
          <Layers :size="22" class="text-sky" />
        </div>
        <div>
          <h2 class="view-title font-display">Pond Fleet & Biomass Management</h2>
          <span class="view-sub font-mono">
            Biomass growth tracking, fingerling stocking, harvesting & progressive grading across {{ ponds.length }} biofloc ponds
          </span>
        </div>
      </div>
      <button id="btn-open-add-pond-modal" class="btn-primary font-mono" @click="isAddModalOpen = true">
        <Plus :size="16" />
        <span>Register New Pond</span>
      </button>
    </div>

    <!-- 4 Farm Summary KPIs -->
    <div class="summary-kpis-grid font-mono">
      <div class="kpi-card">
        <div class="kpi-head">
          <span class="kpi-lbl">Total Production Ponds</span>
          <Layers :size="14" class="text-sky" />
        </div>
        <div class="kpi-val-row">
          <span class="val-num text-sky">{{ ponds.length }}</span>
          <span class="val-sub">Active Units</span>
        </div>
        <span class="kpi-note">{{ ponds.filter(p => p.cycleStatus === 'ACTIVE' || !p.cycleStatus).length }} in active culture</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-head">
          <span class="kpi-lbl">Total Live Biomass</span>
          <Fish :size="14" class="text-emerald" />
        </div>
        <div class="kpi-val-row">
          <span class="val-num text-emerald">{{ globalFarmMetrics.totalBiomassKg.toLocaleString() }}</span>
          <span class="val-sub">kg</span>
        </div>
        <span class="kpi-note">+{{ globalFarmMetrics.totalBiomassGainKg.toLocaleString() }} kg net weight gain</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-head">
          <span class="kpi-lbl">Average Farm FCR</span>
          <TrendingUp :size="14" class="text-purple" />
        </div>
        <div class="kpi-val-row">
          <span class="val-num text-purple">{{ globalFarmMetrics.fcr }}</span>
          <span class="val-sub">Ratio</span>
        </div>
        <span class="kpi-note">Target &lt; 1.25 (Biofloc Superior)</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-head">
          <span class="kpi-lbl">Total Cumulative Feed</span>
          <Scale :size="14" class="text-amber" />
        </div>
        <div class="kpi-val-row">
          <span class="val-num text-amber">{{ globalFarmMetrics.totalCumulativeFeedKg.toLocaleString() }}</span>
          <span class="val-sub">kg</span>
        </div>
        <span class="kpi-note">{{ globalFarmMetrics.totalCumulativeMolassesKg }} kg molasses C:N buffer</span>
      </div>
    </div>

    <!-- Filter Bar -->
    <div class="filter-bar font-mono">
      <div class="filter-left">
        <Filter :size="14" class="text-muted" />
        <span class="filter-label">Filter Cycles:</span>
        <div class="filter-chips">
          <button 
            class="chip-btn" 
            :class="{ active: activeStatusFilter === 'ALL' }" 
            @click="activeStatusFilter = 'ALL'"
          >
            All Ponds ({{ ponds.length }})
          </button>
          <button 
            class="chip-btn" 
            :class="{ active: activeStatusFilter === 'ACTIVE' }" 
            @click="activeStatusFilter = 'ACTIVE'"
          >
            Active Growing Cycles ({{ ponds.filter(p => p.cycleStatus !== 'HARVESTED' && p.cycleStatus !== 'TRANSFERRED').length }})
          </button>
          <button 
            class="chip-btn" 
            :class="{ active: activeStatusFilter === 'HARVESTED' }" 
            @click="activeStatusFilter = 'HARVESTED'"
          >
            Harvested / Transferred ({{ ponds.filter(p => p.cycleStatus === 'HARVESTED' || p.cycleStatus === 'TRANSFERRED').length }})
          </button>
        </div>
      </div>
      <span class="record-count text-muted font-mono">{{ filteredPonds.length }} ponds shown</span>
    </div>

    <!-- Ponds Summary Table -->
    <div class="table-container glass-panel">
      <table class="enterprise-table">
        <thead>
          <tr>
            <th>Pond & Dimension</th>
            <th>Species & Cycle State</th>
            <th>Fingerling Stock</th>
            <th>Growth & Harvest Progress</th>
            <th>Live Biomass & Density</th>
            <th>SR (%) & ADG</th>
            <th>Cycle Status</th>
            <th style="text-align: right;">Operations & Tracking</th>
          </tr>
        </thead>
        <tbody>
          <tr 
            v-for="pond in filteredPonds" 
            :key="pond.id"
            :class="{ 'row-active': selectedPondId === pond.id }"
          >
            <!-- Pond Name & Dimension -->
            <td>
              <div class="pond-cell">
                <span class="pond-title font-display">{{ pond.name }}</span>
                <span class="pond-vol font-mono">
                  ID: <strong>{{ pond.id }}</strong> • Vol: <strong>{{ pond.volumeM3 }} m³</strong>
                </span>
              </div>
            </td>

            <!-- Species & Phase -->
            <td>
              <div class="commodity-cell">
                <span class="species-name">{{ pond.species }}</span>
                <span class="phase-tag font-mono">{{ pond.phase }}</span>
                <span class="stocking-meta font-mono text-muted">
                  Tebar: {{ pond.stockingDate || '12 Jan 2026' }} • DOC {{ pond.doc || 60 }}d
                </span>
              </div>
            </td>

            <!-- Population & Seed Weight -->
            <td class="font-mono">
              <span class="count-val">{{ pond.fishCount?.toLocaleString() }} fish</span>
              <span class="weight-sub">
                Initial: {{ pond.initialWeightGrams || 15 }}g • Biomass: {{ pond.initialBiomassKg || 100 }} kg
              </span>
            </td>

            <!-- Growth Progress -->
            <td class="font-mono">
              <div class="growth-progress-cell">
                <div class="abw-row">
                  <span class="curr-abw font-bold text-sky">{{ pond.avgWeightGrams }}g</span>
                  <span class="target-abw text-muted">/ {{ pond.targetHarvestWeightGrams || 850 }}g</span>
                </div>
                <div class="prog-bar-mini">
                  <div class="prog-bar-fill" :style="{ width: getHarvestProgress(pond) + '%' }"></div>
                </div>
                <span class="prog-percent-text">{{ getHarvestProgress(pond) }}% to Target</span>
              </div>
            </td>

            <!-- Live Biomass & Density -->
            <td class="font-mono">
              <span class="biomass-bold text-emerald">
                {{ getBiomassKg(pond).toLocaleString() }} kg
              </span>
              <span class="density-sub">
                {{ getDensity(pond) }} kg/m³
              </span>
            </td>

            <!-- SR% & ADG -->
            <td class="font-mono">
              <span class="text-purple font-bold">{{ pond.survivalRate || 94.5 }}% SR</span>
              <span class="adg-sub text-muted">+{{ pond.adgGramsDay || 4.2 }} g/day</span>
            </td>

            <!-- Cycle Status -->
            <td>
              <span 
                class="status-pill font-mono"
                :class="pond.cycleStatus === 'HARVESTED' ? 'harvested' : (pond.cycleStatus === 'TRANSFERRED' ? 'transferred' : 'active')"
              >
                {{ pond.cycleStatus || 'ACTIVE' }}
              </span>
            </td>

            <!-- Action Buttons -->
            <td>
              <div class="table-actions-row font-mono">
                <!-- Button: Record Mortality -->
                <button 
                  :id="'btn-mortality-' + pond.id"
                  class="btn-act mortality" 
                  title="Record fish mortality (catat kematian ikan)"
                  @click="openMortality(pond)"
                >
                  <Skull :size="12" />
                  <span>Mortality</span>
                </button>

                <!-- Button: Growth Details -->
                <button 
                  :id="'btn-growth-detail-' + pond.id"
                  class="btn-act detail" 
                  title="View detailed growth curve, ADG, SR and sampling history"
                  @click="openDetail(pond)"
                >
                  <TrendingUp :size="12" />
                  <span>Growth</span>
                </button>

                <!-- Button: End Cycle (Harvest / Transfer) -->
                <button 
                  :id="'btn-end-cycle-' + pond.id"
                  class="btn-act cycle" 
                  title="Harvest fish or transfer to another pond"
                  @click="openCycleAction(pond)"
                >
                  <Award :size="12" />
                  <span>End Cycle</span>
                </button>

                <!-- Button: Select / Inspect in Dashboard -->
                <button 
                  :id="'btn-inspect-pond-' + pond.id"
                  class="btn-act inspect"
                  :class="{ selected: selectedPondId === pond.id }"
                  @click="inspectPond(pond.id)"
                  title="Inspect telemetry & controls in Pod Overview"
                >
                  {{ selectedPondId === pond.id ? 'Active' : 'Inspect' }}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modals -->
    <!-- 1. Add Pond Modal -->
    <AddPondModal 
      v-if="isAddModalOpen" 
      @close="isAddModalOpen = false" 
      @created="(p) => setPond(p.id)"
    />

    <!-- 2. Pond Growth Detail Modal -->
    <PondGrowthDetailModal 
      v-if="selectedPondForDetail" 
      :pond="selectedPondForDetail" 
      @close="selectedPondForDetail = null"
      @open-cycle-action="(p) => { selectedPondForDetail = null; selectedPondForCycleAction = p; }"
      @open-mortality="(p) => { openMortality(p); }"
    />

    <!-- 3. Pond Cycle Action Modal (Harvest / Transfer) -->
    <PondCycleActionModal 
      v-if="selectedPondForCycleAction" 
      :pond="selectedPondForCycleAction" 
      @close="selectedPondForCycleAction = null"
      @action-completed="handleCycleActionCompleted"
    />

    <!-- 4. Pond Mortality Modal (Pencatatan Kematian Ikan) -->
    <PondMortalityModal 
      v-if="selectedPondForMortality"
      :pond="selectedPondForMortality"
      @close="selectedPondForMortality = null"
      @recorded="handleMortalityRecorded"
    />
  </div>
</template>

<style scoped>
.ponds-management-view {
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
  padding: 14px 18px;
  box-shadow: var(--shadow-xs);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-box {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-sky { color: var(--sky-600); }
.text-emerald { color: var(--emerald-600); }
.text-purple { color: var(--purple-600); }
.text-amber { color: var(--amber-600); }

.view-title {
  font-size: 1.12rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.view-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
  color: #ffffff;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);
  transition: all 0.15s ease;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4);
}

/* 4 Summary KPIs Grid */
.summary-kpis-grid {
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
  box-shadow: var(--shadow-xs);
}

.kpi-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-lbl {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.kpi-val-row {
  display: flex;
  align-items: baseline;
  gap: 5px;
}

.val-num {
  font-size: 1.35rem;
  font-weight: 800;
  line-height: 1.1;
}

.val-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.kpi-note {
  font-size: 0.62rem;
  color: var(--text-muted);
}

/* Filter Bar */
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 6px 12px;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.filter-chips {
  display: flex;
  gap: 5px;
}

.chip-btn {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.66rem;
  font-weight: 700;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.chip-btn:hover {
  color: var(--text-primary);
}

.chip-btn.active {
  background: var(--sky-600);
  color: #ffffff;
  border-color: var(--sky-600);
}

.record-count {
  font-size: 0.66rem;
}

/* Ponds Table */
.table-container {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow-x: auto;
  box-shadow: var(--shadow-xs);
}

.enterprise-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.76rem;
}

.enterprise-table th {
  padding: 10px 14px;
  background: var(--bg-surface-subtle);
  color: var(--text-muted);
  font-weight: 700;
  font-size: 0.66rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border-bottom: 1px solid var(--border-subtle);
}

.enterprise-table td {
  padding: 11px 14px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
  vertical-align: middle;
}

.enterprise-table tr:last-child td {
  border-bottom: none;
}

.enterprise-table tr:hover {
  background: #f8fafc;
}

.enterprise-table tr.row-active {
  background: #f0f9ff;
}

.pond-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pond-title {
  font-weight: 800;
  font-size: 0.88rem;
  color: var(--text-primary);
}

.pond-vol {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.commodity-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.species-name {
  font-weight: 700;
  font-size: 0.78rem;
  color: var(--text-primary);
}

.phase-tag {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.stocking-meta {
  font-size: 0.62rem;
}

.count-val {
  display: block;
  font-weight: 700;
}

.weight-sub {
  font-size: 0.64rem;
  color: var(--text-muted);
  display: block;
}

/* Growth Progress Cell */
.growth-progress-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
}

.abw-row {
  display: flex;
  align-items: baseline;
  gap: 3px;
  font-size: 0.75rem;
}

.prog-bar-mini {
  width: 100%;
  height: 4px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.prog-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #0284c7, #38bdf8);
  border-radius: 999px;
}

.prog-percent-text {
  font-size: 0.6rem;
  color: var(--text-muted);
}

.biomass-bold {
  font-weight: 800;
  font-size: 0.86rem;
  display: block;
}

.density-sub {
  font-size: 0.64rem;
  color: var(--text-muted);
  display: block;
}

.adg-sub {
  font-size: 0.64rem;
  display: block;
}

/* Status Pill */
.status-pill {
  font-size: 0.62rem;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 4px;
  display: inline-block;
}
.status-pill.active {
  background: var(--emerald-50);
  color: var(--emerald-700);
  border: 1px solid var(--emerald-200);
}
.status-pill.harvested {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #cbd5e1;
}
.status-pill.transferred {
  background: var(--sky-50);
  color: var(--sky-700);
  border: 1px solid var(--sky-200);
}

/* Action Buttons Row */
.table-actions-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
}

.btn-act {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 9px;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-act.mortality {
  background: #ffffff;
  border: 1px solid #fecdd3;
  color: #e11d48;
}
.btn-act.mortality:hover {
  background: #fff1f2;
  border-color: #f43f5e;
}

.btn-act.detail {
  background: #ffffff;
  border: 1px solid var(--border-medium);
  color: var(--sky-700);
}
.btn-act.detail:hover {
  background: var(--sky-50);
  border-color: var(--sky-300);
}

.btn-act.cycle {
  background: #ffffff;
  border: 1px solid var(--border-medium);
  color: var(--amber-700);
}
.btn-act.cycle:hover {
  background: var(--amber-50);
  border-color: var(--amber-300);
}

.btn-act.inspect {
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}
.btn-act.inspect:hover {
  background: #e2e8f0;
}
.btn-act.inspect.selected {
  background: var(--sky-600);
  border-color: var(--sky-600);
  color: #ffffff;
}

@media (max-width: 1024px) {
  .summary-kpis-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
