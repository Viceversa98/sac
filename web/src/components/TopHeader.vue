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
  padding: 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 600;
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
  gap: 8px;
  min-height: 40px;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-medium);
  background: #ffffff;
  color: var(--text-primary);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}

.btn-reset-demo:hover {
  background: var(--bg-surface-subtle);
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

.btn-simulator:hover {
  background: var(--bg-surface-subtle);
}

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
