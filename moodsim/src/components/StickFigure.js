import React from 'react';

const StickFigure = ({ emotion = "neutral" }) => {
  const getExpression = () => {
    switch(emotion) {
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'frustrated': return '😤';
      case 'stress': return '😰';
      default: return '😐';
    }
  };

  return (
    <svg width="160" height="200" viewBox="0 0 160 200" style={{ display: 'block', margin: '0 auto' }}>
      {/* Head */}
      <circle cx="80" cy="45" r="30" fill="#f0d5b8" stroke="#333" strokeWidth="2.5" />
      
      {/* Eyes */}
      <circle cx="70" cy="40" r="4" fill="#333" />
      <circle cx="90" cy="40" r="4" fill="#333" />
      
      {/* Mouth based on emotion */}
      {emotion === 'happy' && (
        <path d="M 68 52 Q 80 62 92 52" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
      {emotion === 'sad' && (
        <path d="M 68 58 Q 80 48 92 58" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}
      {emotion === 'angry' && (
        <>
          <path d="M 62 50 L 70 55 L 62 60" stroke="#333" strokeWidth="2" fill="none" />
          <path d="M 98 50 L 90 55 L 98 60" stroke="#333" strokeWidth="2" fill="none" />
          <path d="M 68 58 Q 80 65 92 58" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {emotion === 'neutral' && (
        <line x1="70" y1="55" x2="90" y2="55" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
      )}
      {emotion === 'frustrated' && (
        <>
          <path d="M 64 48 L 72 52 L 64 56" stroke="#333" strokeWidth="2" fill="none" />
          <path d="M 96 48 L 88 52 L 96 56" stroke="#333" strokeWidth="2" fill="none" />
          <path d="M 68 58 Q 80 65 92 58" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </>
      )}
      {emotion === 'stress' && (
        <>
          <path d="M 60 44 L 68 48 L 60 52" stroke="#333" strokeWidth="2" fill="none" />
          <path d="M 100 44 L 92 48 L 100 52" stroke="#333" strokeWidth="2" fill="none" />
          <line x1="68" y1="56" x2="92" y2="56" stroke="#333" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
      
      {/* Body */}
      <line x1="80" y1="75" x2="80" y2="130" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      
      {/* Arms */}
      <line x1="80" y1="90" x2="50" y2="110" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="90" x2="110" y2="110" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      
      {/* Legs */}
      <line x1="80" y1="130" x2="55" y2="170" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      <line x1="80" y1="130" x2="105" y2="170" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      
      {/* Feet */}
      <line x1="55" y1="170" x2="45" y2="175" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      <line x1="105" y1="170" x2="115" y2="175" stroke="#333" strokeWidth="3" strokeLinecap="round" />
      
      {/* Expression label */}
      <text x="80" y="195" textAnchor="middle" fontSize="14" fill="#666" fontFamily="sans-serif">
        {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
      </text>
    </svg>
  );
};

export default StickFigure;