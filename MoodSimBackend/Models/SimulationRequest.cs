using System;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace MoodSimBackend.Models
{
    public class SimulationRequest
    {
        [JsonPropertyName("startHour")]
        public int StartHour { get; set; }

        [JsonPropertyName("endHour")]
        public int EndHour { get; set; }

        [JsonPropertyName("events")]
        public List<SimulationEvent> Events { get; set; }
    }

    public class SimulationEvent
    {
        [JsonPropertyName("id")]
        public string Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; }

        [JsonPropertyName("icon")]
        public string Icon { get; set; }

        [JsonPropertyName("duration")]
        public int Duration { get; set; }

        [JsonPropertyName("isClip")]
        public bool IsClip { get; set; }

        [JsonPropertyName("clipData")]
        public ClipData? ClipData { get; set; }

        [JsonPropertyName("activityId")]
        public string ActivityId { get; set; }

        // ✅ NEW: Sensor data
        [JsonPropertyName("sensors")]
        public SensorData Sensors { get; set; }
    }

    public class SensorData
    {
        [JsonPropertyName("tvOn")]
        public bool TvOn { get; set; }

        [JsonPropertyName("laptopOn")]
        public bool LaptopOn { get; set; }

        [JsonPropertyName("phoneActive")]
        public bool PhoneActive { get; set; }

        [JsonPropertyName("voiceIntensity")]
        public float VoiceIntensity { get; set; }

        [JsonPropertyName("walkingSpeed")]
        public float WalkingSpeed { get; set; }

        [JsonPropertyName("doorSlamDetected")]
        public bool DoorSlamDetected { get; set; }

        [JsonPropertyName("doorSlamIntensity")]
        public float DoorSlamIntensity { get; set; }
    }
    public class ClipData
    {
        [JsonPropertyName("totalClips")]
        public int TotalClips { get; set; }

        [JsonPropertyName("duration")]
        public int Duration { get; set; }

        [JsonPropertyName("avgConfidence")]
        public float AvgConfidence { get; set; }

        [JsonPropertyName("distribution")]
        public Dictionary<string, int> Distribution { get; set; }

        [JsonPropertyName("filename")]
        public string Filename { get; set; }

        [JsonPropertyName("dominantEmotion")]
        public string DominantEmotion { get; set; }
    }
}