import clip07 from "./assets/demo/Ses01F_impro07.mp4";
import clip08 from "./assets/demo/Ses02F_impro08.mp4";
import clip01 from "./assets/demo/Ses01F_impro01.mp4";
import clip02 from "./assets/demo/Ses01F_impro02.mp4";

// clipKey MUST match DemoClipAnalyzer's _clipFiles keys in the backend exactly.
export interface DemoVideo {
  key: string;
  name: string;
  src: string;
}

export const VIDEO_LIB: Record<string, DemoVideo> = {
  Ses01F_impro07: { key: "Ses01F_impro07", name: "Ses01F_impro07 — excited", src: clip07 },
  Ses02F_impro08: { key: "Ses02F_impro08", name: "Ses02F_impro08 — neutral", src: clip08 },
  Ses01F_impro01: { key: "Ses01F_impro01", name: "Ses01F_impro01 — anger", src: clip01 },
  Ses01F_impro02: { key: "Ses01F_impro02", name: "Ses01F_impro02 — sadness", src: clip02 },
};

export const VIDEO_ORDER = ["Ses01F_impro07", "Ses02F_impro08", "Ses01F_impro01", "Ses01F_impro02"];

// Maps the backend's real emotion labels to display icon/color.
// Icons come from IconSprite.tsx — ic-angry, ic-smile, ic-meh-scared, ic-frown all exist there.
export const EMOTION_DISPLAY: Record<string, { icon: string; color: string; label: string }> = {
  anger: { icon: "ic-angry", color: "var(--danger)", label: "Angry" },
  frustration: { icon: "ic-angry", color: "var(--secondary)", label: "Frustrated" },
  excited: { icon: "ic-smile", color: "var(--accent)", label: "Excited" },
  neutral: { icon: "ic-meh-scared", color: "var(--gray)", label: "Neutral" },
  sadness: { icon: "ic-frown", color: "var(--primary)", label: "Sad" },
  happiness: { icon: "ic-smile", color: "var(--success)", label: "Happy" },
};

export function fmtTime(sec: number): string {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
