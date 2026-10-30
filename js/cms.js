/* =====================================================================
   AMA at VCU  |  no-code content (Google Sheet, Google Calendar, Drive)
   Reads window.AMA.integrations. Everything is optional: with nothing
   configured the site shows js/data.js unchanged. See docs/ADMIN-GUIDE.md.

   ?cms=0     skip every integration
   ?cms=fresh ignore the ten-minute cache
   ?cms=mock  read the sample CSVs in tools/cms-sample/ (local testing)
   ===================================================================== */
window.AMA_CMS = (() => {
  const D = window.AMA;
  const C = Object.assign({ sheetId: '', googleApiKey: '', calendarId: '', formEndpoint: '', showLocations: false, cacheMinutes: 10 }, D.integrations || {});
  const qs = new URLSearchParams(location.search);
  const MODE = qs.get('cms') || '';
  const log = (...a) => { if (qs.get('debug')) console.log('[cms]', ...a); };

  /* ---------- helpers ---------- */
  const clean = s => String(s == null ? '' : s).trim();
  const key = s => clean(s).toLowerCase().replace(/[^a-z0-9]+/g, '');
  const yes = s => /^(y|yes|true|1|x|approved|ok)$/i.test(clean(s));
  const slugify = s => clean(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const pad = n => String(n).padStart(2, '0');

  /* Dates: accepts 2026-10-16, 10/16/2026, 10/16/26, "Oct 16, 2026", Date(2026,9,16) */
  function toISO(v) {
    v = clean(v); if (!v) return '';
    let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return `${m[1]}-${pad(m[2])}-${pad(m[3])}`;
    m = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/); if (m) { let y = +m[3]; if (y < 100) y += 2000; return `${y}-${pad(m[1])}-${pad(m[2])}`; }
    m = v.match(/^Date\((\d+),(\d+),(\d+)/); if (m) return `${m[1]}-${pad(+m[2] + 1)}-${pad(m[3])}`;
    const d = new Date(v); if (!isNaN(d)) return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    return '';
  }
  /* Images: a full URL, a Drive share link, a bare Drive file id, or a site path */
  function img(v) {
    v = clean(v); if (!v) return '';
    let m = v.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/);
    if (m) return `https://drive.google.com/thumbnail?id=${m[1]}&sz=w1600`;
    if (/^[\w-]{25,}$/.test(v) && !v.includes('/') && !v.includes('.')) return `https://drive.google.com/thumbnail?id=${v}&sz=w1600`;
    return v;
  }
  function folderId(v) {
    v = clean(v); if (!v) return '';
    const m = v.match(/folders\/([\w-]{20,})/); if (m) return m[1];
    return /^[\w-]{20,}$/.test(v) ? v : '';
  }

  /* CSV -> array of objects keyed by normalised header */
  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell.length || row.length) { row.push(cell); rows.push(row); }
    const header = (rows.shift() || []).map(key);
    return rows.filter(r => r.some(v => clean(v))).map(r => { const o = {}; header.forEach((h, i) => { if (h) o[h] = clean(r[i]); }); return o; });
  }
  /* several accepted column names per field */
  const pick = (o, ...names) => { for (const n of names) { const v = o[key(n)]; if (v != null && v !== '') return v; } return ''; };

  /* ---------- fetch with a short cache ---------- */
  const cacheKey = u => 'ama-cms:' + u;
  async function getText(url) {
    const ttl = (C.cacheMinutes || 0) * 60e3;
    if (MODE !== 'fresh') try { const hit = JSON.parse(sessionStorage.getItem(cacheKey(url)) || 'null'); if (hit && Date.now() - hit.t < ttl) return hit.v; } catch (e) { }
    const ctrl = new AbortController(); const timer = setTimeout(() => ctrl.abort(), 9000);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error(r.status);
      const v = await r.text();
      try { sessionStorage.setItem(cacheKey(url), JSON.stringify({ t: Date.now(), v })); } catch (e) { }
      return v;
    } finally { clearTimeout(timer); }
  }
  function tabUrl(tab) {
    if (MODE === 'mock') return `tools/cms-sample/${tab.toLowerCase()}.csv`;
    return `https://docs.google.com/spreadsheets/d/${C.sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`;
  }
  async function tab(name) {
    try {
      const t = await getText(tabUrl(name));
      if (/^\s*</.test(t)) throw new Error('html');          // sign-in page or missing tab
      const rows = parseCSV(t); log(name, rows.length, 'rows'); return rows;
    } catch (e) { log(name, 'skipped', e.message); return null; }
  }

  /* ---------- appliers: each returns true when it changed window.AMA ---------- */
  function applySettings(rows) {
    if (!rows || !rows.length) return false;
    const S = {}; rows.forEach(r => { const k = key(pick(r, 'key', 'setting', 'name')); if (k) S[k] = pick(r, 'value'); });
    const set = (k, fn) => { if (S[k] != null && S[k] !== '') { fn(S[k]); return true; } return false; };
    let ch = false;
    ch = set('dues', v => D.membership.dues = +v || D.membership.dues) || ch;
    ch = set('duesmax', v => D.membership.duesMax = +v || 0) || ch;
    ch = set('activepoints', v => D.membership.activePoints = +v || D.membership.activePoints) || ch;
    ch = set('leaderboardupdated', v => D.leaderboard.updated = toISO(v) || D.leaderboard.updated) || ch;
    ch = set('motstatus', v => D.agency.status = v) || ch;
    ch = set('motapplication', v => D.links.motApplication = v) || ch;
    ch = set('boardapplication', v => D.links.boardApplication = v) || ch;
    ch = set('iccapplication', v => D.links.iccApplication = v) || ch;
    ch = set('alumnilinkedin', v => D.links.alumniLinkedIn = v) || ch;
    ch = set('donate', v => D.links.donate = v) || ch;
    ch = set('tiktok', v => D.links.tiktok = v) || ch;
    ch = set('videoyoutube', v => D.video.youtube = v) || ch;
    ch = set('herovideo', v => D.hero.video = v) || ch;
    ch = set('newslettercurrenturl', v => D.newsletter.current.url = v) || ch;
    ch = set('showlocations', v => C.showLocations = yes(v)) || ch;
    return ch;
  }
  function applyEvents(rows) {
    if (!rows || !rows.length) return false;
    const evs = rows.map((r, i) => {
      const date = toISO(pick(r, 'date', 'start'));
      const tba = yes(pick(r, 'tba')) || !date;
      const e = {
        id: pick(r, 'id') || 'sheet-' + i, date, end: toISO(pick(r, 'end', 'enddate')), tba,
        title: pick(r, 'title', 'event', 'name'), time: pick(r, 'time'), type: key(pick(r, 'type', 'category')) || 'event',
        series: pick(r, 'series'), place: pick(r, 'place', 'location', 'where'), blurb: pick(r, 'blurb', 'description', 'details'),
        img: img(pick(r, 'image', 'img', 'flyer', 'photo')), points: +pick(r, 'points') || 0, rsvp: pick(r, 'rsvp', 'register', 'link')
      };
      if (!D.eventTypes[e.type]) e.type = 'event';
      return e;
    }).filter(e => e.title);
    if (!evs.length) return false;
    /* sheet rows replace the built-in list, but ICC and other built-ins with the same date+title are kept once */
    const seen = new Set(evs.map(e => e.date + '|' + e.title.toLowerCase()));
    D.events = evs.concat(D.events.filter(e => !seen.has(e.date + '|' + e.title.toLowerCase()) && (e.id === 'icc27' || e.tba)));
    return true;
  }
  function applyLeaderboard(rows) {
    if (!rows || !rows.length) return false;
    const ms = rows.map(r => ({ name: pick(r, 'name', 'member'), pts: +pick(r, 'points', 'pts', 'total') || 0 })).filter(m => m.name);
    if (!ms.length) return false;
    D.leaderboard.members = ms; D.leaderboard.demo = false; return true;
  }
  function applyAccomplishments(rows) {
    if (!rows || !rows.length) return false;
    const has = rows.some(r => key(pick(r, 'approved', 'show', 'status')) !== '');
    const acc = rows.filter(r => !has || yes(pick(r, 'approved', 'show', 'status'))).map(r => {
      let cat = key(pick(r, 'category', 'cat', 'type'));
      if (!D.accomplishmentCats[cat]) cat = /intern/.test(cat) ? 'internship' : /job|offer/.test(cat) ? 'job' : /award|place|win/.test(cat) ? 'award' : 'other';
      return { cat, who: pick(r, 'name', 'who', 'member'), what: pick(r, 'accomplishment', 'what', 'title'), where: pick(r, 'where', 'company', 'organization'), when: pick(r, 'when', 'date') };
    }).filter(a => a.who && a.what);
    if (!acc.length) return false;
    D.accomplishments = acc.concat(D.accomplishments.filter(a => a.placeholder)); return true;
  }
  function applyAlbums(rows) {
    if (!rows || !rows.length) return false;
    const al = rows.map(r => { const name = pick(r, 'album', 'name', 'title'); return { slug: slugify(pick(r, 'slug') || name), name, date: toISO(pick(r, 'date')), cover: img(pick(r, 'cover', 'coverimage')), folder: folderId(pick(r, 'folder', 'drivefolder', 'drive')), blurb: pick(r, 'description', 'blurb', 'caption'), fromSheet: true }; }).filter(a => a.name);
    if (!al.length) return false;
    const names = new Set(al.map(a => a.name.toLowerCase()));
    D.albums = al.concat(D.albums.filter(a => !names.has(a.name.toLowerCase()))); return true;
  }
  function applyPhotos(rows) {
    if (!rows || !rows.length) return false;
    const ph = rows.map(r => ({ album: pick(r, 'album'), src: img(pick(r, 'image', 'photo', 'url', 'link')), cap: pick(r, 'caption', 'cap') })).filter(p => p.album && p.src);
    if (!ph.length) return false;
    D.gallery = D.gallery.concat(ph); return true;
  }
  function applyOpportunities(rows) {
    if (!rows || !rows.length) return false;
    const op = rows.map(r => { let cat = key(pick(r, 'category', 'cat')); if (!D.opportunityCats[cat]) cat = /intern/.test(cat) ? 'internships' : /career|job/.test(cat) ? 'career' : 'development'; return { cat, title: pick(r, 'title', 'name'), d: pick(r, 'description', 'blurb'), url: pick(r, 'url', 'link') }; }).filter(o => o.title);
    if (!op.length) return false;
    D.opportunities = op; return true;
  }
  function applyAlumni(rows) {
    if (!rows || !rows.length) return false;
    const st = rows.map(r => ({ name: pick(r, 'name'), year: pick(r, 'class', 'year', 'graduated'), now: pick(r, 'now', 'role', 'title'), story: pick(r, 'story', 'quote', 'description'), url: pick(r, 'linkedin', 'url'), photo: img(pick(r, 'photo', 'headshot')) })).filter(a => a.name);
    if (!st.length) return false;
    D.alumni.stories = st; return true;
  }
  function applyConsultants(rows) {
    if (!rows || !rows.length) return false;
    const all = rows.map(r => ({ name: pick(r, 'name'), title: pick(r, 'role', 'title'), expertise: pick(r, 'expertise', 'specialty', 'areas'), photo: img(pick(r, 'headshot', 'photo', 'image')), linktree: pick(r, 'linktree', 'link', 'url'), bio: pick(r, 'bio', 'description', 'blurb'), lead: yes(pick(r, 'leadership', 'lead')) })).filter(c => c.name);
    if (!all.length) return false;
    const leads = all.filter(c => c.lead), cons = all.filter(c => !c.lead);
    if (leads.length) D.agency.leadership = leads;
    D.agency.consultants = cons; return true;
  }
  function applyClients(rows) {
    if (!rows || !rows.length) return false;
    const cl = rows.map(r => ({ name: pick(r, 'name', 'client', 'organization'), kind: /partner/i.test(pick(r, 'kind', 'type')) ? 'partner' : 'client', url: pick(r, 'url', 'link'), note: pick(r, 'note', 'project', 'description') })).filter(c => c.name);
    if (!cl.length) return false;
    D.agency.clients = cl.filter(c => c.kind === 'client'); D.agency.partners = cl.filter(c => c.kind === 'partner'); return true;
  }
  function applyNewsletter(rows) {
    if (!rows || !rows.length) return false;
    const ar = rows.map(r => ({ month: pick(r, 'month', 'issue', 'title'), date: toISO(pick(r, 'date')), url: pick(r, 'url', 'link') })).filter(a => a.month);
    if (!ar.length) return false;
    ar.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    D.newsletter.archive = ar; return true;
  }
  function applyConcentrations(rows) {
    if (!rows || !rows.length) return false;
    const c = rows.map(r => ({ t: pick(r, 'concentration', 'service', 'name', 'title'), d: pick(r, 'description', 'blurb') })).filter(x => x.t);
    if (!c.length) return false;
    D.agency.concentrations = c; return true;
  }

  /* ---------- Google Calendar ---------- */
  const TZ = 'America/New_York';
  function fmtTime(d) { return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: TZ }); }
  function localISO(d) { const p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); return p; }
  async function loadCalendar() {
    if (!C.calendarId || !C.googleApiKey) return false;
    const t0 = new Date(Date.now() - 45 * 864e5).toISOString(), t1 = new Date(Date.now() + 400 * 864e5).toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(C.calendarId)}/events?key=${encodeURIComponent(C.googleApiKey)}&singleEvents=true&orderBy=startTime&maxResults=250&timeMin=${t0}&timeMax=${t1}`;
    let data;
    try { data = JSON.parse(await getText(url)); } catch (e) { log('calendar skipped', e.message); return false; }
    const items = data.items || [];
    const have = new Set(D.events.map(e => e.date + '|' + e.title.toLowerCase().slice(0, 14)));
    const evs = [];
    items.forEach(it => {
      if (!it.summary || it.status === 'cancelled') return;
      const allDay = !!(it.start && it.start.date);
      const s = new Date(allDay ? it.start.date + 'T12:00:00' : it.start.dateTime);
      const e = it.end ? new Date(allDay ? it.end.date + 'T12:00:00' : it.end.dateTime) : null;
      const date = allDay ? it.start.date : localISO(s);
      let end = '';
      if (e) { const ed = allDay ? localISO(new Date(e.getTime() - 864e5)) : localISO(e); if (ed > date) end = ed; }
      const desc = String(it.description || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
      const tag = (desc.match(/#(coffee|speaker|pro|social|competition|service|gbm|meeting|deadline|conference)/i) || [])[1];
      const type = tag ? (tag.toLowerCase() === 'meeting' ? 'gbm' : tag.toLowerCase()) : /coffee/i.test(it.summary) ? 'coffee' : /speaker/i.test(it.summary) ? 'speaker' : 'event';
      const link = (desc.match(/https?:\/\/\S*ramsconnect[^\s)]*/i) || desc.match(/https?:\/\/\S+/) || [''])[0];
      const k = date + '|' + it.summary.toLowerCase().slice(0, 14);
      if (have.has(k)) return;
      evs.push({ id: 'gcal-' + it.id, date, end, title: it.summary, time: allDay ? '' : fmtTime(s) + (e ? ' to ' + fmtTime(e) : ''), type, place: it.location || '', blurb: desc.replace(/#\w+/g, '').replace(/https?:\/\/\S+/g, '').replace(/\s+/g, ' ').trim().slice(0, 240), rsvp: link, img: '' });
    });
    if (!evs.length) return false;
    D.events = D.events.concat(evs); log('calendar', evs.length, 'events'); return true;
  }

  /* ---------- Google Drive album photos (on demand) ---------- */
  const driveCache = {};
  async function albumPhotos(album) {
    if (!album || !album.folder || !C.googleApiKey) return null;
    if (driveCache[album.folder]) return driveCache[album.folder];
    const q = encodeURIComponent(`'${album.folder}' in parents and trashed = false and mimeType contains 'image/'`);
    const url = `https://www.googleapis.com/drive/v3/files?q=${q}&key=${encodeURIComponent(C.googleApiKey)}&fields=files(id,name,imageMediaMetadata(width,height))&orderBy=name&pageSize=200`;
    try {
      const data = JSON.parse(await getText(url));
      const ph = (data.files || []).map(f => ({ album: album.name, src: `https://drive.google.com/thumbnail?id=${f.id}&sz=w1600`, thumb: `https://drive.google.com/thumbnail?id=${f.id}&sz=w600`, cap: f.name.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' '), w: (f.imageMediaMetadata || {}).width, h: (f.imageMediaMetadata || {}).height }));
      driveCache[album.folder] = ph; return ph;
    } catch (e) { log('drive skipped', e.message); return null; }
  }

  /* ---------- forms (Google Apps Script) ---------- */
  async function submit(form, fields) {
    if (!C.formEndpoint) return false;
    const fd = new FormData(); fd.append('form', form); fd.append('page', location.href);
    Object.entries(fields).forEach(([k, v]) => fd.append(k, v == null ? '' : v));
    await fetch(C.formEndpoint, { method: 'POST', mode: 'no-cors', body: fd });   // opaque response: no error means delivered
    return true;
  }

  /* ---------- main ---------- */
  let promise = null;
  function load() {
    if (promise) return promise;
    promise = (async () => {
      if (MODE === '0') return { changed: false };
      let changed = false;
      if (C.sheetId || MODE === 'mock') {
        const names = ['Settings', 'Events', 'Leaderboard', 'Accomplishments', 'Albums', 'Photos', 'Opportunities', 'Alumni', 'Consultants', 'Concentrations', 'Clients', 'Newsletter'];
        const res = await Promise.all(names.map(tab));
        const [settings, events, lb, acc, albums, photos, opp, alumni, cons, conc, clients, news] = res;
        changed = applySettings(settings) | applyEvents(events) | applyLeaderboard(lb) | applyAccomplishments(acc) | applyAlbums(albums) | applyPhotos(photos) | applyOpportunities(opp) | applyAlumni(alumni) | applyConsultants(cons) | applyConcentrations(conc) | applyClients(clients) | applyNewsletter(news) || changed;
      }
      changed = (await loadCalendar()) || changed;
      D.cmsLoaded = true;
      return { changed: !!changed };
    })().catch(e => { log('load failed', e); return { changed: false }; });
    return promise;
  }

  return { load, albumPhotos, submit, config: C, parseCSV, toISO, img };
})();
