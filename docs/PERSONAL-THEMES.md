# Updates and personal themes

Starting with 2.6.9, the gallery combines the current bundled catalog with a separate personal library. An old `theme-source.json` no longer replaces the bundled catalog. New official themes always come from the installed release.

Use **Settings → Personal themes → Open personal themes folder**. This opens `personal-themes` inside the app's user-data directory (normally `%APPDATA%/zlhrs-theme-studio/personal-themes` on Windows). Place a theme pack in `themes/<id>/`, including `theme.json`, its CSS and artwork. An optional preview goes in `previews/<id>-chat.jpg`. Press **Refresh theme list** after adding a pack. No personal catalog.json is required. Keep the folder ID and theme.json ID identical.

Existing external theme sources and loose theme packs next to the installation are copied into this library automatically. Their original files are not deleted. Identical bundled copies are skipped. Different content with a bundled ID receives a distinct `personal-…` ID and a “Personal” name suffix, so both the updated official theme and the personal version remain available. Repeated refreshes do not duplicate unchanged copies. Subsequent edits in the personal library are not overwritten by the old source.

Before an in-app update, the app preserves external packs and retains the old app archive and settings under `updates/<version>/before-update` in user data. That archive also preserves manual edits made inside old application bundles. Such archive edits are a recovery backup, not automatically imported personal themes; keep future customizations in the personal library instead.

The Windows portable updater waits for the old installation's processes to exit and does not overwrite loose themes, previews, personal-theme folders or theme-source.json files. New builds include an inventory checked against the bundled catalog, previews and referenced assets on startup. An update receipt is confirmed only after the expected version starts.

An update can only deliver themes included in the published release. Local development changes are not downloaded by other users until a new release is published. Users on older builds should retain their original personal artwork when upgrading to 2.6.9, because the migration safeguards cannot run retroactively inside an old updater.
