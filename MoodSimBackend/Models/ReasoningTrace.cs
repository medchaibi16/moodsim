// Place this file at: Models/ReasoningTrace.cs
using System.Collections.Generic;

namespace MoodSimBackend.Models
{
    /// <summary>
    /// A single beat in the system's "thought process" when guessing an activity.
    /// </summary>
    public class ThoughtBeat
    {
        public string Type { get; set; } = "perception"; // "perception" | "hypothesis" | "conclusion"
        public string Text { get; set; } = "";
        public float Weight { get; set; } // optional, used for hypothesis/conclusion beats
    }

    /// <summary>
    /// The full reasoning trace behind one activity guess — the "thinking" layer.
    /// Built from the same Bayes scores ActivityGuesser already computes,
    /// just harvested before they'd otherwise be discarded.
    /// </summary>
    public class ReasoningTrace
    {
        public List<ThoughtBeat> Beats { get; set; } = new List<ThoughtBeat>();
        public string WinningActivity { get; set; } = "";
        public string RunnerUpActivity { get; set; } = "";
        public float ConfidenceMargin { get; set; } // 0 = neck-and-neck, 1 = totally dominant
    }
}
