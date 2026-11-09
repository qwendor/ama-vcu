# AMA at VCU website: how the board updates it

Everything on the site can be changed from the editor at **https://www.vcuama.site/admin**. No code, no Claude, works on a laptop or a phone. There is also a small "Board login" link at the bottom of every page.

## Getting in

1. Go to https://www.vcuama.site/admin.
2. **First time only:** type the setup code Cooper gave the chapter, then choose the board password (10 characters or more). This is one shared password for the board; keep it in the board drive, not in a group chat.
3. After that, just type the password. A device stays signed in for 30 days.

Forgot the password? On the sign-in screen press "Forgot it, or first time here?" and use the setup code again to choose a new one. Changing the password signs every other device out.

## How the editor works

- **Left:** the parts of the site. **Middle:** the boxes you type in. **Right:** a live preview that updates as you type (switch it to phone size with the button above it).
- **Nothing goes public until you press Save** (top right). The note next to it tells you when changes are waiting. Ctrl+S saves too.
- The first time anyone opens the editor it is filled with what is on the site today. Change anything, press Save, and from then on the site shows what is saved here.
- **History** keeps the last 25 saves. Made a mess? Bring an older version back, then Save. You can also download a backup file.

## Common jobs

**Add an event.** Events, then "Add event". Title, date, time, type, a line of description, points if it earns any, and the RamsConnect link so the Register button goes straight to it. Upload the flyer if there is one. Past events stay on the Events page as recaps; edit or delete them the same way.

**Post the newsletter.** Newsletter, then "Add issue". Name it ("November 2026"), set the date, upload the PDF (or paste a link to the web version), add a two-line summary. The newest issue shows on the Newsletter page and in the home page link; older issues become the archive.

**Update points.** Points leaderboard. Either paste the names and points from your spreadsheet into the big box (one person per line) and the list fills itself, or edit the rows by hand: change a number, add a member, remove one, reorder. Set the "Last updated" date and press Save.

**Approve an accomplishment.** When a member submits one on the website it lands in **Inbox**. Press "Add to the site", check the wording, make sure "Show on the site" is on, Save. Ideas and feedback from the website land in the Inbox too.

**Add photos.** Gallery, then "Add album" (or open an album). Name it, set the date, press "Add photos" and pick as many as you like. They are resized for you, so phone photos are fine. The first photo is the cover unless you choose one.

**New board, new year.** Executive board: open each person, change the name, role, year, major, goal, fun fact, LinkedIn link, and upload the headshot (a portrait works best). Use the arrows to reorder. The same section has the faculty advisor.

**Marketers of Tomorrow.** Status line, application link, consultants (headshot, role, expertise, Linktree, bio), leadership, services, clients and partners.

**Blog.** Blog, then "Add post". Title, date, tag, one-line teaser, cover photo, the text (leave an empty line between paragraphs) and the Instagram link if there is one. The three newest posts also show on the home page.

**Change the home page photos.** Home page, "Background photos": add, remove or reorder the slideshow photos behind the headline (wide photos work best) and set how long each stays. The picture behind the recruitment video button is in the "What is AMA at VCU" box on the same page.

**Change any words on the site.** Every page has its own section (Home page, About page, ICC, Leadership, Opportunities & Alumni, Get Involved, Footer and donate panel), and list pages (Events, Board, Newsletter, Blog, Gallery, Accomplishments) have a "Words on this page" box at the top. Headlines, paragraphs, button labels, the three pillars, the ICC promo cards, the About cards and timeline, the join steps, the points lines, the ICC results and more are all plain text boxes. In a heading, put *stars* around the words that should show in gold.

**Links and settings.** The chapter email, short and full name, board year, founding year and address, every application, RamsConnect and social link, the donation links, the recruitment video, a homepage background video, whether rooms show on upcoming events, and the "Let Google list this site" switch (leave it off while the site is a preview; turning it on removes the search-engine block). **FAQ** has its own section.

**Menu and footer.** The words in the top menu, the dropdowns, the phone menu, the logo lockup and the footer columns (headings and links).

**Categories.** Event types and their colors, accomplishment kinds and opportunity categories. Renaming keeps existing items attached.

**Look.** The main dark color, the accent color, the light section background, the font pair, scroll animations on or off, and an uploaded logo in place of the built-in white mark.

**Small words.** Buttons, labels and messages that repeat across the site (Register, Find on LinkedIn, pts, Coming soon, the form messages), plus every form field label, placeholder and the feedback topic choices.

**Newsletter.** Besides uploading issues, the built-in issue (the one shown until the first upload) and the archive links are editable under "Words on this page".

## Good to know

- Photos are resized on upload; JPG and PNG work best. If an iPhone photo will not upload, export it as JPG first. One file can be up to 12 MB (a newsletter PDF, for example).
- Deleting something is undoable from History after you save.
- The site's main address is https://www.vcuama.site (the bare vcuama.site forwards there). https://amavcu.pages.dev is the same site under its original address, and https://qwendor.github.io/ama-vcu/ is a read-only mirror; the editor runs at www.vcuama.site/admin and amavcu.pages.dev/admin.
- Submissions from the website forms (accomplishments, ideas, feedback) go to the Inbox. If the board also wants them by email, Cooper can switch that on.

## For whoever maintains the code (Cooper)

- Code: GitHub `qwendor/ama-vcu`. Static site at the repo root, Cloudflare Pages Functions in `functions/` (login, saving, uploads, inbox, content injection), shared helpers in `src/lib.js`, editor in `admin/` + `js/admin.js` + `css/admin.css`. `wrangler.toml` binds the KV namespace `AMA_SITE` as `SITE`; the setup code is the Pages secret `SETUP_CODE`.
- Deploy: commit, then `python tools/publish.py`. It pushes to GitHub and deploys to Cloudflare in the layout the Functions need (site in `public/`, `functions/` and `src/` beside it). Deploys never touch saved content, uploads or the password, which live in KV.
- Local: `python tools/dev_admin.py` (launch config `ama-admin`, port 4306) runs the site with its backend on a local KV; the local setup code is in `.dev.vars`. `tools/dev_admin.py --build-only` just rebuilds `.dist/`.
- Content model: the editor saves one JSON document (`content` in KV). `functions/_middleware.js` injects it into `index.html` as `<script id="__content">`; `js/cms.js` merges it over `js/data.js` (`applySaved`). To add an editable field: one line in `SECTIONS` in `js/admin.js`, read the same key in `cms.js`.
- Test hooks: `?cms=0` (ignore saved content), `?preview=1` (editor preview frame), `?fx=0` (no motion), `?now=YYYY-MM-DD` (another day), `?debug=1`.
- Reset the setup code: `wrangler pages secret put SETUP_CODE --project-name amavcu` (reads the new code from stdin), then update `SETUP-CODE.txt`.

## Optional: Google Sheet instead of the editor

The site can also read a Google Sheet (events, points, accomplishments, albums, alumni, consultants, newsletter archive, settings), a public Google Calendar and Drive folders, through `integrations` at the top of `js/data.js`. The editor replaces the need for it, so this path is off by default; `tools/make_sheet_template.py` builds the sheet template if the board ever prefers a spreadsheet.
