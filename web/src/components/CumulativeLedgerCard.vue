<script setup>
import { ref, computed, watch } from 'vue'
import { usePonds } from '../composables/usePonds'
import { 
  Scale, 
  Utensils, 
  Pipette, 
  TrendingUp, 
  Sparkles, 
  User, 
  CheckCircle2, 
  Clock, 
  Filter,
  Layers,
  ArrowUpRight,
  Building2,
  SlidersHorizontal
} from 'lucide-vue-next'

const { ponds, activePond, globalFarmMetrics, operationalLogs } = usePonds()

// Scope can be 'TOTAL' or specific pond ID 'K01' | 'K02' | 'K03' | 'K04'
const selectedPondScope = ref(activePond.value?.id || 'K04')
const selectedCategory = ref('ALL')
const selectedSource = ref('ALL') // 'ALL' | 'AUTO' | 'MANUAL_ADJUST'

// Keep synced with active pond if not explicitly set to TOTAL
watch(() => activePond.value?.id, (newId) => {
  if (selectedPondScope.value !== 'TOTAL' && newId) {
    selectedPondScope.value = newId
  }
})

// Dynamic metrics depending on whether Farm Total or Specific Pond is selected
const currentMetrics = computed(() => {
  if (selectedPondScope.value === 'TOTAL') {
    const totalStocking = ponds.value.reduce((acc, p) => acc + (p.initialBiomassKg || 0), 0)
    const totalTodayFeed = ponds.value.reduce((acc, p) => acc + (p.actuators.feeder.dispensedTodayKg || 0), 0)
    const totalTodayMolasses = ponds.value.reduce((acc, p) => acc + (p.todayMolassesGrams || 0), 0)

    return {
      scopeTitle: 'Farm Cluster Aggregation (All 4 Ponds)',
      scopeSub: 'Consolidated cumulative input ledger across all active grow-out and nursery units',
      scopeBadge: 'TOTAL FARM CLUSTER',
      cumulativeFeedKg: globalFarmMetrics.value.totalCumulativeFeedKg,
      todayFeedKg: Number(totalTodayFeed.toFixed(1)),
      cumulativeMolassesKg: globalFarmMetrics.value.totalCumulativeMolassesKg,
      todayMolassesGrams: totalTodayMolasses,
      estimatedFcr: globalFarmMetrics.value.fcr,
      fcrRating: 'CLUSTER WEIGHTED EXCELLENT',
      fcrBadgeClass: 'badge-emerald',
      currentBiomassKg: globalFarmMetrics.value.totalBiomassKg,
      stockingBiomassKg: totalStocking,
      netGainKg: globalFarmMetrics.value.totalBiomassGainKg,
      growthPercent: Math.round((globalFarmMetrics.value.totalBiomassGainKg / Math.max(1, totalStocking)) * 100),
      formulaText: `${globalFarmMetrics.value.totalCumulativeFeedKg.toLocaleString()}kg Total Feed ÷ ${globalFarmMetrics.value.totalBiomassGainKg.toLocaleString()}kg Net Gain`
    }
  }

  const p = ponds.value.find(p => p.id === selectedPondScope.value) || activePond.value
  const currentBiomassKg = Math.round(p.fishCount * p.avgWeightGrams / 1000)
  const stockingBiomassKg = p.initialBiomassKg || 380
  const netGainKg = Math.max(1, currentBiomassKg - stockingBiomassKg)
  const cumulativeFeedKg = Number((p.cumulativeFeedKg || 1200).toFixed(1))
  const estimatedFcr = Number((cumulativeFeedKg / netGainKg).toFixed(2))

  let fcrRating = 'EXCELLENT'
  let fcrBadgeClass = 'badge-emerald'
  if (estimatedFcr > 1.3) {
    fcrRating = 'ELEVATED'
    fcrBadgeClass = 'badge-amber'
  } else if (estimatedFcr > 1.5) {
    fcrRating = 'HIGH / CAUTION'
    fcrBadgeClass = 'badge-rose'
  }

  return {
    scopeTitle: `${p.name}`,
    scopeSub: `${p.species} • ${p.phase} • Volume: ${p.volumeM3} m³`,
    scopeBadge: `${p.id} POND METRICS`,
    cumulativeFeedKg,
    todayFeedKg: p.actuators.feeder.dispensedTodayKg,
    cumulativeMolassesKg: Number((p.cumulativeMolassesKg || 25).toFixed(1)),
    todayMolassesGrams: p.todayMolassesGrams || 500,
    estimatedFcr,
    fcrRating,
    fcrBadgeClass,
    currentBiomassKg,
    stockingBiomassKg,
    netGainKg,
    growthPercent: Math.round((netGainKg / stockingBiomassKg) * 100),
    formulaText: `${cumulativeFeedKg}kg Feed ÷ ${netGainKg}kg Net Gain`
  }
})

// Filtered operational logs for active pond or relevant events
const filteredLogs = computed(() => {
  return operationalLogs.value.filter(log => {
    // If specific pond is selected (and not TOTAL), filter by pondId
    if (selectedPondScope.value !== 'TOTAL' && log.pondId && log.pondId !== selectedPondScope.value) {
      return false
    }

    if (selectedCategory.value !== 'ALL' && log.category !== selectedCategory.value) {
      return false
    }

    if (selectedSource.value !== 'ALL' && log.type !== selectedSource.value) {
      return false
    }

    return true
  })
})
</script>

<template>
  <div class="ledger-panel glass-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-left">
        <Scale class="header-icon text-sky" :size="20" />
        <div>
          <h3 class="panel-title font-display">Input Accumulation Ledger & Live FCR Biomass Analytics</h3>
          <span class="panel-sub font-mono">{{ currentMetrics.scopeTitle }}</span>
        </div>
      </div>
      <div class="header-status-pill font-mono">
        <span class="pulse-dot online"></span>
        <span>Biofloc Conversion Target: FCR &lt; 1.25</span>
      </div>
    </div>

    <!-- Scope Selector: 1 Pond vs Farm Total -->
    <div class="scope-selector-bar font-mono">
      <div class="scope-label-wrap">
        <SlidersHorizontal :size="13" class="text-sky" />
        <span class="scope-label">View Scope:</span>
      </div>
      <div class="scope-pills">
        <button 
          id="btn-scope-total"
          class="scope-btn total"
          :class="{ active: selectedPondScope === 'TOTAL' }"
          @click="selectedPondScope = 'TOTAL'"
        >
          <Building2 :size="12" />
          <span>Farm Total (All 4 Ponds)</span>
        </button>
        <button 
          v-for="p in ponds" 
          :key="p.id"
          :id="'btn-scope-' + p.id"
          class="scope-btn"
          :class="{ active: selectedPondScope === p.id }"
          @click="selectedPondScope = p.id"
        >
          <span>{{ p.id }}: {{ p.name.split('—')[0].replace('Pond #', 'P#') }}</span>
        </button>
      </div>
    </div>

    <!-- 4 Aggregation & Parameter Cards -->
    <div class="kpi-grid">
      <!-- KPI 1: Cumulative Feed -->
      <div class="kpi-card">
        <div class="kpi-top">
          <div class="kpi-icon-wrap sky">
            <Utensils :size="16" />
          </div>
          <span class="kpi-badge badge-sky font-mono">
            {{ selectedPondScope === 'TOTAL' ? 'FARM CUMULATIVE FEED' : 'POND CUMULATIVE FEED' }}
          </span>
        </div>
        <div class="kpi-body">
          <span class="kpi-label">Cumulative Feed Delivered (Cycle)</span>
          <div class="kpi-value-row">
            <span class="kpi-val font-mono">{{ currentMetrics.cumulativeFeedKg?.toLocaleString() }}</span>
            <span class="kpi-unit">kg</span>
          </div>
          <div class="kpi-sub-line font-mono">
            <span>Today: <strong class="text-sky">{{ currentMetrics.todayFeedKg }} kg</strong></span>
            <span>•</span>
            <span>Ration: 32% Protein</span>
          </div>
        </div>
      </div>

      <!-- KPI 2: Cumulative Molasses Carbon -->
      <div class="kpi-card">
        <div class="kpi-top">
          <div class="kpi-icon-wrap amber">
            <Pipette :size="16" />
          </div>
          <span class="kpi-badge badge-amber font-mono">
            {{ selectedPondScope === 'TOTAL' ? 'TOTAL CARBON SOURCE' : 'POND CARBON SOURCE' }}
          </span>
        </div>
        <div class="kpi-body">
          <span class="kpi-label">Cumulative Molasses (Cycle)</span>
          <div class="kpi-value-row">
            <span class="kpi-val font-mono">{{ currentMetrics.cumulativeMolassesKg }}</span>
            <span class="kpi-unit">kg</span>
          </div>
          <div class="kpi-sub-line font-mono">
            <span>Today: <strong class="text-amber">{{ currentMetrics.todayMolassesGrams }} g</strong></span>
            <span>•</span>
            <span>C:N 15:1 Buffer</span>
          </div>
        </div>
      </div>

      <!-- KPI 3: Live Estimated FCR -->
      <div class="kpi-card highlight-fcr">
        <div class="kpi-top">
          <div class="kpi-icon-wrap emerald">
            <TrendingUp :size="16" />
          </div>
          <span class="kpi-badge font-mono" :class="currentMetrics.fcrBadgeClass">
            {{ currentMetrics.fcrRating }}
          </span>
        </div>
        <div class="kpi-body">
          <span class="kpi-label">
            {{ selectedPondScope === 'TOTAL' ? 'Cluster Weighted FCR' : 'Live Estimated FCR' }}
          </span>
          <div class="kpi-value-row">
            <span class="kpi-val font-mono text-emerald">{{ currentMetrics.estimatedFcr }}</span>
            <span class="kpi-sub-fcr font-mono text-muted">kg feed / kg fish</span>
          </div>
          <div class="kpi-formula-box font-mono">
            <span>{{ currentMetrics.formulaText }}</span>
          </div>
        </div>
      </div>

      <!-- KPI 4: Fish Biomass & Net Gain -->
      <div class="kpi-card">
        <div class="kpi-top">
          <div class="kpi-icon-wrap cyan">
            <Layers :size="16" />
          </div>
          <span class="kpi-badge badge-cyan font-mono">+{{ currentMetrics.growthPercent }}% GROWTH</span>
        </div>
        <div class="kpi-body">
          <span class="kpi-label">
            {{ selectedPondScope === 'TOTAL' ? 'Total Cluster Biomass' : 'Current Fish Biomass' }}
          </span>
          <div class="kpi-value-row">
            <span class="kpi-val font-mono">{{ currentMetrics.currentBiomassKg?.toLocaleString() }}</span>
            <span class="kpi-unit">kg</span>
          </div>
          <div class="kpi-sub-line font-mono">
            <span>Stocking: {{ currentMetrics.stockingBiomassKg?.toLocaleString() }} kg</span>
            <span>•</span>
            <span>Gain: <strong class="text-emerald">+{{ currentMetrics.netGainKg?.toLocaleString() }} kg</strong></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Operational Ledger Stream Section -->
    <div class="stream-section">
      <div class="stream-header-row">
        <div class="stream-title-group">
          <Clock :size="15" class="text-sky" />
          <span class="stream-title font-display">Operational Action & Adjustment Trail</span>
          <span class="stream-count font-mono">
            ({{ filteredLogs.length }} events {{ selectedPondScope === 'TOTAL' ? 'across all ponds' : 'for ' + selectedPondScope }})
          </span>
        </div>

        <!-- Filter Controls: Category & Origin Source -->
        <div class="filter-controls-wrap">
          <!-- Source Pill (AUTO vs MANUAL_ADJUST) -->
          <div class="source-filter-pills font-mono">
            <button 
              class="filter-pill"
              :class="{ active: selectedSource === 'ALL' }"
              @click="selectedSource = 'ALL'"
            >
              All Sources
            </button>
            <button 
              class="filter-pill auto"
              :class="{ active: selectedSource === 'AUTO' }"
              @click="selectedSource = 'AUTO'"
            >
              <Sparkles :size="11" />
              <span>AUTO</span>
            </button>
            <button 
              class="filter-pill manual"
              :class="{ active: selectedSource === 'MANUAL_ADJUST' }"
              @click="selectedSource = 'MANUAL_ADJUST'"
            >
              <User :size="11" />
              <span>MANUAL</span>
            </button>
          </div>

          <!-- Category Pill -->
          <div class="category-filter-pills font-mono">
            <button 
              class="cat-pill"
              :class="{ active: selectedCategory === 'ALL' }"
              @click="selectedCategory = 'ALL'"
            >
              All Types
            </button>
            <button 
              class="cat-pill"
              :class="{ active: selectedCategory === 'FEEDING' }"
              @click="selectedCategory = 'FEEDING'"
            >
              Feed
            </button>
            <button 
              class="cat-pill"
              :class="{ active: selectedCategory === 'MOLASSES' }"
              @click="selectedCategory = 'MOLASSES'"
            >
              Molasses
            </button>
            <button 
              class="cat-pill"
              :class="{ active: selectedCategory === 'AERATION' }"
              @click="selectedCategory = 'AERATION'"
            >
              Aeration
            </button>
            <button 
              class="cat-pill"
              :class="{ active: selectedCategory === 'SIPHON_FLUSH' }"
              @click="selectedCategory = 'SIPHON_FLUSH'"
            >
              Flush
            </button>
            <button 
              class="cat-pill"
              :class="{ active: selectedCategory === 'MORTALITY_LOG' }"
              @click="selectedCategory = 'MORTALITY_LOG'"
            >
              Mortality
            </button>
          </div>
        </div>
      </div>

      <!-- Log Entries Table / List -->
      <div class="log-entries-table-wrapper">
        <table class="ledger-table font-mono">
          <thead>
            <tr>
              <th style="width: 120px;">Timestamp</th>
              <th v-if="selectedPondScope === 'TOTAL'" style="width: 140px;">Pond</th>
              <th style="width: 165px;">Trigger Provenance</th>
              <th style="width: 190px;">Action Description</th>
              <th style="width: 110px;">Dosage Given</th>
              <th>Biological Notes & Impact</th>
              <th style="width: 85px; text-align: right;">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in filteredLogs" :key="log.id" class="log-row">
              <td class="time-cell">
                <span class="time-str">{{ log.time }}</span>
                <span class="id-str">{{ log.id }}</span>
              </td>
              <td v-if="selectedPondScope === 'TOTAL'">
                <span class="pond-pill font-mono">{{ log.pondName.split('—')[0].trim() }}</span>
              </td>
              <td>
                <span 
                  class="source-badge"
                  :class="log.type === 'AUTO' ? 'source-auto' : 'source-manual'"
                >
                  <component :is="log.type === 'AUTO' ? Sparkles : User" :size="12" />
                  <span>{{ log.type === 'AUTO' ? 'AUTO (AI Loop)' : 'MANUAL ADJUST' }}</span>
                </span>
                <span class="actor-subtext">{{ log.actor }}</span>
              </td>
              <td>
                <span class="action-desc font-sans">{{ log.action }}</span>
                <span class="hardware-sub">{{ log.hardware }}</span>
              </td>
              <td>
                <span class="dosage-tag" :class="log.category.toLowerCase()">
                  {{ log.dosage }}
                </span>
              </td>
              <td class="notes-cell font-sans">
                {{ log.notes }}
              </td>
              <td style="text-align: right;">
                <span class="status-pill">
                  <CheckCircle2 :size="12" class="text-emerald" />
                  <span>{{ log.status }}</span>
                </span>
              </td>
            </tr>
            <tr v-if="filteredLogs.length === 0">
              <td :colspan="selectedPondScope === 'TOTAL' ? 7 : 6" class="empty-cell font-sans">
                No recorded operational activities match the selected filter criteria for {{ currentMetrics.scopeTitle }}.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ledger-panel {
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

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  color: var(--sky-600);
}

.panel-title {
  font-size: 1.02rem;
  font-weight: 800;
  color: var(--text-primary);
}

.panel-sub {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.header-status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--emerald-700);
  background: var(--emerald-50);
  border: 1px solid var(--emerald-200);
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 600;
}

/* Scope Selector Bar: 1 Pond vs Farm Total */
.scope-selector-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  flex-wrap: wrap;
}

.scope-label-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.scope-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.scope-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.scope-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.scope-btn:hover {
  color: var(--text-primary);
  border-color: var(--border-medium);
}

.scope-btn.active {
  background: var(--sky-600);
  color: #ffffff;
  border-color: var(--sky-600);
  box-shadow: 0 1px 4px rgba(2, 132, 199, 0.25);
}

.scope-btn.total.active {
  background: #0f172a;
  color: #ffffff;
  border-color: #0f172a;
}

/* 4 KPI Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.kpi-card {
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.2s ease;
}

.kpi-card:hover {
  background: #ffffff;
  border-color: var(--border-medium);
  box-shadow: var(--shadow-xs);
}

.kpi-card.highlight-fcr {
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  border-color: var(--emerald-200);
}

.kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-icon-wrap {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.kpi-icon-wrap.sky { background: var(--sky-100); color: var(--sky-700); }
.kpi-icon-wrap.amber { background: var(--amber-100); color: var(--amber-700); }
.kpi-icon-wrap.emerald { background: var(--emerald-100); color: var(--emerald-700); }
.kpi-icon-wrap.cyan { background: #e0f2fe; color: #0369a1; }

.kpi-badge {
  font-size: 0.62rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
}
.badge-sky { background: var(--sky-100); color: var(--sky-800); }
.badge-amber { background: var(--amber-100); color: var(--amber-800); }
.badge-emerald { background: var(--emerald-100); color: var(--emerald-800); }
.badge-cyan { background: #e0f2fe; color: #0284c7; }

.kpi-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.kpi-label {
  font-size: 0.74rem;
  color: var(--text-muted);
  font-weight: 600;
}

.kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.kpi-val {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
}

.kpi-unit {
  font-size: 0.78rem;
  color: var(--text-muted);
  font-weight: 600;
}

.kpi-sub-fcr {
  font-size: 0.72rem;
  font-weight: 600;
}

.kpi-sub-line {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.68rem;
  color: var(--text-secondary);
}

.kpi-formula-box {
  font-size: 0.64rem;
  color: var(--emerald-700);
  background: var(--emerald-50);
  padding: 2px 6px;
  border-radius: 4px;
  margin-top: 2px;
}

/* Stream Section */
.stream-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stream-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.stream-title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stream-title {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--text-primary);
}

.stream-count {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.filter-controls-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* Source Filter Pills (AUTO vs MANUAL) */
.source-filter-pills {
  display: flex;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.filter-pill {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.66rem;
  font-weight: 700;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.filter-pill.active {
  background: #ffffff;
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.filter-pill.auto.active {
  color: var(--emerald-700);
}

.filter-pill.manual.active {
  color: var(--sky-700);
}

/* Category Pills */
.category-filter-pills {
  display: flex;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.cat-pill {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.66rem;
  font-weight: 600;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.cat-pill.active {
  background: #ffffff;
  color: var(--text-primary);
  font-weight: 700;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

/* Table styling */
.log-entries-table-wrapper {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  overflow-x: auto;
}

.ledger-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.72rem;
  text-align: left;
}

.ledger-table thead th {
  padding: 8px 12px;
  background: var(--bg-surface-subtle);
  color: var(--text-muted);
  font-weight: 700;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.65rem;
  letter-spacing: 0.04em;
}

.log-row {
  border-bottom: 1px solid var(--border-subtle);
  transition: background 0.15s ease;
}

.log-row:last-child {
  border-bottom: none;
}

.log-row:hover {
  background: #f8fafc;
}

.log-row td {
  padding: 7px 12px;
  vertical-align: middle;
}

.time-cell {
  display: flex;
  flex-direction: column;
}

.time-str {
  color: var(--text-primary);
  font-weight: 700;
}

.id-str {
  font-size: 0.6rem;
  color: var(--text-muted);
}

.pond-pill {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  font-weight: 700;
  color: var(--text-primary);
  font-size: 0.66rem;
}

.source-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 0.64rem;
  font-weight: 800;
}

.source-auto {
  background: var(--emerald-50);
  color: var(--emerald-700);
  border: 1px solid var(--emerald-200);
}

.source-manual {
  background: var(--sky-50);
  color: var(--sky-700);
  border: 1px solid var(--sky-200);
}

.actor-subtext {
  display: block;
  font-size: 0.62rem;
  color: var(--text-muted);
  margin-top: 2px;
}

.action-desc {
  font-weight: 700;
  color: var(--text-primary);
  display: block;
}

.hardware-sub {
  font-size: 0.62rem;
  color: var(--text-muted);
}

.dosage-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 800;
  font-size: 0.72rem;
}

.dosage-tag.feeding {
  background: var(--sky-100);
  color: var(--sky-800);
}

.dosage-tag.molasses {
  background: var(--amber-100);
  color: var(--amber-800);
}

.dosage-tag.aeration {
  background: var(--emerald-100);
  color: var(--emerald-800);
}

.dosage-tag.siphon_flush {
  background: var(--rose-100);
  color: var(--rose-800);
}

.dosage-tag.mortality_log {
  background: #ffe4e6;
  color: #e11d48;
  border: 1px solid #fecdd3;
}

.notes-cell {
  color: var(--text-secondary);
  font-size: 0.72rem;
  line-height: 1.35;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.66rem;
  font-weight: 700;
  color: var(--emerald-700);
}

.empty-cell {
  text-align: center;
  padding: 24px;
  color: var(--text-muted);
  font-size: 0.8rem;
}

@media (max-width: 1200px) {
  .kpi-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
