<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Bot, Check, CheckCircle2, Send, ShieldAlert, X } from 'lucide-vue-next'
import { useCopilot } from '../composables/useCopilot'
import { usePonds } from '../composables/usePonds'

const emit = defineEmits(['close'])
const { messages, isThinking, sendMessage, authorizeAction, cancelAction } = useCopilot()
const { activePond } = usePonds()
const inputMessage = ref('')
const chatScroll = ref(null)
const showThinking = computed(() => isThinking.value && !messages.value.some((message) => message.streaming))

const scrollChat = async () => {
  await nextTick()
  if (chatScroll.value) chatScroll.value.scrollTop = chatScroll.value.scrollHeight
}

watch(messages, () => {
  scrollChat()
}, { deep: true })

const handleSend = () => {
  const text = inputMessage.value.trim()
  if (!text || isThinking.value) return
  inputMessage.value = ''
  sendMessage(text)
}

const handlePrompt = (text) => {
  if (isThinking.value) return
  sendMessage(text)
}

const handleClose = () => {
  emit('close')
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter') handleSend()
}

const formatText = (text) => {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}
</script>

<template>
  <aside id="agent-sidebar" class="agent-dock" aria-label="Agent chat">
    <header class="agent-dock-head">
      <Bot :size="18" aria-hidden="true" />
      <div>
        <h2>Agent</h2>
        <p>Same co-pilot. Approve before anything is recorded.</p>
      </div>
      <button type="button" class="agent-close" aria-label="Close agent sidebar" @click="handleClose">
        <X :size="16" aria-hidden="true" />
      </button>
    </header>

    <div ref="chatScroll" class="agent-messages">
      <article v-for="message in messages" :key="message.id" class="agent-bubble" :class="message.role">
        <p class="agent-meta">{{ message.senderName }} · {{ message.timestamp }}</p>
        <p>
          <span v-html="formatText(message.text)"></span><span v-if="message.streaming" class="caret" aria-hidden="true"></span>
        </p>

        <div
          v-if="message.actionCard"
          class="decision-card"
          :class="'decision-' + message.actionCard.status"
        >
          <header>
            <ShieldAlert :size="16" aria-hidden="true" />
            <strong>{{ message.actionCard.title || 'Needs your decision' }}</strong>
            <span>{{ message.actionCard.status === 'pending' ? 'Waiting' : (message.actionCard.status === 'approved' ? 'Recorded' : 'Rejected') }}</span>
          </header>
          <p>{{ message.actionCard.summary }}</p>
          <p class="decision-detail">{{ message.actionCard.targetDevice }}</p>
          <div v-if="message.actionCard.status === 'pending'" class="decision-actions">
            <button
              type="button"
              :disabled="message.actionCard.isSubmitting"
              :aria-label="'Approve ' + message.actionCard.targetDevice"
              @click="authorizeAction(message.actionCard)"
            >
              <Check :size="14" aria-hidden="true" />
              Approve
            </button>
            <button
              type="button"
              class="reject"
              :disabled="message.actionCard.isSubmitting"
              :aria-label="'Reject ' + message.actionCard.targetDevice"
              @click="cancelAction(message.actionCard)"
            >
              <X :size="14" aria-hidden="true" />
              Reject
            </button>
          </div>
          <p v-else-if="message.actionCard.status === 'approved'" class="decision-result">
            <CheckCircle2 :size="14" aria-hidden="true" />
            Recorded. {{ message.actionCard.resultNote || 'Simulated readings were updated.' }} No hardware command was sent.
          </p>
          <p v-else class="decision-result">Rejected. No hardware command was sent.</p>
        </div>
      </article>

      <p v-if="showThinking" class="thinking">The co-pilot is checking the pond readings.</p>
    </div>

    <div class="agent-prompts">
      <button type="button" :disabled="isThinking" @click="handlePrompt('Morning briefing')">Morning briefing</button>
      <button type="button" :disabled="isThinking" @click="handlePrompt('tambah molase kolam ' + activePond.id)">Molasses dose</button>
      <button type="button" :disabled="isThinking" @click="handlePrompt('nyalakan aerator kolam ' + activePond.id + ' 2 jam')">Start aerator</button>
    </div>

    <form class="agent-composer" @submit.prevent="handleSend">
      <label class="sr-only" for="agent-input">Message the agent</label>
      <input
        id="agent-input"
        v-model="inputMessage"
        type="text"
        placeholder="Ask for a dose or an aerator..."
        :disabled="isThinking"
        @keydown="handleKeyDown"
      />
      <button type="submit" :disabled="!inputMessage.trim() || isThinking" aria-label="Send to agent">
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
  box-shadow: -8px 0 24px rgba(15, 23, 42, 0.08);
}

.agent-dock-head,
.agent-composer,
.decision-card header,
.decision-actions,
.decision-result {
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
  max-width: 100%;
  padding: 8px 10px;
  border-radius: 10px;
  font-size: 0.84rem;
  line-height: 1.4;
}

.agent-bubble p {
  margin: 0;
}

.agent-meta {
  margin-bottom: 4px;
  color: var(--text-muted);
  font-size: 0.7rem;
}

.agent-bubble.user {
  align-self: flex-end;
  background: var(--sky-600, #0284c7);
  color: white;
}

.agent-bubble.user .agent-meta {
  color: rgba(255, 255, 255, 0.8);
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

.thinking {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.decision-card {
  margin-top: 8px;
  padding: 8px;
  border-radius: 8px;
  border: 1px solid var(--border-medium);
  background: #ffffff;
}

.decision-card header {
  justify-content: flex-start;
}

.decision-card header span {
  margin-left: auto;
  font-size: 0.7rem;
  font-weight: 700;
}

.decision-pending header span { color: var(--amber-700, #b45309); }
.decision-approved header span { color: var(--emerald-700, #047857); }
.decision-cancelled header span { color: var(--rose-700, #be123c); }

.decision-card > p,
.decision-detail,
.decision-result {
  margin: 6px 0 0;
  font-size: 0.78rem;
}

.decision-detail {
  color: var(--text-muted);
}

.decision-actions {
  margin-top: 8px;
}

.decision-actions button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 32px;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid var(--emerald-600, #059669);
  background: var(--emerald-600, #059669);
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.decision-actions button.reject {
  border-color: var(--border-medium);
  background: #ffffff;
  color: var(--text-primary);
}

.decision-actions button:disabled {
  opacity: 0.6;
  cursor: wait;
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

.agent-prompts button:disabled {
  opacity: 0.6;
  cursor: wait;
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
