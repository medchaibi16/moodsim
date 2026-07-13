using Microsoft.AspNetCore.Mvc;
using MoodSimBackend.Models;
using MoodSimBackend.Services;
using System.Collections.Generic;

namespace MoodSimBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CharacterController : ControllerBase
    {
    [HttpGet("default")]
    public IActionResult GetDefaultCharacter()
    {
        Console.WriteLine("GetDefaultCharacter called!");
        try
        {
            var character = CharacterFactory.CreateDefaultCharacter();
            Console.WriteLine($"Character created: {character.Name}");
            return Ok(character);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            return StatusCode(500, ex.Message);
        }
    }
        [HttpGet("ping")]
        public IActionResult Ping()
        {
            return Ok(new { message = "Server is alive!", time = DateTime.Now });
        }

        [HttpPost("update")]
        public IActionResult UpdateCharacter([FromBody] CharacterProfile updatedCharacter)
        {
            // Validate and return updated character
            return Ok(updatedCharacter);
        }

        [HttpPost("reset")]
        public IActionResult ResetCharacter()
        {
            var character = CharacterFactory.CreateDefaultCharacter();
            return Ok(character);
        }

        [HttpPost("emotion")]
        public IActionResult ProcessEvent([FromBody] EventRequest request)
        {
            var engine = new EmotionalEngine(request.Character);
            engine.ProcessEvent(request.EventType, request.Activity, request.Intensity);
            
            return Ok(new
            {
                Emotion = engine.GetDominantEmotion(),
                Confidence = engine.GetConfidence(),
                Interpretation = engine.GetEmotionalInterpretation(),
                RecommendedAction = engine.GetRecommendedAction()
            });
        }
    }

    public class EventRequest
    {
        public CharacterProfile Character { get; set; }
        public string EventType { get; set; }
        public string Activity { get; set; }
        public float Intensity { get; set; } = 0.5f;
    }
}