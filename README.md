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

## Folders

- `assets/img/board/` portraits cropped from the September 2026 board intro post
- `assets/img/gallery/` event photos (Marketing Week, interest meeting, Donuts with the Dean)
- `assets/img/flyers/` event artwork from Instagram
- `assets/raw/` originals (not needed by the site)
- `tools/` the Python helpers used to cut portraits and resize photos

## Deploy

Any static host works (GitHub Pages, Cloudflare Pages, Netlify). Upload the folder as is. Hash routing (`#/events`) means no server configuration is needed.
