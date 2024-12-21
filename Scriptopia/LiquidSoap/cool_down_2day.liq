# Define cooldown period (2 days in seconds)
cool_down_period = 172800.0  # 2 days in seconds
last_played_time = ref(0.0)

# Function to check if the cooldown period is over
def check_cool_down() =
    current_time = system.get_time()
    if (current_time - !last_played_time) < cool_down_period then
        log("Cool down in effect. Skipping action.")
        null()  # No action taken; can return something else if desired
    else
        last_played_time := current_time  # Reset the last played time
        radio   # Return the radio stream if cooldown is over
    end
end

# Define all playlists
playlist_cloud_pants = playlist(id="playlist_cloud_pants", mime_type="audio/x-mpegurl", mode="randomize", reload_mode="watch", "/var/azuracast/stations/zamrock/playlists/playlist_cloud_pants.m3u")
playlist_cloud_pants = cue_cut(id="cue_playlist_cloud_pants", playlist_cloud_pants)

playlist_nepeta_cataria = playlist(id="playlist_nepeta_cataria", mime_type="audio/x-mpegurl", mode="randomize", reload_mode="watch", "/var/azuracast/stations/zamrock/playlists/playlist_nepeta_cataria.m3u")
playlist_nepeta_cataria = cue_cut(id="cue_playlist_nepeta_cataria", playlist_nepeta_cataria)

playlist_acid = playlist(id="playlist_acid", mime_type="audio/x-mpegurl", mode="randomize", reload_mode="watch", "/var/azuracast/stations/zamrock/playlists/playlist_acid.m3u")
playlist_acid = cue_cut(id="cue_playlist_acid", playlist_acid)

playlist_artist_of_the_month = playlist(id="playlist_artist_of_the_month", mime_type="audio/x-mpegurl", mode="randomize", reload_mode="watch", "/var/azuracast/stations/zamrock/playlists/playlist_artist_of_the_month.m3u")
playlist_artist_of_the_month = cue_cut(id="cue_playlist_artist_of_the_month", playlist_artist_of_the_month)

playlist_afro = playlist(id="playlist_afro", mime_type="audio/x-mpegurl", mode="randomize", reload_mode="watch", "/var/azuracast/stations/zamrock/playlists/playlist_afro.m3u")
playlist_afro = cue_cut(id="cue_playlist_afro", playlist_afro)

playlist_zamrock = playlist(id="playlist_zamrock", mime_type="audio/x-mpegurl", mode="randomize", reload_mode="watch", "/var/azuracast/stations/zamrock/playlists/playlist_zamrock.m3u")
playlist_zamrock = cue_cut(id="cue_playlist_zamrock", playlist_zamrock)

playlist_blues = playlist(id="playlist_blues", mime_type="audio/x-mpegurl", mode="randomize", reload_mode="watch", "/var/azuracast/stations/zamrock/playlists/playlist_blues.m3u")
playlist_blues = cue_cut(id="cue_playlist_blues", playlist_blues)

playlist_funk = playlist(id="playlist_funk", mime_type="audio/x-mpegurl", mode="randomize", reload_mode="watch", "/var/azuracast/stations/zamrock/playlists/playlist_funk.m3u")
playlist_funk = cue_cut(id="cue_playlist_funk", playlist_funk)

playlist_rock = playlist(id="playlist_rock", mime_type="audio/x-mpegurl", mode="randomize", reload_mode="watch", "/var/azuracast/stations/zamrock/playlists/playlist_rock.m3u")
playlist_rock = cue_cut(id="cue_playlist_rock", playlist_rock)

playlist_country2C__moo = playlist(id="playlist_country2C__moo", mime_type="audio/x-mpegurl", mode="randomize", reload_mode="watch", "/var/azuracast/stations/zamrock/playlists/playlist_country2C__moo.m3u")
playlist_country2C__moo = cue_cut(id="cue_playlist_country2C__moo", playlist_country2C__moo)

playlist_trance = playlist(id="playlist_trance", mime_type="audio/x-mpegurl", mode="randomize", reload_mode="watch", "/var/azuracast/stations/zamrock/playlists/playlist_trance.m3u")
playlist_trance = cue_cut(id="cue_playlist_trance", playlist_trance)

# Standard Playlists
radio = random(id="standard_playlists", weights=[
    25, 24, 21, 20, 20, 19, 18, 15, 15, 10, 9], 
    [playlist_cloud_pants, playlist_nepeta_cataria, playlist_acid, playlist_artist_of_the_month, playlist_afro, playlist_zamrock, playlist_blues, playlist_funk, playlist_rock, playlist_country2C__moo, playlist_trance])

# AutoDJ Next Song Script
def autodj_next_song() =
    response = azuracast_api_call(
        "nextsong",
        ""
    )
    if (response == "") or (response == "false") then
        null()
    else
        r = request.create(response)
        if request.resolve(r) then
            r
        else
            null()
       end
    end
end

# Delayed ping for AutoDJ Next Song
def wait_for_next_song(autodj)
    autodj_ping_attempts.set(autodj_ping_attempts() + 1)

    if source.is_ready(autodj) then
        log("AutoDJ is ready!")
        autodj_is_loading.set(false)
        -1.0
    elsif autodj_ping_attempts() > 200 then
        log("AutoDJ could not be initialized within the specified timeout.")
        autodj_is_loading.set(false)
        -1.0
    else
        0.5
    end
end

dynamic = request.dynamic(id="next_song", timeout=20.0, retry_delay=10., autodj_next_song)
dynamic = cue_cut(id="cue_next_song", dynamic)

dynamic_startup = fallback(
    id = "dynamic_startup",
    track_sensitive = false,
    [
        dynamic,
        source.available(
            blank(id = "autodj_startup_blank", duration = 120.),
            predicate.activates({autodj_is_loading()})
        )
    ]
)

# Apply the cooldown check to the radio stream
radio_with_cooldown = fallback(id="radio_with_cooldown", track_sensitive = true, [
    check_cool_down(),
    radio
])

radio = fallback(id="autodj_fallback", track_sensitive = true, [dynamic_startup, radio_with_cooldown])

ref_dynamic = ref(dynamic)
thread.run.recurrent(delay=0.25, { wait_for_next_song(ref_dynamic()) })

requests = request.queue(id="requests")
requests = cue_cut(id="cue_requests", requests)
radio = fallback(id="requests_fallback", track_sensitive = true, [requests, radio])

interrupting_queue = request.queue(id="interrupting_requests")
interrupting_queue = cue_cut(id="cue_interrupting_requests", interrupting_queue)
radio = fallback(id="interrupting_fallback", track_sensitive = false, [interrupting_queue, radio])

# Skip command (used by web UI)
def add_skip_command(s) =
    def skip(_) =
        source.skip(s)
        "Done!"
    end

    server.register(namespace="radio", usage="skip", description="Skip the current song.", "skip", skip)
end

add_skip_command(radio)

# Apply amplification metadata (if supplied)
radio = amplify(override="liq_amplify", 1., radio)
