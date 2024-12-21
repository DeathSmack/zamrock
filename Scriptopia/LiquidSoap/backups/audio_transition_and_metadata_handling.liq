
def live_aware_crossfade(old, new) =
    if to_live() then
        # If going to the live show, play a simple sequence
        sequence([fade.out(old.source),fade.in(new.source)])
    else
        # Otherwise, use the smart transition
        cross.smart(old, new, fade_in=2.00, fade_out=2.00)
    end
end

radio = cross(minimum=0., duration=3.00, live_aware_crossfade, radio)

# Allow for Telnet-driven insertion of custom metadata.
radio = server.insert_metadata(id="custom_metadata", radio)

# Normalization and Compression
radio = normalize(target = 0., window = 0.03, gain_min = -16., gain_max = 0., radio)
radio = compress.exponential(radio, mu = 1.0)

error_file = single(id="error_jingle", "/usr/local/share/icecast/web/error.mp3")

def tag_error_file(m) =
    ignore(m)
    [("is_error_file", "true")]
end
error_file = metadata.map(tag_error_file, error_file)

radio = fallback(id="safe_fallback", track_sensitive = false, [radio, error_file])

# Send metadata changes back to AzuraCast
last_title = ref("")
last_artist = ref("")

def metadata_updated(m) =
    def f() =
        if (m["is_error_file"] != "true") then
            if (m["title"] != last_title() or m["artist"] != last_artist()) then
                last_title.set(m["title"])
                last_artist.set(m["artist"])

                j = json()

                if (m["song_id"] != "") then
                    j.add("song_id", m["song_id"])
                    j.add("media_id", m["media_id"])
                    j.add("playlist_id", m["playlist_id"])
                else
                    j.add("artist", m["artist"])
                    j.add("title", m["title"])
                end

                _ = azuracast_api_call(
                    "feedback",
                    json.stringify(j)
                )
            end
        end
    end

    thread.run(f)
end

radio.on_metadata(metadata_updated)

# Handle "Jingle Mode" tracks by replaying the previous metadata.
last_metadata = ref([])
def handle_jingle_mode(m) =
    if (m["jingle_mode"] == "true") then
        last_metadata()
    else
        last_metadata.set(m)
        m
    end
end

radio = metadata.map(update=false, strip=true, handle_jingle_mode, radio)
