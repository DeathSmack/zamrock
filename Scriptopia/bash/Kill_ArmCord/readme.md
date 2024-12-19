## Script Description

This Bash script is designed to manage the `armcord` processes running on a system. It checks if any `armcord` processes are currently active, and if so, it terminates them gracefully.

### How It Works

1. **Find the PIDs of the armcord Processes**:
   - The script uses the `pgrep` command to search for all running processes with the name `armcord`. The Process IDs (PIDs) of these processes are stored in the variable `PIDS`.

2. **Check if armcord is Running**:
   - If the `PIDS` variable is empty (meaning there are no `armcord` processes found), the script outputs a message indicating that `armcord` is not running.

3. **Terminate the armcord Processes**:
   - If `PIDS` is not empty, the script outputs a message listing the PIDs of the running `armcord` processes.
   - It then iterates over each PID, attempting to kill each `armcord` process using the `kill` command.
   - After attempting to kill a process, the script checks the exit status (`$?`) to confirm whether the termination was successful:
     - If successful, it outputs a message indicating that the process has been terminated.
     - If unsuccessful, it outputs a message indicating that the attempt to terminate the process failed.

### Conclusion

This script is useful for users who need a quick way to identify and terminate any running `armcord` processes on their system. It provides feedback about the status of the `armcord` processes and the success or failure of the termination attempts.
