# AMA at VCU website revision: what was done and what we need from the board

Revision date: October 29, 2026. Live preview: https://amavcu.pages.dev (still marked as a concept and hidden from search until the board approves it).

The revision checklist was worked through page by page. Below: what changed, the assumptions made where the checklist was open, and the exact list of things only the board can supply. Everything marked **placeholder** is visible on the site as a dashed "Coming soon" card or a "coming from the board" line, so nothing was invented.

## What changed, by page

**Homepage.** Logo redrawn so all three letters are the same height (the last "A" was too small). New campus photos: Engineering West Hall, the Engineering glass facade, Engineering East Hall, the Compass, Snead Hall and the VCU letters, all licensed Wikimedia Commons photos at higher resolution; a real campus video drops into the `hero_video` setting whenever the board has one. New intro and "What is AMA at VCU" blurb written for approval. Three pillars (Knowledge, Opportunity, Community) now sit inside the intro; the separate five-pillar section is gone. Dues show as $60. Upcoming events, Events this month, the ICC countdown, the ICC 2027 promo with Apply to Go and Learn More, the executive board row (now with the faculty advisor) and In Case You Missed It all stay. The bottom membership section and the quick-link grid are gone. The FAQ moved to the homepage. Facebook is gone from every social list.

**About.** Rewritten intro, purpose, numbers, how the chapter connects to AMA Richmond and AMA national, and the timeline. Five pillars, How Joining Works, the membership timeline and the advisor card are gone from this page (the advisor is on the Board page, joining steps are on Get Involved, leadership information is under Members > Leadership).

**Events.** Same calendar and list. Upcoming events now carry a "Register on RamsConnect" button and still hide the room until people register (switchable). New: Google Calendar sync and a Google Sheet tab, so events can be added by anyone on the board without code, Instagram post or not. Setup steps are in `docs/ADMIN-GUIDE.md`.

**Board.** Same cards. Each member now has a profile page (click the photo or name). LinkedIn buttons work: a real URL shows "LinkedIn", otherwise the button runs a LinkedIn search for the name and says "Find on LinkedIn". Faculty advisor card added with a headshot placeholder. "Want to be on this page next year?" stays and points at the board application link once the board provides it (today it emails the chapter). Katie Gilles: see assumptions.

**Marketers of Tomorrow.** Own tab between Board and ICC 2027. Apply button, how it works, roles, and placeholder sections for concentrations, consultants (headshot, name, role, expertise, Linktree), leadership (Heather Pham, CEO; Debalu) and past clients and partners. Everything fills from the sheet.

**ICC 2027.** Fundraising copy corrected: last conference was Chicago, this one is New Orleans, no "third time" line. "Fund the Trip" is now "Donate". Every Donate button on the site opens the same panel (Venmo, Cash App, sponsorship email); a single official giving link can replace that panel through one setting.

**Members.** Three subsections in the menu: Accomplishments (Members Doing Big Things, awards, internships, job offers, other wins, the points leaderboard, and an on-page Submit Yours form that writes to the board's sheet once the Apps Script is set up), Leadership (board roles, four paths into leadership, board application), Opportunities & Alumni (places to look with categories, alumni LinkedIn group placeholder, alumni stories placeholder, ways alumni can help, opportunities for alumni and members).

**Leaderboard.** Lives on the Accomplishments page. Fake faces are gone; each member shows a coloured monogram (initials). The Point System doc link and the RamsConnect link are removed. Points update from the Leaderboard tab of the sheet.

**Newsletter, Blog, Gallery.** Newsletter keeps the current issue, the archive and the RamsConnect join link, and takes per-issue links when the board has them. Blog keeps its layout and gains an optional Instagram link per post. Gallery is now one album per event with cover images; opening an album shows its photos. New albums come from a Google Drive folder the Social Media Chair fills, listed in the Albums tab of the sheet.

**Get Involved.** Unchanged in content: join steps and RamsConnect, idea drop box, feedback, surveys, donate, follow along.

**Navigation.** Home, About, Events, Board, Marketers of Tomorrow, ICC 2027, Members (3 items), News (Newsletter, Blog, Gallery), Get involved, Donate. Old links (`#/agency`, `#/leaderboard`) forward to the new pages.

## Assumptions to confirm

1. **Katie Gilles is Katie Gilstrap.** No Katie Gilles exists at VCU and RamsConnect lists Katie Gilstrap as faculty advisor, so one advisor card was built under that name. If Katie Gilles is a different person (a new board member), send her role, year, major and headshot and she gets a card like the others.
2. **Dues are $60** (confirmed October 29). Change it later through `dues` in the sheet's Settings tab.
3. **Newsletter, Blog and Gallery sit under a "News" menu** rather than three top-level tabs, to keep the menu to one row on laptops. Every page is still one click away and all are in the footer.
4. **The leaderboard lives on the Accomplishments page** (the checklist asked for three Members subsections and did not place it). It has its own anchor and footer link.
5. **Homepage blurb, tagline and the three pillar descriptions** are drafts for approval; edit them in `js/data.js` (`org.tagline`, `org.blurb`, `pillars`).
6. **TikTok** still links to the Linktree until the handle is public.
7. Debalu's last name and title were not in the notes; the card says "MoT leadership" until MoT confirms.

## What we need from the board

Photos and visual assets

- Advisor headshot (and bio) for Katie Gilstrap. Any updated board headshots.
- MoT consultant headshots; MoT leadership headshots (Heather Pham, Debalu). Heather's board photo is used in the meantime.
- Campus or Engineering b-roll video for the homepage (mp4, under 20 MB, 1080p is plenty). The licensed photos stay as the fallback.
- Event photos for new albums (a Drive folder per event).
- Updated AMA logo files if the chapter has an official vector version; the site's mark was redrawn from the chapter logo.

Written content

- Approval (or edits) of the homepage intro, tagline and pillar lines.
- Executive board bios, if wanted on the profile pages.
- Faculty advisor bio.
- MoT: consultant names, roles, specialties, Linktree links; areas of concentration and services; past clients; business partners; leadership titles and descriptions.
- Alumni stories and accomplishments (name, class year, where they are now, a line or two).
- Updated ICC fundraising copy if the draft on the page is not right.

Links and accounts

- Board application form URL and MoT application form URL (Settings tab or `js/data.js`).
- Alumni LinkedIn group URL.
- LinkedIn profile URLs for each board member.
- Access to the chapter Google Calendar (make it public, copy the Calendar ID) and a Google Cloud API key (steps in the admin guide).
- The Google Sheet: upload `docs/AMA-website-content-template.xlsx` to the chapter Drive and share the link.
- Current newsletter platform: web-view links for each issue, if they exist.
- A GitHub account for whoever will own text edits, and a decision on connecting Cloudflare Pages to the repository so edits deploy on their own.
- Social platforms to show (Instagram, TikTok, LinkedIn, Linktree, GroupMe today).

Decisions

- Keep the leaderboard monograms, or supply illustrated avatars.
- Where accomplishment submissions should live (the sheet, as built, or the existing Google Form embedded).
- Whether rooms should show on upcoming events (`show_locations` setting).
- When to make the site official: remove the concept-preview footer line, the `noindex` tag and `robots.txt`, and point a domain at it.

## Where things are

- Admin guide for the board: `docs/ADMIN-GUIDE.md`
- Sheet template: `docs/AMA-website-content-template.xlsx`
- Site content: `js/data.js`; integrations block at the top of that file
- Code: GitHub `qwendor/ama-vcu`; live at https://amavcu.pages.dev and https://qwendor.github.io/ama-vcu/
