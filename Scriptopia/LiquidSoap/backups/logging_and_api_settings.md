# Configuration Settings
### Daemon Initialization:

``` bash
init.daemon.set(false)
init.daemon.pidfile.path.set("/var/azuracast/stations/zamrock/config/liquidsoap.pid")
init.daemon.set(false): This disables running Liquidsoap as a background daemon. When set to true, Liquidsoap would run in the background.
```
- pidfile.path.set: Specifies the file path where the process ID (PID) will be stored if the daemon were to be running. In this instance, it points to a file in the AzuraCast configuration directory.
Logging Configuration:

``` bash
log.stdout.set(true)
log.file.set(false)
```
- log.stdout.set(true): Enables output logging to standard output (e.g., the terminal or console).
- log.file.set(false): Disables logging to a file. This means logs won't be stored in a file but will appear in the standard output.
### Server Log Level:

``` bash
settings.server.log.level.set(4)
```
Sets the logging verbosity level for the server. The level can range from 0 (critical errors only) to 9 (all messages). Level 4 generally means informational messages will be logged.
### Server Socket Configuration:

``` bash
settings.server.socket.set(true)
settings.server.socket.permissions.set(0o660)
settings.server.socket.path.set("/var/azuracast/stations/zamrock/config/liquidsoap.sock")
```
- settings.server.socket.set(true): Enables the server socket for inter-process communication.
- permissions.set(0o660): Sets the Unix permissions for the socket (read and write for owner and group).
- path.set: Specifies the file path for the Unix socket which will be used for communication.
### Harbor Setup:

``` bash
settings.harbor.bind_addrs.set(["0.0.0.0"])
```
This setting binds the Liquidsoap server to listen on all available interfaces (0.0.0.0), allowing it to accept incoming connections on any IP address associated with the server.
### Metadata Export Settings:

``` bash
settings.encoder.metadata.export.set(["artist","title","album","song"])
```
This configures the server to export specific metadata fields (like artist, title, album, and song) to connected clients or applications.
### Time Zone Setting:

``` bash
environment.set("TZ", "America/Denver")
```
Sets the time zone for the server environment to "America/Denver".
### Reference Variables
Reference Variables Initialization:
``` bash
autodj_is_loading = ref(true)
ignore(autodj_is_loading)

autodj_ping_attempts = ref(0)
ignore(autodj_ping_attempts)

live_enabled = ref(false)
ignore(live_enabled)

to_live = ref(false)
ignore(to_live)
```
These ref variables are initialized to track the state of various components:
- autodj_is_loading: Indicates if the AutoDJ system is in the process of loading.
- autodj_ping_attempts: Counts the number of attempts made to ping the AutoDJ to check its status.
- live_enabled: Tracks whether live streaming is currently enabled.
- to_live: Tracks whether a transition to live streaming is pending.
### Drop Metadata Function
- Function to Drop Metadata:
``` bash
def drop_metadata(~id=null(), s)
    let {metadata=_, ...tracks} = source.tracks(s)
    source(id=id, tracks)
end
```
This custom function is created to implement the behavior of the now-deprecated drop_metadata function in Liquidsoap. It removes metadata from tracks while preserving the actual audio content.
### AzuraCast API Integration
AzuraCast API Configuration:

``` bash 
azuracast_api_url = "http://127.0.0.1:6010/api/internal/1/liquidsoap"
azuracast_api_key = "api key here"
```
The script defines the base URL for the AzuraCast API which Liquidsoap will use to communicate with the AzuraCast server. An API key is also defined for authorization. This key should be kept secure, as it provides access to the API.
### Function to Call AzuraCast API:

``` bash
def azuracast_api_call(~timeout=2.0, url, payload) =
```
This function constructs a POST request to the AzuraCast API.
- full_url: Combines the base URL and a specific endpoint.
- log(): Logs the API request details.
- http.post(): Sends the request with headers indicating the content type, user agent, and API key.
- Error Handling: Catches any errors during the request process and logs them, returning "false" on failure.
### Media Protocol Definition
Media Protocol for Liquidsoap:
``` bash
station_media_dir = "/var/azuracast/stations/zamrock/media"
def azuracast_media_protocol(~rlog=_,~maxtime=_,arg) =
    ["#{station_media_dir}/#{arg}"]
```
This part defines how Liquidsoap will access media files stored in the AzuraCast media directory:
- azuracast_media_protocol: A custom protocol function that generates a file path based on the provided arg.
- protocol.add(...): Registers this protocol with Liquidsoap, allowing users to refer to media files using a media:uri syntax.
## Summary
In summary, this script segment:

- Configures Liquidsoap settings and logging parameters.
- Initializes relevant parameters that track the state of the system and interactions with the API.
- Defines a method for communicating with the AzuraCast API for dynamic media-serving and track management.
- Customizes how Liquidsoap interacts with audio files from the AzuraCast media directory.
