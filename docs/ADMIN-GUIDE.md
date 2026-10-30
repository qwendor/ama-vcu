# AMA at VCU website: admin guide

How the board keeps the site current without touching code. Written for whoever holds the "website" job on the board; the one-time setup needs about 30 minutes from someone comfortable with Google accounts.

The site reads from four places, in this order of convenience:

| Source | What it controls | Who edits it |
|---|---|---|
| Google Sheet (`AMA website content`) | Events, points leaderboard, accomplishments, gallery albums, opportunities, alumni, MoT consultants and clients, newsletter archive, settings like dues and application links | Any board member with the sheet link |
| Google Calendar (the chapter calendar) | Upcoming events, automatically | Whoever runs the calendar |
| Google Drive folders | Photos for each gallery album | Social Media Chair |
| `js/data.js` in the code | Everything else: page copy, bios, board headshots, FAQ, blog posts | One person, through GitHub's web editor |

Nothing is required. Anything left blank keeps what is built into the site.

## One-time setup

### 1. The Google Sheet

1. Open `docs/AMA-website-content-template.xlsx` (also at https://amavcu.pages.dev/docs/AMA-website-content-template.xlsx). Upload it to the chapter Google Drive and open it with Google Sheets (File > Save as Google Sheets).
2. Share it: Share > General access > **Anyone with the link: Viewer**. Give board editors edit access by email.
3. Copy the id from the URL: `https://docs.google.com/spreadsheets/d/`**THIS-PART**`/edit`.
4. In `js/data.js`, set `integrations.sheetId: "THIS-PART"`.

The README tab inside the sheet explains every column. Keep the header rows exactly as they are. Delete the example rows once real ones exist.

### 2. A Google API key (for Calendar sync and Drive albums)

1. Go to https://console.cloud.google.com, create a project called `AMA at VCU website`.
2. APIs & Services > Library: enable **Google Calendar API** and **Google Drive API**.
3. APIs & Services > Credentials > Create credentials > **API key**.
4. Edit the key: Application restrictions > Websites > add `https://amavcu.pages.dev/*` and `https://qwendor.github.io/*` (and the custom domain when there is one). API restrictions > restrict to Calendar and Drive.
5. In `js/data.js`, set `integrations.googleApiKey`.

The key only reads public calendars and public folders, so it is safe to have in the page.

### 3. Google Calendar sync

1. Open Google Calendar > the chapter calendar > Settings and sharing.
2. Access permissions: tick **Make available to public** (See all event details).
3. Copy the **Calendar ID** (ends in `@group.calendar.google.com`) into `integrations.calendarId`.

From then on every calendar event shows on the site within about ten minutes. Tips:

- The event title is the headline. The description is the blurb.
- Put a tag in the description to colour-code it: `#coffee`, `#speaker`, `#pro`, `#social`, `#competition`, `#service`, `#meeting`, `#deadline`.
- Paste the RamsConnect event link in the description and the site's "Register on RamsConnect" button goes straight to it.
- Rooms and addresses stay hidden on upcoming events (people get them on RamsConnect). To show them, set `show_locations` to `yes` in the Settings tab of the sheet.
- Events typed into the Events tab of the sheet work the same way and can carry a flyer image and point value. The two lists merge; duplicates (same date and title) are shown once.

### 4. Website forms (accomplishment submissions, idea box, feedback)

With this step the three forms on the site write straight into the Google Sheet and email the chapter. Without it, they open the visitor's email app with everything pre-filled.

1. In the Google Sheet: Extensions > **Apps Script**. Delete the sample code and paste the script at the bottom of this guide. Save.
2. Deploy > New deployment > type **Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy, approve the permissions, copy the web app URL.
3. In `js/data.js`, set `integrations.formEndpoint` to that URL.

Submissions land in the `Accomplishments`, `Ideas` and `Feedback` tabs (the script creates the last two). An accomplishment only appears on the site once someone types `yes` in its `approved` cell.

### 5. Hosting and code edits

The site is a static folder of files deployed from the GitHub repository `qwendor/ama-vcu` to Cloudflare Pages (https://amavcu.pages.dev) and GitHub Pages (https://qwendor.github.io/ama-vcu/).

- For text, bios, headshots and anything in `js/data.js`: edit the file on GitHub in the browser (open the file, pencil icon, commit). GitHub Pages updates by itself in a minute or two. Cloudflare Pages updates when Cooper runs `python tools/publish.py`, or automatically once the Pages project is connected to the repository (Cloudflare dashboard > Pages > amavcu > Settings > Builds > connect to GitHub). Connecting it is the recommended final step so nobody depends on one laptop.
- Board headshots go in `assets/img/board/<slug>.webp` (portrait, about 1200 px tall). The advisor's goes in `assets/img/board/advisor.webp` and `org.advisor.photo` points at it.
- A campus b-roll video: upload the mp4 somewhere public (Drive does not stream well; YouTube does not work as a background; Cloudflare R2 or the repo itself under 20 MB are fine) and set `hero_video` in the sheet's Settings tab.

## Everyday updates (no code)

| Task | Where |
|---|---|
| Add or change an event | Google Calendar, or a row in the Events tab |
| Update points | Leaderboard tab: name and points. Set `leaderboard_updated` in Settings |
| Approve a member's accomplishment | Accomplishments tab: type `yes` in the approved column |
| Add a gallery album | Make a Drive folder for the event, share it as Anyone with the link, drop the photos in, add a row to the Albums tab with the folder link. Or list photo links one per row in the Photos tab |
| Change the album cover | `cover` column: a Drive share link of the photo |
| Add MoT consultants, leadership, clients | Consultants, Concentrations and Clients tabs |
| Add alumni stories | Alumni tab |
| Newsletter archive | Newsletter tab: month, date, link |
| Dues, application links, MoT status, TikTok, alumni group, recruitment video | Settings tab |

Changes show within ten minutes. To see them immediately, open the site with `?cms=fresh` added to the address, or do a hard refresh.

## Checking things

- `https://amavcu.pages.dev/?cms=0` shows the site with every integration switched off (what is built in).
- `?debug=1` prints what was loaded from each source in the browser console.
- `?now=2027-04-01` previews the site as if it were another day (events sort and expire by date).
- `?fx=0` turns off motion for screenshots.

## Apps Script (paste into the sheet's Apps Script editor)

```javascript
const NOTIFY = 'amavcuchapter@gmail.com';
const TABS = {
  accomplishment: ['Accomplishments', ['name', 'what', 'where', 'when', 'category', '', 'email', 'feature']],
  idea: ['Ideas', ['title', 'why', 'name']],
  feedback: ['Feedback', ['type', 'text', 'name']]
};

function doPost(e) {
  const p = e.parameter || {};
  const def = TABS[p.form] || TABS.feedback;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(def[0]);
  if (!sheet) {
    sheet = ss.insertSheet(def[0]);
    sheet.appendRow(def[1].map(h => h || 'approved').concat(['submitted']));
  }
  const row = def[1].map(k => (k ? String(p[k] || '') : '')).concat([new Date()]);
  sheet.appendRow(row);
  MailApp.sendEmail(NOTIFY, 'Website ' + (p.form || 'form') + ': ' + (p.what || p.title || p.type || ''),
    Object.keys(p).map(k => k + ': ' + p[k]).join('\n') + '\n\nRow added to the ' + def[0] + ' tab.');
  return ContentService.createTextOutput('ok');
}

function doGet() { return ContentService.createTextOutput('AMA at VCU form endpoint'); }
```

The `accomplishment` row leaves the `approved` cell blank so nothing posts until the board says so.
