# Separate downloads: Codex and Claude Code

[Download the 2.6.11 dual edition](https://github.com/ZLHRS/zlhrs-theme-studio/releases/tag/v2.6.11-dual-preview)

| Archive | Application | Contents |
| --- | --- | --- |
| **ZLHRS-Codex-2.6.11-Windows-x64.zip** | Codex / ChatGPT desktop, Windows x64 | Portable Theme Studio, 99 bundled themes, video and ASCII wallpapers. Extract everything and launch ZLHRS Theme Studio.exe. |
| **ZLHRS-Claude-Code-2.6.11-Themes.zip** | Claude Desktop, **Code** tab, Windows/macOS | 99 adapted themes for the community themes-for-claude mod. Original artwork, colors, 12 animated ASCII scenes. MP4 themes use static posters. See START-HERE.md inside. |

**Русский:** архив **Codex** — готовая программа для Windows. Архив **Claude-Code** — набор тем для вкладки Code приложения Claude Desktop; сначала нужен сторонний мод. Это разные пакеты, их нельзя устанавливать друг вместо друга. [Инструкция Claude](CLAUDE-CODE.md).

This is a preview release because the Claude integration has not yet been tested in the user's actual Claude app. The export passes the upstream parser and stylesheet guard for all 99 themes; browser rendering, image decoding, button interaction and wallpaper cleanup have been checked. Codex unit tests: 47 passed. SHA256SUMS.txt accompanies the downloads. Archive names label their target application; the application is not digitally signed.

The build scripts package the local 2.6.11 catalog snapshot. The source tree may still contain earlier catalog entries; the downloadable Codex archive contains the complete 99-theme snapshot. No personal theme-library folders, local theme-source pointers, pet creation runs or credentials are included.

To reproduce the Claude compatibility checks, check out the [upstream mod](https://github.com/0toshigami/claude-desktop-themes) at the revision recorded in runtime/ascii/NOTICE.md into output/claude-desktop-themes-upstream. Run the Electron exporter, then `node tests/claude-export.cjs` and the Electron rendering check `tests/claude-render.cjs`.
