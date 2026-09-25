// Place this file at: Services/DemoClipAnalyzer.cs
using System;
using System.Collections.Generic;
using System.IO;
using MoodStabilizer;
using OpenCvSharp;

namespace MoodSimBackend.Services
{
    public class DemoClipInfo
    {
        public string Key { get; set; } = "";
        public string Filename { get; set; } = "";
        public double DurationSeconds { get; set; }
        public int WindowCount { get; set; }
    }

    public class WindowAnalysisResult
    {
        public string Emotion { get; set; } = "";
        public float Confidence { get; set; }
        public string AudioEmotion { get; set; } = "";
        public string FaceEmotion { get; set; } = "";
        public Dictionary<string, float> Distribution { get; set; } = new();
    }

    /// <summary>
    /// Wraps EmotionRecognizer for the Live Demo page. Opening a video and loading
    /// audio takes real time — this keeps one EmotionRecognizer + one VideoCapture
    /// alive per clip across requests, so "analyze the next 5-second window" is fast
    /// after the first call, instead of re-opening everything every time.
    /// Registered as a singleton (see Program.cs) so this state survives requests.
    /// </summary>
    public class DemoClipAnalyzer : IDisposable
    {
        private readonly string _assetsFolder;

        // clipKey -> actual filename in Assets/. Matches the 4 clips currently placed there.
        private readonly Dictionary<string, string> _clipFiles = new()
        {
            ["Ses01F_impro07"] = "Ses01F_impro07.avi",
            ["Ses02F_impro08"] = "Ses02F_impro08.avi",
            ["Ses01F_impro01"] = "Ses01F_impro01.avi",
            ["Ses01F_impro02"] = "Ses01F_impro02.avi",
        };

        private readonly Dictionary<string, EmotionRecognizer> _recognizers = new();
        private readonly Dictionary<string, VideoCapture> _captures = new();
        private readonly object _lock = new();

        public DemoClipAnalyzer()
        {
            string assemblyPath = System.Reflection.Assembly.GetExecutingAssembly().Location;
            string assemblyDir = Path.GetDirectoryName(assemblyPath) ?? AppDomain.CurrentDomain.BaseDirectory;
            string projectRoot = Path.GetFullPath(Path.Combine(assemblyDir, "..", "..", ".."));
            _assetsFolder = Path.Combine(projectRoot, "Assets");
        }

        public List<DemoClipInfo> GetAvailableClips()
        {
            var list = new List<DemoClipInfo>();
            foreach (var (key, filename) in _clipFiles)
            {
                var path = Path.Combine(_assetsFolder, filename);
                if (!File.Exists(path)) continue;

                using var cap = new VideoCapture(path);
                double fps = cap.Get(VideoCaptureProperties.Fps);
                int frameCount = (int)cap.Get(VideoCaptureProperties.FrameCount);
                double duration = fps > 0 ? frameCount / fps : 0;

                list.Add(new DemoClipInfo
                {
                    Key = key,
                    Filename = filename,
                    DurationSeconds = duration,
                    WindowCount = (int)Math.Floor(duration / 5.0)
                });
            }
            return list;
        }

        public WindowAnalysisResult? AnalyzeWindow(string clipKey, int windowIndex)
        {
            if (!_clipFiles.TryGetValue(clipKey, out var filename)) return null;
            var path = Path.Combine(_assetsFolder, filename);
            if (!File.Exists(path)) return null;

            EmotionRecognizer recognizer;
            VideoCapture cap;

            lock (_lock)
            {
                if (!_recognizers.TryGetValue(clipKey, out recognizer!))
                {
                    recognizer = new EmotionRecognizer(path);
                    recognizer.LoadModels();
                    _recognizers[clipKey] = recognizer;
                }
                if (!_captures.TryGetValue(clipKey, out cap!))
                {
                    cap = new VideoCapture(path);
                    _captures[clipKey] = cap;
                }
            }

            double fps = cap.Get(VideoCaptureProperties.Fps);
            int startFrameIndex = (int)(windowIndex * 5 * fps);

            var faceLogits = recognizer.ProcessVideoWindow(cap, startFrameIndex);
            var audioSamples = recognizer.ProcessAudioWindow(path, windowIndex);
            var audioLogits = audioSamples != null ? recognizer.InferenceAudio(audioSamples) : null;

            var emotion = recognizer.FusePredictions(audioLogits, faceLogits);
            if (emotion == "ERROR") return null;

            return new WindowAnalysisResult
            {
                Emotion = emotion,
                Confidence = recognizer.GetLastConfidence(),
                AudioEmotion = recognizer.GetLastAudioEmotion(),
                FaceEmotion = recognizer.GetLastFaceEmotion(),
                Distribution = recognizer.GetLastDistribution()
            };
        }

        public void Dispose()
        {
            foreach (var r in _recognizers.Values) r.Dispose();
            foreach (var c in _captures.Values) c.Dispose();
        }
    }
}
