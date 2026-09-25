// Place this file at: Services/OnnxModelCache.cs
using System;
using System.IO;
using Microsoft.ML.OnnxRuntime;

namespace MoodStabilizer
{
    /// <summary>
    /// Loading an ONNX InferenceSession is expensive (real disk + init cost).
    /// The Live Demo page calls into EmotionRecognizer every 5 seconds of video
    /// playback — without this cache, every single window would reload both
    /// models from scratch, which is far too slow for a "live" UI.
    /// Loaded once, lazily, on first use; shared for the lifetime of the app.
    /// </summary>
    public static class OnnxModelCache
    {
        private static readonly object _lock = new();
        private static InferenceSession? _audioSession;
        private static InferenceSession? _faceSession;

        public static (InferenceSession audio, InferenceSession face) GetSessions(
            string modelsFolder, string audioModelName, string faceModelName)
        {
            lock (_lock)
            {
                _audioSession ??= new InferenceSession(Path.Combine(modelsFolder, audioModelName));
                _faceSession ??= new InferenceSession(Path.Combine(modelsFolder, faceModelName));
                return (_audioSession, _faceSession);
            }
        }
    }
}
