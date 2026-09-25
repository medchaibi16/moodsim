import http.server
import json
import os
import socketserver
import threading
import time
import urllib.request

current_location = "bedroom_2"
current_emotion = "focused"
current_activity = "Work (Focus)"
current_icon = "💻"
spatial_history = ["🚪 انتقال أولي"]
all_events_history = [
    "Activity: work | Room: bedroom_2 | Emotion: focused",
    "⏱️ [بدء التشغيل] المحاكاة الزمنية نشطة."
]

SIMULATION_STEPS = [
    {"room": "bedroom_2", "activity": "Work (Focus)", "icon": "💻", "emotion": "focused", "duration_minutes": 30},
    {"room": "bedroom", "activity": "Phone scrolling", "icon": "📱", "emotion": "relaxed", "duration_minutes": 15},
    {"room": "bedroom_2", "activity": "Work (Focus)", "icon": "💻", "emotion": "stressed", "duration_minutes": 30},
    {"room": "bedroom", "activity": "Phone scrolling", "icon": "📱", "emotion": "neutral", "duration_minutes": 10},
    {"room": "kitchen", "activity": "Cook", "icon": "🍳", "emotion": "happy", "duration_minutes": 25},
    {"room": "kitchen", "activity": "Eat", "icon": "🍽️", "emotion": "satisfied", "duration_minutes": 20},
    {"room": "living_room", "activity": "Watch TV", "icon": "📺", "emotion": "relaxed", "duration_minutes": 40},
    {"room": "bedroom", "activity": "Nap", "icon": "💤", "emotion": "sleepy", "duration_minutes": 60}
]

current_step_index = 0

def simulation_ticker():
    global current_location, current_emotion, current_activity, current_icon, current_step_index, spatial_history, all_events_history
    while True:
        step = SIMULATION_STEPS[current_step_index]
        duration_mins = step.get("duration_minutes", 10)
        wait_seconds = duration_mins / 5.0

        current_location = step["room"]
        current_activity = step["activity"]
        current_icon = step["icon"]
        current_emotion = step["emotion"]

        trans = f"🚪 الانتقال إلى غرفة: {current_location}"
        if trans not in spatial_history:
            spatial_history.append(trans)

        event_str = f"Activity: {current_activity} | Room: {current_location} | Emotion: {current_emotion}"
        if event_str not in all_events_history:
            all_events_history.append(event_str)

        print(f"\n================ [⏱️ بدء نشاط جديد] ================")
        print(f" ⏳ مدة النشاط: {duration_mins} دقائق ➔ يعادل في المحاكاة: {wait_seconds} ثوانٍ")
        print(f" 🏃 النشاط الحالي : {current_activity}")
        print(f" 📍 الغرفة       : {current_location}")
        print(f" 😊 الشعور       : {current_emotion}")
        print(f"====================================================")

        time.sleep(wait_seconds)
        current_step_index = (current_step_index + 1) % len(SIMULATION_STEPS)

STATIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")

class Handler8888(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # API endpoint
        if self.path == "/api/floorplan/status":
            response_data = {
                "room": current_location,
                "emotion": current_emotion,
                "activity": current_activity,
                "icon": current_icon,
                "devices": {
                    "laptop_status": "on" if "Work" in current_activity else "off"
                },
                "details": {
                    "full_activity": current_activity,
                    "active_icon": current_icon,
                    "current_emotion": current_emotion,
                    "all_events": all_events_history[-30:],
                    "history": spatial_history[-10:]
                }
            }
            self.send_response(200)
            self.send_header("Content-type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(response_data, ensure_ascii=False).encode("utf-8"))
            print(f"[🔵 Port 8888] API: {current_activity} @ {current_location}")
            return

        # /api/config — used by index.html, return defaults
        if self.path == "/api/config":
            self.send_response(200)
            self.send_header("Content-type", "application/json; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps({
                "ha_url": "http://localhost:8888",
                "ha_token": ""
            }).encode("utf-8"))
            return

        # Serve index.html and static files
        if self.path == "/" or self.path == "/index.html":
            file_path = os.path.join(STATIC_DIR, "index.html")
        else:
            file_path = os.path.join(STATIC_DIR, self.path.lstrip("/"))

        if os.path.isfile(file_path):
            self.send_response(200)
            if file_path.endswith(".html"):
                self.send_header("Content-type", "text/html; charset=utf-8")
            elif file_path.endswith(".js"):
                self.send_header("Content-type", "application/javascript")
            elif file_path.endswith(".css"):
                self.send_header("Content-type", "text/css")
            else:
                self.send_header("Content-type", "application/octet-stream")
            self.end_headers()
            with open(file_path, "rb") as f:
                self.wfile.write(f.read())
            return

        self.send_response(404)
        self.end_headers()
        self.wfile.write(b"Not Found")

    def log_message(self, format, *args):
        return


class Handler8766(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        try:
            req = urllib.request.urlopen("http://localhost:8888/api/floorplan/status")
            fetched = json.loads(req.read().decode("utf-8"))
        except Exception as e:
            fetched = {"error": str(e), "room": current_location, "activity": current_activity}
        self.wfile.write(json.dumps(fetched, ensure_ascii=False).encode("utf-8"))

    def log_message(self, format, *args):
        return


class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    threading.Thread(target=simulation_ticker, daemon=True).start()
    threading.Thread(target=lambda: ThreadedTCPServer(("", 8888), Handler8888).serve_forever(), daemon=True).start()
    threading.Thread(target=lambda: ThreadedTCPServer(("", 8766), Handler8766).serve_forever(), daemon=True).start()

    print("\n=========================================================")
    print("🚀 نظام المحاكاة يعمل بنجاح!")
    print("🌐 افتح: http://localhost:8888/")
    print("⏱️ قاعدة الوقت: كل 5 دقائق حقيقية = ثانية واحدة في المحاكاة")
    print("=========================================================\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nإيقاف النظام.")
