<script setup>
import { ref } from 'vue'
import { usePonds } from '../composables/usePonds'
import { useToast } from '../composables/useToast'
import { SlidersHorizontal, RotateCcw } from 'lucide-vue-next'

const emit = defineEmits(['toggle-simulator'])
const { refreshFromApi } = usePonds()
const { showToast } = useToast()
const isResetting = ref(false)
const resetError = ref('')

defineProps({
  simulatorOpen: {
    type: Boolean,
    default: false
  }
})

const handleResetDemo = async () => {
  if (isResetting.value) return
  isResetting.value = true
  resetError.value = ''
  try {
    const response = await fetch('/api/demo/reset', {
      method: 'POST',
      headers: { Accept: 'application/json' }
    })
    if (!response.ok) {
      resetError.value = `Reset failed (${response.status}).`
      showToast('Demo was not reset. The API returned an error.', 'error')
      return
    }
    await refreshFromApi()
    showToast('Demo reset. Pond readings were reloaded from the API.', 'success')
  } catch {
    resetError.value = 'API unreachable.'
    showToast('API is unreachable. Demo was not reset.', 'error')
  } finally {
    isResetting.value = false
  }
}
</script>

<template>
  <header class="top-header-fixed">
    <p class="simulated-label">Simulated</p>

    <div class="header-actions-group">
      <button
        id="btn-reset-demo"
        type="button"
        class="btn-reset-demo"
        :disabled="isResetting"
        aria-label="Reset demo"
        @click="handleResetDemo"
      >
        <RotateCcw :size="15" aria-hidden="true" />
        <span>{{ isResetting ? 'Resetting…' : 'Reset demo' }}</span>
      </button>
      <span v-if="resetError" class="reset-error" role="alert">{{ resetError }}</span>

      <button
        id="btn-toggle-simulator"
        type="button"
        class="btn-simulator"
        :class="{ active: simulatorOpen }"
        :aria-pressed="simulatorOpen"
        aria-label="Open demo scenarios"
        @click="emit('toggle-simulator')"
      >
        <SlidersHorizontal :size="15" aria-hidden="true" />
        <span>Demo scenarios</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.top-header-fixed {
  position: fixed;
  top: 0;
  right: 0;
  left: 250px;
  min-height: 56px;
  background: #ffffff;
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 20px;
  z-index: 90;
}

.simulated-label {
  margin: 0;
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--emerald-50);
  border: 1px solid var(--emerald-600);
  color: var(--emerald-700);
  font-size: 0.82rem;
  font-weight: 700;
}

.header-actions-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.btn-reset-demo,
.btn-simulator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 700;
}

.btn-reset-demo {
  background: var(--amber-50);
  border: 1px solid var(--amber-600);
  color: var(--amber-700);
  cursor: pointer;
}

.btn-reset-demo:disabled {
  opacity: 0.7;
  cursor: wait;
}

.reset-error {
  color: var(--rose-700);
  font-size: 0.78rem;
  font-weight: 700;
}

.btn-simulator {
  background: var(--sky-50);
  border: 1px solid var(--sky-600);
  color: var(--sky-700);
}

.btn-simulator:hover,
.btn-simulator.active {
  background: var(--sky-600);
  color: #ffffff;
  border-color: var(--sky-600);
}

@media (max-width: 768px) {
  .top-header-fixed {
    position: static;
    left: auto;
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
