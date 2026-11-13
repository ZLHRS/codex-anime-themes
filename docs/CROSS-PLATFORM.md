# Theme Studio — Windows, macOS, Linux

## Installation

See the [step-by-step README](../README.md#installation), including how to allow the app to open on Mac. Download the build for your system from [Releases](https://github.com/ZLHRS/codex-anime-themes/releases/latest). All 61 themes are included in version 2.6.6.

- **Windows:** extract the entire portable ZIP and open `ZLHRS Theme Studio.exe`. Keep its companion files together. The update button replaces this folder’s application files without an installer.
- **macOS:** extract the matching Apple Silicon or Intel ZIP and move the app to Applications. Builds are not signed or notarized by Apple. If blocked, use the normal opening confirmation in Privacy & Security for a trusted download. Do not disable system protection.
- **Linux:** install the DEB or allow the AppImage to run (`chmod +x ZLHRS-Theme-Studio-*.AppImage`). If FUSE is unavailable, use the DEB on Debian/Ubuntu. Keep the AppImage in a permanent folder so its shortcut continues to work.

## Choosing a theme

1. Close ChatGPT and any older theme manager before the first connection.
2. Choose a theme and click Apply. If ChatGPT is not detected, use Choose application to select its EXE, Mac app, or Linux executable.
3. Studio saves your selection and opens ChatGPT with the theme. The selection remains saved even if the connection fails.
4. In Settings, use Create / update shortcuts. Launch through the themed ChatGPT shortcut next time. Linux also gets an application-menu entry; the desktop may ask you to trust its shortcut.

Studio stays in the background without a tray icon. Open the app to choose a theme; use Quit Studio to stop it completely.

## Language

Open Settings → Interface language and select English or Russian. The interface updates immediately and saves your choice. Changing language does not change your selected theme or artwork settings.

## Compatibility

Studio requires an installed desktop ChatGPT/Codex app using `app://-/index.html` and supporting `--remote-debugging-port`. The browser version and other wrappers are not supported. Studio does not replace or distribute OpenAI’s app. On Windows, it restarts ChatGPT when needed to connect the theme.

Common installation locations are checked automatically. Select unusual locations manually; do not select the command-line Codex CLI. Changes to ChatGPT’s interface may require updated theme styles.

Theme application has been verified on Windows. Automated Mac and Linux builds test the code and gallery, but applying themes to the actual ChatGPT app still requires verification on those devices.

## Settings and updates

Settings are stored separately from the installed program in Electron’s user-data folder:

- Windows: `%APPDATA%/zlhrs-theme-studio`
- macOS: `~/Library/Application Support/zlhrs-theme-studio`
- Linux: `~/.config/zlhrs-theme-studio`

Theme selection, artwork preferences, and language survive updates. Windows also imports the legacy selection from `%LOCALAPPDATA%/ZLHRS/ThemeStudio`.

Use Check for updates to download the latest release, verify its SHA-256 checksum, and install it with a restart. If already up to date, Studio stays open. Mac updates require write access to the application folder; Linux DEB installation may request your system password. Version 2.0 needs a one-time manual upgrade from Releases because it has no update button. Replace legacy Windows 1.x shortcuts with the current themed shortcut.

## Development

Requires Node.js 24+. Run `npm ci`, `npm test`, and `npm start`. Build with `npm run dist` on the target operating system. GitHub Actions runs tests and builds each platform; a `v2.*` tag publishes a release only after all platform builds succeed. Windows and Apple signing are not configured.

## Connection checks

Studio supports IPv4 and IPv6 loopback. It reports success only after checking the selected theme and styles in a ready chat window. Utility windows and the avatar are excluded. If ChatGPT was opened without local connection support, fully close it and use Open ChatGPT in Studio.
