namespace MoodSimBackend.Models
{
    /// <summary>
    /// Represents a character's goal (OCC Model - Ortony, Clore, Collins, 1988)
    /// Emotions arise from how events relate to goals
    /// </summary>
    public class Goal
    {
        public string Name { get; set; }               // e.g., "Work completion", "Rest", "Social connection"
        public float Importance { get; set; }          // 0.0 - 1.0, how much this goal matters
        public float CurrentProgress { get; set; }     // 0.0 - 1.0, how close they are to achieving it
        public float BaselineUrgency { get; set; }     // How quickly this goal needs attention

        public Goal(string name, float importance = 0.5f)
        {
            Name = name;
            Importance = importance;
            CurrentProgress = 0f;
            BaselineUrgency = 0.3f;
        }

        public float GetUrgency()
        {
            // The further from completion, the more urgent
            return BaselineUrgency + (1 - CurrentProgress) * 0.5f;
        }
    }
}