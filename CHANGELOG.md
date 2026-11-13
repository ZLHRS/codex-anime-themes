# ZLHRS Theme Studio 2.6.6

- English and Russian interfaces with a saved language preference.
- All 61 themes included in Windows, macOS, and Linux builds.
- New Tatsumaki · Jade Silhouette with the original portrait on the right.
- Completed C.C.’s crown in Mint Contract and improved the shared water background in Twin Current.
- English README, setup guide, gallery, and demo preview text.
- The existing 23 custom pets remain available. No new pets were created.

# 2.6.5

- Softened cropped artwork edges and transitions into the background while preserving sizes and poses.
- Updated Furina and Reze portraits and restored some clipped artwork edges.
- Fixed Waguri’s black preview and added protection against blank gallery captures.
- Removed global portrait transparency; soft blending is used only where needed.
- Added a concise README with installation instructions for each system, including allowing the app to open on Mac.
- All 60 themes included in Windows, macOS (Apple Silicon and Intel), and Linux builds. No new pets were added.

# 2.6.4

- Removed colored borders and glow from code blocks in every theme while preserving neutral backgrounds and syntax highlighting.
- Expanded the catalog to 60 themes; updated artwork, transparent backgrounds, and portrait positions.
- Removed the circular moon halo in the upper-right corner.
- Updated Windows, macOS, and Linux builds.

# 2.5.15

- Fixed an invisible ChatGPT utility window blocking the left side of the screen on Windows. The launch helper now skips utility windows and windows that should not be activated.
- Preserved background operation without a Studio tray icon or automatic restoration of deleted shortcuts.
- Preserved first-click theme launch fixes and the bounded automatic retry.

# 2.5.14

- Removed the Studio tray icon. Themes continue working in the background.
- Normal startup no longer creates or restores desktop shortcuts. Shortcuts deleted by the user do not return when launching from Start.
- The themed ChatGPT shortcut is created only through the explicit button; existing shortcuts keep working.
- Open the gallery separately from Start or the Studio executable. Quit Studio stops background operation completely.
- Preserved launch fixes, automatic retry, and reduced memory use from earlier versions.

# 2.5.12

- Theme application and recovery now continue even if bringing the ChatGPT window to the foreground fails.
- On Windows, the window is restored directly; launching the themed ChatGPT shortcut does not open the Studio gallery.
- Helper preparation and ChatGPT launch run in parallel, with connection checks avoiding sequential waits for local addresses.
- Styles are supplied before the shell is ready; startup is confirmed only after the themed interface appears.
- If the main window is missing, one automatic retry closes the remaining process of the selected ChatGPT app. A main window that is still loading is not restarted.
- Preserved the memory reduction and chat-navigation styling fix from 2.5.11.

# 2.5.11

- Themes update before the first frame of a new chat, without the previous 180 ms delay.
- Closing the gallery releases its window and previews; reopening preserves the selected theme and settings.
- On Windows, a small legacy-engine lock helper replaces the long-running PowerShell process, with a compatible fallback.
- A separate themed ChatGPT shortcut with the Studio icon launches the chat and theme together without opening the gallery. The normal ChatGPT shortcut is unchanged.
- Background memory on the tested Windows machine fell from approximately 365 MB to 290 MB. Usage varies by system and application state.

# 2.5.7

- Fixed endless theme switching when Studio and the legacy Theme Engine ran together on Windows.
- Studio stops only its own legacy background engine and prevents it from restarting until Studio exits.
- Added migration checks: unrelated processes are left alone and the lock is released on exit.

# 2.5.5

- Packaged 25 themes, including Silver Edge (formerly Private Duo). The renamed theme keeps its selection and settings.
- Final Silver Edge layout: one image on the right without additional transparency.
- Refresh rereads the catalog; Check for updates queries GitHub even when a local project is connected.
- The home-page composer now matches the selected theme.

# 2.5.4

- Fixed the Windows update failure: the helper starts independently of Studio, which waits for its readiness confirmation.
- Studio reopens after an update; replacing a temporarily locked EXE is retried.
- Correct shortcuts are no longer rewritten on every startup.

# 2.5.3

- Studio automatically creates or repairs both legacy shortcuts at startup, including after its folder is moved.
- Both Kana themes use a wider view, with artwork below the header and softer edges. The header stays opaque even when the background is enlarged.

# 2.5.2

- Fixed dependency-lock consistency for automated builds of the improved themes.

# 2.5.1

- Replaced both Kana images with versions restoring line and eye clarity. Small details may differ from the originals. Full-screen placement and rotation are preserved.

# 2.5.0

- Added two full-chat Kana themes: Warm Garnet and Ruby Spotlight.
- Rotated the portrait source into landscape orientation using styles, without redrawing it.
- Added chat previews, individual effects, brightness, size and position settings, and animation controls.
- The interface now reads the theme count directly from the catalog.

# 2.4.2

- Removed Furina · Blue Light, its artwork, and its preview. The catalog now contains 15 themes.

# 2.4.1

- Removed the black strip above the bottom bar in every theme by disabling a separate gradient inside the sticky chat spacer. Spacing and scrolling are preserved.
- Shared styling fixes now contribute to the applied-theme version check.

# 2.4.0

- Added individual decorative effects for all 16 themes.
- Added image brightness, size, and position settings saved separately for each theme.
- Added effect and animation switches and a reset for the selected theme.
- Animations respect the system’s reduced-motion preference.

# 2.3.3

- Removed clipped decorative badges above the composer in all 16 themes.
- Side decorations remain only in Bunny Refrain and Zero Two; other composers no longer show them.
- Disabled the decorative bottom-panel background. Some dark edge shading still remains.

# 2.3.2

- The shortcut automatically restarts the selected ChatGPT app when a connection is unavailable. After requesting a normal close, only the verified main process is terminated; its path and start time are checked again.
- The last theme and an available port are saved for the next launch.
- Added a restart check for an instance that remains in the background.

# 2.3.1

- Studio chooses and saves an available port when the current port is occupied.
- When the connection is unavailable, the Windows version requests a normal close of the selected ChatGPT app before relaunching; it does not force termination.
- Background checks no longer overwrite connection status messages.
- Integration tests use a free port rather than occupying the user application’s port.

# 2.3.0

- Fixed connection to ChatGPT listening on IPv6 ::1 rather than IPv4.
- Theme application is confirmed by checking the actual selected styles in a ready chat window.
- Theme switching and background recovery are serialized; the avatar utility window is excluded.
- Removed EXE files, ZIP files, duplicate previews, and obsolete Windows launchers from the repository.
- Added real Chromium checks for every theme, cold startup, detached windows, reload, and restart.

# 2.2.0

- Added a ready-to-run portable Windows ZIP: extract it and open the EXE without installation.
- The portable version updates from a ZIP in its own folder without launching an installer.
- Instructions now point to the packaged archive in Releases.

# 2.1.0

- The launch button brings an existing ChatGPT window to the foreground.
- Shortcut creation is verified by reading the saved file; added Show shortcut.
- Added a separate tab with simple instructions.
- Added Check for updates: release check, download, SHA-256 verification, installation, and restart while preserving the selection.
- Studio stays open when already up to date, when the network fails, or when a downloaded file is damaged.

# 2.0.0

- Introduced a shared Electron interface for Windows, macOS, and Linux.
- Theme application no longer requires PowerShell; the selection is stored outside the installation folder.
- Added automatic app discovery, manual path selection, and a shortcut that restores the last theme.
- Added EXE, DMG, AppImage, and DEB installers through GitHub Actions.
- Added runtime, settings-persistence, search, and enlarged-preview checks.

# 1.6.0

- Added a ready-to-run ZLHRS Theme Studio.exe with an icon and no console window.
- Theme Studio and ChatGPT shortcuts use the EXE.
- Launcher source code and the build script are included in the repository.

# 1.5.1

- Added a simple four-step README guide.
- Added the ZLHRS Theme Studio logo and icon to the application window and shortcuts.

# 1.5.0

- ZLHRS Theme Studio.cmd automatically installs the package and creates shortcuts on startup.
- Launching from a clone and from the installed catalog uses the same saved theme.
- The selection is saved before attempting to launch the app.

# 1.4.0

- All 16 cards show a demo chat using the actual theme styles.
- Previews are larger and fully visible; clicking opens an enlarged view.
- Images load without locking files during updates.

# 1.3.0

- Redesigned the skins tab based on Codex App Manager: sidebar, two columns, dark cards, and lilac buttons.
- Cards show descriptions, versions, authors, and palettes, with a separate details button.
- Added search by name, description, and author; a selected-theme filter; and a compact list view.
- Built the interface with Windows WPF without new dependencies.

# 1.2.0

- Added a new card-grid interface with wide previews, search, and a selected-theme indicator.
- Installation uses a local user folder and creates ChatGPT and Theme Studio shortcuts.
- The ChatGPT shortcut restores the last theme without opening the catalog.
- Existing shortcuts are backed up before replacement.

# 1.1.0

- Added a built-in selector with previews for all 16 themes.
- START.cmd opens the menu with a double-click.
- Added a standalone Windows PowerShell theme mechanism, removing the need for Node.js or Codex App Manager.
- Themes can be switched in an open app launched through the menu.
- Selection is stored in a separate local file without modifying a third-party manager’s settings.
- Conflicting managers and unsupported launches produce messages instead of forced process termination.
- Updated the ZIP and instructions.
