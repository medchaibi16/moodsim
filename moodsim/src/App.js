import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import IconSprite from './IconSprite';
import './stats-theme.css';

// --- Your existing pages (keep them) ---
import CharacterSelection from './pages/CharacterSelection';
import SimulationBuilder from './pages/SimulationBuilder';
import SimulationResults from './pages/SimulationResults';

// --- Friend’s extra pages (add these) ---
import HomePage from './HomePage';
import StatsPage from './StatsPage';
import DemoPage from './DemoPage';
import CharacterPage from './CharacterPage';
import PrototypePage from './PrototypePage';

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Map current URL to the Sidebar's active page type
  let activePage = 'home';
  if (location.pathname === '/') activePage = 'home';
  else if (location.pathname === '/stats') activePage = 'stats';
  else if (location.pathname === '/demo') activePage = 'demo';
  else if (location.pathname === '/character') activePage = 'character';
  else if (location.pathname === '/prototype') activePage = 'prototype';
  else if (location.pathname === '/simulation') activePage = 'prototype'; // optional alias
  else if (location.pathname === '/simulation-results') activePage = 'prototype';

  // Toggle dark mode – sets data-theme on <html>
  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    document.documentElement.setAttribute('data-theme', newMode ? 'dark' : 'light');
  };

  // Connect sidebar navigation to React Router
  const handleNavigate = (page) => {
    if (page === 'home') navigate('/');
    else if (page === 'stats') navigate('/stats');
    else if (page === 'demo') navigate('/demo');
    else if (page === 'character') navigate('/character');
    else if (page === 'prototype') navigate('/prototype');
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
          {/* Friend’s pages (add these routes) */}
          <Route path="/" element={<HomePage darkMode={darkMode} onToggleTheme={toggleTheme} onNavigate={handleNavigate} />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/demo" element={<DemoPage />} />
          <Route path="/character" element={<CharacterPage onContinue={() => navigate('/prototype')} />} />
          <Route path="/prototype" element={
            <PrototypePage
              start={7}          // you can manage these states globally or use a context
              setStart={() => {}}
              end={22}
              setEnd={() => {}}
              events={[]}
              setEvents={() => {}}
              onRunComplete={(result) => {
                // optionally navigate to results or display them
                console.log(result);
              }}
            />
          } />

          {/* Your existing pages (you can keep or replace) */}
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