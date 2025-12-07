# ------------------------------------------------------------------
# Now‑Playing Helper – Mountain Time (MT) aware
# ------------------------------------------------------------------
import datetime
import pytz
from dateutil import parser

# ------------------------------------------------------------------
# 3.1 Schedule – list of dicts (time ranges + show name)
# ------------------------------------------------------------------
SCHEDULE = [
    # Example entry format: {"start": "06:00", "end": "12:00", "show": "Acid Trip"},
    # Monday – Tuesday – … all days share same times in your data
    {"start": "06:00", "end": "12:00", "show": "Acid Trip"},
    {"start": "06:00", "end": "09:00", "show": "Morning Coffee Mix"},
    {"start": "07:00", "end": "13:00", "show": "Afrobeat Legacy"},
    {"start": "08:00", "end": "14:00", "show": "Blues in Every Tongue"},
    {"start": "10:00", "end": "16:00", "show": "The Funky Truth"},
    {"start": "11:00", "end": "17:00", "show": "ZamDelic Trance"},
    {"start": "12:00", "end": "22:00", "show": "Zamrock Rising"},
    {"start": "00:30", "end": "18:00", "show": "Artist of the Month"},
    {"start": "09:00", "end": "15:00", "show": "Cloud Pants"},
    {"start": "14:00", "end": "16:00", "show": "Country, …Moo"},
    {"start": "12:00", "end": "22:00", "show": "ZamRock Classics"},
    {"start": "18:00", "end": "22:00", "show": "The Catnip Sessions"},
    {"start": "22:00", "end": "06:00", "show": "Dublab Sessions"},
    {"start": "22:00", "end": "06:00", "show": "Endless Mixtapes"},
]

MT = pytz.timezone("America/Denver")  # Mountain Time

def parse_user_time(text: str):
    """
    Accepts strings like:
      - "10:00 AM MT"
      - "22:30 UTC"
      - "3:15 PM PST"
    Returns a datetime object in MT.
    """
    # Try to parse with dateutil, then force tz
    try:
        dt = parser.parse(text, fuzzy=True)
    except Exception as e:
        raise ValueError(f"Could not parse time: {text}") from e

    # If no tzinfo, assume MT
    if dt.tzinfo is None:
        dt = MT.localize(dt.replace(tzinfo=None))
    else:
        # Convert to MT
        dt = dt.astimezone(MT)

    return dt

def now_playing(user_input: str) -> str:
    """
    Main entry point called by the bot when a user asks:
        "What’s playing at 10:45 PM?"
    """
    # Step 1: Identify time zone
    user_has_tz = any(tz in user_input for tz in ["MT", "MST", "MDT", "UTC", "PST", "PDT", "CST", "CDT", "EST", "EDT"])
    if not user_has_tz:
        # We only have MT data – ask for user's zone
        return ("⏰ That time looks local. This is Mountain Time (MT). "
                "If you're in a different zone, let me know the time and your zone, "
                "and I’ll convert it for you!")

    # Step 2: Convert user time to MT
    dt_mt = parse_user_time(user_input)

    # Step 3: Find overlapping shows
    current_shows = []
    hour_min = dt_mt.strftime("%H:%M")
    for entry in SCHEDULE:
        start = datetime.datetime.strptime(entry["start"], "%H:%M").time()
        end   = datetime.datetime.strptime(entry["end"],   "%H:%M").time()

        # Handle overnight shows (22:00‑06:00)
        if start <= end:
            if start <= dt_mt.time() < end:
                current_shows.append(entry["show"])
        else:  # Overnight case
            if dt_mt.time() >= start or dt_mt.time() < end:
                current_shows.append(entry["show"])

    # Step 4: Build reply
    if current_shows:
        shows_str = ", ".join(f"**{s}**" for s in current_shows)
        return (f"🎶 At {dt_mt.strftime('%I:%M %p MT')}, the following playlist(s) are live: {shows_str}.\n"
                "Enjoy the jam, humans & fur‑friends! 😺")
    else:
        return ("⏱️ Looks like there’s a silent stretch at that moment… "
                "Maybe the station’s on a quick cat‑nap. Hang tight! 💤")

# ------------------------------------------------------------------
# Example Usage:
# ------------------------------------------------------------------
if __name__ == "__main__":
    user_query = "What’s playing at 10:15 PM PST?"
    try:
        reply = now_playing(user_query)
        print(reply)
    except ValueError as exc:
        print(str(exc))
