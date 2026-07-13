// MoodSimBackend/Models/Room.cs
using System.Collections.Generic;

namespace MoodSimBackend.Models
{
    public class Room
    {
        public string Name { get; set; }
        public int X1 { get; set; }
        public int Y1 { get; set; }
        public int X2 { get; set; }
        public int Y2 { get; set; }
        public List<string> Elements { get; set; } = new List<string>();
    }
}