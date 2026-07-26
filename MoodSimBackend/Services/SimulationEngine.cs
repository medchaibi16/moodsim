// Place this file at: Services/SimulationEngine.cs
using System;
using System.Collections.Generic;
using System.Linq;
using MoodSimBackend.Models;

namespace MoodSimBackend.Services
{
    public class SimulationEngine
    {
        private readonly ObservationService _observationService;
        private readonly List<SimulationEvent> _events;
        private readonly int _startHour;
        private readonly int _endHour;
        private readonly CharacterProfile _character;
        private readonly DayContextTracker _dayContext;
        private string _daySummary = "";
        private CurrentEmotionResult _currentEmotion = new();

        // Simulation log (debug/frontend file)
        private List<SimulationLogEntry> _log;

        // Ground truth for the IoT handoff file — real positions and real scheduled actions,
        // NOT the guessed activity. Populated in lockstep with _log.
        private readonly List<MovementRecord> _movements = new();
        private readonly List<ActionRecord> _actions = new();

        public SimulationEngine(
            List<SimulationEvent> events,
            int startHour,
            int endHour,
            CharacterProfile character)
        {
            _events = events;
            _startHour = startHour;
            _endHour = endHour;
            _character = character;
            _log = new List<SimulationLogEntry>();
            _dayContext = new DayContextTracker();

            // Initialize observation service (NO heavy AI models)
            _observationService = new ObservationService(new RoomMap());
        }

        public SimulationResult Run()
        {
            var currentTime = new DateTime(2026, 1, 1, _startHour, 0, 0);
            var endTime = new DateTime(2026, 1, 1, _endHour, 0, 0);
            var eventIndex = 0;

            Console.WriteLine($"\n🚀 Starting simulation at {currentTime:HH:mm}");
            Console.WriteLine($"   Total events: {_events.Count}");
            Console.WriteLine($"   Character: {_character.Name}");
            Console.WriteLine($"   End time: {endTime:HH:mm}");
            Console.WriteLine("═══════════════════════════════════════════════\n");

            // Loop through each event
            while (eventIndex < _events.Count && currentTime < endTime)
            {
                var evt = _events[eventIndex];
                var eventEndTime = currentTime.AddMinutes(evt.Duration);

                Console.WriteLine($"\n[{currentTime:HH:mm}] Event: {evt.Name}");
                Console.WriteLine($"   Duration: {evt.Duration} min");
                string? guessedActivity = null;
                float confidence = 0f;
                Observation? observation = null;
                ReasoningTrace? reasoningTrace = null;

                // 1. Get location for this event
                var location = GetLocationForEvent(evt);
                _observationService.UpdateLocation(location.X, location.Y, location.Posture);

                // 1.5 Update sensors from the event.
                // Always reset sensors, even when evt.Sensors is null — otherwise this event
                // silently inherits whatever sensor state the previous event left behind.
                _observationService.UpdateSensors(
                    tvOn: evt.Sensors?.TvOn ?? false,
                    laptopOn: evt.Sensors?.LaptopOn ?? false,
                    phoneActive: evt.Sensors?.PhoneActive ?? false,
                    voiceIntensity: evt.Sensors?.VoiceIntensity ?? 0f,
                    walkingSpeed: evt.Sensors?.WalkingSpeed ?? 0f,
                    doorSlamDetected: evt.Sensors?.DoorSlamDetected ?? false,
                    doorSlamIntensity: evt.Sensors?.DoorSlamIntensity ?? 0f,
                    isAlone: true
                );

                // 2. If it's a clip event, use precomputed emotion data
                if (evt.IsClip && evt.ClipData != null)
                {
                    observation = _observationService.CollectObservation(
                        dominantEmotion: evt.ClipData.DominantEmotion,
                        avgConfidence: evt.ClipData.AvgConfidence,
                        distribution: evt.ClipData.Distribution,
                        isClip: true,
                        clipFilename: evt.ClipData.Filename
                    );

                    Console.WriteLine($"   🎬 Clip: {evt.ClipData.Filename}");
                    Console.WriteLine($"   📊 Dominant: {evt.ClipData.DominantEmotion} ({evt.ClipData.AvgConfidence:P0})");
                    Console.WriteLine($"   📈 Distribution:");
                    foreach (var kvp in evt.ClipData.Distribution.OrderByDescending(x => x.Value))
                    {
                        Console.WriteLine($"      {kvp.Key}: {kvp.Value} clips");
                    }

                    // Feed the day-narrative layer — clips are taken at face value, no reinterpretation
                    _dayContext.RecordClipStep(evt.ClipData.DominantEmotion, evt.Duration, evt.Name ?? "Clip");
                }
                else
                {
                    // Get current observation for sensor data (before emotion assignment)
                    var sensorObservation = _observationService.CollectObservation();

                    // Guess activity from sensors
                    var guesser = new ActivityGuesser();
                    guessedActivity = guesser.GuessActivity(sensorObservation);

                    // Build the reasoning trace once, and use ITS confidence margin everywhere —
                    // this replaces the old sensor-counting GetConfidence(), which could disagree
                    // with the hedge word ("Possibly X" next to a 95% confidence number, etc).
                    reasoningTrace = guesser.GenerateReasoningTrace(sensorObservation, guessedActivity);
                    confidence = reasoningTrace.ConfidenceMargin;

                    Console.WriteLine($"   🧠 Guessed Activity: {guessedActivity} ({confidence:P0})");
                    Console.WriteLine($"   💭 Thinking:");
                    foreach (var beat in reasoningTrace.Beats)
                    {
                        string icon = beat.Type switch
                        {
                            "perception" => "👁️ ",
                            "hypothesis" => "🤔",
                            "conclusion" => "💡",
                            _ => "  "
                        };
                        Console.WriteLine($"      {icon} {beat.Text}");
                    }

                    // GetEmotionForActivity is keyed by the guesser's vocabulary ("working",
                    // "phone_scrolling"...), not evt.ActivityId's vocabulary — see method below.
                    var baseEmotion = GetEmotionForActivity(guessedActivity);
                    var baseConfidence = 0.6f;

                    // Apply personality modifier (Big Five)
                    var modifier = _character.GetPersonalityModifier(baseEmotion);
                    var finalConfidence = Math.Min(0.95f, (float)(baseConfidence * (1 + modifier)));

                    observation = _observationService.CollectObservation(
                        detectedEmotion: baseEmotion,
                        emotionConfidence: finalConfidence
                    );

                    Console.WriteLine($"   😊 Emotion: {baseEmotion} ({finalConfidence:P0})");

                    // Feed the day-narrative layer
                    _dayContext.RecordGuessedStep(guessedActivity, evt.Duration, evt.Name ?? guessedActivity);
                }

                // 3. Log the observation (debug/frontend file)
                var logEntry = new SimulationLogEntry
                {
                    Time = currentTime,
                    EventName = evt.Name ?? "Unknown",
                    Duration = evt.Duration,
                    Room = observation?.CurrentRoom ?? "Unknown",
                    Posture = observation?.Posture ?? "Unknown",
                    Emotion = observation?.DetectedEmotion ?? "neutral",
                    Confidence = observation?.EmotionConfidence ?? 0f,
                    IsClip = evt.IsClip,
                    ClipFilename = evt.IsClip ? evt.ClipData?.Filename : null,
                    Distribution = observation?.Distribution ?? new Dictionary<string, int>(),
                    GuessedActivity = guessedActivity ?? "Unknown",
                    GuessedActivityConfidence = confidence,
                    Sensors = evt.Sensors,
                    Reasoning = reasoningTrace?.Beats // null for clip events — nothing was guessed
                };
                _log.Add(logEntry);

                // 3.5 Ground truth for the IoT handoff — real position and the REAL scheduled
                // action (evt.ActivityId/evt.Name), never the guessed activity.
                _movements.Add(new MovementRecord
                {
                    Time = currentTime.ToString("HH:mm"),
                    DurationMinutes = evt.Duration,
                    X = location.X,
                    Y = location.Y,
                    Room = observation?.CurrentRoom ?? "unknown",
                    Posture = location.Posture
                });

                _actions.Add(new ActionRecord
                {
                    Time = currentTime.ToString("HH:mm"),
                    DurationMinutes = evt.Duration,
                    ActivityId = evt.IsClip ? "emotional_clip" : (evt.ActivityId ?? "unknown"),
                    Label = evt.Name ?? "Unknown",
                    IsClip = evt.IsClip,
                    Emotion = observation?.DetectedEmotion ?? "neutral",
                    EmotionConfidence = observation?.EmotionConfidence ?? 0f
                });

                Console.WriteLine($"   📍 Location: {observation?.CurrentRoom ?? "Unknown"} ({observation?.Posture ?? "Unknown"})");

                // 4. Advance time
                currentTime = eventEndTime;
                eventIndex++;

                Console.WriteLine($"   ⏱️  Done at {currentTime:HH:mm}");
            }

            Console.WriteLine("\n═══════════════════════════════════════════════");
            Console.WriteLine($"✅ Simulation complete!");
            Console.WriteLine($"   Total events processed: {_log.Count}");
            Console.WriteLine($"   End time: {currentTime:HH:mm}");

            // Compute once, reuse for both the console print and the saved JSON/API response
            _daySummary = _dayContext.GenerateDaySummary();
            Console.WriteLine("\n🧭 Day Summary:");
            Console.WriteLine($"   {_daySummary}");

            // Layer 4 — resolve the CURRENT emotion, as of right now (end of day)
            var flags = _dayContext.GetFlags();
            _currentEmotion = new CurrentEmotionResolver().Resolve(_log, flags, currentTime);

            Console.WriteLine("\n🎭 Current Emotion (Layer 4):");
            Console.WriteLine($"   {_currentEmotion.Emotion} — confidence {_currentEmotion.Confidence:P0}, margin {_currentEmotion.Margin:P0}");
            Console.WriteLine($"   Full breakdown:");
            foreach (var kvp in _currentEmotion.VoteBreakdown.OrderByDescending(v => v.Value))
            {
                Console.WriteLine($"      {kvp.Key}: {kvp.Value:P0}");
            }

            // Layer 5 — decide what the house should actually do
            var houseCommands = new HouseCommandDecider().DecideCommands(_currentEmotion, _character, currentTime);

            Console.WriteLine("\n🏠 House Commands (Layer 5):");
            foreach (var cmd in houseCommands)
            {
                Console.WriteLine($"   [{cmd.Device}] {cmd.Action} — {cmd.Reason}");
                foreach (var p in cmd.Parameters)
                {
                    Console.WriteLine($"      {p.Key}: {p.Value}");
                }
            }

            // Save simulation log to file (debug/frontend)
            SaveSimulationLogToFile();

            // Save the dedicated IoT handoff file (movements + real actions + commands)
            SaveIotOutputFile(houseCommands);

            return new SimulationResult
            {
                Log = _log ?? new List<SimulationLogEntry>(),
                Character = _character,
                TotalEvents = _log?.Count ?? 0,
                StartTime = new DateTime(2026, 1, 1, _startHour, 0, 0),
                EndTime = currentTime,
                DaySummary = _daySummary,
                CurrentEmotion = _currentEmotion
            };
        }

        private (int X, int Y, string Posture) GetLocationForEvent(SimulationEvent evt)
        {
            // Map each event to a room and posture
            var roomMap = new Dictionary<string, (int X, int Y, string Posture)>
            {
                ["work"] = (6, 2, "sitting"),
                ["break"] = (4, 8, "walking"),
                ["cook"] = (2, 8, "standing"),
                ["eat"] = (2, 6, "sitting"),
                ["watch_tv"] = (6, 8, "sitting"),
                ["exercise"] = (6, 7, "standing"),
                ["read"] = (6, 8, "sitting"),
                ["nap"] = (6, 2, "lying"),
                ["clean"] = (4, 7, "walking"),
                ["gaming"] = (6, 8, "sitting"),
                ["phone_scroll"] = (6, 8, "sitting"),
                ["talk_phone"] = (4, 7, "walking"),
                ["walk"] = (4, 5, "walking"),
                ["get_ready"] = (2, 5, "standing"),
                ["relax"] = (6, 8, "sitting"),
                ["socialize"] = (6, 8, "sitting"),
                ["argue"] = (6, 8, "pacing"),
                ["late_work"] = (6, 2, "sitting"),
                ["feel_sick"] = (6, 2, "lying"),
                ["celebrate"] = (6, 8, "standing"),
                ["emotional_clip"] = (6, 8, "sitting")
            };

            var key = evt.IsClip ? "emotional_clip" : evt.ActivityId;

            if (roomMap.ContainsKey(key))
            {
                return roomMap[key];
            }

            return (4, 5, "sitting");
        }

        // Keyed by the ActivityGuesser vocabulary (what this method is actually called with).
        private string GetEmotionForActivity(string? guessedActivity)
        {
            var emotionMap = new Dictionary<string, string>
            {
                ["working"] = "frustration",
                ["watching_tv"] = "happiness",
                ["sleeping"] = "neutral",
                ["arguing"] = "anger",
                ["cooking"] = "neutral",
                ["phone_scrolling"] = "stress",
                ["eating"] = "happiness",
                ["exercising"] = "excited",
                ["reading"] = "happiness",
                ["relaxing"] = "happiness",
            };

            return (guessedActivity != null && emotionMap.ContainsKey(guessedActivity))
                ? emotionMap[guessedActivity]
                : "neutral";
        }

        private void SaveSimulationLogToFile()
        {
            try
            {
                Console.WriteLine("📁 SAVING LOG TO FILE...");
                var logPath = Path.Combine(Directory.GetCurrentDirectory(), "simulation_logs");
                Console.WriteLine($"   Current Directory: {Directory.GetCurrentDirectory()}");
                Console.WriteLine($"   Full log path: {logPath}");

                // Create directory if it doesn't exist
                if (!Directory.Exists(logPath))
                {
                    Console.WriteLine("   Creating directory...");
                    Directory.CreateDirectory(logPath);
                }

                var fileName = $"simulation_{DateTime.Now:yyyyMMdd_HHmmss}.json";
                var filePath = Path.Combine(logPath, fileName);

                var logEntries = _log?.Select(e => new
                {
                    time = e.Time.ToString("HH:mm"),
                    eventName = e.EventName,
                    duration = e.Duration,
                    room = e.Room,
                    posture = e.Posture,
                    emotion = e.Emotion,
                    confidence = e.Confidence,
                    isClip = e.IsClip,
                    clipFilename = e.ClipFilename,
                    distribution = e.Distribution,
                    guessedActivity = e.GuessedActivity,
                    guessedActivityConfidence = e.GuessedActivityConfidence,
                    reasoning = e.Reasoning?.Select(b => new { type = b.Type, text = b.Text }).ToList()
                }) ?? Enumerable.Empty<object>();

                var logData = new
                {
                    character = _character,
                    log = logEntries,
                    startTime = new DateTime(2026, 1, 1, _startHour, 0, 0).ToString("HH:mm"),
                    endTime = new DateTime(2026, 1, 1, _endHour, 0, 0).ToString("HH:mm"),
                    totalEvents = _log?.Count ?? 0,
                    daySummary = _daySummary
                };

                var json = System.Text.Json.JsonSerializer.Serialize(logData, new System.Text.Json.JsonSerializerOptions { WriteIndented = true });
                File.WriteAllText(filePath, json);

                Console.WriteLine($"📁 Simulation log saved to: {filePath}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error saving log: {ex.Message}");
                Console.WriteLine($"❌ STACK: {ex.StackTrace}");
            }
        }

        /// <summary>
        /// Saves the dedicated handoff file for the IoT integration: real movements, real
        /// actions (not guessed), and the decided house commands — all in one clean,
        /// consistently camelCase JSON file. Also writes a stable "latest" copy so an
        /// external system can poll a fixed filename instead of parsing timestamps.
        /// </summary>
        private void SaveIotOutputFile(List<IotCommand> commands)
        {
            try
            {
                var iotPath = Path.Combine(Directory.GetCurrentDirectory(), "iot_output");
                if (!Directory.Exists(iotPath))
                {
                    Directory.CreateDirectory(iotPath);
                }

                var output = new IotOutput
                {
                    GeneratedAt = DateTime.Now.ToString("o"),
                    Character = _character.Name,
                    DaySummary = _daySummary,
                    CurrentEmotion = _currentEmotion.Emotion,
                    CurrentEmotionConfidence = _currentEmotion.Confidence,
                    Movements = _movements,
                    Actions = _actions,
                    Commands = commands
                };

                var options = new System.Text.Json.JsonSerializerOptions
                {
                    WriteIndented = true,
                    PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase
                };

                var json = System.Text.Json.JsonSerializer.Serialize(output, options);

                var fileName = $"iot_output_{DateTime.Now:yyyyMMdd_HHmmss}.json";
                File.WriteAllText(Path.Combine(iotPath, fileName), json);

                var latestPath = Path.Combine(iotPath, "iot_output_latest.json");
                File.WriteAllText(latestPath, json);

                Console.WriteLine($"🏠 IoT output saved to: {Path.Combine(iotPath, fileName)}");
                Console.WriteLine($"🏠 Latest copy at: {latestPath}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error saving IoT output: {ex.Message}");
            }
        }
    }

    public class SimulationLogEntry
    {
        public DateTime Time { get; set; }
        public string EventName { get; set; } = string.Empty;
        public int Duration { get; set; }
        public string Room { get; set; } = string.Empty;
        public string Posture { get; set; } = string.Empty;
        public string Emotion { get; set; } = string.Empty;
        public float Confidence { get; set; }
        public bool IsClip { get; set; }
        public string? ClipFilename { get; set; }
        public Dictionary<string, int> Distribution { get; set; } = new();
        public string GuessedActivity { get; set; } = string.Empty;
        public float GuessedActivityConfidence { get; set; }
        public SensorData? Sensors { get; set; }
        public List<ThoughtBeat>? Reasoning { get; set; } // null for clip events
    }

    public class SimulationResult
    {
        public List<SimulationLogEntry> Log { get; set; } = new();
        public CharacterProfile Character { get; set; } = new();
        public int TotalEvents { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string DaySummary { get; set; } = string.Empty;
        public CurrentEmotionResult CurrentEmotion { get; set; } = new();
    }
}