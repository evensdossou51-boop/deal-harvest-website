# Voice Search Widget

This adds a small voice-search avatar that listens for a search phrase and opens an eBay results page using your existing EPN Smart Links.

## Files
- `index.html`: Adds two containers with ids `ai-avatar` and `ai-results` and loads `voice-search.js`.
- `styles.css`: Styles under the "VOICE SEARCH WIDGET" section.
- `voice-search.js`: All logic for speech recognition, TTS prompts, fallback text input, analytics hooks, and safety.

## How it works
- Click the avatar (or press Enter/Space when focused) to start listening. If the browser doesn’t support SpeechRecognition, a text input fallback appears.
- After you speak, it builds a standard eBay search URL. EPN Smart Links (already loaded in `index.html`) will auto-monetize the link.
- A consent tooltip appears the first time the avatar is focused/hovered.
- After 3 consecutive recognition errors, the avatar is disabled. Call `resetVoiceAvatarFailures()` in the console to re-enable.

## Analytics
We emit `voice_avatar_start`, `voice_avatar_query`, `voice_avatar_result_click`, and `voice_avatar_error` via `gtag` if available.

## Configure
No secrets are required. Ensure your EPN Smart Links script loads, and replace the site logo path in `.ai-avatar` if desired.

## Troubleshooting
- If the avatar looks disabled, microphone permissions may be blocked or repeated errors occurred. Fix permissions and run `resetVoiceAvatarFailures()`.
- Safari doesn’t support SpeechRecognition; users will see the text fallback.
