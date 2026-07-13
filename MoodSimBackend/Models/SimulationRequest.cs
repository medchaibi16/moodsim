using System;
using System.Collections.Generic;

namespace MoodSimBackend.Models
{
    public class SimulationRequest
    {
        public int StartHour { get; set; }
        public int EndHour { get; set; }
        public List<SimulationEvent> Events { get; set; }
    }

    public class SimulationEvent
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string Icon { get; set; }
        public int Duration { get; set; }
        public bool IsClip { get; set; }
        public ClipData ClipData { get; set; }
        public string ActivityId { get; set; }
    }

    public class ClipData
    {
        public int TotalClips { get; set; }
        public int Duration { get; set; }
        public float AvgConfidence { get; set; }
        public Dictionary<string, int> Distribution { get; set; }
        public string Filename { get; set; }
        public string DominantEmotion { get; set; }
    }
}