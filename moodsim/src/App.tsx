import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import IconSprite from './IconSprite';
import './stats-theme.css';

// --- Your existing pages (kept as-is) ---
import CharacterSelection from './pages/CharacterSelection';
import SimulationBuilder from './pages/SimulationBuilder';
import SimulationResults from './pages/SimulationResults';

// --- Friend's pages ---
import HomePage from './HomePage';
import StatsPage from './StatsPage';
import DemoPage from './DemoPage';
import CharacterPage, { type Character } from './CharacterPage';
import PrototypePage from './PrototypePage';
import type { DayEvent } from './simulationLogic';
import { getDefaultCharacter, type StartSimulationResponse } from './api';

// --- Static pages ---
import AboutPage from './AboutPage';
import MethodologyPage from './MethodologyPage';
import ContactPage from './ContactPage';

// Shared with Sidebar's `active` prop — must match its Page union exactly.
type Page = 'home' | 'stats' | 'demo' | 'character' | 'prototype' | 'about' | 'methodology' | 'contact';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Day Builder state — lifted here (not inside PrototypePage) so it survives
  // navigating away and back, same reasoning as the original design.
  const [dbStart, setDbStart] = useState(7);
  const [dbEnd, setDbEnd] = useState(22);
  const [dbEvents, setDbEvents] = useState<DayEvent[]>([]);

  // Character — loaded from the REAL backend default, not a hardcoded constant.
  const [character, setCharacter] = useState<Character | null>(null);
  const [characterError, setCharacterError] = useState<string | null>(null);

  // Most recent real simulation result (from POST /api/simulation/start).
  const [lastResult, setLastResult] = useState<StartSimulationResponse | null>(null);

  useEffect(() => {
    getDefaultCharacter()
      .then((c) => setCharacter(c as Character))
      .catch((err) => setCharacterError(err instanceof Error ? err.message : String(err)));
  }, []);

  // CharacterPage's updater callback never receives null — but React's setCharacter
  // dispatcher (for a Character | null state) does accept a null-taking updater.
  // This bridges the two so we can pass a properly-typed callback down.
  function handleCharacterChange(updater: Character | ((prev: Character) => Character)) {
    setCharacter((prev) => {
      const base = prev ?? (updater as Character);
      return typeof updater === 'function' ? (updater as (prev: Character) => Character)(base) : updater;
    });
  }

  // Map current URL to the Sidebar's active page type
  let activePage: Page = 'home';
  if (location.pathname === '/') activePage = 'home';
  else if (location.pathname === '/stats') activePage = 'stats';
  else if (location.pathname === '/demo') activePage = 'demo';
  else if (location.pathname === '/character') activePage = 'character';
  else if (location.pathname === '/prototype') activePage = 'prototype';
  else if (location.pathname === '/simulation') activePage = 'prototype'; // optional alias
  else if (location.pathname === '/simulation-results') activePage = 'prototype';
  else if (location.pathname === '/about') activePage = 'about';
  else if (location.pathname === '/methodology') activePage = 'methodology';
  else if (location.pathname === '/contact') activePage = 'contact';

  // Toggle dark mode – sets data-theme on <html>
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
  };

  // Connect sidebar navigation to React Router
  const handleNavigate = (page: Page) => {
    if (page === 'home') navigate('/');
    else if (page === 'stats') navigate('/stats');
    else if (page === 'demo') navigate('/demo');
    else if (page === 'character') navigate('/character');
    else if (page === 'prototype') navigate('/prototype');
    else if (page === 'about') navigate('/about');
    else if (page === 'methodology') navigate('/methodology');
    else if (page === 'contact') navigate('/contact');
  };

  return (
    <div className="app">
      <IconSprite />
      <Sidebar
        active={activePage}
        darkMode={darkMode}
        onToggleTheme={toggleTheme}
        onNavigate={handleNavigate}
      />
      <div className="main">
        <Routes>
          {/* Friend's pages */}
          <Route
            path="/"
            element={<HomePage darkMode={darkMode} onToggleTheme={toggleTheme} onNavigate={handleNavigate} />}
          />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route
            path="/character"
            element={
              <CharacterPage
                character={character}
                characterError={characterError}
                onCharacterChange={handleCharacterChange}
                onContinue={() => navigate('/prototype')}
              />
            }
          />
          <Route
            path="/prototype"
            element={
              <PrototypePage
                start={dbStart}
                setStart={setDbStart}
                end={dbEnd}
                setEnd={setDbEnd}
                events={dbEvents}
                setEvents={setDbEvents}
                character={character}
                lastResult={lastResult}
                onRunComplete={setLastResult}
              />
            }
          />

          {/* Static pages */}
          <Route path="/about" element={<AboutPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Your existing pages */}
          <Route path="/simulation" element={<SimulationBuilder />} />
          <Route path="/simulation-results" element={<SimulationResults />} />
        </Routes>
      </div>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}