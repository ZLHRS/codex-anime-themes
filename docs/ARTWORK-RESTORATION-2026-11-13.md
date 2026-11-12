# Portrait restoration

Created with the built-in image generator. Original assets are retained.

Updated assets: `themes/<id>/assets/portrait-complete.webp` for
`azure-morpho`, `reze-night-bloom`, `zero-two-rose`, `shinobu-wisteria`,
and `blue-cat-nocturne`. WebP encoding preserves the generated alpha channel.

Restoration prompt: restore clipped hair crowns and accessories, extending the
canvas only as necessary. Preserve the exact pose, facial expression, anatomy,
outfit, colors and art style; no redesign or additional clothing. Retain the
lower crop and use crisp opaque character edges without side fading.

Specific details: Azure Morpho retains the butterfly on the finger; Reze retains
the peace sign and smile; Zero Two retains the horns, headband and chin resting
on her gloved hand; Shinobu retains the butterfly accessory and manga linework.
Blue Cat Nocturne removes the room from the portrait layer while preserving
the finger-at-lips pose; its existing room backdrop remains in the theme.

All 60 themes disable portrait opacity and edge masks, including mobile layouts.
Zero Two's separate overlay gradient was removed. The same rule is shared by
the runtime and embedded in theme CSS for compatibility with older Studio builds.
