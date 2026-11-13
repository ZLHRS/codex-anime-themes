# 2.5.11

- Themes update before the first frame of a new chat, without the previous 180 ms delay.
- Closing the gallery releases its window and previews; reopening preserves the selected theme and settings.
- On Windows, a small legacy-engine lock helper replaces the long-running PowerShell process, with a compatible fallback.
- A separate themed ChatGPT shortcut with the Studio icon launches the chat and theme together without opening the gallery. The normal ChatGPT shortcut is unchanged.
- Background memory on the tested Windows machine fell from approximately 365 MB to 290 MB. Usage varies by system and application state.

Builds for Windows, macOS (Apple Silicon and Intel), and Linux. A compatible installed ChatGPT app is required. Builds are unsigned.
Build and gallery checks are automated; integration with the actual ChatGPT app has been verified on Windows.
