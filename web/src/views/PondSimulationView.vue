<script setup>
import { computed, ref } from 'vue'
import { AlertTriangle, Biohazard, Box, CheckCircle2, Utensils } from 'lucide-vue-next'
import SimulatedBanner from '../components/SimulatedBanner.vue'
import IsometricPond from '../components/IsometricPond.vue'
import { usePonds } from '../composables/usePonds'
import { buildEspNodes, dissolvedOxygenBand, expectedReactions } from '../pondHardware'

const { ponds, selectedPondId, activePond, setPond, applyScenario } = usePonds()

const projection = ref('pending')
const hoveredId = ref('')
const pinnedId = ref('')
const linkedId = computed(() => hoveredId.value || pinnedId.value)

const nodes = computed(() => buildEspNodes(activePond.value))
const gatewayNodes = computed(() => nodes.value.filter((node) => node.kind === 'gateway'))
const probeNodes = computed(() => nodes.value.filter((node) => node.kind === 'probe'))
const actuatorNodes = computed(() => nodes.value.filter((node) => node.kind === 'actuator'))
const reactions = computed(() => expectedReactions(activePond.value))
const waterBand = computed(() => dissolvedOxygenBand(activePond.value?.telemetry?.do))
const motionFlags = computed(() => {
  const actuators = activePond.value?.actuators
  return {
    bubbles: actuators?.aerator?.status === 'RUNNING',
    pellets: ['READY', 'DISPENSING'].includes(actuators?.feeder?.status),
    drip: actuators?.dosing?.status === 'DOSING',
    drain: actuators?.flush?.status === 'FLUSHING'
  }
})

const scenarios = [
  {
    id: 'sim-scenario-normal',
    type: 'reset',
    label: 'Healthy',
    detail: 'DO 6.2 mg/L, ammonia 0.02 ppm',
    icon: CheckCircle2,
    tone: 'emerald'
  },
  {
    id: 'sim-scenario-hypoxia',
    type: 'hypoxia',
    label: 'Hypoxia',
    detail: 'DO 3.2 mg/L on K04',
    icon: AlertTriangle,
    tone: 'rose'
  },
  {
    id: 'sim-scenario-ammonia',
    type: 'ammonia_spike',
    label: 'Ammonia spike',
    detail: 'TAN 0.082 ppm on K04',
    icon: Biohazard,
    tone: 'amber'
  },
  {
    id: 'sim-scenario-feeding',
    type: 'feeding_window',
    label: 'Feed window',
    detail: 'Feeder READY on K04',
    icon: Utensils,
    tone: 'sky'
  }
]

const handleSelectPond = (pondId) => {
  setPond(pondId)
}

const handleScenario = (type) => {
  applyScenario(type)
  setPond('K04')
}

const handleProjection = (kind) => {
  projection.value = kind
}

const handleMarkerHover = (id) => {
  hoveredId.value = id
}

const handleMarkerLeave = (id) => {
  if (hoveredId.value === id) hoveredId.value = ''
}

const handleSelectNode = (id) => {
  pinnedId.value = pinnedId.value === id ? '' : id
  hoveredId.value = id
}

const handleCardEnter = (id) => {
  hoveredId.value = id
}

const handleCardLeave = (id) => {
  if (hoveredId.value === id) hoveredId.value = ''
}
</script>

<template>
  <div class="simulate-view">
    <div class="top-band">
      <header class="band-primary">
        <div class="title-cluster">
          <div class="icon-box" aria-hidden="true">
            <Box :size="16" />
          </div>
          <div class="title-copy">
            <h2 class="view-title font-display">Isometric Pond Simulation</h2>
            <p class="view-sub">Orthographic pond, ESP32 nodes, and live metrics. Scenarios write K04.</p>
          </div>
        </div>

        <div class="control-cluster">
          <div class="control-block">
            <span class="control-label" id="pond-switch-label">Pond</span>
            <div class="pond-switch" role="group" aria-labelledby="pond-switch-label">
              <button
                v-for="pond in ponds"
                :key="pond.id"
                type="button"
                class="pond-btn"
                :class="{ active: selectedPondId === pond.id }"
                :aria-pressed="selectedPondId === pond.id"
                @click="handleSelectPond(pond.id)"
              >
                {{ pond.id }}
              </button>
            </div>
          </div>

          <div class="control-block">
            <span class="control-label" id="scenario-switch-label">Scenarios</span>
            <div class="scenario-switch" role="group" aria-labelledby="scenario-switch-label">
              <button
                v-for="scenario in scenarios"
                :id="scenario.id"
                :key="scenario.id"
                type="button"
                class="scenario-btn"
                :class="scenario.tone"
                :title="`${scenario.label}. ${scenario.detail}`"
                :aria-label="`${scenario.label}. ${scenario.detail}`"
                @click="handleScenario(scenario.type)"
              >
                <component :is="scenario.icon" :size="14" aria-hidden="true" />
                <span class="scenario-copy">
                  <span class="scenario-label">{{ scenario.label }}</span>
                  <span class="scenario-detail">{{ scenario.detail }}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="band-secondary">
        <section id="reaction-strip" class="reaction-strip" aria-live="polite" aria-label="Expected reaction">
          <h3 class="strip-title">Expected reaction</h3>
          <ul class="strip-list">
            <li v-for="item in reactions" :key="item.text" :class="item.tone">
              {{ item.text }}
            </li>
          </ul>
        </section>
        <div class="band-banner">
          <SimulatedBanner />
        </div>
      </div>
    </div>

    <div class="stage-layout">
      <section
        id="pond-stage"
        class="stage"
        :data-projection="projection"
        :data-water-band="waterBand"
        :data-motion-bubbles="motionFlags.bubbles"
        :data-motion-pellets="motionFlags.pellets"
        :data-motion-drip="motionFlags.drip"
        :data-motion-drain="motionFlags.drain"
        aria-label="Isometric pond"
      >
        <div class="stage-canvas">
          <IsometricPond
            :pond="activePond"
            :highlight-id="linkedId"
            @projection="handleProjection"
            @hover="handleMarkerHover"
            @leave="handleMarkerLeave"
            @select="handleSelectNode"
          />
        </div>
      </section>

      <div class="metric-board">
        <aside class="link-rail probe-rail" aria-label="RS485 probes">
          <header class="rail-head">
            <h3 class="panel-title">RS485 probes</h3>
            <p class="panel-sub">{{ activePond.name }}</p>
          </header>
          <ul class="node-list probe-list">
            <li
              v-for="node in probeNodes"
              :key="node.id"
              :data-node-id="node.id"
              :data-short="node.shortLabel"
              :title="`${node.shortLabel} · ${node.id}`"
              role="button"
              tabindex="0"
              :class="{ 'is-linked': linkedId === node.id }"
              :aria-pressed="linkedId === node.id"
              :aria-label="`${node.shortLabel}, ${node.name}`"
              @mouseenter="handleCardEnter(node.id)"
              @mouseleave="handleCardLeave(node.id)"
              @focus="handleCardEnter(node.id)"
              @blur="handleCardLeave(node.id)"
              @click="handleSelectNode(node.id)"
              @keydown.enter.prevent="handleSelectNode(node.id)"
              @keydown.space.prevent="handleSelectNode(node.id)"
            >
              <div class="node-id">
                <span class="node-title">
                  <span class="swatch" :class="node.ok ? 'ok' : 'alert'" aria-hidden="true"></span>
                  <span class="short-code">{{ node.shortLabel }}</span>
                  <span v-if="node.shortLabel !== node.name" class="node-name">{{ node.name }}</span>
                </span>
                <span class="node-state" :class="node.ok ? 'ok' : 'alert'">
                  {{ node.ok ? 'ok' : 'alert' }}
                </span>
              </div>
              <span class="node-metric">{{ node.lines.join(' · ') }}</span>
            </li>
          </ul>
        </aside>

        <aside class="link-rail" aria-label="Wi-Fi gateway">
          <header class="rail-head">
            <h3 class="panel-title">Wi-Fi gateway</h3>
          </header>
          <ul class="node-list">
            <li
              v-for="node in gatewayNodes"
              :key="node.id"
              :data-node-id="node.id"
              :data-short="node.shortLabel"
              :title="`${node.shortLabel} · ${node.id}`"
              role="button"
              tabindex="0"
              :class="{ 'is-linked': linkedId === node.id }"
              :aria-pressed="linkedId === node.id"
              :aria-label="`${node.shortLabel}, ${node.name}`"
              @mouseenter="handleCardEnter(node.id)"
              @mouseleave="handleCardLeave(node.id)"
              @focus="handleCardEnter(node.id)"
              @blur="handleCardLeave(node.id)"
              @click="handleSelectNode(node.id)"
              @keydown.enter.prevent="handleSelectNode(node.id)"
              @keydown.space.prevent="handleSelectNode(node.id)"
            >
              <div class="node-id">
                <span class="node-title">
                  <span class="swatch wifi" aria-hidden="true"></span>
                  <span class="short-code">{{ node.shortLabel }}</span>
                  <span v-if="node.shortLabel !== node.name" class="node-name">{{ node.name }}</span>
                </span>
                <span class="node-state ok">ok</span>
              </div>
              <span class="node-metric">{{ node.lines.join(' · ') }}</span>
            </li>
          </ul>
        </aside>

        <aside class="link-rail actuator-rail" aria-label="Actuators">
          <header class="rail-head">
            <h3 class="panel-title">Actuators</h3>
          </header>
          <ul class="node-list actuator-list">
            <li
              v-for="node in actuatorNodes"
              :key="node.id"
              :data-node-id="node.id"
              :data-short="node.shortLabel"
              :title="`${node.shortLabel} · ${node.id}`"
              role="button"
              tabindex="0"
              :class="{ 'is-linked': linkedId === node.id }"
              :aria-pressed="linkedId === node.id"
              :aria-label="`${node.shortLabel}, ${node.name}`"
              @mouseenter="handleCardEnter(node.id)"
              @mouseleave="handleCardLeave(node.id)"
              @focus="handleCardEnter(node.id)"
              @blur="handleCardLeave(node.id)"
              @click="handleSelectNode(node.id)"
              @keydown.enter.prevent="handleSelectNode(node.id)"
              @keydown.space.prevent="handleSelectNode(node.id)"
            >
              <div class="node-id">
                <span class="node-title">
                  <span class="swatch" :class="node.ok ? 'ok' : 'alert'" aria-hidden="true"></span>
                  <span class="short-code">{{ node.shortLabel }}</span>
                  <span v-if="node.shortLabel !== node.name" class="node-name">{{ node.name }}</span>
                </span>
                <span class="node-state" :class="node.ok ? 'ok' : 'alert'">
                  {{ node.ok ? 'ok' : 'alert' }}
                </span>
              </div>
              <span class="node-metric">{{ node.lines.join(' · ') }}</span>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.simulate-view {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.top-band {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: none;
  min-width: 0;
}

.band-primary,
.band-secondary,
.control-cluster,
.title-cluster,
.pond-switch,
.scenario-switch {
  min-width: 0;
}

.band-primary {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  align-items: center;
  gap: 10px;
}

.title-cluster {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-box {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sky-50);
  color: var(--sky-700);
  flex-shrink: 0;
}

.title-copy {
  min-width: 0;
}

.view-title {
  font-size: 0.95rem;
  font-weight: 750;
  line-height: 1.15;
  color: var(--text-primary);
  white-space: nowrap;
}

.view-sub {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.control-cluster {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.control-block {
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-label {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-subtle);
  white-space: nowrap;
}

.pond-switch,
.scenario-switch {
  display: flex;
  flex-wrap: nowrap;
  gap: 4px;
}

.pond-btn,
.scenario-btn {
  border: 1px solid var(--border-subtle);
  background: var(--bg-surface);
  color: var(--text-secondary);
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  transition: background-color 180ms ease, border-color 180ms ease, color 180ms ease;
}

.pond-btn:focus-visible,
.scenario-btn:focus-visible {
  outline: 2px solid var(--sky-600);
  outline-offset: 2px;
}

.pond-btn {
  min-width: 40px;
  padding: 4px 8px;
  font-family: var(--font-mono);
  font-size: 0.72rem;
  font-weight: 700;
}

.pond-btn.active {
  background: var(--sky-50);
  border-color: var(--sky-500);
  color: var(--sky-700);
}

.scenario-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 148px;
  padding: 3px 8px;
  text-align: left;
}

.scenario-btn.emerald { color: var(--emerald-700); }
.scenario-btn.rose { color: var(--rose-700); }
.scenario-btn.amber { color: var(--amber-700); }
.scenario-btn.sky { color: var(--sky-700); }

.scenario-btn:hover,
.pond-btn:hover {
  border-color: var(--border-medium);
  background: var(--bg-surface-subtle);
}

.scenario-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.scenario-label {
  font-size: 0.72rem;
  font-weight: 700;
  line-height: 1.15;
  white-space: nowrap;
}

.scenario-detail {
  display: none;
}

.band-secondary {
  display: flex;
  align-items: stretch;
  gap: 8px;
}

.reaction-strip {
  display: flex;
  align-items: stretch;
  gap: 8px;
  flex: 1.4;
  min-width: 0;
}

.strip-title {
  flex: none;
  align-self: center;
  width: 4.6rem;
  font-size: 0.66rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--text-primary);
}

.strip-list {
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.strip-list li {
  font-size: 0.7rem;
  line-height: 1.3;
  padding: 4px 8px;
  border-radius: 8px;
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  color: var(--text-secondary);
}

.strip-list li.ok {
  background: var(--emerald-50);
  color: var(--emerald-700);
  border-color: transparent;
}

.strip-list li.alert {
  background: var(--amber-50);
  color: var(--amber-700);
  border-color: transparent;
}

.strip-list li.critical {
  background: var(--rose-50);
  color: var(--rose-700);
  border-color: transparent;
}

.band-banner {
  flex: 0.8;
  min-width: 240px;
  max-width: 420px;
  display: flex;
}

.band-banner :deep(.simulated-banner) {
  width: 100%;
  height: 100%;
  padding: 4px 8px;
  align-items: center;
  font-size: 0.7rem;
  line-height: 1.3;
}

.stage-layout {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(268px, 320px);
  gap: 8px;
}

.stage {
  position: relative;
  min-height: 0;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--border-subtle);
  background: #d5e6f2;
  box-shadow: var(--shadow-sm);
}

.stage-canvas {
  position: absolute;
  inset: 0;
}

.stage-canvas :deep(.pond-root),
.stage-canvas :deep(canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
}

.metric-board {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.probe-rail {
  flex: 1.15;
  min-height: 0;
}

.actuator-rail {
  flex: 1;
  min-height: 0;
}

.link-rail {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 6px 8px;
  box-shadow: var(--shadow-xs);
  min-width: 0;
  overflow: hidden;
}

.rail-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.panel-title {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 750;
  color: var(--text-primary);
  line-height: 1.2;
  white-space: nowrap;
}

.panel-sub {
  font-size: 0.65rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-list,
.probe-list,
.actuator-list {
  list-style: none;
  display: grid;
  gap: 4px;
  min-height: 0;
}

.probe-list,
.actuator-list {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.node-list li {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 4px 6px;
  border-radius: 8px;
  background: var(--bg-surface-subtle);
  min-width: 0;
  cursor: pointer;
}

.node-list li.is-linked {
  background: var(--sky-50);
  box-shadow: inset 0 0 0 2px var(--sky-600);
}

.node-list li:focus-visible {
  outline: 2px solid var(--sky-600);
  outline-offset: 1px;
}

.short-code {
  flex: none;
  font-family: var(--font-mono);
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.01em;
  color: var(--text-primary);
}

.node-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.node-id {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  align-items: center;
}

.node-title {
  display: flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  font-size: 0.7rem;
  font-weight: 700;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.swatch {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  flex-shrink: 0;
  background: var(--emerald-600);
}

.swatch.alert {
  background: var(--rose-600);
}

.swatch.wifi {
  background: var(--sky-600);
}

.node-metric {
  display: -webkit-box;
  padding-left: 12px;
  color: var(--text-secondary);
  font-size: 0.66rem;
  font-weight: 600;
  line-height: 1.25;
  font-variant-numeric: tabular-nums;
  white-space: normal;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.node-state {
  flex: none;
  font-size: 0.58rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 1px 5px;
  border-radius: 999px;
}

.node-state.ok {
  background: var(--emerald-100);
  color: var(--emerald-700);
}

.node-state.alert {
  background: var(--rose-100);
  color: var(--rose-700);
}

@media (min-width: 1500px) {
  .view-sub {
    position: static;
    width: auto;
    height: auto;
    margin: 0;
    overflow: hidden;
    clip: auto;
    color: var(--text-muted);
    font-size: 0.68rem;
    line-height: 1.25;
    text-overflow: ellipsis;
  }

  .scenario-btn {
    max-width: 220px;
  }

  .scenario-copy {
    gap: 0;
  }

  .scenario-detail {
    display: block;
    max-width: 160px;
    font-size: 0.62rem;
    line-height: 1.15;
    color: var(--text-muted);
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

@media (max-width: 1280px) {
  .stage-layout {
    grid-template-columns: minmax(0, 1fr) 260px;
  }

  .scenario-btn {
    max-width: 118px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .pond-btn,
  .scenario-btn {
    transition: none;
  }
}
</style>
