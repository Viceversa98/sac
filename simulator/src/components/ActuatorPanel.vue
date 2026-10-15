<script setup>
import { pondState, simulationEngine } from '../services/simulationEngine'

const toggleAerator = () => {
  const isRunning = pondState.aerator.state === 'running'
  simulationEngine.executeAerator(!isRunning, isRunning ? 0 : 100, 'manual-ui-aerator')
}

const setAeratorPower = (pct) => {
  simulationEngine.executeAerator(true, pct, 'manual-ui-aerator')
}

const triggerLocalFeed = (dose) => {
  simulationEngine.executeFeed(dose, 'g', 'manual-test-feed')
}

const triggerLocalMolasses = (dose) => {
  simulationEngine.executeMolasses(dose, 'ml', 'manual-test-molasses')
}

const triggerLocalWaterChange = (volume) => {
  simulationEngine.executeWaterChange(volume, 'liter', 'manual-test-wc')
}
</script>

<template>
  <div class="card card-iot h-100">
    <div class="card-header d-flex justify-content-between align-items-center">
      <span>
        <i class="bi bi-gear-wide-connected me-2 text-warning"></i>Actuator Hardware Matrix & Relay Execution
      </span>
      <span class="badge bg-dark border border-secondary text-secondary">
        <i class="bi bi-cpu me-1"></i>Firmware Relay Controller
      </span>
    </div>

    <div class="card-body">
      <div class="row g-3">
        <!-- 0. AERATOR / PADDLEWHEEL -->
        <div class="col-md-3">
          <div class="p-3 rounded bg-dark border border-secondary border-opacity-25 h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold small text-light">
                  <i class="bi bi-fan me-1 text-cyan"></i>1. Aerator / Venturi
                </span>
                <span :class="['badge font-monospace', pondState.aerator.state === 'running' ? 'bg-info text-dark animate-pulse' : 'bg-secondary']">
                  {{ pondState.aerator.state === 'running' ? `ACTIVE (${pondState.aerator.powerPercent}%)` : 'OFF' }}
                </span>
              </div>

              <!-- Aerator Visual Animation -->
              <div class="text-center my-3">
                <div class="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-black border border-info border-opacity-50" style="width: 70px; height: 70px;">
                  <i :class="['bi bi-fan fs-1 text-info', pondState.aerator.state === 'running' ? 'animate-spin-fast' : 'text-secondary']"></i>
                </div>
                <div class="mt-2 small text-secondary">
                  <span v-if="pondState.aerator.state === 'running'" class="text-info">
                    Dissolved Oxygen Charging <i class="bi bi-arrow-up-short"></i>
                  </span>
                  <span v-else class="text-danger">
                    Aeration Stopped (DO Dropping) <i class="bi bi-arrow-down-short"></i>
                  </span>
                </div>
              </div>

              <div class="small text-secondary mb-2" style="font-size: 0.75rem;">
                Power Level: <strong class="text-light">{{ pondState.aerator.powerPercent }}%</strong>
              </div>
            </div>

            <!-- Aerator Controls -->
            <div class="mt-3 pt-2 border-top border-secondary border-opacity-25">
              <div class="small text-secondary mb-1" style="font-size: 0.7rem;">Aerator Speed / Power:</div>
              <div class="btn-group w-100 mb-2">
                <button 
                  @click="setAeratorPower(50)" 
                  :class="['btn btn-sm py-0', pondState.aerator.powerPercent === 50 && pondState.aerator.state === 'running' ? 'btn-info' : 'btn-outline-info']"
                  style="font-size: 0.75rem;"
                >
                  50%
                </button>
                <button 
                  @click="setAeratorPower(75)" 
                  :class="['btn btn-sm py-0', pondState.aerator.powerPercent === 75 && pondState.aerator.state === 'running' ? 'btn-info' : 'btn-outline-info']"
                  style="font-size: 0.75rem;"
                >
                  75%
                </button>
                <button 
                  @click="setAeratorPower(100)" 
                  :class="['btn btn-sm py-0', pondState.aerator.powerPercent === 100 && pondState.aerator.state === 'running' ? 'btn-info' : 'btn-outline-info']"
                  style="font-size: 0.75rem;"
                >
                  100%
                </button>
              </div>
              <button 
                @click="toggleAerator" 
                :class="['btn btn-sm w-100 py-1', pondState.aerator.state === 'running' ? 'btn-outline-danger' : 'btn-success']"
                style="font-size: 0.75rem;"
              >
                <i :class="['bi me-1', pondState.aerator.state === 'running' ? 'bi-stop-circle' : 'bi-play-circle']"></i>
                {{ pondState.aerator.state === 'running' ? 'Turn Aerator OFF' : 'Start Aerator' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 1. FEEDER / FISH PELLETS -->
        <div class="col-md-3">
          <div class="p-3 rounded bg-dark border border-secondary border-opacity-25 h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold small text-light">
                  <i class="bi bi-basket me-1 text-success"></i>2. Auto Feeder
                </span>
                <span :class="['badge font-monospace', pondState.feeder.state === 'running' ? 'bg-success animate-pulse' : 'bg-secondary']">
                  {{ pondState.feeder.state === 'running' ? 'DISPENSING' : 'IDLE' }}
                </span>
              </div>

              <!-- Feeder Visual Animation -->
              <div class="text-center my-3">
                <div class="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-black border border-success border-opacity-50" style="width: 70px; height: 70px;">
                  <i :class="['bi bi-gear-fill fs-1 text-success', pondState.feeder.state === 'running' ? 'animate-spin-fast' : '']"></i>
                </div>
                <div class="mt-2 small text-secondary">
                  <span v-if="pondState.feeder.state === 'running'" class="text-warning">
                    Dispensing <strong>{{ pondState.feeder.dose }}g</strong>...
                  </span>
                  <span v-else>Feeder Ready</span>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="progress mb-2 bg-black" style="height: 8px;">
                <div 
                  class="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                  role="progressbar" 
                  :style="{ width: `${pondState.feeder.progress}%` }"
                ></div>
              </div>

              <div class="d-flex justify-content-between small text-secondary font-monospace" style="font-size: 0.72rem;">
                <span>Progress: {{ pondState.feeder.progress }}%</span>
                <span>Total Today: <strong class="text-light">{{ pondState.feeder.totalToday }}g</strong></span>
              </div>
            </div>

            <!-- Manual Test Trigger -->
            <div class="mt-3 pt-2 border-top border-secondary border-opacity-25">
              <div class="small text-secondary mb-1" style="font-size: 0.7rem;">Manual Test Trigger:</div>
              <div class="btn-group w-100">
                <button 
                  @click="triggerLocalFeed(50)" 
                  class="btn btn-outline-success btn-sm py-0" 
                  :disabled="pondState.feeder.state === 'running'"
                  style="font-size: 0.75rem;"
                >
                  +50g
                </button>
                <button 
                  @click="triggerLocalFeed(100)" 
                  class="btn btn-outline-success btn-sm py-0" 
                  :disabled="pondState.feeder.state === 'running'"
                  style="font-size: 0.75rem;"
                >
                  +100g
                </button>
                <button 
                  @click="triggerLocalFeed(250)" 
                  class="btn btn-outline-success btn-sm py-0" 
                  :disabled="pondState.feeder.state === 'running'"
                  style="font-size: 0.75rem;"
                >
                  +250g
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 2. MOLASSES DOSING PUMP -->
        <div class="col-md-3">
          <div class="p-3 rounded bg-dark border border-secondary border-opacity-25 h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold small text-light">
                  <i class="bi bi-funnel me-1 text-warning"></i>3. Molasses Pump
                </span>
                <span :class="['badge font-monospace', pondState.molassesPump.state === 'running' ? 'bg-warning text-dark animate-pulse' : 'bg-secondary']">
                  {{ pondState.molassesPump.state === 'running' ? 'DOSING' : 'IDLE' }}
                </span>
              </div>

              <!-- Molasses Visual Animation -->
              <div class="text-center my-3">
                <div class="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-black border border-warning border-opacity-50" style="width: 70px; height: 70px;">
                  <i :class="['bi bi-droplet-half fs-1 text-warning', pondState.molassesPump.state === 'running' ? 'animate-bounce' : '']"></i>
                </div>
                <div class="mt-2 small text-secondary">
                  <span v-if="pondState.molassesPump.state === 'running'" class="text-warning">
                    Injecting <strong>{{ pondState.molassesPump.dose }}ml</strong>...
                  </span>
                  <span v-else>Dosing Pump Standby</span>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="progress mb-2 bg-black" style="height: 8px;">
                <div 
                  class="progress-bar progress-bar-striped progress-bar-animated bg-warning" 
                  role="progressbar" 
                  :style="{ width: `${pondState.molassesPump.progress}%` }"
                ></div>
              </div>

              <div class="d-flex justify-content-between small text-secondary font-monospace" style="font-size: 0.72rem;">
                <span>Progress: {{ pondState.molassesPump.progress }}%</span>
                <span>Total Today: <strong class="text-light">{{ pondState.molassesPump.totalToday }}ml</strong></span>
              </div>
            </div>

            <!-- Manual Test Trigger -->
            <div class="mt-3 pt-2 border-top border-secondary border-opacity-25">
              <div class="small text-secondary mb-1" style="font-size: 0.7rem;">Manual Test Trigger:</div>
              <div class="btn-group w-100">
                <button 
                  @click="triggerLocalMolasses(50)" 
                  class="btn btn-outline-warning btn-sm py-0" 
                  :disabled="pondState.molassesPump.state === 'running'"
                  style="font-size: 0.75rem;"
                >
                  +50ml
                </button>
                <button 
                  @click="triggerLocalMolasses(100)" 
                  class="btn btn-outline-warning btn-sm py-0" 
                  :disabled="pondState.molassesPump.state === 'running'"
                  style="font-size: 0.75rem;"
                >
                  +100ml
                </button>
                <button 
                  @click="triggerLocalMolasses(250)" 
                  class="btn btn-outline-warning btn-sm py-0" 
                  :disabled="pondState.molassesPump.state === 'running'"
                  style="font-size: 0.75rem;"
                >
                  +250ml
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. WATER CHANGE / SIPHON SYSTEM -->
        <div class="col-md-3">
          <div class="p-3 rounded bg-dark border border-secondary border-opacity-25 h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold small text-light">
                  <i class="bi bi-arrow-left-right me-1 text-info"></i>4. Water Change Pump
                </span>
                <span :class="['badge font-monospace', pondState.waterChange.state !== 'idle' ? 'bg-info text-dark animate-pulse' : 'bg-secondary']">
                  {{ pondState.waterChange.state !== 'idle' ? pondState.waterChange.phase : 'IDLE' }}
                </span>
              </div>

              <!-- Water Change Visual Animation -->
              <div class="text-center my-3">
                <div class="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-black border border-info border-opacity-50" style="width: 70px; height: 70px;">
                  <i :class="['bi bi-arrow-repeat fs-1 text-info', pondState.waterChange.state !== 'idle' ? 'animate-spin-fast' : '']"></i>
                </div>
                <div class="mt-2 small text-secondary">
                  <span v-if="pondState.waterChange.state !== 'idle'" class="text-info">
                    {{ pondState.waterChange.phase }}: <strong>{{ pondState.waterChange.volume }}L</strong>
                  </span>
                  <span v-else>Valves & Siphon Ready</span>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="progress mb-2 bg-black" style="height: 8px;">
                <div 
                  class="progress-bar progress-bar-striped progress-bar-animated bg-info" 
                  role="progressbar" 
                  :style="{ width: `${pondState.waterChange.progress}%` }"
                ></div>
              </div>

              <div class="d-flex justify-content-between small text-secondary font-monospace" style="font-size: 0.72rem;">
                <span>Progress: {{ pondState.waterChange.progress }}%</span>
                <span>Total Today: <strong class="text-light">{{ pondState.waterChange.totalToday }}L</strong></span>
              </div>
            </div>

            <!-- Manual Test Trigger -->
            <div class="mt-3 pt-2 border-top border-secondary border-opacity-25">
              <div class="small text-secondary mb-1" style="font-size: 0.7rem;">Manual Test Trigger:</div>
              <div class="btn-group w-100">
                <button 
                  @click="triggerLocalWaterChange(100)" 
                  class="btn btn-outline-info btn-sm py-0" 
                  :disabled="pondState.waterChange.state !== 'idle'"
                  style="font-size: 0.75rem;"
                >
                  100L
                </button>
                <button 
                  @click="triggerLocalWaterChange(250)" 
                  class="btn btn-outline-info btn-sm py-0" 
                  :disabled="pondState.waterChange.state !== 'idle'"
                  style="font-size: 0.75rem;"
                >
                  250L
                </button>
                <button 
                  @click="triggerLocalWaterChange(500)" 
                  class="btn btn-outline-info btn-sm py-0" 
                  :disabled="pondState.waterChange.state !== 'idle'"
                  style="font-size: 0.75rem;"
                >
                  500L
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
