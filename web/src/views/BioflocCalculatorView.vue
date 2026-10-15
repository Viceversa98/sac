<script setup>
import { ref, computed } from 'vue'
import { FlaskConical, Calculator, Sparkles, BookOpen, CheckCircle2, ArrowRight } from 'lucide-vue-next'

// Sliders and inputs
const feedWeightKg = ref(15.0)
const crudeProteinPercent = ref(32)
const carbonSource = ref('molasses') // molasses (40% C), tapioca (45% C), wheat (50% C)
const targetCnRatio = ref(15)
const pondVolumeM3 = ref(50)

const carbonPercent = computed(() => {
  if (carbonSource.value === 'molasses') return 40
  if (carbonSource.value === 'tapioca') return 45
  return 50
})

// Biofloc Math based on Avnimelech (2025):
// Feed Carbon = Feed Weight * 50% C
// Feed Nitrogen = Feed Weight * (Crude Protein % / 6.25)
// Unassimilated Nitrogen excreted by Tilapia = ~75% of Feed N
// Carbon needed to assimilate excreted N at Target C/N = (Excreted N * Target C/N) - Available C
const calculatedDeficit = computed(() => {
  const feedKg = feedWeightKg.value
  const cp = crudeProteinPercent.value / 100
  const feedNitrogenKg = feedKg * (cp / 6.25)
  const excretedNitrogenKg = feedNitrogenKg * 0.75

  const targetRatio = targetCnRatio.value
  const requiredCarbonKg = excretedNitrogenKg * targetRatio

  // Molasses needed
  const cFraction = carbonPercent.value / 100
  const molassesNeededKg = requiredCarbonKg / cFraction
  const molassesGrams = Math.round(molassesNeededKg * 1000)

  return {
    feedNitrogenKg: (feedNitrogenKg * 1000).toFixed(0),
    excretedNitrogenKg: (excretedNitrogenKg * 1000).toFixed(0),
    molassesGrams,
    costEstIdr: Math.round(molassesNeededKg * 6500) // Rp 6,500 / kg molasses
  }
})
</script>

<template>
  <div class="calculator-view">
    <div class="view-header">
      <div class="header-left">
        <div class="icon-box">
          <FlaskConical :size="22" class="text-emerald" />
        </div>
        <div>
          <h2 class="view-title font-display">Biofloc C:N Ratio & Carbon Dosing Calculator</h2>
          <span class="view-sub">Precision biofloc formulation engine grounded in Avnimelech (2025) & SNI 7550:2009 standards</span>
        </div>
      </div>
      <span class="badge badge-purple">Zero-Hallucination Biofloc Engine</span>
    </div>

    <div class="calc-grid">
      <!-- Input Parameters Column -->
      <div class="calc-card glass-panel">
        <h3 class="card-title">1. Daily Pond Input Parameters</h3>

        <div class="form-group">
          <div class="label-row">
            <label>Daily Feed Weight:</label>
            <span class="val-pill font-mono">{{ feedWeightKg }} kg</span>
          </div>
          <input type="range" v-model.number="feedWeightKg" min="5" max="100" step="0.5" class="slider" />
        </div>

        <div class="form-group">
          <div class="label-row">
            <label>Feed Crude Protein (CP):</label>
            <span class="val-pill font-mono">{{ crudeProteinPercent }}%</span>
          </div>
          <input type="range" v-model.number="crudeProteinPercent" min="20" max="45" step="1" class="slider" />
          <span class="input-hint">Commercial tilapia biofloc feed standard: 28% – 32% CP</span>
        </div>

        <div class="form-group">
          <div class="label-row">
            <label>Target Biofloc C:N Ratio:</label>
            <span class="val-pill font-mono">{{ targetCnRatio }} : 1</span>
          </div>
          <input type="range" v-model.number="targetCnRatio" min="10" max="20" step="1" class="slider" />
          <span class="input-hint">15:1 ratio guarantees dominance of ammonia-assimilating heterotrophic bacteria</span>
        </div>

        <div class="form-group">
          <label>Organic Carbon Source:</label>
          <div class="radio-pills">
            <button 
              class="radio-btn" 
              :class="{ active: carbonSource === 'molasses' }" 
              @click="carbonSource = 'molasses'"
            >
              Cane Molasses (40% C)
            </button>
            <button 
              class="radio-btn" 
              :class="{ active: carbonSource === 'tapioca' }" 
              @click="carbonSource = 'tapioca'"
            >
              Tapioca Flour (45% C)
            </button>
            <button 
              class="radio-btn" 
              :class="{ active: carbonSource === 'wheat' }" 
              @click="carbonSource = 'wheat'"
            >
              Fine Wheat Bran (50% C)
            </button>
          </div>
        </div>
      </div>

      <!-- Result Column -->
      <div class="calc-card glass-panel highlight">
        <h3 class="card-title">2. Calculation Results & Dosing Recommendation</h3>

        <div class="result-big-box">
          <span class="result-label">DAILY MOLASSES REQUIREMENT:</span>
          <div class="big-number-row font-mono">
            <span class="big-number text-emerald">{{ calculatedDeficit.molassesGrams.toLocaleString() }}</span>
            <span class="big-unit">grams / day</span>
          </div>
          <span class="sub-cost font-mono">Substrate Cost Estimate: Rp {{ calculatedDeficit.costEstIdr.toLocaleString() }} / day</span>
        </div>

        <div class="breakdown-list font-mono">
          <div class="breakdown-item">
            <span>Total Nitrogen from Feed:</span>
            <strong>{{ calculatedDeficit.feedNitrogenKg }} g N</strong>
          </div>
          <div class="breakdown-item">
            <span>Dissolved Ammonia Excretion (75%):</span>
            <strong class="text-amber">{{ calculatedDeficit.excretedNitrogenKg }} g TAN</strong>
          </div>
          <div class="breakdown-item">
            <span>Net Organic Carbon Required (C:N {{ targetCnRatio }}:1):</span>
            <strong class="text-sky">{{ (calculatedDeficit.excretedNitrogenKg * targetCnRatio).toFixed(0) }} g C</strong>
          </div>
        </div>

        <div class="sop-guide-box">
          <div class="guide-title">
            <CheckCircle2 :size="16" class="text-emerald" />
            <span>Field Application Guidelines (SOP):</span>
          </div>
          <p class="guide-text">
            Dissolve <strong>{{ calculatedDeficit.molassesGrams }}g</strong> of molasses in 5 liters of pond water with probiotic yeast, ferment for 2 hours, then broadcast evenly in front of the aerator currents at 09:00 WIB following the morning feeding window.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calculator-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: var(--shadow-xs);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-box {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: var(--emerald-50);
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-emerald { color: var(--emerald-600); }
.text-amber { color: var(--amber-600); }
.text-sky { color: var(--sky-600); }

.view-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
}

.view-sub {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.calc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.calc-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  padding: 22px 24px;
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.card-title {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-primary);
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-subtle);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.val-pill {
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  color: var(--sky-700);
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.8rem;
}

.slider {
  width: 100%;
  accent-color: var(--sky-600);
}

.input-hint {
  font-size: 0.7rem;
  color: var(--text-muted);
}

.radio-pills {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.radio-btn {
  flex: 1;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.radio-btn.active {
  background: var(--emerald-50);
  border-color: var(--emerald-500);
  color: var(--emerald-700);
  font-weight: 700;
}

/* Result box */
.result-big-box {
  background: linear-gradient(135deg, var(--emerald-50) 0%, #f0fdfa 100%);
  border: 1px solid var(--emerald-200);
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-label {
  font-size: 0.72rem;
  font-weight: 800;
  color: var(--emerald-700);
  letter-spacing: 0.05em;
}

.big-number-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.big-number {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1.1;
}

.big-unit {
  font-size: 0.95rem;
  color: var(--text-muted);
  font-weight: 600;
}

.sub-cost {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.breakdown-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-surface-subtle);
  padding: 12px 14px;
  border-radius: 10px;
  font-size: 0.75rem;
}

.breakdown-item {
  display: flex;
  justify-content: space-between;
}

.sop-guide-box {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  padding: 12px 14px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.guide-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.guide-text {
  font-size: 0.74rem;
  color: var(--text-secondary);
  line-height: 1.5;
}

@media (max-width: 1024px) {
  .calc-grid {
    grid-template-columns: 1fr;
  }
}
</style>
