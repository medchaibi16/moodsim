import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CharacterSelection from './pages/CharacterSelection';
import SimulationBuilder from './pages/SimulationBuilder';
import SimulationResults from './pages/SimulationResults';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CharacterSelection />} />
        <Route path="/simulation" element={<SimulationBuilder />} />
        <Route path="/simulation-results" element={<SimulationResults />} />
      </Routes>
    </Router>
  );
}

export default App;