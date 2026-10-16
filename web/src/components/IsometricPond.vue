<script setup>
import { computed, defineComponent, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { Html } from '@tresjs/cientos'
import { TresCanvas, useLoop, useTresContext } from '@tresjs/core'
import { buildEspNodes, waterColorForDo } from '../pondHardware'

const props = defineProps({
  pond: {
    type: Object,
    required: true
  },
  highlightId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['projection', 'hover', 'leave', 'select'])

const stageRoot = ref(null)
const nodes = computed(() => buildEspNodes(props.pond))
const waterColor = computed(() => waterColorForDo(props.pond?.telemetry?.do))

const bubbleGroup = shallowRef(null)
const pelletGroup = shallowRef(null)
const dripGroup = shallowRef(null)
const waterMesh = shallowRef(null)
const fanMesh = shallowRef(null)
const fishSchool = shallowRef(null)

const fishRoster = [
  {
    id: 'fish-orange',
    color: '#fb923c',
    body: [0.5, 0.16, 0.22],
    kind: 'ellipse',
    speed: 0.46,
    phase: 0.35,
    radiusX: 1.4,
    radiusZ: 0.76,
    y: 0.4,
    wag: 7.4
  },
  {
    id: 'fish-silver',
    color: '#38bdf8',
    body: [0.46, 0.15, 0.2],
    kind: 'ellipse',
    speed: 0.3,
    phase: 3.4,
    radiusX: 0.92,
    radiusZ: 1.02,
    y: 0.32,
    wag: 6.1
  },
  {
    id: 'fish-gold',
    color: '#facc15',
    body: [0.44, 0.15, 0.2],
    kind: 'figure',
    speed: 0.36,
    phase: 4.2,
    radiusX: 1.55,
    radiusZ: 1.2,
    y: 0.5,
    wag: 8.2
  }
]

const bubbleSeeds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
const pelletSeeds = [0, 1, 2, 3, 4, 5, 6, 7]
const dripSeeds = [0, 1, 2, 3]

const spread = (index, count, min, max) => min + ((index + 0.5) / count) * (max - min)

const flags = computed(() => ({
  aeratorOn: props.pond?.actuators?.aerator?.status === 'RUNNING',
  aeratorPower: Number(props.pond?.actuators?.aerator?.powerPercent) || 0,
  feederOn: ['READY', 'DISPENSING'].includes(props.pond?.actuators?.feeder?.status),
  dosingOn: props.pond?.actuators?.dosing?.status === 'DOSING',
  flushing: props.pond?.actuators?.flush?.status === 'FLUSHING'
}))

const canvasLabel = computed(() => {
  const name = props.pond?.name || 'Selected pond'
  const dissolvedOxygen = props.pond?.telemetry?.do
  return `${name} isometric pond. Dissolved oxygen ${dissolvedOxygen ?? 'unknown'} mg/L. Sensor values are listed beside the pond.`
})

const labelCanvas = () => {
  const canvas = stageRoot.value?.querySelector('canvas')
  if (!canvas) return
  canvas.setAttribute('role', 'img')
  canvas.setAttribute('aria-label', canvasLabel.value)
}

onMounted(labelCanvas)
watch(canvasLabel, labelCanvas)

const SceneMotion = defineComponent({
  name: 'SceneMotion',
  props: {
    bubbles: { type: Object, default: null },
    pellets: { type: Object, default: null },
    drips: { type: Object, default: null },
    water: { type: Object, default: null },
    fan: { type: Object, default: null },
    fish: { type: Object, default: null },
    aeratorOn: { type: Boolean, default: false },
    aeratorPower: { type: Number, default: 0 },
    feederOn: { type: Boolean, default: false },
    dosingOn: { type: Boolean, default: false },
    flushing: { type: Boolean, default: false }
  },
  emits: ['projection'],
  setup(motionProps, { emit: emitMotion }) {
    const { onBeforeRender } = useLoop()
    const { camera, sizes } = useTresContext()
    let reported = false
    let waterDrop = 0
    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)')
    let reduceMotion = motionMedia.matches
    const handleMotionPreference = (event) => {
      reduceMotion = event.matches
    }
    motionMedia.addEventListener('change', handleMotionPreference)
    onUnmounted(() => motionMedia.removeEventListener('change', handleMotionPreference))

    onBeforeRender(({ elapsed, delta }) => {
      const activeCamera = camera.activeCamera?.value
      if (activeCamera?.isOrthographicCamera) {
        const aspect = Math.max(sizes.aspectRatio?.value || 1.5, 0.35)
        const minHalfWidth = 8.8
        const minHalfHeight = 5.2
        const halfWidth = Math.max(minHalfWidth, minHalfHeight * aspect)
        const halfHeight = halfWidth / aspect
        activeCamera.left = -halfWidth
        activeCamera.right = halfWidth
        activeCamera.top = halfHeight
        activeCamera.bottom = -halfHeight
        activeCamera.near = 0.1
        activeCamera.far = 220
        activeCamera.zoom = 1
        activeCamera.position.set(16, 16, 16)
        activeCamera.lookAt(0, 0.45, 0)
        activeCamera.updateProjectionMatrix()
        if (!reported) {
          reported = true
          emitMotion('projection', 'orthographic')
        }
      } else if (!reported && activeCamera) {
        reported = true
        emitMotion('projection', 'perspective')
      }

      const rise = 0.35 + (motionProps.aeratorPower / 100) * 0.7
      const bubbles = motionProps.bubbles
      if (bubbles?.children) {
        bubbles.visible = motionProps.aeratorOn
        bubbles.children.forEach((mesh, index) => {
          if (reduceMotion) {
            mesh.position.y = 0.35 + (index % 4) * 0.18
          } else {
            const cycle = (elapsed * rise + index * 0.17) % 1.35
            mesh.position.y = -0.05 + cycle
          }
          mesh.visible = motionProps.aeratorOn
        })
      }

      const pellets = motionProps.pellets
      if (pellets?.children) {
        pellets.visible = motionProps.feederOn
        pellets.children.forEach((mesh, index) => {
          if (reduceMotion) {
            mesh.position.y = 0.85 - (index % 4) * 0.16
          } else {
            const cycle = (elapsed * 0.85 + index * 0.2) % 1.7
            mesh.position.y = 1.55 - cycle
          }
          mesh.visible = motionProps.feederOn
        })
      }

      const drips = motionProps.drips
      if (drips?.children) {
        drips.visible = motionProps.dosingOn
        drips.children.forEach((mesh, index) => {
          if (reduceMotion) {
            mesh.position.y = 0.7 - index * 0.18
          } else {
            const cycle = (elapsed * 0.95 + index * 0.28) % 1.15
            mesh.position.y = 1.2 - cycle * 0.9
          }
          mesh.visible = motionProps.dosingOn
        })
      }

      if (motionProps.fan) {
        motionProps.fan.visible = motionProps.aeratorOn
        if (motionProps.aeratorOn && !reduceMotion) {
          motionProps.fan.rotation.y += delta * (2 + motionProps.aeratorPower / 40)
        }
      }

      const targetDrop = motionProps.flushing ? 0.34 : 0
      if (reduceMotion) {
        waterDrop = targetDrop
      } else {
        waterDrop += (targetDrop - waterDrop) * Math.min(1, delta * 2.2)
      }
      if (motionProps.water) {
        motionProps.water.position.set(0, 0.46 - waterDrop, 0)
        motionProps.water.scale.y = 1 - waterDrop * 0.85
      }

      const school = motionProps.fish
      if (school?.children?.length) {
        const surface = 0.7 - waterDrop * 1.05
        school.children.forEach((group, index) => {
          const spec = fishRoster[index]
          if (!spec) return
          const theta = (reduceMotion ? spec.phase : elapsed * spec.speed + spec.phase)
          let x = 0
          let z = 0
          let dx = 1
          let dz = 0
          if (spec.kind === 'figure') {
            const sine = Math.sin(theta)
            const cosine = Math.cos(theta)
            x = spec.radiusX * sine
            z = spec.radiusZ * sine * cosine
            dx = spec.radiusX * spec.speed * cosine
            dz = spec.radiusZ * spec.speed * (cosine * cosine - sine * sine)
          } else {
            x = spec.radiusX * Math.cos(theta)
            z = spec.radiusZ * Math.sin(theta)
            dx = -spec.radiusX * spec.speed * Math.sin(theta)
            dz = spec.radiusZ * spec.speed * Math.cos(theta)
          }
          x = Math.max(-2.15, Math.min(2.15, x))
          z = Math.max(-1.35, Math.min(1.35, z))
          const swimY = Math.min(spec.y - waterDrop * 0.7, surface)
          group.position.set(x, Math.max(0.24, swimY), z)
          if (dx * dx + dz * dz > 0.0001) {
            group.rotation.y = Math.atan2(-dz, dx)
          }
          const tail = group.children[1]
          if (tail) {
            tail.rotation.z = Math.PI / 2
            tail.rotation.y = reduceMotion ? 0 : Math.sin(elapsed * spec.wag + spec.phase) * 0.45
          }
        })
      }
    })

    return () => null
  }
})

const handleProjection = (kind) => {
  emit('projection', kind)
}

const flatRotation = [-Math.PI / 2, 0, 0]

const roleColor = (node) => {
  if (node.kind === 'gateway') return '#0369a1'
  if (node.kind === 'actuator') return '#c2410c'
  return '#0f766e'
}

const statusColor = (node) => (node.ok ? '#16a34a' : '#e11d48')

const isHot = (node) => props.highlightId === node.id

const nodePosition = (shape, fallback) =>
  nodes.value.find((node) => node.shape === shape)?.position || fallback

const pullTowardCenter = (position, pull, y = 0) => {
  const x = position?.[0] ?? 0
  const z = position?.[2] ?? 0
  const length = Math.hypot(x, z) || 1
  const next = Math.max(length - pull, 0.35)
  return [(x / length) * next, y, (z / length) * next]
}

const aeratorPosition = computed(() => {
  const aerator = nodePosition('aerator', [2.35, 1.08, 1.9])
  return [aerator[0], aerator[1] + 0.46, aerator[2]]
})

const pelletAnchor = computed(() => pullTowardCenter(nodePosition('feeder', [-2.35, 1.08, 1.9]), 0.85))
const bubbleAnchor = computed(() => pullTowardCenter(nodePosition('aerator', [2.35, 1.08, 1.9]), 1.15, 0.3))
const dripAnchor = computed(() => pullTowardCenter(nodePosition('dose', [-3.02, 1.08, -1.05]), 0.62))

const probeDipPosition = (node) => {
  const x = node.position?.[0] ?? 0
  const z = node.position?.[2] ?? 0
  const length = Math.hypot(x, z) || 1
  const inset = 0.36
  return [-(x / length) * inset, -0.36, -(z / length) * inset]
}

const handlePointerEnter = (id) => {
  const canvas = stageRoot.value?.querySelector('canvas')
  if (canvas) canvas.style.cursor = 'pointer'
  emit('hover', id)
}

const handlePointerLeave = (id) => {
  const canvas = stageRoot.value?.querySelector('canvas')
  if (canvas) canvas.style.cursor = ''
  emit('leave', id)
}

const handleSelect = (id) => {
  emit('select', id)
}
</script>

<template>
  <div ref="stageRoot" class="pond-root">
    <TresCanvas
      clear-color="#d5e6f2"
      shadows
      render-mode="always"
    >
      <TresOrthographicCamera
        :args="[-6, 6, 2.85, -2.85, 0.1, 220]"
        :position="[16, 16, 16]"
        :rotation="[-0.7727406115633964, 0.6213837932986432, 0.5162603605988737]"
      />

      <TresAmbientLight :intensity="0.72" />
      <TresDirectionalLight
        :position="[12, 18, 8]"
        :intensity="1.45"
        cast-shadow
      />

      <TresMesh :position="[0, -0.02, 0]" receive-shadow>
        <TresBoxGeometry :args="[10.5, 0.08, 8.2]" />
        <TresMeshStandardMaterial color="#cbd5e1" :roughness="0.92" />
      </TresMesh>

      <TresMesh :position="[0, 0.08, 0]" receive-shadow>
        <TresBoxGeometry :args="[6.2, 0.12, 4.2]" />
        <TresMeshStandardMaterial color="#94a3b8" :roughness="0.8" />
      </TresMesh>

      <TresMesh :position="[0, 0.58, -2.1]" cast-shadow>
        <TresBoxGeometry :args="[6.2, 1.05, 0.16]" />
        <TresMeshStandardMaterial color="#e2e8f0" :roughness="0.7" />
      </TresMesh>
      <TresMesh :position="[0, 0.58, 2.1]" cast-shadow>
        <TresBoxGeometry :args="[6.2, 1.05, 0.16]" />
        <TresMeshStandardMaterial color="#f8fafc" :roughness="0.7" />
      </TresMesh>
      <TresMesh :position="[-3.1, 0.58, 0]" cast-shadow>
        <TresBoxGeometry :args="[0.16, 1.05, 4.2]" />
        <TresMeshStandardMaterial color="#e2e8f0" :roughness="0.7" />
      </TresMesh>
      <TresMesh :position="[3.1, 0.58, 0]" cast-shadow>
        <TresBoxGeometry :args="[0.16, 1.05, 4.2]" />
        <TresMeshStandardMaterial color="#f1f5f9" :roughness="0.7" />
      </TresMesh>

      <TresMesh ref="waterMesh" :position="[0, 0.46, 0]" receive-shadow>
        <TresBoxGeometry :args="[5.55, 0.62, 3.55]" />
        <TresMeshStandardMaterial
          :color="waterColor"
          transparent
          :opacity="0.72"
          :depth-write="false"
          :roughness="0.18"
          :metalness="0.04"
        />
      </TresMesh>

      <TresGroup ref="fishSchool" :render-order="2">
        <TresGroup v-for="fish in fishRoster" :key="fish.id" :name="fish.id">
          <TresMesh :scale="fish.body">
            <TresSphereGeometry :args="[1, 8, 6]" />
            <TresMeshStandardMaterial :color="fish.color" :roughness="0.42" />
          </TresMesh>
          <TresMesh :position="[-0.46, 0, 0]" :rotation="[0, 0, 1.5708]" :scale="[1, 1, 0.42]">
            <TresConeGeometry :args="[0.13, 0.24, 3]" />
            <TresMeshStandardMaterial :color="fish.color" :roughness="0.46" />
          </TresMesh>
        </TresGroup>
      </TresGroup>

      <TresGroup
        v-for="node in nodes"
        :key="node.id"
        :position="node.position"
        :scale="isHot(node) ? 1.14 : 1"
      >
        <TresMesh
          :position="[0, 0.36, 0]"
          @pointerenter="handlePointerEnter(node.id)"
          @pointerleave="handlePointerLeave(node.id)"
          @click="handleSelect(node.id)"
        >
          <TresBoxGeometry :args="[0.52, 0.72, 0.52]" />
          <TresMeshBasicMaterial transparent :opacity="0" :depth-write="false" />
        </TresMesh>

        <TresMesh
          v-if="isHot(node)"
          :position="[0, 0.04, 0]"
          :rotation="flatRotation"
        >
          <TresRingGeometry :args="[0.36, 0.48, 28]" />
          <TresMeshBasicMaterial color="#0284c7" />
        </TresMesh>

        <TresMesh v-if="node.shape === 'probe'" :position="[0, 0.34, 0]" cast-shadow>
          <TresCylinderGeometry :args="[0.07, 0.1, 0.62, 12]" />
          <TresMeshStandardMaterial
            :color="roleColor(node)"
            :emissive="isHot(node) ? '#67e8f9' : '#000000'"
            :emissive-intensity="isHot(node) ? 0.35 : 0"
            :roughness="0.38"
          />
        </TresMesh>
        <TresMesh v-if="node.shape === 'probe'" :position="[0, 0.7, 0]">
          <TresCylinderGeometry :args="[0.16, 0.16, 0.07, 16]" />
          <TresMeshStandardMaterial color="#ecfeff" :roughness="0.3" />
        </TresMesh>
        <TresMesh v-if="node.shape === 'probe'" :position="probeDipPosition(node)">
          <TresCylinderGeometry :args="[0.035, 0.045, 0.78, 8]" />
          <TresMeshStandardMaterial :color="roleColor(node)" :roughness="0.35" />
        </TresMesh>

        <TresMesh v-if="node.shape === 'gateway'" cast-shadow>
          <TresBoxGeometry :args="[0.62, 0.92, 0.42]" />
          <TresMeshStandardMaterial
            :color="roleColor(node)"
            :emissive="isHot(node) ? '#7dd3fc' : '#000000'"
            :emissive-intensity="isHot(node) ? 0.35 : 0"
            :roughness="0.42"
          />
        </TresMesh>
        <TresMesh v-if="node.shape === 'gateway'" :position="[0, 0.72, 0]">
          <TresCylinderGeometry :args="[0.035, 0.035, 0.58, 8]" />
          <TresMeshStandardMaterial color="#0f172a" />
        </TresMesh>
        <TresMesh v-if="node.shape === 'gateway'" :position="[0, 1.02, 0]">
          <TresSphereGeometry :args="[0.07, 10, 10]" />
          <TresMeshStandardMaterial color="#e0f2fe" />
        </TresMesh>

        <TresMesh v-if="node.kind === 'actuator'" :position="[0, 0.2, 0]" cast-shadow>
          <TresBoxGeometry :args="[node.shape === 'siphon' ? 0.62 : 0.46, node.shape === 'siphon' ? 0.24 : 0.38, node.shape === 'siphon' ? 0.46 : 0.46]" />
          <TresMeshStandardMaterial
            :color="roleColor(node)"
            :emissive="isHot(node) ? '#fdba74' : '#000000'"
            :emissive-intensity="isHot(node) ? 0.4 : 0"
            :roughness="0.46"
          />
        </TresMesh>
        <TresMesh v-if="node.shape === 'feeder'" :position="[0, 0.52, 0]">
          <TresConeGeometry :args="[0.2, 0.28, 4]" />
          <TresMeshStandardMaterial color="#9a3412" :roughness="0.5" />
        </TresMesh>
        <TresMesh v-if="node.shape === 'dose'" :position="[0, 0.58, 0]">
          <TresCylinderGeometry :args="[0.14, 0.14, 0.32, 12]" />
          <TresMeshStandardMaterial color="#78350f" :roughness="0.45" />
        </TresMesh>
        <TresMesh v-if="node.shape === 'siphon'" :position="[0, 0.08, 0.28]">
          <TresBoxGeometry :args="[0.22, 0.1, 0.34]" />
          <TresMeshStandardMaterial color="#7c2d12" :roughness="0.5" />
        </TresMesh>

        <TresMesh :position="[0, node.shape === 'gateway' ? 1.22 : 0.86, 0]">
          <TresSphereGeometry :args="[0.08, 12, 12]" />
          <TresMeshStandardMaterial
            :color="statusColor(node)"
            :emissive="statusColor(node)"
            :emissive-intensity="0.55"
          />
        </TresMesh>

        <Html
          :position="node.labelOffset"
          center
          pointer-events="none"
          :z-index-range="[12, 0]"
        >
          <span class="pond-chip" :class="node.kind" :data-marker="node.shortLabel">{{ node.shortLabel }}</span>
        </Html>
      </TresGroup>

      <TresGroup ref="bubbleGroup" :position="bubbleAnchor">
        <TresMesh
          v-for="index in bubbleSeeds"
          :key="`bubble-${index}`"
          :position="[spread(index, 12, -0.7, 0.7), 0.2, spread(11 - index, 12, -0.45, 0.45)]"
        >
          <TresSphereGeometry :args="[0.055, 10, 10]" />
          <TresMeshStandardMaterial color="#e0f2fe" transparent :opacity="0.75" />
        </TresMesh>
      </TresGroup>

      <TresGroup ref="pelletGroup" :position="pelletAnchor">
        <TresMesh
          v-for="index in pelletSeeds"
          :key="`pellet-${index}`"
          :position="[spread(index, 8, -0.35, 0.35), 1.2, spread(index % 4, 4, -0.2, 0.2)]"
        >
          <TresSphereGeometry :args="[0.05, 8, 8]" />
          <TresMeshStandardMaterial color="#a16207" />
        </TresMesh>
      </TresGroup>

      <TresGroup ref="dripGroup" :position="dripAnchor">
        <TresMesh
          v-for="index in dripSeeds"
          :key="`drip-${index}`"
          :position="[0, 1, index * 0.02]"
        >
          <TresSphereGeometry :args="[0.045, 8, 8]" />
          <TresMeshStandardMaterial color="#78350f" transparent :opacity="0.85" />
        </TresMesh>
      </TresGroup>

      <TresMesh ref="fanMesh" :position="aeratorPosition">
        <TresCylinderGeometry :args="[0.28, 0.28, 0.06, 6]" />
        <TresMeshStandardMaterial color="#0369a1" />
      </TresMesh>

      <SceneMotion
        :bubbles="bubbleGroup"
        :pellets="pelletGroup"
        :drips="dripGroup"
        :water="waterMesh"
        :fan="fanMesh"
        :fish="fishSchool"
        :aerator-on="flags.aeratorOn"
        :aerator-power="flags.aeratorPower"
        :feeder-on="flags.feederOn"
        :dosing-on="flags.dosingOn"
        :flushing="flags.flushing"
        @projection="handleProjection"
      />
    </TresCanvas>
  </div>
</template>

<style scoped>
.pond-root {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  isolation: isolate;
}
</style>

<style>
.pond-chip {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid #0f172a;
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  font: 700 11px/1.2 ui-sans-serif, system-ui, sans-serif;
  letter-spacing: 0.01em;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.2);
}

.pond-chip.probe {
  border-color: #0f766e;
}

.pond-chip.actuator {
  border-color: #c2410c;
}

.pond-chip.gateway {
  border-color: #0369a1;
}
</style>
