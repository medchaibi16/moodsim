import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StickFigure from '../components/StickFigure';
import { getDefaultCharacter, resetCharacter, updateCharacter } from '../services/api';
import './CharacterSelection.css';

const CharacterSelection = () => {
    const navigate = useNavigate();
    const [character, setCharacter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Load default character from C# backend
    useEffect(() => {
        const loadCharacter = async () => {
            try {
                const data = await getDefaultCharacter();
                setCharacter(data);
            } catch (error) {
                console.error('Error loading character:', error);
            } finally {
                setLoading(false);
            }
        };
        loadCharacter();
    }, []);

    // Reset character (calls C# backend)
    const handleReset = async () => {
        try {
            const data = await resetCharacter();
            setCharacter(data);
        } catch (error) {
            console.error('Error resetting character:', error);
        }
    };

    // Update character stat (calls C# backend)
    const updateStat = async (stat, value) => {
        const updated = { 
            ...character, 
            [stat]: parseFloat(value) 
        };
        try {
            const data = await updateCharacter(updated);
            setCharacter(data);
        } catch (error) {
            console.error('Error updating character:', error);
        }
    };

    // Determine dominant emotion from character data
    const getDominantEmotion = () => {
        if (!character) return 'neutral';
        const { baselinePleasure, baselineArousal, baselineDominance } = character;
        if (baselinePleasure > 0.3 && baselineArousal > 0.1) return 'happy';
        if (baselinePleasure < -0.2 && baselineArousal > 0.2) return 'angry';
        if (baselinePleasure < -0.3 && baselineArousal < -0.1) return 'sad';
        if (baselinePleasure < -0.1 && baselineArousal > 0.3) return 'stress';
        if (baselinePleasure < -0.1 && baselineArousal > 0.1 && baselineDominance < 0) return 'frustrated';
        return 'neutral';
    };

    if (loading) return <div className="loading">Loading character...</div>;
    if (!character) return <div className="error">Failed to load character</div>;

    const dominantEmotion = getDominantEmotion();

    return (
        <div className="character-selection">
            <h1>🧠 Choose Your Character</h1>
            <p className="subtitle">Customize your character's personality and emotional baseline</p>

            <div className="character-container">
                {/* Left: Stick Figure */}
                <div className="character-visual">
                    <StickFigure emotion={dominantEmotion} />
                    <div className="character-name">{character.name}</div>
                    <div className="character-description">{character.description}</div>
                    <div className="character-emotion-preview">
                        <span className="emotion-badge">Dominant: {dominantEmotion.toUpperCase()}</span>
                    </div>
                </div>

                {/* Right: Stats */}
                <div className="character-stats">
                    <div className="stats-tabs">
                        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>
                            📊 Overview
                        </button>
                        <button className={activeTab === 'edit' ? 'active' : ''} onClick={() => setActiveTab('edit')}>
                            ✏️ Edit Stats
                        </button>
                    </div>

                    {activeTab === 'overview' && (
                        <div className="stats-overview">
                            <div className="stat-group">
                                <h4>🧠 Big Five Personality</h4>
                                <div className="stat-row"><span>Openness</span> <div className="stat-bar"><div style={{ width: `${character.openness * 100}%` }}></div></div> <span>{Math.round(character.openness * 100)}%</span></div>
                                <div className="stat-row"><span>Conscientiousness</span> <div className="stat-bar"><div style={{ width: `${character.conscientiousness * 100}%` }}></div></div> <span>{Math.round(character.conscientiousness * 100)}%</span></div>
                                <div className="stat-row"><span>Extraversion</span> <div className="stat-bar"><div style={{ width: `${character.extraversion * 100}%` }}></div></div> <span>{Math.round(character.extraversion * 100)}%</span></div>
                                <div className="stat-row"><span>Agreeableness</span> <div className="stat-bar"><div style={{ width: `${character.agreeableness * 100}%` }}></div></div> <span>{Math.round(character.agreeableness * 100)}%</span></div>
                                <div className="stat-row"><span>Neuroticism</span> <div className="stat-bar"><div style={{ width: `${character.neuroticism * 100}%` }}></div></div> <span>{Math.round(character.neuroticism * 100)}%</span></div>
                            </div>

                            <div className="stat-group">
                                <h4>🎭 PAD Baseline</h4>
                                <div className="stat-row"><span>Pleasure</span> <div className="stat-bar"><div style={{ width: `${(character.baselinePleasure + 1) * 50}%` }}></div></div> <span>{character.baselinePleasure.toFixed(2)}</span></div>
                                <div className="stat-row"><span>Arousal</span> <div className="stat-bar"><div style={{ width: `${(character.baselineArousal + 1) * 50}%` }}></div></div> <span>{character.baselineArousal.toFixed(2)}</span></div>
                                <div className="stat-row"><span>Dominance</span> <div className="stat-bar"><div style={{ width: `${(character.baselineDominance + 1) * 50}%` }}></div></div> <span>{character.baselineDominance.toFixed(2)}</span></div>
                            </div>

                            <div className="stat-group">
                                <h4>🎯 Goals & Concerns</h4>
                                <div><strong>Goals:</strong> {character.goals.map(g => g.name).join(', ')}</div>
                                <div><strong>Concerns:</strong> {character.concerns.map(c => c.name).join(', ')}</div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'edit' && (
                        <div className="stats-edit">
                            <h4>✏️ Edit Personality Traits</h4>
                            <div className="edit-row"><label>Openness</label> <input type="range" min="0" max="1" step="0.05" value={character.openness} onChange={(e) => updateStat('openness', e.target.value)} /> <span>{Math.round(character.openness * 100)}%</span></div>
                            <div className="edit-row"><label>Conscientiousness</label> <input type="range" min="0" max="1" step="0.05" value={character.conscientiousness} onChange={(e) => updateStat('conscientiousness', e.target.value)} /> <span>{Math.round(character.conscientiousness * 100)}%</span></div>
                            <div className="edit-row"><label>Extraversion</label> <input type="range" min="0" max="1" step="0.05" value={character.extraversion} onChange={(e) => updateStat('extraversion', e.target.value)} /> <span>{Math.round(character.extraversion * 100)}%</span></div>
                            <div className="edit-row"><label>Agreeableness</label> <input type="range" min="0" max="1" step="0.05" value={character.agreeableness} onChange={(e) => updateStat('agreeableness', e.target.value)} /> <span>{Math.round(character.agreeableness * 100)}%</span></div>
                            <div className="edit-row"><label>Neuroticism</label> <input type="range" min="0" max="1" step="0.05" value={character.neuroticism} onChange={(e) => updateStat('neuroticism', e.target.value)} /> <span>{Math.round(character.neuroticism * 100)}%</span></div>

                            <h4>🎭 Edit PAD Baseline</h4>
                            <div className="edit-row"><label>Pleasure (-1 to +1)</label> <input type="range" min="-1" max="1" step="0.05" value={character.baselinePleasure} onChange={(e) => updateStat('baselinePleasure', e.target.value)} /> <span>{character.baselinePleasure.toFixed(2)}</span></div>
                            <div className="edit-row"><label>Arousal (-1 to +1)</label> <input type="range" min="-1" max="1" step="0.05" value={character.baselineArousal} onChange={(e) => updateStat('baselineArousal', e.target.value)} /> <span>{character.baselineArousal.toFixed(2)}</span></div>
                            <div className="edit-row"><label>Dominance (-1 to +1)</label> <input type="range" min="-1" max="1" step="0.05" value={character.baselineDominance} onChange={(e) => updateStat('baselineDominance', e.target.value)} /> <span>{character.baselineDominance.toFixed(2)}</span></div>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Buttons */}
            <div className="character-actions">
                <button className="btn-reset" onClick={handleReset}>🔄 Reset to Default</button>
                <button className="btn-proceed" onClick={() => navigate('/simulation', { state: { character } })}>
                    🚀 Proceed to Simulation
                </button>
            </div>
        </div>
    );
};

export default CharacterSelection;