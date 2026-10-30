# AMA at VCU website

Website for the American Marketing Association at Virginia Commonwealth University (@amavcu).
Static site: one `index.html`, one stylesheet, three scripts. No build step, no framework.
The board updates events, points, photos and more through a Google Sheet, Google Calendar and Drive: see `docs/ADMIN-GUIDE.md`. `docs/BOARD-HANDOFF.md` lists what the board still needs to supply.

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
| Name, tagline, intro blurb, email, faculty advisor | `org` |
| Google Sheet id, API key, calendar id, form endpoint | `integrations` |
| Instagram, Linktree, GroupMe, RamsConnect, forms, calendar, application links | `links` |
| Home background: campus photos with credits, or an mp4 in `hero.video` | `hero` |
| Recruitment video (YouTube id, reel URL or mp4) | `video` |
| Idea box and feedback form embeds, survey list | `forms` |
| Dues, points, join steps | `membership` |
| The three pillars (name, icon, one line) | `pillars` |
| Executive board (name, role, year, major, goal, fun fact, LinkedIn, bio) | `board` |
| Leadership page (paths, application season) | `leadership` |
| Events (past and upcoming) | `events` |
| ICC dates, city, results by year | `icc` |
| Accomplishments wall, opportunities, alumni | `accomplishments`, `opportunities`, `alumni` |
| Leaderboard (sample data until the real import) | `leaderboard` |
| Marketers of Tomorrow (consultants, leadership, concentrations, clients) | `agency` |
| Newsletter: current issue and archive | `newsletter` |
| Blog posts | `posts` |
| Gallery albums and photos | `albums`, `gallery` |
| FAQ | `faq` |

Rules baked into the site:

- Upcoming events never show a room or address. People register on RamsConnect to see it. Past events can keep their location.
- An event with `tba: true` shows in the list with no date and no calendar entry.
- The ICC countdown uses `icc.start`. Change it when AMA announces the next conference.
- Board photos live in `assets/img/board/<slug>.webp` (portrait) and `<slug>-sq.webp` (square). The `slug` in `data.js` must match.
- Leave `linkedin: ""` and the site links a LinkedIn search for that name (the button says "Find on LinkedIn"). Paste the real profile URL when you have it.
- Every Donate button opens the same panel. Set `links.donate` to send them to one official giving page instead.
- Content from the Google Sheet is merged over this file at load time. `?cms=0` turns that off, `?cms=mock` reads `tools/cms-sample/*.csv` for local testing, `?debug=1` logs what loaded.

## Add photos

Drop web-sized images in `assets/img/gallery/` (and a smaller copy in `assets/img/gallery/t/`), then add a line to `gallery` in `data.js`.
`tools/build_assets.py` resizes everything in `assets/raw/ig/events/` for you if Python and Pillow are installed.

## The logo

The mark is the `#mark` SVG symbol in `index.html` (three stroke-drawn letters of equal height, white). The old 3D render pipeline (`tools/build_logo.py`, `js/logo.js`, `assets/logo/`) is kept for reference but nothing on the page uses it.

## Folders

- `assets/img/board/` portraits cropped from the September 2026 board intro post
- `assets/img/gallery/` event photos (Marketing Week, interest meeting, Donuts with the Dean)
- `assets/img/flyers/` event artwork from Instagram
- `assets/raw/` originals (not needed by the site)
- `tools/` the Python helpers used to cut portraits, resize photos, build the sheet template (`make_sheet_template.py`) and publish
- `docs/` the admin guide, the board handoff and the Google Sheet template

## Deploy

The site is live in two places:

- https://amavcu.pages.dev (Cloudflare Pages, the link to share)
- https://qwendor.github.io/ama-vcu/ (GitHub Pages, repo `qwendor/ama-vcu`)

To publish a change: commit it, then run `python tools/publish.py`. That pushes to GitHub (Pages rebuilds in about a minute) and deploys the committed files to Cloudflare Pages. Only files tracked by git go online; `assets/raw/` and `tools/` stay on the PC.

While the site is a concept preview it carries a `noindex` meta tag, a `robots.txt` that blocks crawlers, and a footer line saying it is not yet official. Remove those three when AMA makes it official.
