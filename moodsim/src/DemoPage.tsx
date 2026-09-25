import { useEffect, useRef, useState } from "react";
import logoMark from "./assets/logo-mark.png";
import { fmtTime, EMOTION_DISPLAY, VIDEO_LIB, VIDEO_ORDER, type DemoVideo } from "./demoVideos";
import { analyzeWindow } from "./api";

interface HistoryItem {
  time: string;
  tag: string;
  color: string;
  conf: number;
}

interface CurrentEmotion {
  tag: string;
  icon: string;
  color: string;
  conf: number;
}

interface WindowBar {
  color: string;
  height: number;
  tip: string;
}

const NEUTRAL_DISPLAY = { icon: "ic-meh-scared", color: "var(--gray)", label: "—" };

export default function DemoPage() {
  const [selectedKey, setSelectedKey] = useState<string>(VIDEO_ORDER[0]);
  const [playbackActive, setPlaybackActive] = useState(false);
  const [playbackElapsed, setPlaybackElapsed] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [caption, setCaption] = useState(`${VIDEO_LIB[VIDEO_ORDER[0]].name}`);
  const [current, setCurrent] = useState<CurrentEmotion>({ tag: "—", ...NEUTRAL_DISPLAY, conf: 0 });
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [windowBars, setWindowBars] = useState<WindowBar[]>([]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const lastAnalyzedWindowRef = useRef<number>(-1);
  const analyzingRef = useRef(false);

  const video: DemoVideo = VIDEO_LIB[selectedKey];

  function resetForVideo(key: string) {
    const v = VIDEO_LIB[key];
    setPlaybackActive(false);
    setPlaybackElapsed(0);
    setVideoDuration(0);
    setAnalysisError(null);
    setCaption(v.name);
    setCurrent({ tag: "—", ...NEUTRAL_DISPLAY, conf: 0 });
    setDistribution({});
    setHistory([]);
    setWindowBars([]);
    lastAnalyzedWindowRef.current = -1;
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  function selectVideo(key: string) {
    setSelectedKey(key);
    resetForVideo(key);
  }

  function togglePlayback() {
    const el = videoRef.current;
    if (!el) return;
    if (playbackActive) {
      el.pause();
    } else {
      el.play().catch((err) => setAnalysisError(`Couldn't play video: ${err.message}`));
    }
  }

  function seekPlayback(e: React.MouseEvent<HTMLDivElement>) {
    const el = videoRef.current;
    if (!el || !videoDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.currentTime = ratio * videoDuration;
  }

  // Real 5-second-window analysis, driven by the actual video's playback time —
  // not a timer. Fires once per window index, guarded so a slow request can't
  // trigger overlapping calls or get re-fired by the next timeupdate tick.
  async function maybeAnalyzeCurrentWindow(elapsed: number) {
    const windowIndex = Math.floor(elapsed / 5);
    if (windowIndex === lastAnalyzedWindowRef.current) return;
    if (windowIndex < 0) return;
    if (analyzingRef.current) return;

    lastAnalyzedWindowRef.current = windowIndex;
    analyzingRef.current = true;
    setAnalyzing(true);
    try {
      const result = await analyzeWindow(video.key, windowIndex);
      const display = EMOTION_DISPLAY[result.emotion] ?? NEUTRAL_DISPLAY;
      const confPct = Math.round(result.confidence * 100);

      setCurrent({ tag: display.label, icon: display.icon, color: display.color, conf: confPct });
      setDistribution(result.distribution ?? {});

      const timeLabel = fmtTime(windowIndex * 5);
      setHistory((prev) => [{ time: timeLabel, tag: display.label, color: display.color, conf: confPct }, ...prev].slice(0, 8));
      setWindowBars((prev) => [
        ...prev,
        {
          color: display.color,
          height: 18 + confPct * 0.6,
          tip: `${timeLabel} · ${display.label} (${confPct}%) · audio: ${result.audioEmotion}, face: ${result.faceEmotion}`,
        },
      ]);
      setAnalysisError(null);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : String(err));
    } finally {
      analyzingRef.current = false;
      setAnalyzing(false);
    }
  }

  function handleTimeUpdate() {
    const el = videoRef.current;
    if (!el) return;
    setPlaybackElapsed(el.currentTime);
    if (!el.paused) {
      void maybeAnalyzeCurrentWindow(el.currentTime);
    }
  }

  function handleLoadedMetadata() {
    const el = videoRef.current;
    if (!el) return;
    setVideoDuration(el.duration);
  }

  function handlePlay() {
    setPlaybackActive(true);
  }

  function handlePause() {
    setPlaybackActive(false);
  }

  function handleEnded() {
    setPlaybackActive(false);
  }

  // Stop everything on unmount (navigating to another page)
  useEffect(() => {
    return () => {
      videoRef.current?.pause();
    };
  }, []);

  const pct = videoDuration ? (playbackElapsed / videoDuration) * 100 : 0;

  return (
    <div className="main">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <svg className="icon-sm" aria-hidden="true">
              <use href="#ic-video" />
            </svg>
            Real-time inference
          </div>
          <h1>Live Demo</h1>
          <p className="subtitle">The model analyzes emotions from audio + face every 5 seconds while the video plays.</p>
        </div>
        <span className="pill pill-live">
          <span className="dot" style={{ background: "#D14343", boxShadow: "0 0 8px #D14343" }} />
          Live
        </span>
      </div>

      <div className="demo-layout">
        <div className="card video-list-card">
          <div className="video-list-title">
            <svg className="icon-sm" aria-hidden="true">
              <use href="#ic-video" />
            </svg>
            Choose a video
          </div>
          <div className="video-list" role="listbox" aria-label="List of available videos">
            {VIDEO_ORDER.map((key) => {
              const v = VIDEO_LIB[key];
              return (
                <div
                  key={key}
                  className={`video-item${selectedKey === key ? " active" : ""}`}
                  role="option"
                  aria-selected={selectedKey === key}
                  tabIndex={0}
                  onClick={() => selectVideo(key)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") selectVideo(key);
                  }}
                >
                  <span className="v-name">{v.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="video-frame" style={{ position: "relative", overflow: "hidden" }}>
            <video
              ref={videoRef}
              src={video.src}
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 0 }}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={handlePlay}
              onPause={handlePause}
              onEnded={handleEnded}
            />

            {playbackActive && (
              <div className="rec-badge" style={{ display: "flex" }}>
                <span className="rec-dot" /> LIVE
              </div>
            )}
            {playbackActive && (
              <div className="demo-metrics" style={{ display: "flex" }}>
                <span className="metric-chip">
                  <span className="dot-sm" /> {analyzing ? "Analyzing…" : "AI ready"}
                </span>
                <span className="metric-chip">Confidence {current.conf}%</span>
              </div>
            )}
            <button className="play-btn" aria-label={playbackActive ? "Pause" : "Play video"} onClick={togglePlayback}>
              <svg className="icon" aria-hidden="true">
                <use href={playbackActive ? "#ic-pause" : "#ic-play"} />
              </svg>
            </button>
            <span className="video-caption">{caption}</span>
            <div className="video-progress-wrap" style={{ display: "flex" }}>
              <div className="video-progress" onClick={seekPlayback}>
                <div className="video-progress-fill" style={{ width: `${pct.toFixed(1)}%` }} />
              </div>
              <span className="video-time">
                {fmtTime(playbackElapsed)} / {fmtTime(videoDuration)}
              </span>
            </div>
          </div>

          {analysisError && (
            <div className="card" style={{ marginTop: "var(--sp-4)", borderColor: "var(--danger)" }}>
              <p style={{ color: "var(--danger)", fontSize: 13, margin: 0 }}>{analysisError}</p>
              <p style={{ color: "var(--gray)", fontSize: 12, margin: "4px 0 0" }}>
                Check that the backend is running and the model/asset files are in place.
              </p>
            </div>
          )}

          <div className="live-emotion-row">
            <div className="card">
              <div className="chart-title">Current emotion</div>
              <div className="emotion-big">
                <div className="em" style={{ color: current.color }}>
                  <svg className="icon-lg" aria-hidden="true" style={{ width: 40, height: 40 }}>
                    <use href={`#${current.icon}`} />
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 19, fontWeight: 700 }}>{current.tag}</div>
                  <div style={{ fontSize: 12, color: "var(--gray)" }}>Confidence {current.conf}%</div>
                </div>
              </div>
              <div className="conf-bar">
                <div className="conf-fill" style={{ width: `${current.conf}%` }} />
              </div>
              <div className="chart-title" style={{ marginTop: "var(--sp-5)" }}>
                Emotion breakdown <span className="muted">this window</span>
              </div>
              {Object.keys(distribution).length === 0 ? (
                <p style={{ color: "var(--gray)", fontSize: 13 }}>Play the video to see the breakdown.</p>
              ) : (
                Object.entries(distribution)
                  .sort((a, b) => b[1] - a[1])
                  .map(([emotion, prob]) => {
                    const display = EMOTION_DISPLAY[emotion] ?? NEUTRAL_DISPLAY;
                    const pct = Math.round(prob * 100);
                    return (
                      <div key={emotion} className="clip-bar-row">
                        <span style={{ width: 90, textTransform: "capitalize", color: "var(--gray)", flexShrink: 0 }}>
                          {display.label}
                        </span>
                        <div className="clip-bar-track">
                          <div className="clip-bar-fill" style={{ width: `${pct}%`, background: display.color }} />
                        </div>
                        <span style={{ width: 40, textAlign: "right", color: "var(--gray)" }}>{pct}%</span>
                      </div>
                    );
                  })
              )}
            </div>
            <div className="card">
              <div className="chart-title">
                Analysis timeline <span className="muted">{video.name}</span>
              </div>
              <div className="timeline">
                {windowBars.length === 0 && (
                  <p style={{ color: "var(--gray)", fontSize: 13 }}>Bars appear as each 5-second window is analyzed.</p>
                )}
                {windowBars.map((bar, i) => (
                  <div
                    key={i}
                    className="tl-bar"
                    tabIndex={0}
                    data-tip={bar.tip}
                    style={{ height: `${bar.height.toFixed(0)}px`, background: bar.color, opacity: 0.9 }}
                  />
                ))}
              </div>
              <div className="chart-title" style={{ marginTop: "var(--sp-5)" }}>
                Emotion history <span className="muted">real-time</span>
              </div>
              <div className="emotion-history">
                {history.length === 0 && (
                  <p style={{ color: "var(--gray)", fontSize: 13 }}>Play the video to start analyzing.</p>
                )}
                {history.map((h, i) => (
                  <div className="eh-item" key={i}>
                    <span className="eh-time">{h.time}</span>
                    <span className="eh-tag" style={{ color: h.color }}>
                      {h.tag}
                    </span>
                    <span style={{ color: "var(--gray-dim)" }}>{h.conf}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <img src={logoMark} alt="MoodStabilizer" className="page-watermark" />
    </div>
  );
}
