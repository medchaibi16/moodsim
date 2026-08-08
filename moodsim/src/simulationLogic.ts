import type { ClipDistribution } from "./clipsData";

/* ============================================================
   Shared Day Builder types & catalogue
============================================================ */
export interface ActivityDef {
  id: string;
  name: string;
  icon: string;
  duration: number;
}

export const AVAILABLE_EVENTS: ActivityDef[] = [
  { id: "work", name: "Work (Focus)", icon: "💻", duration: 120 },
  { id: "break", name: "Break", icon: "☕", duration: 15 },
  { id: "cook", name: "Cook", icon: "🍳", duration: 45 },
  { id: "eat", name: "Eat", icon: "🍽️", duration: 30 },
  { id: "watch_tv", name: "Watch TV", icon: "📺", duration: 90 },
  { id: "exercise", name: "Exercise", icon: "🏋️", duration: 45 },
  { id: "read", name: "Read", icon: "📖", duration: 60 },
  { id: "nap", name: "Nap", icon: "😴", duration: 60 },
  { id: "clean", name: "Clean", icon: "🧹", duration: 30 },
  { id: "gaming", name: "Gaming", icon: "🎮", duration: 90 },
  { id: "phone_scroll", name: "Phone Scrolling", icon: "📱", duration: 30 },
  { id: "talk_phone", name: "Talk on Phone", icon: "📞", duration: 20 },
  { id: "walk", name: "Walk", icon: "🚶", duration: 15 },
  { id: "get_ready", name: "Get Ready", icon: "🚿", duration: 30 },
  { id: "relax", name: "Relax", icon: "🛋️", duration: 60 },
  { id: "socialize", name: "Socialize", icon: "🗣️", duration: 60 },
  { id: "argue", name: "Argue", icon: "💢", duration: 15 },
  { id: "late_work", name: "Late Night Work", icon: "🌙", duration: 90 },
  { id: "feel_sick", name: "Feel Sick", icon: "🤒", duration: 120 },
  { id: "celebrate", name: "Celebrate", icon: "🎉", duration: 60 },
];

export interface ClipData {
  totalClips: number;
  duration: number;
  avgConfidence: number;
  distribution: ClipDistribution;
  filename: string;
  dominantEmotion: string;
}

export interface DayEvent {
  id: number;
  activityId: string;
  activityName: string;
  activityIcon: string;
  duration: number;
  isClip: boolean;
  clipData?: ClipData;
}

export function formatHour(h: number): string {
  if (h === 0) return "12:00 AM";
  if (h < 12) return `${h}:00 AM`;
  if (h === 12) return "12:00 PM";
  return `${h - 12}:00 PM`;
}

/* ============================================================
   Simulation scoring — derived from the actual built day
   (activities + emotional clips) rather than a static form.
============================================================ */
const ACTIVITY_WEIGHTS: Record<string, number> = {
  work: -2,
  late_work: -6,
  break: 1,
  cook: 1,
  eat: 1.5,
  watch_tv: -1,
  exercise: 7,
  read: 3,
  nap: 3,
  clean: 0.5,
  gaming: -1.5,
  phone_scroll: -2,
  talk_phone: 1,
  walk: 4,
  get_ready: 0.5,
  relax: 4,
  socialize: 6,
  argue: -9,
  feel_sick: -11,
  celebrate: 7,
};

const CLIP_WEIGHTS: Record<string, number> = {
  happiness: 8,
  excited: 6,
  neutral: 0,
  sadness: -7,
  anger: -9,
  frustration: -5,
};

type Category = "Work" | "Rest" | "Movement" | "Social" | "Screen time" | "Chores" | "Stress" | "Emotional clips";

const CATEGORY_MAP: Record<string, Category> = {
  work: "Work",
  late_work: "Work",
  break: "Rest",
  nap: "Rest",
  relax: "Rest",
  read: "Rest",
  exercise: "Movement",
  walk: "Movement",
  socialize: "Social",
  celebrate: "Social",
  talk_phone: "Social",
  watch_tv: "Screen time",
  gaming: "Screen time",
  phone_scroll: "Screen time",
  cook: "Chores",
  eat: "Chores",
  clean: "Chores",
  get_ready: "Chores",
  argue: "Stress",
  feel_sick: "Stress",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  Work: "var(--primary)",
  Rest: "var(--warn)",
  Movement: "var(--success)",
  Social: "var(--accent)",
  "Screen time": "var(--gray)",
  Chores: "var(--secondary)",
  Stress: "var(--danger)",
  "Emotional clips": "#9C27B0",
};

const CATEGORY_ORDER: Category[] = ["Work", "Rest", "Movement", "Social", "Chores", "Screen time", "Stress", "Emotional clips"];

export interface SimResult {
  score: number;
  riskLevel: "low" | "med" | "high";
  riskLabel: string;
  note: string;
  recommendations: { icon: string; title: string; text: string }[];
  summary: { label: string; value: string }[];
  factors: { label: string; value: number; color: string }[];
  timeline: { color: string; time: string; label: string; text: string }[];
  totalMin: number;
  usedMin: number;
  eventCount: number;
  clipCount: number;
}

function clamp(min: number, max: number, v: number) {
  return Math.max(min, Math.min(max, v));
}

function riskFromScore(score: number): { level: "low" | "med" | "high"; label: string } {
  if (score >= 65) return { level: "low", label: "Low risk" };
  if (score >= 40) return { level: "med", label: "Moderate risk" };
  return { level: "high", label: "High risk" };
}

export function computeSimulationResult(events: DayEvent[], start: number, end: number): SimResult {
  const totalMin = Math.max(60, (end - start) * 60);
  const usedMin = events.reduce((sum, e) => sum + e.duration, 0);

  let score = 50;
  events.forEach((ev) => {
    if (ev.isClip && ev.clipData) {
      score += CLIP_WEIGHTS[ev.clipData.dominantEmotion] ?? 0;
    } else {
      score += ACTIVITY_WEIGHTS[ev.activityId] ?? 0;
    }
  });
  score = clamp(4, 97, Math.round(score));

  const risk = riskFromScore(score);
  const note =
    score >= 65
      ? "A well-balanced day, stable mood expected."
      : score >= 40
      ? "A mixed day — a few tension factors identified."
      : "A difficult day — several risk factors piled up.";

  // Recommendations, derived from which categories are present or missing
  const hasCategory = (c: Category) =>
    events.some((e) => (e.isClip ? c === "Emotional clips" : CATEGORY_MAP[e.activityId] === c));
  const negativeClips = events.filter(
    (e) => e.isClip && e.clipData && ["anger", "sadness", "frustration"].includes(e.clipData.dominantEmotion)
  );
  const workEvents = events.filter((e) => !e.isClip && (e.activityId === "work" || e.activityId === "late_work"));

  const recommendations: SimResult["recommendations"] = [];
  if (events.some((e) => !e.isClip && (e.activityId === "argue" || e.activityId === "feel_sick"))) {
    recommendations.push({
      icon: "ic-activity",
      title: "Address stress and health",
      text: "Conflict or illness in your day weighs heavily on emotional stability.",
    });
  }
  if (!hasCategory("Movement")) {
    recommendations.push({
      icon: "ic-cpu",
      title: "Add some movement",
      text: "No exercise or walking in this day — even a short walk measurably improves the score.",
    });
  }
  if (workEvents.length >= 3) {
    recommendations.push({
      icon: "ic-clock",
      title: "Add breaks between work sessions",
      text: `${workEvents.length} work blocks in a row can build up fatigue — space them out with breaks.`,
    });
  }
  if (!hasCategory("Social")) {
    recommendations.push({
      icon: "ic-user",
      title: "Strengthen social ties",
      text: "Social isolation is one of the factors most correlated with a low score.",
    });
  }
  if (negativeClips.length > 0) {
    recommendations.push({
      icon: "ic-frown",
      title: "Process the emotional triggers",
      text: `${negativeClips.length} clip${negativeClips.length !== 1 ? "s" : ""} in your day skew toward ${negativeClips[0].clipData?.dominantEmotion} — consider a recovery activity afterward.`,
    });
  }
  if (events.length === 0) {
    recommendations.push({
      icon: "ic-info",
      title: "No events added yet",
      text: "Build your day in the Day Builder to get personalized recommendations.",
    });
  } else if (recommendations.length === 0) {
    recommendations.push({
      icon: "ic-check",
      title: "Well-balanced scenario",
      text: "No major risk factor detected in this simulated day.",
    });
  }

  // Summary
  const clipEvents = events.filter((e) => e.isClip);
  const dominantClipCounts: Record<string, number> = {};
  clipEvents.forEach((e) => {
    const d = e.clipData?.dominantEmotion;
    if (d) dominantClipCounts[d] = (dominantClipCounts[d] ?? 0) + 1;
  });
  const topClipEmotion = Object.entries(dominantClipCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const finalMood = score >= 65 ? "Positive" : score >= 40 ? "Neutral" : "Negative";

  const summary: SimResult["summary"] = [
    { label: "Events planned", value: String(events.length) },
    { label: "Emotional clips", value: String(clipEvents.length) },
    { label: "Time used", value: `${usedMin} / ${totalMin} min` },
    { label: "Dominant clip emotion", value: topClipEmotion ? topClipEmotion : "—" },
    { label: "Final mood", value: finalMood },
  ];

  // Factors: share of the day spent per category
  const categoryMinutes: Record<Category, number> = {
    Work: 0,
    Rest: 0,
    Movement: 0,
    Social: 0,
    "Screen time": 0,
    Chores: 0,
    Stress: 0,
    "Emotional clips": 0,
  };
  events.forEach((e) => {
    const cat = e.isClip ? "Emotional clips" : CATEGORY_MAP[e.activityId];
    if (cat) categoryMinutes[cat] += e.duration;
  });
  const factors: SimResult["factors"] = CATEGORY_ORDER.map((cat) => ({
    label: cat,
    value: usedMin ? Math.round((categoryMinutes[cat] / usedMin) * 100) : 0,
    color: CATEGORY_COLORS[cat],
  })).filter((f) => f.value > 0);

  // Timeline: walk through events in order, tracking time-of-day
  let cursor = start * 60;
  const timeline: SimResult["timeline"] = [
    {
      color: "var(--primary)",
      time: formatHour(start),
      label: "Day starts",
      text: "baseline mood.",
    },
  ];
  events.forEach((e) => {
    const h = Math.floor(cursor / 60) % 24;
    const m = cursor % 60;
    const label = `${h}:${String(m).padStart(2, "0")}`;
    const color = e.isClip && e.clipData ? CATEGORY_COLORS["Emotional clips"] : CATEGORY_COLORS[CATEGORY_MAP[e.activityId]] || "var(--gray)";
    const text = e.isClip
      ? `clip leaning ${e.clipData?.dominantEmotion}.`
      : `${e.duration} min.`;
    timeline.push({ color, time: label, label: e.activityName, text });
    cursor += e.duration;
  });
  timeline.push({
    color: score >= 65 ? "var(--success)" : "var(--danger)",
    time: formatHour(Math.min(27, end)),
    label: score >= 65 ? "Stable end of day" : "Tense end of day",
    text: score >= 65 ? "good emotional recovery." : "incomplete recovery.",
  });

  return {
    score,
    riskLevel: risk.level,
    riskLabel: risk.label,
    note,
    recommendations: recommendations.slice(0, 4),
    summary,
    factors,
    timeline,
    totalMin,
    usedMin,
    eventCount: events.length,
    clipCount: clipEvents.length,
  };
}
