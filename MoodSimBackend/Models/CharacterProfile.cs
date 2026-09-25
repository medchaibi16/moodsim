using System.Collections.Generic;
using System.Linq;

namespace MoodSimBackend.Models
{
    /// <summary>
    /// Complete Character Profile integrating multiple psychological models:
    /// - Big Five Personality (Costa & McCrae, 1992)
    /// - OCC Model (Ortony, Clore, Collins, 1988)
    /// - PAD Model (Mehrabian & Russell, 1974)
    /// - Frijda's Concerns (Frijda, 1988)
    /// - ACT-R Memory (Anderson, 1996)
    /// </summary>
    public class CharacterProfile
    {
        // Basic Information
        public string Name { get; set; }
        public string Description { get; set; }
        
        // 1. Big Five Personality Traits (Costa & McCrae, 1992)
        // OCEAN: Openness, Conscientiousness, Extraversion, Agreeableness, Neuroticism
        public float Openness { get; set; }        // 0.0 - 1.0
        public float Conscientiousness { get; set; } // 0.0 - 1.0
        public float Extraversion { get; set; }    // 0.0 - 1.0
        public float Agreeableness { get; set; }   // 0.0 - 1.0
        public float Neuroticism { get; set; }     // 0.0 - 1.0

        // 2. PAD Baseline (Mehrabian & Russell, 1974)
        public float BaselinePleasure { get; set; }   // -1.0 to +1.0
        public float BaselineArousal { get; set; }    // -1.0 to +1.0
        public float BaselineDominance { get; set; }  // -1.0 to +1.0

        // 3. OCC Goals (Ortony, Clore, Collins, 1988)
        public List<Goal> Goals { get; set; }

        // 4. Frijda's Concerns (Frijda, 1988)
        public List<Concern> Concerns { get; set; }

        // 5. ACT-R Memory (Anderson, 1996)
        public List<MemoryEvent> Memory { get; set; }

        // 6. Current Emotional State
        public EmotionalState CurrentState { get; set; }

        // 7. Historical Context (for trend analysis)
        public List<EmotionalState> EmotionalHistory { get; set; }

        public CharacterProfile()
        {
            Goals = new List<Goal>();
            Concerns = new List<Concern>();
            Memory = new List<MemoryEvent>();
            CurrentState = new EmotionalState();
            EmotionalHistory = new List<EmotionalState>();
        }

        /// <summary>
        /// Calculate a personality modifier for emotional reactions
        /// High Neuroticism = stronger negative reactions
        /// High Conscientiousness = more disciplined responses
        /// </summary>
        public float GetPersonalityModifier(string emotion)
        {
            float modifier = 1f;
            
            if (emotion == "anger" || emotion == "frustration" || emotion == "stress")
            {
                // High Neuroticism amplifies negative emotions
                modifier += (Neuroticism - 0.5f) * 0.4f;
                
                // High Agreeableness reduces anger
                if (emotion == "anger")
                    modifier -= (Agreeableness - 0.5f) * 0.3f;
            }
            else if (emotion == "happiness")
            {
                // High Extraversion amplifies positive emotions
                modifier += (Extraversion - 0.5f) * 0.3f;
            }
            
            return Math.Max(0.1f, modifier);
        }

        /// <summary>
        /// Get the current urgency based on goals (OCC Model)
        /// </summary>
        public float GetOverallUrgency()
        {
            if (Goals.Count == 0) return 0f;
            return Goals.Average(g => g.GetUrgency());
        }

        /// <summary>
        /// Check if a concern has been triggered (Frijda's Laws)
        /// </summary>
        public float GetConcernRelevance(string concernName)
        {
            var concern = Concerns.FirstOrDefault(c => c.Name == concernName);
            return concern != null ? concern.Relevance : 0f;
        }
    }

    /// <summary>
    /// Memory Event for ACT-R (Anderson, 1996)
    /// </summary>
    public class MemoryEvent
    {
        public string EventType { get; set; }
        public string Description { get; set; }
        public float EmotionalImpact { get; set; } // -1.0 to +1.0
        public System.DateTime Timestamp { get; set; }
        public bool IsRetrieved { get; set; } // Has this been recalled?
    }
}