// DO_CRITICAL_MGL is the sourced aerator line, 3 mg/L.
// DO_FLOOR_MGL is the sourced critical line, 1.0 mg/L.
// DO_LOW_MGL is only the Overview watch band. It is not an SOP limit.
export const DO_CRITICAL_MGL = 3
export const DO_FLOOR_MGL = 1
export const DO_SOP_MGL = DO_CRITICAL_MGL
export const DO_LOW_MGL = 4.5
export const NH3_OPT_MGL = 0.05
export const PH_MIN = 7
export const PH_MAX = 9
export const TEMP_MIN_C = 22
export const TEMP_MAX_C = 29

const FIRMWARE = 'v2.4.1-biofloc'

const formatNumber = (value, digits) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return '—'
  return number.toFixed(digits)
}

const gatewayRadio = (pondId) => {
  const nodeNum = Number(String(pondId).replace(/\D/g, '')) || 4
  const rssi = pondId === 'B' ? '-62 dBm' : '-58 dBm'
  return {
    ip: `192.168.1.${100 + nodeNum}`,
    rssi,
    firmware: FIRMWARE
  }
}

export const dissolvedOxygenBand = (doMg) => {
  const value = Number(doMg)
  if (!Number.isFinite(value) || value < DO_CRITICAL_MGL) return 'critical'
  if (value < DO_LOW_MGL) return 'low'
  return 'healthy'
}

export const waterColorForDo = (doMg) => {
  const band = dissolvedOxygenBand(doMg)
  if (band === 'critical') return '#9f1239'
  if (band === 'low') return '#b45309'
  return '#0f766e'
}

export const buildEspNodes = (pond) => {
  if (!pond) return []

  const telemetry = pond.telemetry || {}
  const actuators = pond.actuators || {}
  const floc = telemetry.flocSensor || {}
  const radio = gatewayRadio(pond.id)
  const dissolvedOxygen = Number(telemetry.do)
  const ammonia = Number(telemetry.ammonia)
  const ph = Number(telemetry.ph)
  const temp = Number(telemetry.temp)

  const probe = (id, name, shortLabel, lines, ok, position, labelOffset) => ({
    id,
    name,
    shortLabel,
    kind: 'probe',
    shape: 'probe',
    link: 'RS485',
    lines,
    metric: lines.join(' · '),
    ok,
    position,
    labelOffset
  })

  const actuator = (device, name, shortLabel, shape, lines, ok, position, labelOffset) => ({
    id: device?.id || name,
    name,
    shortLabel,
    kind: 'actuator',
    shape,
    link: 'Relay',
    lines,
    metric: lines.join(' · '),
    ok,
    status: device?.status || 'UNKNOWN',
    position,
    labelOffset
  })

  return [
    {
      id: `ESP32-${pond.id}`,
      name: 'Gateway',
      shortLabel: 'GW',
      kind: 'gateway',
      shape: 'gateway',
      link: 'Wi-Fi',
      lines: [radio.ip, radio.rssi, radio.firmware],
      metric: `${radio.ip} · ${radio.rssi} · ${radio.firmware}`,
      ok: true,
      position: [2.55, 1.22, -2.62],
      labelOffset: [0.55, 1.4, 0.22]
    },
    probe(
      `RS485-${pond.id}-DO`,
      'DO',
      'DO',
      [`${formatNumber(dissolvedOxygen, 2)} mg/L`],
      dissolvedOxygen >= 3.5,
      [-2.4, 1.07, 0.2],
      [-0.85, 0.9, -0.2]
    ),
    probe(
      `RS485-${pond.id}-PH`,
      'pH',
      'pH',
      [`${formatNumber(ph, 2)} pH`],
      ph >= PH_MIN && ph <= PH_MAX,
      [-1.15, 1.07, 1.68],
      [-0.2, 0.72, 0.58]
    ),
    probe(
      `RS485-${pond.id}-TEMP`,
      'Temperature',
      'Temp',
      [`${formatNumber(temp, 1)} °C`],
      temp >= TEMP_MIN_C && temp <= TEMP_MAX_C,
      [0.55, 1.07, 1.68],
      [-0.35, 0.98, 0.12]
    ),
    probe(
      `RS485-${pond.id}-NH3`,
      'Ammonia',
      'NH3',
      [`${formatNumber(ammonia, 3)} ppm`],
      ammonia <= NH3_OPT_MGL,
      [2.5, 1.07, 0.4],
      [0.55, 0.88, 0.42]
    ),
    probe(
      `RS485-${pond.id}-ORP`,
      'ORP',
      'ORP',
      [`${formatNumber(telemetry.orp, 0)} mV`],
      Number(telemetry.orp) >= 150 && Number(telemetry.orp) <= 400,
      [2.5, 1.07, -0.75],
      [0.78, 0.72, -0.05]
    ),
    probe(
      `RS485-${pond.id}-TDS`,
      'TDS',
      'TDS',
      [`${formatNumber(telemetry.tds, 0)} ppm`],
      Number.isFinite(Number(telemetry.tds)),
      [1.35, 1.07, -1.68],
      [0.5, 0.92, -0.32]
    ),
    probe(
      `RS485-${pond.id}-FLOC`,
      'Imhoff floc',
      'Floc',
      [
        `${formatNumber(telemetry.flocDensity, 0)} mL/L`,
        `OD600 ${formatNumber(floc.od600, 2)}`,
        `TSS ${formatNumber(floc.tssMgL, 0)}`
      ],
      Number.isFinite(Number(telemetry.flocDensity)),
      [-1.35, 1.07, -1.68],
      [-0.2, 1.05, -0.55]
    ),
    actuator(
      actuators.feeder,
      'Feeder',
      'Feed',
      'feeder',
      [
        actuators.feeder?.status || 'IDLE',
        `${formatNumber(actuators.feeder?.dispensedTodayKg, 1)} kg today`
      ],
      true,
      [-1.35, 1.08, 1.48],
      [-0.82, 0.88, 0.32]
    ),
    actuator(
      actuators.aerator,
      'Aerator',
      'Air',
      'aerator',
      [
        actuators.aerator?.status || 'RUNNING',
        `${formatNumber(actuators.aerator?.powerPercent, 0)}% power`
      ],
      !(dissolvedOxygen < DO_LOW_MGL && Number(actuators.aerator?.powerPercent) < 90),
      [1.5, 1.08, 1.48],
      [0.72, 0.82, 0.5]
    ),
    actuator(
      actuators.dosing,
      'Molasses',
      'Dose',
      'dose',
      [
        actuators.dosing?.status || 'STANDBY',
        `${formatNumber(actuators.dosing?.flowMlMin, 0)} mL/min`
      ],
      !(ammonia > NH3_OPT_MGL && actuators.dosing?.status !== 'DOSING' && dissolvedOxygen >= DO_CRITICAL_MGL),
      [-1.55, 1.08, -1.15],
      [-0.9, 0.98, -0.08]
    ),
    actuator(
      actuators.flush,
      'Siphon',
      'Siphon',
      'siphon',
      [
        actuators.flush?.status || 'STANDBY',
        ...(actuators.flush?.status === 'FLUSHING'
          ? ['Draining']
          : String(actuators.flush?.lastFlushed || 'Closed')
            .split(' (')
            .map((part, index) => (index === 0 ? part : `(${part}`)))
      ],
      actuators.flush?.status !== 'FAULT',
      [0.4, 1.08, -1.52],
      [0.4, 0.98, -0.12]
    )
  ]
}

export const expectedReactions = (pond) => {
  if (!pond) return []

  const dissolvedOxygen = Number(pond.telemetry?.do)
  const ammonia = Number(pond.telemetry?.ammonia)
  const feederStatus = pond.actuators?.feeder?.status || 'IDLE'
  const items = []

  if (dissolvedOxygen < DO_CRITICAL_MGL) {
    items.push({
      tone: 'critical',
      text: `DO ${formatNumber(dissolvedOxygen, 2)} mg/L is below the 3 mg/L critical limit. Boost the aerator. Hold molasses until oxygen recovers.`
    })
  } else if (dissolvedOxygen < DO_LOW_MGL) {
    items.push({
      tone: 'alert',
      text: `DO ${formatNumber(dissolvedOxygen, 2)} mg/L is low. Boost the aerator to bring oxygen back above the safe band.`
    })
  } else {
    items.push({
      tone: 'ok',
      text: `DO ${formatNumber(dissolvedOxygen, 2)} mg/L is above the critical limit. Keep the aerator on its current loop.`
    })
  }

  if (ammonia > NH3_OPT_MGL && dissolvedOxygen < DO_CRITICAL_MGL) {
    items.push({
      tone: 'critical',
      text: `Ammonia ${formatNumber(ammonia, 3)} ppm is high, and molasses stays blocked while DO is below 3 mg/L.`
    })
  } else if (ammonia > NH3_OPT_MGL) {
    items.push({
      tone: 'alert',
      text: `Ammonia ${formatNumber(ammonia, 3)} ppm is above 0.05 ppm. Dose molasses to restore the carbon balance.`
    })
  } else {
    items.push({
      tone: 'ok',
      text: `Ammonia ${formatNumber(ammonia, 3)} ppm is within the 0.05 ppm optimal band. Keep the molasses valve on standby.`
    })
  }

  if (feederStatus === 'READY' || feederStatus === 'DISPENSING') {
    items.push({
      tone: 'alert',
      text: `Feeder is ${feederStatus}. Run the feeder for this feed window.`
    })
  } else {
    items.push({
      tone: 'ok',
      text: `Feeder is ${feederStatus}. Wait for the next feed window.`
    })
  }

  return items
}
