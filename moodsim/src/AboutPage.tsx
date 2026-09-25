import logoMark from "./assets/logo-mark.png";

export default function AboutPage() {
  return (
    <div className="main">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <svg className="icon-sm" aria-hidden="true">
              <use href="#ic-info" />
            </svg>
            About the project
          </div>
          <h1>About</h1>
          <p className="subtitle">The person behind MoodStabilizer.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <p style={{ fontSize: 15, lineHeight: 1.75 }}>
          I'm Mohamed Chaibi, a computer science major from the Faculté des Sciences de Monastir in Tunisia, with a
          deep passion for human-centered AI, affective computing, and privacy-preserving systems. I believe
          technology should adapt to people — not the other way around. My work focuses on building intelligent
          systems that understand human emotions while respecting personal data. I'm currently exploring how AI can
          create adaptive environments that respond to emotional states, and I'm always looking for research
          opportunities to grow and contribute.
        </p>
      </div>

      <img src={logoMark} alt="MoodStabilizer" className="page-watermark" />
    </div>
  );
}
