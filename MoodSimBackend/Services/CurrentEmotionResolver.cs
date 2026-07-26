// Place this file at: Services/CurrentEmotionResolver.cs
using System;
using System.Collections.Generic;
using System.Linq;
using MoodSimBackend.Models;

namespace MoodSimBackend.Services
{
    /// <summary>
    /// Layer 4: decides the user's CURRENT emotion, not just "what happened last."
    ///
    /// Every logged step casts a weighted vote for its emotion. Three things shape that weight:
    ///  1. Recency — exponential decay, so a bad morning fades as the day goes on, but doesn't
    ///     vanish the instant something better happens (one good moment after a whole bad day
    ///     shouldn't flip the verdict — and with weighted summation, it naturally doesn't).
    ///  2. Evidence strength — a clip is OBSERVED behavior (he's actually laughing/yelling);
    ///     a guessed event is INFERRED from indirect sensors. Clips get a real multiplier.
    ///  3. Coping discount — if DayContextTracker flagged a step as "coping" (e.g. scrolling
    ///     right after an argument), its surface emotion isn't fully trusted. Some of that
    ///     vote shifts to whatever emotion the preceding negative step actually carried —
    ///     the suppressed feeling is closer to the truth than the surface activity.
    /// </summary>
    public class CurrentEmotionResolver
    {
        // Tunable constants — starting points, meant to be retuned once you've run
        // the 100-scenario batch and can see how they behave on real data.
        //
        // DecayRatePerMinute: half-life = ln(2)/rate. Deliberately set for a ~4-HOUR
        // half-life (not minutes) — this operates over a full simulated DAY, so anything
        // shorter makes the last hour or two of the day the only thing that matters,
        // which lets one recent good clip erase an entire day of sustained frustration.
        // Traced by hand: at the old 46-min half-life, 5 hours of straight frustration
        // followed by one 2-min happy clip resolved to 91% happiness — a full flip, not
        // a nudge. At this rate, the same scenario resolves to a genuinely torn ~50/50.
        private const double DecayRatePerMinute = 0.00289; // ln(2) / 240 minutes
        private const double ClipEvidenceMultiplier = 2.5;
        private const double GuessedEvidenceMultiplier = 1.0;
        private const double CopingSurfaceWeight = 0.4;   // how much the surface emotion still counts
        private const double CopingSuppressedWeight = 0.6; // how much shifts to the suppressed emotion

        public CurrentEmotionResult Resolve(List<SimulationLogEntry> log, List<string?> flags, DateTime asOf)
        {
            var votes = new Dictionary<string, double>();

            for (int i = 0; i < log.Count; i++)
            {
                var step = log[i];
                double minutesAgo = Math.Max(0, (asOf - step.Time).TotalMinutes);
                double recency = Math.Exp(-DecayRatePerMinute * minutesAgo);
                double evidence = step.IsClip ? ClipEvidenceMultiplier : GuessedEvidenceMultiplier;
                double baseWeight = recency * evidence * Math.Max(0.05, step.Confidence);

                string? flag = i < flags.Count ? flags[i] : null;

                if (flag == "coping" && i > 0 && !string.IsNullOrEmpty(log[i - 1].Emotion))
                {
                    // Surface emotion still counts for something (it IS what's showing),
                    // but most of the weight shifts to what's actually being suppressed.
                    AddVote(votes, step.Emotion, baseWeight * CopingSurfaceWeight);
                    AddVote(votes, log[i - 1].Emotion, baseWeight * CopingSuppressedWeight);
                }
                else
                {
                    AddVote(votes, step.Emotion, baseWeight);
                }
            }

            if (votes.Count == 0)
            {
                return new CurrentEmotionResult { Emotion = "neutral", Confidence = 0f, Margin = 0f };
            }

            var ranked = votes.OrderByDescending(v => v.Value).ToList();
            double total = ranked.Sum(v => v.Value);
            double top = ranked[0].Value;
            double second = ranked.Count > 1 ? ranked[1].Value : 0;

            float confidence = total > 0 ? (float)(top / total) : 0f;
            float margin = (top + second) > 0 ? (float)((top - second) / (top + second)) : 0f;

            var breakdown = total > 0
                ? votes.ToDictionary(v => v.Key, v => (float)(v.Value / total))
                : new Dictionary<string, float>();

            return new CurrentEmotionResult
            {
                Emotion = ranked[0].Key,
                Confidence = confidence,
                Margin = margin,
                VoteBreakdown = breakdown
            };
        }

        private static void AddVote(Dictionary<string, double> votes, string emotion, double weight)
        {
            if (string.IsNullOrEmpty(emotion)) return;
            votes[emotion] = votes.GetValueOrDefault(emotion) + weight;
        }
    }
}