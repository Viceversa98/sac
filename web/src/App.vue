<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from './components/Sidebar.vue'
import TopHeader from './components/TopHeader.vue'
import ScenarioSimulatorBar from './components/ScenarioSimulatorBar.vue'
import ToastContainer from './components/ToastContainer.vue'

const route = useRoute()
const isSimulatorOpen = ref(false)
const isViewportFit = computed(() => route.name === 'simulate')

const toggleSimulator = () => {
  isSimulatorOpen.value = !isSimulatorOpen.value
}
</script>

<template>
  <div class="layout-wrapper" :class="{ 'layout-wrapper--fit': isViewportFit }">
    <!-- Left Navigation Sidebar -->
    <Sidebar />

    <!-- Main Content Container with Fixed Top Header -->
    <div class="main-content-wrapper">
      <!-- Fixed Top Header Bar -->
      <TopHeader 
        :simulator-open="isSimulatorOpen" 
        @toggle-simulator="toggleSimulator" 
      />

      <!-- Content Area with proper top padding for fixed header -->
      <main class="page-body">
        <router-view />
      </main>
    </div>

    <!-- Floating Scenario Simulator Drawer -->
    <ScenarioSimulatorBar 
      v-if="isSimulatorOpen" 
      @close="isSimulatorOpen = false" 
    />

    <!-- Global Toast Container -->
    <ToastContainer />
  </div>
</template>

<style scoped>
.layout-wrapper {
  display: flex;
  min-height: 100vh;
  background-color: var(--bg-body);
}

.main-content-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  margin-left: 270px; /* Offset for fixed sidebar */
}

.page-body {
  padding: 84px 32px 48px; /* Top padding 84px to clear 64px fixed header */
  flex: 1;
  max-width: 1600px;
  width: 100%;
}

.dashboard-full-view {
  display: flex;
  flex-direction: column;
}

.dashboard-operations-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 16px;
  margin-bottom: 16px;
  align-items: stretch;
}

@media (max-width: 1100px) {
  .dashboard-operations-grid {
    grid-template-columns: 1fr;
  }
}

.copilot-dedicated-view {
  width: 100%;
}

.copilot-page-container {
  max-width: 980px;
  margin: 0 auto;
}

.full-view-container {
  width: 100%;
}

@media (max-width: 1280px) {
  .main-content-wrapper {
    margin-left: 240px;
  }
}

.layout-wrapper--fit {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
}

.layout-wrapper--fit .main-content-wrapper {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  min-height: 0;
}

.layout-wrapper--fit .page-body {
  margin-top: 64px;
  height: calc(100vh - 64px);
  max-height: calc(100vh - 64px);
  padding: 8px 14px 10px;
  overflow: hidden;
  max-width: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: none;
}

@media (max-width: 768px) {
  .main-content-wrapper {
    margin-left: 0;
  }
  .page-body {
    padding: 80px 16px 32px;
  }
  .layout-wrapper--fit .page-body {
    padding: 8px 12px 8px;
  }
}
</style>
