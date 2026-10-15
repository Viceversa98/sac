<script setup>
import { ref, computed } from 'vue'
import { usePonds } from '../composables/usePonds'
import { 
  FileText, 
  Download, 
  Sparkles, 
  User, 
  Utensils, 
  Pipette, 
  TrendingUp, 
  Scale, 
  CheckCircle2,
  Building2,
  SlidersHorizontal,
  Skull
} from 'lucide-vue-next'

const { ponds, globalFarmMetrics, operationalLogs } = usePonds()

const selectedPondFilter = ref('ALL') // 'ALL' | 'K01' | 'K02' | 'K03' | 'K04'
const filterType = ref('ALL') // 'ALL' | 'AUTO' | 'MANUAL_ADJUST' | 'FEEDING' | 'MOLASSES' | 'MORTALITY'

// Dynamic metrics depending on selected pond filter
const currentMetrics = computed(() => {
  if (selectedPondFilter.value === 'ALL') {
    return {
      title: 'Total Farm Cumulative Feed',
      subFeed: 'Across all 4 active production ponds',
      totalFeedKg: globalFarmMetrics.value.totalCumulativeFeedKg,
      totalMolassesKg: globalFarmMetrics.value.totalCumulativeMolassesKg,
      fcr: globalFarmMetrics.value.fcr,
      fcrText: '⭐ Cluster Weighted Biofloc FCR',
      totalBiomassKg: globalFarmMetrics.value.totalBiomassKg,
      netGainKg: globalFarmMetrics.value.totalBiomassGainKg
    }
  }

  const p = ponds.value.find(pond => pond.id === selectedPondFilter.value) || ponds.value[0]
  const currentBiomassKg = Math.round(p.fishCount * p.avgWeightGrams / 1000)
  const stockingBiomassKg = p.initialBiomassKg || 380
  const netGainKg = Math.max(1, currentBiomassKg - stockingBiomassKg)
  const cumulativeFeedKg = Number((p.cumulativeFeedKg || 1200).toFixed(1))
  const estimatedFcr = Number((cumulativeFeedKg / netGainKg).toFixed(2))

  return {
    title: `${p.id} Cumulative Feed`,
    subFeed: `${p.name} (${p.phase})`,
    totalFeedKg: cumulativeFeedKg,
    totalMolassesKg: Number((p.cumulativeMolassesKg || 25).toFixed(1)),
    fcr: estimatedFcr,
    fcrText: `Live FCR for ${p.id}`,
    totalBiomassKg: currentBiomassKg,
    netGainKg: netGainKg
  }
})

const filteredLogs = computed(() => {
  return operationalLogs.value.filter(log => {
    // Pond filter
    if (selectedPondFilter.value !== 'ALL' && log.pondId && log.pondId !== selectedPondFilter.value) {
      return false
    }

    // Type / category filter
    if (filterType.value === 'ALL') return true
    if (filterType.value === 'AUTO') return log.type === 'AUTO'
    if (filterType.value === 'MANUAL_ADJUST') return log.type === 'MANUAL_ADJUST'
    if (filterType.value === 'FEEDING') return log.category === 'FEEDING'
    if (filterType.value === 'MOLASSES') return log.category === 'MOLASSES'
    if (filterType.value === 'MORTALITY') return log.category === 'MORTALITY_LOG'
    return true
  })
})

const exportLogsCsv = () => {
  const headers = ['Log ID', 'Timestamp', 'Pond', 'Category', 'Provenance (Type)', 'Actor / Initiator', 'Action', 'Dosage Given', 'Hardware', 'Status', 'Notes']
  const rows = filteredLogs.value.map(l => [
    l.id,
    `"${l.time}"`,
    `"${l.pondName}"`,
    `"${l.category}"`,
    `"${l.type}"`,
    `"${l.actor}"`,
    `"${l.action}"`,
    `"${l.dosage}"`,
    `"${l.hardware}"`,
    `"${l.status}"`,
    `"${l.notes || ''}"`
  ])

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const encodedUri = encodeURI(csvContent)
  const link = document.createElement('a')
  link.setAttribute('href', encodedUri)
  link.setAttribute('download', `sampay_biofloc_operational_audit_${selectedPondFilter.value}_${new Date().toISOString().slice(0, 10)}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="log-audit-view">
    <!-- Header -->
    <div class="view-header">
      <div class="header-left">
        <div class="icon-box">
          <FileText :size="22" class="text-sky" />
        </div>
        <div>
          <h2 class="view-title font-display">Operational Input Ledger & Execution Audit Trail</h2>
          <span class="view-sub">Chronological immutable audit log of feeding, carbon dosing, aeration tuning, and auto vs manual actions</span>
        </div>
      </div>
      <button class="btn-primary" @click="exportLogsCsv">
        <Download :size="16" />
        <span>Export Ledger (CSV)</span>
      </button>
    </div>

    <!-- Pond Scope Selector: Farm Total vs Individual Ponds -->
    <div class="scope-selector-bar font-mono">
      <div class="scope-label-wrap">
        <SlidersHorizontal :size="13" class="text-sky" />
        <span class="scope-label">Pond Scope Filter:</span>
      </div>
      <div class="scope-pills">
        <button 
          id="btn-audit-scope-all"
          class="scope-btn total"
          :class="{ active: selectedPondFilter === 'ALL' }"
          @click="selectedPondFilter = 'ALL'"
        >
          <Building2 :size="12" />
          <span>Farm Total (All 4 Ponds)</span>
        </button>
        <button 
          v-for="p in ponds" 
          :key="p.id"
          :id="'btn-audit-scope-' + p.id"
          class="scope-btn"
          :class="{ active: selectedPondFilter === p.id }"
          @click="selectedPondFilter = p.id"
        >
          <span>{{ p.id }}: {{ p.name.split('—')[0].replace('Pond #', 'P#') }}</span>
        </button>
      </div>
    </div>

    <!-- Aggregations Top Banner (Reacts to Selected Pond or Farm Total) -->
    <div class="farm-aggregations-grid font-mono">
      <div class="agg-card">
        <div class="agg-icon-wrap sky">
          <Utensils :size="18" />
        </div>
        <div class="agg-data">
          <span class="agg-label font-sans">{{ currentMetrics.title }}</span>
          <div class="agg-val-row">
            <span class="agg-num font-display">{{ currentMetrics.totalFeedKg.toLocaleString() }}</span>
            <span class="agg-unit">kg</span>
          </div>
          <span class="agg-sub text-muted">{{ currentMetrics.subFeed }}</span>
        </div>
      </div>

      <div class="agg-card">
        <div class="agg-icon-wrap amber">
          <Pipette :size="18" />
        </div>
        <div class="agg-data">
          <span class="agg-label font-sans">Cumulative Molasses (Carbon)</span>
          <div class="agg-val-row">
            <span class="agg-num font-display">{{ currentMetrics.totalMolassesKg.toLocaleString() }}</span>
            <span class="agg-unit">kg</span>
          </div>
          <span class="agg-sub text-muted">40% Organic C biofloc stimulation</span>
        </div>
      </div>

      <div class="agg-card highlight-fcr">
        <div class="agg-icon-wrap emerald">
          <TrendingUp :size="18" />
        </div>
        <div class="agg-data">
          <span class="agg-label font-sans">Estimated FCR Conversion</span>
          <div class="agg-val-row">
            <span class="agg-num font-display text-emerald">{{ currentMetrics.fcr }}</span>
            <span class="agg-unit">kg feed / kg fish</span>
          </div>
          <span class="agg-sub text-emerald">{{ currentMetrics.fcrText }}</span>
        </div>
      </div>

      <div class="agg-card">
        <div class="agg-icon-wrap cyan">
          <Scale :size="18" />
        </div>
        <div class="agg-data">
          <span class="agg-label font-sans">Fish Biomass (Current)</span>
          <div class="agg-val-row">
            <span class="agg-num font-display">{{ currentMetrics.totalBiomassKg.toLocaleString() }}</span>
            <span class="agg-unit">kg</span>
          </div>
          <span class="agg-sub text-emerald">+{{ currentMetrics.netGainKg.toLocaleString() }} kg net gain</span>
        </div>
      </div>
    </div>

    <!-- Filter Bar: Action Provenance -->
    <div class="filter-bar glass-panel font-mono">
      <span class="filter-label">Filter Action Type:</span>
      <div class="filter-pills">
        <button 
          class="pill-btn" 
          :class="{ active: filterType === 'ALL' }" 
          @click="filterType = 'ALL'"
        >
          All Actions ({{ filteredLogs.length }})
        </button>
        <button 
          class="pill-btn auto" 
          :class="{ active: filterType === 'AUTO' }" 
          @click="filterType = 'AUTO'"
        >
          <Sparkles :size="12" />
          <span>AUTO (AI System)</span>
        </button>
        <button 
          class="pill-btn manual" 
          :class="{ active: filterType === 'MANUAL_ADJUST' }" 
          @click="filterType = 'MANUAL_ADJUST'"
        >
          <User :size="12" />
          <span>MANUAL ADJUST (User)</span>
        </button>
        <button 
          class="pill-btn" 
          :class="{ active: filterType === 'FEEDING' }" 
          @click="filterType = 'FEEDING'"
        >
          Feeding Only
        </button>
        <button 
          class="pill-btn" 
          :class="{ active: filterType === 'MOLASSES' }" 
          @click="filterType = 'MOLASSES'"
        >
          Molasses Only
        </button>
        <button 
          class="pill-btn mortality" 
          :class="{ active: filterType === 'MORTALITY' }" 
          @click="filterType = 'MORTALITY'"
        >
          <Skull :size="12" />
          <span>Mortality Audits</span>
        </button>
      </div>
    </div>

    <!-- Audit Log Table -->
    <div class="table-container glass-panel">
      <table class="enterprise-table">
        <thead>
          <tr>
            <th style="width: 130px;">Time & ID</th>
            <th style="width: 150px;">Target Pond</th>
            <th style="width: 170px;">Trigger Provenance</th>
            <th style="width: 220px;">Action & Dosage</th>
            <th style="width: 180px;">Hardware Node</th>
            <th>Operational Notes & Impact</th>
            <th style="width: 90px; text-align: right;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in filteredLogs" :key="log.id">
            <td class="font-mono">
              <span class="log-time">{{ log.time }}</span>
              <span class="log-id">{{ log.id }}</span>
            </td>
            <td>
              <span class="log-pond font-display">{{ log.pondName }}</span>
            </td>
            <td>
              <span 
                class="badge font-mono"
                :class="log.type === 'AUTO' ? 'badge-emerald' : 'badge-cyan'"
              >
                <component :is="log.type === 'AUTO' ? Sparkles : User" :size="11" />
                <span>{{ log.type === 'AUTO' ? 'AUTO' : 'MANUAL' }}</span>
              </span>
              <span class="actor-subtext font-mono">{{ log.actor }}</span>
            </td>
            <td>
              <span class="action-title">{{ log.action }}</span>
              <span class="dosage-badge font-mono" :class="log.category.toLowerCase()">
                {{ log.dosage }}
              </span>
            </td>
            <td class="font-mono">
              <span class="target-val">{{ log.hardware }}</span>
            </td>
            <td class="notes-text">
              {{ log.notes }}
            </td>
            <td style="text-align: right;">
              <span class="badge badge-emerald font-mono">
                {{ log.status }}
              </span>
            </td>
          </tr>
          <tr v-if="filteredLogs.length === 0">
            <td colspan="7" class="empty-cell">
              No log entries match the selected filter criteria.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.log-audit-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.icon-box {
  width: 44px;
  height: 44px;
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--text-primary);
}

.view-sub {
  font-size: 0.78rem;
  color: var(--text-muted);
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--sky-600);
  color: #fff;
  border: none;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--sky-700);
}

/* Scope Selector Bar */
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

/* Farm Aggregations Top Banner */
.farm-aggregations-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.agg-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  box-shadow: var(--shadow-xs);
}

.agg-card.highlight-fcr {
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
  border-color: var(--emerald-200);
}

.agg-icon-wrap {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.agg-icon-wrap.sky { background: var(--sky-100); color: var(--sky-700); }
.agg-icon-wrap.amber { background: var(--amber-100); color: var(--amber-700); }
.agg-icon-wrap.emerald { background: var(--emerald-100); color: var(--emerald-700); }
.agg-icon-wrap.cyan { background: #e0f2fe; color: #0284c7; }

.agg-data {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.agg-label {
  font-size: 0.74rem;
  font-weight: 700;
  color: var(--text-muted);
}

.agg-val-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.agg-num {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.1;
}

.agg-unit {
  font-size: 0.76rem;
  color: var(--text-muted);
  font-weight: 600;
}

.agg-sub {
  font-size: 0.68rem;
  font-family: var(--font-sans);
}

/* Filter Bar */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 18px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.filter-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.pill-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 700;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
}

.pill-btn:hover {
  background: #ffffff;
  color: var(--text-primary);
}

.pill-btn.active {
  background: #ffffff;
  border-color: var(--sky-500);
  color: var(--sky-700);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.pill-btn.auto.active {
  border-color: var(--emerald-500);
  color: var(--emerald-700);
}

.pill-btn.manual.active {
  border-color: var(--sky-500);
  color: var(--sky-700);
}

.pill-btn.mortality.active {
  border-color: #f43f5e;
  color: #e11d48;
}

/* Table */
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
  font-size: 0.78rem;
}

.enterprise-table thead th {
  padding: 12px 16px;
  background: var(--bg-surface-subtle);
  color: var(--text-muted);
  font-weight: 700;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border-subtle);
}

.enterprise-table tbody tr {
  border-bottom: 1px solid var(--border-subtle);
  transition: background 0.15s ease;
}

.enterprise-table tbody tr:hover {
  background: #f8fafc;
}

.enterprise-table tbody td {
  padding: 12px 16px;
  vertical-align: middle;
}

.log-time {
  display: block;
  font-weight: 700;
  color: var(--text-primary);
}

.log-id {
  font-size: 0.65rem;
  color: var(--text-muted);
}

.log-pond {
  font-weight: 700;
  color: var(--text-primary);
}

.actor-subtext {
  display: block;
  font-size: 0.64rem;
  color: var(--text-muted);
  margin-top: 3px;
}

.action-title {
  font-weight: 700;
  color: var(--text-primary);
  display: block;
  font-size: 0.76rem;
}

.dosage-badge {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 0.66rem;
  font-weight: 800;
  margin-top: 3px;
}
.dosage-badge.feeding { background: var(--sky-100); color: var(--sky-800); }
.dosage-badge.molasses { background: var(--amber-100); color: var(--amber-800); }
.dosage-badge.aeration { background: var(--emerald-100); color: var(--emerald-800); }
.dosage-badge.siphon_flush { background: var(--rose-100); color: var(--rose-800); }
.dosage-badge.mortality_log { background: #ffe4e6; color: #e11d48; border: 1px solid #fecdd3; }

.target-val {
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.notes-text {
  font-size: 0.74rem;
  color: var(--text-secondary);
  line-height: 1.35;
}

.empty-cell {
  text-align: center;
  padding: 30px;
  color: var(--text-muted);
}

@media (max-width: 1200px) {
  .farm-aggregations-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .farm-aggregations-grid {
    grid-template-columns: 1fr;
  }
}
</style>
