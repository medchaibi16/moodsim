using MoodSimBackend.Models;
using System.Collections.Generic;

namespace MoodSimBackend.Services
{
    /// <summary>
    /// Factory for creating scientifically-grounded character profiles
    /// </summary>
    public static class CharacterFactory
    {
        public static CharacterProfile CreateDefaultCharacter()
        {
            return CreateCharacter("Ahmed", "Easily frustrated when working long hours");
        }

        public static CharacterProfile CreateCharacter(string name, string description)
        {
            var profile = new CharacterProfile
            {
                Name = name,
                Description = description,

                // Big Five Personality (Costa & McCrae, 1992)
                Openness = 0.6f,        // Moderately open to new experiences
                Conscientiousness = 0.7f, // High discipline
                Extraversion = 0.5f,     // Balanced
                Agreeableness = 0.6f,    // Generally agreeable
                Neuroticism = 0.65f,     // Moderately high emotional reactivity

                // PAD Baseline (Mehrabian & Russell, 1974)
                BaselinePleasure = 0.2f,
                BaselineArousal = 0.1f,
                BaselineDominance = 0.3f,

                // OCC Goals (Ortony, Clore, Collins, 1988)
                Goals = new List<Goal>
                {
                    new Goal("Work completion", 0.8f),
                    new Goal("Rest", 0.6f),
                    new Goal("Social connection", 0.5f),
                    new Goal("Health", 0.7f)
                },

                // Frijda's Concerns (Frijda, 1988)
                Concerns = new List<Concern>
                {
                    new Concern("Work performance", 0.8f),
                    new Concern("Physical health", 0.7f),
                    new Concern("Social approval", 0.5f),
                    new Concern("Personal time", 0.6f)
                },

                CurrentState = new EmotionalState(),
                EmotionalHistory = new List<EmotionalState>()
            };

            // Initialize emotional state based on baseline
            profile.CurrentState.Pleasure = profile.BaselinePleasure;
            profile.CurrentState.Arousal = profile.BaselineArousal;
            profile.CurrentState.Dominance = profile.BaselineDominance;
            profile.CurrentState.UpdateFromPAD();

            return profile;
        }



    }
}