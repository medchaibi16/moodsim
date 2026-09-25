import logoMark from "./assets/logo-mark.png";

export default function ContactPage() {
  return (
    <div className="main">
      <div className="page-header">
        <div>
          <div className="eyebrow">
            <svg className="icon-sm" aria-hidden="true">
              <use href="#ic-user" />
            </svg>
            Get in touch
          </div>
          <h1>Contact</h1>
          <p className="subtitle">Research, internships, or a conversation about AI and human-centered systems.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: "var(--sp-4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14.5 }}>
          <span aria-hidden="true">📧</span>
          <span>
            Email: <a href="mailto:medchaibi965@proton.me">medchaibi965@proton.me</a>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14.5 }}>
          <span aria-hidden="true">🔗</span>
          <span>
            LinkedIn:{" "}
            <a href="https://linkedin.com/in/mohamed-chaibi-6037583a0" target="_blank" rel="noopener noreferrer">
              linkedin.com/in/mohamed-chaibi-6037583a0
            </a>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14.5 }}>
          <span aria-hidden="true">🐙</span>
          <span>
            GitHub:{" "}
            <a href="https://github.com/medchaibi16" target="_blank" rel="noopener noreferrer">
              github.com/medchaibi16
            </a>
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14.5 }}>
          <span aria-hidden="true">📍</span>
          <span>Location: Monastir, Tunisia (GMT+1)</span>
        </div>
        <p style={{ marginTop: "var(--sp-3)", fontSize: 14, lineHeight: 1.65, color: "var(--gray)" }}>
          I'm always open to connecting — whether it's for research collaborations, internship opportunities, or
          just a thoughtful conversation about AI and human-centered systems. Feel free to reach out!
        </p>
      </div>

      <img src={logoMark} alt="MoodStabilizer" className="page-watermark" />
    </div>
  );
}
