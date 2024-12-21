init.daemon.set(false)
init.daemon.pidfile.path.set("/var/azuracast/stations/zamrock/config/liquidsoap.pid")

log.stdout.set(true)
log.file.set(false)

settings.server.log.level.set(4)

settings.server.socket.set(true)
settings.server.socket.permissions.set(0o660)
settings.server.socket.path.set("/var/azuracast/stations/zamrock/config/liquidsoap.sock")

settings.harbor.bind_addrs.set(["0.0.0.0"])
settings.encoder.metadata.export.set(["artist","title","album","song"])

environment.set("TZ", "America/Denver")

autodj_is_loading = ref(true)
ignore(autodj_is_loading)

autodj_ping_attempts = ref(0)
ignore(autodj_ping_attempts)

# Track live-enabled status.
live_enabled = ref(false)
ignore(live_enabled)

# Track live transition for crossfades.
to_live = ref(false)
ignore(to_live)

# Reimplement LS's now-deprecated drop_metadata function.
def drop_metadata(~id=null(), s)
    let {metadata=_, ...tracks} = source.tracks(s)
    source(id=id, tracks)
end

# Transport for HTTPS outputs.
https_transport = http.transport.ssl()
ignore(https_transport)

azuracast_api_url = "http://127.0.0.1:6010/api/internal/1/liquidsoap"
azuracast_api_key = "api key hee"
def azuracast_api_call(~timeout=2.0, url, payload) =
    full_url = "#{azuracast_api_url}/#{url}"

    log("API #{url} - Sending POST request to '#{full_url}' with body: #{payload}")
    try
        response = http.post(full_url,
            headers=[
                ("Content-Type", "application/json"),
                ("User-Agent", "Liquidsoap AzuraCast"),
                ("X-Liquidsoap-Api-Key", "#{azuracast_api_key}")
            ],
            timeout=timeout,
            data=payload
        )

        log("API #{url} - Response (#{response.status_code}): #{response}")
        "#{response}"
    catch err do
        log("API #{url} - Error: #{error.kind(err)} - #{error.message(err)}")
        "false"
    end
end

station_media_dir = "/var/azuracast/stations/zamrock/media"
def azuracast_media_protocol(~rlog=_,~maxtime=_,arg) =
    ["#{station_media_dir}/#{arg}"]
end

protocol.add(
    "media",
    azuracast_media_protocol,
    doc="Pull files from AzuraCast media directory.",
    syntax="media:uri"
)
