<script setup>
import { useRoute } from 'vue-router'
import {
  LayoutDashboard,
  Layers,
  Cpu,
  FlaskConical,
  FileText,
  Waves,
  Bot,
  Activity,
  Box
} from 'lucide-vue-next'

const route = useRoute()

const navGroups = [
  {
    id: 'watch',
    label: 'Watch',
    items: [
      { id: 'dashboard', path: '/', label: 'Overview', icon: LayoutDashboard },
      { id: 'telemetry', path: '/telemetry', label: 'Water', icon: Activity },
      { id: 'simulate', path: '/simulate', label: 'Pond picture', icon: Box }
    ]
  },
  {
    id: 'decide',
    label: 'Decide',
    items: [
      { id: 'copilot', path: '/copilot', label: 'Co-pilot', icon: Bot },
      { id: 'calculator', path: '/calculator', label: 'Molasses', icon: FlaskConical }
    ]
  },
  {
    id: 'records',
    label: 'Records',
    items: [
      { id: 'ponds', path: '/ponds', label: 'Ponds', icon: Layers },
      { id: 'hardware', path: '/hardware', label: 'Equipment', icon: Cpu },
      { id: 'audit', path: '/audit', label: 'Log', icon: FileText }
    ]
  }
]

const isItemActive = (item) => {
  if (item.path === '/') {
    return route.path === '/' || route.path === '/dashboard'
  }
  return route.path.startsWith(item.path)
}
</script>

<template>
  <aside class="app-sidebar">
    <div class="sidebar-brand-box">
      <div class="brand-logo-icon" aria-hidden="true">
        <Waves class="logo-icon" :size="20" />
      </div>
      <div class="brand-texts">
        <span class="brand-title">Sampay</span>
        <p class="brand-purpose">Watch ponds, decide the next dose, and record what happened.</p>
      </div>
    </div>

    <nav class="sidebar-nav" aria-label="Main">
      <div v-for="group in navGroups" :key="group.id" class="nav-group">
        <div class="nav-section-title">{{ group.label }}</div>
        <ul class="nav-list">
          <li v-for="item in group.items" :key="item.id">
            <router-link
              :to="item.path"
              :id="'nav-' + item.id"
              class="nav-link"
              :class="{ active: isItemActive(item) }"
            >
              <component :is="item.icon" class="nav-icon" :size="18" aria-hidden="true" />
              <span class="nav-label">{{ item.label }}</span>
            </router-link>
          </li>
        </ul>
      </div>
    </nav>
  </aside>
</template>

<style scoped>
.app-sidebar {
  width: 250px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  padding: 16px;
  flex-shrink: 0;
  z-index: 100;
}

.sidebar-brand-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-subtle);
  margin-bottom: 16px;
}

.brand-logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--sky-600);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ffffff;
  flex-shrink: 0;
}

.brand-texts {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.brand-title {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--text-primary);
}

.brand-purpose {
  margin: 0;
  font-size: var(--text-sm);
  line-height: 1.4;
  color: var(--text-secondary);
  font-weight: 500;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
  overflow-y: auto;
}

.nav-section-title {
  font-size: var(--text-xs);
  font-weight: 700;
  color: var(--text-secondary);
  margin-bottom: 8px;
  padding-left: 8px;
}

.nav-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-link {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background: transparent;
  color: var(--text-secondary);
  font-size: var(--text-sm);
  font-weight: 600;
  transition: background-color 200ms ease, color 200ms ease;
  text-align: left;
  text-decoration: none;
}

.nav-link:hover {
  background: var(--bg-surface-subtle);
  color: var(--text-primary);
}

.nav-link.active {
  background: var(--sky-50);
  color: var(--sky-700);
}

.nav-link.active .nav-icon {
  color: var(--sky-700);
}

.nav-icon {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.nav-label {
  flex: 1;
}

@media (max-width: 768px) {
  .brand-purpose {
    font-size: var(--text-md);
  }

  .app-sidebar {
    position: relative;
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border-subtle);
    padding: 16px;
  }

  .sidebar-nav {
    overflow: visible;
    gap: 16px;
  }

  .nav-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .nav-list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 8px;
  }

  .nav-link {
    width: auto;
    padding: 8px 12px;
  }
}
</style>
