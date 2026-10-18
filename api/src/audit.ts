import { FieldValue, Firestore } from '@google-cloud/firestore';

let firestore: Firestore | undefined;

const collectionName = (): string => process.env.FIRESTORE_COLLECTION || 'audit_events';

// WHY: a named database is not (default). The client only opens (default) when databaseId is omitted.
const databaseId = (): string => process.env.FIRESTORE_DATABASE_ID || 'sampay-firestore';

// WHY: server ADC only. firebase rules deny every client read and write.
const client = (): Firestore => {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  if (!projectId) {
    throw new Error(
      'GOOGLE_CLOUD_PROJECT is not set. Firestore audit_events uses Application Default Credentials. There is no key file in this repo.',
    );
  }
  if (!firestore) firestore = new Firestore({ projectId, databaseId: databaseId() });
  return firestore;
};

export type AuditEventInput = {
  tool_call_id?: number | null;
  pond_id?: string | null;
  event: 'proposed' | 'blocked' | 'refused' | 'approved' | 'rejected' | 'executed_simulated' | 'demo_reset' | 'diag';
  tool_name?: string | null;
  args?: unknown;
  safety_result?: unknown;
  citations?: unknown;
  actor: { user_id: number; role: string } | { agent: string; model?: string | null; prompt_id?: string | null };
  note?: string;
};

export type AuditWriteResult = { id: string | null; audit_sync: 'ok' | 'pending' };

const writeOnce = async (event: AuditEventInput): Promise<string> => {
  const ref = await client().collection(collectionName()).add({
    tool_call_id: event.tool_call_id ?? null,
    pond_id: event.pond_id ?? null,
    event: event.event,
    tool_name: event.tool_name ?? null,
    args: event.args ?? null,
    safety_result: event.safety_result ?? null,
    citations: event.citations ?? null,
    actor: event.actor,
    note: event.note ?? null,
    simulated: true,
    created_at: FieldValue.serverTimestamp(),
    recorded_at: new Date().toISOString(),
  });
  return ref.id;
};

// WHY: MySQL already committed. Retry the log once, then surface audit sync pending. Do not roll back the decision.
export const appendAudit = async (event: AuditEventInput): Promise<AuditWriteResult> => {
  try {
    return { id: await writeOnce(event), audit_sync: 'ok' };
  } catch (err) {
    console.error('firestore audit failed, retrying once', err instanceof Error ? err.message : err);
    try {
      return { id: await writeOnce(event), audit_sync: 'ok' };
    } catch (retryErr) {
      console.error('audit sync pending', retryErr instanceof Error ? retryErr.message : retryErr);
      return { id: null, audit_sync: 'pending' };
    }
  }
};

export type AuditDoc = { id: string; recorded_at?: string; event?: string; [key: string]: unknown };

export const listAuditEvents = async (limit: number): Promise<AuditDoc[]> => {
  const snap = await client().collection(collectionName()).orderBy('recorded_at', 'desc').limit(200).get();
  const docs: AuditDoc[] = snap.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return { id: doc.id, ...data, recorded_at: typeof data.recorded_at === 'string' ? data.recorded_at : undefined };
  });
  const resetAt = docs
    .filter((doc) => doc.event === 'demo_reset' && doc.recorded_at)
    .map((doc) => doc.recorded_at as string)
    .sort()
    .at(-1);
  const visible = docs.filter((doc) => {
    if (doc.event === 'diag' || doc.event === 'demo_reset') return false;
    if (resetAt && doc.recorded_at && doc.recorded_at <= resetAt) return false;
    return true;
  });
  return visible.slice(0, limit);
};
