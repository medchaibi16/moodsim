namespace MoodSimBackend.Models
{
    /// <summary>
    /// Represents a character's concern (Frijda's Laws of Emotion, 1988)
    /// Emotional intensity depends on how relevant an event is to a concern
    /// </summary>
    public class Concern
    {
        public string Name { get; set; }               // e.g., "Health", "Work performance", "Social approval"
        public float Relevance { get; set; }           // 0.0 - 1.0, how much this matters to the character
        public float CurrentSatisfaction { get; set; } // 0.0 - 1.0, how satisfied they are

        public Concern(string name, float relevance = 0.5f)
        {
            Name = name;
            Relevance = relevance;
            CurrentSatisfaction = 0.6f; // Neutral starting point
        }
    }
}