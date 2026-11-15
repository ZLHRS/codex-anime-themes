# ZLHRS themes for Claude Code — desktop edition

This archive is for the **Code tab in Claude Desktop**, Windows/macOS. It is not for the terminal CLI or the ordinary Claude chat tab. It uses the community [themes-for-claude mod](https://github.com/0toshigami/claude-desktop-themes), not the Codex Theme Studio connection.

## Установка

1. В Claude Desktop откройте Settings → Plugins → Add → Add marketplace и добавьте `https://github.com/0toshigami/claude-desktop-themes.git`. Установите **themes-for-claude**.
2. В открытой сессии вкладки **Code** введите `/themes`. Если команды нет, выполните `/reload-plugins` и `/reload-skills`. Нажмите **Install extension**, полностью закройте Claude, включая значок в трее, и откройте снова. Это действие выполняет сторонний мод; он устанавливает расширение и включает `REACT_PROFILE`.
3. Распакуйте архив **Claude-Code**. Скопируйте файлы из папки `themes` в `%USERPROFILE%\.claude\themes-for-claude\` (Windows) или `~/.claude/themes-for-claude/` (macOS). На Windows можно запустить приложенный `Install-Claude-Themes.ps1`: он копирует только темы и сохраняет резервные копии заменяемых файлов. Настройки Claude скрипт не меняет.
4. Откройте `/themes` → **Yours** и выберите тему ZLHRS. Чтобы вернуть исходный вид, выберите **Claude**.

## English installation

Install **themes-for-claude** from the marketplace above, open `/themes` in a Code session, install its extension and fully restart Claude. Extract this archive and copy the contents of `themes` to `~/.claude/themes-for-claude/` (Windows: `%USERPROFILE%\.claude\themes-for-claude\`). Select a theme in `/themes` → **Yours**. On Windows the included PowerShell installer performs the copy and backs up any replaced files. It does not install the extension or change Claude settings.

## Included and limitations

### Theme Studio: direct application and original artwork

The updated Studio has a **Claude** button on each theme card. After the upstream
extension is installed once, this writes its selected theme directly; `/themes`
is optional. The first Studio application installs a local artwork companion and
requires one full Claude restart. Subsequent theme changes are live.

The companion copies original image files without recompression, preserves aspect
ratio, and renders the original composition CSS in an isolated artwork layer.
Full backgrounds, rotated art, paired characters, masks and responsive sizes follow
the ChatGPT source theme. Opening the right session panel does not
move or resize the character; the artwork continues underneath the panel. The companion
only runs on `https://claude.ai/*` and loads local extension resources. It reads
layout bounds, not messages. Stock theme reset also removes its artwork.

The standalone data-only archive below still uses compressed embedded images.
For original quality use the updated Studio. Locally verified in Claude Desktop
5.11492.5 on Windows with both Kana themes, Furina Moonlit Repose, Jade Duo,
Crimson Heart Duo and Tidal Halo Twin Current. Automated comparison covers all
87 image themes at three window sizes (261 comparisons), including right-panel
invariance. Not every theme has been manually checked.

- 99 themes: adapted colors, original character artwork/backgrounds, and 12 animated ASCII scenes.
- Original pose, expression and clothing are retained. Images are resized/compressed with transparency retained to fit the mod's 200,000-character stylesheet limit. Layout is adapted to Claude rather than identical to Codex.
- The two MP4 themes use their original static poster images here. Video playback and ChatGPT Pets are not included.
- Community integration, not an official Anthropic feature. Export validation and browser rendering are tested. Updates to Claude or the mod may affect compatibility. Linux is not supported by the upstream installation workflow.
- `inventory.json` records each theme's source, rendering mode and license. Character artwork retains its original personal-use designation. ASCII artwork is by 0toshigami, MIT; license and source notice are included.

For removal, select Claude in `/themes` and remove only the `zlhrs-*` files you copied. To remove the extension itself, use the upstream mod's **Remove extension** action before uninstalling its plugin.
