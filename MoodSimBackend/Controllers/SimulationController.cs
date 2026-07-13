using Microsoft.AspNetCore.Mvc;
using MoodSimBackend.Models;
using MoodSimBackend.Services;
using System;
using System.Collections.Generic;

namespace MoodSimBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SimulationController : ControllerBase
    {
        [HttpPost("start")]
        public IActionResult StartSimulation([FromBody] SimulationRequest request)
        {
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
                return StatusCode(500, new { success = false, error = ex.Message });
            }
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