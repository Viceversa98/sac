<script setup>
import { nextTick, ref } from 'vue'
import { Bot, Send, X } from 'lucide-vue-next'
import { usePonds } from '../composables/usePonds'

const emit = defineEmits(['close'])
const { ponds, applyScenario, applyApprovedAction } = usePonds()

const inputMessage = ref('')
const isWorking = ref(false)
const chatScroll = ref(null)
const changes = ref([])
const messages = ref([
  {
    id: 'hello',
    role: 'assistant',
    text: 'Tell me which pond to change. I update the page beside this panel. Nothing is sent to equipment.'
  }
])

const pondIdsFrom = (text) => {
  const lower = text.toLowerCase()
  if (/\bboth\b|kedua/.test(lower)) return ['A', 'B']
  const wantsB = /kolam\s*b|pond\s*b/.test(lower)
  const wantsA = /kolam\s*a|pond\s*a/.test(lower)
  if (wantsA && wantsB) return ['A', 'B']
  if (wantsB) return ['B']
  return ['A']
}

const actionFrom = (text) => {
  const lower = text.toLowerCase()
  if (/hypoxia|low oxygen|oxygen drop|do drop|darurat/.test(lower)) return { kind: 'scenario', type: 'hypoxia', label: 'Hypoxia' }
  if (/ammonia|tan spike|molasses spike/.test(lower) && /spike|high|naik/.test(lower)) return { kind: 'scenario', type: 'ammonia_spike', label: 'Ammonia spike' }
  if (/healthy|normal|reset|pulih/.test(lower)) return { kind: 'scenario', type: 'reset', label: 'Healthy water' }
  if (/feed|feeder|pakan/.test(lower)) return { kind: 'scenario', type: 'feeding_window', label: 'Feed window' }
  if (/aerator|oxygen up|raise oxygen|naikkan oksigen/.test(lower)) return { kind: 'approve', type: 'start_aerator', label: 'Aerator' }
  if (/molasses|molase|dose/.test(lower)) return { kind: 'approve', type: 'dose_molasses_gL', label: 'Molasses' }
  return null
}

const snapshot = (pond) => ({
  oxygen: Number(pond.telemetry.do).toFixed(2),
  ammonia: Number(pond.telemetry.ammonia).toFixed(3)
})

const recordChange = (pond, before, label) => {
  const after = snapshot(pond)
  const rows = []
  if (before.oxygen !== after.oxygen) {
    rows.push({ field: 'Oxygen', before: `${before.oxygen} mg/L`, after: `${after.oxygen} mg/L` })
  }
  if (before.ammonia !== after.ammonia) {
    rows.push({ field: 'Ammonia', before: `${before.ammonia} mg/L`, after: `${after.ammonia} mg/L` })
  }
  if (rows.length === 0) {
    rows.push({ field: 'State', before: 'unchanged', after: label })
  }
  changes.value.unshift({
    id: `${pond.id}-${Date.now()}`,
    pondName: pond.name,
    label,
    rows
  })
}

const runAction = (action, pondId) => {
  const pond = ponds.value.find((item) => item.id === pondId)
  if (!pond) return
  const before = snapshot(pond)
  if (action.kind === 'scenario') applyScenario(action.type, pondId)
  else applyApprovedAction(action.type, pondId)
  recordChange(pond, before, action.label)
}

const replyFor = (action, ids) => {
  const names = ids.map((id) => `Kolam ${id}`).join(' and ')
  return `Updated ${names}: ${action.label}. The page beside this panel shows the new simulated readings. No hardware command was sent.`
}

const typeInto = async (draft, full) => {
  draft.text = ''
  for (let index = 0; index < full.length; index += 3) {
    draft.text = full.slice(0, index + 3)
    await new Promise((resolve) => setTimeout(resolve, 12))
  }
  draft.text = full
}

const scrollChat = async () => {
  await nextTick()
  if (chatScroll.value) chatScroll.value.scrollTop = chatScroll.value.scrollHeight
}

const handleSend = async () => {
  const text = inputMessage.value.trim()
  if (!text || isWorking.value) return
  inputMessage.value = ''
  messages.value.push({ id: `u-${Date.now()}`, role: 'user', text })
  const draft = { id: `a-${Date.now()}`, role: 'assistant', text: '', streaming: true }
  messages.value.push(draft)
  isWorking.value = true
  await scrollChat()

  const action = actionFrom(text)
  let reply = 'I can change a pond from here. Try “hypoxia on Kolam B”, “raise oxygen on Kolam A”, or “dose molasses on Kolam B”.'
  if (action) {
    const ids = pondIdsFrom(text)
    ids.forEach((id) => runAction(action, id))
    reply = replyFor(action, ids)
  }

  await typeInto(draft, reply)
  draft.streaming = false
  isWorking.value = false
  await scrollChat()
}

const handlePrompt = (prompt) => {
  inputMessage.value = prompt
  handleSend()
}

const handleClose = () => {
  emit('close')
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter') handleSend()
}
</script>

<template>
  <aside id="agent-sidebar" class="agent-dock" aria-label="Agent chat">
    <header class="agent-dock-head">
      <Bot :size="18" aria-hidden="true" />
      <div>
        <h2>Agent</h2>
        <p>Simulated. Edits the page beside this panel.</p>
      </div>
      <button type="button" class="agent-close" aria-label="Close agent sidebar" @click="handleClose">
        <X :size="16" aria-hidden="true" />
      </button>
    </header>

    <div ref="chatScroll" class="agent-messages">
      <article v-for="message in messages" :key="message.id" class="agent-bubble" :class="message.role">
        <p>{{ message.text }}<span v-if="message.streaming" class="caret" aria-hidden="true"></span></p>
      </article>
    </div>

    <section v-if="changes.length" class="change-log" aria-label="Agent changes">
      <article v-for="change in changes.slice(0, 4)" :key="change.id" class="change-card">
        <header>
          <span>{{ change.pondName }}</span>
          <span>{{ change.label }}</span>
        </header>
        <p v-for="row in change.rows" :key="change.id + row.field">
          <span>{{ row.field }}</span>
          <span class="before">{{ row.before }}</span>
          <span aria-hidden="true">→</span>
          <span class="after">{{ row.after }}</span>
        </p>
      </article>
    </section>

    <div class="agent-prompts">
      <button type="button" @click="handlePrompt('Hypoxia on Kolam B')">Hypoxia on B</button>
      <button type="button" @click="handlePrompt('Raise oxygen on Kolam A')">Raise oxygen on A</button>
      <button type="button" @click="handlePrompt('Dose molasses on Kolam B')">Molasses on B</button>
    </div>

    <form class="agent-composer" @submit.prevent="handleSend">
      <label class="sr-only" for="agent-input">Message the agent</label>
      <input
        id="agent-input"
        v-model="inputMessage"
        type="text"
        placeholder="Change Kolam B oxygen..."
        :disabled="isWorking"
        @keydown="handleKeyDown"
      />
      <button type="submit" :disabled="!inputMessage.trim() || isWorking" aria-label="Send to agent">
        <Send :size="16" aria-hidden="true" />
      </button>
    </form>
  </aside>
</template>

<style scoped>
.agent-dock {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 95;
  width: 380px;
  max-width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-left: 1px solid var(--border-medium);
  box-shadow: var(--shadow-xl, -8px 0 24px rgba(15, 23, 42, 0.08));
}

.agent-dock-head,
.agent-composer,
.change-card header,
.change-card p {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-dock-head {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-subtle);
}

.agent-dock-head h2 {
  margin: 0;
  font-size: 0.95rem;
}

.agent-dock-head p {
  margin: 2px 0 0;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.agent-dock-head div {
  flex: 1;
  min-width: 0;
}

.agent-close {
  width: 32px;
  height: 32px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
}

.agent-close:hover {
  background: var(--bg-surface-subtle);
  color: var(--text-primary);
}

.agent-messages {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agent-bubble {
  max-width: 95%;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 0.84rem;
  line-height: 1.4;
}

.agent-bubble p {
  margin: 0;
}

.agent-bubble.user {
  align-self: flex-end;
  background: var(--sky-600, #0284c7);
  color: white;
}

.agent-bubble.assistant {
  align-self: flex-start;
  background: var(--bg-surface-subtle, #f8fafc);
  border: 1px solid var(--border-subtle);
}

.caret {
  display: inline-block;
  width: 7px;
  height: 0.9em;
  margin-left: 2px;
  background: currentColor;
  vertical-align: text-bottom;
  animation: blink 1s steps(1) infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.change-log {
  max-height: 140px;
  overflow: auto;
  padding: 0 12px 8px;
}

.change-card {
  margin-top: 6px;
  padding: 8px;
  border-radius: 8px;
  background: var(--bg-surface-subtle, #f8fafc);
  border: 1px solid var(--border-subtle);
  font-size: 0.75rem;
}

.change-card header {
  justify-content: space-between;
  font-weight: 700;
}

.change-card p {
  margin: 4px 0 0;
}

.before {
  color: var(--rose-700, #be123c);
  text-decoration: line-through;
}

.after {
  color: var(--emerald-700, #047857);
  font-weight: 700;
}

.agent-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 12px 8px;
}

.agent-prompts button,
.agent-composer button {
  border: 1px solid var(--border-subtle);
  background: #ffffff;
  cursor: pointer;
}

.agent-prompts button {
  border-radius: 999px;
  font-size: 0.75rem;
  padding: 6px 10px;
}

.agent-composer {
  padding: 10px;
  border-top: 1px solid var(--border-subtle);
}

.agent-composer input {
  flex: 1;
  min-width: 0;
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 8px 10px;
  font: inherit;
}

.agent-composer button {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
