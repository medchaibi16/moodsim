import React, { useState, useMemo } from 'react';
import { getClipsByCategory, getCategoryCounts } from '../services/clipService';

const EmotionalClipsModal = ({ isOpen, onClose, onSelectClip }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Hooks must be called BEFORE early return
  const filteredClips = useMemo(() => {
    return getClipsByCategory(selectedCategory);
  }, [selectedCategory]);

  if (!isOpen) return null;

  const categoryCounts = getCategoryCounts();

  // Emotion color mapping
  const emotionColors = {
    anger: '#f44336',
    sadness: '#2196F3',
    happiness: '#4CAF50',
    neutral: '#9E9E9E',
    excited: '#9C27B0',
    frustration: '#FF9800'
  };

  // Get dominant emotion for a clip
  const getDominantEmotion = (distribution) => {
    let max = 0;
    let dominant = 'neutral';
    for (const [emotion, count] of Object.entries(distribution)) {
      if (count > max) {
        max = count;
        dominant = emotion;
      }
    }
    return dominant;
  };

  // Render horizontal bar chart
  const renderBarChart = (distribution) => {
    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    const emotions = ['anger', 'sadness', 'happiness', 'neutral', 'excited', 'frustration'];
    const maxCount = Math.max(...Object.values(distribution));

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px', width: '100%' }}>
        {emotions.map(emotion => {
          const count = distribution[emotion] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          const barWidth = maxCount > 0 ? (count / maxCount) * 100 : 0;
          
          if (count === 0) return null;
          
          return (
            <div key={emotion} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
              <span style={{ 
                width: '60px', 
                textTransform: 'capitalize', 
                color: '#555',
                flexShrink: 0,
                fontSize: '10px',
                fontWeight: '500'
              }}>
                {emotion}
              </span>
              <div style={{ 
                flex: 1, 
                height: '14px', 
                backgroundColor: '#f0f0f0', 
                borderRadius: '3px',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${barWidth}%`,
                  height: '100%',
                  backgroundColor: emotionColors[emotion],
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <span style={{ 
                width: '45px', 
                textAlign: 'right', 
                fontSize: '11px', 
                fontWeight: '500',
                color: '#333',
                flexShrink: 0
              }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Get total clips count
  const getTotalClips = () => {
    let total = 0;
    for (const key in categoryCounts) {
      total += categoryCounts[key];
    }
    return total;
  };

  const categories = ['all', 'anger', 'sadness', 'happiness', 'neutral', 'excited', 'frustration'];
  const categoryLabels = {
    all: `All (${getTotalClips()})`,
    anger: `😠 Anger (${categoryCounts.anger || 0})`,
    sadness: `😢 Sadness (${categoryCounts.sadness || 0})`,
    happiness: `😊 Happiness (${categoryCounts.happiness || 0})`,
    neutral: `😐 Neutral (${categoryCounts.neutral || 0})`,
    excited: `🤩 Excited (${categoryCounts.excited || 0})`,
    frustration: `😤 Frustration (${categoryCounts.frustration || 0})`
  };

  // Scroll buttons container for overflow
  const categoriesList = ['all', 'anger', 'sadness', 'happiness', 'neutral', 'excited', 'frustration'];
  const visibleCategories = categoriesList.filter(c => c === 'all' || (categoryCounts[c] && categoryCounts[c] > 0));

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        maxWidth: '850px',
        width: '100%',
        maxHeight: '85vh',
        padding: '24px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
          <div>
            <h2 style={{ margin: 0 }}>🎬 Emotional Clips</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#888' }}>
              {getTotalClips()} clips · Click to add to timeline
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: '#666',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Category Filter - Scrollable horizontally */}
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          marginBottom: '16px', 
          flexShrink: 0,
          overflowX: 'auto',
          paddingBottom: '8px',
          flexWrap: 'nowrap'
        }}>
          {visibleCategories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '5px 14px',
                borderRadius: '16px',
                border: selectedCategory === category ? `2px solid ${category === 'all' ? '#1a73e8' : emotionColors[category]}` : '1px solid #ddd',
                background: selectedCategory === category ? `${category === 'all' ? '#e8f0fe' : emotionColors[category]}22` : 'white',
                cursor: 'pointer',
                fontWeight: selectedCategory === category ? '600' : '400',
                fontSize: '12px',
                whiteSpace: 'nowrap',
                color: selectedCategory === category ? '#333' : '#666',
                flexShrink: 0
              }}
            >
              {categoryLabels[category] || category}
            </button>
          ))}
        </div>

        {/* Clip List */}
        <div style={{ overflowY: 'auto', flex: 1, minHeight: 0 }}>
          {filteredClips.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              No clips found for this category.
            </div>
          ) : (
            filteredClips.map((clip) => {
              const dominant = getDominantEmotion(clip.distribution);
              const totalClips = Object.values(clip.distribution).reduce((a, b) => a + b, 0);

              return (
                <div
                  key={clip.filename}
                  onClick={() => onSelectClip(clip)}
                  style={{
                    border: '1px solid #e8e8e8',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    backgroundColor: 'white'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    {/* Left: File info + bar chart */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '500', fontSize: '13px' }}>{clip.filename}</span>
                        <span style={{
                          backgroundColor: emotionColors[dominant],
                          color: 'white',
                          padding: '1px 10px',
                          borderRadius: '12px',
                          fontSize: '10px',
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}>
                          {dominant}
                        </span>
                        <span style={{ fontSize: '10px', color: '#aaa' }}>
                          {totalClips} windows · {clip.duration}s
                        </span>
                      </div>

                      {/* Horizontal bar chart */}
                      {renderBarChart(clip.distribution)}
                    </div>

                    {/* Right: Accuracy + Add button */}
                    <div style={{ 
                      textAlign: 'right', 
                      flexShrink: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '6px',
                      minWidth: '70px'
                    }}>
                      <span style={{ fontSize: '12px', color: '#666', fontWeight: '500' }}>
                        Acc: {Math.round(clip.avg_confidence * 100)}%
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectClip(clip);
                        }}
                        style={{
                          padding: '3px 14px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: '#1a73e8',
                          color: 'white',
                          fontSize: '12px',
                          cursor: 'pointer',
                          fontWeight: '500'
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          marginTop: '12px', 
          paddingTop: '10px', 
          borderTop: '1px solid #eee', 
          fontSize: '11px', 
          color: '#aaa', 
          display: 'flex', 
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <span>{filteredClips.length} clip{filteredClips.length !== 1 ? 's' : ''} shown</span>
          <span>Click a clip or press "+ Add"</span>
        </div>
      </div>
    </div>
  );
};

export default EmotionalClipsModal;