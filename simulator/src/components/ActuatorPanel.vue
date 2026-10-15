<script setup>
import { pondState, simulationEngine } from '../services/simulationEngine'

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
        <i class="bi bi-gear-wide-connected me-2 text-warning"></i>Aktuator & Eksekusi Perintah
      </span>
      <span class="badge bg-dark border border-secondary text-secondary">
        <i class="bi bi-cpu me-1"></i>Eksekusi Otomatis Firmware
      </span>
    </div>

    <div class="card-body">
      <div class="row g-3">
        <!-- 1. FEEDER / PAKAN IKAN -->
        <div class="col-md-4">
          <div class="p-3 rounded bg-dark border border-secondary border-opacity-25 h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold small text-light">
                  <i class="bi bi-basket me-1 text-success"></i>1. Feeder (Pakan)
                </span>
                <span :class="['badge font-monospace', pondState.feeder.state === 'running' ? 'bg-success animate-pulse' : 'bg-secondary']">
                  {{ pondState.feeder.state === 'running' ? 'AKTIF (FEEDING)' : 'IDLE' }}
                </span>
              </div>

              <!-- Feeder Visual Animation -->
              <div class="text-center my-3">
                <div class="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-black border border-success border-opacity-50" style="width: 70px; height: 70px;">
                  <i :class="['bi bi-gear-fill fs-1 text-success', pondState.feeder.state === 'running' ? 'animate-spin-fast' : '']"></i>
                </div>
                <div class="mt-2 small text-secondary">
                  <span v-if="pondState.feeder.state === 'running'" class="text-warning">
                    Mendistribusikan <strong>{{ pondState.feeder.dose }}g</strong>...
                  </span>
                  <span v-else>Motor Feeder Siap</span>
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
                <span>Total Hari Ini: <strong class="text-light">{{ pondState.feeder.totalToday }}g</strong></span>
              </div>
            </div>

            <!-- Manual Test Trigger -->
            <div class="mt-3 pt-2 border-top border-secondary border-opacity-25">
              <div class="small text-secondary mb-1" style="font-size: 0.7rem;">Tes Manual (Trigger Lokal):</div>
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

        <!-- 2. POMPA MOLASE -->
        <div class="col-md-4">
          <div class="p-3 rounded bg-dark border border-secondary border-opacity-25 h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold small text-light">
                  <i class="bi bi-funnel me-1 text-warning"></i>2. Pompa Molase
                </span>
                <span :class="['badge font-monospace', pondState.molassesPump.state === 'running' ? 'bg-warning text-dark animate-pulse' : 'bg-secondary']">
                  {{ pondState.molassesPump.state === 'running' ? 'MEMOMPA' : 'IDLE' }}
                </span>
              </div>

              <!-- Molasses Visual Animation -->
              <div class="text-center my-3">
                <div class="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-black border border-warning border-opacity-50" style="width: 70px; height: 70px;">
                  <i :class="['bi bi-arrow-repeat fs-1 text-warning', pondState.molassesPump.state === 'running' ? 'animate-spin-slow' : '']"></i>
                </div>
                <div class="mt-2 small text-secondary">
                  <span v-if="pondState.molassesPump.state === 'running'" class="text-warning">
                    Dosis <strong>{{ pondState.molassesPump.dose }}ml</strong> aktif...
                  </span>
                  <span v-else>Dosing Pump Siap</span>
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
                <span>Total Hari Ini: <strong class="text-light">{{ pondState.molassesPump.totalToday }}ml</strong></span>
              </div>
            </div>

            <!-- Manual Test Trigger -->
            <div class="mt-3 pt-2 border-top border-secondary border-opacity-25">
              <div class="small text-secondary mb-1" style="font-size: 0.7rem;">Tes Manual (Trigger Lokal):</div>
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

        <!-- 3. WATER CHANGE (GANTI AIR) -->
        <div class="col-md-4">
          <div class="p-3 rounded bg-dark border border-secondary border-opacity-25 h-100 d-flex flex-column justify-content-between">
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-bold small text-light">
                  <i class="bi bi-arrow-left-right me-1 text-info"></i>3. Water Change
                </span>
                <span :class="['badge font-monospace', pondState.waterChange.state !== 'idle' ? 'bg-info text-dark animate-pulse' : 'bg-secondary']">
                  {{ pondState.waterChange.state !== 'idle' ? pondState.waterChange.phase : 'IDLE' }}
                </span>
              </div>

              <!-- Water Change Visual Animation -->
              <div class="text-center my-3">
                <div class="d-inline-flex align-items-center justify-content-center p-3 rounded-circle bg-black border border-info border-opacity-50" style="width: 70px; height: 70px;">
                  <i :class="['bi bi-water fs-1 text-info', pondState.waterChange.state !== 'idle' ? 'animate-pulse' : '']"></i>
                </div>
                <div class="mt-2 small text-secondary">
                  <span v-if="pondState.waterChange.state !== 'idle'" class="text-info">
                    Volume: <strong>{{ pondState.waterChange.volume }}L</strong> ({{ pondState.waterChange.phase }})
                  </span>
                  <span v-else>Pompa Kuras & Isi Siap</span>
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
                <span>Total Hari Ini: <strong class="text-light">{{ pondState.waterChange.totalToday }}L</strong></span>
              </div>
            </div>

            <!-- Manual Test Trigger -->
            <div class="mt-3 pt-2 border-top border-secondary border-opacity-25">
              <div class="small text-secondary mb-1" style="font-size: 0.7rem;">Tes Manual (Trigger Lokal):</div>
              <div class="btn-group w-100">
                <button 
                  @click="triggerLocalWaterChange(100)" 
                  class="btn btn-outline-info btn-sm py-0" 
                  :disabled="pondState.waterChange.state !== 'idle'"
                  style="font-size: 0.75rem;"
                >
                  +100L
                </button>
                <button 
                  @click="triggerLocalWaterChange(300)" 
                  class="btn btn-outline-info btn-sm py-0" 
                  :disabled="pondState.waterChange.state !== 'idle'"
                  style="font-size: 0.75rem;"
                >
                  +300L
                </button>
                <button 
                  @click="triggerLocalWaterChange(500)" 
                  class="btn btn-outline-info btn-sm py-0" 
                  :disabled="pondState.waterChange.state !== 'idle'"
                  style="font-size: 0.75rem;"
                >
                  +500L
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
