# Maps 64 — Heli Flight · Handoff

A browser geography game inspired by the C64 title *Maps 64 Europe*. You fly a top-down helicopter over a scrolling pixel map and pass over the named city before your fuel runs out.

The game is **fully working** as-is. `site/` is a static website you can deploy right away. The rest of this document is for further development with Claude Code (hardening, PWA, iOS/Android packaging).

---

## 1. Publish to Netlify (no build step)

1. Drag the **`site/`** folder onto Netlify (Sites → "Deploy manually"), or connect a repo with *publish directory* = `site`, *build command* = empty.
2. That's it. `index.html` is the entry and `data/` must sit next to it.

Notes
- It must be served over http(s). Opening `index.html` straight from disk (`file://`) blocks the `data/*.json` fetches, so country maps would lose their region lines.
- It needs internet access at runtime for these CDN files, all pinned:
  - d3 7.9.0 and topojson-client 3.1.0 (unpkg, with SRI hashes)
  - world-atlas 2.0.2 `countries-50m.json` (jsdelivr)
  - the Pixelify Sans font (Google Fonts)
- Progress (stars and best scores), the sound setting, the touch-pad setting and the map zoom are stored in `localStorage` under the keys `maps64.*`.

## 2. Files

```
site/
  index.html          the whole game: HTML + CSS + JS in one file (~60 KB)
  data/regions-XX.json  province/state/region lines per country (37 files, MultiLineString, lon/lat)
screenshots/          reference captures of every screen (desktop, 5× map)
  01-title · 02-where-to · 03-country-pick-continent · 04-country-list · 05-choose-level
  06-briefing · 07-countdown · 08-flying · 09-pause
```
`XX` is the country id used in the `COUNTRIES` array (nl, de, fr, gb, it, es, us, be, ie, pt, ch, at, pl, se, no, gr, jp, cn, in, tr, th, vn, kr, eg, ma, za, ng, ke, ca, mx, br, ar, cl, co, pe, au, nz).

## 3. How the code is organised (inside `index.html`)

| Section | What it does |
|---|---|
| `:root` CSS vars | All colours (see §6). The canvas reads them at runtime with `getComputedStyle`. |
| DATA | `CAP` (capital per country: name, lon, lat), `CONTINENTS` (id, bbox, member country names), `COUNTRIES` (id, continent, world-atlas feature name, cities; the first 7 cities count as "main"), `LEVELS` (5 difficulty configs) |
| AUDIO `Snd` | Web Audio synth: pulse waves (12.5 / 25 / 50 %), triangle bass, a noise drum, an original 8-bar title tune (150 bpm, look-ahead scheduler), a rotor loop (filtered noise chopped by an LFO), plus sound effects |
| MAP `getMap()` | Renders a region into a pixel-block canvas: d3-geo projection → alpha masks (region land / other land / national borders / region lines) → a palette pass with coast edges and sea-wave marks. Results are cached per view, border setting, mode and zoom. |
| STATE / menus | A state machine: `boot → title → scope → (ccont) → region → level → brief → count → play ⇄ reveal → over`, plus `pause`. Menus use `renderMenu()` with keyboard, mouse and touch. |
| GAME | `buildPool()` picks the targets, `nextRound()` sets the fuel from distance, `hitTarget()`, `finish()` gives stars and unlocks levels |
| HELICOPTER | A 15×22 pixel sprite, pre-rotated into 32 headings (nearest-neighbour), plus a drop shadow, animated rotor blades and a turn rate limit |
| LOOP | `update()` handles input, wind, the camera dead-zone follow and the timers. `draw()` draws the map viewport, dots, the level-1 edge arrow, the helicopter, the mini-map and the city label. |

Constants: the logical screen is `W=400, H=250` pixels, scaled up with `image-rendering: pixelated`. `BLK=2` is the map pixel-block size. `ZOOM` (3/5/8, default 5) is how many screens the map is. Other values: `MAXV=95` px/s, `HIT_R=10` px, `ROUNDS=8`.

## 4. Game rules

- **Modes:** Country (continent → country → its cities), Continent (its capitals), World (all capitals).
- **Flying:** arrows or A/S (left/right) and W/Z (up/down). Space/Enter confirms in menus, P or Esc pauses, M turns sound on or off. On touch devices there is an on-screen D-pad and FIRE button.
- **Scoring:** fly over the target (within 10 px) to score 100 + up to 100 time bonus. The next target appears immediately.
- **Fuel:** `clamp(distance / MAXV × tf + tb, 10, 120)` seconds, shown as 20 blocks that switch off one at a time. The blocks turn yellow at 5 or fewer.
- **Time up:** the helicopter auto-flies to the target and shows its name, then the next round starts.
- **Stars:** found 8/8 = 3 stars, ≥7 = 2, ≥5 = 1. One star unlocks the next level.

| Level | Targets | Dots | Arrow | Borders/regions | Wind (×30 px/s) | tf / tb |
|---|---|---|---|---|---|---|
| 1 CADET | main | yes | yes | yes | 0 | 2.4 / 10 |
| 2 PILOT | main | yes | – | yes | 0 | 2.0 / 8 |
| 3 NAVIGATOR | all | yes | – | yes | .3 | 1.9 / 7 |
| 4 CAPTAIN | main | – | – | yes | .35 | 1.9 / 8 |
| 5 ACE | all | – | – | hidden | .6 | 1.6 / 6 |

On levels with dots, passing over a wrong city shows its name. Capital mode shows "capital of X" on levels 1–4.

## 5. Suggested next steps for Claude Code

1. **Split and harden:** move the code into modules (Vite or plain ES modules): `data/`, `audio.js`, `map.js`, `game.js`, `ui.js`. Move `COUNTRIES` and `CAP` into JSON.
2. **Vendor the dependencies:** copy d3 (only `d3-geo` is needed), topojson-client, `countries-50m.json` and the font into the project, so the game works offline and inside app wrappers.
3. **PWA:** add a manifest, icons and a service worker that caches everything. The game then installs on phones and plays offline.
4. **iOS / Android:** wrap the static site with **Capacitor** (`npx cap add ios` / `android`). Lock the app to landscape, or keep the portrait layout, which already puts the pad under the screen. Audio unlocks on first touch (already handled with `Snd.init()` on input).
5. **Performance:** at `ZOOM=8`, big countries build maps of about 1600×1000 blocks. Consider building them in a Web Worker or OffscreenCanvas, or caching rendered maps in IndexedDB.
6. **Content QA:** city coordinates were entered by hand, so spot-check them against a gazetteer (e.g. GeoNames). Add more countries by adding a `COUNTRIES` entry and a `data/regions-XX.json` file (the generation recipe is in §7).
7. **Accessibility and controls:** add gamepad support (Gamepad API), key remapping (for AZERTY/QWERTZ) and a colour-blind-safe palette option.

## 6. Design tokens

**Colours**

| Token | Hex | Used for |
|---|---|---|
| `--bg` | `#0d1510` | page/UI ground |
| `--bg2` | `#15241a` | page glow |
| `--line` | `#2b4630` | UI rules/borders |
| `--frame` | `#2c4e30` | monitor bezel |
| `--frame2` | `#18301d` | monitor bezel |
| `--text` | `#e3eed6` | UI text |
| `--muted` | `#93a88a` | UI text |
| `--faint` | `#62775b` | UI text |
| `--acc` | `#9ad26a` | accent |
| `--acc-2` | `#c4ec9b` | accent |
| `--acc-deep` | `#35602a` | accent |
| `--gold` | `#f0dc5a` | stars, low fuel, target reveal |
| `--sea` | `#1e3a6c` | map sea |
| `--sea-hi` | `#2c5395` | map sea waves |
| `--land` | `#4e8c34` | region land |
| `--coast` | `#8acb5a` | region coast |
| `--border` | `#2f5d22` | national borders |
| `--region` | `#37702a` | province lines |
| `--out` | `#46523f` | land outside the region |
| `--out-coast` | `#5e6b57` | land outside the region |
| `--out-border` | `#394335` | land outside the region |
| `--city` | `#f0dc5a` | city dot |
| `--city-edge` | `#14210e` | city dot outline |
| `--heli` | `#cf5a3e` | helicopter |
| `--heli-edge` | `#1b120d` | helicopter |
| `--glass` | `#86c9da` | helicopter |
| `--skid` | `#34342e` | helicopter |
| `--rotor` | `#dcdccb` | helicopter |

**Type:** Pixelify Sans 400/500 everywhere. Sizes scale with the game screen via container units (`cqw`) with `clamp()` minimums.

**Radii:** 4px (screen and menu items), 6px (top-bar controls), 8px (touch buttons), 14px (bezel).

## 7. Data sources and licences (keep the credits)

- **Country shapes:** Natural Earth via `world-atlas` 2.0.2 (public domain).
- **Region lines:** geoBoundaries gbOpen ADM1 (ADM2 for GB, IT and BE) under per-country open licences (CC BY 4.0, OGL v3, Etalab 2.0, DL-DE-BY 2.0, CC0, public domain). A credit is shown on the country briefing screen.
  - How the files were made: download the `simplifiedGeometryGeoJSON` from `https://www.geoboundaries.org/api/current/gbOpen/{ISO3}/{ADM}/`, served from media.githubusercontent.com.
  - Keep only the rings near the country's cities, drop tiny islands, and simplify each ring with Douglas-Peucker (tolerance = bbox width / 3000).
  - Round coordinates to 4 decimals and save as a MultiLineString.
- **Font:** Pixelify Sans (SIL OFL).
- **Music and sound effects:** original, synthesised live in the browser.
- **Inspiration:** *Maps 64 Europe* (C64). No original assets are used.
