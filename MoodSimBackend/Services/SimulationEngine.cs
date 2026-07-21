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

        // Simulation log
        private List<SimulationLogEntry> _log;

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

                // 1. Get location for this event
                var location = GetLocationForEvent(evt);
                _observationService.UpdateLocation(location.X, location.Y, location.Posture);

                // 1.5 Update sensors from the event
                if (evt.Sensors != null)
                {
                    _observationService.UpdateSensors(
                        tvOn: evt.Sensors.TvOn,
                        laptopOn: evt.Sensors.LaptopOn,
                        phoneActive: evt.Sensors.PhoneActive,
                        voiceIntensity: evt.Sensors.VoiceIntensity,
                        walkingSpeed: evt.Sensors.WalkingSpeed,
                        doorSlamDetected: evt.Sensors.DoorSlamDetected,
                        doorSlamIntensity: evt.Sensors.DoorSlamIntensity,
                        isAlone: true
                    );
                }

                // ✅ Initialize observation to null
                Observation observation = null;

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
                }
                else
                {
                    // Get current observation for sensor data (before emotion assignment)
                    var sensorObservation = _observationService.CollectObservation();

                    // Guess activity from sensors
                    var guesser = new ActivityGuesser();
                    var guessedActivity = guesser.GuessActivity(sensorObservation);
                    var confidence = guesser.GetConfidence(guessedActivity, sensorObservation);

                    Console.WriteLine($"   🧠 Guessed Activity: {guessedActivity} ({confidence:P0})");

                    // Use the guessed activity to look up emotion
                    var baseEmotion = GetEmotionForActivity(guessedActivity);
                    var baseConfidence = 0.6f;

                    // Apply personality modifier (Big Five)
                    var modifier = _character.GetPersonalityModifier(baseEmotion);
                    var finalConfidence = Math.Min(0.95f, baseConfidence * (1 + modifier));

                    observation = _observationService.CollectObservation(
                        detectedEmotion: baseEmotion,
                        emotionConfidence: finalConfidence
                    );

                    Console.WriteLine($"   😊 Emotion: {baseEmotion} ({finalConfidence:P0})");
                }

                // 3. Log the observation
                var logEntry = new SimulationLogEntry
                {
                    Time = currentTime,
                    EventName = evt.Name,
                    Duration = evt.Duration,
                    Room = observation.CurrentRoom,
                    Posture = observation.Posture,
                    Emotion = observation.DetectedEmotion,
                    Confidence = observation.EmotionConfidence,
                    IsClip = evt.IsClip,
                    ClipFilename = evt.IsClip ? evt.ClipData?.Filename : null,
                    Distribution = observation.Distribution
                };
                _log.Add(logEntry);

                Console.WriteLine($"   📍 Location: {observation.CurrentRoom} ({observation.Posture})");

                // 4. Advance time
                currentTime = eventEndTime;
                eventIndex++;

                Console.WriteLine($"   ⏱️  Done at {currentTime:HH:mm}");
            }

            Console.WriteLine("\n═══════════════════════════════════════════════");
            Console.WriteLine($"✅ Simulation complete!");
            Console.WriteLine($"   Total events processed: {_log.Count}");
            Console.WriteLine($"   End time: {currentTime:HH:mm}");

            // Save simulation log to file
            SaveSimulationLogToFile();

            return new SimulationResult
            {
                Log = _log,
                Character = _character,
                TotalEvents = _log.Count,
                StartTime = new DateTime(2026, 1, 1, _startHour, 0, 0),
                EndTime = currentTime
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

        private string GetEmotionForActivity(string activityId)
        {
            var emotionMap = new Dictionary<string, string>
            {
                ["work"] = "frustration",
                ["break"] = "happiness",
                ["cook"] = "neutral",
                ["eat"] = "happiness",
                ["watch_tv"] = "happiness",
                ["exercise"] = "excited",
                ["read"] = "happiness",
                ["nap"] = "neutral",
                ["clean"] = "neutral",
                ["gaming"] = "excited",
                ["phone_scroll"] = "stress",
                ["talk_phone"] = "happiness",
                ["walk"] = "neutral",
                ["get_ready"] = "neutral",
                ["relax"] = "happiness",
                ["socialize"] = "happiness",
                ["argue"] = "anger",
                ["late_work"] = "frustration",
                ["feel_sick"] = "sadness",
                ["celebrate"] = "happiness"
            };

            return emotionMap.ContainsKey(activityId) ? emotionMap[activityId] : "neutral";
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

                var logData = new
                {
                    character = _character,
                    log = _log.Select(e => new
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
                        distribution = e.Distribution
                    }),
                    startTime = new DateTime(2026, 1, 1, _startHour, 0, 0).ToString("HH:mm"),
                    endTime = new DateTime(2026, 1, 1, _endHour, 0, 0).ToString("HH:mm"),
                    totalEvents = _log.Count
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
    }

    public class SimulationLogEntry
    {
        public DateTime Time { get; set; }
        public string EventName { get; set; }
        public int Duration { get; set; }
        public string Room { get; set; }
        public string Posture { get; set; }
        public string Emotion { get; set; }
        public float Confidence { get; set; }
        public bool IsClip { get; set; }
        public string ClipFilename { get; set; }
        public Dictionary<string, int> Distribution { get; set; }
    }

    public class SimulationResult
    {
        public List<SimulationLogEntry> Log { get; set; }
        public CharacterProfile Character { get; set; }
        public int TotalEvents { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
    }
}