// Place this file at: Controllers/EmotionController.cs
using Microsoft.AspNetCore.Mvc;
using MoodSimBackend.Services;

namespace MoodSimBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmotionController : ControllerBase
    {
        private readonly DemoClipAnalyzer _analyzer;

        public EmotionController(DemoClipAnalyzer analyzer)
        {
            _analyzer = analyzer;
        }

        // Lets the frontend know which clips exist and how many 5-second
        // windows each has, without hardcoding durations on the client.
        [HttpGet("clips")]
        public IActionResult GetClips()
        {
            var clips = _analyzer.GetAvailableClips();
            return Ok(new { success = true, clips });
        }

        public class WindowRequest
        {
            public string ClipKey { get; set; } = "";
            public int WindowIndex { get; set; }
        }

        [HttpPost("window")]
        public IActionResult AnalyzeWindow([FromBody] WindowRequest request)
        {
            if (string.IsNullOrEmpty(request.ClipKey))
                return BadRequest(new { success = false, error = "clipKey is required" });

            var result = _analyzer.AnalyzeWindow(request.ClipKey, request.WindowIndex);
            if (result == null)
                return NotFound(new { success = false, error = "Clip not found, or analysis failed — check backend logs" });

            return Ok(new
            {
                success = true,
                emotion = result.Emotion,
                confidence = result.Confidence,
                audioEmotion = result.AudioEmotion,
                faceEmotion = result.FaceEmotion,
                distribution = result.Distribution
            });
        }
    }
}
