import re
import json
from collections import defaultdict

LOG_FILE = "aa.txt"
OUTPUT_JSON = "videos_data.json"

def parse_summary_block(lines, start_idx):
    """Extract total_clips, duration, avg_confidence, and emotion distribution."""
    data = {}
    distribution = {}
    i = start_idx
    while i < len(lines):
        line = lines[i].strip()
        # Stop if we hit a separator line (many '=' characters)
        if line.startswith("===") and len(line) > 20:
            break

        # Total Clips
        if "Total Clips:" in line:
            m = re.search(r"Total Clips:\s*(\d+)", line)
            if m:
                data["total_clips"] = int(m.group(1))
        # Duration
        elif "Duration:" in line:
            m = re.search(r"Duration:\s*(\d+)\s+seconds", line)
            if m:
                data["duration"] = int(m.group(1))
        # Average Confidence
        elif "Average Confidence:" in line:
            m = re.search(r"Average Confidence:\s*([\d.]+)", line)
            if m:
                data["avg_confidence"] = float(m.group(1))
        # Emotion distribution lines
        elif '|' in line:
            parts = line.split('|')
            if len(parts) == 2:
                emotion_part = parts[0].strip()
                # The emotion name is the first word
                emotion = emotion_part.split()[0] if emotion_part.split() else None
                if emotion:
                    # Extract numbers from the right part
                    nums = re.findall(r'\d+', parts[1])
                    if nums:
                        count = int(nums[-1])  # the last number is the count
                        distribution[emotion] = count
        i += 1

    if data:
        data["distribution"] = distribution
    return data, i

def main():
    try:
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            lines = f.readlines()
    except FileNotFoundError:
        print(f"Error: {LOG_FILE} not found.")
        return

    # Find the "ALL VIDEOS" section
    all_videos_start = None
    for idx, line in enumerate(lines):
        if "GENERATING EMOTIONAL CLIPS - ALL VIDEOS" in line:
            all_videos_start = idx
            break

    if all_videos_start is None:
        print("Could not find 'ALL VIDEOS' section.")
        return

    videos = []
    i = all_videos_start
    while i < len(lines):
        line = lines[i].strip()
        # Look for processing line
        m = re.search(r"Processing:\s*(\S+\.avi)\s+\[(\d+)/(\d+)\]", line)
        if m:
            filename = m.group(1)
            print(f"Found video: {filename}")
            # Search for the summary block - look for "Clip Statistics:"
            j = i + 1
            summary_start = None
            while j < len(lines):
                if "Clip Statistics:" in lines[j]:
                    summary_start = j
                    break
                j += 1

            if summary_start is not None:
                print(f"  Found summary block for {filename}")
                data, next_idx = parse_summary_block(lines, summary_start)
                if data:
                    data["filename"] = filename
                    videos.append(data)
                    print(f"  -> Parsed: {data.get('total_clips', '?')} clips, {data.get('duration', '?')}s, avg conf {data.get('avg_confidence', '?')}")
                else:
                    print(f"  -> Failed to parse stats for {filename}")
                i = next_idx
            else:
                print(f"  No summary block found for {filename}")
                i += 1
        else:
            i += 1

    if not videos:
        print("No video summaries were extracted.")
        return

    # Group by dominant emotion
    grouped = defaultdict(list)
    for video in videos:
        dist = video.get("distribution", {})
        if dist:
            dominant = max(dist, key=dist.get)
            video["dominant_emotion"] = dominant
            grouped[dominant].append(video)
        else:
            print(f"Warning: No distribution for {video.get('filename', 'unknown')}")

    with open(OUTPUT_JSON, 'w', encoding='utf-8') as f:
        json.dump(grouped, f, indent=2, ensure_ascii=False)

    print(f"\n✅ Done! Wrote {len(videos)} videos to {OUTPUT_JSON}")

if __name__ == "__main__":
    main()