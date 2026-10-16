<script setup>
import { useToast } from '../composables/useToast'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-vue-next'

const { toasts, removeToast } = useToast()
</script>

<template>
  <div class="toast-container">
    <transition-group name="toast-fade">
      <div 
        v-for="toast in toasts" 
        :key="toast.id" 
        class="toast-item"
        :class="'toast-' + toast.type"
      >
        <CheckCircle2 v-if="toast.type === 'success'" class="toast-icon success" :size="18" />
        <AlertTriangle v-else-if="toast.type === 'warning'" class="toast-icon warning" :size="18" />
        <Info v-else class="toast-icon info" :size="18" />
        
        <span class="toast-msg">{{ toast.message }}</span>
        
        <button class="toast-close" @click="removeToast(toast.id)" title="Tutup">
          <X :size="14" />
        </button>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-container {
  position: fixed;
  /* Clears the Windows taskbar when the window extends behind it. */
  bottom: 72px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: min(380px, calc(100vw - 48px));
}

.toast-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  color: #f8fafc;
  font-size: 0.85rem;
  font-weight: 500;
  line-height: 1.45;
}

.toast-success {
  border-color: rgba(16, 185, 129, 0.4);
}
.toast-warning {
  border-color: rgba(245, 158, 11, 0.4);
}
.toast-info {
  border-color: rgba(6, 182, 212, 0.4);
}

.toast-icon {
  flex-shrink: 0;
  margin-top: 2px;
}
.toast-icon.success { color: var(--emerald-400); }
.toast-icon.warning { color: var(--amber-400); }
.toast-icon.info { color: var(--cyan-400); }

.toast-msg {
  flex: 1;
  min-width: 0;
}

.toast-close {
  background: transparent;
  color: #cbd5e1;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-top: 2px;
  padding: 2px;
  border-radius: 4px;
}
.toast-close:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.1);
}

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition: all 0.3s ease;
}
.toast-fade-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
