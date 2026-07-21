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

        public string GuessActivity(Observation observation)
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

            var scores = new Dictionary<string, double>();

            foreach (var activity in _priors.Keys)
            {
                double score = _priors[activity];

                foreach (var evidence in sensorEvidence)
                {
                    if (_likelihoods[activity].ContainsKey(evidence.Key))
                    {
                        double likelihood = _likelihoods[activity][evidence.Key];
                        // If evidence is true, multiply by likelihood; if false, multiply by (1 - likelihood)
                        score *= evidence.Value ? likelihood : (1 - likelihood);
                    }
                }

                scores[activity] = score;
            }

            // Normalize and find best
            double total = scores.Values.Sum();
            if (total == 0) return "neutral";

            var bestActivity = scores.OrderByDescending(x => x.Value).First();
            return bestActivity.Key;
        }

        public double GetConfidence(string activity, Observation observation)
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

            return totalSensors == 0 ? 0.3 : Math.Min(0.95, (double)supportingSensors / totalSensors);
        }
    }
}