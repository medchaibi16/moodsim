// MoodSimBackend/Models/RoomMap.cs
using System.Collections.Generic;

namespace MoodSimBackend.Models
{
    public class RoomMap
    {
        public Dictionary<string, Room> Rooms { get; set; }

        public RoomMap()
        {
            Rooms = new Dictionary<string, Room>
            {
                ["bedroom_1"] = new Room { 
                    Name = "Bedroom 1", 
                    X1 = 0, Y1 = 1, X2 = 4, Y2 = 4,
                    Elements = new List<string> { "bed", "door_1", "window_1" }
                },
                ["bathroom"] = new Room { 
                    Name = "Bathroom", 
                    X1 = 0, Y1 = 4, X2 = 4, Y2 = 6,
                    Elements = new List<string> { "shower", "toilet", "door_3" }
                },
                ["bedroom_2"] = new Room { 
                    Name = "Bedroom 2", 
                    X1 = 5, Y1 = 1, X2 = 9, Y2 = 4,
                    Elements = new List<string> { "bed", "table", "chair", "door_2", "window_2" }
                },
                ["hallway"] = new Room { 
                    Name = "Hallway", 
                    X1 = 4, Y1 = 4, X2 = 5, Y2 = 6,
                    Elements = new List<string> { "door_1", "door_2", "door_3" }
                },
                ["kitchen"] = new Room { 
                    Name = "Kitchen", 
                    X1 = 0, Y1 = 7, X2 = 4, Y2 = 9,
                    Elements = new List<string> { "stove", "fridge", "door_4", "window_3" }
                },
                ["dining_room"] = new Room { 
                    Name = "Dining Room", 
                    X1 = 0, Y1 = 6, X2 = 4, Y2 = 7,
                    Elements = new List<string> { "table", "door_5" }
                },
                ["living_room"] = new Room { 
                    Name = "Living Room", 
                    X1 = 5, Y1 = 7, X2 = 9, Y2 = 9,
                    Elements = new List<string> { "couch", "tv", "door_6", "window_4" }
                },
                ["entry"] = new Room { 
                    Name = "Entry", 
                    X1 = 0, Y1 = 6, X2 = 1, Y2 = 7,
                    Elements = new List<string> { "main_door" }
                }
            };
        }

        public string GetRoomFromPosition(int x, int y)
        {
            foreach (var room in Rooms)
            {
                if (x >= room.Value.X1 && x <= room.Value.X2 &&
                    y >= room.Value.Y1 && y <= room.Value.Y2)
                {
                    return room.Key;
                }
            }
            return "unknown";
        }

        public Room GetRoomByName(string name)
        {
            return Rooms.ContainsKey(name) ? Rooms[name] : null;
        }

        public List<string> GetAllRoomNames()
        {
            return new List<string>(Rooms.Keys);
        }
    }
}