<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePonds } from '../composables/usePonds'
import { 
  LayoutDashboard, 
  Layers, 
  Cpu, 
  FlaskConical, 
  FileText, 
  Waves,
  Sparkles,
  Bot,
  Activity,
  Box
} from 'lucide-vue-next'

const route = useRoute()
const { ponds } = usePonds()

const navItems = computed(() => [
  { id: 'dashboard', path: '/', label: 'Pond Overview', icon: LayoutDashboard, badge: null },
  { id: 'telemetry', path: '/telemetry', label: 'Water & Telemetry', icon: Activity, badge: 'Sensors' },
  { id: 'simulate', path: '/simulate', label: 'Pond Simulation', icon: Box, badge: '3D' },
  { id: 'copilot', path: '/copilot', label: 'Co-Pilot', icon: Bot, badge: 'AI Assistant' },
  { id: 'ponds', path: '/ponds', label: 'Ponds Fleet', icon: Layers, badge: `${ponds.value.length} Ponds` },
  { id: 'hardware', path: '/hardware', label: 'Equipment & Sensors', icon: Cpu, badge: null },
  { id: 'calculator', path: '/calculator', label: 'Molasses Calculator', icon: FlaskConical, badge: 'Biofloc' },
  { id: 'audit', path: '/audit', label: 'Activity Log', icon: FileText, badge: null }
])

const isItemActive = (item) => {
  if (item.path === '/') {
    return route.path === '/' || route.path === '/dashboard'
  }
  return route.path.startsWith(item.path)
}
</script>

<template>
  <aside class="app-sidebar">
    <!-- Brand Logo -->
    <div class="sidebar-brand-box">
      <div class="brand-logo-icon">
        <Waves class="logo-icon" :size="20" />
      </div>
      <div class="brand-texts">
        <div class="title-row">
          <span class="brand-title font-display">SAMPAY</span>
          <span class="version-tag">BIOFLOC</span>
        </div>
        <span class="brand-sub">Smart Tilapia Co-Pilot</span>
      </div>
    </div>

    <!-- Navigation Section -->
    <nav class="sidebar-nav">
      <div class="nav-section-title">MAIN MENU</div>
      <ul class="nav-list">
        <li v-for="item in navItems" :key="item.id">
          <router-link 
            :to="item.path"
            :id="'nav-' + item.id"
            class="nav-link"
            :class="{ active: isItemActive(item) }"
          >
            <component :is="item.icon" class="nav-icon" :size="18" />
            <span class="nav-label">{{ item.label }}</span>
            <span v-if="item.badge" class="nav-badge" :class="item.id === 'copilot' ? 'badge-ai' : ''">
              {{ item.badge }}
            </span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Google Cloud AI Builder Cup Badge -->
    <div class="competition-card">
      <div class="comp-icon-row">
        <Sparkles :size="15" class="text-sky" />
        <span class="comp-title">Google Cloud AI Cup</span>
      </div>
      <p class="comp-desc">Autonomous AI Operating System for Biofloc Aquaculture</p>
      <div class="comp-status font-mono">
        <span class="pulse-dot online"></span>
        <span>Gemini 2.5 Agent Ready</span>
      </div>
    </div>

    <!-- Supervisor Profile Card -->
    <div class="sidebar-footer">
      <div class="operator-box">
        <div class="operator-avatar">
          <span>IH</span>
        </div>
        <div class="operator-details">
          <span class="operator-name">Ilfa Hidayat</span>
          <span class="operator-role">Farm Supervisor</span>
        </div>
      </div>
      <div class="farm-meta">
        <span>Location: Biofloc Unit #01</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 270px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  padding: 20px 16px;
  flex-shrink: 0;
  z-index: 100;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.02);
}

.sidebar-brand-box {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 20px;
}

.brand-logo-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--sky-500) 0%, var(--emerald-500) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
}

.brand-texts {
  display: flex;
  flex-direction: column;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.brand-title {
  font-size: 1.2rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: var(--text-primary);
}

.version-tag {
  font-size: 0.62rem;
  font-weight: 800;
  background: var(--sky-100);
  color: var(--sky-700);
  padding: 2px 6px;
  border-radius: 4px;
  letter-spacing: 0.05em;
}

.brand-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
  font-weight: 500;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
}

.nav-section-title {
  font-size: 0.68rem;
  font-weight: 700;
  color: var(--text-subtle);
  letter-spacing: 0.06em;
  margin-bottom: 10px;
  padding-left: 10px;
}

.nav-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-link {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px;
  border-radius: 9px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 0.84rem;
  font-weight: 600;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-link:hover {
  background: var(--bg-surface-subtle);
  color: var(--text-primary);
}

.nav-link.active {
  background: var(--sky-50);
  color: var(--sky-700);
  font-weight: 700;
}
.nav-link.active .nav-icon {
  color: var(--sky-600);
}

.nav-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
}

.nav-badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  background: var(--bg-surface-subtle);
  color: var(--text-muted);
}

.nav-badge.badge-ai {
  background: var(--purple-100);
  color: var(--purple-700);
}

.competition-card {
  background: linear-gradient(135deg, #f8fafc 0%, #f0f9ff 100%);
  border: 1px solid var(--sky-100);
  border-radius: 12px;
  padding: 12px 14px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.comp-icon-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.comp-title {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--sky-700);
}

.text-sky { color: var(--sky-600); }

.comp-desc {
  font-size: 0.68rem;
  color: var(--text-muted);
  line-height: 1.35;
}

.comp-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.65rem;
  color: var(--emerald-700);
  margin-top: 4px;
  font-weight: 600;
}

.sidebar-footer {
  padding-top: 14px;
  border-top: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.operator-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.operator-avatar {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--sky-600);
  color: #ffffff;
  font-weight: 700;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.operator-details {
  display: flex;
  flex-direction: column;
}

.operator-name {
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text-primary);
}

.operator-role {
  font-size: 0.68rem;
  color: var(--text-muted);
}

.farm-meta {
  font-size: 0.68rem;
  color: var(--text-subtle);
}
</style>
