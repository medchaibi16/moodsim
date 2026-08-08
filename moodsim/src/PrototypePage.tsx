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
import { AVAILABLE_EVENTS, formatHour, computeSimulationResult, type DayEvent, type SimResult } from "./simulationLogic";

const BAR_EMOTIONS = ["anger", "sadness", "happiness", "neutral", "excited", "frustration"] as const;

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
  onRunComplete: (result: SimResult) => void;
}

export default function PrototypePage({
  start,
  setStart,
  end,
  setEnd,
  events,
  setEvents,
  onRunComplete,
}: PrototypePageProps) {
  const [clipsOpen, setClipsOpen] = useState(false);
  const [clipCategory, setClipCategory] = useState<ClipCategory>("all");
  const [runState, setRunState] = useState<"idle" | "running" | "done">("idle");
  const [stepStatus, setStepStatus] = useState<("pending" | "current" | "done")[]>(
    Array(STEP_LABELS.length).fill("pending")
  );

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

  function runSimulation() {
    if (runState === "running") return;
    setRunState("running");
    setStepStatus(Array(STEP_LABELS.length).fill("pending"));
    const stepDelay = 650;
    STEP_LABELS.forEach((_, i) => {
      setTimeout(() => {
        setStepStatus((prev) => prev.map((s, idx) => (idx === i ? "current" : s)));
      }, i * stepDelay);
      setTimeout(() => {
        setStepStatus((prev) => prev.map((s, idx) => (idx === i ? "done" : s)));
      }, (i + 1) * stepDelay - 80);
    });
    setTimeout(() => {
      setRunState("done");
      const result = computeSimulationResult(events, start, effectiveEnd);
      setTimeout(() => {
        setRunState("idle");
        setStepStatus(Array(STEP_LABELS.length).fill("pending"));
        onRunComplete(result);
      }, 900);
    }, STEP_LABELS.length * stepDelay + 250);
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
