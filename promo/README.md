# Maps 64 promo set

Ads for Instagram/Facebook and Google Ads, rendered from the game's own pixel map, helicopter
sprite, font and chip synth (`ad.html`), so they look and sound like the game.

```bash
cd promo
npm install
npm run render            # everything into output/
npm run render -- gif     # only files whose name contains "gif" (or meta, mp4, png, 300x250, …)
```

Then open `/promo/gallery.html` from a local server at the repo root to review everything, e.g.
`python3 -m http.server 8064` and http://localhost:8064/promo/gallery.html.
Ad text for each platform is in `COPY.md`.

| Folder | What | Notes |
|---|---|---|
| `output/meta/` | 1080×1920 Reels/Stories, 1080×1350 and 1080×1080 feed: MP4 (10 s, with sound) + PNG | Stories text stays clear of the top 13 % |
| `output/google/banners/` | Animated GIFs: 300×250, 336×280, 300×600, 160×600, 728×90, 970×250, 320×50, 320×100 | Each under 150 KB, at most 28 s of animation |
| `output/google/responsive/` | 1200×628, 1200×1200, 960×1200 images without text, plus 1200×1200 and 1200×300 logos | For responsive display ads |
| `output/google/video/` | 1920×1080 MP4 + thumbnail | YouTube / Demand Gen |

Needs Google Chrome installed (`CHROME=/path/to/chrome` to override). `ffmpeg` and `gifsicle` come
from npm; their install scripts are approved in `package.json` (`allowScripts`).
`output/` is not committed; re-render it any time.

To change the story (target city, start point, timing, texts), edit `ad.html`: `CITIES`, `START`,
`TARGET`, the `S.T` timings in `setup()` and the `videoText` / `bannerText` layouts.
