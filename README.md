# AMA at VCU website

Website for the American Marketing Association at Virginia Commonwealth University (@amavcu).
Static site (one `index.html`, two stylesheets, four scripts, no build step) plus a small backend on Cloudflare Pages Functions that powers the board's editor at `/admin`.
The board updates events, newsletters, points, photos, people and text in the editor: see `docs/ADMIN-GUIDE.md`. `docs/BOARD-HANDOFF.md` lists what changed and what the board still needs to supply.

## Run it

- Double-click `index.html` to open it from the folder (static site only), or
- serve the folder: `python -m http.server 4305` then open http://localhost:4305 (static site only), or
- `python tools/dev_admin.py` (launch config `ama-admin`) for the site WITH the editor and backend on http://127.0.0.1:4306 and http://127.0.0.1:4306/admin, using a local KV store. The local setup code is in `.dev.vars`.

Handy URLs:

- `?now=2026-11-01` previews the site as if it were another day (events sort and expire by date).
- `?fx=0` turns off motion (screenshots, projectors, reduced motion).

## Edit the content

Everything the site shows lives in `js/data.js`. Open it in any text editor.

| What | Where in `data.js` |
|---|---|
| Name, tagline, intro blurb, email, faculty advisor | `org` |
| Optional Google Sheet / Calendar / Drive hookup (off by default) | `integrations` |
| Instagram, Linktree, GroupMe, RamsConnect, forms, calendar, application links | `links` |
| Home background: campus photos with credits, or an mp4 in `hero.video` | `hero` |
| Recruitment video (any link: YouTube, Vimeo, Drive play on the page; Instagram/TikTok open in a tab; or an uploaded mp4) | `video` |
| About page timeline on/off | `showTimeline` |
| Social impact video block on the home page (heading, text, link or upload, poster, caption, on/off) | `impact` |
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
- What the board saves in `/admin` is merged over this file at load time (`js/cms.js`, `applySaved`). `?cms=0` turns that off, `?preview=1` is the editor's live preview frame, `?debug=1` logs what loaded.
- Once the board saves in the editor, the live site shows the saved content; edits to `js/data.js` only matter for anything the editor does not cover (and as the starting point when nothing is saved).

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
- `docs/` the admin guide, the board handoff and the (optional) Google Sheet template
- `admin/`, `js/admin.js`, `css/admin.css` the editor; `functions/` + `src/lib.js` the Cloudflare Pages Functions behind it (login, content, uploads, inbox, content injection); `wrangler.toml` binds the KV namespace `AMA_SITE`

## Deploy

The site is live in two places:

- https://www.vcuama.site (the chapter's domain, Namecheap CNAME to the Cloudflare Pages project; bare vcuama.site forwards to www) and https://amavcu.pages.dev (the same Cloudflare Pages project)
- https://qwendor.github.io/ama-vcu/ (GitHub Pages, repo `qwendor/ama-vcu`)

To publish a change: commit it, then run `python tools/publish.py`. That pushes to GitHub (Pages rebuilds in about a minute) and deploys the committed files to Cloudflare Pages in the layout the Functions need (site in `public/`, `functions/` and `src/` beside it). Only files tracked by git go online; `assets/raw/`, `tools/`, the setup code and `.dev.vars` stay on the PC. Deploys never touch the content, uploads or password saved through the editor (they live in KV). The editor only works on the Cloudflare host; the GitHub mirror reads the saved content from it.

While the site is a concept preview it carries a `noindex` meta tag, a `robots.txt` that blocks crawlers, and a footer line saying it is not yet official. Remove those three when AMA makes it official.
