<script setup>
import { computed } from 'vue'
import { usePonds } from '../composables/usePonds'
import { FlaskConical, BookOpen, Sparkles, CheckCircle2 } from 'lucide-vue-next'

const { activePond } = usePonds()

const cnRatio = computed(() => {
  const nh3 = activePond.value.telemetry.ammonia
  if (nh3 > 0.05) return '11.8 : 1 (Carbon Deficit)'
  if (nh3 > 0.03) return '13.5 : 1 (Needs Dosing)'
  return '14.8 : 1 (Balanced C:N)'
})

const molassesRequirement = computed(() => {
  const nh3 = activePond.value.telemetry.ammonia
  if (nh3 > 0.05) return '850 g'
  if (nh3 > 0.03) return '520 g'
  return '350 g'
})

const feedingRatePercent = computed(() => {
  const temp = activePond.value.telemetry.temp
  const doVal = activePond.value.telemetry.do
  if (doVal < 4.0) return '0.0% (Fast Fish/Emergency)'
  if (temp < 27.0) return '2.2% Biomass'
  return '3.0% Biomass (Optimal)'
})
</script>

<template>
  <div class="biofloc-science-panel glass-panel">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-title">
        <div class="science-icon-box">
          <FlaskConical class="header-icon text-emerald" :size="18" />
        </div>
        <div>
          <h3 class="panel-title font-display">Water Care & Biofloc Guidance</h3>
          <span class="panel-sub font-mono">Microbial assimilation advice • {{ activePond.name }}</span>
        </div>
      </div>

      <div class="rag-badge font-mono">
        <Sparkles :size="12" class="text-purple" />
        <span>Avnimelech Protocol</span>
      </div>
    </div>

    <!-- Science Recommendations Stack -->
    <div class="science-content-stack">
      <!-- Bacterial Balance -->
      <div class="metric-block">
        <div class="block-top">
          <span class="block-label">Bacterial C:N Ratio Balance</span>
          <span class="badge badge-emerald font-mono">TARGET: 15 : 1</span>
        </div>
        <div class="block-val-row font-mono">
          <span class="val-big text-sky">{{ cnRatio }}</span>
        </div>
        <p class="block-desc">
          Heterotrophic bacteria require organic carbon (sugar) to consume toxic ammonia and convert it into natural microbial protein flocs.
        </p>
      </div>

      <!-- Molasses Requirement -->
      <div class="metric-block">
        <div class="block-top">
          <span class="block-label">Molasses Dosing Requirement</span>
          <span class="badge badge-amber font-mono">CARBON BUFFER</span>
        </div>
        <div class="block-val-row font-mono">
          <span class="val-big text-emerald">{{ molassesRequirement }}</span>
          <span class="val-sub">/ day</span>
        </div>
        <p class="block-desc">
          Dissolve in pond water, broadcast in front of aerator currents to stimulate floc suspension.
        </p>
      </div>

      <!-- Feeding Ration -->
      <div class="metric-block">
        <div class="block-top">
          <span class="block-label">Recommended Feeding Rate</span>
          <span class="badge badge-cyan font-mono">RATION</span>
        </div>
        <div class="block-val-row font-mono">
          <span class="val-big text-amber">{{ feedingRatePercent }}</span>
        </div>
        <p class="block-desc">
          Optimal dissolved oxygen and temperature. If oxygen dips below 4.0 mg/L, pause feeding immediately.
        </p>
      </div>
    </div>

    <!-- References Footer -->
    <div class="science-footer font-mono">
      <div class="ref-item">
        <BookOpen :size="12" class="text-sky" />
        <span>Avnimelech Biofloc Guide</span>
      </div>
      <div class="ref-item">
        <CheckCircle2 :size="12" class="text-emerald" />
        <span>SNI 7550:2009 Tilapia Standard</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.biofloc-science-panel {
  padding: 14px 16px;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  box-shadow: var(--shadow-xs);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 12px;
  height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.science-icon-box {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--emerald-50);
  border: 1px solid var(--emerald-200);
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-title {
  font-size: 0.98rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.2;
}

.panel-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.rag-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  background: var(--purple-50);
  border: 1px solid var(--purple-100);
  color: var(--purple-700);
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.65rem;
  font-weight: 700;
}

.science-content-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.metric-block {
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  padding: 10px 12px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.block-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.block-label {
  font-size: 0.72rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.block-val-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.val-big {
  font-size: 1.2rem;
  font-weight: 800;
  line-height: 1.1;
}

.text-sky { color: var(--sky-600); }
.text-emerald { color: var(--emerald-600); }
.text-amber { color: var(--amber-600); }

.val-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
}

.block-desc {
  font-size: 0.66rem;
  color: var(--text-muted);
  line-height: 1.35;
}

.science-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
  font-size: 0.64rem;
  color: var(--text-muted);
}

.ref-item {
  display: flex;
  align-items: center;
  gap: 5px;
}
</style>
