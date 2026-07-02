# Podcast Module — Web ↔ Mobile Parity

Gap analysis between [`PODCAST_FLOW_WEB.md`](./PODCAST_FLOW_WEB.md) and
[`PODCAST_FLOW_MOBILE.md`](./PODCAST_FLOW_MOBILE.md). Scope: the Podcast
module only (list, detail, create/edit, config, JSON import).

Every `Platform.OS` branch in `expo/modules/feed/` and `expo/modules/podcast/`
was checked; the two gaps below are the only behavioral differences. Nothing
else in the Podcast module (browsing, pagination, create/edit forms, config,
text/image/quote/gallery/link blocks) differs between platforms.

## Gap table

| Feature | Web | Mobile | Gap |
| --- | --- | --- | --- |
| Browse episodes, pagination | ✅ Full | ✅ Full | None |
| Compose an episode (any block type) | ✅ Full | ✅ Full | None |
| Podcast settings (episodes per page) | ✅ Full | ✅ Full | None |
| `text` / `image` / `quote` / `gallery` / `link` blocks | ✅ Full | ✅ Full | None |
| `video` block playback | ✅ Inline `<video>` player | ❌ Inert placeholder (icon + raw URL, not tappable) | **High** — content is unreachable on mobile |
| `embed` block (YouTube/Vimeo) playback | ✅ Live `<iframe>` | ❌ Inert placeholder (icon + raw id, not tappable) | **High** — content is unreachable on mobile |
| `spotify` block playback | ✅ Live embedded player | ⚠️ Tappable card, opens Spotify app/browser via `Linking.openURL` | **Low** — degraded but usable |
| JSON bulk import | ✅ Full (file picker → preview → import) | ❌ Alert only, feature does not exist | **High** — no workaround on device |

Note: this table is about *rendering/interaction* parity given the same data.
It does not cover the separate storage-sync issue (posts live in per-device
`AsyncStorage`, so the same episode won't even be present on both platforms
unless someone manually recreates/imports it on each) — that's a different,
already-understood problem.

## Root causes

Both gaps stem from the same pattern: code that special-cases
`Platform.OS === 'web'` to reach for a browser-only API, with no native
fallback implemented alongside it.

1. **`modules/feed/components/BlockRenderer.tsx:33-113`** — `video`, `embed`,
   and `spotify` cases each check `Platform.OS === 'web'` to decide between a
   real HTML media element (`<video>`, `<iframe>`) and a placeholder `<View>`.
   The Spotify case additionally wraps its placeholder in a `Pressable` with
   `Linking.openURL` — nothing stops the same treatment being applied to
   `video`/`embed`.

2. **`modules/podcast/screens/PodcastImportScreen.tsx:22-27,85-93`** (and its
   twin `modules/feed/screens/FeedImportScreen.tsx`, byte-for-byte identical
   apart from i18n keys) — `handleSelectFile` short-circuits with an alert on
   non-web, and the `<input type="file">` is conditionally rendered only on
   web. Everything downstream of "get me the file's text content"
   (`parsePodcastJson`, `convertEpisodesToPosts`, `importPosts` in
   `core/services/feedImport.ts` / `core/contexts/PostsContext.tsx`) is
   platform-agnostic already — only the file-acquisition step is missing a
   native path.

## Proposed remediation (not implemented — for review)

### JSON import → add a native file picker

Add `expo-document-picker` (not currently a dependency) and branch
`handleSelectFile` on platform instead of dead-ending:

- Web: keep the existing hidden `<input type="file">` + `FileReader` path,
  unchanged.
- Native: call `DocumentPicker.getDocumentAsync({ type: 'application/json' })`,
  read the returned file URI with `expo-file-system`'s `readAsStringAsync`,
  and feed the resulting text into the same `parsePodcastJson` used today.
  Everything after "raw JSON string" — parsing, preview, `importPosts` — is
  reused as-is.

This is the lower-risk gap to close: one new dependency, one new branch in an
already-isolated function, no change to the shared parsing/import pipeline.

### Video / embed playback → decided approach

Two block types, two different fixes — chosen for what's actually the modern,
Expo-idiomatic solution for each, not a single WebView-everything approach.

**`video` (direct file URL) → `expo-video`.** `expo-av`'s `<Video>` component
is removed as of SDK 54, replaced by `expo-video`'s `VideoView` +
`useVideoPlayer` — the current official Expo package for native inline video
playback. This gives real playback (not a placeholder, not a tap-out) with no
WebView involved at all, and — being a numbered-SDK Expo package rather than a
third-party native module — works in Expo Go like the app's other `expo-*`
dependencies already do.

**`embed` (YouTube/Vimeo) and `spotify` → tap-to-open, extending the existing
Spotify pattern.** Correction to an earlier assumption: `react-native-webview`
does actually ship its native code inside Expo Go, so embedding a WebView
was never blocked by tooling. The reason to avoid it anyway is UX, not
tooling — a WebView-hosted YouTube/Vimeo iframe on mobile is a known-clunky
pattern (autoplay-policy quirks, awkward sizing in a scroll feed, no native
controls/PiP/casting), and it's not what modern content apps do. The current
convention — and what this app's `spotify` case already implements — is to
deep-link out to the native app: keep the placeholder `<View>`, wrap it in the
same `Pressable` + `Linking.openURL` treatment already used for `spotify`, and
open the YouTube/Vimeo watch URL. This is simultaneously the more modern
pattern *and* the cheaper build (no new dependency, extends code that already
exists in the same file).

**Net effect:** `video` gets genuine native parity with web via `expo-video`;
`embed` gets the same degrade-to-tap-out treatment `spotify` already has,
which is an intentional, permanent design choice rather than a stopgap.
