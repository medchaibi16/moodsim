type NavTarget = "stats" | "demo" | "character" | "prototype";

interface HomePageProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  onNavigate: (page: NavTarget) => void;
}

export default function HomePage({ darkMode, onToggleTheme, onNavigate }: HomePageProps) {
  function go(page: NavTarget) {
    return () => onNavigate(page);
  }

  function goOnEnter(page: NavTarget) {
    return (e: React.KeyboardEvent) => {
      if (e.key === "Enter") onNavigate(page);
    };
  }

  return (
    <div id="home">
      <div className="app">
        <div className="main" id="main-content">
          <div className="lp-topbar">
            MoodStabilizer <span>v1.0</span> — AI emotional-analysis research prototype
          </div>

          <header>
            <div className="wrap">
              <nav>
                <div className="logo">
                  <span className="dot" />
                  Mood<span style={{ color: "var(--primary)" }}>Stabilizer</span>
                </div>
                <div className="navlinks">
                  <span tabIndex={0} role="button" onClick={go("stats")} onKeyDown={goOnEnter("stats")}>
                    Statistics
                  </span>
                  <span tabIndex={0} role="button" onClick={go("demo")} onKeyDown={goOnEnter("demo")}>
                    Live Demo
                  </span>
                  <span tabIndex={0} role="button" onClick={go("character")} onKeyDown={goOnEnter("character")}>
                    Character
                  </span>
                  <span tabIndex={0} role="button" onClick={go("prototype")} onKeyDown={goOnEnter("prototype")}>
                    Day Builder
                  </span>
                  <span tabIndex={0} role="button">
                    About
                  </span>
                </div>
                <div className="navcta">
                  <button className="lp-btn-ghost" onClick={onToggleTheme}>
                    {darkMode ? "Light mode" : "Dark mode"}
                  </button>
                  <button className="lp-btn-solid" onClick={go("demo")}>
                    Launch demo
                  </button>
                </div>
              </nav>
            </div>
          </header>

          <div className="wrap">
            <div className="lp-hero">
              <div>
                <div className="lp-eyebrow">
                  <span className="live" />
                  254 sessions analyzed this week
                </div>
                <h1>
                  Understand your emotions,
                  <br />
                  day after <span>day</span>.
                </h1>
                <p className="lp-sub">
                  MoodStabilizer detects facial expressions with AI, simulates a typical day, and helps you improve
                  your everyday wellbeing.
                </p>
                <div className="lp-cta-row">
                  <button className="lp-btn-solid" onClick={go("demo")}>
                    Launch demo
                  </button>
                  <button className="lp-link" onClick={go("stats")}>
                    View statistics
                    <svg className="icon-sm" aria-hidden="true">
                      <use href="#ic-arrow-right" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="lp-preview">
                <div className="lp-preview-top">
                  <span className="label">Live session</span>
                  <span className="badge">Analysis active</span>
                </div>
                <div className="lp-emo-row">
                  <div className="lp-emo">
                    <div className="bar">
                      <div className="fill" style={{ height: "70%", background: "var(--primary)" }} />
                    </div>
                    <div className="lbl">Calm</div>
                  </div>
                  <div className="lp-emo">
                    <div className="bar">
                      <div className="fill" style={{ height: "40%", background: "var(--accent)" }} />
                    </div>
                    <div className="lbl">Joy</div>
                  </div>
                  <div className="lp-emo">
                    <div className="bar">
                      <div className="fill" style={{ height: "22%", background: "var(--secondary)" }} />
                    </div>
                    <div className="lbl">Stress</div>
                  </div>
                  <div className="lp-emo">
                    <div className="bar">
                      <div className="fill" style={{ height: "55%", background: "var(--success)" }} />
                    </div>
                    <div className="lbl">Focus</div>
                  </div>
                </div>
                <div className="lp-preview-graph">
                  <svg viewBox="0 0 300 90" width="100%" height="100%" fill="none">
                    <path
                      d="M0 60 Q 30 20, 60 45 T 120 40 T 180 55 T 240 25 T 300 38"
                      stroke="#5B4FE8"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="lp-section-head">
              <div className="lp-eyebrow-sm">Features</div>
              <h2>Three ways to understand what you're feeling</h2>
            </div>

            <div className="lp-features">
              <div
                className="feature-row"
                tabIndex={0}
                role="button"
                aria-label="Open the Statistics page"
                onClick={go("stats")}
                onKeyDown={goOnEnter("stats")}
              >
                <div className="feature-num">01</div>
                <div className="feature-head">
                  <div className="lp-icon" style={{ background: "var(--card-icon-green-bg)" }}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--card-icon-green-fg)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 20V10M10 20V4M17 20v-7" />
                    </svg>
                  </div>
                  <h3>Statistics</h3>
                </div>
                <div className="feature-desc">
                  <p>Visualize precomputed emotions across the whole dataset, video by video.</p>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onNavigate("stats");
                    }}
                  >
                    View analytics →
                  </a>
                </div>
              </div>
              <div
                className="feature-row"
                tabIndex={0}
                role="button"
                aria-label="Open the Live Demo page"
                onClick={go("demo")}
                onKeyDown={goOnEnter("demo")}
              >
                <div className="feature-num">02</div>
                <div className="feature-head">
                  <div className="lp-icon" style={{ background: "var(--card-icon-blue-bg)" }}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--card-icon-blue-fg)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="2" y="6" width="14" height="12" rx="2" />
                      <path d="M16 10l6-3v10l-6-3" />
                    </svg>
                  </div>
                  <h3>Live Demo</h3>
                </div>
                <div className="feature-desc">
                  <p>The AI model analyzes emotions frame by frame while the video plays.</p>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onNavigate("demo");
                    }}
                  >
                    Launch the demo →
                  </a>
                </div>
              </div>
              <div
                className="feature-row"
                tabIndex={0}
                role="button"
                aria-label="Open the Prototype page"
                onClick={go("prototype")}
                onKeyDown={goOnEnter("prototype")}
              >
                <div className="feature-num">03</div>
                <div className="feature-head">
                  <div className="lp-icon" style={{ background: "var(--card-icon-purple-bg)" }}>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--card-icon-purple-fg)"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                  </div>
                  <h3>Prototype</h3>
                </div>
                <div className="feature-desc">
                  <p>Compose a simulated day — actions, movement, context — and run the model.</p>
                  <a
                    href="#"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onNavigate("prototype");
                    }}
                  >
                    Create a simulation →
                  </a>
                </div>
              </div>
            </div>

            <div className="lp-quote">
              <p>
                "We think we know our emotions. Seeing them analyzed day after day, we realize just how much they
                elude us."
              </p>
              <div className="who">Research team — MoodStabilizer</div>
            </div>

            <div className="lp-cta-band">
              <div>
                <h3>Ready to understand yourself better?</h3>
                <p>Launch a live demo, no sign-up required.</p>
              </div>
              <button className="lp-btn-solid" onClick={go("demo")}>
                Launch demo
              </button>
            </div>
          </div>

          <footer>
            <div className="wrap">
              <div className="foot-top">
                <div className="logo">
                  <span className="dot" />
                  Mood<span style={{ color: "var(--primary)" }}>Stabilizer</span>
                </div>
                <div className="foot-cols">
                  <div className="foot-col">
                    <h4>Product</h4>
                    <div tabIndex={0} role="button" onClick={go("stats")} onKeyDown={goOnEnter("stats")}>
                      Statistics
                    </div>
                    <div tabIndex={0} role="button" onClick={go("demo")} onKeyDown={goOnEnter("demo")}>
                      Live Demo
                    </div>
                    <div tabIndex={0} role="button" onClick={go("prototype")} onKeyDown={goOnEnter("prototype")}>
                      Prototype
                    </div>
                  </div>
                  <div className="foot-col">
                    <h4>Project</h4>
                    <div tabIndex={0} role="button">
                      About
                    </div>
                    <div>Methodology</div>
                    <div>Contact</div>
                  </div>
                </div>
              </div>
              <div className="foot-bottom">MoodStabilizer · v1.0 UI/UX Prototype — data shown for demonstration purposes.</div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
