using System;
using System.Collections.Generic;

namespace MoodSimBackend.Models
{
    public class Observation
    {
        // === Emotion from Clip (precomputed) ===
        public string DetectedEmotion { get; set; }
        public float EmotionConfidence { get; set; }
        public string AudioEmotion { get; set; }
        public string FaceEmotion { get; set; }
        public float AudioConfidence { get; set; }
        public float FaceConfidence { get; set; }

        // === Emotion Distribution (for clips) ===
        public Dictionary<string, int> Distribution { get; set; }

        // === Location ===
        public int PositionX { get; set; }
        public int PositionY { get; set; }
        public string CurrentRoom { get; set; }
        public string Posture { get; set; } // "standing", "sitting", "lying", "pacing", "walking"

        // === Time ===
        public DateTime Timestamp { get; set; }
        public int Hour => Timestamp.Hour;
        public string TimeOfDay => GetTimeOfDay();

        // === NEW: Sensor Data for Activity Guessing ===
        public bool TvOn { get; set; }
        public bool LaptopOn { get; set; }
        public bool PhoneActive { get; set; }
        public float VoiceIntensity { get; set; } // 0.0 - 1.0
        public float WalkingSpeed { get; set; }   // 0.0 - 1.0
        public string WalkingPattern { get; set; } // "steady", "pacing", "erratic", "slow"
        public bool DoorSlamDetected { get; set; }
        public float DoorSlamIntensity { get; set; }
        public bool IsAlone { get; set; }

        // Helper method
        private string GetTimeOfDay()
        {
            if (Hour < 6) return "late_night";
            if (Hour < 12) return "morning";
            if (Hour < 17) return "afternoon";
            if (Hour < 21) return "evening";
            return "night";
        }

        public override string ToString()
        {
            return $"[{Timestamp:HH:mm}] {DetectedEmotion} ({EmotionConfidence:P0}) in {CurrentRoom} ({Posture})";
        }
    }
}