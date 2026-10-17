import {
  DO_CRITICAL_MGL,
  DO_LOW_MGL,
  NH3_OPT_MGL,
  PH_MAX,
  PH_MIN,
  TEMP_MAX_C,
  TEMP_MIN_C
} from './pondHardware'

const NH3_GROWTH_DEPRESS_MGL = 0.1
const ORP_MIN_MV = 150
const ORP_MAX_MV = 400
const FLOC_MIN_ML = 5
const FLOC_MAX_ML = 20
const FCR_ELEVATED = 1.3
const FCR_HIGH = 1.5

const numberOrNull = (value) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const formatNumber = (value, digits) => {
  if (value === null) return '—'
  return value.toFixed(digits)
}

const metric = (id, label, value, call, level, reason) => ({
  id,
  label,
  value,
  call,
  level,
  reason
})

const rangeMetric = (id, label, raw, digits, unit, low, high, outsideLevel = 'unhealthy') => {
  const value = numberOrNull(raw)
  const shown = unit ? `${formatNumber(value, digits)} ${unit}` : formatNumber(value, digits)
  const suffix = unit ? ` ${unit}` : ''
  if (value === null) return metric(id, label, shown, 'Missing', 'watch', 'No reading.')
  if (value < low) return metric(id, label, shown, 'Low', outsideLevel, `Below ${low}${suffix}.`)
  if (value > high) return metric(id, label, shown, 'High', outsideLevel, `Above ${high}${suffix}.`)
  return metric(id, label, shown, 'In range', 'ok', `Inside ${low}–${high}${suffix}.`)
}

const oxygenMetric = (raw) => {
  const value = numberOrNull(raw)
  const shown = `${formatNumber(value, 2)} mg/L`
  if (value === null) return metric('do', 'Oxygen (DO)', shown, 'Missing', 'watch', 'No reading.')
  if (value < DO_CRITICAL_MGL) {
    return metric('do', 'Oxygen (DO)', shown, 'Low', 'unhealthy', `Below the ${DO_CRITICAL_MGL} mg/L critical limit.`)
  }
  if (value < DO_LOW_MGL) {
    return metric('do', 'Oxygen (DO)', shown, 'Low', 'watch', `Below the ${DO_LOW_MGL} mg/L safe band.`)
  }
  return metric('do', 'Oxygen (DO)', shown, 'In range', 'ok', `At or above ${DO_LOW_MGL} mg/L.`)
}

const ammoniaMetric = (raw) => {
  const value = numberOrNull(raw)
  const shown = `${formatNumber(value, 3)} mg/L`
  if (value === null) return metric('ammonia', 'Ammonia (TAN)', shown, 'Missing', 'watch', 'No reading.')
  if (value >= NH3_GROWTH_DEPRESS_MGL) {
    return metric('ammonia', 'Ammonia (TAN)', shown, 'High', 'unhealthy', `At or above ${NH3_GROWTH_DEPRESS_MGL} mg/L, where growth slows.`)
  }
  if (value > NH3_OPT_MGL) {
    return metric('ammonia', 'Ammonia (TAN)', shown, 'High', 'watch', `Above the ${NH3_OPT_MGL} mg/L optimal band.`)
  }
  return metric('ammonia', 'Ammonia (TAN)', shown, 'In range', 'ok', `At or below ${NH3_OPT_MGL} mg/L.`)
}

const flocMetric = (raw) => {
  const value = numberOrNull(raw)
  const shown = `${formatNumber(value, 0)} mL/L`
  if (value === null) return metric('floc', 'Floc', shown, 'Missing', 'watch', 'No reading.')
  if (value < FLOC_MIN_ML) {
    return metric('floc', 'Floc', shown, 'Low', 'watch', `Below ${FLOC_MIN_ML} mL/L.`)
  }
  if (value > FLOC_MAX_ML) {
    return metric('floc', 'Floc', shown, 'High', 'watch', `Above ${FLOC_MAX_ML} mL/L.`)
  }
  return metric('floc', 'Floc', shown, 'In range', 'ok', `Inside ${FLOC_MIN_ML}–${FLOC_MAX_ML} mL/L.`)
}

const recorded = (id, label, value) => metric(id, label, value, 'Recorded', 'recorded', 'No safe band in this app.')

const feedConversion = (pond) => {
  const fishCount = numberOrNull(pond.fishCount)
  const weight = numberOrNull(pond.avgWeightGrams)
  const initial = numberOrNull(pond.initialBiomassKg)
  const feed = numberOrNull(pond.cumulativeFeedKg)
  if (fishCount === null || weight === null || initial === null || feed === null) {
    return metric('fcr', 'Feed per kg gained (FCR)', '—', 'Missing', 'watch', 'Not enough stocking or feed data.')
  }
  const biomass = (fishCount * weight) / 1000
  const gain = Math.max(1, biomass - initial)
  const fcr = feed / gain
  const shown = fcr.toFixed(2)
  if (fcr > FCR_HIGH) {
    return metric('fcr', 'Feed per kg gained (FCR)', shown, 'High', 'unhealthy', `Above ${FCR_HIGH}.`)
  }
  if (fcr > FCR_ELEVATED) {
    return metric('fcr', 'Feed per kg gained (FCR)', shown, 'High', 'watch', `Above ${FCR_ELEVATED}.`)
  }
  return metric('fcr', 'Feed per kg gained (FCR)', shown, 'In range', 'ok', `At or below ${FCR_ELEVATED}.`)
}

const aeratorMetric = (pond, oxygen) => {
  const power = numberOrNull(pond.actuators?.aerator?.powerPercent)
  const status = pond.actuators?.aerator?.status || 'UNKNOWN'
  const shown = power === null ? status : `${status}, ${power}%`
  const oxygenValue = numberOrNull(oxygen)
  if (oxygenValue !== null && oxygenValue < DO_LOW_MGL && (power === null || power < 90)) {
    return metric(
      'aerator',
      'Aerator',
      shown,
      'Low',
      'watch',
      `Oxygen is below ${DO_LOW_MGL} mg/L and power is under 90%.`
    )
  }
  return metric('aerator', 'Aerator', shown, 'In range', 'ok', 'Power is enough for the current oxygen reading.')
}

const dosingMetric = (pond, ammonia, oxygen) => {
  const status = pond.actuators?.dosing?.status || 'UNKNOWN'
  const ammoniaValue = numberOrNull(ammonia)
  const oxygenValue = numberOrNull(oxygen)
  if (
    ammoniaValue !== null &&
    ammoniaValue > NH3_OPT_MGL &&
    oxygenValue !== null &&
    oxygenValue >= DO_CRITICAL_MGL &&
    status !== 'DOSING'
  ) {
    return metric('dosing', 'Molasses valve', status, 'Not dosing', 'watch', `Ammonia is above ${NH3_OPT_MGL} mg/L and the valve is not dosing.`)
  }
  if (oxygenValue !== null && oxygenValue < DO_CRITICAL_MGL) {
    return metric('dosing', 'Molasses valve', status, 'Held', 'ok', `Held while oxygen is below ${DO_CRITICAL_MGL} mg/L.`)
  }
  return metric('dosing', 'Molasses valve', status, 'In range', 'ok', 'Valve matches the ammonia reading.')
}

const flushMetric = (pond) => {
  const status = pond.actuators?.flush?.status || 'UNKNOWN'
  if (status === 'FAULT') {
    return metric('flush', 'Siphon', status, 'Fault', 'unhealthy', 'The siphon reports a fault.')
  }
  return metric('flush', 'Siphon', status, 'In range', 'ok', 'The siphon is not in fault.')
}

const verdictFrom = (metrics) => {
  if (metrics.some((item) => item.level === 'unhealthy')) return 'Unhealthy'
  if (metrics.some((item) => item.level === 'watch')) return 'Watch'
  return 'Healthy'
}

const PRIMARY_IDS = ['do', 'ph', 'temp', 'ammonia']
const LEVEL_RANK = { unhealthy: 0, watch: 1, ok: 2, recorded: 3 }

const bySeverity = (left, right) => {
  const levelGap = (LEVEL_RANK[left.level] ?? 9) - (LEVEL_RANK[right.level] ?? 9)
  if (levelGap !== 0) return levelGap
  const leftOrder = PRIMARY_IDS.indexOf(left.id)
  const rightOrder = PRIMARY_IDS.indexOf(right.id)
  return (leftOrder === -1 ? 99 : leftOrder) - (rightOrder === -1 ? 99 : rightOrder)
}

const reasonFrom = (metrics) => {
  const problems = metrics.filter((item) => item.level === 'unhealthy' || item.level === 'watch')
  if (!problems.length) return 'All checked readings are in range.'
  const first = problems[0]
  const detail = `${first.label} is ${first.call.toLowerCase()} (${first.value}).`
  if (problems.length === 1) return detail
  return `${detail} ${problems.length} readings need a look.`
}

export const assessPond = (pond) => {
  if (!pond) {
    return { verdict: 'Watch', reason: 'No pond selected.', metrics: [], cardMetrics: [], problems: [] }
  }

  const telemetry = pond.telemetry || {}
  const flocSensor = telemetry.flocSensor || {}
  const metrics = [
    oxygenMetric(telemetry.do),
    rangeMetric('ph', 'pH', telemetry.ph, 2, 'pH', PH_MIN, PH_MAX),
    rangeMetric('temp', 'Temperature', telemetry.temp, 1, '°C', TEMP_MIN_C, TEMP_MAX_C),
    ammoniaMetric(telemetry.ammonia),
    rangeMetric('orp', 'ORP', telemetry.orp, 0, 'mV', ORP_MIN_MV, ORP_MAX_MV, 'watch'),
    flocMetric(telemetry.flocDensity),
    feedConversion(pond),
    recorded('survival', 'Survival', pond.survivalRate == null ? '—' : `${pond.survivalRate}%`),
    recorded('weight', 'Fish weight', pond.avgWeightGrams == null ? '—' : `${pond.avgWeightGrams} g`),
    recorded('tds', 'TDS', telemetry.tds == null ? '—' : `${telemetry.tds} ppm`),
    recorded('tss', 'TSS', flocSensor.tssMgL == null ? '—' : `${flocSensor.tssMgL} mg/L`),
    recorded('od600', 'OD600', flocSensor.od600 == null ? '—' : String(flocSensor.od600)),
    aeratorMetric(pond, telemetry.do),
    dosingMetric(pond, telemetry.ammonia, telemetry.do),
    recorded('feeder', 'Feeder', pond.actuators?.feeder?.status || '—'),
    flushMetric(pond)
  ]

  const cardMetrics = metrics.filter((item) => PRIMARY_IDS.includes(item.id)).sort(bySeverity)
  const problems = metrics
    .filter((item) => item.level === 'unhealthy' || item.level === 'watch')
    .sort((left, right) => {
      const leftPrimary = PRIMARY_IDS.includes(left.id) ? 0 : 1
      const rightPrimary = PRIMARY_IDS.includes(right.id) ? 0 : 1
      if (leftPrimary !== rightPrimary) return leftPrimary - rightPrimary
      return bySeverity(left, right)
    })
  const verdict = verdictFrom(cardMetrics)

  return {
    verdict,
    reason: reasonFrom(cardMetrics),
    metrics,
    cardMetrics,
    problems
  }
}
