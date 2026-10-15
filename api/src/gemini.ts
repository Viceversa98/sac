import { GoogleGenAI, Type, type FunctionDeclaration, type GenerateContentResponse } from '@google/genai';
import { fallbackProposal, fallbackRefusal, promptA, promptB, promptC, promptD } from './prompts.js';
import type { SafetyResult } from './safety.js';

let client: GoogleGenAI | undefined;

// WHY enterprise:true: Agent Platform (aiplatform.googleapis.com) with ADC. The constructor must not take a key.
export const getAi = (): GoogleGenAI => {
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!project) {
    throw new Error(
      'GOOGLE_CLOUD_PROJECT is not set. Gemini runs on Agent Platform with Application Default Credentials. There is no API key.',
    );
  }
  if (!client) {
    client = new GoogleGenAI({
      enterprise: true,
      project,
      location: process.env.GOOGLE_CLOUD_LOCATION || 'global',
    });
  }
  return client;
};

const modelName = (): string => process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const liteModel = (): string => process.env.GEMINI_MODEL_LITE || 'gemini-3.1-flash-lite';

const toolDeclarations: FunctionDeclaration[] = [
  {
    name: 'start_aerator',
    description: 'Propose starting the aerator. Does not control hardware. Duration must be 15 to 240 minutes.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        pond_id: { type: Type.STRING },
        duration_min: { type: Type.INTEGER },
        reason: { type: Type.STRING },
      },
      required: ['pond_id', 'duration_min', 'reason'],
    },
  },
  {
    name: 'set_feeder_kg',
    description: 'Propose a feeder amount in kg. Does not control hardware. Must not exceed the pond max_feed_kg.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        pond_id: { type: Type.STRING },
        kg: { type: Type.NUMBER },
        meal: { type: Type.STRING, enum: ['pagi', 'siang', 'sore'] },
        reason: { type: Type.STRING },
      },
      required: ['pond_id', 'kg', 'meal', 'reason'],
    },
  },
  {
    name: 'dose_molasses_gL',
    description: 'Propose a molasses dose in g/L using the g_per_L already computed by Node. Do not calculate the dose.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        pond_id: { type: Type.STRING },
        g_per_L: { type: Type.NUMBER },
        tan_mgL_basis: { type: Type.NUMBER },
        reason: { type: Type.STRING },
      },
      required: ['pond_id', 'g_per_L', 'tan_mgL_basis', 'reason'],
    },
  },
];

const isRetriable = (err: unknown): boolean => /503|429|UNAVAILABLE|RESOURCE_EXHAUSTED/.test(String(err));

const generate = async (options: {
  model: string;
  prompt: string;
  temperature: number;
  tools?: boolean;
}): Promise<GenerateContentResponse> => {
  const run = () =>
    getAi().models.generateContent({
      model: options.model,
      contents: options.prompt,
      config: {
        temperature: options.temperature,
        ...(options.tools ? { tools: [{ functionDeclarations: toolDeclarations }] } : {}),
      },
    });
  try {
    return await run();
  } catch (err) {
    if (!isRetriable(err)) throw err;
    await new Promise((resolve) => setTimeout(resolve, 400));
    return run();
  }
};

export const diagPing = async (): Promise<{ model: string; text: string }> => {
  const response = await generate({ model: modelName(), prompt: 'reply OK', temperature: 0 });
  return { model: modelName(), text: response.text ?? '' };
};

export const parseIntentText = async (message: string): Promise<string> => {
  const response = await generate({ model: liteModel(), prompt: promptB(message), temperature: 0 });
  return response.text ?? '';
};

export const writeBriefing = async (
  lang: 'id' | 'en',
  statsJson: unknown,
  sopJson: unknown,
  dosesJson: unknown,
): Promise<{ text: string; model: string }> => {
  const response = await generate({
    model: modelName(),
    prompt: promptA(lang, statsJson, sopJson, dosesJson),
    temperature: 0.2,
    tools: true,
  });
  return { text: response.text?.trim() || '', model: modelName() };
};

export const writeProposalReason = async (
  intentJson: unknown,
  telemetryJson: unknown,
  sopJson: unknown,
  nodeArgs: unknown,
  safety: SafetyResult,
): Promise<{ text: string; model: string | null }> => {
  try {
    const response = await generate({
      model: modelName(),
      prompt: promptC(intentJson, telemetryJson, sopJson, nodeArgs),
      temperature: 0,
      tools: true,
    });
    return { text: response.text?.trim() || fallbackProposal(safety), model: modelName() };
  } catch {
    return { text: fallbackProposal(safety), model: null };
  }
};

export const writeRefusal = async (
  lang: 'id' | 'en',
  safety: SafetyResult,
): Promise<{ text: string; model: string | null }> => {
  try {
    const response = await generate({
      model: modelName(),
      prompt: promptD(lang, safety),
      temperature: 0,
    });
    return { text: response.text?.trim() || fallbackRefusal(lang, safety), model: modelName() };
  } catch {
    return { text: fallbackRefusal(lang, safety), model: null };
  }
};
