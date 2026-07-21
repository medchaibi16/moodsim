using MoodSimBackend.Models;
using System;
using System.Collections.Generic;

namespace MoodSimBackend.Services
{
    public class ObservationService
    {
        private readonly RoomMap _roomMap;
        private int _currentX;
        private int _currentY;
        private string _currentPosture;
        private Observation _currentObservation;

        // Sensor state
        private bool _tvOn;
        private bool _laptopOn;
        private bool _phoneActive;
        private float _voiceIntensity;
        private float _walkingSpeed;
        private bool _doorSlamDetected;
        private float _doorSlamIntensity;
        private bool _isAlone;

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

        public void UpdateSensors(
            bool tvOn = false,
            bool laptopOn = false,
            bool phoneActive = false,
            float voiceIntensity = 0f,
            float walkingSpeed = 0f,
            bool doorSlamDetected = false,
            float doorSlamIntensity = 0f,
            bool isAlone = true)
        {
            _tvOn = tvOn;
            _laptopOn = laptopOn;
            _phoneActive = phoneActive;
            _voiceIntensity = voiceIntensity;
            _walkingSpeed = walkingSpeed;
            _doorSlamDetected = doorSlamDetected;
            _doorSlamIntensity = doorSlamIntensity;
            _isAlone = isAlone;
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
            var room = _roomMap.GetRoomFromPosition(_currentX, _currentY);

            var observation = new Observation
            {
                PositionX = _currentX,
                PositionY = _currentY,
                CurrentRoom = room ?? "unknown",
                Posture = _currentPosture,
                Timestamp = DateTime.Now,

                // Sensor data
                TvOn = _tvOn,
                LaptopOn = _laptopOn,
                PhoneActive = _phoneActive,
                VoiceIntensity = _voiceIntensity,
                WalkingSpeed = _walkingSpeed,
                DoorSlamDetected = _doorSlamDetected,
                DoorSlamIntensity = _doorSlamIntensity,
                IsAlone = _isAlone
            };

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
                observation.DetectedEmotion = detectedEmotion;
                observation.EmotionConfidence = emotionConfidence;
                observation.AudioEmotion = detectedEmotion;
                observation.FaceEmotion = detectedEmotion;
                observation.AudioConfidence = emotionConfidence;
                observation.FaceConfidence = emotionConfidence;
            }
            else
            {
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

        public Observation GetCurrentObservation() => _currentObservation;
        public string GetCurrentRoom() => _roomMap.GetRoomFromPosition(_currentX, _currentY) ?? "unknown";
        public (int X, int Y, string Posture) GetCurrentLocation() => (_currentX, _currentY, _currentPosture);
    }
}