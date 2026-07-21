import React, { useState, useMemo } from 'react';
import EmotionalClipsModal from '../components/EmotionalClipsModal';
import { useNavigate } from 'react-router-dom';

// All available events
const AVAILABLE_EVENTS = [
  { id: 'work', name: 'Work (Focus)', icon: '💻', duration: 120 },
  { id: 'break', name: 'Break', icon: '☕', duration: 15 },
  { id: 'cook', name: 'Cook', icon: '🍳', duration: 45 },
  { id: 'eat', name: 'Eat', icon: '🍽️', duration: 30 },
  { id: 'watch_tv', name: 'Watch TV', icon: '📺', duration: 90 },
  { id: 'exercise', name: 'Exercise', icon: '🏋️', duration: 45 },
  { id: 'read', name: 'Read', icon: '📖', duration: 60 },
  { id: 'nap', name: 'Nap', icon: '😴', duration: 60 },
  { id: 'clean', name: 'Clean', icon: '🧹', duration: 30 },
  { id: 'gaming', name: 'Gaming', icon: '🎮', duration: 90 },
  { id: 'phone_scroll', name: 'Phone Scrolling', icon: '📱', duration: 30 },
  { id: 'talk_phone', name: 'Talk on Phone', icon: '📞', duration: 20 },
  { id: 'walk', name: 'Walk', icon: '🚶', duration: 15 },
  { id: 'get_ready', name: 'Get Ready', icon: '🚿', duration: 30 },
  { id: 'relax', name: 'Relax', icon: '🛋️', duration: 60 },
  { id: 'socialize', name: 'Socialize', icon: '🗣️', duration: 60 },
  { id: 'argue', name: 'Argue', icon: '💢', duration: 15 },
  { id: 'late_work', name: 'Late Night Work', icon: '🌙', duration: 90 },
  { id: 'feel_sick', name: 'Feel Sick', icon: '🤒', duration: 120 },
  { id: 'celebrate', name: 'Celebrate', icon: '🎉', duration: 60 },
];

const GRID_COLS = 3;

function SimulationBuilder() {
  // Time range state
  const [startHour, setStartHour] = useState(7);
  const [endHour, setEndHour] = useState(22);

  // Events state
  const [events, setEvents] = useState([]);
  const [isClipModalOpen, setIsClipModalOpen] = useState(false);

  // Simulation state
  const [simulationStatus, setSimulationStatus] = useState(null);
  const [simulationSteps, setSimulationSteps] = useState([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Handle selecting a clip from the modal
  const handleSelectClip = (clip) => {
      const durationMinutes = Math.max(1, Math.round(clip.duration / 60));
      const otherEventsDuration = events.reduce((sum, e) => sum + e.duration, 0);
      if (otherEventsDuration + durationMinutes > availableMinutes) {
          alert(`⏰ Not enough time remaining for this clip! (Need ${durationMinutes} min)`);
          return;
      }
      const newEvent = {
          id: Date.now(),
          activityId: 'emotional_clip',
          activityName: `🎬 ${clip.filename}`,
          activityIcon: '🎬',
          duration: durationMinutes,
          clipData: {
              totalClips: clip.total_clips,
              duration: clip.duration,
              avgConfidence: clip.avg_confidence,
              distribution: clip.distribution,
              filename: clip.filename,
              dominantEmotion: clip.dominant_emotion   // ← Map underscore to camelCase
          },
          isClip: true
      };
      setEvents([...events, newEvent]);
      setIsClipModalOpen(false);
  };

  // Calculate available time in minutes
  const availableMinutes = useMemo(() => {
    if (endHour <= startHour) return 0;
    return (endHour - startHour) * 60;
  }, [startHour, endHour]);

  const usedMinutes = useMemo(() => {
    return events.reduce((sum, e) => sum + e.duration, 0);
  }, [events]);

  const remainingMinutes = availableMinutes - usedMinutes;

  const fillPercentage = useMemo(() => {
    if (availableMinutes === 0) return 0;
    return Math.min((usedMinutes / availableMinutes) * 100, 100);
  }, [usedMinutes, availableMinutes]);

  const formatHour = (hour) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${ampm}`;
  };

  const canAddEvent = (duration) => {
    return remainingMinutes >= duration;
  };

  const addEvent = () => {
    const fittingEvent = AVAILABLE_EVENTS.find(e => canAddEvent(e.duration));
    if (!fittingEvent) {
      alert('⏰ Not enough time left for any event! Adjust your start/end time.');
      return;
    }
    const newEvent = {
      id: Date.now(),
      activityId: fittingEvent.id,
      activityName: fittingEvent.name,
      activityIcon: fittingEvent.icon,
      duration: fittingEvent.duration,
      isClip: false
    };
    setEvents([...events, newEvent]);
  };

  const deleteEvent = (eventId) => {
    setEvents(events.filter(event => event.id !== eventId));
  };

  const updateActivity = (eventId, activityId) => {
    console.log("🔴 updateActivity called:", { eventId, activityId });
    const selected = AVAILABLE_EVENTS.find(e => e.id === activityId);
    console.log("🔴 Selected:", selected);
    const otherEventsDuration = events.reduce((sum, e) => 
      e.id === eventId ? sum : sum + e.duration, 0
    );
    const newTotal = otherEventsDuration + selected.duration;
    if (newTotal > availableMinutes) {
      alert(`⏰ Cannot change to "${selected.name}" — not enough time remaining!`);
      return;
    }
    setEvents(events.map(event => 
      event.id === eventId 
        ? { 
            ...event, 
            activityId: selected.id,
            activityName: selected.name,
            activityIcon: selected.icon,
            duration: selected.duration,
            isClip: false
          }
        : event
    ));
  };
  const navigate = useNavigate();
  const timeRangeDisplay = `${formatHour(startHour)} → ${formatHour(endHour)}`;

 const runSimulation = () => {
  if (events.length === 0) {
    alert('Please add at least one event before starting the simulation.');
    return;
  }

  setIsSimulating(true);
  setSimulationStatus('starting');
  setSimulationSteps([]);

  const simulationData = {
      startHour: startHour,
      endHour: endHour,
      events: events.map(e => {
          const eventData = {
              id: String(e.id),
              name: e.activityName,
              icon: e.activityIcon,
              duration: e.duration,
              isClip: e.isClip || false,
              activityId: e.activityId,
              // ✅ Add sensor data based on activity
              sensors: getSensorsForActivity(e.activityId)
          };
          if (e.isClip && e.clipData) {
              eventData.clipData = e.clipData;
          }
          return eventData;
      })
  };

  // Helper function to generate sensor data
  function getSensorsForActivity(activityId) {
      const sensorMap = {
          work: { tvOn: false, laptopOn: true, phoneActive: false, voiceIntensity: 0.1, walkingSpeed: 0.2 },
          watch_tv: { tvOn: true, laptopOn: false, phoneActive: false, voiceIntensity: 0.2, walkingSpeed: 0.0 },
          argue: { tvOn: false, laptopOn: false, phoneActive: false, voiceIntensity: 0.8, walkingSpeed: 0.6 },
          exercise: { tvOn: false, laptopOn: false, phoneActive: false, voiceIntensity: 0.4, walkingSpeed: 0.8 },
          cook: { tvOn: false, laptopOn: false, phoneActive: false, voiceIntensity: 0.2, walkingSpeed: 0.3 },
          eat: { tvOn: false, laptopOn: false, phoneActive: false, voiceIntensity: 0.2, walkingSpeed: 0.0 },
          nap: { tvOn: false, laptopOn: false, phoneActive: false, voiceIntensity: 0.0, walkingSpeed: 0.0 },
          phone_scroll: { tvOn: false, laptopOn: false, phoneActive: true, voiceIntensity: 0.1, walkingSpeed: 0.0 },
          relax: { tvOn: false, laptopOn: false, phoneActive: false, voiceIntensity: 0.1, walkingSpeed: 0.0 },
          gaming: { tvOn: true, laptopOn: false, phoneActive: false, voiceIntensity: 0.3, walkingSpeed: 0.0 },
          socialize: { tvOn: false, laptopOn: false, phoneActive: false, voiceIntensity: 0.5, walkingSpeed: 0.1 },
          late_work: { tvOn: false, laptopOn: true, phoneActive: false, voiceIntensity: 0.1, walkingSpeed: 0.1 },
          celebrate: { tvOn: true, laptopOn: false, phoneActive: false, voiceIntensity: 0.6, walkingSpeed: 0.2 },
          feel_sick: { tvOn: false, laptopOn: false, phoneActive: false, voiceIntensity: 0.1, walkingSpeed: 0.0 }
      };
      return sensorMap[activityId] || { tvOn: false, laptopOn: false, phoneActive: false, voiceIntensity: 0.1, walkingSpeed: 0.1 };
  }

  const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  fetch(`${API_BASE}/simulation/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(simulationData)
  })
  .then(response => response.json())
  .then(data => {
    console.log('Simulation started:', data);
    navigate('/simulation-results');
  })
  .catch(error => {
    console.error('Error starting simulation:', error);
    alert('❌ Error starting simulation. Make sure the backend is running.');
    setIsSimulating(false);
    setSimulationStatus('error');
  });
};
  const getEmotionColor = (emotion) => {
    const colors = {
      happiness: '#4CAF50',
      anger: '#f44336',
      sadness: '#2196F3',
      frustration: '#FF9800',
      excited: '#9C27B0',
      neutral: '#9E9E9E',
      stress: '#FF5722'
    };
    return colors[emotion] || '#9E9E9E';
  };

  const getClipDominantColor = (distribution) => {
    if (!distribution) return '#9C27B0';
    let max = 0;
    let dominant = 'neutral';
    const colors = {
      anger: '#f44336',
      sadness: '#2196F3',
      happiness: '#4CAF50',
      neutral: '#9E9E9E',
      excited: '#9C27B0',
      frustration: '#FF9800'
    };
    for (const [emotion, count] of Object.entries(distribution)) {
      if (count > max) {
        max = count;
        dominant = emotion;
      }
    }
    return colors[dominant] || '#9C27B0';
  };

  return (
    <div style={{ 
      padding: '30px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <h1 style={{ margin: 0, fontSize: '28px' }}>🏠 MoodSim — Day Builder</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setIsClipModalOpen(true)}
            style={{
              fontSize: '18px',
              padding: '12px 24px',
              cursor: 'pointer',
              backgroundColor: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
            }}
          >
            🎬 Add Clip
          </button>
          <button 
            onClick={addEvent}
            disabled={remainingMinutes <= 0}
            style={{
              fontSize: '18px',
              padding: '12px 24px',
              cursor: remainingMinutes <= 0 ? 'not-allowed' : 'pointer',
              backgroundColor: remainingMinutes <= 0 ? '#ccc' : '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
            }}
          >
            + Add Event
          </button>
          <button 
            onClick={runSimulation}
            disabled={events.length === 0 || isSimulating}
            style={{
              fontSize: '18px',
              padding: '12px 24px',
              cursor: (events.length === 0 || isSimulating) ? 'not-allowed' : 'pointer',
              backgroundColor: (events.length === 0 || isSimulating) ? '#ccc' : '#FF6B35',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
            }}
          >
            {isSimulating ? '⏳ Running...' : '🚀 Start Simulation'}
          </button>
          <span style={{ color: '#666', fontSize: '14px' }}>
            {usedMinutes} / {availableMinutes} min used
          </span>
        </div>
      </div>

      {/* Time Range Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '30px',
        padding: '20px',
        backgroundColor: '#f5f5f5',
        borderRadius: '12px',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>Start Time</label>
          <input type="range" min="0" max="23" value={startHour} onChange={(e) => { const val = parseInt(e.target.value); if (val < endHour) setStartHour(val); }} style={{ width: '100%' }} />
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{formatHour(startHour)}</span>
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: '#666', marginBottom: '4px' }}>End Time</label>
          <input type="range" min="0" max="23" value={endHour} onChange={(e) => { const val = parseInt(e.target.value); if (val > startHour) setEndHour(val); }} style={{ width: '100%' }} />
          <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{formatHour(endHour)}</span>
        </div>
        <div style={{ textAlign: 'center', minWidth: '150px' }}>
          <div style={{ fontSize: '13px', color: '#666' }}>Day Duration</div>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
            {timeRangeDisplay}
            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#888', marginLeft: '8px' }}>({availableMinutes} min)</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '70px', height: '70px' }}>
            <svg width="70" height="70" viewBox="0 0 70 70">
              <circle cx="35" cy="35" r="30" fill="none" stroke="#e0e0e0" strokeWidth="8" />
              <circle cx="35" cy="35" r="30" fill="none" stroke="#4CAF50" strokeWidth="8" strokeDasharray={188.5} strokeDashoffset={188.5 - (fillPercentage / 100) * 188.5} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease', transform: 'rotate(-90deg)', transformOrigin: 'center' }} />
              <text x="35" y="38" textAnchor="middle" fontSize="14" fontWeight="bold" fill={fillPercentage > 80 ? '#4CAF50' : '#333'}>{Math.round(fillPercentage)}%</text>
            </svg>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>{remainingMinutes > 0 ? `${remainingMinutes} min remaining` : 'Day full! ✅'}</div>
        </div>
      </div>

      {/* Event Grid */}
      {events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed #ccc', borderRadius: '12px', color: '#999' }}>
          <p style={{ fontSize: '20px' }}>📭 No events yet</p>
          <p>Click the <strong>"+ Add Event"</strong> button to start building your day</p>
          <p style={{ fontSize: '14px', color: '#bbb' }}>Available time: {availableMinutes} minutes</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: '16px' }}>
          {events.map((event, index) => {
            const isClip = event.isClip || false;
            const clipColor = isClip && event.clipData ? getClipDominantColor(event.clipData.distribution) : '#9C27B0';
            return (
              <div key={event.id + event.activityId} style={{ border: isClip ? `2px solid ${clipColor}` : '1px solid #e0e0e0', borderRadius: '12px', padding: '16px', backgroundColor: isClip ? '#faf0ff' : '#fafafa', display: 'flex', flexDirection: 'column', position: 'relative', minHeight: '120px' }}>
                <div style={{ position: 'absolute', top: '8px', right: '12px', fontSize: '12px', color: '#bbb', fontWeight: 'bold' }}>#{index + 1}</div>
                {isClip && <div style={{ position: 'absolute', top: '8px', left: '12px', fontSize: '10px', color: clipColor, fontWeight: 'bold', textTransform: 'uppercase' }}>📽️ Clip</div>}
                <div style={{ marginBottom: '10px', marginTop: isClip ? '16px' : '0' }}>
                  <label style={{ fontSize: '12px', color: '#888', display: 'block', marginBottom: '4px' }}>{isClip ? 'Emotional Clip' : 'Activity'}</label>
                  {isClip ? (
                    <div style={{ padding: '6px 10px', backgroundColor: '#f0e6ff', borderRadius: '6px', fontSize: '13px', fontWeight: '500', color: '#333' }}>
                      {event.activityName}
                      {event.clipData && event.clipData.distribution && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', color: '#888' }}>
                          (🎯 {Object.entries(event.clipData.distribution).filter(([_, count]) => count > 0).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([emotion, count]) => `${emotion}: ${count}`).join(', ')})
                        </span>
                      )}
                    </div>
                  ) : (
                    <select value={event.activityId} onChange={(e) => updateActivity(event.id, e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '14px', backgroundColor: 'white' }}>
                      {AVAILABLE_EVENTS.map(act => <option key={act.id} value={act.id}>{act.icon} {act.name} ({act.duration} min)</option>)}
                    </select>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                  <span style={{ fontSize: '24px' }}>{event.activityIcon}</span>
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{event.duration} min</span>
                </div>
                <button onClick={() => deleteEvent(event.id)} style={{ position: 'absolute', bottom: '8px', right: '12px', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '16px', padding: '4px 8px' }}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '16px', color: remainingMinutes <= 0 ? '#4CAF50' : '#aaa', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>
          {events.length} event{events.length !== 1 ? 's' : ''} in your timeline
          {events.filter(e => e.isClip).length > 0 && <span style={{ marginLeft: '8px', color: '#9C27B0' }}>🎬 {events.filter(e => e.isClip).length} clip{events.filter(e => e.isClip).length !== 1 ? 's' : ''}</span>}
        </span>
        {remainingMinutes <= 0 && <span style={{ fontWeight: 'bold', color: '#4CAF50' }}>✅ Your day is fully scheduled!</span>}
      </div>

      {/* Simulation Results */}
      {simulationSteps.length > 0 && (
        <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f0f4ff', borderRadius: '12px', border: '1px solid #d0d8e8' }}>
          <h3 style={{ margin: '0 0 12px 0' }}>
            📊 Simulation Progress 
            <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666', marginLeft: '12px' }}>
              {simulationStatus === 'complete' ? '✅ Complete' : '⏳ Running...'}
            </span>
          </h3>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {simulationSteps.map((step, index) => (
              <div key={index} style={{ display: 'flex', gap: '12px', padding: '6px 0', borderBottom: '1px solid #e8e8e8', fontSize: '13px', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', minWidth: '55px', fontSize: '12px' }}>{step.time}</span>
                <span style={{ minWidth: '100px', fontSize: '12px', color: '#444' }}>{step.eventName?.length > 20 ? step.eventName.substring(0, 20) + '...' : step.eventName}</span>
                <span style={{ minWidth: '70px', fontSize: '12px', color: '#666' }}>{step.room}</span>
                <span style={{ 
                  backgroundColor: getEmotionColor(step.emotion),
                  color: 'white',
                  padding: '2px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 'bold',
                  minWidth: '70px',
                  textAlign: 'center'
                }}>
                  {step.emotion} ({Math.round(step.confidence * 100)}%)
                </span>
                {step.isClip && <span style={{ fontSize: '10px', color: '#9C27B0', background: '#f0e6ff', padding: '0 6px', borderRadius: '4px' }}>🎬</span>}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
            {simulationSteps.length} events processed
          </div>
        </div>
      )}

      {/* Emotional Clips Modal */}
      <EmotionalClipsModal
        isOpen={isClipModalOpen}
        onClose={() => setIsClipModalOpen(false)}
        onSelectClip={handleSelectClip}
      />
    </div>
  );
}

export default SimulationBuilder;