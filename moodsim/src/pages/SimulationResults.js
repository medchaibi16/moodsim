import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SimulationResults = () => {
  const navigate = useNavigate();
  const [logData, setLogData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    let pollInterval;
    let attempts = 0;
    const maxAttempts = 30; // 30 * 2 seconds = 60 seconds max

    const fetchLog = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/simulation/log');
        const data = await response.json();
        
        if (data.success && data.log) {
          const parsed = JSON.parse(data.log);
          setLogData(parsed);
          setLoading(false);
          
          // Check if simulation is complete (based on totalEvents vs log length)
          if (parsed.log && parsed.totalEvents === parsed.log.length) {
            setIsComplete(true);
            clearInterval(pollInterval);
          }
        } else if (data.success === false) {
          // No logs yet, keep waiting
          setLoading(true);
        }
      } catch (err) {
        console.error('Error fetching log:', err);
        setError('Failed to fetch simulation data');
        setLoading(false);
      }
    };

    // Start polling every 2 seconds
    pollInterval = setInterval(() => {
      attempts++;
      fetchLog();
      
      if (attempts >= maxAttempts) {
        clearInterval(pollInterval);
        setLoading(false);
        if (!logData) {
          setError('Simulation timed out. Please try again.');
        }
      }
    }, 2000);

    // Initial fetch
    fetchLog();

    return () => clearInterval(pollInterval);
  }, []);

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

  const beatIcon = (type) => {
    if (type === 'perception') return '👁️';
    if (type === 'hypothesis') return '🤔';
    if (type === 'conclusion') return '💡';
    return '•';
  };

  const toggleRow = (index) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const goBack = () => {
    navigate('/simulation');
  };

  if (error) {
    return (
      <div style={{ padding: '40px', fontFamily: 'sans-serif', textAlign: 'center' }}>
        <h2>❌ {error}</h2>
        <button onClick={goBack} style={{ padding: '10px 24px', marginTop: '20px', cursor: 'pointer' }}>
          ← Back to Builder
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '30px', 
      fontFamily: 'system-ui, -apple-system, sans-serif',
      maxWidth: '1000px',
      margin: '0 auto'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ margin: 0 }}>📊 Simulation Results</h1>
          <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '14px' }}>
            {logData ? `${logData.totalEvents || 0} events processed` : 'Waiting for data...'}
          </p>
        </div>
        <button 
          onClick={goBack}
          style={{
            padding: '8px 20px',
            border: '1px solid #ccc',
            borderRadius: '8px',
            background: 'white',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Back
        </button>
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '12px 20px',
        backgroundColor: isComplete ? '#e8f5e9' : '#fff3e0',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        border: isComplete ? '1px solid #4CAF50' : '1px solid #FF9800'
      }}>
        <span style={{ fontWeight: '500' }}>
          {isComplete ? '✅ Simulation Complete' : '⏳ Simulation Running...'}
        </span>
        {logData && (
          <span style={{ fontSize: '14px', color: '#666' }}>
            {logData.log?.length || 0} / {logData.totalEvents || '?'} events
          </span>
        )}
      </div>

      {/* Day Summary Banner — the headline result, shown prominently */}
      {logData?.daySummary && (
        <div style={{
          padding: '18px 22px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '12px',
          marginBottom: '20px',
          color: 'white',
          boxShadow: '0 2px 12px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '600', opacity: 0.85, marginBottom: '6px', letterSpacing: '0.5px' }}>
            🧭 DAY SUMMARY
          </div>
          <div style={{ fontSize: '15px', lineHeight: '1.5' }}>
            {logData.daySummary}
          </div>
        </div>
      )}

      {/* Character Info */}
      {logData?.character && (
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px'
        }}>
          <strong>🧑 Character:</strong> {logData.character.Name || logData.character.name} &nbsp;|&nbsp;
          <strong>⏰ Day:</strong> {logData.startTime} → {logData.endTime}
        </div>
      )}

      {/* Log Entries */}
      {logData?.log && logData.log.length > 0 ? (
        <div style={{
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '70px 1fr 90px 100px 50px',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: '#f0f0f0',
            fontWeight: 'bold',
            fontSize: '13px',
            borderBottom: '1px solid #ddd'
          }}>
            <span>Time</span>
            <span>Event</span>
            <span>Room</span>
            <span>Emotion</span>
            <span style={{ textAlign: 'center' }}>🎬</span>
          </div>

          {/* Table Body */}
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {logData.log.map((step, index) => {
              const hasReasoning = !step.isClip && step.reasoning && step.reasoning.length > 0;
              const isExpanded = expandedRows.has(index);

              return (
                <div key={index}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '70px 1fr 90px 100px 50px',
                      gap: '8px',
                      padding: '8px 16px',
                      borderBottom: isExpanded ? 'none' : (index < logData.log.length - 1 ? '1px solid #eee' : 'none'),
                      backgroundColor: index % 2 === 0 ? 'white' : '#fafafa',
                      fontSize: '13px',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ fontWeight: '500', fontSize: '12px' }}>{step.time}</span>
                    <span style={{ fontSize: '13px' }}>
                      {step.eventName}
                      {!step.isClip && step.guessedActivity && (
                        <div
                          onClick={() => hasReasoning && toggleRow(index)}
                          style={{
                            fontSize: '11px',
                            color: hasReasoning ? '#5a4fcf' : '#888',
                            marginTop: '2px',
                            cursor: hasReasoning ? 'pointer' : 'default',
                            userSelect: 'none'
                          }}
                        >
                          🧠 Predicted: {step.guessedActivity} ({Math.round((step.guessedActivityConfidence || 0) * 100)}%)
                          {hasReasoning && (isExpanded ? ' ▲' : ' ▼ see reasoning')}
                        </div>
                      )}
                    </span>
                    <span style={{ fontSize: '12px', color: '#666' }}>{step.room}</span>
                    <span style={{
                      backgroundColor: getEmotionColor(step.emotion),
                      color: 'white',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      textAlign: 'center',
                      display: 'inline-block',
                      width: 'fit-content'
                    }}>
                      {step.emotion} ({Math.round(step.confidence * 100)}%)
                    </span>
                    <span style={{ textAlign: 'center', fontSize: '14px' }}>
                      {step.isClip ? '🎬' : ''}
                    </span>
                  </div>

                  {/* Expanded reasoning trace */}
                  {isExpanded && hasReasoning && (
                    <div style={{
                      padding: '10px 16px 14px 86px',
                      backgroundColor: index % 2 === 0 ? '#f7f6ff' : '#f2f1fb',
                      borderBottom: index < logData.log.length - 1 ? '1px solid #eee' : 'none',
                      fontSize: '12px',
                      color: '#444'
                    }}>
                      {step.reasoning.map((beat, beatIndex) => (
                        <div key={beatIndex} style={{ marginBottom: '4px', display: 'flex', gap: '6px' }}>
                          <span>{beatIcon(beat.type)}</span>
                          <span>{beat.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          color: '#999'
        }}>
          <p style={{ fontSize: '18px' }}>⏳ Waiting for simulation data...</p>
          <p>Simulation is running. Results will appear here.</p>
        </div>
      )}

      {/* Footer with JSON Export */}
      {logData && (
        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => {
              const jsonStr = JSON.stringify(logData, null, 2);
              const blob = new Blob([jsonStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `simulation_log_${new Date().toISOString().slice(0,10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#1a73e8',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            📥 Download JSON
          </button>
          <span style={{ fontSize: '13px', color: '#888', alignSelf: 'center' }}>
            Export for Docker animation integration
          </span>
        </div>
      )}
    </div>
  );
};

export default SimulationResults;