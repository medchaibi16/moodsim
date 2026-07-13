using MoodSimBackend.Models;
using System;

namespace MoodSimBackend.Services
{
    /// <summary>
    /// Lightweight Observation Service for Simulation
    /// Does NOT run heavy AI models (Wav2Vec2, VideoMAE, AST)
    /// Uses precomputed clip data and simulated location/time
    /// </summary>
    public class ObservationService
    {
        private readonly RoomMap _roomMap;
        private int _currentX;
        private int _currentY;
        private string _currentPosture;

        // Store the current observation
        private Observation _currentObservation;

        public ObservationService(RoomMap roomMap)
        {
            _roomMap = roomMap;
            _currentX = 4;
            _currentY = 5;
            _currentPosture = "standing";
            _currentObservation = new Observation();
        }

        public void UpdateLocation(int x, int y, string posture)
        {
            _currentX = x;
            _currentY = y;
            _currentPosture = posture;
        }

        public Observation CollectObservation(
            string detectedEmotion = null,
            float emotionConfidence = 0f,
            string dominantEmotion = null,
            float avgConfidence = 0f,
            Dictionary<string, int> distribution = null,
            bool isClip = false,
            string clipFilename = null)
        {
            // Get location from room map
            var room = _roomMap.GetRoomFromPosition(_currentX, _currentY);

            var observation = new Observation
            {
                // From Location (simulated)
                PositionX = _currentX,
                PositionY = _currentY,
                CurrentRoom = room ?? "unknown",
                Posture = _currentPosture,

                // From Time
                Timestamp = DateTime.Now
            };

            // If it's a clip event, use precomputed data
            if (isClip && !string.IsNullOrEmpty(dominantEmotion))
            {
                observation.DetectedEmotion = dominantEmotion;
                observation.EmotionConfidence = avgConfidence;
                observation.AudioEmotion = dominantEmotion;
                observation.FaceEmotion = dominantEmotion;
                observation.AudioConfidence = avgConfidence;
                observation.FaceConfidence = avgConfidence;
                observation.Distribution = distribution ?? new Dictionary<string, int>();
            }
            else if (!string.IsNullOrEmpty(detectedEmotion))
            {
                // For regular events, use the emotion from the user's schedule
                observation.DetectedEmotion = detectedEmotion;
                observation.EmotionConfidence = emotionConfidence;
                observation.AudioEmotion = detectedEmotion;
                observation.FaceEmotion = detectedEmotion;
                observation.AudioConfidence = emotionConfidence;
                observation.FaceConfidence = emotionConfidence;
            }
            else
            {
                // Default: neutral
                observation.DetectedEmotion = "neutral";
                observation.EmotionConfidence = 0.5f;
                observation.AudioEmotion = "neutral";
                observation.FaceEmotion = "neutral";
                observation.AudioConfidence = 0.5f;
                observation.FaceConfidence = 0.5f;
            }

            _currentObservation = observation;
            return observation;
        }

        public Observation GetCurrentObservation()
        {
            return _currentObservation;
        }

        public string GetCurrentRoom()
        {
            return _roomMap.GetRoomFromPosition(_currentX, _currentY) ?? "unknown";
        }

        public (int X, int Y, string Posture) GetCurrentLocation()
        {
            return (_currentX, _currentY, _currentPosture);
        }
    }
}