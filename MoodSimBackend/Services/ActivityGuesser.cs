// Place this file at: Services/ActivityGuesser.cs
using System;
using System.Collections.Generic;
using System.Linq;
using MoodSimBackend.Models;

namespace MoodSimBackend.Services
{
    public class ActivityGuesser
    {
        private readonly Dictionary<string, double> _priors;
        private readonly Dictionary<string, Dictionary<string, double>> _likelihoods;

        // Human-readable labels for activities (used by the reasoning trace)
        private static readonly Dictionary<string, string> _activityLabels = new Dictionary<string, string>
        {
            ["watching_tv"] = "watching TV",
            ["working"] = "working",
            ["sleeping"] = "sleeping",
            ["arguing"] = "arguing",
            ["cooking"] = "cooking",
            ["phone_scrolling"] = "scrolling on his phone",
            ["eating"] = "eating",
            ["exercising"] = "exercising",
            ["reading"] = "reading",
            ["relaxing"] = "relaxing"
        };

        // Human-readable phrases for individual pieces of sensor evidence
        private static readonly Dictionary<string, string> _evidencePhrases = new Dictionary<string, string>
        {
            ["tv_on"] = "the TV being on",
            ["laptop_on"] = "the laptop being on",
            ["phone_active"] = "the phone being active",
            ["high_voice"] = "the raised voice",
            ["kitchen"] = "being in the kitchen",
            ["living_room"] = "being in the living room",
            ["dining_room"] = "being at the dining table",
            ["bedroom_1"] = "being in the bedroom",
            ["bedroom_2"] = "being in the second bedroom",
            ["sitting"] = "sitting down",
            ["standing"] = "standing up",
            ["lying"] = "lying down",
            ["pacing"] = "the pacing",
            ["fast_walk"] = "the quick movement",
            ["not_alone"] = "not being alone",
            ["morning"] = "it being morning",
            ["afternoon"] = "it being afternoon",
            ["evening"] = "it being evening",
            ["night"] = "it being night",
            ["late_night"] = "it being late at night"
        };

        public ActivityGuesser()
        {
            // Prior probabilities for each activity (what's likely based on time of day)
            _priors = new Dictionary<string, double>
            {
                ["watching_tv"] = 0.15,
                ["working"] = 0.25,
                ["sleeping"] = 0.08,
                ["arguing"] = 0.05,
                ["cooking"] = 0.08,
                ["phone_scrolling"] = 0.12,
                ["eating"] = 0.07,
                ["exercising"] = 0.05,
                ["reading"] = 0.06,
                ["relaxing"] = 0.09
            };

            // Likelihoods: P(Sensor | Activity)
            _likelihoods = new Dictionary<string, Dictionary<string, double>>
            {
                ["watching_tv"] = new Dictionary<string, double>
                {
                    ["tv_on"] = 0.95,
                    ["living_room"] = 0.85,
                    ["sitting"] = 0.90,
                    ["evening"] = 0.70,
                    ["night"] = 0.40
                },
                ["working"] = new Dictionary<string, double>
                {
                    ["laptop_on"] = 0.90,
                    ["bedroom_2"] = 0.75,
                    ["sitting"] = 0.90,
                    ["morning"] = 0.70,
                    ["afternoon"] = 0.60
                },
                ["sleeping"] = new Dictionary<string, double>
                {
                    ["bedroom_1"] = 0.85,
                    ["bedroom_2"] = 0.70,
                    ["lying"] = 0.95,
                    ["late_night"] = 0.90,
                    ["night"] = 0.80
                },
                ["arguing"] = new Dictionary<string, double>
                {
                    ["high_voice"] = 0.90,
                    ["pacing"] = 0.75,
                    ["living_room"] = 0.60,
                    ["evening"] = 0.50,
                    ["not_alone"] = 0.85
                },
                ["cooking"] = new Dictionary<string, double>
                {
                    ["kitchen"] = 0.95,
                    ["standing"] = 0.80,
                    ["morning"] = 0.50,
                    ["afternoon"] = 0.60,
                    ["evening"] = 0.70
                },
                ["phone_scrolling"] = new Dictionary<string, double>
                {
                    ["phone_active"] = 0.80,
                    ["sitting"] = 0.70,
                    ["lying"] = 0.60,
                    ["anytime"] = 0.50
                },
                ["eating"] = new Dictionary<string, double>
                {
                    ["dining_room"] = 0.85,
                    ["kitchen"] = 0.60,
                    ["sitting"] = 0.80,
                    ["morning"] = 0.50,
                    ["afternoon"] = 0.60,
                    ["evening"] = 0.70
                },
                ["exercising"] = new Dictionary<string, double>
                {
                    ["living_room"] = 0.70,
                    ["fast_walk"] = 0.85,
                    ["standing"] = 0.80,
                    ["morning"] = 0.60,
                    ["afternoon"] = 0.50
                },
                ["reading"] = new Dictionary<string, double>
                {
                    ["living_room"] = 0.70,
                    ["bedroom_1"] = 0.60,
                    ["sitting"] = 0.85,
                    ["afternoon"] = 0.60,
                    ["evening"] = 0.50
                },
                ["relaxing"] = new Dictionary<string, double>
                {
                    ["living_room"] = 0.70,
                    ["sitting"] = 0.80,
                    ["lying"] = 0.70,
                    ["afternoon"] = 0.50,
                    ["evening"] = 0.70
                }
            };
        }

        // ---------- Existing public behavior (unchanged output) ----------

        public string GuessActivity(Observation observation)
        {
            var scores = ComputeScores(observation);

            double total = scores.Values.Sum();
            if (total == 0) return "neutral";

            var bestActivity = scores.OrderByDescending(x => x.Value).First();
            return bestActivity.Key;
        }

        public float GetConfidence(string activity, Observation observation)
        {
            // Simplified confidence based on how many sensors support the activity
            int totalSensors = 0;
            int supportingSensors = 0;

            var sensorChecks = new Dictionary<string, Func<Observation, bool>>
            {
                ["tv_on"] = o => o.TvOn,
                ["laptop_on"] = o => o.LaptopOn,
                ["phone_active"] = o => o.PhoneActive,
                ["high_voice"] = o => o.VoiceIntensity > 0.7,
                ["kitchen"] = o => o.CurrentRoom == "kitchen",
                ["living_room"] = o => o.CurrentRoom == "living_room",
                ["dining_room"] = o => o.CurrentRoom == "dining_room",
                ["sitting"] = o => o.Posture == "sitting",
                ["standing"] = o => o.Posture == "standing",
                ["lying"] = o => o.Posture == "lying",
                ["pacing"] = o => o.Posture == "pacing",
                ["fast_walk"] = o => o.WalkingSpeed > 0.7
            };

            foreach (var check in sensorChecks)
            {
                if (check.Value(observation))
                {
                    totalSensors++;
                    if (_likelihoods[activity].ContainsKey(check.Key) && _likelihoods[activity][check.Key] > 0.6)
                    {
                        supportingSensors++;
                    }
                }
            }

            return totalSensors == 0 ? 0.3f : Math.Min(0.95f, (float)supportingSensors / totalSensors);
        }

        // ---------- NEW: reasoning trace (layer 3) ----------

        /// <summary>
        /// Builds a step-by-step "thought process" behind the given activity guess,
        /// using the same scores GuessActivity computes internally.
        /// Purely additive — does not change GuessActivity or GetConfidence behavior.
        /// </summary>
        public ReasoningTrace GenerateReasoningTrace(Observation observation, string guessedActivity)
        {
            var trace = new ReasoningTrace { WinningActivity = guessedActivity };
            var scores = ComputeScores(observation);
            var ranked = scores.OrderByDescending(x => x.Value).ToList();

            if (ranked.Count == 0 || !scores.ContainsKey(guessedActivity))
            {
                trace.Beats.Add(new ThoughtBeat
                {
                    Type = "conclusion",
                    Text = "Nothing stands out — treating this as a neutral moment."
                });
                return trace;
            }

            var winner = ranked.First(x => x.Key == guessedActivity);
            var runnerUpEntry = ranked.FirstOrDefault(x => x.Key != guessedActivity);
            string runnerUp = runnerUpEntry.Key ?? guessedActivity;
            trace.RunnerUpActivity = runnerUp;

            double total = winner.Value + runnerUpEntry.Value;
            trace.ConfidenceMargin = total > 0
                ? (float)((winner.Value - runnerUpEntry.Value) / total)
                : 0f;

            // 1. Perception beats — plain description of what's being observed
            trace.Beats.AddRange(BuildPerceptionBeats(observation));

            // 2. Hypothesis beat — winner vs runner-up, with the clinching evidence
            trace.Beats.Add(BuildHypothesisBeat(observation, guessedActivity, runnerUp));

            // 3. Conclusion beat — hedge word driven by confidence margin
            trace.Beats.Add(BuildConclusionBeat(guessedActivity, trace.ConfidenceMargin));

            return trace;
        }

        private List<ThoughtBeat> BuildPerceptionBeats(Observation observation)
        {
            var beats = new List<ThoughtBeat>
            {
                new ThoughtBeat
                {
                    Type = "perception",
                    Text = $"{GetRoomPhrase(observation.CurrentRoom)}, {GetPostureVerb(observation.Posture)}."
                }
            };

            if (observation.PhoneActive)
                beats.Add(new ThoughtBeat { Type = "perception", Text = "Phone's active." });
            if (observation.LaptopOn)
                beats.Add(new ThoughtBeat { Type = "perception", Text = "Laptop's on." });
            if (observation.TvOn)
                beats.Add(new ThoughtBeat { Type = "perception", Text = "TV's running." });
            if (observation.VoiceIntensity > 0.7)
                beats.Add(new ThoughtBeat { Type = "perception", Text = "Voice is raised." });
            if (!observation.IsAlone)
                beats.Add(new ThoughtBeat { Type = "perception", Text = "Not alone in the room." });
            if (observation.Posture == "pacing")
                beats.Add(new ThoughtBeat { Type = "perception", Text = "Pacing back and forth." });
            else if (observation.WalkingSpeed > 0.7)
                beats.Add(new ThoughtBeat { Type = "perception", Text = "Moving quickly." });

            return beats;
        }

        private ThoughtBeat BuildHypothesisBeat(Observation observation, string winner, string runnerUp)
        {
            var evidence = BuildSensorEvidence(observation);
            string clincher = null;
            double bestDistinguishingPower = double.MinValue;

            if (_likelihoods.ContainsKey(winner))
            {
                foreach (var kv in _likelihoods[winner])
                {
                    if (kv.Key == "anytime") continue; // not real evidence, never a clincher
                    if (!evidence.TryGetValue(kv.Key, out bool present) || !present) continue;

                    double winnerLikelihood = kv.Value;
                    double runnerLikelihood = (_likelihoods.ContainsKey(runnerUp) && _likelihoods[runnerUp].ContainsKey(kv.Key))
                        ? _likelihoods[runnerUp][kv.Key]
                        : 0.3; // unlisted = assumed weak support for the runner-up

                    double distinguishingPower = winnerLikelihood - runnerLikelihood;
                    if (distinguishingPower > bestDistinguishingPower)
                    {
                        bestDistinguishingPower = distinguishingPower;
                        clincher = kv.Key;
                    }
                }
            }

            string winnerLabel = GetActivityLabel(winner);
            string runnerLabel = GetActivityLabel(runnerUp);

            if (clincher != null && bestDistinguishingPower > 0)
            {
                string evidencePhrase = GetEvidencePhrase(clincher);
                return new ThoughtBeat
                {
                    Type = "hypothesis",
                    Text = $"Could be {runnerLabel} — but {evidencePhrase} points more toward {winnerLabel}.",
                    Weight = (float)bestDistinguishingPower
                };
            }

            return new ThoughtBeat
            {
                Type = "hypothesis",
                Text = $"Weighing {winnerLabel} against {runnerLabel} — {winnerLabel} fits the overall picture better.",
                Weight = 0f
            };
        }

        private ThoughtBeat BuildConclusionBeat(string activity, float confidenceMargin)
        {
            string hedge = confidenceMargin >= 0.5f ? "Clearly"
                : confidenceMargin >= 0.2f ? "Probably"
                : "Possibly";

            return new ThoughtBeat
            {
                Type = "conclusion",
                Text = $"{hedge} {GetActivityLabel(activity)}.",
                Weight = confidenceMargin
            };
        }

        private string GetRoomPhrase(string room) => room switch
        {
            "bedroom_1" => "In the bedroom",
            "bedroom_2" => "In the second bedroom",
            "kitchen" => "In the kitchen",
            "dining_room" => "At the dining table",
            "living_room" => "In the living room",
            "bathroom" => "In the bathroom",
            "hallway" => "In the hallway",
            "entry" => "Near the front door",
            _ => "Somewhere in the house"
        };

        private string GetPostureVerb(string posture) => posture switch
        {
            "sitting" => "sitting down",
            "standing" => "standing",
            "lying" => "lying down",
            "pacing" => "pacing",
            "walking" => "on the move",
            _ => "in an unclear position"
        };

        private string GetActivityLabel(string activity) =>
            _activityLabels.TryGetValue(activity, out var label) ? label : activity;

        private string GetEvidencePhrase(string evidenceKey) =>
            _evidencePhrases.TryGetValue(evidenceKey, out var phrase) ? phrase : evidenceKey;

        // ---------- Shared internals ----------

        private Dictionary<string, bool> BuildSensorEvidence(Observation observation)
        {
            var sensorEvidence = new Dictionary<string, bool>
            {
                ["tv_on"] = observation.TvOn,
                ["laptop_on"] = observation.LaptopOn,
                ["phone_active"] = observation.PhoneActive,
                ["high_voice"] = observation.VoiceIntensity > 0.7,
                ["kitchen"] = observation.CurrentRoom == "kitchen",
                ["living_room"] = observation.CurrentRoom == "living_room",
                ["dining_room"] = observation.CurrentRoom == "dining_room",
                ["bedroom_1"] = observation.CurrentRoom == "bedroom_1",
                ["bedroom_2"] = observation.CurrentRoom == "bedroom_2",
                ["sitting"] = observation.Posture == "sitting",
                ["standing"] = observation.Posture == "standing",
                ["lying"] = observation.Posture == "lying",
                ["pacing"] = observation.Posture == "pacing",
                ["fast_walk"] = observation.WalkingSpeed > 0.7,
                ["not_alone"] = !observation.IsAlone,
                ["morning"] = observation.TimeOfDay == "morning",
                ["afternoon"] = observation.TimeOfDay == "afternoon",
                ["evening"] = observation.TimeOfDay == "evening",
                ["night"] = observation.TimeOfDay == "night",
                ["late_night"] = observation.TimeOfDay == "late_night",
                ["anytime"] = true
            };

            // Add walking pattern based on walking speed
            if (observation.WalkingSpeed > 0.6 && observation.Posture != "pacing")
            {
                sensorEvidence["fast_walk"] = true;
            }

            return sensorEvidence;
        }

        private Dictionary<string, double> ComputeScores(Observation observation)
        {
            var sensorEvidence = BuildSensorEvidence(observation);
            var scores = new Dictionary<string, double>();

            foreach (var activity in _priors.Keys)
            {
                double score = _priors[activity];

                foreach (var evidence in sensorEvidence)
                {
                    if (_likelihoods[activity].ContainsKey(evidence.Key))
                    {
                        double likelihood = _likelihoods[activity][evidence.Key];
                        score *= evidence.Value ? likelihood : (1 - likelihood);
                    }
                }

                scores[activity] = score;
            }

            return scores;
        }
    }
}