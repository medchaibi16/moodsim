using MoodSimBackend.Models;
using System;
using System.Collections.Generic;
using System.Linq;

namespace MoodSimBackend.Services
{
    /// <summary>
    /// The core emotional engine that updates character emotions based on events
    /// Integrates:
    /// - OCC Model (goals → emotions)
    /// - PAD Model (pleasure-arousal-dominance)
    /// - Frijda's Laws (concern relevance)
    /// - ACT-R (memory retrieval)
    /// - Circumplex Model (discrete emotions from PAD)
    /// </summary>
    public class EmotionalEngine
    {
        private CharacterProfile _profile;

        public EmotionalEngine(CharacterProfile profile)
        {
            _profile = profile;
        }

        /// <summary>
        /// Process an event and update the character's emotional state
        /// Based on OCC Model: Events → Goals → Emotions
        /// </summary>
        public void ProcessEvent(string eventType, string activity, float intensity = 0.5f)
        {
            // 1. Check which goals are affected (OCC Model)
            foreach (var goal in _profile.Goals)
            {
                UpdateGoalProgress(goal, eventType, activity);
            }

            // 2. Check which concerns are affected (Frijda's Laws)
            foreach (var concern in _profile.Concerns)
            {
                UpdateConcernSatisfaction(concern, eventType, activity);
            }

            // 3. Update PAD dimensions based on event
            UpdatePADFromEvent(eventType, activity, intensity);

            // 4. Update discrete emotions from PAD (Circumplex Model)
            _profile.CurrentState.UpdateFromPAD();

            // 5. Add to emotional history (for trend analysis)
            _profile.EmotionalHistory.Add(new EmotionalState
            {
                Pleasure = _profile.CurrentState.Pleasure,
                Arousal = _profile.CurrentState.Arousal,
                Dominance = _profile.CurrentState.Dominance
            });

            // 6. Apply personality modifier (Big Five)
            ApplyPersonalityModifier();

            // 7. Store in memory (ACT-R)
            StoreMemory(eventType, activity);

            // 8. Trim history if too long
            if (_profile.EmotionalHistory.Count > 100)
            {
                _profile.EmotionalHistory.RemoveAt(0);
            }
        }

        private void UpdateGoalProgress(Goal goal, string eventType, string activity)
        {
            // OCC Model: Events affect goals positively or negatively
            float delta = 0f;

            switch (eventType)
            {
                case "work":
                    if (goal.Name == "Work completion")
                        delta = 0.05f * goal.Importance;
                    else if (goal.Name == "Rest")
                        delta = -0.03f * goal.Importance;
                    break;
                case "break":
                    if (goal.Name == "Rest")
                        delta = 0.1f * goal.Importance;
                    else if (goal.Name == "Work completion")
                        delta = -0.02f * goal.Importance;
                    break;
                case "eat":
                    if (goal.Name == "Health")
                        delta = 0.08f * goal.Importance;
                    break;
                case "sleep":
                    if (goal.Name == "Rest")
                        delta = 0.15f * goal.Importance;
                    else if (goal.Name == "Health")
                        delta = 0.1f * goal.Importance;
                    break;
                case "argue":
                    if (goal.Name == "Social connection")
                        delta = -0.15f * goal.Importance;
                    else if (goal.Name == "Health")
                        delta = -0.05f * goal.Importance;
                    break;
                case "celebrate":
                    if (goal.Name == "Social connection")
                        delta = 0.12f * goal.Importance;
                    else if (goal.Name == "Work completion")
                        delta = 0.05f * goal.Importance;
                    break;
                case "relax":
                    if (goal.Name == "Rest")
                        delta = 0.1f * goal.Importance;
                    else if (goal.Name == "Health")
                        delta = 0.05f * goal.Importance;
                    break;
                case "exercise":
                    if (goal.Name == "Health")
                        delta = 0.12f * goal.Importance;
                    else if (goal.Name == "Work completion")
                        delta = -0.02f * goal.Importance;
                    break;
                case "phone_scroll":
                    if (goal.Name == "Rest")
                        delta = -0.05f * goal.Importance;
                    else if (goal.Name == "Social connection")
                        delta = 0.02f * goal.Importance;
                    break;
                case "late_night_work":
                    if (goal.Name == "Work completion")
                        delta = 0.08f * goal.Importance;
                    else if (goal.Name == "Rest")
                        delta = -0.15f * goal.Importance;
                    else if (goal.Name == "Health")
                        delta = -0.08f * goal.Importance;
                    break;
                default:
                    delta = 0.02f;
                    break;
            }

            // Apply personality modifier (Big Five)
            // High Conscientiousness = more satisfaction from work
            if (goal.Name == "Work completion" && eventType == "work")
            {
                delta *= (0.5f + _profile.Conscientiousness * 0.5f);
            }

            goal.CurrentProgress = Math.Max(0f, Math.Min(1f, goal.CurrentProgress + delta));
        }

        private void UpdateConcernSatisfaction(Concern concern, string eventType, string activity)
        {
            // Frijda's Laws: Emotional intensity depends on concern relevance
            float delta = 0f;

            if (eventType == "work" && concern.Name == "Work performance")
                delta = 0.05f * concern.Relevance;
            else if (eventType == "break" && concern.Name == "Personal time")
                delta = 0.08f * concern.Relevance;
            else if (eventType == "argue" && concern.Name == "Social approval")
                delta = -0.12f * concern.Relevance;
            else if (eventType == "sleep" && concern.Name == "Physical health")
                delta = 0.1f * concern.Relevance;
            else if (eventType == "relax" && concern.Name == "Personal time")
                delta = 0.1f * concern.Relevance;
            else if (eventType == "celebrate" && concern.Name == "Social approval")
                delta = 0.12f * concern.Relevance;
            else
                delta = 0.02f * concern.Relevance;

            concern.CurrentSatisfaction = Math.Max(0f, Math.Min(1f, concern.CurrentSatisfaction + delta));
        }

        private void UpdatePADFromEvent(string eventType, string activity, float intensity)
        {
            // PAD Model: Each event shifts Pleasure, Arousal, and Dominance
            float pleasureShift = 0f;
            float arousalShift = 0f;
            float dominanceShift = 0f;

            switch (eventType)
            {
                case "work":
                    pleasureShift = -0.05f * intensity;
                    arousalShift = 0.05f * intensity;
                    dominanceShift = 0.02f * intensity;
                    break;
                case "break":
                    pleasureShift = 0.1f * intensity;
                    arousalShift = -0.05f * intensity;
                    dominanceShift = 0.03f * intensity;
                    break;
                case "eat":
                    pleasureShift = 0.12f * intensity;
                    arousalShift = -0.02f * intensity;
                    dominanceShift = 0.05f * intensity;
                    break;
                case "sleep":
                    pleasureShift = 0.05f * intensity;
                    arousalShift = -0.2f * intensity;
                    dominanceShift = -0.05f * intensity;
                    break;
                case "argue":
                    pleasureShift = -0.2f * intensity;
                    arousalShift = 0.15f * intensity;
                    dominanceShift = -0.05f * intensity;
                    break;
                case "celebrate":
                    pleasureShift = 0.25f * intensity;
                    arousalShift = 0.15f * intensity;
                    dominanceShift = 0.1f * intensity;
                    break;
                case "relax":
                    pleasureShift = 0.1f * intensity;
                    arousalShift = -0.1f * intensity;
                    dominanceShift = 0.05f * intensity;
                    break;
                case "exercise":
                    pleasureShift = 0.05f * intensity;
                    arousalShift = 0.2f * intensity;
                    dominanceShift = 0.1f * intensity;
                    break;
                case "phone_scroll":
                    pleasureShift = -0.02f * intensity;
                    arousalShift = 0.02f * intensity;
                    dominanceShift = -0.02f * intensity;
                    break;
                case "late_night_work":
                    pleasureShift = -0.1f * intensity;
                    arousalShift = 0.08f * intensity;
                    dominanceShift = 0.02f * intensity;
                    break;
                default:
                    pleasureShift = 0.02f * intensity;
                    break;
            }

            // Apply personality modifier (Big Five)
            // High Neuroticism amplifies negative shifts
            if (pleasureShift < 0)
                pleasureShift *= (1 + (_profile.Neuroticism - 0.5f) * 0.5f);
            else
                pleasureShift *= (0.5f + (1 - _profile.Neuroticism) * 0.5f);

            // Update PAD with bounds checking
            _profile.CurrentState.Pleasure = Math.Max(-1f, Math.Min(1f, 
                _profile.CurrentState.Pleasure + pleasureShift));
            _profile.CurrentState.Arousal = Math.Max(-1f, Math.Min(1f, 
                _profile.CurrentState.Arousal + arousalShift));
            _profile.CurrentState.Dominance = Math.Max(-1f, Math.Min(1f, 
                _profile.CurrentState.Dominance + dominanceShift));

            // Decay towards baseline over time (simulated)
            DecayPAD();
        }

        private void DecayPAD()
        {
            // PAD dimensions slowly return to baseline (homeostasis)
            float decayRate = 0.01f;
            
            _profile.CurrentState.Pleasure += (_profile.BaselinePleasure - _profile.CurrentState.Pleasure) * decayRate;
            _profile.CurrentState.Arousal += (_profile.BaselineArousal - _profile.CurrentState.Arousal) * decayRate;
            _profile.CurrentState.Dominance += (_profile.BaselineDominance - _profile.CurrentState.Dominance) * decayRate;
        }

        private void ApplyPersonalityModifier()
        {
            // Big Five: Personality affects emotional intensity
            // High Neuroticism = stronger negative emotions
            // High Extraversion = stronger positive emotions
            // High Conscientiousness = more stable emotions

            var dominantEmotion = _profile.CurrentState.GetDominantEmotion();
            
            if (dominantEmotion == "anger" || dominantEmotion == "sadness" || 
                dominantEmotion == "frustration" || dominantEmotion == "stress")
            {
                float modifier = _profile.Neuroticism * 0.3f;
                _profile.CurrentState.EmotionIntensities[dominantEmotion] = 
                    Math.Min(1f, _profile.CurrentState.EmotionIntensities[dominantEmotion] * (1 + modifier));
            }
            else if (dominantEmotion == "happiness")
            {
                float modifier = _profile.Extraversion * 0.3f;
                _profile.CurrentState.EmotionIntensities["happiness"] = 
                    Math.Min(1f, _profile.CurrentState.EmotionIntensities["happiness"] * (1 + modifier));
            }
        }
                public string GetDominantEmotion()
        {
            return _profile.CurrentState.GetDominantEmotion();
        }

        public float GetConfidence()
        {
            return _profile.CurrentState.GetDominantConfidence();
        }

        private void StoreMemory(string eventType, string activity)
        {
            // ACT-R: Store experiences in memory
            var memoryEvent = new MemoryEvent
            {
                EventType = eventType,
                Description = $"{eventType} - {activity}",
                Timestamp = DateTime.Now,
                EmotionalImpact = _profile.CurrentState.Pleasure,
                IsRetrieved = false
            };
            _profile.Memory.Add(memoryEvent);

            if (_profile.Memory.Count > 50)
            {
                _profile.Memory.RemoveAt(0);
            }
        }

        /// <summary>
        /// Get the current interpretation of the character's emotional state
        /// Combines: dominant emotion, PAD dimensions, personality context, goal urgency, and concern satisfaction
        /// </summary>
        public string GetEmotionalInterpretation()
        {
            var state = _profile.CurrentState;
            var dominant = state.GetDominantEmotion();
            var confidence = state.GetDominantConfidence();
            var urgency = _profile.GetOverallUrgency();

            string interpretation = $"{dominant.ToUpper()} ({confidence:P0})";

            // Add PAD context (Mehrabian & Russell, 1974)
            string padDesc = "";
            if (state.Pleasure > 0.3f) padDesc += "pleasant, ";
            else if (state.Pleasure < -0.3f) padDesc += "unpleasant, ";
            
            if (state.Arousal > 0.3f) padDesc += "energized, ";
            else if (state.Arousal < -0.3f) padDesc += "calm, ";
            
            if (state.Dominance > 0.3f) padDesc += "in control";
            else if (state.Dominance < -0.3f) padDesc += "overwhelmed";

            // Add OCC goal context (Ortony, Clore, Collins, 1988)
            string goalContext = "";
            var activeGoals = _profile.Goals.Where(g => g.GetUrgency() > 0.5f).ToList();
            if (activeGoals.Count > 0)
            {
                goalContext = $"Driven by {string.Join(", ", activeGoals.Select(g => g.Name))}";
            }

            // Add Frijda's concern context
            string concernContext = "";
            var relevantConcerns = _profile.Concerns.Where(c => c.Relevance > 0.5f && c.CurrentSatisfaction < 0.4f).ToList();
            if (relevantConcerns.Count > 0)
            {
                concernContext = $"Concerned about {string.Join(", ", relevantConcerns.Select(c => c.Name))}";
            }

            // Add Big Five personality context
            string personalityContext = "";
            if (_profile.Neuroticism > 0.6f)
                personalityContext = "High emotional sensitivity.";
            else if (_profile.Extraversion > 0.6f)
                personalityContext = "Outgoing and expressive.";
            else if (_profile.Conscientiousness > 0.6f)
                personalityContext = "Disciplined and goal-oriented.";

            // Add ACT-R memory context
            string memoryContext = "";
            if (_profile.Memory.Count > 5)
            {
                var recent = _profile.Memory.OrderByDescending(m => m.Timestamp).Take(3);
                memoryContext = $"Recent: {string.Join(" → ", recent.Select(m => m.Description))}";
            }

            string fullInterpretation = $"{interpretation} — {padDesc} {goalContext}. {concernContext} {personalityContext} {memoryContext}";
            return fullInterpretation;
        }

        /// <summary>
        /// Get the system's recommended action based on the current emotional state
        /// </summary>
        public string GetRecommendedAction()
        {
            var state = _profile.CurrentState;
            var dominant = state.GetDominantEmotion();
            var confidence = state.GetDominantConfidence();

            if (confidence < 0.3f)
                return "No action needed. Emotion uncertain.";

            switch (dominant)
            {
                case "anger":
                    return "Dim lights to cold 15%. Silence. Wait 5 minutes. Suggest physical activity.";
                case "sadness":
                    return "Dim lights to warm 30%. Play calm music. Send supportive notification: 'You are not alone.'";
                case "frustration":
                    return "Dim lights to warm 30%. Play calm music. Suggest a short break.";
                case "stress":
                    return "Play calming ambient sounds. Send mindfulness reminder.";
                case "happiness":
                    return "Log happiness pattern. No intervention needed.";
                case "neutral":
                    return "Update baseline. No intervention needed.";
                default:
                    return "Monitor state. No immediate action.";
            }
        }
    }
}