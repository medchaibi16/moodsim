// Place this file at: Services/HouseCommandDecider.cs
using System;
using System.Collections.Generic;
using MoodSimBackend.Models;

namespace MoodSimBackend.Services
{
    /// <summary>
    /// Layer 5: decides what the house should actually DO, given:
    ///  - the resolved current emotion (layer 4),
    ///  - who this person is (character traits — what's available today; more "preference"
    ///    data can be folded in once the character model grows),
    ///  - and the present moment's context — mainly time of day, which is a HARD OVERRIDE,
    ///    not just a factor: quiet hours cap intensity regardless of how good the mood is.
    ///
    /// A low-confidence (torn) emotion read is deliberately treated as "neutral" rather than
    /// committing hard to whichever side barely won — acting confidently on an uncertain
    /// signal is worse than a gentle default.
    /// </summary>
    public class HouseCommandDecider
    {
        private const float UncertaintyMarginThreshold = 0.15f;
        private const int QuietHoursStart = 22; // 10 PM
        private const int QuietHoursEnd = 7;    // 7 AM

        public List<IotCommand> DecideCommands(CurrentEmotionResult emotion, CharacterProfile character, DateTime currentTime)
        {
            bool isQuietHours = currentTime.Hour >= QuietHoursStart || currentTime.Hour < QuietHoursEnd;
            bool isUncertain = emotion.Margin < UncertaintyMarginThreshold;
            string mood = isUncertain ? "neutral" : emotion.Emotion;

            var commands = new List<IotCommand> { DecideLighting(mood, isQuietHours, character) };

            var audio = DecideAudio(mood, isQuietHours);
            if (audio != null) commands.Add(audio);

            var notification = DecideNotification(mood, isQuietHours, isUncertain);
            if (notification != null) commands.Add(notification);

            return commands;
        }

        private IotCommand DecideLighting(string mood, bool isQuietHours, CharacterProfile character)
        {
            int brightness;
            string colorTemp;
            string reason;

            if (isQuietHours)
            {
                // Hard override — quiet hours mean low and warm no matter what the mood is.
                brightness = 25;
                colorTemp = "warm";
                reason = "Quiet hours — keeping the lighting low and warm regardless of mood.";
            }
            else
            {
                switch (mood)
                {
                    case "anger":
                    case "frustration":
                    case "stress":
                        // High neuroticism -> lean a bit dimmer/warmer, a stronger calming push
                        brightness = character.Neuroticism > 0.6f ? 30 : 40;
                        colorTemp = "warm";
                        reason = $"Dimming and warming the light to help take the edge off ({mood}).";
                        break;
                    case "sadness":
                        brightness = 45;
                        colorTemp = "warm";
                        reason = "Soft, warm light — comforting without being harsh.";
                        break;
                    case "happiness":
                    case "excited":
                        brightness = 75;
                        colorTemp = "neutral";
                        reason = "Bright, neutral light to match a good mood.";
                        break;
                    default:
                        brightness = 60;
                        colorTemp = "neutral";
                        reason = "Comfortable default — no strong mood signal either way.";
                        break;
                }
            }

            return new IotCommand
            {
                Device = "lighting",
                Action = "set_lighting",
                Parameters = new Dictionary<string, object>
                {
                    ["brightness"] = brightness,
                    ["colorTemp"] = colorTemp
                },
                Reason = reason
            };
        }

        private IotCommand? DecideAudio(string mood, bool isQuietHours)
        {
            bool isNegative = mood is "anger" or "frustration" or "stress" or "sadness";

            if (isQuietHours)
            {
                // Even at night, gentle calming audio can still help with real distress —
                // but energetic/upbeat audio is off the table entirely, no matter the mood.
                if (isNegative)
                {
                    return new IotCommand
                    {
                        Device = "audio",
                        Action = "play_audio",
                        Parameters = new Dictionary<string, object>
                        {
                            ["mood"] = mood == "sadness" ? "comforting" : "calming",
                            ["volume"] = 15,
                            ["durationMinutes"] = 20
                        },
                        Reason = "Quiet hours, but low-volume calming audio is gentle enough to still help."
                    };
                }
                // Happy/neutral at night -> no audio command at all. This is the literal
                // "don't blast music at 11 PM" case, even when the mood itself is good.
                return null;
            }

            return mood switch
            {
                "anger" or "frustration" or "stress" => new IotCommand
                {
                    Device = "audio",
                    Action = "play_audio",
                    Parameters = new Dictionary<string, object>
                    {
                        ["mood"] = "calming",
                        ["volume"] = 35,
                        ["durationMinutes"] = 20
                    },
                    Reason = $"Calming audio to help settle {mood}."
                },
                "sadness" => new IotCommand
                {
                    Device = "audio",
                    Action = "play_audio",
                    Parameters = new Dictionary<string, object>
                    {
                        ["mood"] = "comforting",
                        ["volume"] = 30,
                        ["durationMinutes"] = 15
                    },
                    Reason = "Soft, comforting audio."
                },
                "happiness" or "excited" => new IotCommand
                {
                    Device = "audio",
                    Action = "play_audio",
                    Parameters = new Dictionary<string, object>
                    {
                        ["mood"] = "upbeat",
                        ["volume"] = 55,
                        ["durationMinutes"] = 30
                    },
                    Reason = "Upbeat audio to match a good mood."
                },
                _ => null // neutral / uncertain — no audio intervention needed
            };
        }

        private IotCommand? DecideNotification(string mood, bool isQuietHours, bool isUncertain)
        {
            // No pings at night, and no pings when the system itself isn't confident.
            if (isQuietHours || isUncertain) return null;

            bool isNegative = mood is "anger" or "frustration" or "stress" or "sadness";
            if (!isNegative) return null;

            string message = mood switch
            {
                "anger" => "Things seem tense right now — maybe a short break would help.",
                "frustration" => "You've been pushing hard — a few minutes away might help.",
                "stress" => "Feeling a bit wound up? A short pause could help you reset.",
                "sadness" => "Just checking in — take it easy on yourself right now.",
                _ => "Just checking in."
            };

            return new IotCommand
            {
                Device = "notification",
                Action = "send_notification",
                Parameters = new Dictionary<string, object> { ["message"] = message },
                Reason = $"Gentle check-in prompted by sustained {mood}."
            };
        }
    }
}
