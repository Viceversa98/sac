<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePonds } from '../composables/usePonds'
import TodayExecutionSchedule from '../components/TodayExecutionSchedule.vue'
import SimulatedBanner from '../components/SimulatedBanner.vue'
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  ArrowUpRight, 
  Activity, 
  Layers, 
  Fish, 
  Scale, 
  Droplets, 
  Flame, 
  ShieldCheck, 
  TrendingUp, 
  Clock, 
  Cpu, 
  SlidersHorizontal,
  ChevronRight,
  AlertTriangle
} from 'lucide-vue-next'

const router = useRouter()
const { ponds, globalFarmMetrics, setPond } = usePonds()

// Executive synthesized assessments for each pond
const pondAssessments = computed(() => {
  return ponds.value.map(pond => {
    let score = 96
    let verdict = 'OPTIMAL EQUILIBRIUM'
    let verdictClass = 'verdict-optimal'
    let synthesis = ''
    let keyAction = ''

    if (pond.id === 'K01') {
      score = 98
      verdict = 'READY FOR HARVEST'
      verdictClass = 'verdict-harvest'
      synthesis = 'Kondisi air sangat matang dengan konsorsium flok heterotrof stabil (14 mL/L). DO prima (> 6.0 mg/L) menjaga respon nafsu makan tinggi pada fase finisher. Ikan telah mencapai 920g (97% dari target) dan siap dipanen bertahap.'
      keyAction = 'Jadwalkan panen parsial 300 kg & kurangi pakan 10% sebelum sampling'
    } else if (pond.id === 'K02') {
      score = 95
      verdict = 'RAPID BIOMASS GAIN'
      verdictClass = 'verdict-growth'
      synthesis = 'Fase grower berjalan agresif dengan pertambahan bobot harian (ADG) +4.05 g/hari. Asimilasi C:N 15:1 sukses mengunci TAN pada 0.025 mg/L. Nilai konversi pakan (FCR 1.14) tergolong superior.'
      keyAction = 'Pertahankan aerasi 75% RPM & berikan molase 600g pasca pakan sore'
    } else if (pond.id === 'K03') {
      score = 97
      verdict = 'NURSERY EXCELLENCE'
      verdictClass = 'verdict-nursery'
      synthesis = 'Benih F1 beradaptasi prima dengan Survival Rate (SR) 96.8%. Aerasi micro-bubble menjaga DO 6.74 mg/L tanpa gejolak arus. Kepadatan flok 8 mL/L ideal untuk pakan alami larva tilapia.'
      keyAction = 'Persiapan grading ukuran 100g dalam 5 hari untuk dipindah ke Grower'
    } else if (pond.id === 'K04') {
      score = 96
      verdict = 'BIOFLOC MASTER DEMO'
      verdictClass = 'verdict-demo'
      synthesis = 'Flok microbial loop berfungsi 100% dengan sensor Imhoff-Vision AI terkalibrasi. Zero water exchange sukses berjalan 96 hari dengan akumulasi nitrifikasi dan asimilasi heterotrof seimbang sempurna.'
      keyAction = 'Pertahankan jadwal otomatis: 4x pakan harian + 1x molase auto-dose'
    } else {
      score = 94
      verdict = 'STABLE CULTURE'
      verdictClass = 'verdict-optimal'
      synthesis = `Kondisi air stabil pada DO ${pond.telemetry?.do || 6.0} mg/L dan TAN ${pond.telemetry?.ammonia || 0.02} mg/L. Pertumbuhan biomassa sesuai kurva target.`
      keyAction = 'Monitoring rutin harian'
    }

    const currentBiomassKg = Math.round((pond.fishCount * pond.avgWeightGrams) / 1000)
    const targetHarvestWeight = pond.targetHarvestWeightGrams || 850
    const harvestProgress = Math.min(100, Math.round((pond.avgWeightGrams / targetHarvestWeight) * 100))

    return {
      ...pond,
      score,
      verdict,
      verdictClass,
      synthesis,
      keyAction,
      currentBiomassKg,
      targetHarvestWeight,
      harvestProgress
    }
  })
})

const navigateToTelemetry = (pondId) => {
  if (pondId) setPond(pondId)
  router.push('/telemetry')
}

const navigateToFleet = () => {
  router.push('/ponds')
}
</script>

<template>
  <div class="pond-overview-view">
    <SimulatedBanner />
    <!-- View Header -->
    <div class="view-header glass-panel">
      <div class="header-left">
        <div class="icon-box">
          <Award :size="22" class="text-sky" />
        </div>
        <div>
          <div class="title-row">
            <h2 class="view-title font-display">Ponds Overview & Executive Synthesis</h2>
            <span class="badge-status-cluster font-mono">
              <span class="pulse-dot online"></span>
              4/4 Ponds in Microbial Equilibrium
            </span>
          </div>
          <span class="view-sub font-mono">
            Resume sintesis kondisi biologi, indeks kesehatan bioflok, dan penilaian status akhir tiap kolam budidaya
          </span>
        </div>
      </div>

      <!-- Quick Route Shortcuts -->
      <div class="header-actions font-mono">
        <button
          id="btn-goto-telemetry"
          type="button"
          class="btn-header-act"
          @click="navigateToTelemetry()"
        >
          <Activity :size="14" />
          <span>Water Quality & Telemetry</span>
          <ArrowUpRight :size="12" />
        </button>
        <button
          id="btn-goto-fleet"
          type="button"
          class="btn-header-act primary"
          @click="navigateToFleet()"
        >
          <Layers :size="14" />
          <span>Ponds Fleet & Biomass</span>
          <ArrowUpRight :size="12" />
        </button>
      </div>
    </div>

    <!-- 4 Farm Health & Biosecurity Strip -->
    <div class="farm-kpis-strip font-mono">
      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-lbl">Farm Health Index</span>
          <ShieldCheck :size="15" class="text-emerald" />
        </div>
        <div class="kpi-val-row">
          <span class="kpi-num text-emerald">96.5%</span>
          <span class="kpi-unit">Optimal</span>
        </div>
        <span class="kpi-subtext">All 4 ponds within safe biosecurity band</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-lbl">Total Live Biomass</span>
          <Fish :size="15" class="text-sky" />
        </div>
        <div class="kpi-val-row">
          <span class="kpi-num text-sky">{{ globalFarmMetrics.totalBiomassKg.toLocaleString() }}</span>
          <span class="kpi-unit">kg</span>
        </div>
        <span class="kpi-subtext">+{{ globalFarmMetrics.totalBiomassGainKg.toLocaleString() }} kg net biomass gain</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-lbl">Weighted Farm FCR</span>
          <Scale :size="15" class="text-emerald" />
        </div>
        <div class="kpi-val-row">
          <span class="kpi-num text-emerald">{{ globalFarmMetrics.fcr }}</span>
          <span class="kpi-unit">Ratio</span>
        </div>
        <span class="kpi-subtext">Superior conversion (Target &lt; 1.25)</span>
      </div>

      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-lbl">Biosecurity & Alarms</span>
          <CheckCircle2 :size="15" class="text-emerald" />
        </div>
        <div class="kpi-val-row">
          <span class="kpi-num text-emerald">0</span>
          <span class="kpi-unit">Critical Alerts</span>
        </div>
        <span class="kpi-subtext">Zero ammonia spike • Zero water exchange</span>
      </div>
    </div>

    <!-- AI Executive Synthesis Banner -->
    <div class="executive-synthesis-banner glass-panel">
      <div class="banner-icon-col">
        <div class="ai-sparkle-box">
          <Sparkles :size="20" class="text-sky" />
        </div>
      </div>
      <div class="banner-content">
        <div class="banner-title-row">
          <span class="banner-title font-display">Executive Biofloc Synthesis & Autonomous Assessment</span>
          <span class="badge-ai-model font-mono">Gemini 2.5 Biofloc Engine</span>
        </div>
        <p class="banner-paragraph">
          Berdasarkan analisis telemetri berkelanjutan dan siklus asimilasi C:N 15:1, seluruh <strong>4 kolam produksi</strong> berada dalam kesetimbangan mikroba optimal. Oksigen terlarut (DO) berada stabil di atas ambang aman (&gt; 5.5 mg/L), kepadatan flok heterotrof matang (8–14 mL/L), dan TAN terkunci di bawah 0.025 mg/L. Kolam #1 (Finisher A) telah mencapai 97% bobot panen dan direkomendasikan untuk <strong>panen bertahap</strong>.
        </p>
        <p class="english-caption" lang="en">
          English: Review of 4 production ponds. Dissolved oxygen is described as stable above 5.5 mg/L, floc density 8–14 mL/L, and TAN below 0.025 mg/L. Pond #1 (Finisher A) is at 97% of harvest weight, with a staged harvest suggested. These figures are the on-screen synthesis. The feed is simulated.
        </p>
      </div>
    </div>

    <!-- 4 Pond Synthesized Assessment Cards Grid -->
    <div class="assessment-section-header">
      <div class="section-title-wrap">
        <CheckCircle2 :size="18" class="text-emerald" />
        <h3 class="section-title font-display">Synthesized Status Resume & Final Assessment (Per Kolam)</h3>
      </div>
      <span class="section-sub font-mono">
        Diagnosis mendalam biologi air, stabilitas konsorsium flok, dan rekomendasi eksekusi hari ini
      </span>
    </div>

    <div class="assessment-cards-grid">
      <div 
        v-for="item in pondAssessments" 
        :key="item.id" 
        class="pond-scorecard glass-panel"
      >
        <!-- Card Top Bar: Pond ID, Name, & Final Verdict Score -->
        <div class="card-head">
          <div class="head-left">
            <span class="pond-id-chip font-mono">{{ item.id }}</span>
            <div class="pond-title-group">
              <span class="pond-name font-display">{{ item.name }}</span>
              <span class="pond-phase font-mono">{{ item.species }} • DOC {{ item.doc || 60 }}</span>
            </div>
          </div>
          <div class="head-right">
            <div class="score-badge font-mono" :class="item.verdictClass">
              <span class="score-val">{{ item.score }}/100</span>
              <span class="verdict-text">{{ item.verdict }}</span>
            </div>
          </div>
        </div>

        <!-- Executive Narrative Diagnosis (Synthesized Resume) -->
        <div class="synthesis-box">
          <span class="synthesis-label font-mono">
            <Sparkles :size="11" class="text-sky" />
            Resume Sintesis Kondisi:
          </span>
          <p class="synthesis-text font-sans">
            {{ item.synthesis }}
          </p>
        </div>

        <!-- Key Synthesis Indicators (DO, TAN, Floc, Biomass) -->
        <div class="indicators-matrix font-mono">
          <div class="indicator-item">
            <span class="ind-lbl">Dissolved Oxygen</span>
            <span class="ind-val text-sky">
              {{ item.telemetry?.do || 6.2 }} mg/L
              <small class="text-emerald">(Safe)</small>
            </span>
          </div>

          <div class="indicator-item">
            <span class="ind-lbl">Total Ammonia (TAN)</span>
            <span class="ind-val text-emerald">
              {{ item.telemetry?.ammonia || 0.02 }} mg/L TAN
              <small class="text-emerald">(Clean)</small>
            </span>
          </div>

          <div class="indicator-item">
            <span class="ind-lbl">Floc Density (Imhoff)</span>
            <span class="ind-val text-purple">
              {{ item.telemetry?.flocDensity || 12 }} mL/L
              <small class="text-muted">(Stable)</small>
            </span>
          </div>

          <div class="indicator-item">
            <span class="ind-lbl">Live Population & SR</span>
            <span class="ind-val text-primary">
              {{ item.fishCount?.toLocaleString() }} ekor
              <small class="text-purple">({{ item.survivalRate || 95 }}% SR)</small>
            </span>
          </div>
        </div>

        <!-- Growth Progress Bar towards Target Harvest -->
        <div class="harvest-progress-block font-mono">
          <div class="progress-head">
            <span class="prog-lbl">Target Harvest Progress ({{ item.avgWeightGrams }}g / {{ item.targetHarvestWeight }}g)</span>
            <span class="prog-pct">{{ item.harvestProgress }}%</span>
          </div>
          <div class="prog-bar-track">
            <div class="prog-bar-fill" :style="{ width: item.harvestProgress + '%' }"></div>
          </div>
        </div>

        <!-- Today's Action & Priority Plan -->
        <div class="action-plan-box font-mono">
          <div class="action-plan-title">
            <Clock :size="12" class="text-amber" />
            <span>Rekomendasi Tindakan Hari Ini:</span>
          </div>
          <span class="action-plan-text font-sans">
            {{ item.keyAction }}
          </span>
        </div>

        <!-- Card Footer Shortcuts -->
        <div class="card-footer font-mono">
          <button
            :id="'btn-inspect-telemetry-' + item.id"
            type="button"
            class="btn-card-shortcut telemetry"
            aria-label="Inspect telemetry"
            @click="navigateToTelemetry(item.id)"
          >
            <Activity :size="12" />
            <span>Inspect Telemetry</span>
            <ArrowUpRight :size="12" />
          </button>
          <button
            :id="'btn-manage-fleet-' + item.id"
            type="button"
            class="btn-card-shortcut fleet"
            aria-label="Open ponds fleet"
            @click="navigateToFleet()"
          >
            <Layers :size="12" />
            <span>Biomass & Fleet</span>
            <ArrowUpRight :size="12" />
          </button>
        </div>
      </div>
    </div>

    <!-- Integrated Daily Action Schedule for All Ponds -->
    <div class="daily-roadmap-section">
      <TodayExecutionSchedule />
    </div>

    <!-- Comparative Scorecard Matrix Table (Resume Perbandingan) -->
    <div class="comparative-table-card glass-panel font-mono">
      <div class="table-card-head">
        <div class="t-title-wrap">
          <Scale :size="16" class="text-sky" />
          <span class="table-card-title font-display">Farm Cross-Pond Comparative Assessment Matrix</span>
        </div>
        <span class="table-card-sub">Parameter perbandingan langsung seluruh 4 kolam budidaya</span>
      </div>

      <div class="table-scroll-wrap">
        <table class="comparative-table">
          <thead>
            <tr>
              <th style="width: 130px;">Pond ID</th>
              <th style="width: 180px;">Culture Phase & DOC</th>
              <th style="width: 140px;">Final Verdict Score</th>
              <th style="width: 150px;">Key Water Parameters</th>
              <th style="width: 140px;">Biomass & SR</th>
              <th>Today's Action Focus</th>
              <th style="width: 130px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in pondAssessments" :key="item.id">
              <td>
                <span class="pond-row-tag">{{ item.id }}</span>
                <span class="pond-row-name">{{ item.name.split('—')[0] }}</span>
              </td>
              <td>
                <span class="d-bold font-sans">{{ item.phase }}</span>
                <span class="text-muted">DOC {{ item.doc || 60 }} Days</span>
              </td>
              <td>
                <span class="table-score-badge" :class="item.verdictClass">
                  {{ item.score }}/100 • {{ item.verdict.split(' ')[0] }}
                </span>
              </td>
              <td>
                <div class="t-params">
                  <span>DO: <strong>{{ item.telemetry?.do }}</strong></span>
                  <span>TAN: <strong>{{ item.telemetry?.ammonia }}</strong></span>
                  <span>Flok: <strong>{{ item.telemetry?.flocDensity }}mL</strong></span>
                </div>
              </td>
              <td>
                <span class="d-bold">{{ item.currentBiomassKg }} kg</span>
                <span class="text-purple">{{ item.survivalRate }}% SR</span>
              </td>
              <td class="font-sans text-muted">
                {{ item.keyAction }}
              </td>
              <td style="text-align: right;">
                <button type="button" class="btn-table-inspect" aria-label="Inspect telemetry" @click="navigateToTelemetry(item.id)">
                  Inspect
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.pond-overview-view {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* Header */
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 14px 20px;
  box-shadow: var(--shadow-xs);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-box {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: var(--sky-50);
  border: 1px solid var(--sky-100);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.view-title {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.badge-status-cluster {
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--emerald-700);
  background: var(--emerald-50);
  border: 1px solid var(--emerald-200);
  padding: 2px 8px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.view-sub {
  font-size: 0.72rem;
  color: var(--text-muted);
  display: block;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-header-act {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 0.72rem;
  font-weight: 700;
  background: #ffffff;
  border: 1px solid var(--border-medium);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-header-act:hover {
  background: var(--sky-50);
  border-color: var(--sky-300);
  color: var(--sky-700);
}
.btn-header-act.primary {
  background: var(--sky-600);
  border-color: var(--sky-600);
  color: #ffffff;
}
.btn-header-act.primary:hover {
  background: var(--sky-700);
}

/* 4 Farm KPIs Strip */
.farm-kpis-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.kpi-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  box-shadow: var(--shadow-xs);
}

.kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.kpi-lbl {
  font-size: 0.64rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.kpi-val-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 2px 0;
}

.kpi-num {
  font-size: 1.25rem;
  font-weight: 800;
}

.kpi-unit {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--text-muted);
}

.kpi-subtext {
  font-size: 0.64rem;
  color: var(--text-muted);
}

/* AI Synthesis Banner */
.executive-synthesis-banner {
  display: flex;
  gap: 16px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  border: 1px solid var(--sky-200);
  border-radius: 12px;
  padding: 14px 18px;
  align-items: flex-start;
}

.ai-sparkle-box {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid var(--sky-200);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(14, 165, 233, 0.15);
}

.banner-content {
  flex: 1;
}

.banner-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}

.banner-title {
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--sky-900);
}

.badge-ai-model {
  font-size: 0.62rem;
  font-weight: 700;
  background: #ffffff;
  color: var(--sky-700);
  border: 1px solid var(--sky-300);
  padding: 1px 7px;
  border-radius: 999px;
}

.banner-paragraph {
  font-size: 0.76rem;
  color: var(--sky-950);
  line-height: 1.45;
  margin: 0;
}

.english-caption {
  margin: 8px 0 0;
  font-size: 0.74rem;
  line-height: 1.45;
  color: var(--text-secondary);
}

/* Assessment Section */
.assessment-section-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-top: 4px;
}

.section-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title {
  font-size: 1rem;
  font-weight: 800;
  color: var(--text-primary);
  margin: 0;
}

.section-sub {
  font-size: 0.68rem;
  color: var(--text-muted);
}

/* 4 Scorecards Grid */
.assessment-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.pond-scorecard {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: var(--shadow-xs);
  transition: all 0.2s ease;
}
.pond-scorecard:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--sky-200);
}

.card-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--border-subtle);
}

.head-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pond-id-chip {
  background: var(--sky-600);
  color: #ffffff;
  font-size: 0.72rem;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 6px;
}

.pond-title-group {
  display: flex;
  flex-direction: column;
}

.pond-name {
  font-size: 0.95rem;
  font-weight: 800;
  color: var(--text-primary);
}

.pond-phase {
  font-size: 0.66rem;
  color: var(--text-muted);
}

/* Verdict Badges */
.score-badge {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding: 4px 10px;
  border-radius: 8px;
}

.score-val {
  font-size: 0.92rem;
  font-weight: 800;
}

.verdict-text {
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.03em;
}

.verdict-harvest {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}
.verdict-growth {
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
}
.verdict-nursery {
  background: #faf5ff;
  color: #7e22ce;
  border: 1px solid #e9d5ff;
}
.verdict-demo {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}
.verdict-optimal {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

/* Synthesis Box */
.synthesis-box {
  background: var(--bg-surface-subtle);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 10px 12px;
}

.synthesis-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.64rem;
  font-weight: 800;
  color: var(--sky-800);
  text-transform: uppercase;
  margin-bottom: 4px;
}

.synthesis-text {
  font-size: 0.74rem;
  color: var(--text-secondary);
  line-height: 1.4;
  margin: 0;
}

/* Indicators Matrix */
.indicators-matrix {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.indicator-item {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 6px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ind-lbl {
  font-size: 0.62rem;
  color: var(--text-muted);
}

.ind-val {
  font-size: 0.74rem;
  font-weight: 800;
}
.ind-val small {
  font-weight: 600;
}

/* Harvest Progress */
.harvest-progress-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-head {
  display: flex;
  justify-content: space-between;
  font-size: 0.64rem;
}

.prog-lbl {
  color: var(--text-muted);
}
.prog-pct {
  font-weight: 800;
  color: var(--sky-700);
}

.prog-bar-track {
  width: 100%;
  height: 5px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.prog-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #0284c7, #10b981);
  border-radius: 999px;
}

/* Action Plan */
.action-plan-box {
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.action-plan-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.64rem;
  font-weight: 800;
  color: #92400e;
  text-transform: uppercase;
}

.action-plan-text {
  font-size: 0.72rem;
  color: #78350f;
  font-weight: 600;
}

/* Card Footer */
.card-footer {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border-subtle);
}

.btn-card-shortcut {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 6px;
  font-size: 0.68rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-card-shortcut.telemetry {
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  color: var(--sky-700);
}
.btn-card-shortcut.telemetry:hover {
  background: var(--sky-600);
  color: #ffffff;
  border-color: var(--sky-600);
}

.btn-card-shortcut.fleet {
  background: #ffffff;
  border: 1px solid var(--border-medium);
  color: var(--text-secondary);
}
.btn-card-shortcut.fleet:hover {
  background: var(--bg-surface-subtle);
  color: var(--text-primary);
}

/* Comparative Table */
.comparative-table-card {
  background: #ffffff;
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-xs);
}

.table-card-head {
  padding: 12px 18px;
  background: var(--bg-surface-subtle);
  border-bottom: 1px solid var(--border-subtle);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.t-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-card-title {
  font-size: 0.88rem;
  font-weight: 800;
  color: var(--text-primary);
}

.table-card-sub {
  font-size: 0.64rem;
  color: var(--text-muted);
}

.table-scroll-wrap {
  overflow-x: auto;
}

.comparative-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 0.72rem;
}

.comparative-table th {
  padding: 10px 14px;
  background: #f8fafc;
  color: var(--text-muted);
  font-weight: 700;
  border-bottom: 1px solid var(--border-subtle);
  font-size: 0.64rem;
  text-transform: uppercase;
}

.comparative-table td {
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-subtle);
  vertical-align: middle;
}

.comparative-table tr:last-child td {
  border-bottom: none;
}

.pond-row-tag {
  background: var(--sky-600);
  color: #ffffff;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 800;
  font-size: 0.64rem;
  margin-right: 6px;
}

.pond-row-name {
  font-weight: 700;
  color: var(--text-primary);
}

.d-bold {
  display: block;
  font-weight: 700;
  color: var(--text-primary);
}

.table-score-badge {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 6px;
  font-weight: 800;
  font-size: 0.64rem;
}

.t-params {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.64rem;
  color: var(--text-secondary);
}

.btn-table-inspect {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid var(--sky-200);
  background: var(--sky-50);
  color: var(--sky-700);
  font-weight: 700;
  font-size: 0.64rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.btn-table-inspect:hover {
  background: var(--sky-600);
  color: #ffffff;
  border-color: var(--sky-600);
}

/* Responsive */
@media (max-width: 1200px) {
  .farm-kpis-strip {
    grid-template-columns: repeat(2, 1fr);
  }
  .assessment-cards-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  .header-actions {
    width: 100%;
    flex-direction: column;
  }
  .btn-header-act {
    width: 100%;
    justify-content: center;
  }
  .farm-kpis-strip {
    grid-template-columns: 1fr;
  }
}
</style>
