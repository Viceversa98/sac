<script setup>
import { pondState } from '../services/simulationEngine'
</script>

<template>
  <div class="card card-iot mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-cpu-fill text-primary"></i>
        <span class="fw-bold">Active Hardware Operations & Relay Execution</span>
        <span class="badge bg-light text-secondary border small">Remote Server Control</span>
      </div>
      <div class="small text-muted" style="font-size: 0.8rem;">
        Firmware Relay Matrix: <span class="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 font-monospace">ONLINE</span>
      </div>
    </div>

    <div class="card-body p-3">
      <div class="row g-3">
        <!-- 1. AERATOR & BLOWER PADDLEWHEEL -->
        <div class="col-md-6 col-xl-3">
          <div 
            class="p-3 rounded border h-100 d-flex flex-column justify-content-between transition-all"
            :class="pondState.aerator.state === 'running' ? 'bg-white border-info shadow-sm' : 'bg-light border-light-subtle'"
          >
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-semibold small text-dark d-flex align-items-center gap-1">
                  <i class="bi bi-fan text-info"></i> Aerator & Blower
                </span>
                <span 
                  class="badge font-monospace"
                  :class="pondState.aerator.state === 'running' ? 'bg-info text-white animate-pulse' : 'bg-secondary text-white'"
                  style="font-size: 0.72rem;"
                >
                  {{ pondState.aerator.state === 'running' ? `RUNNING (${pondState.aerator.powerPercent}%)` : 'STANDBY (OFF)' }}
                </span>
              </div>

              <!-- Animated Visual Icon -->
              <div class="text-center my-3">
                <div 
                  class="d-inline-flex align-items-center justify-content-center p-3 rounded-circle"
                  :class="pondState.aerator.state === 'running' ? 'bg-info bg-opacity-10 text-info border border-info border-opacity-25' : 'bg-white text-muted border'"
                  style="width: 65px; height: 65px;"
                >
                  <i 
                    class="bi bi-fan fs-2" 
                    :class="pondState.aerator.state === 'running' ? 'animate-spin-fast text-info' : 'text-muted'"
                  ></i>
                </div>
                <div class="mt-2 small" style="font-size: 0.78rem;">
                  <span v-if="pondState.aerator.state === 'running'" class="text-info fw-medium">
                    <i class="bi bi-arrow-up-circle-fill me-1"></i>DO Charging Active (+0.05 mg/L)
                  </span>
                  <span v-else class="text-danger fw-medium">
                    <i class="bi bi-exclamation-triangle-fill me-1"></i>Off (DO Decaying by Respiration)
                  </span>
                </div>
              </div>
            </div>

            <div class="pt-2 border-top small text-muted d-flex justify-content-between" style="font-size: 0.75rem;">
              <span>VFD Power: <strong class="text-dark">{{ pondState.aerator.powerPercent }}%</strong></span>
              <span>Mode: Continuous</span>
            </div>
          </div>
        </div>

        <!-- 2. AUTOMATED FEEDER -->
        <div class="col-md-6 col-xl-3">
          <div 
            class="p-3 rounded border h-100 d-flex flex-column justify-content-between transition-all"
            :class="pondState.feeder.state === 'running' ? 'bg-white border-success shadow-sm' : 'bg-light border-light-subtle'"
          >
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-semibold small text-dark d-flex align-items-center gap-1">
                  <i class="bi bi-basket text-success"></i> Automated Feeder
                </span>
                <span 
                  class="badge font-monospace"
                  :class="pondState.feeder.state === 'running' ? 'bg-success text-white animate-pulse' : 'bg-secondary text-white'"
                  style="font-size: 0.72rem;"
                >
                  {{ pondState.feeder.state === 'running' ? 'DISPENSING' : 'STANDBY' }}
                </span>
              </div>

              <!-- Animated Visual Icon -->
              <div class="text-center my-3">
                <div 
                  class="d-inline-flex align-items-center justify-content-center p-3 rounded-circle"
                  :class="pondState.feeder.state === 'running' ? 'bg-success bg-opacity-10 text-success border border-success border-opacity-25' : 'bg-white text-muted border'"
                  style="width: 65px; height: 65px;"
                >
                  <i 
                    class="bi bi-gear-fill fs-2" 
                    :class="pondState.feeder.state === 'running' ? 'animate-spin-fast text-success' : 'text-muted'"
                  ></i>
                </div>
                <div class="mt-2 small" style="font-size: 0.78rem;">
                  <span v-if="pondState.feeder.state === 'running'" class="text-success fw-semibold">
                    Dispensing Pellet Dose: <strong>{{ pondState.feeder.dose }}g</strong>
                  </span>
                  <span v-else class="text-muted">
                    Motor Standby (Awaiting Schedule)
                  </span>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="progress mb-2" style="height: 6px; background-color: #e2e8f0;">
                <div 
                  class="progress-bar progress-bar-striped progress-bar-animated bg-success" 
                  role="progressbar" 
                  :style="{ width: `${pondState.feeder.progress}%` }"
                ></div>
              </div>
            </div>

            <div class="pt-2 border-top small text-muted d-flex justify-content-between" style="font-size: 0.75rem;">
              <span>Total Today: <strong class="text-dark">{{ pondState.feeder.totalToday }}g</strong></span>
              <span>{{ pondState.feeder.lastTriggered ? `Last: ${pondState.feeder.lastTriggered}` : 'No cycle yet' }}</span>
            </div>
          </div>
        </div>

        <!-- 3. MOLASSES DOSING PUMP -->
        <div class="col-md-6 col-xl-3">
          <div 
            class="p-3 rounded border h-100 d-flex flex-column justify-content-between transition-all"
            :class="pondState.molassesPump.state === 'running' ? 'bg-white border-warning shadow-sm' : 'bg-light border-light-subtle'"
          >
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-semibold small text-dark d-flex align-items-center gap-1">
                  <i class="bi bi-funnel text-warning"></i> Molasses Dosing Pump
                </span>
                <span 
                  class="badge font-monospace"
                  :class="pondState.molassesPump.state === 'running' ? 'bg-warning text-dark animate-pulse' : 'bg-secondary text-white'"
                  style="font-size: 0.72rem;"
                >
                  {{ pondState.molassesPump.state === 'running' ? 'PUMPING' : 'STANDBY' }}
                </span>
              </div>

              <!-- Animated Visual Icon -->
              <div class="text-center my-3">
                <div 
                  class="d-inline-flex align-items-center justify-content-center p-3 rounded-circle"
                  :class="pondState.molassesPump.state === 'running' ? 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25' : 'bg-white text-muted border'"
                  style="width: 65px; height: 65px;"
                >
                  <i 
                    class="bi bi-droplet-half fs-2" 
                    :class="pondState.molassesPump.state === 'running' ? 'animate-bounce text-warning' : 'text-muted'"
                  ></i>
                </div>
                <div class="mt-2 small" style="font-size: 0.78rem;">
                  <span v-if="pondState.molassesPump.state === 'running'" class="text-warning fw-semibold">
                    Injecting Carbon: <strong>{{ pondState.molassesPump.dose }}ml</strong>
                  </span>
                  <span v-else class="text-muted">
                    Solenoid Valve Closed
                  </span>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="progress mb-2" style="height: 6px; background-color: #e2e8f0;">
                <div 
                  class="progress-bar progress-bar-striped progress-bar-animated bg-warning" 
                  role="progressbar" 
                  :style="{ width: `${pondState.molassesPump.progress}%` }"
                ></div>
              </div>
            </div>

            <div class="pt-2 border-top small text-muted d-flex justify-content-between" style="font-size: 0.75rem;">
              <span>Total Today: <strong class="text-dark">{{ pondState.molassesPump.totalToday }}ml</strong></span>
              <span>{{ pondState.molassesPump.lastTriggered ? `Last: ${pondState.molassesPump.lastTriggered}` : 'No cycle yet' }}</span>
            </div>
          </div>
        </div>

        <!-- 4. WATER CHANGE & SIPHON VALVE -->
        <div class="col-md-6 col-xl-3">
          <div 
            class="p-3 rounded border h-100 d-flex flex-column justify-content-between transition-all"
            :class="pondState.waterChange.state !== 'idle' ? 'bg-white border-primary shadow-sm' : 'bg-light border-light-subtle'"
          >
            <div>
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="fw-semibold small text-dark d-flex align-items-center gap-1">
                  <i class="bi bi-arrow-left-right text-primary"></i> Water Exchange Valve
                </span>
                <span 
                  class="badge font-monospace"
                  :class="pondState.waterChange.state !== 'idle' ? 'bg-primary text-white animate-pulse' : 'bg-secondary text-white'"
                  style="font-size: 0.72rem;"
                >
                  {{ pondState.waterChange.state !== 'idle' ? pondState.waterChange.phase : 'STANDBY' }}
                </span>
              </div>

              <!-- Animated Visual Icon -->
              <div class="text-center my-3">
                <div 
                  class="d-inline-flex align-items-center justify-content-center p-3 rounded-circle"
                  :class="pondState.waterChange.state !== 'idle' ? 'bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25' : 'bg-white text-muted border'"
                  style="width: 65px; height: 65px;"
                >
                  <i 
                    class="bi bi-arrow-repeat fs-2" 
                    :class="pondState.waterChange.state !== 'idle' ? 'animate-spin-fast text-primary' : 'text-muted'"
                  ></i>
                </div>
                <div class="mt-2 small" style="font-size: 0.78rem;">
                  <span v-if="pondState.waterChange.state !== 'idle'" class="text-primary fw-semibold">
                    {{ pondState.waterChange.phase }}: <strong>{{ pondState.waterChange.volume }}L</strong>
                  </span>
                  <span v-else class="text-muted">
                    Siphon & Valves Idle
                  </span>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="progress mb-2" style="height: 6px; background-color: #e2e8f0;">
                <div 
                  class="progress-bar progress-bar-striped progress-bar-animated bg-primary" 
                  role="progressbar" 
                  :style="{ width: `${pondState.waterChange.progress}%` }"
                ></div>
              </div>
            </div>

            <div class="pt-2 border-top small text-muted d-flex justify-content-between" style="font-size: 0.75rem;">
              <span>Total Exchanged: <strong class="text-dark">{{ pondState.waterChange.totalToday }}L</strong></span>
              <span>{{ pondState.waterChange.lastTriggered ? `Last: ${pondState.waterChange.lastTriggered}` : 'No flush yet' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
