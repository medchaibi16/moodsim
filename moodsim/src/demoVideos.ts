export interface DemoVideo {
  key: string;
  name: string;
  duration: string;
  durationSec: number;
  demo: { tag: string; icon: string; color: string; conf: number };
  tlColors: string[];
}

export const VIDEO_LIB: Record<string, DemoVideo> = {
  marche: {
    key: "marche",
    name: "Morning_Park_Walk",
    duration: "04:12",
    durationSec: 252,
    demo: { tag: "Happy", icon: "ic-smile", color: "var(--success)", conf: 97 },
    tlColors: [
      "var(--success)",
      "var(--success)",
      "var(--primary)",
      "var(--success)",
      "var(--danger)",
      "var(--secondary)",
      "var(--success)",
      "var(--success)",
    ],
  },
  bureau: {
    key: "bureau",
    name: "Office_Interview_02",
    duration: "06:48",
    durationSec: 408,
    demo: { tag: "Neutral", icon: "ic-meh-scared", color: "var(--gray)", conf: 88 },
    tlColors: [
      "var(--secondary)",
      "var(--danger)",
      "var(--gray)",
      "var(--danger)",
      "var(--secondary)",
      "var(--gray)",
      "var(--danger)",
      "var(--gray)",
    ],
  },
  metro: {
    key: "metro",
    name: "Evening_Subway_Commute",
    duration: "03:21",
    durationSec: 201,
    demo: { tag: "Sad", icon: "ic-frown", color: "var(--primary)", conf: 91 },
    tlColors: [
      "var(--primary)",
      "var(--secondary)",
      "var(--primary)",
      "var(--danger)",
      "var(--primary)",
      "var(--primary)",
      "var(--secondary)",
      "var(--danger)",
    ],
  },
  sport: {
    key: "sport",
    name: "Gym_Workout_Session",
    duration: "05:56",
    durationSec: 356,
    demo: { tag: "Surprised", icon: "ic-smile", color: "var(--accent)", conf: 89 },
    tlColors: [
      "var(--accent)",
      "var(--success)",
      "var(--accent)",
      "var(--success)",
      "var(--secondary)",
      "var(--accent)",
      "var(--success)",
      "var(--accent)",
    ],
  },
};

export const VIDEO_ORDER = ["marche", "bureau", "metro", "sport"];

export const DEMO_EMOTIONS = [
  { tag: "Happy", icon: "ic-smile", color: "var(--success)" },
  { tag: "Neutral", icon: "ic-meh-scared", color: "var(--gray)" },
  { tag: "Sad", icon: "ic-frown", color: "var(--primary)" },
  { tag: "Surprised", icon: "ic-smile", color: "var(--accent)" },
];

export function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60)
    .toString()
    .padStart(2, "0");
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}
