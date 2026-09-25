type Page = "home" | "stats" | "demo" | "character" | "prototype" | "about" | "methodology" | "contact";

interface SidebarProps {
  active: Page;
  darkMode: boolean;
  onToggleTheme: () => void;
  onNavigate?: (page: Page) => void;
}

const NAV_ITEMS: { key: Page; label: string; icon: string; section: string }[] = [
  { key: "stats", label: "Statistics", icon: "ic-chart", section: "Analyse" },
  { key: "demo", label: "Live Demo", icon: "ic-video", section: "Analyse" },
  { key: "character", label: "Character", icon: "ic-user", section: "Simulation" },
  { key: "prototype", label: "Day Builder", icon: "ic-cpu", section: "Simulation" },
  { key: "about", label: "About", icon: "ic-info", section: "General" },
  { key: "methodology", label: "Methodology", icon: "ic-activity", section: "General" },
  { key: "contact", label: "Contact", icon: "ic-user", section: "General" },
];

export default function Sidebar({ active, darkMode, onToggleTheme, onNavigate }: SidebarProps) {
  let lastSection = "";

  return (
    <nav className="sidebar" aria-label="Main navigation">
      <div
        className="brand"
        tabIndex={0}
        role="button"
        aria-label="Back to home"
        onClick={() => onNavigate?.("home")}
        onKeyDown={(e) => {
          if (e.key === "Enter") onNavigate?.("home");
        }}
      >
        <div>
          <div className="brand-name">MoodStabilizer</div>
          <div className="brand-sub">v1.0 prototype</div>
        </div>
      </div>

      {NAV_ITEMS.map((item) => {
        const showSectionLabel = item.section !== lastSection;
        lastSection = item.section;
        return (
          <div key={item.key}>
            {showSectionLabel && <div className="nav-section-label">{item.section}</div>}
            <div
              className={`nav-item${active === item.key ? " active" : ""}`}
              tabIndex={0}
              aria-current={active === item.key ? "page" : undefined}
              onClick={() => onNavigate?.(item.key)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onNavigate?.(item.key);
              }}
            >
              <svg className="icon" aria-hidden="true">
                <use href={`#${item.icon}`} />
              </svg>
              {item.label}
            </div>
          </div>
        );
      })}

      <div className="sidebar-footer">
        <button className="theme-toggle" onClick={onToggleTheme} aria-label="Toggle between light and dark mode">
          <svg className="icon-sm" aria-hidden="true">
            <use href={darkMode ? "#ic-sun" : "#ic-moon"} />
          </svg>
          <span className="theme-toggle-label">{darkMode ? "Light mode" : "Dark mode"}</span>
        </button>
        <div className="status-pill">
          <span className="dot" /> Model online
        </div>
      </div>
    </nav>
  );
}
