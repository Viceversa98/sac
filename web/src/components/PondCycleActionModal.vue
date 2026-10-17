<script setup>
import { ref, computed } from 'vue'
import { usePonds } from '../composables/usePonds'
import { useToast } from '../composables/useToast'
import { 
  X, 
  Award, 
  ArrowRightLeft, 
  Check, 
  AlertTriangle, 
  Scale, 
  Fish, 
  Layers, 
  Sparkles,
  DollarSign,
  TrendingUp
} from 'lucide-vue-next'

const props = defineProps({
  pond: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close', 'action-completed'])

const { ponds, harvestPondCycle, transferPondFish } = usePonds()
const { showToast } = useToast()

const activeTab = ref('HARVEST') // 'HARVEST' | 'TRANSFER'

// Current biomass
const currentBiomassKg = computed(() => {
  return Math.round((props.pond.fishCount * props.pond.avgWeightGrams) / 1000)
})

// === TAB 1: HARVEST STATE ===
const harvestType = ref('FULL') // 'FULL' | 'PARTIAL'
const harvestKg = ref(currentBiomassKg.value)
const harvestCount = ref(props.pond.fishCount)
const harvestAbw = ref(props.pond.avgWeightGrams)
const harvestNotes = ref('Cycle harvest — commercial market delivery')

// Recalculate if harvest type changes
const setHarvestPreset = (type) => {
  harvestType.value = type
  if (type === 'FULL') {
    harvestKg.value = currentBiomassKg.value
    harvestCount.value = props.pond.fishCount
  } else {
    // 50% partial thinning
    harvestCount.value = Math.round(props.pond.fishCount * 0.5)
    harvestKg.value = Math.round(currentBiomassKg.value * 0.5)
  }
}

// Harvest FCR projection
const estimatedHarvestFcr = computed(() => {
  const netGain = Math.max(1, harvestKg.value - (props.pond.initialBiomassKg || 100))
  return Number(((props.pond.cumulativeFeedKg || 500) / netGain).toFixed(2))
})

const handleExecuteHarvest = () => {
  if (harvestKg.value <= 0 || harvestCount.value <= 0) {
    showToast('⚠️ Please enter a valid harvest weight and count', 'warning')
    return
  }

  const success = harvestPondCycle(props.pond.id, {
    type: harvestType.value,
    harvestKg: Number(harvestKg.value),
    harvestCount: Number(harvestCount.value),
    harvestAbw: Number(harvestAbw.value),
    notes: harvestNotes.value
  })

  if (success) {
    showToast(
      harvestType.value === 'FULL'
        ? `🏆 Full Harvest Complete: ${harvestKg.value.toLocaleString()} kg harvested from ${props.pond.name}!`
        : `⚖️ Partial Harvest: ${harvestKg.value.toLocaleString()} kg removed from ${props.pond.name}.`,
      'success'
    )
    emit('action-completed', { type: 'HARVEST', pondId: props.pond.id })
    emit('close')
  }
}

// === TAB 2: TRANSFER STATE ===
// Filter available destination ponds (excluding current pond)
const availableTargetPonds = computed(() => {
  return ponds.value.filter(p => p.id !== props.pond.id)
})

const targetPondId = ref(availableTargetPonds.value[0]?.id || '')
const transferPercent = ref(100)
const transferReason = ref('Grading size & progressive culture stage transfer')

const transferCount = computed(() => {
  return Math.round((props.pond.fishCount * transferPercent.value) / 100)
})

const transferKg = computed(() => {
  return Number(((transferCount.value * props.pond.avgWeightGrams) / 1000).toFixed(1))
})

const selectedTargetPond = computed(() => {
  return ponds.value.find(p => p.id === targetPondId.value)
})

const handleExecuteTransfer = () => {
  if (!targetPondId.value) {
    showToast('⚠️ Please select a destination pond for transfer', 'warning')
    return
  }

  if (transferCount.value <= 0) {
    showToast('⚠️ Transfer count must be greater than 0', 'warning')
    return
  }

  const success = transferPondFish(props.pond.id, targetPondId.value, {
    transferCount: transferCount.value,
    transferKg: transferKg.value,
    transferAbw: props.pond.avgWeightGrams,
    reason: transferReason.value
  })

  if (success) {
    showToast(
      `🔄 Fish Transfer Executed: ${transferCount.value.toLocaleString()} fish (${transferKg.value} kg) moved to ${selectedTargetPond.value?.name}!`,
      'success'
    )
    emit('action-completed', { type: 'TRANSFER', sourceId: props.pond.id, targetId: targetPondId.value })
    emit('close')
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="action-modal-card glass-panel" role="dialog" aria-modal="true">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-left">
          <div class="icon-avatar">
            <Award :size="20" class="text-amber" />
          </div>
          <div>
            <h3 class="modal-title">End this cycle</h3>
            <span class="modal-sub font-mono">
              {{ pond.name }} • Current Stock: {{ pond.fishCount?.toLocaleString() }} fish (~{{ currentBiomassKg.toLocaleString() }} kg @ {{ pond.avgWeightGrams }}g)
            </span>
          </div>
        </div>
        <button class="btn-close" @click="emit('close')" aria-label="Close modal">
          <X :size="18" />
        </button>
      </div>

      <!-- Tab Switcher -->
      <div class="tab-header font-mono">
        <button 
          id="tab-btn-harvest"
          class="tab-btn" 
          :class="{ active: activeTab === 'HARVEST' }"
          @click="activeTab = 'HARVEST'"
        >
          <Award :size="14" />
          <span>Panen Ikan (Harvest Cycle)</span>
        </button>
        <button 
          id="tab-btn-transfer"
          class="tab-btn" 
          :class="{ active: activeTab === 'TRANSFER' }"
          @click="activeTab = 'TRANSFER'"
        >
          <ArrowRightLeft :size="14" />
          <span>Pindah Kolam (Transfer / Grading)</span>
        </button>
      </div>

      <!-- Tab 1: HARVEST PANEL -->
      <div v-if="activeTab === 'HARVEST'" class="tab-body">
        <div class="mode-selector-grid font-mono">
          <button 
            type="button"
            class="mode-card"
            :class="{ active: harvestType === 'FULL' }"
            @click="setHarvestPreset('FULL')"
          >
            <div class="mode-head">
              <span class="mode-title">Panen Total (Full Harvest)</span>
              <span class="badge badge-emerald">Complete Cycle</span>
            </div>
            <p class="mode-desc">Akhiri seluruh siklus budidaya kolam, kuras seluruh biomassa ikan (100%), hitung FCR final dan kosongkan kolam untuk sanitasi/tebar baru.</p>
          </button>

          <button 
            type="button"
            class="mode-card"
            :class="{ active: harvestType === 'PARTIAL' }"
            @click="setHarvestPreset('PARTIAL')"
          >
            <div class="mode-head">
              <span class="mode-title">Panen Parsial (Thinning)</span>
              <span class="badge badge-sky">Selective Reduction</span>
            </div>
            <p class="mode-desc">Panen sebagian populasi untuk mengurangi kepadatan tebar (misal: 50%), sisa ikan tetap dipelihara di kolam hingga bobot maksimal.</p>
          </button>
        </div>

        <!-- Harvest Inputs Grid -->
        <div class="form-grid-2">
          <!-- Total Weight to Harvest -->
          <div class="form-group font-mono">
            <label class="form-label" for="harvest-kg">
              <span>Total Harvest Biomass (kg)</span>
            </label>
            <div class="input-with-unit">
              <input 
                id="harvest-kg" 
                v-model.number="harvestKg" 
                type="number" 
                step="1" 
                min="10" 
                :max="currentBiomassKg" 
                class="form-input font-mono"
              />
              <span class="unit-tag font-mono">kg</span>
            </div>
          </div>

          <!-- Harvest Fish Count -->
          <div class="form-group font-mono">
            <label class="form-label" for="harvest-count">
              <span>Fish Population Harvested</span>
            </label>
            <div class="input-with-unit">
              <input 
                id="harvest-count" 
                v-model.number="harvestCount" 
                type="number" 
                step="50" 
                min="10" 
                :max="pond.fishCount" 
                class="form-input font-mono"
              />
              <span class="unit-tag font-mono">ekor</span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="form-group font-mono">
          <label class="form-label" for="harvest-notes">
            <span>Harvest Notes / Buyer Destination</span>
          </label>
          <input 
            id="harvest-notes" 
            v-model="harvestNotes" 
            type="text" 
            class="form-input font-sans" 
            placeholder="e.g. Export Grade A to Retail Market"
          />
        </div>

        <!-- Harvest Projection Summary -->
        <div class="summary-box font-mono">
          <div class="sum-row">
            <span class="s-lbl">Cycle Feed Used:</span>
            <span class="s-val text-sky">{{ pond.cumulativeFeedKg || 0 }} kg</span>
          </div>
          <div class="sum-row">
            <span class="s-lbl">Harvest Yield:</span>
            <span class="s-val text-emerald font-bold">{{ harvestKg }} kg ({{ harvestCount?.toLocaleString() }} fish)</span>
          </div>
          <div class="sum-row">
            <span class="s-lbl">Projected Final FCR:</span>
            <span class="s-val text-emerald font-bold">{{ estimatedHarvestFcr }} (Target &lt; 1.25)</span>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="tab-footer">
          <button type="button" class="btn-cancel font-mono" @click="emit('close')">Cancel</button>
          <button 
            type="button" 
            id="btn-confirm-harvest"
            class="btn-action harvest font-mono" 
            @click="handleExecuteHarvest"
          >
            <Award :size="15" />
            <span>Confirm & Execute {{ harvestType === 'FULL' ? 'Full Harvest' : 'Partial Harvest' }}</span>
          </button>
        </div>
      </div>

      <!-- Tab 2: TRANSFER / GRADING PANEL -->
      <div v-else class="tab-body">
        <div class="transfer-alert font-mono">
          <ArrowRightLeft :size="16" class="text-sky" />
          <div>
            <span class="alert-lead">Fish Grading & Pond Migration</span>
            <p class="alert-desc">Pindahkan bibit atau ikan yang telah diseleksi (grading) dari {{ pond.name }} ke kolam tujuan berikutnya.</p>
          </div>
        </div>

        <!-- Destination Pond Selection -->
        <div class="form-group font-mono">
          <label class="form-label" for="target-pond">
            <span>Select Destination Pond (Kolam Tujuan)</span>
          </label>
          <select id="target-pond" v-model="targetPondId" class="form-select font-sans">
            <option v-for="p in availableTargetPonds" :key="p.id" :value="p.id">
              {{ p.name }} (ID: {{ p.id }}) — Current: {{ p.fishCount?.toLocaleString() }} fish
            </option>
          </select>
        </div>

        <!-- Transfer Ratio Presets -->
        <div class="form-group font-mono">
          <label class="form-label">
            <span>Transfer Proportion (% of current stock)</span>
          </label>
          <div class="preset-buttons-row">
            <button 
              type="button" 
              class="preset-chip font-mono" 
              :class="{ active: transferPercent === 25 }"
              @click="transferPercent = 25"
            >
              25% ({{ Math.round(pond.fishCount * 0.25).toLocaleString() }} fish)
            </button>
            <button 
              type="button" 
              class="preset-chip font-mono" 
              :class="{ active: transferPercent === 50 }"
              @click="transferPercent = 50"
            >
              50% ({{ Math.round(pond.fishCount * 0.50).toLocaleString() }} fish)
            </button>
            <button 
              type="button" 
              class="preset-chip font-mono" 
              :class="{ active: transferPercent === 100 }"
              @click="transferPercent = 100"
            >
              100% (Empty Pond - {{ pond.fishCount?.toLocaleString() }} fish)
            </button>
          </div>
        </div>

        <!-- Reason -->
        <div class="form-group font-mono">
          <label class="form-label" for="transfer-reason">
            <span>Transfer Reason / Grading Note</span>
          </label>
          <input 
            id="transfer-reason" 
            v-model="transferReason" 
            type="text" 
            class="form-input font-sans" 
            placeholder="e.g. Size grading > 85g to Grower B"
          />
        </div>

        <!-- Transfer Preview Grid -->
        <div class="transfer-preview-grid font-mono">
          <div class="preview-card from">
            <span class="p-title">Source: {{ pond.id }}</span>
            <div class="p-row">
              <span>Remaining:</span>
              <strong>{{ (pond.fishCount - transferCount).toLocaleString() }} fish</strong>
            </div>
            <div class="p-row">
              <span>Status:</span>
              <span :class="transferPercent === 100 ? 'text-amber' : 'text-emerald'">
                {{ transferPercent === 100 ? 'Emptied (Transferred)' : 'Active (Thinned)' }}
              </span>
            </div>
          </div>

          <div class="transfer-arrow">➔</div>

          <div class="preview-card to">
            <span class="p-title">Target: {{ selectedTargetPond?.id || '?' }}</span>
            <div class="p-row">
              <span>Receiving:</span>
              <strong class="text-sky">+{{ transferCount.toLocaleString() }} fish ({{ transferKg }} kg)</strong>
            </div>
            <div class="p-row">
              <span>New Total:</span>
              <strong>{{ ((selectedTargetPond?.fishCount || 0) + transferCount).toLocaleString() }} fish</strong>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="tab-footer">
          <button type="button" class="btn-cancel font-mono" @click="emit('close')">Cancel</button>
          <button 
            type="button" 
            id="btn-confirm-transfer"
            class="btn-action transfer font-mono" 
            @click="handleExecuteTransfer"
          >
            <ArrowRightLeft :size="15" />
            <span>Execute Transfer ({{ transferCount.toLocaleString() }} Fish)</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.action-modal-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 16px;
  width: 100%;
  max-width: 680px;
  max-height: 90vh;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.16);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalPop {
  from {
    opacity: 0;
    transform: scale(0.96) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.modal-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-surface-subtle);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-avatar {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--amber-50);
  border: 1px solid var(--amber-200);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.08rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.modal-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.btn-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

.btn-close:hover {
  background: #e2e8f0;
  color: var(--text-primary);
}

/* Tab Header */
.tab-header {
  display: flex;
  background: var(--bg-surface-subtle);
  border-bottom: 1px solid var(--border-subtle);
  padding: 0 16px;
  gap: 8px;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 16px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-muted);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--sky-700);
  border-bottom-color: var(--sky-600);
}

.tab-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Mode selector */
.mode-selector-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.mode-card {
  text-align: left;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mode-card:hover {
  background: #ffffff;
  border-color: var(--sky-400);
}

.mode-card.active {
  background: #ffffff;
  border-color: var(--sky-600);
  box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2);
}

.mode-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mode-title {
  font-size: 0.78rem;
  font-weight: 800;
  color: var(--text-primary);
}

.mode-desc {
  font-size: 0.68rem;
  color: var(--text-secondary);
  line-height: 1.35;
  font-family: var(--font-sans);
}

.form-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.form-label {
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.form-input, .form-select {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-medium);
  font-size: 0.8rem;
  color: var(--text-primary);
  background: #ffffff;
  transition: all 0.15s ease;
}

.form-input:focus, .form-select:focus {
  outline: none;
  border-color: var(--sky-500);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}

.input-with-unit {
  position: relative;
  display: flex;
  align-items: center;
}

.input-with-unit .form-input {
  width: 100%;
  padding-right: 40px;
}

.unit-tag {
  position: absolute;
  right: 10px;
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-muted);
}

.summary-box {
  background: linear-gradient(135deg, #f0fdf4 0%, #f0f9ff 100%);
  border: 1px solid var(--emerald-200);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sum-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
}

.s-lbl {
  color: var(--text-secondary);
}

.s-val {
  font-weight: 700;
}

/* Transfer Alert */
.transfer-alert {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  padding: 10px 14px;
  border-radius: 10px;
}

.alert-lead {
  font-size: 0.76rem;
  font-weight: 800;
  color: var(--sky-900);
}

.alert-desc {
  font-size: 0.68rem;
  color: var(--sky-800);
  font-family: var(--font-sans);
  margin-top: 2px;
}

.preset-buttons-row {
  display: flex;
  gap: 8px;
}

.preset-chip {
  flex: 1;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid var(--border-medium);
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.preset-chip:hover {
  background: #f1f5f9;
}

.preset-chip.active {
  background: var(--sky-600);
  color: #ffffff;
  border-color: var(--sky-600);
}

.transfer-preview-grid {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px 14px;
}

.preview-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.7rem;
}

.p-title {
  font-weight: 800;
  color: var(--text-primary);
  font-size: 0.74rem;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-subtle);
}

.p-row {
  display: flex;
  justify-content: space-between;
}

.transfer-arrow {
  font-size: 1.2rem;
  color: var(--sky-600);
  font-weight: 800;
}

.tab-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
}

.btn-cancel {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-medium);
  background: #ffffff;
  color: var(--text-secondary);
  font-size: 0.72rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-cancel:hover {
  background: #f1f5f9;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  color: #ffffff;
  font-size: 0.74rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-action.harvest {
  background: linear-gradient(135deg, #059669 0%, #10b981 100%);
  box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);
}

.btn-action.harvest:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(5, 150, 105, 0.4);
}

.btn-action.transfer {
  background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%);
  box-shadow: 0 2px 6px rgba(2, 132, 199, 0.3);
}

.btn-action.transfer:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(2, 132, 199, 0.4);
}

@media (max-width: 600px) {
  .mode-selector-grid, .form-grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
