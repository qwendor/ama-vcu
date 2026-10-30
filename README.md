# AMA at VCU website

Website for the American Marketing Association at Virginia Commonwealth University (@amavcu).
Static site: one `index.html`, one stylesheet, two scripts. No build step, no framework.

## Run it

- Double-click `index.html` to open it from the folder, or
- serve the folder: `python -m http.server 4305` then open http://localhost:4305

Handy URLs:

- `?now=2026-11-01` previews the site as if it were another day (events sort and expire by date).
- `?fx=0` turns off motion (screenshots, projectors, reduced motion).

## Edit the content

Everything the site shows lives in `js/data.js`. Open it in any text editor.

| What | Where in `data.js` |
|---|---|
| Name, tagline, email, advisor | `org` |
| Instagram, Linktree, GroupMe, RamsConnect, forms, calendar | `links` |
| Home background: campus photos with credits, or an mp4 in `hero.video` | `hero` |
| Recruitment video (YouTube id, reel URL or mp4) | `video` |
| Idea box and feedback form embeds, survey list | `forms` |
| Dues, points, join steps | `membership` |
| The five pillars (name, photo, text) | `pillars` |
| Executive board (name, role, year, major, goal, fun fact, LinkedIn) | `board` |
| Events (past and upcoming) | `events` |
| ICC dates, city, results by year | `icc` |
| Accomplishments wall and opportunities | `accomplishments`, `opportunities` |
| Leaderboard (sample data until the real import) | `leaderboard` |
| Marketers of Tomorrow | `agency` |
| Newsletter: current issue and archive | `newsletter` |
| Blog posts | `posts` |
| Gallery photos and captions | `gallery` |
| FAQ | `faq` |

Rules baked into the site:

- Upcoming events never show a room or address. People register on RamsConnect to see it. Past events can keep their location.
- An event with `tba: true` shows in the list with no date and no calendar entry.
- The ICC countdown uses `icc.start`. Change it when AMA announces the next conference.
- Board photos live in `assets/img/board/<slug>.webp` (portrait) and `<slug>-sq.webp` (square). The `slug` in `data.js` must match.
- Leave `linkedin: ""` and the site links a LinkedIn search for that name. Paste the real profile URL when you have it.

## Add photos

Drop web-sized images in `assets/img/gallery/` (and a smaller copy in `assets/img/gallery/t/`), then add a line to `gallery` in `data.js`.
`tools/build_assets.py` resizes everything in `assets/raw/ig/events/` for you if Python and Pillow are installed.

## The 3D logo

The spinning logo in the hero is `assets/logo/ama-logo-stacked.mp4`: colour on the top half, alpha matte on the bottom half, recomposited by `js/logo.js` with WebGL so it works in Safari too (Safari cannot play transparent WebM).

The source is the transparent PNG sequence in `assets/raw/logo-png/frames/` (480 RGBA frames, 60 fps, 8 s, loops 0479 back to 0000). To rebuild after a new export, unzip the new sequence over that folder and run:

```
python tools/build_logo.py
```

It checks the frames against `manifest.json`, packs colour and alpha, encodes the MP4 and writes the transparent stills used in the header, footer and newsletter card. If only a black-background video is available, extract its frames to `assets/raw/logo/frames/` with `ffmpeg -i logo.webm -fps_mode passthrough assets/raw/logo/frames/f_%04d.png` and the script estimates the alpha instead.

## Folders

- `assets/img/board/` portraits cropped from the September 2026 board intro post
- `assets/img/gallery/` event photos (Marketing Week, interest meeting, Donuts with the Dean)
- `assets/img/flyers/` event artwork from Instagram
- `assets/raw/` originals (not needed by the site)
- `tools/` the Python helpers used to cut portraits and resize photos

## Deploy

The site is live in two places:

- https://amavcu.pages.dev (Cloudflare Pages, the link to share)
- https://qwendor.github.io/ama-vcu/ (GitHub Pages, repo `qwendor/ama-vcu`)

To publish a change: commit it, then run `python tools/publish.py`. That pushes to GitHub (Pages rebuilds in about a minute) and deploys the committed files to Cloudflare Pages. Only files tracked by git go online; `assets/raw/` and `tools/` stay on the PC.

While the site is a concept preview it carries a `noindex` meta tag, a `robots.txt` that blocks crawlers, and a footer line saying it is not yet official. Remove those three when AMA makes it official.
