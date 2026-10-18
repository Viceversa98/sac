import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import WaterTelemetryView from '../views/WaterTelemetryView.vue'
import CopilotView from '../views/CopilotView.vue'
import PondsManagementView from '../views/PondsManagementView.vue'
import HardwareNodesView from '../views/HardwareNodesView.vue'
import BioflocCalculatorView from '../views/BioflocCalculatorView.vue'
import LogAuditView from '../views/LogAuditView.vue'
import CloudDataView from '../views/CloudDataView.vue'
import PondSimulationView from '../views/PondSimulationView.vue'

const routes = [
  {
    path: '/',
    alias: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { title: 'Pond Overview — Sampay Biofloc' }
  },
  {
    path: '/telemetry',
    name: 'telemetry',
    component: WaterTelemetryView,
    meta: { title: 'Water Quality & Telemetry — Sampay Biofloc' }
  },
  {
    path: '/simulate',
    name: 'simulate',
    component: PondSimulationView,
    meta: { title: 'Isometric Pond Simulation — Sampay Biofloc' }
  },
  {
    path: '/copilot',
    name: 'copilot',
    component: CopilotView,
    meta: { title: 'Co-Pilot AI — Sampay Biofloc' }
  },
  {
    path: '/ponds',
    name: 'ponds',
    component: PondsManagementView,
    meta: { title: 'Ponds Fleet — Sampay Biofloc' }
  },
  {
    path: '/hardware',
    name: 'hardware',
    component: HardwareNodesView,
    meta: { title: 'Equipment & Sensors — Sampay Biofloc' }
  },
  {
    path: '/calculator',
    name: 'calculator',
    component: BioflocCalculatorView,
    meta: { title: 'Molasses Calculator — Sampay Biofloc' }
  },
  {
    path: '/audit',
    name: 'audit',
    component: LogAuditView,
    meta: { title: 'Activity Log & Ledger — Sampay Biofloc' }
  },
  {
    path: '/cloud',
    name: 'cloud',
    component: CloudDataView,
    meta: { title: 'Cloud data — Sampay Biofloc' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title
  }
})

export default router
