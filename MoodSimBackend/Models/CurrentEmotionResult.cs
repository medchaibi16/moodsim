// Place this file at: Models/CurrentEmotionResult.cs
using System.Collections.Generic;

namespace MoodSimBackend.Models
{
    /// <summary>
    /// Layer 4's output: the system's best guess at the user's CURRENT emotion,
    /// resolved from the whole day's evidence — not just the last event.
    /// </summary>
    public class CurrentEmotionResult
    {
        public string Emotion { get; set; } = "neutral";

        // How much of the total vote weight the winning emotion holds (0-1).
        public float Confidence { get; set; }

        // Gap between the winning emotion and the runner-up (0-1). Low margin = genuinely torn,
        // not just "not much evidence" — useful for layer 5 to know when to hedge its response.
        public float Margin { get; set; }

        // Full normalized distribution across all emotions that received any vote —
        // essential for debugging/tuning, and potentially useful to layer 5 later
        // (e.g. "mostly happy, but with real leftover frustration" rather than a single label).
        public Dictionary<string, float> VoteBreakdown { get; set; } = new();
    }
}
