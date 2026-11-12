module.exports = `
/* Keep theme artwork fully visible, including narrow layouts. */
html.codex-theme-studio .main-surface:not(.main-surface .main-surface)::before,
html.codex-theme-studio .main-surface:not(.main-surface .main-surface)::after {
 opacity:1 !important;
 mask-image:none !important;
 -webkit-mask-image:none !important;
}
/* Shared readability rules; remain active when decorative effects are off. */
html.codex-theme-studio [data-local-conversation-final-assistant] [data-markdown-text-style],
html.codex-theme-studio :is([data-message-author-role="assistant"],[data-turn="assistant"],[data-testid^="assistant-message"]):not(:has([data-markdown-text-style])) {
  box-sizing: border-box;
  padding: 20px 24px !important;
  border-radius: 16px !important;
  background-size: 100% 100% !important;
}
html.codex-theme-studio .main-surface [data-markdown-text-style] pre {
  background: #252525 !important;
}
/* Code panels must not inherit accent-colored borders, rings or shadows. */
html.codex-theme-studio .main-surface pre,
html.codex-theme-studio .main-surface :is([data-code-block], .code-block),
html.codex-theme-studio .main-surface div:has(> pre):not([data-markdown-text-style]) {
  border-color: transparent !important;
  box-shadow: none !important;
  outline: none !important;
}
html.codex-theme-studio .main-surface pre code,
html.codex-theme-studio .main-surface pre code * {
  background: transparent !important;
  box-shadow: none !important;
}
@media (max-width: 600px) {
  html.codex-theme-studio [data-local-conversation-final-assistant] [data-markdown-text-style],
  html.codex-theme-studio :is([data-message-author-role="assistant"],[data-turn="assistant"],[data-testid^="assistant-message"]):not(:has([data-markdown-text-style])) {
    padding: 16px !important;
  }
}
`;
