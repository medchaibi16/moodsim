// This works everywhere: Docker (host.docker.internal) and local (localhost)
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const getDefaultCharacter = async () => {
    const response = await fetch(`${API_BASE}/character/default`);
    return response.json();
};

export const resetCharacter = async () => {
    const response = await fetch(`${API_BASE}/character/reset`, { method: 'POST' });
    return response.json();
};

export const updateCharacter = async (character) => {
    const response = await fetch(`${API_BASE}/character/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(character)
    });
    return response.json();
};

export const processEvent = async (character, eventType, activity, intensity = 0.5) => {
    const response = await fetch(`${API_BASE}/character/emotion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ character, eventType, activity, intensity })
    });
    return response.json();
};