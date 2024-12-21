# Define cooldown period (2 days in seconds)
cool_down_period = 172800.0  # 2 days in seconds
last_played_time = ref(0.0)

# Function to check if the cooldown period is over
def check_cool_down() =
    current_time = system.get_time()
    if (current_time - !last_played_time) < cool_down_period then
        log("Cool down in effect. Skipping action.")
        null()  # No action taken; you can return something else if desired
    else
        last_played_time := current_time  # Reset the last played time
        radio   # Return the radio stream if cooldown is over
    end
end

playlist_cloud_pants = playlist(id="playlist_cloud_pants",mime_type="audio/x-mpegurl",mode="randomize",reload_mode="watch","/var/azuracast/stations/zamrock/playlists/playlist_cloud_pants.m3u")
playlist_cloud_pants = cue_cut(id="cue_playlist_cloud_pants", playlist_cloud_pants)

playlist_nepeta_cataria = playlist(id="playlist_nepeta_cataria",mime_type="audio/x-mpegurl",mode="randomize",reload_mode="watch","/var/azuracast/stations/zamrock/playlists/playlist_nepeta_cataria.m3u")
playlist_nepeta_cataria = cue_cut(id="cue_playlist_nepeta_cataria", playlist_nepeta_cataria)

playlist_acid = playlist(id="playlist_acid",mime_type="audio/x-mpegurl",mode="randomize",reload_mode="watch","/var/azuracast/stations/zamrock/playlists/playlist_acid.m3u")
playlist_acid = cue_cut(id="cue_playlist_acid", playlist_acid)

# ... (continue defining other playlists as in your provided script)

# Combining all playlists into a radio stream
radio = random(id="standard_playlists", weights=[
    25, 24, 21, 20, 20, 19, 18, 15, 15, 10, 9], 
    [playlist_cloud_pants, playlist_nepeta_cataria, playlist_acid, playlist_artist_of_the_month, playlist_afro, playlist_zamrock, playlist_blues, playlist_funk, playlist_rock, playlist_country2C__moo, playlist_trance])

# AutoDJ & other functions remain unchanged...

# Apply the cooldown check
radio_with_cooldown = fallback(id="radio_with_cooldown", track_sensitive = true, [
    check_cool_down(),
    radio
])

# Now use `radio_with_cooldown` wherever your streaming logic is needed
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
radio_with_cooldown = fallback(id="autodj_fallback", track_sensitive = true, [dynamic_startup, radio_with_cooldown])

# Follow the rest of the existing logic...
# Requests, interrupts, and skip commands remain unchanged...

# Save the amplification settings if needed
radio_with_cooldown = amplify(override="liq_amplify", 1., radio_with_cooldown)
