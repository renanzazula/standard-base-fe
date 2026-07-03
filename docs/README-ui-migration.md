# UI Redesign Migration — Design System & Podcast Screens

Directional brief for migrating the app to the new visual style. Adapt all
implementation details to the existing codebase patterns (theme structure,
component conventions, navigation). Do **not** change business logic, API
calls, navigation flows, or the edit/delete behavior — this is a
presentation-layer migration only.

The app already supports **Dark Mode and Light Mode** (user toggle in
Settings → Appearance). Every token below must exist in both variants, and
all components must consume tokens from the theme — never hardcoded hex
values in screens.

---

## 1. Design tokens (global — applies to the whole app)

Centralize these in the existing theme system. If the current theme doesn't
have this structure, refactor it so both modes share the same token names.

### Colors

| Token         | Dark                      | Light                     | Usage |
|---------------|---------------------------|---------------------------|-------|
| `background`  | `#0B0B0C`                 | `#FAFAF8`                 | Screen background |
| `surface`     | `#151517`                 | `#FFFFFF`                 | Cards, list items |
| `surfaceHigh` | `#1D1D20`                 | `#F2F2F0`                 | Elevated elements, inputs |
| `border`      | `rgba(255,255,255,0.07)`  | `rgba(0,0,0,0.08)`        | Card borders, dividers |
| `accent`      | `#F2A900`                 | `#D99400` (darker for contrast on light bg) | Brand gold: FAB, active tab, badges, links |
| `accentSoft`  | `rgba(242,169,0,0.14)`    | `rgba(217,148,0,0.12)`    | Active tab pill background |
| `text`        | `#F5F5F4`                 | `#1A1A1C`                 | Primary text |
| `textDim`     | `#9C9C9F`                 | `#6E6E72`                 | Secondary text (dates, metadata) |
| `textFaint`   | `#6B6B6E`                 | `#9A9A9E`                 | Captions, footnotes |
| `danger`      | `#FF6B6B`                 | `#D64545`                 | Delete actions |

Brand colors (same in both modes): Spotify `#1DB954`, YouTube `#FF0000`.

### Shape & spacing

- Single corner radius for cards: **18** (buttons/inputs: 14, badges/pills: 999)
- Cards: 1px `border` + `surface` background. No heavy shadows in dark mode;
  soft shadow allowed in light mode (`0 2px 12px rgba(0,0,0,0.06)`)
- Screen horizontal padding: 16–18

### Typography scale

- Screen title: 26 / weight 800 / letter-spacing -0.5
- Section/card title: 17–24 / weight 700–800
- Body: 14.5 / line-height 1.65
- Metadata: 13 / `textDim`, with small leading icons (calendar, clock)
- Caption / eyebrow: 11–12.5 / `textFaint`, eyebrows uppercase + letter-spacing 1

### Global components to restyle with tokens

- **Tab bar**: translucent background (blur if available), top hairline
  `border`, active tab = `accent` icon + label inside an `accentSoft` pill
- **Screen headers**: must use `background`/`surface` tokens — this also
  fixes the previously reported white-header inconsistencies in dark mode
  ("Create Post", "Podcast Configuration") and the unwanted divider line
- **FAB**: `accent` background, dark icon, soft accent-tinted shadow

> Applying tokens here means **every screen** in the app inherits the new
> look for backgrounds, text, borders, and accents. Screens keep their own
> layouts; only the podcast screens get layout changes (below).

---

## 2. Podcast list screen (layout redesign)

Reference: `podcast-redesign-mockup.jsx` (visual reference only — it's a
web mockup with simulated players; translate to React Native).

- Header: "Podcast" title (screen-title style) + episode count subtitle
- **Thumbnail-as-hero cards**: full-bleed episode image, bottom gradient
  scrim (`transparent → rgba(0,0,0,0.85)`), with overlaid on the scrim:
  - Gold `EP #N` pill badge
  - Episode title (white, 700)
  - Metadata row: date + duration with clock icon
  - Circular translucent play button, right-aligned
- In **light mode** the scrim stays dark (text sits on the image, so
  overlay colors don't switch with the theme)
- Card spacing 14, radius 18, 1px border
- Keep the existing FAB and its create-episode action

### Thumbnail auto-population

Derive the card image from the episode's YouTube URL instead of a manually
uploaded image:

```
videoId = extract from URL (v= param or youtu.be path, 11 chars)
thumb   = https://img.youtube.com/vi/{videoId}/maxresdefault.jpg
fallback: hqdefault.jpg (maxres is not available for all videos)
```

If the episode has a manually set image, prefer it; otherwise use the
derived thumbnail. If the backend stores episodes, consider deriving this
server-side on create/update so clients don't repeat the logic.

---

## 3. Podcast detail screen (layout redesign)

### Video hero (replaces the static header image)

- Header = YouTube thumbnail, full-bleed under the status bar area
- Floating over the image: circular blurred **back** button (top-left),
  circular **edit** (pencil) and **delete** (trash, `danger` color) icon
  buttons (top-right) — same handlers as the current Editar/Eliminar buttons
- Center: red circular play button; bottom-right idle tag "Assistir"
- **On tap**: swap the thumbnail in place for an inline player using
  `react-native-youtube-iframe` (WebView-based, works in managed Expo).
  Do not load the player until tapped (lazy). The mockup's progress
  bar/timer is simulated — the real player provides its own controls.

### Below the hero

- `EP #N` badge → title "GUEST NAME · Skateboard Podcast" (guest in `text`,
  suffix in `textDim`)
- Metadata row: calendar icon + publish date, clock icon + duration,
  Instagram icon in `accent` (keeps the existing Instagram link behavior)
- **Spotify section**: eyebrow label "OUVIR NO SPOTIFY", then the official
  Spotify embed rendered in a `WebView`:
  `https://open.spotify.com/embed/episode/{episodeId}` (height ~152).
  Extract `episodeId` from the stored Spotify URL. Remove the old
  "Episode on Spotify" / "Watch on YouTube" link buttons — the inline
  players replace them.
- Hairline divider (`border`)
- Description: body style; if longer than ~180 chars, collapse with a
  "Ver mais" / "Ver menos" toggle in `accent`
- Footer caption: "Gravado em {date}" in `textFaint`

---

## 4. Light/Dark behavior rules

- All screens read colors exclusively from the theme tokens; toggling the
  Appearance switch must restyle the entire app with no restart
- Exceptions that do NOT switch with theme: image scrims (always dark),
  brand colors (Spotify green, YouTube red), text overlaid on images
  (always white)
- Status bar style follows the theme (light-content on dark, dark-content
  on light)
- Audit for hardcoded colors across all screens while migrating; replace
  with tokens. Pay attention to screen header components (previous source
  of dark-mode bugs)

---

## 5. Acceptance checklist

- [ ] Theme exposes all tokens above in both dark and light variants
- [ ] No hardcoded colors remain in screen components
- [ ] Toggling Dark Mode restyles every screen correctly, including headers
- [ ] Podcast list shows hero cards with scrim overlay and derived thumbnails
- [ ] Detail screen: floating icon actions, inline YouTube player on tap,
      Spotify embed, description collapse
- [ ] Edit/delete, navigation, Instagram link, and API behavior unchanged
- [ ] Works on both emulator and physical device
