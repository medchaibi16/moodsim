import type { BackendSensorData } from "./api";

// Default sensor signature per activityId. Without this, every event posted to
// the backend has Sensors: null — and since the backend resets sensors to all-
// false/zero for any event without explicit sensor data, the ActivityGuesser
// (layer 2) has nothing to reason over: no "Laptop's on" -> "Clearly working",
// just weak fallbacks driven by room/posture/time-of-day priors alone.
//
// Values reconstructed from real validated test scenarios (not guessed) — e.g.
// "Work (Focus)" reliably produced laptopOn: true -> "Clearly working" with a
// concrete reasoning trace; "Phone Scrolling" -> phoneActive: true, etc.
export const SENSOR_DEFAULTS: Record<string, BackendSensorData> = {
  work: { laptopOn: true },
  late_work: { laptopOn: true },
  watch_tv: { tvOn: true },
  gaming: { tvOn: true }, // no dedicated "gaming" category in the backend guesser yet — reads as watching TV
  phone_scroll: { phoneActive: true },
  talk_phone: { phoneActive: true, voiceIntensity: 0.4 },
  argue: { voiceIntensity: 0.85 },
  exercise: { walkingSpeed: 0.8 },
  walk: { walkingSpeed: 0.75 },
  celebrate: { voiceIntensity: 0.5 },
  // Everything else (break, cook, eat, read, nap, clean, get_ready, relax,
  // socialize, feel_sick) has no strong sensor signature in the current model —
  // left as all-false/zero, so the guesser falls back to room/posture/time-of-day.
};

export function getSensorsForActivity(activityId: string): BackendSensorData | undefined {
  return SENSOR_DEFAULTS[activityId];
}
