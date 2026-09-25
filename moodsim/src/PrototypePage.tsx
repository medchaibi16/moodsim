import { useState } from "react";
import logoMark from "./assets/logo-mark.png";
import {
  CLIP_CATEGORIES,
  type Clip,
  type ClipCategory,
  getClipCategoryCounts,
  getClipDominantColor,
  getClipsByCategory,
  getEmotionColor,
} from "./clipsData";
import { AVAILABLE_EVENTS, formatHour, type DayEvent } from "./simulationLogic";
import type { Character } from "./CharacterPage";
import {
  startSimulation,
  formatLogTime,
  type StartSimulationResponse,
  type BackendSimulationEvent,
} from "./api";
import { getSensorsForActivity } from "./sensorDefaults";
import AnimatedHouse from "./AnimatedHouse";

const BAR_EMOTIONS = ["anger", "sadness", "happiness", "neutral", "excited", "frustration"] as const;

// activityId -> icon, for rendering the Smart Home Output panel's history log
// without a separate lookup table to keep in sync.
const ACTIVITY_ICON_MAP: Record<string, string> = Object.fromEntries(
  AVAILABLE_EVENTS.map((a) => [a.id, a.icon])
);

const STEP_LABELS = [
  "Collecting data…",
  "Running the AI model…",
  "Analyzing emotional state…",
  "Generating recommendations…",
];

const RING_CIRCUMFERENCE = 188.5;

/* ============================================================
   Emotional clips modal
============================================================ */
function ClipsModal({
  open,
  onClose,
  category,
  onCategoryChange,
  onSelectClip,
}: {
  open: boolean;
  onClose: () => void;
  category: ClipCategory;
  onCategoryChange: (c: ClipCategory) => void;
  onSelectClip: (clip: Clip & { category: string }) => void;
}) {
  const counts = getClipCategoryCounts();
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const visibleCats = CLIP_CATEGORIES.filter((c) => c === "all" || counts[c] > 0);
  const catLabels: Record<ClipCategory, string> = {
    all: `All (${total})`,
    anger: `😠 Anger (${counts.anger || 0})`,
    sadness: `😢 Sadness (${counts.sadness || 0})`,
    happiness: `😊 Happiness (${counts.happiness || 0})`,
    neutral: `😐 Neutral (${counts.neutral || 0})`,
    excited: `🤩 Excited (${counts.excited || 0})`,
    frustration: `😤 Frustration (${counts.frustration || 0})`,
  };
  const clips = getClipsByCategory(category);

  return (
    <div className={`modal-overlay${open ? " open" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-clips-title">
      <div className="modal-card" style={{ maxWidth: 720 }}>
        <div className="modal-head">
          <h3 id="modal-clips-title">
            <span aria-hidden="true">🎬</span> Emotional Clips
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            <svg className="icon-sm" aria-hidden="true">
              <use href="#ic-x" />
            </svg>
          </button>
        </div>
        <div className="modal-body">
          <p style={{ margin: "-6px 0 var(--sp-4)", fontSize: 12.5, color: "var(--gray)" }}>
            {total} clips total · {clips.length} shown · click a clip or &quot;+ Add&quot;
          </p>
          <div className="clip-category-row">
            {visibleCats.map((c) => (
              <button
                key={c}
                type="button"
                className={`clip-cat-chip${category === c ? " active" : ""}`}
                onClick={() => onCategoryChange(c)}
              >
                {catLabels[c]}
              </button>
            ))}
          </div>
          <div className="clip-list" style={{ maxHeight: 360, overflowY: "auto", marginTop: "var(--sp-4)" }}>
            {clips.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: "var(--gray-dim)" }}>
                No clips found for this category.
              </div>
            ) : (
              clips.map((clip) => {
                const dom = clip.dominant_emotion;
                const totalWindows = Object.values(clip.distribution).reduce(
                  (a, b) => a + (b ?? 0),
                  0
                );
                const maxCount = Math.max(...Object.values(clip.distribution).map((v) => v ?? 0));
                return (
                  <div
                    key={clip.filename}
                    className="clip-row"
                    onClick={() => onSelectClip(clip)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="clip-row-head">
                        <span>{clip.filename}</span>
                        <span className="clip-emotion-badge" style={{ background: getEmotionColor(dom) }}>
                          {dom}
                        </span>
                        <span className="clip-meta">
                          {totalWindows} windows · {clip.duration}s
                        </span>
                      </div>
                      {BAR_EMOTIONS.map((e) => {
                        const count = (clip.distribution as Record<string, number | undefined>)[e] || 0;
                        if (count === 0) return null;
                        const w = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;
                        return (
                          <div className="clip-bar-row" key={e}>
                            <span style={{ width: 56, textTransform: "capitalize", color: "var(--gray)", flexShrink: 0 }}>
                              {e}
                            </span>
                            <div className="clip-bar-track">
                              <div
                                className="clip-bar-fill"
                                style={{ width: `${w}%`, background: getEmotionColor(e) }}
                              />
                            </div>
                            <span style={{ width: 20, textAlign: "right", color: "var(--text-dim)" }}>
                              {count}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="clip-side">
                      <span style={{ fontSize: 12, color: "var(--gray)", fontWeight: 600 }}>
                        Acc: {Math.round(clip.avg_confidence * 100)}%
                      </span>
                      <button
                        type="button"
                        className="clip-add-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClip(clip);
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="modal-actions">
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Main page
============================================================ */
interface PrototypePageProps {
  start: number;
  setStart: (v: number) => void;
  end: number;
  setEnd: (v: number) => void;
  events: DayEvent[];
  setEvents: (updater: DayEvent[] | ((prev: DayEvent[]) => DayEvent[])) => void;
  character: Character | null;
  lastResult: StartSimulationResponse | null;
  onRunComplete: (result: StartSimulationResponse) => void;
}

export default function PrototypePage({
  start,
  setStart,
  end,
  setEnd,
  events,
  setEvents,
  character,
  lastResult,
  onRunComplete,
}: PrototypePageProps) {
  const [clipsOpen, setClipsOpen] = useState(false);
  const [clipCategory, setClipCategory] = useState<ClipCategory>("all");
  const [runState, setRunState] = useState<"idle" | "running" | "done">("idle");
  const [runError, setRunError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [stepStatus, setStepStatus] = useState<("pending" | "current" | "done")[]>(
    Array(STEP_LABELS.length).fill("pending")
  );

  function toggleRow(i: number) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  const effectiveEnd = end <= start ? start + 1 : end;
  const totalMin = (effectiveEnd - start) * 60;
  const usedMin = events.reduce((sum, e) => sum + e.duration, 0);
  const pct = totalMin ? Math.min(100, Math.round((usedMin / totalMin) * 100)) : 0;
  const remaining = Math.max(0, totalMin - usedMin);
  const ringOffset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * pct) / 100;

  function handleStartChange(v: number) {
    setStart(v);
    if (end <= v) setEnd(v + 1);
  }
  function handleEndChange(v: number) {
    setEnd(v <= start ? start + 1 : v);
  }

  function addDayEvent() {
    const fitting = AVAILABLE_EVENTS.find((a) => remaining >= a.duration);
    if (!fitting) {
      alert("⏰ Not enough time left for any event! Adjust your start/end time.");
      return;
    }
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now(),
        activityId: fitting.id,
        activityName: fitting.name,
        activityIcon: fitting.icon,
        duration: fitting.duration,
        isClip: false,
      },
    ]);
  }

  function updateDayEventActivity(eventId: number, activityId: string) {
    const selected = AVAILABLE_EVENTS.find((a) => a.id === activityId);
    if (!selected) return;
    const otherDuration = events.reduce((sum, e) => (e.id === eventId ? sum : sum + e.duration), 0);
    if (otherDuration + selected.duration > totalMin) {
      alert(`⏰ Cannot change to "${selected.name}" — not enough time remaining!`);
      return;
    }
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? {
              ...e,
              activityId: selected.id,
              activityName: selected.name,
              activityIcon: selected.icon,
              duration: selected.duration,
              isClip: false,
            }
          : e
      )
    );
  }

  function removeDayEvent(eventId: number) {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  function handleSelectClip(clip: Clip & { category: string }) {
    const durationMinutes = Math.max(1, Math.round(clip.duration / 60));
    if (durationMinutes > remaining) {
      alert(`⏰ Not enough time remaining for this clip! (Need ${durationMinutes} min)`);
      return;
    }
    setEvents((prev) => [
      ...prev,
      {
        id: Date.now(),
        activityId: "emotional_clip",
        activityName: `🎬 ${clip.filename}`,
        activityIcon: "🎬",
        duration: durationMinutes,
        isClip: true,
        clipData: {
          totalClips: clip.total_clips,
          duration: clip.duration,
          avgConfidence: clip.avg_confidence,
          distribution: clip.distribution,
          filename: clip.filename,
          dominantEmotion: clip.dominant_emotion,
        },
      },
    ]);
    setClipsOpen(false);
  }

  async function runSimulation() {
    if (runState === "running") return;
    setRunState("running");
    setRunError(null);
    setStepStatus(Array(STEP_LABELS.length).fill("pending"));

    // Visual step progression — purely cosmetic, runs alongside the real request
    // rather than gating it. If the request finishes faster or slower than this
    // animation, that's fine; only the real result below drives onRunComplete.
    const stepDelay = 500;
    STEP_LABELS.forEach((_, i) => {
      setTimeout(() => {
        setStepStatus((prev) => prev.map((s, idx) => (idx === i ? "current" : s)));
      }, i * stepDelay);
    });

    const requestEvents: BackendSimulationEvent[] = events.map((e) => ({
      id: String(e.id),
      name: e.activityName,
      icon: e.activityIcon,
      duration: e.duration,
      isClip: e.isClip,
      activityId: e.activityId,
      clipData:
        e.isClip && e.clipData
          ? {
              totalClips: e.clipData.totalClips,
              duration: e.clipData.duration,
              avgConfidence: e.clipData.avgConfidence,
              distribution: e.clipData.distribution as Record<string, number>,
              filename: e.clipData.filename,
              dominantEmotion: e.clipData.dominantEmotion,
            }
          : undefined,
      // Real sensor signal per activity — without this the backend's guesser has
      // nothing to reason over. See sensorDefaults.ts for why.
      sensors: e.isClip ? undefined : getSensorsForActivity(e.activityId),
    }));

    try {
      const result = await startSimulation({
        startHour: start,
        endHour: effectiveEnd,
        events: requestEvents,
        character: character ?? undefined,
      });
      setStepStatus(Array(STEP_LABELS.length).fill("done"));
      setRunState("done");
      onRunComplete(result);
      setTimeout(() => {
        setRunState("idle");
        setStepStatus(Array(STEP_LABELS.length).fill("pending"));
      }, 900);
    } catch (err) {
      setRunError(err instanceof Error ? err.message : String(err));
      setRunState("idle");
      setStepStatus(Array(STEP_LABELS.length).fill("pending"));
    }
  }

  const running = runState === "running";

  return (
    <div className="main">
      {/* Header row */}
      <div className="daybuilder-header">
        <div className="daybuilder-title">
          <span style={{ fontSize: 24 }} aria-hidden="true">
            🏠
          </span>
          MoodSim — Day Builder
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--sp-5)", flexWrap: "wrap" }}>
          <span className="min-used-label">
            {usedMin} / {totalMin} min used
          </span>
          <button
            className="add-event-btn"
            style={{ background: "#9C27B0" }}
            onClick={() => setClipsOpen(true)}
            aria-label="Add an emotional clip"
          >
            <span aria-hidden="true">🎬</span> Add Clip
          </button>
          <button className="add-event-btn" onClick={addDayEvent} aria-label="Add a new event">
            <svg className="icon-sm" aria-hidden="true">
              <use href="#ic-plus" />
            </svg>
            + Add Event
          </button>
        </div>
      </div>

      {/* Time control card */}
      <div className="time-control-card">
        <div className="time-controls">
          <div className="time-ctrl-group">
            <div className="time-ctrl-label">Start Time</div>
            <input
              type="range"
              className="time-ctrl-slider"
              min={0}
              max={23}
              value={start}
              onChange={(e) => handleStartChange(Number(e.target.value))}
            />
            <div className="time-ctrl-value">{formatHour(start)}</div>
          </div>
          <div className="time-ctrl-group">
            <div className="time-ctrl-label">End Time</div>
            <input
              type="range"
              className="time-ctrl-slider"
              min={0}
              max={27}
              value={end}
              onChange={(e) => handleEndChange(Number(e.target.value))}
            />
            <div className="time-ctrl-value">{formatHour(effectiveEnd)}</div>
          </div>
          <div className="duration-info">
            <div className="duration-label">Day Duration</div>
            <div className="duration-value">
              {formatHour(start)}
              <span className="duration-arrow"> → </span>
              {formatHour(effectiveEnd)}
              <span style={{ fontSize: 12, color: "var(--gray)", fontWeight: 500 }}> ({totalMin} min)</span>
            </div>
          </div>
          <div className="progress-ring-wrap">
            <div
              className="progress-ring"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Minutes used"
            >
              <svg width={72} height={72} viewBox="0 0 72 72">
                <circle className="ring-bg" cx={36} cy={36} r={30} />
                <circle
                  className="ring-fill"
                  cx={36}
                  cy={36}
                  r={30}
                  strokeDasharray={RING_CIRCUMFERENCE}
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div className="progress-ring-label">{pct}%</div>
            </div>
            <div className="remaining-label">
              {remaining} min
              <br />
              remaining
            </div>
          </div>
        </div>
      </div>

      {/* Events area */}
      <div className="events-area">
        {events.length === 0 ? (
          <div className="events-empty">
            <div className="empty-icon" aria-hidden="true">
              📬
            </div>
            <h4>No events yet</h4>
            <p>
              Click the <strong>&ldquo;+ Add Event&rdquo;</strong> button to start building your day
            </p>
            <span className="em-hint">Available time: {totalMin} minutes</span>
          </div>
        ) : (
          <div className="events-list events-grid">
            {events.map((ev, i) => {
              const isClip = ev.isClip;
              const clipColor = isClip && ev.clipData ? getClipDominantColor(ev.clipData.distribution) : "#9C27B0";
              const topDist =
                isClip && ev.clipData?.distribution
                  ? Object.entries(ev.clipData.distribution)
                      .filter(([, c]) => (c ?? 0) > 0)
                      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                      .slice(0, 2)
                      .map(([e, c]) => `${e}: ${c}`)
                      .join(", ")
                  : "";
              return (
                <div
                  key={ev.id}
                  className="event-card"
                  style={{
                    borderColor: isClip ? clipColor : "var(--border)",
                    background: isClip ? "var(--bg-elev)" : undefined,
                  }}
                >
                  <div className="event-card-index">#{i + 1}</div>
                  {isClip && (
                    <div className="event-card-clip-tag" style={{ color: clipColor }}>
                      📽️ Clip
                    </div>
                  )}
                  <div className="event-card-body">
                    <label className="event-card-label">{isClip ? "Emotional Clip" : "Activity"}</label>
                    {isClip ? (
                      <div className="event-card-clip-name">
                        {ev.activityName}
                        {topDist && <span className="event-card-clip-dist">(🎯 {topDist})</span>}
                      </div>
                    ) : (
                      <select
                        className="event-card-select"
                        value={ev.activityId}
                        onChange={(e) => updateDayEventActivity(ev.id, e.target.value)}
                      >
                        {AVAILABLE_EVENTS.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.icon} {a.name} ({a.duration} min)
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="event-card-footer">
                    <span className="event-card-icon">{ev.activityIcon}</span>
                    <span className="event-card-duration">{ev.duration} min</span>
                  </div>
                  <button
                    className="event-delete"
                    onClick={() => removeDayEvent(ev.id)}
                    aria-label={`Remove ${ev.activityName}`}
                  >
                    <svg className="icon-sm" aria-hidden="true">
                      <use href="#ic-trash" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="daybuilder-footer">
        {events.length} event{events.length !== 1 ? "s" : ""} in your timeline
        {events.filter((e) => e.isClip).length > 0 &&
          ` · 🎬 ${events.filter((e) => e.isClip).length} clip${
            events.filter((e) => e.isClip).length !== 1 ? "s" : ""
          }`}
      </div>

      <div className="card" style={{ marginTop: "var(--sp-5)" }}>
        <button className="run-btn" disabled={running} onClick={runSimulation}>
          {running ? (
            <span className="spin" />
          ) : (
            <svg className="icon" aria-hidden="true">
              <use href="#ic-play" />
            </svg>
          )}
          <span>
            {running
              ? "Simulation running…"
              : runState === "done"
              ? "Simulation complete ✓"
              : "Run simulation"}
          </span>
        </button>
        {running && (
          <div className="load-steps" style={{ display: "flex" }}>
            {STEP_LABELS.map((label, i) => (
              <div className={`load-step ${stepStatus[i]}`} key={label}>
                <span className="ls-dot" /> {label}
              </div>
            ))}
          </div>
        )}
      </div>

      {runError && (
        <div className="card" style={{ marginTop: "var(--sp-5)", borderColor: "var(--danger)" }}>
          <p style={{ color: "var(--danger)", fontWeight: 600, margin: 0 }}>Simulation failed</p>
          <p style={{ color: "var(--gray)", fontSize: 13, margin: "4px 0 0" }}>{runError}</p>
          <p style={{ color: "var(--gray)", fontSize: 12, margin: "8px 0 0" }}>
            Check that the backend is running and reachable.
          </p>
        </div>
      )}

      {lastResult && (
        <>
          {/* Day summary banner */}
          <div
            className="card"
            style={{
              marginTop: "var(--sp-5)",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, letterSpacing: 0.5, marginBottom: 6 }}>
              🧭 DAY SUMMARY
            </div>
            <div style={{ fontSize: 14.5, lineHeight: 1.5 }}>{lastResult.daySummary}</div>
          </div>

          {/* Current emotion */}
          <div className="card" style={{ marginTop: "var(--sp-5)" }}>
            <div className="char-section-title">
              <span style={{ fontSize: 18 }} aria-hidden="true">
                🎭
              </span>
              Current Emotion
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <span
                className="clip-emotion-badge"
                style={{
                  background: getEmotionColor(lastResult.currentEmotion.emotion),
                  fontSize: 14,
                  padding: "4px 12px",
                  textTransform: "capitalize",
                }}
              >
                {lastResult.currentEmotion.emotion}
              </span>
              <span style={{ fontSize: 13, color: "var(--gray)" }}>
                confidence {Math.round(lastResult.currentEmotion.confidence * 100)}% · margin{" "}
                {Math.round(lastResult.currentEmotion.margin * 100)}%
              </span>
            </div>
            {Object.entries(lastResult.currentEmotion.voteBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([emotion, v]) => (
                <div className="clip-bar-row" key={emotion}>
                  <span style={{ width: 90, textTransform: "capitalize", color: "var(--gray)", flexShrink: 0 }}>
                    {emotion}
                  </span>
                  <div className="clip-bar-track">
                    <div
                      className="clip-bar-fill"
                      style={{ width: `${Math.round(v * 100)}%`, background: getEmotionColor(emotion) }}
                    />
                  </div>
                  <span style={{ width: 40, textAlign: "right", color: "var(--gray)" }}>
                    {Math.round(v * 100)}%
                  </span>
                </div>
              ))}
          </div>

          {/* House commands */}
          <div className="card" style={{ marginTop: "var(--sp-5)" }}>
            <div className="char-section-title">
              <span style={{ fontSize: 18 }} aria-hidden="true">
                🏠
              </span>
              House Commands
            </div>
            {lastResult.houseCommands.length === 0 ? (
              <p style={{ color: "var(--gray)", fontSize: 13 }}>No commands issued.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {lastResult.houseCommands.map((cmd, i) => (
                  <div key={i} style={{ padding: "10px 12px", background: "var(--card-bg-alt, rgba(120,120,120,0.08))", borderRadius: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
                      [{cmd.device}] {cmd.action}
                    </div>
                    <div style={{ fontSize: 12.5, color: "var(--gray)", marginBottom: 4 }}>{cmd.reason}</div>
                    <div style={{ fontSize: 12, color: "var(--gray)" }}>
                      {Object.entries(cmd.parameters)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(" · ")}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Event-by-event log with expandable reasoning */}
          <div className="card" style={{ marginTop: "var(--sp-5)" }}>
            <div className="char-section-title">
              <span style={{ fontSize: 18 }} aria-hidden="true">
                📋
              </span>
              Event Log
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {lastResult.log.map((entry, i) => {
                const hasReasoning = !entry.isClip && entry.reasoning && entry.reasoning.length > 0;
                const isExpanded = expandedRows.has(i);
                return (
                  <div
                    key={i}
                    style={{
                      borderBottom: i < lastResult.log.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "60px 1fr 90px 130px 30px",
                        gap: 8,
                        padding: "8px 4px",
                        alignItems: "center",
                        fontSize: 13,
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: 12 }}>{formatLogTime(entry.time)}</span>
                      <span>
                        {entry.eventName}
                        {hasReasoning && (
                          <div
                            onClick={() => toggleRow(i)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") toggleRow(i);
                            }}
                            style={{ fontSize: 11, color: "var(--primary)", cursor: "pointer", marginTop: 2 }}
                          >
                            🧠 {entry.guessedActivity} ({Math.round(entry.guessedActivityConfidence * 100)}%){" "}
                            {isExpanded ? "▲" : "▼ reasoning"}
                          </div>
                        )}
                      </span>
                      <span style={{ fontSize: 12, color: "var(--gray)" }}>{entry.room}</span>
                      <span
                        className="clip-emotion-badge"
                        style={{
                          background: getEmotionColor(entry.emotion),
                          fontSize: 11,
                          width: "fit-content",
                          textTransform: "capitalize",
                        }}
                      >
                        {entry.emotion} ({Math.round(entry.confidence * 100)}%)
                      </span>
                      <span style={{ textAlign: "center" }}>{entry.isClip ? "🎬" : ""}</span>
                    </div>
                    {isExpanded && hasReasoning && (
                      <div style={{ padding: "6px 4px 12px 68px", fontSize: 12, color: "var(--gray)" }}>
                        {entry.reasoning!.map((beat, bi) => (
                          <div key={bi} style={{ marginBottom: 3 }}>
                            {beat.type === "perception" ? "👁️" : beat.type === "hypothesis" ? "🤔" : "💡"}{" "}
                            {beat.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Smart Home Output — real IoT-style status, driven entirely by this run's
              actual ground-truth movements/actions/current emotion. Not scripted. */}
          <div className="card" style={{ marginTop: "var(--sp-5)" }}>
            <div className="char-section-title">
              <span style={{ fontSize: 18 }} aria-hidden="true">
                🏠
              </span>
              Smart Home Output
            </div>

            <AnimatedHouse movements={lastResult.movements} actions={lastResult.actions} />

            <div style={{ marginTop: "var(--sp-5)" }} />

            {lastResult.movements.length > 0 &&
              (() => {
                const lastMove = lastResult.movements[lastResult.movements.length - 1];
                const lastAction = lastResult.actions[lastResult.actions.length - 1];
                const icon = lastAction?.isClip ? "🎬" : ACTIVITY_ICON_MAP[lastAction?.activityId ?? ""] ?? "❔";
                return (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                      gap: 12,
                      marginBottom: "var(--sp-5)",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase", letterSpacing: 0.4 }}>
                        Room
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, textTransform: "capitalize" }}>
                        {lastMove.room.replace(/_/g, " ")}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase", letterSpacing: 0.4 }}>
                        Posture
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, textTransform: "capitalize" }}>{lastMove.posture}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase", letterSpacing: 0.4 }}>
                        Activity
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>
                        <span aria-hidden="true">{icon}</span> {lastAction?.label}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: "var(--gray)", textTransform: "uppercase", letterSpacing: 0.4 }}>
                        Current Emotion
                      </div>
                      <div style={{ fontSize: 15, fontWeight: 700, textTransform: "capitalize" }}>
                        {lastResult.currentEmotion.emotion} ({Math.round(lastResult.currentEmotion.confidence * 100)}%)
                      </div>
                    </div>
                  </div>
                );
              })()}

            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--gray)",
                marginBottom: 8,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              Event History
            </div>
            <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
              {lastResult.actions.map((action, i) => {
                const move = lastResult.movements[i];
                const icon = action.isClip ? "🎬" : ACTIVITY_ICON_MAP[action.activityId] ?? "❔";
                return (
                  <div
                    key={i}
                    style={{
                      fontSize: 12.5,
                      padding: "6px 10px",
                      borderRadius: 6,
                      background: i % 2 === 0 ? "transparent" : "var(--card-bg-alt, rgba(120,120,120,0.06))",
                      display: "flex",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <span style={{ fontWeight: 700, width: 55, flexShrink: 0 }}>{formatLogTime(action.time)}</span>
                    <span style={{ flexShrink: 0 }} aria-hidden="true">
                      {icon}
                    </span>
                    <span style={{ flex: 1 }}>{action.label}</span>
                    {move && (
                      <span style={{ color: "var(--gray)", flexShrink: 0, textTransform: "capitalize" }}>
                        {move.room.replace(/_/g, " ")}
                      </span>
                    )}
                    <span
                      className="clip-emotion-badge"
                      style={{
                        background: getEmotionColor(action.emotion),
                        fontSize: 10.5,
                        flexShrink: 0,
                        textTransform: "capitalize",
                      }}
                    >
                      {action.emotion}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      <ClipsModal
        open={clipsOpen}
        onClose={() => setClipsOpen(false)}
        category={clipCategory}
        onCategoryChange={setClipCategory}
        onSelectClip={handleSelectClip}
      />

      <img src={logoMark} alt="MoodStabilizer" className="page-watermark" />
    </div>
  );
}
