// Place this file at: Services/DayContextTracker.cs
using System;
using System.Collections.Generic;
using System.Linq;
using MoodSimBackend.Models;

namespace MoodSimBackend.Services
{
    /// <summary>
    /// Tracks the emotional shape of the day as events happen, and produces a single
    /// natural-language verdict at the end — not per-event commentary.
    ///
    /// Core idea: activities are tagged by valence (how it feels) and function
    /// (restorative / draining-necessary / draining-negative / neutral-routine).
    /// A small set of transition rules — not per-event hardcoding — catch things like
    /// "gaming after an argument reads as coping" vs "gaming after work reads as earned rest".
    /// Clips are never reinterpreted — their detected emotion is taken at face value.
    /// </summary>
    public class DayContextTracker
    {
        private class StepRecord
        {
            public string Label = "";
            public float AdjustedValence;
            public int DurationMinutes;
            public ActivityFunction Function;
            public string? FlagType; // "coping" | "earned" | "compounding" | null
        }

        private readonly List<StepRecord> _history = new();
        private ActivityFunction? _previousFunction = null;

        // Guessed-activity vocabulary tags (matches ActivityGuesser's output ids)
        private static readonly Dictionary<string, ActivityTag> _activityTags = new()
        {
            ["watching_tv"] = new ActivityTag(0.6f, ActivityFunction.Restorative),
            ["working"] = new ActivityTag(0.0f, ActivityFunction.DrainingNecessary),
            ["sleeping"] = new ActivityTag(0.1f, ActivityFunction.Restorative),
            ["arguing"] = new ActivityTag(-0.7f, ActivityFunction.DrainingNegative),
            ["cooking"] = new ActivityTag(0.1f, ActivityFunction.NeutralRoutine),
            ["phone_scrolling"] = new ActivityTag(0.2f, ActivityFunction.Restorative),
            ["eating"] = new ActivityTag(0.5f, ActivityFunction.Restorative),
            ["exercising"] = new ActivityTag(0.5f, ActivityFunction.DrainingNecessary),
            ["reading"] = new ActivityTag(0.5f, ActivityFunction.Restorative),
            ["relaxing"] = new ActivityTag(0.6f, ActivityFunction.Restorative),
            ["neutral"] = new ActivityTag(0.0f, ActivityFunction.NeutralRoutine),
        };

        private static readonly Dictionary<string, string> _activityLabels = new()
        {
            ["watching_tv"] = "watching TV",
            ["working"] = "working",
            ["sleeping"] = "sleeping",
            ["arguing"] = "an argument",
            ["cooking"] = "cooking",
            ["phone_scrolling"] = "scrolling on his phone",
            ["eating"] = "eating",
            ["exercising"] = "exercising",
            ["reading"] = "reading",
            ["relaxing"] = "relaxing",
            ["neutral"] = "a quiet moment",
        };

        // Clip dominant-emotion -> literal valence (no reinterpretation, ground truth)
        private static readonly Dictionary<string, float> _clipValence = new()
        {
            ["anger"] = -0.8f,
            ["frustration"] = -0.5f,
            ["sadness"] = -0.7f,
            ["stress"] = -0.6f,
            ["neutral"] = 0.0f,
            ["happiness"] = 0.7f,
            ["excited"] = 0.6f,
        };

        public void RecordGuessedStep(string guessedActivity, int durationMinutes, string eventName)
        {
            var tag = _activityTags.TryGetValue(guessedActivity, out var t)
                ? t
                : new ActivityTag(0f, ActivityFunction.NeutralRoutine);

            string label = _activityLabels.TryGetValue(guessedActivity, out var l) ? l : eventName;

            RecordStep(label, tag.BaseValence, tag.Function, durationMinutes);
        }

        public void RecordClipStep(string dominantEmotion, int durationMinutes, string eventName)
        {
            float valence = _clipValence.TryGetValue(dominantEmotion, out var v) ? v : 0f;
            var function = valence < -0.15f ? ActivityFunction.DrainingNegative
                : valence > 0.15f ? ActivityFunction.Restorative
                : ActivityFunction.NeutralRoutine;

            string label = dominantEmotion switch
            {
                "anger" => "an angry outburst",
                "frustration" => "a frustrating moment",
                "sadness" => "a sad moment",
                "stress" => "a stressful moment",
                "happiness" => "a happy moment",
                "excited" => "an exciting moment",
                _ => "a neutral moment"
            };

            // Clips are literal — no transition adjustment applied to the clip's own valence,
            // but they still set _previousFunction so the *next* step's transition rule sees them.
            _history.Add(new StepRecord
            {
                Label = label,
                AdjustedValence = valence,
                DurationMinutes = Math.Max(1, durationMinutes),
                Function = function,
                FlagType = null
            });
            _previousFunction = function;
        }

        private void RecordStep(string label, float baseValence, ActivityFunction function, int durationMinutes)
        {
            float adjusted = baseValence;
            string? flag = null;

            if (_previousFunction == ActivityFunction.DrainingNegative && function == ActivityFunction.Restorative)
            {
                adjusted *= 0.3f; // suppressed credit — this reads as coping, not real recovery
                flag = "coping";
            }
            else if (_previousFunction == ActivityFunction.DrainingNecessary && function == ActivityFunction.Restorative)
            {
                adjusted = Math.Min(1f, adjusted * 1.4f); // earned reward — genuinely helps more
                flag = "earned";
            }
            else if (_previousFunction == ActivityFunction.DrainingNegative && function == ActivityFunction.DrainingNegative)
            {
                adjusted -= 0.2f; // compounding negativity
                flag = "compounding";
            }

            _history.Add(new StepRecord
            {
                Label = label,
                AdjustedValence = adjusted,
                DurationMinutes = Math.Max(1, durationMinutes),
                Function = function,
                FlagType = flag
            });
            _previousFunction = function;
        }

        /// <summary>
        /// Produces the single end-of-day narrative line. Duration-weighted average valence
        /// decides the verdict; any coping/earned/compounding flags get folded in as a clause.
        /// </summary>
        public string GenerateDaySummary()
        {
            if (_history.Count == 0)
                return "No events to summarize.";

            double weightedSum = _history.Sum(s => (double)s.AdjustedValence * s.DurationMinutes);
            double totalWeight = _history.Sum(s => (double)s.DurationMinutes);
            double avgValence = totalWeight > 0 ? weightedSum / totalWeight : 0;

            string verdict = avgValence switch
            {
                >= 0.35 => "a good day",
                >= 0.10 => "a fairly good day",
                > -0.10 => "a mixed day",
                > -0.35 => "a hard day",
                _ => "a rough day"
            };

            // Timeline clause: short comma-joined list of what happened, in order
            var labels = _history.Select(s => s.Label).ToList();
            string timeline = labels.Count == 1
                ? labels[0]
                : string.Join(", ", labels.Take(labels.Count - 1)) + ", then " + labels[^1];
            timeline = char.ToUpper(timeline[0]) + timeline.Substring(1);

            // Flag notes, in the order they occurred — each is its own short sentence.
            // Using the label as the sentence's SUBJECT (not wrapped in "the X reading...")
            // avoids grammar breaking on labels that carry their own object, like "watching TV".
            var notes = new List<string>();
            foreach (var step in _history)
            {
                if (step.FlagType == "coping")
                    notes.Add($"{Capitalize(step.Label)} felt more like avoidance than real rest.");
                else if (step.FlagType == "earned")
                    notes.Add($"{Capitalize(step.Label)} genuinely helped.");
                else if (step.FlagType == "compounding")
                    notes.Add($"Things kept piling up after {step.Label}.");
            }

            string noteSentences = notes.Count > 0 ? " " + string.Join(" ", notes) : "";

            return $"{timeline} — likely {verdict} overall.{noteSentences}";
        }

        private static string Capitalize(string s) =>
            string.IsNullOrEmpty(s) ? s : char.ToUpper(s[0]) + s.Substring(1);

        /// <summary>
        /// Exposes the flag ("coping" | "earned" | "compounding" | null) for each step,
        /// in the same order events were recorded. Used by layer 4 (CurrentEmotionResolver)
        /// to discount a step's surface emotion when it looks like suppression rather than
        /// genuine feeling — e.g. scrolling right after an argument reads as "happiness" on
        /// the surface, but the coping flag says that's not the honest signal.
        /// </summary>
        public List<string?> GetFlags() => _history.Select(s => s.FlagType).ToList();
    }
}
