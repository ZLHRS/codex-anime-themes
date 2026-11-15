# Live ASCII wallpapers

Theme Studio includes the 12 original scenes from [0toshigami/claude-desktop-themes](https://github.com/0toshigami/claude-desktop-themes): Moonlit, Clawd, Cloud Drift, Honu Lagoon, Koi Pond, Jellyfish, Lantern Night, Fireflies, Neon Rain, Sakura Dusk, Snow Cabin and Star Voyage.

Open **Collections → Live ASCII wallpapers**, select a scene, then open Settings to adjust motion (smooth or cell by cell), speed, cell size and the backdrop behind the chat. Settings are saved per theme. Default values match the upstream project: cell-by-cell motion, 4× speed, 14 px cells and a 40% chat backdrop. Some scenes cap the cell size to preserve their composition.

Original scene artwork and motion functions are preserved. Theme Studio adapts the canvas to the ChatGPT main surface, leaving controls interactive. Composition responds to the available window size; Claude-specific tool-event reactions are not connected to ChatGPT. This does not install a Claude extension.

Only the selected scene is loaded. The drawing loop is capped at approximately 30 frames per second and stops while the window is unfocused, hidden, the scene is out of view, animations are disabled, or reduced motion is enabled. A static frame remains visible. Switching themes removes the canvas, timers and observers. High-DPI backing resolution is capped at 2×.

## Attribution and maintenance

Copyright (c) 2026 0toshigami. Original artwork, helpers and drawing code are used under the MIT license, included in `runtime/ascii/LICENSE`. The pinned source revision is recorded in `runtime/ascii/NOTICE.md`. Scene files are copied unchanged; Theme Studio's lifecycle and settings adapter is separate.

To reproduce the import from a reviewed upstream checkout, run `node scripts/import-ascii-wallpapers.cjs <checkout>`. The script reads scene definitions and palettes; it does not execute the upstream installer or modify Claude.

Validation: `node --test tests/ascii.test.cjs`, `electron tests/ascii-ui.cjs`, and `electron tests/ascii-settings-ui.cjs`.
