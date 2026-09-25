// API client for MoodSimBackend. This replaces the local, fake computation that
// used to live in simulationLogic.ts's computeSimulationResult() — every result
// now comes from the real 5-layer backend (Bayesian activity guesser, reasoning
// traces, day narrative, current-emotion resolver, house commands).
//
// NOTE ON STACK DIFFERENCE: this is a Vite project, not Create React App, so
// `process.env.REACT_APP_API_URL` (used in the old frontend's api.js) doesn't
// work here — Vite uses `import.meta.env.VITE_*`. To override the API base,
// create a `.env` file in the project root with: VITE_API_URL=http://localhost:5000/api
const API_BASE = (import.meta as unknown as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL
  ?? "http://localhost:5000/api";

/* ============================================================
   Shared types — mirror the backend's camelCased JSON responses
============================================================ */
export interface GoalOrConcern {
  name: string;
  importance?: number;
  relevance?: number;
  [key: string]: unknown;
}

export interface BackendCharacter {
  name: string;
  description: string;
  openness: number;
  conscientiousness: number;
  extraversion: number;
  agreeableness: number;
  neuroticism: number;
  baselinePleasure: number;
  baselineArousal: number;
  baselineDominance: number;
  goals: GoalOrConcern[];
  concerns: GoalOrConcern[];
  [key: string]: unknown; // memory, currentState, emotionalHistory — backend-managed, passthrough only
}

export interface BackendSensorData {
  tvOn?: boolean;
  laptopOn?: boolean;
  phoneActive?: boolean;
  voiceIntensity?: number;
  walkingSpeed?: number;
  doorSlamDetected?: boolean;
  doorSlamIntensity?: number;
}

export interface BackendClipData {
  totalClips: number;
  duration: number;
  avgConfidence: number;
  distribution: Record<string, number>;
  filename: string;
  dominantEmotion: string;
}

export interface BackendSimulationEvent {
  id: string;
  name: string;
  icon: string;
  duration: number;
  isClip: boolean;
  clipData?: BackendClipData;
  activityId: string;
  sensors?: BackendSensorData;
}

export interface ReasoningBeat {
  type: "perception" | "hypothesis" | "conclusion";
  text: string;
}

export interface SimLogEntry {
  time: string; // ISO datetime — see formatLogTime() below
  eventName: string;
  duration: number;
  room: string;
  posture: string;
  emotion: string;
  confidence: number;
  isClip: boolean;
  clipFilename: string | null;
  distribution: Record<string, number>;
  guessedActivity: string;
  guessedActivityConfidence: number;
  sensors: BackendSensorData | null;
  reasoning: ReasoningBeat[] | null; // null for clip events
}

export interface CurrentEmotionResult {
  emotion: string;
  confidence: number;
  margin: number;
  voteBreakdown: Record<string, number>;
}

export interface IotCommand {
  device: string;
  action: string;
  parameters: Record<string, unknown>;
  reason: string;
}

export interface MovementRecord {
  time: string;
  durationMinutes: number;
  x: number;
  y: number;
  room: string;
  posture: string;
}

export interface ActionRecord {
  time: string;
  durationMinutes: number;
  activityId: string;
  label: string;
  isClip: boolean;
  emotion: string;
  emotionConfidence: number;
}

export interface StartSimulationRequest {
  startHour: number;
  endHour: number;
  events: BackendSimulationEvent[];
  character?: BackendCharacter;
}

export interface StartSimulationResponse {
  success: boolean;
  totalEvents: number;
  startTime: string;
  endTime: string;
  character: BackendCharacter;
  log: SimLogEntry[];
  daySummary: string;
  currentEmotion: CurrentEmotionResult;
  houseCommands: IotCommand[];
  movements: MovementRecord[];
  actions: ActionRecord[];
}

/* ============================================================
   Helpers
============================================================ */
// SimLogEntry.time (and movement/action .time) comes through as a full ISO
// datetime from /start (System.Text.Json default), NOT the "HH:mm" string the
// saved-file endpoints use — format it here rather than touching backend
// serialization further.
export function formatLogTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso; // already "HH:mm" or unparseable — show as-is
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

async function handleJson<T>(res: Response, what: string): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${what} failed (${res.status}): ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

/* ============================================================
   API calls
============================================================ */
export async function getDefaultCharacter(): Promise<BackendCharacter> {
  const res = await fetch(`${API_BASE}/character/default`);
  return handleJson<BackendCharacter>(res, "Loading default character");
}

export async function resetCharacter(): Promise<BackendCharacter> {
  const res = await fetch(`${API_BASE}/character/reset`, { method: "POST" });
  return handleJson<BackendCharacter>(res, "Resetting character");
}

export async function startSimulation(request: StartSimulationRequest): Promise<StartSimulationResponse> {
  const res = await fetch(`${API_BASE}/simulation/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  return handleJson<StartSimulationResponse>(res, "Running simulation");
}

/* ============================================================
   Live Demo — real per-window emotion analysis
============================================================ */
export interface DemoClipInfo {
  key: string;
  filename: string;
  durationSeconds: number;
  windowCount: number;
}

export interface WindowAnalysisResponse {
  success: boolean;
  emotion: string;
  confidence: number;
  audioEmotion: string;
  faceEmotion: string;
  distribution: Record<string, number>;
}

export async function getDemoClips(): Promise<DemoClipInfo[]> {
  const res = await fetch(`${API_BASE}/emotion/clips`);
  const data = await handleJson<{ success: boolean; clips: DemoClipInfo[] }>(res, "Loading demo clips");
  return data.clips;
}

export async function analyzeWindow(clipKey: string, windowIndex: number): Promise<WindowAnalysisResponse> {
  const res = await fetch(`${API_BASE}/emotion/window`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clipKey, windowIndex }),
  });
  return handleJson<WindowAnalysisResponse>(res, "Analyzing window");
}
