# 2.5.12

- Theme application and recovery now continue even if bringing the ChatGPT window to the foreground fails.
- On Windows, the window is restored directly; launching the themed ChatGPT shortcut does not open the Studio gallery.
- Helper preparation and ChatGPT launch run in parallel, with connection checks avoiding sequential waits for local addresses.
- Styles are supplied before the shell is ready; startup is confirmed only after the themed interface appears.
- If the main window is missing, one automatic retry closes the remaining process of the selected ChatGPT app. A main window that is still loading is not restarted.
- Preserved the memory reduction and chat-navigation styling fix from 2.5.11.

Update using Check for updates in Theme Studio. The themed ChatGPT shortcut is preserved.


Builds for Windows, macOS (Apple Silicon and Intel), and Linux. A compatible installed ChatGPT app is required. Builds are unsigned.
Full startup speed depends on ChatGPT and system load.
