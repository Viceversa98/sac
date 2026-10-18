import { ref, computed } from 'vue'
import { apiUrl } from '../api'

const selectedPondId = ref('A')
const isLiveSimulationRunning = ref(true)

// Initial Ponds dataset with cumulative feed, molasses, initial stocking biomass for live FCR calculation
const ponds = ref([
  {
    id: 'A',
    name: 'Kolam A (bioflok bundar)',
    species: 'Red Tilapia (Oreochromis niloticus)',
    phase: 'Finisher Stage (Ready for Harvest)',
    fishCount: 1850,
    avgWeightGrams: 920,
    volumeM3: 30,
    status: 'OPTIMAL',
    healthScore: 98,
    initialBiomassKg: 460, // Initial fingerling stocking weight
    initialFishCount: 2000,
    initialWeightGrams: 230,
    targetHarvestWeightGrams: 950,
    stockingDate: '12 Jan 2026',
    doc: 112, // Days of Culture
    survivalRate: 92.5, // %
    adgGramsDay: 6.16, // g/day
    cycleStatus: 'ACTIVE', // 'ACTIVE' | 'HARVESTED' | 'TRANSFERRED'
    cumulativeFeedKg: 1450.8, // Total cycle feed delivered
    cumulativeMolassesKg: 36.5, // Total cycle molasses delivered
    todayMolassesGrams: 400,
    cumulativeMortalityCount: 150,
    mortalityLogs: [
      { id: 'MORT-101', date: '14 Oct 2026, 07:30 WIB', count: 4, avgWeightGrams: 910, biomassLostKg: 3.64, cause: 'Density Stress / Old Age', disposalMethod: 'Buried with quicklime', notes: 'Routine morning scoop' },
      { id: 'MORT-100', date: '10 Oct 2026, 08:15 WIB', count: 8, avgWeightGrams: 880, biomassLostKg: 7.04, cause: 'Thermal Fluctuation', disposalMethod: 'Buried with quicklime', notes: 'Hot afternoon temp drop' }
    ],
    growthHistory: [
      { doc: 1, abw: 230, biomassKg: 460, feedKg: 0, note: 'Stocking Finisher Stage' },
      { doc: 30, abw: 420, biomassKg: 820, feedKg: 380, note: 'Sampling 1' },
      { doc: 60, abw: 630, biomassKg: 1210, feedKg: 790, note: 'Sampling 2' },
      { doc: 90, abw: 810, biomassKg: 1530, feedKg: 1220, note: 'Sampling 3' },
      { doc: 112, abw: 920, biomassKg: 1702, feedKg: 1450.8, note: 'Pre-harvest Assessment' }
    ],
    telemetry: {
      do: 6.4,
      ph: 7.6,
      temp: 28.8,
      ammonia: 0.015,
      flocDensity: 14, // mL/L
      orp: 280, // mV
      tds: 1100, // ppm
      flocSensor: {
        model: 'Imhoff-Vision AI (ESP32-CAM) & NIR-860nm Probe',
        protocol: 'RS485 Modbus RTU (Addr: 0x01)',
        od600: 0.48, // AU (Optical Density)
        tssMgL: 560, // mg/L (Total Suspended Solids)
        settlingRate: '1.9 mm/min',
        samplingMethod: '15-min Motorized Imhoff Settling Chamber',
        calibrationStd: 'SNI 7550:2009 / APHA 2540 F'
      }
    },
    actuators: {
      feeder: { id: 'sim-A-feeder', name: 'Feeder A', status: 'IDLE', dispensedTodayKg: 22.4, targetDailyKg: 48.0, nextSchedule: '14:00' },
      aerator: { id: 'sim-A-aerator', name: 'Aerator A', status: 'RUNNING', powerPercent: 80, mode: 'SIMULATED' },
      dosing: { id: 'sim-A-dose', name: 'Molasses valve A', status: 'STANDBY', flowMlMin: 0 },
      flush: { id: 'sim-A-flush', name: 'Siphon A', status: 'STANDBY', drainRateM3H: 15, lastFlushed: 'Not flushed' }
    }
  },
  {
    id: 'B',
    name: 'Kolam B (bioflok bundar)',
    species: 'Black Tilapia (Gift Strain)',
    phase: 'Grower Stage (Rapid Growth)',
    fishCount: 2200,
    avgWeightGrams: 420,
    volumeM3: 30,
    status: 'OPTIMAL',
    healthScore: 94,
    initialBiomassKg: 280,
    initialFishCount: 2350,
    initialWeightGrams: 120,
    targetHarvestWeightGrams: 850,
    stockingDate: '02 Feb 2026',
    doc: 74,
    survivalRate: 93.6,
    adgGramsDay: 4.05,
    cycleStatus: 'ACTIVE',
    cumulativeFeedKg: 755.4,
    cumulativeMolassesKg: 19.8,
    todayMolassesGrams: 250,
    cumulativeMortalityCount: 150,
    mortalityLogs: [
      { id: 'MORT-201', date: '12 Oct 2026, 08:00 WIB', count: 6, avgWeightGrams: 410, biomassLostKg: 2.46, cause: 'Cannibalism / Fin Nipping', disposalMethod: 'Buried with quicklime', notes: 'Nipping observed during fast feeding' }
    ],
    growthHistory: [
      { doc: 1, abw: 120, biomassKg: 280, feedKg: 0, note: 'Stocking Grower Batch' },
      { doc: 25, abw: 210, biomassKg: 485, feedKg: 230, note: 'Sampling 1' },
      { doc: 50, abw: 320, biomassKg: 720, feedKg: 490, note: 'Sampling 2' },
      { doc: 74, abw: 420, biomassKg: 924, feedKg: 755.4, note: 'Sampling 3' }
    ],
    telemetry: {
      do: 5.9,
      ph: 7.4,
      temp: 29.1,
      ammonia: 0.025,
      flocDensity: 11,
      orp: 265,
      tds: 1050,
      flocSensor: {
        model: 'Imhoff-Vision AI (ESP32-CAM) & NIR-860nm Probe',
        protocol: 'RS485 Modbus RTU (Addr: 0x02)',
        od600: 0.38,
        tssMgL: 440,
        settlingRate: '1.6 mm/min',
        samplingMethod: '15-min Motorized Imhoff Settling Chamber',
        calibrationStd: 'SNI 7550:2009 / APHA 2540 F'
      }
    },
    actuators: {
      feeder: { id: 'sim-B-feeder', name: 'Feeder B', status: 'IDLE', dispensedTodayKg: 14.8, targetDailyKg: 32.0, nextSchedule: '14:00' },
      aerator: { id: 'sim-B-aerator', name: 'Aerator B', status: 'RUNNING', powerPercent: 75, mode: 'SIMULATED' },
      dosing: { id: 'sim-B-dose', name: 'Molasses valve B', status: 'STANDBY', flowMlMin: 0 },
      flush: { id: 'sim-B-flush', name: 'Siphon B', status: 'STANDBY', drainRateM3H: 15, lastFlushed: 'Not flushed' }
    }
  }
])

// Operational Action Activity Log with AUTO vs MANUAL_ADJUST provenance
const operationalLogs = ref([
  {
    id: 'ACT-9405',
    time: '11:25:40 WIB',
    pondId: 'A',
    pondName: 'Kolam A (bioflok bundar)',
    category: 'FEEDING',
    type: 'AUTO',
    actor: 'Feeder schedule',
    action: 'Dispensed 5.2 kg feed pellets',
    dosage: '+5.2 kg',
    hardware: 'sim-A-feeder',
    status: 'Recorded',
    notes: 'DO level verified safe (6.2 mg/L) prior to automated feeder dispatch'
  },
  {
    id: 'ACT-9404',
    time: '10:45:12 WIB',
    pondId: 'A',
    pondName: 'Kolam A (bioflok bundar)',
    category: 'MOLASSES',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Supervisor Adjustment)',
    action: 'Manual injection 350g Cane Molasses carbon solution',
    dosage: '+350 g',
    hardware: 'sim-A-dose',
    status: 'Recorded',
    notes: 'C:N ratio adjusted to 15:1 following ammonia rise to 0.025 ppm'
  },
  {
    id: 'ACT-9403',
    time: '09:15:30 WIB',
    pondId: 'B',
    pondName: 'Kolam B (bioflok bundar)',
    category: 'AERATION',
    type: 'AUTO',
    actor: 'Aerator schedule',
    action: 'Aerator kept running after the morning check',
    dosage: 'Running',
    hardware: 'sim-B-aerator',
    status: 'Recorded',
    notes: 'Dynamic frequency modulation for daytime energy optimization'
  },
  {
    id: 'ACT-9402',
    time: '07:30:00 WIB',
    pondId: 'A',
    pondName: 'Kolam A (bioflok bundar)',
    category: 'FEEDING',
    type: 'AUTO',
    actor: 'Morning Schedule Window',
    action: 'Dispensed 11.2 kg finisher pellet ration',
    dosage: '+11.2 kg',
    hardware: 'sim-A-feeder',
    status: 'Recorded',
    notes: 'Fish active, strong feeding response at 28.5°C'
  },
  {
    id: 'ACT-9401',
    time: 'Yesterday 16:20 WIB',
    pondId: 'B',
    pondName: 'Kolam B (bioflok bundar)',
    category: 'SIPHON_FLUSH',
    type: 'MANUAL_ADJUST',
    actor: 'Ilfa Hidayat (Supervisor Adjustment)',
    action: 'Emergency bottom sludge siphon & water exchange',
    dosage: '15% Exch (7.5 m³)',
    hardware: 'sim-B-flush',
    status: 'Recorded',
    notes: 'Sludge evacuation completed, fresh dechlorinated water replenished'
  }
])

const addOperationalLog = (entry) => {
  operationalLogs.value.unshift({
    id: `ACT-${Date.now().toString().slice(-4)}`,
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB',
    ...entry
  })
}

// Multi-Timeframe Telemetry History Data Generators (24h Daily, 7d Weekly, 30d Monthly)
export const generateHistoryData = (timeRange = '24h') => {
  const points = []

  if (timeRange === '24h') {
    // 25 hourly sample points across 24 hours
    for (let i = 24; i >= 0; i--) {
      const hourVal = (24 - i + 8) % 24
      const timeLabel = `${String(hourVal).padStart(2, '0')}:00`
      let baseDo = 6.0 + Math.sin((hourVal - 6) / 24 * Math.PI * 2) * 1.1
      let baseTemp = 28.0 + Math.sin((hourVal - 9) / 24 * Math.PI * 2) * 1.2
      let baseAmmonia = 0.018 + (hourVal > 11 && hourVal < 16 ? 0.008 : 0)

      points.push({
        time: timeLabel,
        do: Number((baseDo + (Math.random() * 0.16 - 0.08)).toFixed(2)),
        ph: Number((7.45 + (Math.random() * 0.12 - 0.06)).toFixed(2)),
        temp: Number((baseTemp + (Math.random() * 0.18 - 0.09)).toFixed(1)),
        ammonia: Number((baseAmmonia + (Math.random() * 0.004 - 0.002)).toFixed(3))
      })
    }
  } else if (timeRange === '7d') {
    // 7 daily points for the past week
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun (Today)']
    for (let i = 0; i < 7; i++) {
      const baseDo = 6.1 + Math.sin(i * 0.8) * 0.4
      const baseTemp = 28.4 + Math.cos(i * 0.6) * 0.5
      const baseAmmonia = 0.021 + (i % 3 === 0 ? 0.006 : -0.004)

      points.push({
        time: dayNames[i],
        do: Number((baseDo + (Math.random() * 0.15 - 0.07)).toFixed(2)),
        ph: Number((7.5 + (Math.random() * 0.1 - 0.05)).toFixed(2)),
        temp: Number((baseTemp + (Math.random() * 0.2 - 0.1)).toFixed(1)),
        ammonia: Number(Math.max(0.01, baseAmmonia).toFixed(3))
      })
    }
  } else if (timeRange === '30d') {
    // 30 daily sample points across the month
    for (let d = 1; d <= 30; d++) {
      const timeLabel = `Day ${d}`
      const baseDo = 6.3 - (d > 20 ? 0.2 : 0) + Math.sin(d * 0.5) * 0.35
      const baseTemp = 28.2 + Math.cos(d * 0.3) * 0.6
      const baseAmmonia = 0.024 - (d * 0.0002) + Math.sin(d * 0.8) * 0.005

      points.push({
        time: timeLabel,
        do: Number((baseDo + (Math.random() * 0.18 - 0.09)).toFixed(2)),
        ph: Number((7.52 + (Math.random() * 0.12 - 0.06)).toFixed(2)),
        temp: Number((baseTemp + (Math.random() * 0.25 - 0.12)).toFixed(1)),
        ammonia: Number(Math.max(0.012, baseAmmonia).toFixed(3))
      })
    }
  }

  return points
}

const historyLogs = ref(generateHistoryData('24h'))

// Active selected pond computed
const activePond = computed(() => {
  return ponds.value.find(p => p.id === selectedPondId.value) || ponds.value[0]
})

// Active pond specific FCR & Biomass metrics
const activePondBiomassMetrics = computed(() => {
  const p = activePond.value
  if (!p) return {}

  const currentBiomassKg = Math.round(p.fishCount * p.avgWeightGrams / 1000)
  const stockingBiomassKg = p.initialBiomassKg || 380
  const netGainKg = Math.max(1, currentBiomassKg - stockingBiomassKg)
  const cumulativeFeedKg = Number((p.cumulativeFeedKg || 1200).toFixed(1))
  const estimatedFcr = Number((cumulativeFeedKg / netGainKg).toFixed(2))

  let fcrRating = 'EXCELLENT'
  let fcrBadgeClass = 'badge-emerald'
  if (estimatedFcr > 1.3) {
    fcrRating = 'ELEVATED'
    fcrBadgeClass = 'badge-amber'
  } else if (estimatedFcr > 1.5) {
    fcrRating = 'HIGH / CAUTION'
    fcrBadgeClass = 'badge-rose'
  }

  return {
    currentBiomassKg,
    stockingBiomassKg,
    netGainKg,
    cumulativeFeedKg,
    cumulativeMolassesKg: Number((p.cumulativeMolassesKg || 28).toFixed(1)),
    todayFeedKg: p.actuators.feeder.dispensedTodayKg,
    todayMolassesGrams: p.todayMolassesGrams || 700,
    estimatedFcr,
    fcrRating,
    fcrBadgeClass,
    growthPercent: Math.round((netGainKg / stockingBiomassKg) * 100)
  }
})

// Global farm summary
const globalFarmMetrics = computed(() => {
  const totalBiomassKg = ponds.value.reduce((acc, p) => acc + (p.fishCount * p.avgWeightGrams / 1000), 0)
  const totalStockingKg = ponds.value.reduce((acc, p) => acc + (p.initialBiomassKg || 300), 0)
  const totalBiomassGainKg = Math.max(1, totalBiomassKg - totalStockingKg)
  const totalCumulativeFeedKg = ponds.value.reduce((acc, p) => acc + (p.cumulativeFeedKg || 0), 0)
  const totalCumulativeMolassesKg = ponds.value.reduce((acc, p) => acc + (p.cumulativeMolassesKg || 0), 0)
  const farmFcr = Number((totalCumulativeFeedKg / totalBiomassGainKg).toFixed(2))
  const avgHealth = Math.round(ponds.value.reduce((acc, p) => acc + p.healthScore, 0) / ponds.value.length)
  const activeAerators = ponds.value.filter(p => p.actuators.aerator.status === 'RUNNING').length
  const totalPonds = ponds.value.length

  return {
    totalBiomassKg: Math.round(totalBiomassKg),
    totalBiomassGainKg: Math.round(totalBiomassGainKg),
    totalCumulativeFeedKg: Number(totalCumulativeFeedKg.toFixed(1)),
    totalCumulativeMolassesKg: Number(totalCumulativeMolassesKg.toFixed(1)),
    fcr: farmFcr,
    avgHealth,
    activeAerators,
    totalPonds
  }
})

// Micro-jitter simulation
if (typeof window !== 'undefined') {
  setInterval(() => {
    if (!isLiveSimulationRunning.value) return
    ponds.value.forEach(pond => {
      if (pond.telemetrySource === 'api') return
      const doJitter = (Math.random() * 0.04 - 0.02)
      const phJitter = (Math.random() * 0.02 - 0.01)
      const tempJitter = (Math.random() * 0.04 - 0.02)

      pond.telemetry.do = Math.max(2.0, Math.min(9.0, Number((pond.telemetry.do + doJitter).toFixed(2))))
      pond.telemetry.ph = Math.max(6.0, Math.min(8.8, Number((pond.telemetry.ph + phJitter).toFixed(2))))
      pond.telemetry.temp = Math.max(26.0, Math.min(32.0, Number((pond.telemetry.temp + tempJitter).toFixed(1))))
    })
  }, 3000)
}

const numberOr = (value, fallback) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

const applyApiPond = (apiPond) => {
  const stats = apiPond.stats
  const existing = ponds.value.find((pond) => pond.id === apiPond.id)
  const pond = existing ?? JSON.parse(JSON.stringify(ponds.value[ponds.value.length - 1]))
  pond.id = apiPond.id
  pond.name = apiPond.name
  pond.species = apiPond.species || pond.species
  pond.volumeM3 = numberOr(apiPond.volume_m3, pond.volumeM3)
  pond.telemetrySource = 'api'
  pond.telemetry.do = numberOr(stats?.do?.last, pond.telemetry.do)
  pond.telemetry.ph = numberOr(stats?.ph?.last, pond.telemetry.ph)
  pond.telemetry.temp = numberOr(stats?.temp?.last, pond.telemetry.temp)
  pond.telemetry.ammonia = numberOr(stats?.tan?.last, pond.telemetry.ammonia)
  if (!existing) ponds.value.push(pond)
}

const readPonds = async () => {
  const response = await fetch(apiUrl('/api/ponds'), { headers: { Accept: 'application/json' } })
  if (!response.ok) return null
  const data = await response.json()
  return Array.isArray(data.ponds) ? data.ponds : []
}

const refreshFromApi = async () => {
  let list = await readPonds()
  if (!list) return false
  const empty = list.length > 0 && list.every((pond) => !pond.stats || pond.stats.count === 0)
  if (empty) {
    await fetch(apiUrl('/api/telemetry/replay'), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: '{}'
    })
    list = await readPonds()
    if (!list) return false
  }
  for (const pond of list) applyApiPond(pond)
  if (list.length > 0 && !list.some((pond) => pond.id === selectedPondId.value)) {
    selectedPondId.value = list[0].id
  }
  return true
}

if (typeof window !== 'undefined') {
  refreshFromApi()
}

export function usePonds() {
  const setPond = (pondId) => {
    selectedPondId.value = pondId
  }

  // Actuator execution actions with customizable dosage, power, and operational logging
  const triggerFeeder = (pondId, amountKg = 5.2, source = 'MANUAL_ADJUST') => {
    const pond = ponds.value.find(p => p.id === pondId)
    if (!pond) return false
    pond.actuators.feeder.status = 'DISPENSING'
    const addedKg = Number(amountKg)
    pond.actuators.feeder.dispensedTodayKg = Number((pond.actuators.feeder.dispensedTodayKg + addedKg).toFixed(1))
    pond.cumulativeFeedKg = Number(((pond.cumulativeFeedKg || 1200) + addedKg).toFixed(1))

    // Record action log entry
    addOperationalLog({
      pondId,
      pondName: pond.name,
      category: 'FEEDING',
      type: source,
      actor: source === 'AUTO' ? 'Auto-Feeder Schedule (AI Loop)' : 'Ilfa Hidayat (Supervisor Adjustment)',
      action: `Dispensed ${addedKg} kg BioGrow-7 Pellets`,
      dosage: `+${addedKg} kg`,
      hardware: `${pond.actuators.feeder.id} (Auto-Feeder)`,
      status: 'Recorded',
      notes: `Cumulative feed: ${pond.cumulativeFeedKg} kg | Live FCR: ${activePondBiomassMetrics.value.estimatedFcr}`
    })

    setTimeout(() => {
      if (pond) pond.actuators.feeder.status = 'IDLE'
    }, 5000)
    return true
  }

  const setAeratorBoost = (pondId, power = 100, source = 'MANUAL_ADJUST') => {
    const pond = ponds.value.find(p => p.id === pondId)
    if (!pond) return false
    const oldPower = pond.actuators.aerator.powerPercent
    pond.actuators.aerator.powerPercent = Number(power)
    pond.actuators.aerator.status = 'RUNNING'
    const boostDiff = (power - 80) * 0.03
    pond.telemetry.do = Math.min(8.5, Number((pond.telemetry.do + Math.max(0.4, boostDiff)).toFixed(2)))

    // Record action log entry
    addOperationalLog({
      pondId,
      pondName: pond.name,
      category: 'AERATION',
      type: source,
      actor: source === 'AUTO' ? 'Aerator schedule' : 'Ilfa Hidayat (Supervisor Adjustment)',
      action: `Aerator set from level ${oldPower} to ${power}`,
      dosage: 'Running',
      hardware: pond.actuators.aerator.id,
      status: 'Recorded',
      notes: `Target DO boost achieved: ${pond.telemetry.do} mg/L`
    })

    return true
  }

  const triggerMolassesDosing = (pondId, amountGrams = 350, source = 'MANUAL_ADJUST') => {
    const pond = ponds.value.find(p => p.id === pondId)
    if (!pond) return false
    const doseGrams = Number(amountGrams)
    pond.actuators.dosing.status = 'DOSING'
    pond.actuators.dosing.flowMlMin = Math.round(doseGrams / 2)
    pond.todayMolassesGrams = (pond.todayMolassesGrams || 0) + doseGrams
    pond.cumulativeMolassesKg = Number(((pond.cumulativeMolassesKg || 25) + (doseGrams / 1000)).toFixed(2))

    // Record action log entry
    addOperationalLog({
      pondId,
      pondName: pond.name,
      category: 'MOLASSES',
      type: source,
      actor: source === 'AUTO' ? 'AI Carbon Balance Optimization' : 'Ilfa Hidayat (Supervisor Adjustment)',
      action: `Injected ${doseGrams}g Organic Cane Molasses (C:N 15:1)`,
      dosage: `+${doseGrams} g`,
      hardware: `${pond.actuators.dosing.id} (Solenoid Valve)`,
      status: 'Recorded',
      notes: `Cumulative cycle carbon: ${pond.cumulativeMolassesKg} kg | Ammonia: ${pond.telemetry.ammonia} ppm`
    })

    setTimeout(() => {
      if (pond) {
        pond.actuators.dosing.status = 'STANDBY'
        pond.actuators.dosing.flowMlMin = 0
        pond.telemetry.ammonia = Math.max(0.01, Number((pond.telemetry.ammonia - 0.035).toFixed(3)))
      }
    }, 4500)
    return true
  }

  // Emergency Water Exchange / Siphon Valve
  const triggerWaterFlush = (pondId, percent = 15, source = 'MANUAL_ADJUST') => {
    const pond = ponds.value.find(p => p.id === pondId)
    if (!pond) return false
    pond.actuators.flush.status = 'FLUSHING'

    // Record action log entry
    addOperationalLog({
      pondId,
      pondName: pond.name,
      category: 'SIPHON_FLUSH',
      type: source,
      actor: 'Ilfa Hidayat (Emergency Siphon Authorization)',
      action: `Bottom sludge siphon & ${percent}% water volume exchange`,
      dosage: `${percent}% Exch (${Math.round(pond.volumeM3 * percent / 100)} m³)`,
      hardware: `${pond.actuators.flush.id} (Siphon Valve)`,
      status: 'Recorded',
      notes: `Toxic TAN flushed | Fresh oxygen-rich water recharged`
    })

    setTimeout(() => {
      if (pond) {
        pond.actuators.flush.status = 'STANDBY'
        pond.actuators.flush.lastFlushed = `Just Now (${percent}% refreshed)`
        // Water exchange drastically drops toxic ammonia and recharges fresh dissolved oxygen
        pond.telemetry.ammonia = Math.max(0.01, Number((pond.telemetry.ammonia * 0.55).toFixed(3)))
        pond.telemetry.do = Math.min(7.2, Number((pond.telemetry.do + 1.8).toFixed(2)))
        pond.telemetry.ph = 7.5
        if (pond.status === 'CRITICAL' || pond.status === 'CAUTION') {
          pond.status = 'OPTIMAL'
          pond.healthScore = 95
        }
      }
    }, 4000)
    return true
  }

  // Scenario Injections for Live Demo
  const applyScenario = (type) => {
    const target = ponds.value.find(p => p.id === 'A')
    if (!target) return null
    selectedPondId.value = target.id

    if (type === 'hypoxia') {
      target.telemetry.do = 3.2
      target.status = 'CRITICAL'
      target.healthScore = 68
      target.actuators.aerator.powerPercent = 60
    } else if (type === 'ammonia_spike') {
      target.telemetry.ammonia = 0.082
      target.telemetry.ph = 7.9
      target.status = 'CAUTION'
      target.healthScore = 78
    } else if (type === 'feeding_window') {
      target.status = 'OPTIMAL'
      target.actuators.feeder.status = 'READY'
    } else if (type === 'reset') {
      target.telemetry.do = 6.25
      target.telemetry.ph = 7.52
      target.telemetry.temp = 28.5
      target.telemetry.ammonia = 0.02
      target.telemetry.flocDensity = 12
      target.status = 'OPTIMAL'
      target.healthScore = 96
      target.actuators.aerator.powerPercent = 82
      target.actuators.aerator.status = 'RUNNING'
      target.actuators.feeder.status = 'IDLE'
      target.actuators.dosing.status = 'STANDBY'
      if (target.actuators.flush) target.actuators.flush.status = 'STANDBY'
    }
    return target
  }

  // Register a new production pond
  const addPond = (newPondData) => {
    const nextIdx = ponds.value.length + 1
    const pondId = newPondData.id?.trim() || `K0${nextIdx}`
    const fishCount = Number(newPondData.fishCount) || 2000
    const avgWeightGrams = Number(newPondData.avgWeightGrams) || 15
    const volumeM3 = Number(newPondData.volumeM3) || 50
    const initialBiomassKg = Number(newPondData.initialBiomassKg) || Number(((fishCount * avgWeightGrams) / 1000).toFixed(1))
    const targetHarvestWeightGrams = Number(newPondData.targetHarvestWeightGrams) || 850
    const pondName = newPondData.name?.trim() || `Kolam ${nextIdx}`

    const newPond = {
      id: pondId,
      name: pondName,
      species: newPondData.species || 'Red Tilapia (Oreochromis niloticus)',
      phase: newPondData.phase || 'Nursery / Fingerling Stage',
      fishCount,
      avgWeightGrams,
      volumeM3,
      status: 'OPTIMAL',
      healthScore: 98,
      initialBiomassKg,
      initialFishCount: fishCount,
      initialWeightGrams: avgWeightGrams,
      targetHarvestWeightGrams,
      stockingDate: newPondData.stockingDate || new Date().toISOString().split('T')[0],
      doc: 1,
      survivalRate: 100.0,
      adgGramsDay: 0.0,
      cycleStatus: 'ACTIVE',
      cumulativeFeedKg: 0.0,
      cumulativeMolassesKg: 0.0,
      todayMolassesGrams: 0,
      cumulativeMortalityCount: 0,
      mortalityLogs: [],
      growthHistory: [
        { doc: 1, abw: avgWeightGrams, biomassKg: initialBiomassKg, feedKg: 0, note: 'Initial Fingerling Stocking' }
      ],
      telemetry: {
        do: 6.5,
        ph: 7.5,
        temp: 28.5,
        ammonia: 0.012,
        flocDensity: 8,
        orp: 285,
        tds: 980,
        flocSensor: {
          model: 'Imhoff-Vision AI (ESP32-CAM) & NIR-860nm Probe',
          protocol: `RS485 Modbus RTU (Addr: 0x0${nextIdx})`,
          od600: 0.30,
          tssMgL: 350,
          settlingRate: '1.5 mm/min',
          samplingMethod: '15-min Motorized Imhoff Settling Chamber',
          calibrationStd: 'SNI 7550:2009 / APHA 2540 F'
        }
      },
      actuators: {
        feeder: {
          id: `ESP32-${pondId}-FD`,
          name: `Auto-Feeder #${pondId}`,
          status: 'IDLE',
          dispensedTodayKg: 0.0,
          targetDailyKg: Number(Math.max(2.0, (initialBiomassKg * 0.04)).toFixed(1)),
          nextSchedule: '08:00'
        },
        aerator: {
          id: `ESP32-${pondId}-AR`,
          name: `Aerator ${pondId}`,
          status: 'RUNNING',
          powerPercent: 80,
          mode: 'AUTO'
        },
        dosing: {
          id: `ESP32-${pondId}-DS`,
          name: `Molasses Solenoid Valve #${pondId}`,
          status: 'STANDBY',
          flowMlMin: 0
        },
        flush: {
          id: `ESP32-${pondId}-FLUSH`,
          name: `Emergency Siphon Valve #${pondId}`,
          status: 'STANDBY',
          drainRateM3H: 15,
          lastFlushed: 'None (Zero-Exchange)'
        }
      }
    }

    ponds.value.push(newPond)
    selectedPondId.value = pondId

    addOperationalLog({
      pondId,
      pondName: newPond.name,
      category: 'POND_SETUP',
      type: 'MANUAL_ADJUST',
      actor: 'Ilfa Hidayat (Farm Supervisor)',
      action: `Registered New Production Pond ${pondId} (${newPond.name})`,
      dosage: `${volumeM3} m³ | ${fishCount.toLocaleString()} fish (${initialBiomassKg} kg)`,
      hardware: `ESP32-${pondId} Telemetry & Actuator Cluster`,
      status: 'Recorded',
      notes: `Initial stocking: ${avgWeightGrams}g/fish | Target Harvest: ${targetHarvestWeightGrams}g`
    })

    return newPond
  }

  // End cycle via Harvest (Full or Partial)
  const harvestPondCycle = (pondId, { type = 'FULL', harvestKg, harvestCount, harvestAbw, notes = '' }) => {
    const pond = ponds.value.find(p => p.id === pondId)
    if (!pond) return false

    const harvestedKg = Number(harvestKg) || Math.round(pond.fishCount * pond.avgWeightGrams / 1000)
    const countHarvested = Number(harvestCount) || pond.fishCount
    const finalAbw = Number(harvestAbw) || pond.avgWeightGrams
    const currentGainKg = Math.max(1, harvestedKg - (pond.initialBiomassKg || 100))
    const finalFcr = Number(((pond.cumulativeFeedKg || 500) / currentGainKg).toFixed(2))

    if (type === 'FULL') {
      pond.cycleStatus = 'HARVESTED'
      pond.phase = 'Cycle Harvested (Ready for Restocking)'
      pond.fishCount = 0
      pond.avgWeightGrams = finalAbw

      if (!pond.growthHistory) pond.growthHistory = []
      pond.growthHistory.push({
        doc: pond.doc || 120,
        abw: finalAbw,
        biomassKg: harvestedKg,
        feedKg: pond.cumulativeFeedKg,
        note: `Full Harvest (${harvestedKg.toLocaleString()} kg total yield)`
      })

      addOperationalLog({
        pondId,
        pondName: pond.name,
        category: 'CYCLE_HARVEST',
        type: 'MANUAL_ADJUST',
        actor: 'Ilfa Hidayat (Harvest Operator)',
        action: `Full harvest recorded: ${harvestedKg.toLocaleString()} kg tilapia`,
        dosage: `${countHarvested.toLocaleString()} fish @ ${finalAbw}g/fish`,
        hardware: `Siphon Channel & Harvest Net`,
        status: 'Recorded',
        notes: `Final FCR: ${finalFcr} | Total Feed: ${pond.cumulativeFeedKg} kg | Cycle Completed: ${notes || 'Market Harvest'}`
      })
    } else {
      // Partial Harvest (Thinning)
      pond.fishCount = Math.max(0, pond.fishCount - countHarvested)
      addOperationalLog({
        pondId,
        pondName: pond.name,
        category: 'CYCLE_HARVEST',
        type: 'MANUAL_ADJUST',
        actor: 'Ilfa Hidayat (Harvest Operator)',
        action: `PARTIAL HARVEST (Thinning): ${harvestedKg.toLocaleString()} kg Tilapia`,
        dosage: `${countHarvested.toLocaleString()} fish removed`,
        hardware: `Selective Grading Net`,
        status: 'Recorded',
        notes: `Remaining in pond: ${pond.fishCount.toLocaleString()} fish (~${Math.round(pond.fishCount * pond.avgWeightGrams / 1000)} kg)`
      })
    }
    return true
  }

  // End cycle or grade via Transfer (Pindah Kolam)
  const transferPondFish = (sourcePondId, targetPondId, { transferCount, transferKg, transferAbw, reason = '' }) => {
    const source = ponds.value.find(p => p.id === sourcePondId)
    const target = ponds.value.find(p => p.id === targetPondId)
    if (!source || !target) return false

    const count = Math.min(source.fishCount, Number(transferCount) || source.fishCount)
    const abw = Number(transferAbw) || source.avgWeightGrams
    const kg = Number(transferKg) || Number(((count * abw) / 1000).toFixed(1))

    source.fishCount = Math.max(0, source.fishCount - count)
    if (source.fishCount === 0) {
      source.cycleStatus = 'TRANSFERRED'
      source.phase = `Batch Transferred to ${target.name}`
    }

    target.fishCount = (target.fishCount || 0) + count
    target.avgWeightGrams = Math.round((target.avgWeightGrams + abw) / 2) || abw

    addOperationalLog({
      pondId: sourcePondId,
      pondName: source.name,
      category: 'POND_TRANSFER',
      type: 'MANUAL_ADJUST',
      actor: 'Ilfa Hidayat (Farm Supervisor)',
      action: `Fish Grading Transfer: ${source.id} ➔ ${target.id}`,
      dosage: `${count.toLocaleString()} fish (${kg} kg @ ${abw}g)`,
      hardware: `Grading Tank & Water Transfer Pipeline`,
      status: 'Recorded',
      notes: `Reason: ${reason || 'Progressive size grading'}. ${target.name} population now: ${target.fishCount.toLocaleString()} fish.`
    })

    return true
  }

  // Restart a harvested/transferred pond with a fresh cycle
  const restartPondCycle = (pondId, cycleData) => {
    const pond = ponds.value.find(p => p.id === pondId)
    if (!pond) return false

    const count = Number(cycleData.fishCount) || 2000
    const abw = Number(cycleData.avgWeightGrams) || 20
    const biomass = Number(cycleData.initialBiomassKg) || Number(((count * abw) / 1000).toFixed(1))

    pond.fishCount = count
    pond.avgWeightGrams = abw
    pond.initialBiomassKg = biomass
    pond.initialFishCount = count
    pond.initialWeightGrams = abw
    pond.stockingDate = cycleData.stockingDate || new Date().toISOString().split('T')[0]
    pond.doc = 1
    pond.survivalRate = 100.0
    pond.cycleStatus = 'ACTIVE'
    pond.phase = cycleData.phase || 'Nursery / Fingerling Stage'
    pond.cumulativeFeedKg = 0.0
    pond.cumulativeMolassesKg = 0.0
    pond.todayMolassesGrams = 0
    pond.growthHistory = [
      { doc: 1, abw, biomassKg: biomass, feedKg: 0, note: 'New Batch Stocking' }
    ]

    addOperationalLog({
      pondId,
      pondName: pond.name,
      category: 'POND_SETUP',
      type: 'MANUAL_ADJUST',
      actor: 'Ilfa Hidayat (Farm Supervisor)',
      action: `Restarted Culture Cycle in ${pond.id} (${pond.name})`,
      dosage: `${count.toLocaleString()} fingerlings (${biomass} kg)`,
      hardware: `Cleaned Biofloc Tank`,
      status: 'Recorded',
      notes: `New cycle initialized with fresh dechlorinated water and biofloc inoculum`
    })

    return true
  }

  // Record fish mortality for a specific pond
  const recordFishMortality = (pondId, { count, avgWeightGrams, cause = 'Routine Mortality', disposalMethod = 'Buried with quicklime', notes = '' }) => {
    const pond = ponds.value.find(p => p.id === pondId)
    if (!pond) return false

    const deadCount = Math.max(1, Number(count) || 1)
    const deadAbw = Number(avgWeightGrams) || pond.avgWeightGrams || 100
    const lostKg = Number(((deadCount * deadAbw) / 1000).toFixed(2))

    // Deduct alive population
    pond.fishCount = Math.max(0, pond.fishCount - deadCount)
    pond.cumulativeMortalityCount = (pond.cumulativeMortalityCount || 0) + deadCount

    // Recalculate survival rate
    const initialCount = pond.initialFishCount || (pond.fishCount + pond.cumulativeMortalityCount)
    pond.survivalRate = Number((((initialCount - pond.cumulativeMortalityCount) / initialCount) * 100).toFixed(1))

    const newLog = {
      id: `MORT-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB (Today)',
      count: deadCount,
      avgWeightGrams: deadAbw,
      biomassLostKg: lostKg,
      cause,
      disposalMethod,
      actor: 'Ilfa Hidayat (Supervisor)',
      notes: notes || 'Daily mortality audit'
    }

    if (!pond.mortalityLogs) pond.mortalityLogs = []
    pond.mortalityLogs.unshift(newLog)

    // Add to global operationalLogs so it appears in audit trail and ledger!
    addOperationalLog({
      pondId,
      pondName: pond.name,
      category: 'MORTALITY_LOG',
      type: 'MANUAL_ADJUST',
      actor: 'Ilfa Hidayat (Supervisor Mortality Audit)',
      action: `Recorded Fish Mortality: -${deadCount} fish in ${pond.name}`,
      dosage: `-${deadCount} fish (-${lostKg} kg)`,
      hardware: `Scoop Net & Disposal Pit`,
      status: 'Recorded',
      notes: `Cause: ${cause} | Sisa Populasi: ${pond.fishCount.toLocaleString()} fish | New SR: ${pond.survivalRate}%`
    })

    return newLog
  }

  return {
    ponds,
    selectedPondId,
    refreshFromApi,
    activePond,
    activePondBiomassMetrics,
    globalFarmMetrics,
    historyLogs,
    operationalLogs,
    isLiveSimulationRunning,
    setPond,
    triggerFeeder,
    setAeratorBoost,
    triggerMolassesDosing,
    triggerWaterFlush,
    addOperationalLog,
    generateHistoryData,
    applyScenario,
    addPond,
    harvestPondCycle,
    transferPondFish,
    restartPondCycle,
    recordFishMortality
  }
}
