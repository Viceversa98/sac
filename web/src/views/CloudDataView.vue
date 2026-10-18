<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { Database, RefreshCw, ScrollText } from 'lucide-vue-next'
import PageIntro from '../components/PageIntro.vue'
import { apiUrl } from '../api'

const ponds = ref([])
const toolCalls = ref([])
const events = ref([])
const sqlStatus = ref('checking')
const sqlMessage = ref('')
const firestoreStatus = ref('checking')
const firestoreMessage = ref('')
const checkedAt = ref('')
const isRefreshing = ref(false)

let timer = 0

const readError = async (response) => {
  try {
    const body = await response.json()
    return body.message || body.error || `Request failed (${response.status})`
  } catch {
    return `Request failed (${response.status})`
  }
}

const loadSql = async () => {
  const [pondsResponse, callsResponse] = await Promise.all([
    fetch(apiUrl('/api/ponds'), { headers: { Accept: 'application/json' } }),
    fetch(apiUrl('/api/tool-calls'), { headers: { Accept: 'application/json' } })
  ])
  if (!pondsResponse.ok || !callsResponse.ok) {
    const failed = !pondsResponse.ok ? pondsResponse : callsResponse
    throw new Error(await readError(failed))
  }
  const pondBody = await pondsResponse.json()
  const callBody = await callsResponse.json()
  ponds.value = pondBody.ponds || []
  toolCalls.value = callBody.tool_calls || []
  sqlStatus.value = 'up'
  sqlMessage.value = `${ponds.value.length} ponds, ${toolCalls.value.length} proposals`
}

const loadFirestore = async () => {
  const response = await fetch(apiUrl('/api/audit-events'), { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(await readError(response))
  const body = await response.json()
  events.value = body.events || []
  firestoreStatus.value = 'up'
  firestoreMessage.value = `${events.value.length} events in audit_events`
}

const handleRefresh = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  const sqlTask = loadSql().catch((error) => {
    ponds.value = []
    toolCalls.value = []
    sqlStatus.value = 'down'
    sqlMessage.value = error instanceof Error ? error.message : 'Cloud SQL is unavailable'
  })
  const firestoreTask = loadFirestore().catch((error) => {
    events.value = []
    firestoreStatus.value = 'down'
    firestoreMessage.value = error instanceof Error ? error.message : 'Firestore is unavailable'
  })
  await Promise.all([sqlTask, firestoreTask])
  checkedAt.value = new Date().toLocaleString()
  isRefreshing.value = false
}

const readingCount = (pond) => pond.stats?.count ?? 0

const actorLabel = (actor) => {
  if (!actor || typeof actor !== 'object') return '—'
  if (actor.role) return `${actor.role}`
  if (actor.agent) return actor.agent
  return '—'
}

onMounted(() => {
  handleRefresh()
  timer = window.setInterval(handleRefresh, 20000)
})

onUnmounted(() => {
  window.clearInterval(timer)
})
</script>

<template>
  <div class="cloud-data">
    <div class="view-header">
      <PageIntro
        title="Cloud data"
        purpose="Live rows from Cloud SQL and the Firestore approval log. This page reads the API. It does not change ponds or hardware."
        :status="checkedAt ? `Last check ${checkedAt}` : 'Checking the API…'"
      />
      <button
        type="button"
        class="refresh-btn"
        :disabled="isRefreshing"
        aria-label="Refresh Cloud SQL and Firestore"
        @click="handleRefresh"
      >
        <RefreshCw :size="16" aria-hidden="true" :class="{ spinning: isRefreshing }" />
        <span>Refresh</span>
      </button>
    </div>

    <div class="status-grid" aria-live="polite">
      <article class="status-card">
        <div class="status-icon sql" aria-hidden="true">
          <Database :size="18" />
        </div>
        <div>
          <h2>Cloud SQL</h2>
          <p :class="sqlStatus">{{ sqlMessage || 'Waiting for MySQL' }}</p>
        </div>
      </article>
      <article class="status-card">
        <div class="status-icon firestore" aria-hidden="true">
          <ScrollText :size="18" />
        </div>
        <div>
          <h2>Firestore</h2>
          <p :class="firestoreStatus">{{ firestoreMessage || 'Waiting for the approval log' }}</p>
        </div>
      </article>
    </div>

    <section class="panel" aria-labelledby="ponds-heading">
      <h2 id="ponds-heading">Ponds in MySQL</h2>
      <p v-if="sqlStatus === 'down'" class="empty">Cloud SQL did not respond.</p>
      <p v-else-if="ponds.length === 0" class="empty">No pond rows yet.</p>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Pond</th>
              <th scope="col">Name</th>
              <th scope="col">Volume</th>
              <th scope="col">Readings</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pond in ponds" :key="pond.id">
              <td>{{ pond.id }}</td>
              <td>{{ pond.name }}</td>
              <td>{{ pond.volume_m3 }} m³</td>
              <td>{{ readingCount(pond) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel" aria-labelledby="calls-heading">
      <h2 id="calls-heading">Proposals in MySQL</h2>
      <p v-if="sqlStatus === 'down'" class="empty">Cloud SQL did not respond.</p>
      <p v-else-if="toolCalls.length === 0" class="empty">No proposals yet.</p>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Id</th>
              <th scope="col">Pond</th>
              <th scope="col">Tool</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="call in toolCalls" :key="call.id">
              <td>{{ call.id }}</td>
              <td>{{ call.pond_id }}</td>
              <td>{{ call.tool_name }}</td>
              <td>{{ call.status }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="panel" aria-labelledby="events-heading">
      <h2 id="events-heading">Firestore audit_events</h2>
      <p v-if="firestoreStatus === 'down'" class="empty">{{ firestoreMessage }}</p>
      <p v-else-if="events.length === 0" class="empty">The log is connected and has no visible events yet.</p>
      <div v-else class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">When</th>
              <th scope="col">Event</th>
              <th scope="col">Pond</th>
              <th scope="col">Actor</th>
              <th scope="col">Note</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="event in events" :key="event.id">
              <td>{{ event.recorded_at || '—' }}</td>
              <td>{{ event.event || '—' }}</td>
              <td>{{ event.pond_id || '—' }}</td>
              <td>{{ actorLabel(event.actor) }}</td>
              <td>{{ event.note || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
.cloud-data {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.view-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border-medium);
  background: var(--bg-card);
  color: var(--text-primary);
  border-radius: 8px;
  padding: 8px 12px;
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  font-weight: 600;
  cursor: pointer;
}

.refresh-btn:disabled {
  cursor: progress;
  opacity: 0.7;
}

.spinning {
  animation: spin 0.8s linear infinite;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.status-card {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 16px;
}

.status-card h2,
.panel h2 {
  margin: 0 0 4px;
  font-size: var(--text-md);
  color: var(--text-primary);
}

.status-card p,
.empty {
  margin: 0;
  color: var(--text-secondary);
  font-size: var(--text-sm);
}

.status-card p.up {
  color: var(--emerald-700);
  font-weight: 600;
}

.status-card p.down {
  color: var(--rose-700);
  font-weight: 600;
}

.status-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.status-icon.sql {
  background: var(--sky-100);
  color: var(--sky-700);
}

.status-icon.firestore {
  background: var(--amber-100);
  color: var(--amber-800);
}

.panel {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 16px;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--text-sm);
}

th,
td {
  text-align: left;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border-subtle);
  color: var(--text-primary);
  white-space: nowrap;
}

th {
  color: var(--text-muted);
  font-weight: 600;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .view-header,
  .status-grid {
    display: flex;
    flex-direction: column;
  }
}
</style>
