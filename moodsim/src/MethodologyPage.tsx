import logoMark from "./assets/logo-mark.png";

const LAYERS = [
  {
    n: 1,
    title: "Observation",
    text:
      "The house reads structured sensor state, not raw footage — which room someone is in, their posture, whether the TV, laptop, or phone is active, voice intensity, walking speed. This is the layer that makes the privacy story possible: everything above it works from abstracted signals, never a live camera feed.",
  },
  {
    n: 2,
    title: "Activity Guessing",
    text:
      "A Bayesian classifier weighs that sensor evidence against learned priors (time of day, room, posture) to infer what someone is likely doing — working, cooking, arguing — the same way a person would reason from indirect clues rather than watching directly.",
  },
  {
    n: 3,
    title: "Reasoning",
    text:
      "Rather than a black-box score, the system narrates its own inference in three steps — what it perceived, what it weighed against what, and what it concluded — so a guess like \"Clearly working\" is always traceable back to the evidence that produced it.",
  },
  {
    n: 4,
    title: "Emotional Context",
    text:
      "Individual moments get assembled into a day-level narrative. Transition rules distinguish genuine recovery from coping (e.g. distraction right after conflict reads differently than distraction after a long work session), and a recency-weighted model resolves \"how does this person feel right now\" — recent evidence matters more, but a single good moment can't erase a day of accumulated strain, and vice versa.",
  },
  {
    n: 5,
    title: "Adaptive Response",
    text:
      "The resolved emotional state drives real house commands — lighting, audio, gentle notifications — through rules that respect context: quiet hours cap intensity regardless of mood, and a low-confidence read deliberately produces a conservative default rather than an overconfident action.",
  },
];

export default function MethodologyPage() {
  return (
    <div className="main">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <svg className="icon-sm" aria-hidden="true">
              <use href="#ic-activity" />
            </svg>
            How it works
          </div>
          <h1>Methodology</h1>
          <p className="subtitle">Two systems working together: real emotion recognition, and a simulated reasoning pipeline built on top of it.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "var(--sp-5)" }}>
        <div className="char-section-title">
          <span style={{ fontSize: 18 }} aria-hidden="true">🎭</span>
          Multimodal Emotion Recognition
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--gray)" }}>
          Emotion detection combines two independent models: a face model reading 16 sampled frames per 5-second
          window, and an audio model reading the corresponding waveform. Each produces its own probability
          distribution across six emotions (anger, frustration, excited, neutral, sadness, happiness); the two are
          fused with a weighted average favoring audio (70%) over face (30%), since vocal tone tends to carry more
          reliable emotional signal than a single facial expression. The result is a distribution, not just a label —
          the system can express "mostly sad, with real leftover frustration" rather than forcing a single tag.
        </p>
      </div>

      <div className="card" style={{ marginBottom: "var(--sp-5)" }}>
        <div className="char-section-title">
          <span style={{ fontSize: 18 }} aria-hidden="true">🧩</span>
          The Five-Layer Simulation Pipeline
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--gray)", marginBottom: "var(--sp-4)" }}>
          The Day Builder doesn't just play back scripted events — it runs them through a pipeline that mirrors how
          a household might actually reason about a day, one layer building on the last.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
          {LAYERS.map((layer) => (
            <div key={layer.n} style={{ display: "flex", gap: 14 }}>
              <div
                style={{
                  flexShrink: 0,
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "var(--primary)",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {layer.n}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{layer.title}</div>
                <div style={{ fontSize: 13.5, lineHeight: 1.65, color: "var(--gray)" }}>{layer.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: "var(--sp-5)" }}>
        <div className="char-section-title">
          <span style={{ fontSize: 18 }} aria-hidden="true">🧠</span>
          The Character Model
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--gray)" }}>
          Every simulated person carries a psychological profile grounded in established models, not arbitrary
          numbers: Big Five personality traits shape how strongly they react (high neuroticism amplifies negative
          emotion, high extraversion amplifies positive), a PAD baseline (pleasure–arousal–dominance) sets their
          resting emotional state, and OCC-style goals and Frijda-style concerns give context for why certain events
          matter more to one person than another. The same event — a long work session, an argument — can land
          differently depending on who it's happening to.
        </p>
      </div>

      <div className="card" style={{ marginBottom: "var(--sp-5)" }}>
        <div className="char-section-title">
          <span style={{ fontSize: 18 }} aria-hidden="true">🔒</span>
          Privacy by Design
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--gray)" }}>
          The activity-guessing and reasoning layers never touch raw audio or video — they operate entirely on
          abstracted sensor state (booleans and floats: is the TV on, how fast is someone walking). Real emotion
          recognition is a separate, explicit step, applied only to specific clips being analyzed — it's never a
          standing surveillance layer running in the background of the simulation.
        </p>
      </div>

      <div className="card">
        <div className="char-section-title">
          <span style={{ fontSize: 18 }} aria-hidden="true">📚</span>
          Dataset &amp; Acknowledgments
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.7, color: "var(--gray)" }}>
          The Live Demo's face and audio emotion models were trained on the IEMOCAP database, collected by the
          Speech Analysis and Interpretation Laboratory (SAIL) at the University of Southern California. IEMOCAP is
          distributed under a non-commercial research license; this project uses it strictly for research and
          demonstration purposes, and the underlying recordings are not redistributed.
        </p>
        <p style={{ fontSize: 13, lineHeight: 1.6, color: "var(--gray)", marginTop: "var(--sp-3)" }}>
          Busso, C., Bulut, M., Lee, C.C., Kazemzadeh, A., Mower, E., Kim, S., Chang, J.N., Lee, S., &amp; Narayanan,
          S.S. (2008). IEMOCAP: Interactive emotional dyadic motion capture database. <em>Journal of Language
          Resources and Evaluation</em>, 42(4), 335–359.
        </p>
      </div>

      <img src={logoMark} alt="MoodStabilizer" className="page-watermark" />
    </div>
  );
}
