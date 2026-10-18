<script setup>
import { computed, ref } from 'vue'
import { CheckCircle2 } from 'lucide-vue-next'
import PageIntro from '../components/PageIntro.vue'

const tanMgL = ref(1)
const pondVolumeM3 = ref(30)
const CARB_FRACTION = 0.44
const MAX_G_PER_L = 0.12

const dose = computed(() => {
  const gramsPerM3 = (20 * tanMgL.value) / CARB_FRACTION
  const gramsPerL = gramsPerM3 / 1000
  const refused = gramsPerL > MAX_G_PER_L
  const appliedPerL = refused ? MAX_G_PER_L : gramsPerL
  const grams = Math.round(appliedPerL * pondVolumeM3.value * 1000)
  return {
    gramsPerM3: Number(gramsPerM3.toFixed(1)),
    gramsPerL: Number(gramsPerL.toFixed(3)),
    grams,
    refused
  }
})
</script>

<template>
  <div class="calculator-view">
    <div class="view-header">
      <PageIntro
        title="Molasses"
        purpose="Enter today’s feed. The result is grams to add after feeding."
      />
    </div>

    <div class="calc-grid">
      <!-- Input Parameters Column -->
      <div class="calc-card glass-panel">
        <h3 class="card-title">TAN to remove</h3>

        <div class="form-group">
          <div class="label-row">
            <label for="tan-input">TAN (mg/L)</label>
            <span class="val-pill font-mono">{{ tanMgL }} mg/L</span>
          </div>
          <input id="tan-input" type="range" v-model.number="tanMgL" min="0" max="3" step="0.1" class="slider" />
        </div>

        <div class="form-group">
          <div class="label-row">
            <label for="volume-input">Pond volume</label>
            <span class="val-pill font-mono">{{ pondVolumeM3 }} m³</span>
          </div>
          <input id="volume-input" type="range" v-model.number="pondVolumeM3" min="10" max="50" step="1" class="slider" />
          <span class="input-hint">Grams per cubic metre = (20 × TAN) / 0.44. Anything above 0.12 g/L is refused.</span>
        </div>
      </div>

      <!-- Result Column -->
      <div class="calc-card glass-panel highlight">
        <h3 class="card-title">Grams to add after feeding</h3>

        <div class="result-big-box">
          <span class="result-label">Grams to add after feeding</span>
          <div class="big-number-row font-mono">
            <span class="big-number" :class="dose.refused ? 'text-rose' : 'text-emerald'">{{ dose.refused ? 'Refused' : dose.grams.toLocaleString() }}</span>
            <span class="big-unit">{{ dose.refused ? 'above 0.12 g/L' : 'grams' }}</span>
          </div>
          <span class="sub-cost font-mono">{{ dose.gramsPerM3 }} g/m³ · {{ dose.gramsPerL }} g/L</span>
        </div>

        <div class="sop-guide-box">
          <div class="guide-title">
            <CheckCircle2 :size="16" class="text-emerald" aria-hidden="true" />
            <span>{{ dose.refused ? 'Safety limit' : 'Within the limit' }}</span>
          </div>
          <p class="guide-text">
            <template v-if="dose.refused">
              (20 × {{ tanMgL }}) / 0.44 is {{ dose.gramsPerL }} g/L. Doses above 0.12 g/L are refused.
            </template>
            <template v-else>
              (20 × {{ tanMgL }}) / 0.44 is {{ dose.gramsPerM3 }} g/m³, which is {{ dose.gramsPerL }} g/L. In {{ pondVolumeM3 }} m³ that is {{ dose.grams }} g.
            </template>
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
  gap: 24px;
}

.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
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
.text-rose { color: var(--rose-600); }
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
  gap: 24px;
}

.calc-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 16px;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-subtle);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: var(--text-md);
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
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.4;
}

.radio-pills {
  display: flex;
  gap: 8px;
  margin-top: 4px;
}

.radio-btn {
  flex: 1;
  min-height: 40px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: var(--text-sm);
  font-weight: 600;
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
  cursor: pointer;
}

.radio-btn.active {
  background: var(--emerald-50);
  border-color: var(--emerald-500);
  color: var(--emerald-700);
  font-weight: 700;
}

/* Result box */
.result-big-box {
  background: var(--emerald-50);
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
  font-size: var(--text-2xl);
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

@media (max-width: 640px) {
  .radio-pills {
    flex-direction: column;
  }
}
</style>
