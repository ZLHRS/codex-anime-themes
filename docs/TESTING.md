# Theme Studio validation

## Version 2.6.7

- 85 catalog themes compile with valid assets.
- English / Russian UI test passes: live switching, full English text coverage, language persistence after reload, search, compact layout and restoration of Russian.
- The language test no longer assumes a particular character is the first item in the filter.
- Existing automated tests cover theme selection, settings, launch recovery, IPv4/IPv6 loopback, native pet window isolation, local theme sources and update checksums.

## Commands

- npm test
- npm run test:integration
- npm run test:i18n-ui
- npx electron . --smoke-test

On headless Linux, prefix UI commands with xvfb-run -a. Tests use isolated settings and do not change the user's selected language.

## Scope

Windows application and theme behavior can be checked locally. macOS and Linux packages must be built and tested on their corresponding runners; actual ChatGPT connection there remains unverified.

## Local release results

- Unit tests: 41 passed.
- Real Chromium lifecycle integration: 2 passed, covering all 85 themes.
- English / Russian renderer test: passed.
- Packaged Windows gallery smoke test: includes search aliases, previews, shortcuts, launch and settings persistence.
