import { useEffect, useRef, useState } from "react";
import { AVAILABLE_EVENTS } from "./simulationLogic";
import { getEmotionColor } from "./clipsData";
import type { MovementRecord, ActionRecord } from "./api";

const SCALE = 56; // px per backend grid unit
const GRID_SIZE = 9; // MoodSimBackend's RoomMap.cs spans roughly a 9x9 grid

interface RoomDef {
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  fill: string;
}

// Mirrors MoodSimBackend/Models/RoomMap.cs exactly, so a real (x, y) position
// coming from the backend always lands inside the correct room visually —
// this isn't an invented layout, it's the actual room grid the simulation uses.
const ROOMS: Record<string, RoomDef> = {
  bedroom_1: { name: "Bedroom 1", x1: 0, y1: 1, x2: 4, y2: 4, fill: "#c7d2fe" },
  bathroom: { name: "Bathroom", x1: 0, y1: 4, x2: 4, y2: 6, fill: "#bae6fd" },
  bedroom_2: { name: "Bedroom 2", x1: 5, y1: 1, x2: 9, y2: 4, fill: "#ddd6fe" },
  hallway: { name: "Hallway", x1: 4, y1: 4, x2: 5, y2: 6, fill: "#e5e7eb" },
  dining_room: { name: "Dining Room", x1: 0, y1: 6, x2: 4, y2: 7, fill: "#fed7aa" },
  kitchen: { name: "Kitchen", x1: 0, y1: 7, x2: 4, y2: 9, fill: "#fde68a" },
  living_room: { name: "Living Room", x1: 5, y1: 7, x2: 9, y2: 9, fill: "#bbf7d0" },
  entry: { name: "Entry", x1: 0, y1: 6, x2: 1, y2: 7, fill: "#e5e7eb" },
};

// activityId -> icon, built from the same catalog the Day Builder uses —
// self-contained here rather than passed in as a prop.
const ACTIVITY_ICON_MAP: Record<string, string> = Object.fromEntries(
  AVAILABLE_EVENTS.map((a) => [a.id, a.icon])
);

const STEP_MS = 1600; // fixed per-step display time during auto-play

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso; // already "HH:mm" or unparseable — show as-is
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

interface AnimatedHouseProps {
  movements: MovementRecord[];
  actions: ActionRecord[];
}

export default function AnimatedHouse({ movements, actions }: AnimatedHouseProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timerRef = useRef<number | null>(null);

  const stepCount = movements.length;

  // Reset to the start whenever a new simulation result comes in.
  useEffect(() => {
    setStepIndex(0);
    setPlaying(stepCount > 0);
  }, [movements, actions, stepCount]);

  useEffect(() => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (!playing || stepCount === 0) return;

    timerRef.current = window.setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= stepCount - 1) {
          if (timerRef.current) window.clearInterval(timerRef.current);
          setPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, STEP_MS);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, stepCount]);

  if (stepCount === 0) {
    return (
      <div style={{ padding: "var(--sp-5)", textAlign: "center", color: "var(--gray)", fontSize: 13 }}>
        No movement data yet — run a simulation to see the house animate.
      </div>
    );
  }

  const move = movements[stepIndex];
  const action = actions[stepIndex];
  const icon = action?.isClip ? "🎬" : ACTIVITY_ICON_MAP[action?.activityId ?? ""] ?? "❔";
  const emotionColor = getEmotionColor(action?.emotion ?? "neutral");

  const px = move.x * SCALE + SCALE / 2;
  const py = move.y * SCALE + SCALE / 2;
  const viewBoxSize = (GRID_SIZE + 1) * SCALE;

  function togglePlay() {
    setPlaying((p) => {
      if (!p && stepIndex >= stepCount - 1) {
        setStepIndex(0);
        return true;
      }
      return !p;
    });
  }

  function goTo(i: number) {
    setPlaying(false);
    setStepIndex(Math.max(0, Math.min(stepCount - 1, i)));
  }

  return (
    <div>
      <svg
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        style={{
          width: "100%",
          maxWidth: 480,
          display: "block",
          margin: "0 auto",
          background: "var(--card-bg-alt, #f8f8fa)",
          borderRadius: 12,
        }}
      >
        {Object.entries(ROOMS).map(([key, room]) => {
          const rx = room.x1 * SCALE;
          const ry = room.y1 * SCALE;
          const rw = (room.x2 - room.x1) * SCALE;
          const rh = (room.y2 - room.y1) * SCALE;
          return (
            <g key={key}>
              <rect x={rx} y={ry} width={rw} height={rh} fill={room.fill} stroke="#ffffff" strokeWidth={3} rx={6} />
              {rw > SCALE * 1.5 && (
                <text
                  x={rx + 8}
                  y={ry + 16}
                  fontSize={11}
                  fontWeight={700}
                  fill="#4b5563"
                  style={{ textTransform: "uppercase", letterSpacing: 0.4 }}
                >
                  {room.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Person marker — glides smoothly between real backend (x, y) positions */}
        <circle
          cx={px}
          cy={py}
          r={16}
          fill={emotionColor}
          stroke="#ffffff"
          strokeWidth={3}
          style={{ transition: "cx 0.7s ease, cy 0.7s ease, fill 0.4s ease" }}
        />
        <text
          x={px}
          y={py + 5}
          fontSize={16}
          textAnchor="middle"
          style={{ transition: "x 0.7s ease, y 0.7s ease", pointerEvents: "none" }}
        >
          {icon}
        </text>
      </svg>

      <div style={{ textAlign: "center", marginTop: 10, fontSize: 13 }}>
        <strong>{formatTime(move.time)}</strong> · {action?.label} ·{" "}
        <span style={{ textTransform: "capitalize" }}>{move.room.replace(/_/g, " ")}</span> ·{" "}
        <span style={{ textTransform: "capitalize", color: emotionColor, fontWeight: 700 }}>{action?.emotion}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center", marginTop: 10 }}>
        <button className="btn btn-ghost" onClick={() => goTo(stepIndex - 1)} disabled={stepIndex === 0}>
          ◀
        </button>
        <button className="btn btn-primary" onClick={togglePlay}>
          {playing ? "Pause" : stepIndex >= stepCount - 1 ? "Replay" : "Play"}
        </button>
        <button className="btn btn-ghost" onClick={() => goTo(stepIndex + 1)} disabled={stepIndex >= stepCount - 1}>
          ▶
        </button>
        <input
          type="range"
          min={0}
          max={stepCount - 1}
          value={stepIndex}
          onChange={(e) => goTo(Number(e.target.value))}
          style={{ flex: 1, maxWidth: 200 }}
        />
        <span style={{ fontSize: 12, color: "var(--gray)", width: 50, textAlign: "right" }}>
          {stepIndex + 1}/{stepCount}
        </span>
      </div>
    </div>
  );
}
