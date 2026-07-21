using Microsoft.AspNetCore.Mvc;
using MoodSimBackend.Models;
using MoodSimBackend.Services;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

namespace MoodSimBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SimulationController : ControllerBase
    {
        [HttpPost("start")]
        public async Task<IActionResult> StartSimulation([FromBody] SimulationRequest request)
        {
            // Log the raw request body for debugging
            try
            {
                // Read the raw body
                using var reader = new StreamReader(Request.Body);
                var rawBody = await reader.ReadToEndAsync();
                Console.WriteLine("🔴 RAW REQUEST BODY:");
                Console.WriteLine(rawBody);
                Console.WriteLine("🔴🔴🔴 SIMULATION START CALLED! Events: " + (request?.Events?.Count ?? 0));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"⚠️ Error reading request body: {ex.Message}");
            }


            if (request == null || request.Events == null)
            {
                return BadRequest(new { success = false, error = "Invalid request body" });
            }

            try
            {
                // 1. Create character
                var character = CharacterFactory.CreateDefaultCharacter();

                // 2. Create simulation engine
                var engine = new SimulationEngine(
                    request.Events,
                    request.StartHour,
                    request.EndHour,
                    character
                );

                // 3. Run simulation
                var result = engine.Run();
                Console.WriteLine("   Simulation complete! Total events: " + result.TotalEvents);

                // 4. Return results
                return Ok(new
                {
                    success = true,
                    totalEvents = result.TotalEvents,
                    startTime = result.StartTime,
                    endTime = result.EndTime,
                    character = result.Character,
                    log = result.Log
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"❌ ERROR: {ex.Message}");
                Console.WriteLine($"❌ STACK: {ex.StackTrace}");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        [HttpPost("diagnostic")]
        public IActionResult Diagnostic([FromBody] object body)
        {
            Console.WriteLine("🔴 DIAGNOSTIC ENDPOINT CALLED");
            Console.WriteLine($"   Body type: {body?.GetType()?.Name ?? "null"}");
            Console.WriteLine($"   Body: {JsonSerializer.Serialize(body)}");
            return Ok(new { received = body });
        }

        [HttpGet("progress")]
        public async Task Progress()
        {
            Response.Headers.Add("Content-Type", "text/event-stream");
            Response.Headers.Add("Cache-Control", "no-cache");
            Response.Headers.Add("Connection", "keep-alive");

            // Simulate progress updates every 2 seconds
            for (int i = 0; i <= 100; i += 10)
            {
                await Response.WriteAsync($"data: {i}\n\n");
                await Response.Body.FlushAsync();
                await Task.Delay(2000);
            }
        }

        [HttpGet("log")]
        public IActionResult GetLog()
        {
            var logPath = Path.Combine(Directory.GetCurrentDirectory(), "simulation_logs");

            // Create folder if it doesn't exist
            if (!Directory.Exists(logPath))
            {
                Directory.CreateDirectory(logPath);
                return Ok(new { success = false, message = "No simulation logs found yet" });
            }

            var files = Directory.GetFiles(logPath, "simulation_*.json");

            if (files.Length == 0)
            {
                return Ok(new { success = false, message = "No simulation logs found yet" });
            }

            var latestFile = files.OrderByDescending(f => f).First();
            var json = System.IO.File.ReadAllText(latestFile);

            return Ok(new { success = true, log = json });
        }
    }
}