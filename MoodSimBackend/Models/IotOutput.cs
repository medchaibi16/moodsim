// Place this file at: Models/IotOutput.cs
using System.Collections.Generic;

namespace MoodSimBackend.Models
{
    /// <summary>Where the user actually was, moment to moment — ground truth, not guessed.</summary>
    public class MovementRecord
    {
        public string Time { get; set; } = "";
        public int DurationMinutes { get; set; }
        public int X { get; set; }
        public int Y { get; set; }
        public string Room { get; set; } = "";
        public string Posture { get; set; } = "";
    }

    /// <summary>What the user actually did — the scheduled/real event, not the system's guess.</summary>
    public class ActionRecord
    {
        public string Time { get; set; } = "";
        public int DurationMinutes { get; set; }
        public string ActivityId { get; set; } = "";
        public string Label { get; set; } = "";
        public bool IsClip { get; set; }
        public string Emotion { get; set; } = "";
        public float EmotionConfidence { get; set; }
    }

    /// <summary>One instruction for the house — device-agnostic enough to map onto real IoT hardware.</summary>
    public class IotCommand
    {
        public string Device { get; set; } = "";
        public string Action { get; set; } = "";
        public Dictionary<string, object> Parameters { get; set; } = new();
        public string Reason { get; set; } = ""; // human-readable, safe for the IoT side to ignore
    }

    /// <summary>The single file handed off to the IoT integration: movement + real actions + commands.</summary>
    public class IotOutput
    {
        public string GeneratedAt { get; set; } = "";
        public string Character { get; set; } = "";
        public string DaySummary { get; set; } = "";
        public string CurrentEmotion { get; set; } = "";
        public float CurrentEmotionConfidence { get; set; }
        public List<MovementRecord> Movements { get; set; } = new();
        public List<ActionRecord> Actions { get; set; } = new();
        public List<IotCommand> Commands { get; set; } = new();
    }
}
