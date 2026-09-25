using MoodSimBackend.Models;
using System;

namespace MoodSimBackend.Services
{
    public class LocationObserver
    {
        private readonly RoomMap _roomMap;
        private int _currentX;
        private int _currentY;
        private string _currentPosture;

        public LocationObserver()
        {
            _roomMap = new RoomMap();
            _currentX = 0;
            _currentY = 0;
            _currentPosture = "standing";
        }

        public void UpdatePosition(int x, int y)
        {
            _currentX = x;
            _currentY = y;
        }

        public void UpdatePosture(string posture)
        {
            _currentPosture = posture; // "standing", "sitting", "lying", "pacing"
        }

        public Observation CollectObservation()
        {
            var room = _roomMap.GetRoomFromPosition(_currentX, _currentY);

            return new Observation
            {
                PositionX = _currentX,
                PositionY = _currentY,
                CurrentRoom = room,
                Posture = _currentPosture,
                Timestamp = DateTime.Now
            };
        }
    }
}