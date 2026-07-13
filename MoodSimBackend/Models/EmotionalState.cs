using System.Collections.Generic;

namespace MoodSimBackend.Models
{
    /// <summary>
    /// Represents the current emotional state of a character
    /// Based on PAD Model (Mehrabian & Russell, 1974)
    /// and Circumplex Model (Russell, 1980)
    /// </summary>
    public class EmotionalState
    {
        // PAD Dimensions (Mehrabian & Russell, 1974)
        public float Pleasure { get; set; }    // -1.0 (unpleasant) to +1.0 (pleasant)
        public float Arousal { get; set; }     // -1.0 (calm) to +1.0 (excited)
        public float Dominance { get; set; }   // -1.0 (controlled) to +1.0 (in control)

        // Discrete emotions (derived from PAD and Circumplex)
        public Dictionary<string, float> EmotionIntensities { get; set; }

        public EmotionalState()
        {
            Pleasure = 0f;
            Arousal = 0f;
            Dominance = 0f;
            EmotionIntensities = new Dictionary<string, float>();
            InitializeEmotions();
        }

        private void InitializeEmotions()
        {
            // Six basic emotions (based on Ekman, 1992)
            EmotionIntensities["anger"] = 0f;
            EmotionIntensities["sadness"] = 0f;
            EmotionIntensities["happiness"] = 0f;
            EmotionIntensities["frustration"] = 0f;
            EmotionIntensities["stress"] = 0f;
            EmotionIntensities["neutral"] = 1f;
        }

        public void UpdateFromPAD()
        {
            // Map PAD to discrete emotions (Russell's Circumplex, 1980)
            // Happiness: High Pleasure, Medium Arousal, Medium Dominance
            EmotionIntensities["happiness"] = Math.Max(0, (Pleasure + 0.5f) * 0.6f + (Arousal * 0.2f) + 0.2f);
            
            // Sadness: Low Pleasure, Low Arousal, Low Dominance
            EmotionIntensities["sadness"] = Math.Max(0, (0.5f - Pleasure) * 0.6f + (0.5f - Arousal) * 0.2f + 0.2f);
            
            // Anger: Low Pleasure, High Arousal, High Dominance
            EmotionIntensities["anger"] = Math.Max(0, (0.5f - Pleasure) * 0.5f + (Arousal + 0.5f) * 0.3f + (Dominance + 0.5f) * 0.2f);
            
            // Stress/Anxiety: Low Pleasure, High Arousal, Low Dominance
            EmotionIntensities["stress"] = Math.Max(0, (0.5f - Pleasure) * 0.4f + (Arousal + 0.5f) * 0.4f + (0.5f - Dominance) * 0.2f);
            
            // Frustration: Low Pleasure, Medium Arousal, Low Dominance
            EmotionIntensities["frustration"] = Math.Max(0, (0.5f - Pleasure) * 0.5f + (Arousal * 0.3f) + (0.5f - Dominance) * 0.2f);
            
            // Neutral: Baseline when all dimensions are near zero
            float sumOthers = EmotionIntensities["happiness"] + EmotionIntensities["sadness"] + 
                             EmotionIntensities["anger"] + EmotionIntensities["stress"] + 
                             EmotionIntensities["frustration"];
            EmotionIntensities["neutral"] = Math.Max(0, 1f - sumOthers * 0.5f);
            
            // Normalize all emotions to sum to 1
            float total = EmotionIntensities.Values.Sum();
            if (total > 0)
            {
                var keys = new List<string>(EmotionIntensities.Keys);
                foreach (var key in keys)
                {
                    EmotionIntensities[key] /= total;
                }
            }
        }

        public string GetDominantEmotion()
        {
            return EmotionIntensities.OrderByDescending(kv => kv.Value).First().Key;
        }

        public float GetDominantConfidence()
        {
            return EmotionIntensities.Values.Max();
        }
    }
}