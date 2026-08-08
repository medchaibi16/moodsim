import { useEffect, useRef, useState } from "react";
import logoMark from "./assets/logo-mark.png";
import { DEMO_EMOTIONS, fmtTime, VIDEO_LIB, VIDEO_ORDER, type DemoVideo } from "./demoVideos";

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

const TIMELINE_HOURS = [
  "06h", "07h", "08h", "09h", "10h", "11h", "12h", "13h", "14h", "15h", "16h", "17h", "18h", "19h", "20h", "21h",
];

function buildTimelineHeights(seedColors: string[]) {
  return seedColors.map((color, i) => ({
    color,
    height: 18 + (Math.sin(i * 1.7) + 1) * 26,
    opacity: 0.55 + (i % 3) * 0.15,
    tip: `${TIMELINE_HOURS[i % TIMELINE_HOURS.length]} · ${color === "var(--success)" ? "stable" : "variation"}`,
  }));
}

export default function DemoPage() {
  const [selectedKey, setSelectedKey] = useState<string>("marche");
  const [playbackActive, setPlaybackActive] = useState(false);
  const [playbackElapsed, setPlaybackElapsed] = useState(0);
  const [detectionActive, setDetectionActive] = useState(false);
  const [fps, setFps] = useState(29);
  const [caption, setCaption] = useState(`${VIDEO_LIB.marche.name}.mp4 — ${VIDEO_LIB.marche.duration}`);
  const [current, setCurrent] = useState<CurrentEmotion>({ ...VIDEO_LIB.marche.demo });
  const [history, setHistory] = useState<HistoryItem[]>([
    { time: "00:00", tag: VIDEO_LIB.marche.demo.tag, color: VIDEO_LIB.marche.demo.color, conf: VIDEO_LIB.marche.demo.conf },
  ]);
  const [timelineBars, setTimelineBars] = useState(buildTimelineHeights(VIDEO_LIB.marche.tlColors));

  const playbackIntervalRef = useRef<number | null>(null);
  const emotionIntervalRef = useRef<number | null>(null);
  const fpsRafRef = useRef<number | null>(null);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const faceBoxRef = useRef<HTMLDivElement>(null);

  const video: DemoVideo = VIDEO_LIB[selectedKey];

  function fpsLoop() {
    frameCountRef.current++;
    const now = performance.now();
    if (now - lastFrameTimeRef.current >= 1000) {
      const f = Math.round((frameCountRef.current * 1000) / (now - lastFrameTimeRef.current));
      setFps(Math.min(30, Math.max(18, f + 24)));
      frameCountRef.current = 0;
      lastFrameTimeRef.current = now;
    }
    const t = now / 900;
    if (faceBoxRef.current) {
      faceBoxRef.current.style.top = `${(26 + Math.sin(t) * 3).toFixed(1)}%`;
      faceBoxRef.current.style.left = `${(36 + Math.cos(t * 0.8) * 3).toFixed(1)}%`;
    }
    fpsRafRef.current = requestAnimationFrame(fpsLoop);
  }

  function startDetection() {
    setDetectionActive(true);
    frameCountRef.current = 0;
    lastFrameTimeRef.current = performance.now();
    if (fpsRafRef.current) cancelAnimationFrame(fpsRafRef.current);
    fpsRafRef.current = requestAnimationFrame(fpsLoop);
    if (emotionIntervalRef.current) window.clearInterval(emotionIntervalRef.current);
    emotionIntervalRef.current = window.setInterval(() => {
      const pick = DEMO_EMOTIONS[Math.floor(Math.random() * DEMO_EMOTIONS.length)];
      const conf = 82 + Math.floor(Math.random() * 17);
      setCurrent({ tag: pick.tag, icon: pick.icon, color: pick.color, conf });
      const time = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
      setHistory((prev) => [{ time, tag: pick.tag, color: pick.color, conf }, ...prev].slice(0, 8));
    }, 1800);
  }

  function stopDetection() {
    setDetectionActive(false);
    if (fpsRafRef.current) cancelAnimationFrame(fpsRafRef.current);
    if (emotionIntervalRef.current) window.clearInterval(emotionIntervalRef.current);
  }

  function resetForVideo(key: string) {
    const v = VIDEO_LIB[key];
    setPlaybackActive(false);
    setPlaybackElapsed(0);
    stopDetection();
    if (playbackIntervalRef.current) window.clearInterval(playbackIntervalRef.current);
    setCaption(`${v.name}.mp4 — ${v.duration}`);
    setCurrent({ ...v.demo });
    setHistory([{ time: "00:00", tag: v.demo.tag, color: v.demo.color, conf: v.demo.conf }]);
    setTimelineBars(buildTimelineHeights(v.tlColors));
  }

  function selectVideo(key: string) {
    setSelectedKey(key);
    resetForVideo(key);
  }

  function pausePlayback() {
    setPlaybackActive(false);
    stopDetection();
    if (playbackIntervalRef.current) window.clearInterval(playbackIntervalRef.current);
  }

  function startPlayback() {
    setPlaybackActive(true);
    startDetection();
    if (playbackIntervalRef.current) window.clearInterval(playbackIntervalRef.current);
    playbackIntervalRef.current = window.setInterval(() => {
      setPlaybackElapsed((prev) => {
        const next = prev + 0.5;
        if (next >= video.durationSec) {
          window.setTimeout(() => pausePlayback(), 0);
          return video.durationSec;
        }
        return next;
      });
    }, 500);
  }

  function togglePlayback() {
    if (playbackActive) pausePlayback();
    else startPlayback();
  }

  function seekPlayback(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    setPlaybackElapsed(ratio * video.durationSec);
  }

  // Stop everything on unmount (navigating to another page)
  useEffect(() => {
    return () => {
      stopDetection();
      if (playbackIntervalRef.current) window.clearInterval(playbackIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pct = video.durationSec ? (playbackElapsed / video.durationSec) * 100 : 0;

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
          <p className="subtitle">The model analyzes emotions frame by frame while the video plays.</p>
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
                  <span className="v-meta">
                    <svg className="icon-sm" aria-hidden="true">
                      <use href="#ic-clock" />
                    </svg>
                    {v.duration}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="video-frame">
            {playbackActive && (
              <div className="rec-badge" style={{ display: "flex" }}>
                <span className="rec-dot" /> LIVE
              </div>
            )}
            {playbackActive && (
              <div className="demo-metrics" style={{ display: "flex" }}>
                <span className="metric-chip">
                  <span className="dot-sm" /> AI analyzing
                </span>
                <span className="metric-chip">{fps} FPS</span>
                <span className="metric-chip">Confidence {current.conf}%</span>
              </div>
            )}
            <button className="play-btn" aria-label={playbackActive ? "Pause" : "Play video"} onClick={togglePlayback}>
              <svg className="icon" aria-hidden="true">
                <use href={playbackActive ? "#ic-pause" : "#ic-play"} />
              </svg>
            </button>
            <span className="video-caption">{caption}</span>
            {detectionActive && (
              <div
                ref={faceBoxRef}
                className="face-box"
                data-label={`Face · ${current.conf}%`}
                style={{ display: "block", top: "28%", left: "38%", width: "24%", height: "34%" }}
              />
            )}
            <div className="video-progress-wrap" style={{ display: "flex" }}>
              <div className="video-progress" onClick={seekPlayback}>
                <div className="video-progress-fill" style={{ width: `${pct.toFixed(1)}%` }} />
              </div>
              <span className="video-time">
                {fmtTime(playbackElapsed)} / {video.duration}
              </span>
            </div>
          </div>

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
                Emotion history <span className="muted">real-time</span>
              </div>
              <div className="emotion-history">
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
            <div className="card">
              <div className="chart-title">
                Timeline <span className="muted">{video.name}</span>
              </div>
              <div className="timeline">
                {timelineBars.map((bar, i) => (
                  <div
                    key={i}
                    className="tl-bar"
                    tabIndex={0}
                    data-tip={bar.tip}
                    style={{ height: `${bar.height.toFixed(0)}px`, background: bar.color, opacity: bar.opacity }}
                  />
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
