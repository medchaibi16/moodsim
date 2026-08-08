import { useMemo, useState } from "react";
import logoMark from "./assets/logo-mark.png";

/* ============================================================
   Types
============================================================ */
type EmoKey = "happiness" | "sadness" | "anger" | "frustration" | "neutral" | "excited";

interface AnalyticsVideo {
  total_clips: number;
  duration: number; // seconds
  avg_confidence: number; // 0..1
  distribution: Partial<Record<EmoKey, number>>;
  filename: string;
  dominant_emotion: EmoKey;
}

/* ============================================================
   Real precomputed dataset — kept exactly as provided (grouped by
   dominant emotion), we only read from it, never restructure it.
============================================================ */
const ANALYTICS_RAW: Record<EmoKey, AnalyticsVideo[]> = {"anger":[{"total_clips":23,"duration":110,"avg_confidence":0.653,"distribution":{"anger":11,"frustration":6,"neutral":3,"excited":2,"sadness":1},"filename":"Ses01F_impro01.avi","dominant_emotion":"anger"},{"total_clips":44,"duration":215,"avg_confidence":0.686,"distribution":{"anger":16,"frustration":10,"neutral":9,"excited":6,"happiness":2,"sadness":1},"filename":"Ses01F_impro05.avi","dominant_emotion":"anger"},{"total_clips":31,"duration":150,"avg_confidence":0.694,"distribution":{"anger":20,"frustration":5,"sadness":3,"excited":2,"neutral":1},"filename":"Ses01F_script01_2.avi","dominant_emotion":"anger"},{"total_clips":64,"duration":315,"avg_confidence":0.713,"distribution":{"anger":29,"excited":14,"frustration":9,"happiness":5,"neutral":4,"sadness":3},"filename":"Ses01F_script03_2.avi","dominant_emotion":"anger"},{"total_clips":34,"duration":165,"avg_confidence":0.675,"distribution":{"anger":16,"frustration":11,"excited":5,"sadness":2},"filename":"Ses01M_impro01.avi","dominant_emotion":"anger"},{"total_clips":42,"duration":205,"avg_confidence":0.691,"distribution":{"anger":14,"frustration":11,"neutral":7,"excited":7,"sadness":2,"happiness":1},"filename":"Ses01M_impro05.avi","dominant_emotion":"anger"},{"total_clips":86,"duration":425,"avg_confidence":0.712,"distribution":{"anger":31,"frustration":24,"sadness":20,"neutral":8,"excited":3},"filename":"Ses01M_script01_1.avi","dominant_emotion":"anger"},{"total_clips":69,"duration":340,"avg_confidence":0.7,"distribution":{"anger":40,"excited":14,"frustration":7,"sadness":5,"neutral":2,"happiness":1},"filename":"Ses01M_script03_2.avi","dominant_emotion":"anger"},{"total_clips":51,"duration":250,"avg_confidence":0.696,"distribution":{"anger":24,"excited":13,"frustration":11,"neutral":2,"sadness":1},"filename":"Ses02F_script03_2.avi","dominant_emotion":"anger"},{"total_clips":52,"duration":255,"avg_confidence":0.68,"distribution":{"anger":26,"excited":13,"frustration":6,"happiness":4,"sadness":2,"neutral":1},"filename":"Ses02M_script03_2.avi","dominant_emotion":"anger"}],"sadness":[{"total_clips":42,"duration":205,"avg_confidence":0.726,"distribution":{"sadness":35,"neutral":4,"happiness":2,"frustration":1},"filename":"Ses01F_impro02.avi","dominant_emotion":"sadness"},{"total_clips":64,"duration":315,"avg_confidence":0.713,"distribution":{"sadness":46,"happiness":10,"neutral":7,"frustration":1},"filename":"Ses01F_impro06.avi","dominant_emotion":"sadness"},{"total_clips":94,"duration":465,"avg_confidence":0.714,"distribution":{"sadness":54,"happiness":16,"neutral":14,"frustration":5,"excited":4,"anger":1},"filename":"Ses01F_script01_3.avi","dominant_emotion":"sadness"},{"total_clips":97,"duration":480,"avg_confidence":0.704,"distribution":{"sadness":33,"frustration":20,"neutral":15,"excited":11,"anger":10,"happiness":8},"filename":"Ses01F_script02_2.avi","dominant_emotion":"sadness"},{"total_clips":45,"duration":220,"avg_confidence":0.705,"distribution":{"sadness":36,"excited":3,"neutral":3,"frustration":2,"anger":1},"filename":"Ses01M_impro02.avi","dominant_emotion":"sadness"},{"total_clips":50,"duration":245,"avg_confidence":0.693,"distribution":{"sadness":37,"happiness":6,"neutral":5,"frustration":2},"filename":"Ses01M_impro06.avi","dominant_emotion":"sadness"},{"total_clips":105,"duration":520,"avg_confidence":0.721,"distribution":{"sadness":69,"happiness":21,"excited":7,"neutral":4,"frustration":3,"anger":1},"filename":"Ses01M_script01_3.avi","dominant_emotion":"sadness"},{"total_clips":110,"duration":545,"avg_confidence":0.702,"distribution":{"sadness":35,"frustration":19,"anger":18,"neutral":17,"excited":13,"happiness":8},"filename":"Ses01M_script02_2.avi","dominant_emotion":"sadness"},{"total_clips":43,"duration":210,"avg_confidence":0.716,"distribution":{"sadness":28,"frustration":5,"happiness":5,"neutral":3,"anger":1,"excited":1},"filename":"Ses02F_impro02.avi","dominant_emotion":"sadness"},{"total_clips":45,"duration":220,"avg_confidence":0.714,"distribution":{"sadness":29,"happiness":10,"neutral":3,"excited":2,"anger":1},"filename":"Ses02F_impro06.avi","dominant_emotion":"sadness"},{"total_clips":73,"duration":360,"avg_confidence":0.728,"distribution":{"sadness":34,"happiness":22,"excited":8,"frustration":7,"neutral":2},"filename":"Ses02F_script01_3.avi","dominant_emotion":"sadness"},{"total_clips":84,"duration":415,"avg_confidence":0.718,"distribution":{"sadness":19,"frustration":17,"happiness":16,"anger":15,"excited":11,"neutral":6},"filename":"Ses02F_script02_2.avi","dominant_emotion":"sadness"},{"total_clips":38,"duration":185,"avg_confidence":0.715,"distribution":{"sadness":27,"happiness":8,"frustration":1,"neutral":1,"excited":1},"filename":"Ses02M_impro02.avi","dominant_emotion":"sadness"},{"total_clips":52,"duration":255,"avg_confidence":0.709,"distribution":{"sadness":41,"happiness":7,"neutral":3,"excited":1},"filename":"Ses02M_impro06.avi","dominant_emotion":"sadness"},{"total_clips":79,"duration":390,"avg_confidence":0.728,"distribution":{"sadness":41,"happiness":22,"excited":10,"frustration":4,"neutral":2},"filename":"Ses02M_script01_3.avi","dominant_emotion":"sadness"},{"total_clips":64,"duration":315,"avg_confidence":0.683,"distribution":{"sadness":37,"excited":10,"happiness":10,"neutral":4,"frustration":3},"filename":"Ses03F_impro02.avi","dominant_emotion":"sadness"}],"happiness":[{"total_clips":25,"duration":120,"avg_confidence":0.754,"distribution":{"happiness":18,"excited":5,"neutral":1,"sadness":1},"filename":"Ses01F_impro03.avi","dominant_emotion":"happiness"},{"total_clips":84,"duration":415,"avg_confidence":0.694,"distribution":{"happiness":19,"frustration":17,"anger":15,"excited":14,"sadness":12,"neutral":7},"filename":"Ses02M_script02_2.avi","dominant_emotion":"happiness"}],"neutral":[{"total_clips":41,"duration":200,"avg_confidence":0.674,"distribution":{"neutral":17,"frustration":13,"anger":5,"excited":3,"happiness":2,"sadness":1},"filename":"Ses01F_impro04.avi","dominant_emotion":"neutral"},{"total_clips":59,"duration":290,"avg_confidence":0.66,"distribution":{"neutral":18,"frustration":18,"sadness":9,"excited":6,"happiness":6,"anger":2},"filename":"Ses02F_impro04.avi","dominant_emotion":"neutral"},{"total_clips":56,"duration":275,"avg_confidence":0.7,"distribution":{"neutral":25,"frustration":11,"excited":9,"anger":6,"happiness":3,"sadness":2},"filename":"Ses02F_impro05.avi","dominant_emotion":"neutral"},{"total_clips":42,"duration":205,"avg_confidence":0.714,"distribution":{"neutral":22,"excited":9,"frustration":6,"happiness":5},"filename":"Ses02F_impro08.avi","dominant_emotion":"neutral"},{"total_clips":50,"duration":245,"avg_confidence":0.693,"distribution":{"neutral":20,"frustration":17,"anger":6,"excited":5,"happiness":2},"filename":"Ses02M_impro05.avi","dominant_emotion":"neutral"},{"total_clips":45,"duration":220,"avg_confidence":0.704,"distribution":{"neutral":22,"excited":17,"happiness":3,"sadness":2,"frustration":1},"filename":"Ses02M_impro08.avi","dominant_emotion":"neutral"}],"excited":[{"total_clips":29,"duration":140,"avg_confidence":0.732,"distribution":{"excited":17,"happiness":10,"neutral":2},"filename":"Ses01F_impro07.avi","dominant_emotion":"excited"},{"total_clips":67,"duration":330,"avg_confidence":0.716,"distribution":{"excited":25,"neutral":13,"frustration":13,"happiness":8,"sadness":4,"anger":4},"filename":"Ses01F_script02_1.avi","dominant_emotion":"excited"},{"total_clips":57,"duration":280,"avg_confidence":0.719,"distribution":{"excited":29,"happiness":19,"frustration":5,"neutral":3,"anger":1},"filename":"Ses01F_script03_1.avi","dominant_emotion":"excited"},{"total_clips":32,"duration":155,"avg_confidence":0.747,"distribution":{"excited":28,"happiness":2,"sadness":1,"neutral":1},"filename":"Ses01M_impro03.avi","dominant_emotion":"excited"},{"total_clips":43,"duration":210,"avg_confidence":0.736,"distribution":{"excited":30,"happiness":11,"sadness":1,"neutral":1},"filename":"Ses01M_impro07.avi","dominant_emotion":"excited"},{"total_clips":82,"duration":405,"avg_confidence":0.707,"distribution":{"excited":29,"frustration":15,"sadness":14,"neutral":11,"happiness":7,"anger":6},"filename":"Ses01M_script02_1.avi","dominant_emotion":"excited"},{"total_clips":61,"duration":300,"avg_confidence":0.756,"distribution":{"excited":32,"happiness":21,"sadness":3,"frustration":2,"neutral":2,"anger":1},"filename":"Ses01M_script03_1.avi","dominant_emotion":"excited"},{"total_clips":51,"duration":250,"avg_confidence":0.738,"distribution":{"excited":27,"happiness":23,"anger":1},"filename":"Ses02F_impro03.avi","dominant_emotion":"excited"},{"total_clips":42,"duration":205,"avg_confidence":0.732,"distribution":{"excited":32,"happiness":8,"frustration":1,"neutral":1},"filename":"Ses02F_impro07.avi","dominant_emotion":"excited"},{"total_clips":59,"duration":290,"avg_confidence":0.714,"distribution":{"excited":36,"neutral":8,"frustration":6,"anger":4,"happiness":3,"sadness":2},"filename":"Ses02F_script02_1.avi","dominant_emotion":"excited"},{"total_clips":44,"duration":215,"avg_confidence":0.72,"distribution":{"excited":27,"happiness":12,"neutral":4,"anger":1},"filename":"Ses02F_script03_1.avi","dominant_emotion":"excited"},{"total_clips":39,"duration":190,"avg_confidence":0.749,"distribution":{"excited":20,"happiness":17,"neutral":2},"filename":"Ses02M_impro03.avi","dominant_emotion":"excited"},{"total_clips":36,"duration":175,"avg_confidence":0.72,"distribution":{"excited":22,"happiness":10,"sadness":2,"neutral":1,"frustration":1},"filename":"Ses02M_impro07.avi","dominant_emotion":"excited"},{"total_clips":64,"duration":315,"avg_confidence":0.737,"distribution":{"excited":44,"frustration":11,"neutral":4,"sadness":2,"happiness":2,"anger":1},"filename":"Ses02M_script02_1.avi","dominant_emotion":"excited"},{"total_clips":44,"duration":215,"avg_confidence":0.73,"distribution":{"excited":31,"happiness":9,"neutral":3,"anger":1},"filename":"Ses02M_script03_1.avi","dominant_emotion":"excited"}],"frustration":[{"total_clips":87,"duration":430,"avg_confidence":0.704,"distribution":{"frustration":29,"sadness":20,"anger":16,"neutral":14,"excited":5,"happiness":3},"filename":"Ses01F_script01_1.avi","dominant_emotion":"frustration"},{"total_clips":39,"duration":190,"avg_confidence":0.663,"distribution":{"frustration":13,"neutral":12,"excited":7,"sadness":5,"happiness":2},"filename":"Ses01M_impro04.avi","dominant_emotion":"frustration"},{"total_clips":34,"duration":165,"avg_confidence":0.695,"distribution":{"frustration":13,"anger":11,"sadness":7,"excited":1,"neutral":1,"happiness":1},"filename":"Ses01M_script01_2.avi","dominant_emotion":"frustration"},{"total_clips":44,"duration":215,"avg_confidence":0.67,"distribution":{"frustration":23,"neutral":7,"excited":4,"sadness":4,"anger":4,"happiness":2},"filename":"Ses02F_impro01.avi","dominant_emotion":"frustration"},{"total_clips":72,"duration":355,"avg_confidence":0.676,"distribution":{"frustration":31,"sadness":16,"anger":14,"neutral":5,"happiness":4,"excited":2},"filename":"Ses02F_script01_1.avi","dominant_emotion":"frustration"},{"total_clips":25,"duration":120,"avg_confidence":0.696,"distribution":{"frustration":11,"anger":11,"excited":2,"neutral":1},"filename":"Ses02F_script01_2.avi","dominant_emotion":"frustration"},{"total_clips":32,"duration":155,"avg_confidence":0.688,"distribution":{"frustration":13,"excited":10,"neutral":6,"anger":2,"happiness":1},"filename":"Ses02M_impro01.avi","dominant_emotion":"frustration"},{"total_clips":44,"duration":215,"avg_confidence":0.702,"distribution":{"frustration":14,"excited":9,"sadness":9,"neutral":6,"happiness":6},"filename":"Ses02M_impro04.avi","dominant_emotion":"frustration"},{"total_clips":72,"duration":355,"avg_confidence":0.677,"distribution":{"frustration":19,"anger":19,"sadness":18,"excited":9,"neutral":5,"happiness":2},"filename":"Ses02M_script01_1.avi","dominant_emotion":"frustration"},{"total_clips":26,"duration":125,"avg_confidence":0.685,"distribution":{"frustration":15,"anger":7,"excited":3,"sadness":1},"filename":"Ses02M_script01_2.avi","dominant_emotion":"frustration"},{"total_clips":17,"duration":80,"avg_confidence":0.669,"distribution":{"frustration":6,"anger":4,"excited":3,"happiness":2,"neutral":1,"sadness":1},"filename":"Ses03F_impro01.avi","dominant_emotion":"frustration"}]};

const ANALYTICS_VIDEOS: AnalyticsVideo[] = Object.values(ANALYTICS_RAW).flat();

/* ============================================================
   Visual metadata per emotion label (reuses the app's CSS tokens)
============================================================ */
const EMO_META: Record<EmoKey, { label: string; color: string; icon: string }> = {
  happiness: { label: "Happiness", color: "var(--success)", icon: "ic-smile" },
  sadness: { label: "Sadness", color: "var(--primary)", icon: "ic-frown" },
  anger: { label: "Anger", color: "var(--danger)", icon: "ic-angry" },
  frustration: { label: "Frustration", color: "var(--secondary)", icon: "ic-meh-scared" },
  neutral: { label: "Neutral", color: "var(--gray)", icon: "ic-meh-scared" },
  excited: { label: "Excited", color: "var(--accent)", icon: "ic-activity" },
};
const EMO_ORDER: EmoKey[] = ["happiness", "excited", "neutral", "frustration", "sadness", "anger"];

function emoMeta(key: string) {
  return EMO_META[key as EmoKey] ?? { label: key, color: "var(--gray-dim)", icon: "ic-meh-scared" };
}

/* ============================================================
   Formatting helpers — ported 1:1 from the HTML prototype
============================================================ */
function fmtDurationShort(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}
function fmtDurationLong(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function fmtPct(x: number) {
  return (Math.round(x * 10) / 10).toString().replace(/\.0$/, "") + "%";
}

// Per-video emotion breakdown, sorted by count, computed from the
// video's own `distribution` object (percentages of its own total_clips).
function videoBreakdown(v: AnalyticsVideo) {
  const total = v.total_clips || Object.values(v.distribution).reduce((a, b) => a + (b ?? 0), 0);
  return Object.entries(v.distribution)
    .map(([key, count]) => ({ key, count: count ?? 0, pct: total ? ((count ?? 0) / total) * 100 : 0 }))
    .sort((a, b) => b.count - a.count);
}

/* ============================================================
   Component
============================================================ */
export default function StatsPage() {
  const [activeCategory, setActiveCategory] = useState<"all" | EmoKey>("all");
  const [search, setSearch] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Indexed dataset (index kept stable across filtering, matches original)
  const indexed = useMemo(
    () => ANALYTICS_VIDEOS.map((v, idx) => ({ v, idx })),
    []
  );

  // Chip counts (dataset-wide, never affected by the current filter)
  const chipCounts = useMemo(() => {
    const counts: Partial<Record<EmoKey, number>> = {};
    ANALYTICS_VIDEOS.forEach((v) => {
      counts[v.dominant_emotion] = (counts[v.dominant_emotion] ?? 0) + 1;
    });
    return counts;
  }, []);

  const chips = useMemo(
    () => [
      { key: "all" as const, label: "All", count: ANALYTICS_VIDEOS.length, color: "var(--gray)" },
      ...EMO_ORDER.filter((k) => chipCounts[k]).map((k) => ({
        key: k,
        label: emoMeta(k).label,
        count: chipCounts[k] ?? 0,
        color: emoMeta(k).color,
      })),
    ],
    [chipCounts]
  );

  // Filtered list (category chip + filename search)
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return indexed
      .filter(({ v }) => activeCategory === "all" || v.dominant_emotion === activeCategory)
      .filter(({ v }) => !term || v.filename.toLowerCase().includes(term));
  }, [indexed, activeCategory, search]);

  // Keep selection valid: fall back to the first visible item if the
  // current selection is filtered out.
  const effectiveIdx = filtered.some(({ idx }) => idx === selectedIdx)
    ? selectedIdx
    : filtered[0]?.idx;

  const currentVideo = effectiveIdx !== undefined ? ANALYTICS_VIDEOS[effectiveIdx] : undefined;

  const breakdown = useMemo(
    () => (currentVideo ? videoBreakdown(currentVideo) : []),
    [currentVideo]
  );

  const donutGradient = useMemo(() => {
    if (breakdown.length === 0) return undefined;
    const total = breakdown.reduce((a, b) => a + b.count, 0) || 1;
    let acc = 0;
    const stops = breakdown.map((b) => {
      const start = acc;
      const end = acc + (b.count / total) * 100;
      acc = end;
      return `${emoMeta(b.key).color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [breakdown]);

  // Dataset-wide aggregates — constant, never change with the selected video
  const aggregates = useMemo(() => {
    const n = ANALYTICS_VIDEOS.length;
    const totalClips = ANALYTICS_VIDEOS.reduce((a, v) => a + v.total_clips, 0);
    const totalDuration = ANALYTICS_VIDEOS.reduce((a, v) => a + v.duration, 0);
    const avgConfidence =
      ANALYTICS_VIDEOS.reduce((a, v) => a + v.avg_confidence, 0) / n;
    const topCat = Object.entries(chipCounts).sort((a, b) => b[1]! - a[1]!)[0] as
      | [EmoKey, number]
      | undefined;
    const maxCount = Math.max(...EMO_ORDER.map((k) => chipCounts[k] ?? 0));
    return { n, totalClips, totalDuration, avgConfidence, topCat, maxCount };
  }, [chipCounts]);

  // Values driving the "Dataset composition" bar chart: mirrors the
  // Emotion breakdown donut — shows the selected video's own distribution,
  // falling back to the dataset-wide counts when no video is selected.
  const compositionCounts = useMemo(() => {
    const counts: Partial<Record<EmoKey, number>> = {};
    EMO_ORDER.forEach((k) => {
      counts[k] = currentVideo ? currentVideo.distribution[k] ?? 0 : chipCounts[k] ?? 0;
    });
    return counts;
  }, [currentVideo, chipCounts]);

  const compositionMax = useMemo(
    () => Math.max(1, ...EMO_ORDER.map((k) => compositionCounts[k] ?? 0)),
    [compositionCounts]
  );

  const compositionUnit = currentVideo ? "clips" : "videos";

  function handleSelectVideo(idx: number) {
    setSelectedIdx(idx);
  }

  return (
    <div className="main">
      {/* Page header */}
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <svg className="icon-sm" aria-hidden="true">
              <use href="#ic-chart" />
            </svg>
            Precomputed data
          </div>
          <h1>Statistics</h1>
          <p className="subtitle">
            Aggregated results from all analyzed sessions in the dataset.
          </p>
        </div>
        <span className="pill pill-success">
          <span className="dot" /> Data up to date
        </span>
      </div>

      {/* Mini stat cards — dataset-wide */}
      <div className="stat-mini-row">
        <div className="card stat-mini">
          <div
            className="ic-wrap"
            style={{
              background: "rgba(28,95,174,0.14)",
              color: aggregates.topCat ? emoMeta(aggregates.topCat[0]).color : "var(--accent)",
            }}
          >
            <svg className="icon" aria-hidden="true">
              <use href={aggregates.topCat ? `#${emoMeta(aggregates.topCat[0]).icon}` : "#ic-smile"} />
            </svg>
          </div>
          <div>
            <div className="mv">
              {aggregates.topCat ? `${emoMeta(aggregates.topCat[0]).label} · ${aggregates.topCat[1]} videos` : "—"}
            </div>
            <div className="ml">Most common emotion</div>
          </div>
        </div>

        <div className="card stat-mini">
          <div
            className="ic-wrap"
            style={{ background: "rgba(91,79,232,0.14)", color: "var(--primary)" }}
          >
            <svg className="icon" aria-hidden="true">
              <use href="#ic-check" />
            </svg>
          </div>
          <div>
            <div className="mv">{fmtPct(aggregates.avgConfidence * 100)}</div>
            <div className="ml">Avg. confidence (dataset)</div>
          </div>
        </div>

        <div className="card stat-mini">
          <div
            className="ic-wrap"
            style={{ background: "rgba(232,116,106,0.14)", color: "var(--secondary)" }}
          >
            <svg className="icon" aria-hidden="true">
              <use href="#ic-film" />
            </svg>
          </div>
          <div>
            <div className="mv">{aggregates.n}</div>
            <div className="ml">Videos analyzed</div>
          </div>
        </div>
      </div>

      {/* Main layout: video list (search + filter) + charts */}
      <div className="stats-layout">
        <div className="card video-list-card">
          <div className="video-list-title">
            <svg className="icon-sm" aria-hidden="true">
              <use href="#ic-video" />
            </svg>
            Dataset videos ({filtered.length})
          </div>

          <div className="stats-search-wrap">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth={2} />
              <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
            </svg>
            <input
              type="text"
              className="stats-search"
              placeholder="Search by filename…"
              aria-label="Search videos by filename"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="stats-chip-row">
            {chips.map((c) => (
              <button
                key={c.key}
                type="button"
                className={`stats-chip${activeCategory === c.key ? " active" : ""}`}
                onClick={() => setActiveCategory(c.key)}
              >
                {c.key !== "all" && <span className="chip-dot" style={{ background: c.color }} />}
                {c.label} ({c.count})
              </button>
            ))}
          </div>

          <div className="video-list" role="listbox" aria-label="List of precomputed videos">
            {filtered.length === 0 ? (
              <div className="stats-empty">No videos match this search/filter.</div>
            ) : (
              filtered.map(({ v, idx }) => {
                const meta = emoMeta(v.dominant_emotion);
                return (
                  <div
                    key={v.filename}
                    className={`video-item${idx === effectiveIdx ? " active" : ""}`}
                    role="option"
                    aria-selected={idx === effectiveIdx}
                    tabIndex={0}
                    onClick={() => handleSelectVideo(idx)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") handleSelectVideo(idx);
                    }}
                  >
                    <span className="v-name">{v.filename}</span>
                    <span className="v-meta">
                      <span className="v-dot" style={{ background: meta.color }} />
                      {meta.label} ·{" "}
                      <svg className="icon-sm" aria-hidden="true">
                        <use href="#ic-clock" />
                      </svg>{" "}
                      {fmtDurationShort(v.duration)} · {v.total_clips} clips
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <div className="chart-row">
            {/* Emotion breakdown donut (per selected video) */}
            <div className="card">
              <div className="chart-title">
                Emotion breakdown <span className="muted">{currentVideo?.filename ?? "—"}</span>
              </div>
              <div
                className="donut"
                role="img"
                style={{ background: donutGradient }}
                aria-label={
                  breakdown.length
                    ? "Emotion breakdown: " +
                      breakdown.map((b) => `${fmtPct(b.pct)} ${emoMeta(b.key).label}`).join(", ")
                    : "Emotion breakdown"
                }
              >
                <div className="donut-label">
                  <b>{breakdown[0] ? fmtPct(breakdown[0].pct) : "—"}</b>
                  <span>{breakdown[0] ? emoMeta(breakdown[0].key).label : "Dominant"}</span>
                </div>
              </div>

              <div className="legend">
                {breakdown.map((b) => (
                  <div className="legend-item" key={b.key}>
                    <span className="legend-dot" style={{ background: emoMeta(b.key).color }} />
                    {emoMeta(b.key).label} — <b>{fmtPct(b.pct)}</b>{" "}
                    <span style={{ color: "var(--gray-dim)" }}>({b.count} clips)</span>
                  </div>
                ))}
              </div>

              {currentVideo && (
                <div className="video-detail-row">
                  <div className="vd-item">
                    <div className="vd-val">{currentVideo.total_clips}</div>
                    <div className="vd-lbl">Analyzed clips</div>
                  </div>
                  <div className="vd-item">
                    <div className="vd-val">{fmtDurationShort(currentVideo.duration)}</div>
                    <div className="vd-lbl">Duration</div>
                  </div>
                  <div className="vd-item">
                    <div className="vd-val">{fmtPct(currentVideo.avg_confidence * 100)}</div>
                    <div className="vd-lbl">Avg. confidence</div>
                  </div>
                </div>
              )}
            </div>

            {/* Dataset composition bar chart (per selected video, dataset-wide by default) */}
            <div className="card">
              <div className="chart-title">
                Dataset composition{" "}
                <span className="muted">
                  {currentVideo ? currentVideo.filename : "by dominant emotion"}
                </span>
              </div>
              <div className="bars">
                {EMO_ORDER.map((k) => {
                  const c = compositionCounts[k] ?? 0;
                  const h = compositionMax ? Math.max(6, (c / compositionMax) * 100) : 0;
                  const meta = emoMeta(k);
                  return (
                    <div
                      key={k}
                      className="bar"
                      style={{ height: `${h}%`, background: meta.color, opacity: c ? 1 : 0.25 }}
                      title={`${meta.label}: ${c} ${compositionUnit}`}
                    >
                      <span className="bar-val">{c}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: "var(--sp-4)", marginTop: 2 }}>
                {EMO_ORDER.map((k) => (
                  <span className="bar-lbl" style={{ flex: 1 }} key={k}>
                    {emoMeta(k).label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Dataset information (constant totals) */}
          <div className="card">
            <div className="chart-title">Dataset information</div>
            <div className="dataset-info-grid">
              <div className="dataset-info-item">
                <div className="di-val">{aggregates.n}</div>
                <div className="di-lbl">Videos</div>
              </div>
              <div className="dataset-info-item">
                <div className="di-val">{aggregates.totalClips.toLocaleString("en-US")}</div>
                <div className="di-lbl">Total clips</div>
              </div>
              <div className="dataset-info-item">
                <div className="di-val">{fmtDurationLong(aggregates.totalDuration)}</div>
                <div className="di-lbl">Total duration</div>
              </div>
              <div className="dataset-info-item">
                <div className="di-val">{fmtPct(aggregates.avgConfidence * 100)}</div>
                <div className="di-lbl">Avg. confidence</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <img src={logoMark} alt="MoodStabilizer" className="page-watermark" />
    </div>
  );
}
