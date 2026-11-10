/* =====================================================================
   AMA at VCU  |  app
   Hash-routed single page site. Content comes from js/data.js, overridden by
   what the board saves in /admin (js/cms.js merges it before the first paint).
   Page writing lives in D.copy; *stars* in a title mark the gold words.
   ?now=YYYY-MM-DD previews the site on another day. ?fx=0 disables motion.
   ===================================================================== */
(() => {
  const D = window.AMA;
  const CMS = window.AMA_CMS;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const qs = new URLSearchParams(location.search);
  const NOFX = qs.get('fx') === '0';
  const reduce = NOFX || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (NOFX) document.documentElement.classList.add('no-fx');

  /* ---------- time ---------- */
  const NOW = qs.get('now') ? new Date(qs.get('now') + 'T12:00:00') : new Date();
  const T0 = Date.now();
  const nowMs = () => NOW.getTime() + (Date.now() - T0);
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const TODAY = iso(NOW);
  const pd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const fmt = (s, o) => pd(s).toLocaleDateString('en-US', o || { weekday: 'short', month: 'short', day: 'numeric' });
  const fmtLong = s => pd(s).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MON3 = MON.map(m => m.slice(0, 3));
  const daysUntil = isoDate => Math.max(0, Math.ceil((pd(isoDate) - pd(TODAY)) / 864e5));

  /* ---------- tiny view helpers ---------- */
  const ico = (id, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="#${id}"/></svg>`;
  const MARK_VB = '0 0 348 100';
  const logoSrc = () => srcOf(D.look && D.look.logo);
  const markSvg = (cls = '', label = 'American Marketing Association') => logoSrc() ? `<img class="${cls} logo-img" src="${logoSrc()}" alt="${label}">` : `<svg class="${cls}" viewBox="${MARK_VB}" role="img" aria-label="${label}"><use href="#mark"/></svg>`;
  const U = () => D.copy.ui;
  const FM = () => D.copy.forms;
  const shortRole = r => r.replace(/^Director of /, '').replace(/ of Events & Operations$/, '').replace(/^Community Outreach$/, 'Outreach');
  const ext = (href, label, cls = 'btn btn-gold') => `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${label} ${ico('i-ext')}</a>`;
  const route = (href, label, cls = 'btn btn-navy') => `<a class="${cls}" href="${href}">${label} ${ico('i-arrow')}</a>`;
  const mailBtn = (subject, label, cls = 'btn btn-ghost btn-sm', to = D.org.email) => `<a class="${cls}" href="mailto:${to}?subject=${encodeURIComponent(subject)}">${ico('i-mail')} ${esc(label)}</a>`;
  /* titles: *word* -> gold em */
  const title = s => esc(s).replace(/\*([^*]+)\*/g, '<em class="serif gold">$1</em>');
  const tpl = (s, vars) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : '');
  const pageHead = (eyebrow, t, lede, extra = '') => `
    <section class="page-head">
      <div class="wrap">
        <p class="eyebrow">${esc(eyebrow)}</p>
        <h1 class="h-lg">${title(t)}</h1>
        ${lede ? `<p class="lede">${esc(lede)}</p>` : ''}
        ${extra}
      </div>
    </section>`;
  const placeholder = (t, text, cta = '') => `<div class="card placeholder-card"><span class="chip">${esc(U().comingSoon)}</span><h3 class="h-sm" style="margin-top:8px">${esc(t)}</h3><p class="muted" style="margin:0">${esc(text)}</p>${cta ? `<div class="btn-row" style="margin-top:12px">${cta}</div>` : ''}</div>`;
  const duesLabel = () => D.membership.duesMax && D.membership.duesMax !== D.membership.dues ? `$${D.membership.dues}–${D.membership.duesMax}` : `$${D.membership.dues}`;
  const duesWords = () => D.membership.duesMax && D.membership.duesMax !== D.membership.dues ? `$${D.membership.dues} to $${D.membership.duesMax}` : `$${D.membership.dues}`;
  const motApply = () => D.links.motApplication || D.agency.applyUrl;
  const motMail = () => D.agency.email || D.org.email;
  const srcOf = v => typeof v === 'string' ? v : (v && v.src) || '';
  const photoOf = m => srcOf(m.photo) || `assets/img/board/${m.slug}.webp`;
  const photoSmOf = m => m.photoSm || photoOf(m);
  const newsletterMonth = () => (D.newsletter.issues && D.newsletter.issues[0] && D.newsletter.issues[0].month) || D.newsletter.current.month;
  const galleryFull = g => g.src || `assets/img/gallery/${g.f}.webp`;
  const galleryThumb = g => g.thumb || g.src || `assets/img/gallery/t/${g.f}.webp`;

  /* initials monogram: the leaderboard and any person without a photo */
  const PALETTE = ['#1B2B4E', '#2D4475', '#C78E08', '#3C6E71', '#7B4B94', '#B23A48', '#2F6B3A', '#8A5A2B'];
  function monogram(name, cls = '') {
    const parts = String(name || '?').trim().split(/\s+/);
    const ini = (parts[0][0] || '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '');
    let h = 0; for (const c of name || '') h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const bg = PALETTE[h % PALETTE.length];
    return `<svg class="monogram ${cls}" viewBox="0 0 80 80" role="img" aria-label="${esc(name)}"><circle cx="40" cy="40" r="40" fill="${bg}"/><text x="40" y="47" text-anchor="middle" font-family="Montserrat, Inter, sans-serif" font-weight="700" font-size="${ini.length > 1 ? 26 : 32}" fill="#fff" letter-spacing="1">${esc(ini.toUpperCase())}</text></svg>`;
  }
  const photoOr = (src, name, cls = '') => src ? `<img class="${cls}" src="${src}" alt="${esc(name)}" loading="lazy">` : monogram(name, cls);

  /* ---------- events ---------- */
  const EV = () => D.events;
  const showLoc = () => !!(CMS && CMS.config.showLocations);
  const isFuture = e => !e.tba && e.date >= TODAY;
  const upcoming = () => EV().filter(isFuture).sort((a, b) => a.date.localeCompare(b.date));
  const past = () => EV().filter(e => !e.tba && e.date && e.date < TODAY).sort((a, b) => b.date.localeCompare(a.date));
  const tba = () => EV().filter(e => e.tba);
  const typeOf = e => D.eventTypes[e.type] || D.eventTypes.event;

  function dateTile(e) {
    if (e.tba) return `<span class="ev-date"><b>?</b><span>TBA</span></span>`;
    const d = pd(e.date);
    return `<span class="ev-date"><b>${d.getDate()}</b><span>${MON3[d.getMonth()]}</span></span>`;
  }
  function evMeta(e) {
    const fut = isFuture(e) || e.tba;
    const t = typeOf(e);
    const bits = [];
    if (!e.tba) bits.push(`<span>${ico('i-cal')}${fmt(e.date, { weekday: 'long', month: 'long', day: 'numeric' })}${e.end ? ' to ' + fmt(e.end, { month: 'long', day: 'numeric' }) : ''}</span>`);
    if (e.time) bits.push(`<span>${ico('i-clock')}${esc(e.time)}</span>`);
    if ((!fut || showLoc()) && e.place) bits.push(`<span>${ico('i-pin')}${esc(e.place)}</span>`);
    bits.push(`<span class="chip dot" style="--chip:${t.color}">${esc(t.label)}</span>`);
    if (e.points) bits.push(`<span class="chip">+${e.points} pts</span>`);
    return `<div class="ev-meta">${bits.join('')}</div>`;
  }
  function evCTA(e) {
    if (!(isFuture(e) || e.tba)) return '';
    if (e.cta) return ext(e.cta.url, esc(e.cta.label), 'btn btn-gold btn-sm');
    if (e.tba) return `<div class="btn-row"><span class="locked">${ico('i-clock')} ${esc(U().dateTba)}</span>${ext(D.links.instagram, esc(U().follow), 'btn btn-gold btn-sm')}</div>`;
    const reg = ext(e.rsvp || D.links.ramsconnectEvents, esc(U().register), 'btn btn-gold btn-sm');
    return showLoc() ? `<div class="btn-row">${reg}</div>` : `<div class="btn-row"><span class="locked">${ico('i-lock')} ${esc(U().locationLocked)}</span>${reg}</div>`;
  }
  function evItem(e) {
    return `<article class="ev-item ${isFuture(e) ? '' : 'past'}">
      ${dateTile(e)}
      <div>
        <h3 class="h-sm">${esc(e.title)}${e.series ? ` <span class="chip" style="margin-left:6px">${esc(e.series)}</span>` : ''}</h3>
        ${evMeta(e)}
        ${e.blurb ? `<p style="margin:8px 0 10px">${esc(e.blurb)}</p>` : ''}
        ${evCTA(e)}
      </div>
      ${e.img ? `<div class="ev-art"><img src="${srcOf(e.img)}" alt="" loading="lazy"></div>` : ''}
    </article>`;
  }

  /* ---------- components ---------- */
  const li = m => m.linkedin ? { href: m.linkedin, label: esc(U().linkedin) } : { href: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(m.name + ' VCU')}`, label: esc(U().findLinkedin) };
  function boardCard(m, i) {
    const l = li(m);
    return `<article class="member reveal d${(i % 3) + 1}">
      <a class="frame" href="#/board/${m.slug}"><img src="${photoOf(m)}" alt="${esc(m.name)}" loading="lazy"></a>
      <div class="member-body">
        <h3><a href="#/board/${m.slug}">${esc(m.name)}</a></h3>
        <div class="member-role"><span class="role">${esc(m.role)}</span><a class="li-btn" href="${l.href}" target="_blank" rel="noopener">${ico('i-in')} ${l.label}</a></div>
        <div class="member-info">
          <div><b>${esc(U().yearMajor)}</b> ${esc(m.year)}, ${esc(m.major)}</div>
          <div><b>${esc(U().careerGoal)}</b> ${esc(m.goal)}</div>
          <div><b>${esc(U().funFact)}</b> ${esc(m.fun)}</div>
        </div>
        <a class="textlink small-link" href="#/board/${m.slug}">${esc(U().profile)} ${ico('i-arrow')}</a>
      </div>
    </article>`;
  }
  function advisorCard(cls = '') {
    const a = D.org.advisor, T = D.copy.board;
    return `<article class="member advisor ${cls}">
      <div class="frame ${a.photo ? '' : 'ph'}">${a.photo ? `<img src="${a.photo}" alt="${esc(a.name)}" loading="lazy">` : `<div class="ph-face">${monogram(a.name)}<span>${esc(T.headshotNote)}</span></div>`}</div>
      <div class="member-body">
        <h3>${esc(a.name)}</h3>
        <div class="member-role"><span class="role">${esc(a.title)}</span>${a.linkedin ? `<a class="li-btn" href="${a.linkedin}" target="_blank" rel="noopener">${ico('i-in')} LinkedIn</a>` : ''}</div>
        <div class="member-info">
          <div>${esc(a.role)}</div>
          ${a.bio ? `<div>${esc(a.bio)}</div>` : `<div class="muted">${esc(T.advisorBio)}</div>`}
        </div>
      </div>
    </article>`;
  }
  function boardTile(m) {
    return `<a href="#/board/${m.slug}" title="${esc(m.name)}, ${esc(m.role)}"><img src="${photoSmOf(m)}" alt="${esc(m.name)}" loading="lazy"><figcaption>${esc(m.name.split(' ')[0])}<small>${esc(shortRole(m.role))}</small></figcaption></a>`;
  }
  function advisorTile() {
    const a = D.org.advisor;
    return `<a href="#/board#advisor" title="${esc(a.name)}, ${esc(a.title)}">${a.photo ? `<img src="${a.photo}" alt="${esc(a.name)}" loading="lazy">` : `<div class="tile-ph">${monogram(a.name)}</div>`}<figcaption>${esc(a.name.split(' ')[0])}<small>${esc(a.title)}</small></figcaption></a>`;
  }
  function pillarsRow() {
    return `<div class="pillars-row">${D.pillars.map(p => `<div class="pillar"><span class="pillar-ico">${ico(p.icon || 'i-star')}</span><h3>${esc(p.name)}</h3><p>${esc(p.short)}</p></div>`).join('')}</div>`;
  }
  function countdown(target, cls = '') {
    return `<div class="countdown ${cls}" data-countdown="${target}">
      <div><b>0</b><span>days</span></div><div><b>0</b><span>hours</span></div><div><b>0</b><span>min</span></div><div><b>0</b><span>sec</span></div>
    </div>`;
  }
  function postCard(p, big = false) {
    return `<a class="post-card ${big ? 'big' : ''} reveal" href="#/blog/${p.slug}">
      <div class="pc-img"><img src="${big ? p.cover : (p.thumb || p.cover)}" alt="" loading="lazy"></div>
      <div class="pc-body">
        <div class="pc-meta"><span class="chip">${esc(p.tag)}</span><span>${fmt(p.date, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
        <h3>${esc(p.title)}</h3>
        <p class="muted" style="margin:0">${esc(p.dek)}</p>
      </div>
    </a>`;
  }
  function socialList() {
    const L = D.links;
    return [['i-ig', 'Instagram', L.instagram], ['i-tt', 'TikTok', L.tiktok], ['i-in', 'LinkedIn', L.linkedin], ['i-ext', 'Linktree', L.linktree], ['i-users', 'GroupMe', L.groupme]].filter(s => s[2]);
  }
  const socialRow = () => socialList().map(([i, t, h]) => `<a href="${h}" target="_blank" rel="noopener">${ico(i)}${t}</a>`).join('');
  function socialBig() {
    const L = D.links, T = D.copy.involved;
    const s = [['i-ig', 'Instagram', T.socialInstagram, L.instagram], ['i-users', 'GroupMe', T.socialGroupme, L.groupme], ['i-in', 'LinkedIn', T.socialLinkedin, L.linkedin], ['i-ext', 'RamsConnect', T.socialRamsconnect, L.ramsconnect]];
    return `<div class="social-big">${s.map(([i, t, d, h]) => `<a href="${h}" target="_blank" rel="noopener">${ico(i)}<b>${t}</b><span>${esc(d)}</span></a>`).join('')}</div>`;
  }
  function medal(place) {
    if (!(place > 0)) return `<span class="medal">${esc(U().honorable)}</span>`;
    return `<span class="medal ${place <= 3 ? 'm' + place : ''}">${place}${place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'}</span>`;
  }
  function photosOf(album) {
    if (album.photos && album.photos.length) return album.photos.map(p => ({ src: p.src, thumb: p.sm || p.src, cap: p.alt || '', w: p.w, h: p.h, album: album.name }));
    return D.gallery.filter(g => g.album === album.name);
  }
  function albumCover(a) {
    const T = D.copy.gallery;
    const ph = photosOf(a);
    const key = a.cover && D.gallery.find(g => g.f === a.cover);
    const src = key ? `assets/img/gallery/${key.f}.webp` : a.cover ? a.cover : ph.length ? galleryThumb(ph[0]) : '';
    const n = ph.length;
    return `<a class="album reveal" href="#/gallery/${a.slug}">
      <div class="album-img">${src ? `<img src="${src}" alt="" loading="lazy">` : `<div class="album-empty">${ico('i-ig')}</div>`}</div>
      <div class="album-body"><span class="chip">${a.date ? fmt(a.date, { month: 'short', year: 'numeric' }) : 'Album'}</span><h3>${esc(a.name)}</h3><p>${esc(a.blurb || '')}</p><span class="album-count">${n ? `${n} ${n === 1 ? 'photo' : esc(T.photosWord)}` : a.folder ? esc(U().photosOnDrive) : esc(T.comingSoon)} ${ico('i-arrow')}</span></div>
    </a>`;
  }
  function consultantCard(c) {
    return `<article class="person reveal">
      <div class="person-photo">${photoOr(srcOf(c.photo), c.name)}</div>
      <h3>${esc(c.name)}</h3>
      <span class="role">${esc(c.title || U().consultant)}</span>
      ${c.expertise ? `<p class="small"><b>${esc(U().expertise)}</b> ${esc(c.expertise)}</p>` : ''}
      ${c.bio ? `<p class="small muted">${esc(c.bio)}</p>` : ''}
      ${c.linktree ? ext(c.linktree, esc(U().linktree), 'btn btn-navy btn-sm') : ''}
    </article>`;
  }

  /* ===================================================================
     PAGES
     =================================================================== */
  const pages = {};

  function heroBackground() {
    const H = D.hero || {};
    if (H.video) return `<div class="hero-bg"><video autoplay muted loop playsinline preload="auto" poster="${(H.slides && H.slides[0] && H.slides[0].src) || ''}" src="${H.video}" aria-hidden="true"></video></div>`;
    const slides = (H.slides || []).filter(s => s.src);
    const n = Math.max(1, slides.length), step = H.secondsPerSlide || 9, dur = n * step;
    return `<div class="hero-bg ${n === 1 ? 'single' : ''}" aria-hidden="true">${slides.map((s, i) => `<div class="slide" style="background-image:url('${s.src}');--dur:${dur}s;--delay:${i * step}s"></div>`).join('')}</div>`;
  }
  function heroCredit() {
    if (D.hero.video) return '';
    const slides = ((D.hero || {}).slides || []).filter(s => s.credit);
    if (!slides.length) return '';
    const seen = new Map(); slides.forEach(s => { if (!seen.has(s.credit)) seen.set(s.credit, s); });
    return `<div class="hero-credit">${esc(U().campusPhotos)} ${[...seen.values()].map(s => s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.credit)}</a>` : esc(s.credit)).join(', ')} (${[...new Set(slides.map(s => s.license))].join(', ')})</div>`;
  }

  pages.home = () => {
    const T = D.copy.home;
    const ups = upcoming();
    const icc = D.icc;
    const wins = icc.results.length ? icc.results[0].wins.length : 0;
    const days = daysUntil(icc.start.slice(0, 10));
    const thisMonth = ups.some(e => e.date.slice(0, 7) === TODAY.slice(0, 7));
    const shown = ups.slice(0, 3);
    return `
    <section class="hero" id="top">
      ${heroBackground()}
      <div class="hero-inner">
        <div class="hero-mark">${markSvg()}</div>
        <span class="hero-school">${esc(T.label)}</span>
        <h1>${esc(T.title)}</h1>
        <p class="tagline">${esc(T.tagline)}</p>
        <div class="btn-row">
          <a class="btn btn-gold btn-lg" href="#/involved#join">${esc(T.btnJoin)}</a>
          <a class="btn btn-ghost btn-lg" href="#/events">${esc(T.btnEvents)}</a>
        </div>
      </div>
      ${heroCredit()}
      <div class="hero-strip"><div class="wrap">
        <div class="stat"><b>${D.org.founded}</b><span>${esc(T.statFounded)}</span></div>
        <div class="stat"><b data-count="${wins}">${wins}</b><span>${esc(T.statWins)}</span></div>
        <div class="stat"><b data-count="${days}">${days}</b><span>${esc(T.statDays)}</span></div>
        <div class="stat"><b>${duesLabel()}</b><span>${esc(T.statDues)}</span></div>
      </div></div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="intro">
          <div class="reveal">
            <p class="eyebrow">${esc(T.introEyebrow)}</p>
            <h2 class="h-lg">${title(T.introTitle)}</h2>
            <p class="lede" style="margin-top:14px">${esc(D.org.blurb)}</p>
            <div class="btn-row" style="margin-top:20px">${route('#/about', esc(T.introBtn1), 'btn btn-navy')}${route('#/involved#join', esc(T.introBtn2), 'btn btn-ghost')}</div>
          </div>
          <div class="reveal d2">
            <div class="video-box" data-video>
              <img src="${D.video.poster}" alt="">
              <button type="button" class="video-play" data-play><span class="play">${ico('i-play')}</span>${esc(D.video.title)}</button>
              ${!(D.video.link || D.video.youtube || D.video.instagram || D.video.mp4) ? `<span class="tag-pill sm video-note">${esc(T.videoNote)}</span>` : ''}
            </div>
          </div>
        </div>
        <div class="reveal" style="margin-top:clamp(34px,5vw,56px)">
          <p class="eyebrow">${esc(T.pillarsEyebrow)}</p>
          ${pillarsRow()}
        </div>
      </div>
    </section>

    <section class="section s-cream" id="upnext">
      <div class="wrap">
        <div class="sec-head reveal">
          <div><p class="eyebrow">${esc(T.eventsEyebrow)}</p><h2 class="h-lg">${esc(thisMonth ? T.eventsTitleMonth : T.eventsTitle)}</h2></div>
          <a class="textlink more" href="#/events">${esc(T.eventsMore)} ${ico('i-arrow')}</a>
        </div>
        <div class="bento">
          <div class="span7 reveal"><div class="ev-list">${shown.map(evItem).join('')}${tba().slice(0, 1).map(evItem).join('')}${shown.length < 2 ? `<div class="card flat"><b>${esc(T.eventsEmptyTitle)}</b><p class="small muted" style="margin:6px 0 12px">${esc(T.eventsEmptyText)}</p><div class="btn-row">${ext(D.links.ramsconnectEvents, esc(U().ramsconnect), 'btn btn-navy btn-sm')}${route('#/events', esc(U().pastEvents), 'btn btn-ghost btn-sm')}</div></div>` : ''}</div></div>
          <article class="card navy span5 reveal d1">
            <span class="chip">${esc(icc.city)}</span>
            <h3 class="h-md" style="margin-top:10px">${esc(icc.short)} countdown</h3>
            <p class="small" style="opacity:.85">${esc(icc.dates)}. ${esc(T.countdownNote)}</p>
            ${countdown(icc.start)}
            <div class="btn-row">${ext(D.links.iccApplication, esc(T.countdownBtn), 'btn btn-gold btn-sm')}${route('#/icc', esc(T.countdownBtn2), 'btn btn-ghost btn-sm')}</div>
          </article>
        </div>
      </div>
    </section>

    <section class="section s-gold">
      <div class="wrap">
        <div class="sec-head reveal">
          <div><p class="eyebrow">${esc(T.iccEyebrow)}</p><h2 class="h-lg">${esc(icc.short)}: ${esc(icc.city)}, ${esc(icc.dates)}</h2></div>
          <div class="btn-row">${ext(D.links.iccApplication, esc(T.iccApply), 'btn btn-navy')}${route('#/icc', esc(T.iccMore), 'btn btn-ghost')}</div>
        </div>
        <div class="feature-cards reveal">${D.iccFeatures.map(f => `<div class="feature"><img src="${srcOf(f.img)}" alt="" loading="lazy"><div><h4>${esc(f.title)}</h4><p>${esc(f.text)}</p></div></div>`).join('')}</div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="sec-head reveal">
          <div><p class="eyebrow">${esc(T.boardEyebrow || `${D.org.year} executive board`)}</p><h2 class="h-lg">${title(T.boardTitle)}</h2></div>
          <a class="textlink more" href="#/board">${esc(T.boardMore)} ${ico('i-arrow')}</a>
        </div>
        <div class="board-row ten reveal">${D.board.map(boardTile).join('')}${advisorTile()}</div>
      </div>
    </section>

    ${D.posts.length ? `<section class="section s-cream">
      <div class="wrap">
        <div class="sec-head reveal">
          <div><p class="eyebrow">${esc(T.newsEyebrow)}</p><h2 class="h-lg">${title(T.newsTitle)}</h2></div>
          <div class="btn-row"><a class="textlink" href="#/newsletter">${esc(newsletterMonth())} newsletter ${ico('i-arrow')}</a><a class="textlink more" href="#/blog">${esc(T.newsMore)} ${ico('i-arrow')}</a></div>
        </div>
        <div class="grid g3">${D.posts.slice(0, 3).map(p => postCard(p)).join('')}</div>
      </div>
    </section>` : ''}

    <section class="section">
      <div class="wrap split" style="align-items:start">
        <div class="reveal"><p class="eyebrow">${esc(T.faqEyebrow)}</p><h2 class="h-lg">${title(T.faqTitle)}</h2><p class="lede" style="margin-top:12px">${esc(T.faqLede)} <a href="mailto:${D.org.email}">${esc(D.org.email)}</a>.</p><div class="social-row on-light" style="margin-top:18px">${socialRow()}</div></div>
        <div class="faq reveal d2">${D.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p>${f.link ? `<a class="textlink faq-link" href="${f.link}">${esc(f.linkLabel || 'Learn more')} ${ico('i-arrow')}</a>` : ''}</details>`).join('')}</div>
      </div>
    </section>`;
  };

  pages.about = () => {
    const T = D.copy.about, m = D.membership;
    const wins = D.icc.results.length ? D.icc.results[0].wins.length : 0;
    return `
    ${pageHead(T.eyebrow, T.title, T.lede)}
    <section class="section s-cream">
      <div class="wrap split">
        <div class="reveal">
          <p class="eyebrow">${esc(T.purposeEyebrow)}</p>
          <p class="quote">"${esc(T.quote)}"</p>
          <p>${esc(T.p1)}</p>
          <p>${esc(T.p2)}</p>
          <div class="btn-row" style="margin-top:6px">${route('#/involved#join', esc(T.btnJoin))}${route('#/board', esc(T.btnBoard), 'btn btn-ghost')}</div>
        </div>
        <div class="reveal d2 numbers" style="grid-template-columns:repeat(2,1fr)">
          <div class="num"><b>${D.org.founded}</b><span>${esc(T.numFounded)}</span></div>
          <div class="num"><b data-count="${wins}">${wins}</b><span>${esc(T.numWins)}</span></div>
          <div class="num"><b data-count="${m.activePoints}">${m.activePoints}</b><span>${esc(T.numPoints)}</span></div>
          <div class="num"><b>${duesLabel()}</b><span>${esc(T.numDues)}</span></div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">${esc(T.orgsEyebrow)}</p><h2 class="h-lg">${title(T.orgsTitle)}</h2></div></div>
        <div class="grid g3">${D.aboutCards.map((c, i) => `<div class="card reveal d${i % 3}"><span class="chip navy">${esc(c.chip)}</span><h3 class="h-sm" style="margin-top:8px">${esc(c.title)}</h3><p style="margin:0${c.url ? ' 0 10px' : ''}">${esc(c.text)}</p>${c.url ? ext(c.url, esc(c.btn || U().visit), 'btn btn-ghost btn-sm') : ''}</div>`).join('')}</div>
      </div>
    </section>
    ${D.showTimeline === false || !D.timeline.length ? '' : `<section class="section s-navy deep">
      <div class="wrap split">
        <div class="reveal">
          <p class="eyebrow">${esc(T.historyEyebrow)}</p>
          <h2 class="h-lg">${title(T.historyTitle)}</h2>
          <ul class="timeline" style="margin:24px 0 0;padding-left:28px">${D.timeline.map(t => `<li><b>${esc(t.when)}</b><span>${esc(t.text)}</span></li>`).join('')}</ul>
        </div>
        <div class="reveal d2">
          <div class="frame"><img src="${srcOf(D.aboutPhoto) || 'assets/img/photos/about-speaker.webp'}" alt="${esc(T.historyAlt)}"></div>
        </div>
      </div>
    </section>`}`;
  };

  pages.events = () => {
    const T = D.copy.events;
    return `
    ${pageHead(T.eyebrow, T.title, T.lede, `<div class="btn-row" style="margin-top:18px">${ext(D.links.googleCalendar, esc(T.btnCalendar), 'btn btn-gold')}${ext(D.links.ramsconnectEvents, esc(T.btnRegister), 'btn btn-ghost')}</div>`)}
    <section class="section s-cream">
      <div class="wrap">
        <div class="sec-head">
          <div class="ev-toggle" role="tablist"><button class="on" data-view="list">${esc(U().listView)}</button><button data-view="cal">${esc(U().calView)}</button></div>
          ${showLoc() ? '' : `<span class="locked">${ico('i-lock')} ${esc(T.locked)}</span>`}
        </div>
        <div data-view-list>
          <p class="month-label">${esc(T.upcomingLabel)}</p>
          <div class="ev-list">${upcoming().map(evItem).join('')}${tba().map(evItem).join('')}${upcoming().length ? '' : `<div class="card flat"><b>${esc(T.emptyTitle)}</b><p class="small muted" style="margin:6px 0 0">${esc(T.emptyText)}</p></div>`}</div>
          ${(() => { const p = past(); let cur = ''; let out = ''; p.forEach(e => { const d = pd(e.date); const key = MON[d.getMonth()] + ' ' + d.getFullYear(); if (key !== cur) { cur = key; out += `<p class="month-label">${key} · ${esc(T.recapLabel)}</p>`; } out += evItem(e); }); return `<div class="ev-list">${out}</div>`; })()}
        </div>
        <div data-view-cal hidden><div class="cal" data-cal></div></div>
      </div>
    </section>`;
  };

  pages.board = () => {
    const T = D.copy.board;
    return `
    ${pageHead(T.eyebrow || `${D.org.year} executive board`, T.title, T.lede)}
    <section class="section s-navy deep">
      <div class="wrap">
        <div class="board-grid">${D.board.map(boardCard).join('')}</div>
        <div class="split" style="margin-top:26px;align-items:stretch" id="advisor">
          ${advisorCard('reveal')}
          <div class="card gold reveal d2 next-year"><span class="chip navy">${esc(T.nextChip)}</span><h3 class="h-md" style="margin-top:8px">${esc(T.nextTitle)}</h3><p>${esc(D.leadership.season)}</p><div class="btn-row">${D.links.boardApplication ? ext(D.links.boardApplication, esc(T.nextBtn), 'btn btn-navy btn-sm') : mailBtn('Interested in the AMA board', T.nextBtnEmail, 'btn btn-navy btn-sm')}${route('#/leadership', esc(T.nextBtn2), 'btn btn-ghost btn-sm')}</div>${D.links.boardApplication ? '' : `<p class="small muted" style="margin:12px 0 0">${esc(T.nextNote)}</p>`}</div>
        </div>
      </div>
    </section>`;
  };

  pages.member = slug => {
    const i = D.board.findIndex(m => m.slug === slug);
    if (i < 0) return pages.board();
    const m = D.board[i], l = li(m);
    const prev = D.board[(i - 1 + D.board.length) % D.board.length], next = D.board[(i + 1) % D.board.length];
    return `
    <section class="page-head"><div class="wrap"><a class="textlink back" href="#/board">${ico('i-arrow')} ${esc(U().backToBoard)}</a></div></section>
    <section class="section s-cream">
      <div class="wrap profile">
        <div class="frame reveal"><img src="${photoOf(m)}" alt="${esc(m.name)}"></div>
        <div class="reveal d1">
          <span class="chip navy">${esc(m.role)}</span>
          <h1 class="h-lg" style="margin:12px 0 6px">${esc(m.name)}</h1>
          <p class="lede">${esc(m.year)}, ${esc(m.major)}</p>
          ${m.bio ? `<p>${esc(m.bio)}</p>` : ''}
          <div class="profile-facts">
            <div><b>${esc(U().careerGoal)}</b><span>${esc(m.goal)}</span></div>
            <div><b>${esc(U().funFact)}</b><span>${esc(m.fun)}</span></div>
            <div><b>${esc(U().boardYear)}</b><span>${esc(D.org.year)}</span></div>
          </div>
          <div class="btn-row" style="margin-top:22px"><a class="btn btn-navy" href="${l.href}" target="_blank" rel="noopener">${ico('i-in')} ${l.label}</a>${mailBtn('Hello from the website, for ' + m.name.split(' ')[0], U().emailBoard, 'btn btn-ghost')}</div>
          <div class="profile-nav"><a href="#/board/${prev.slug}">${ico('i-arrow')} ${esc(prev.name)}</a><a href="#/board/${next.slug}">${esc(next.name)} ${ico('i-arrow')}</a></div>
        </div>
      </div>
    </section>`;
  };

  pages.mot = () => {
    const A = D.agency, T = D.copy.mot;
    const ask = (label, cls = 'btn btn-ghost btn-sm') => mailBtn('Working with Marketers of Tomorrow', label, cls, motMail());
    return `
    ${pageHead(T.eyebrow, `*${A.name}*`, A.pitch, `<div class="btn-row" style="margin-top:18px">${ext(motApply(), esc(T.btnApply))}${ask(T.btnProject, 'btn btn-ghost')}</div>`)}
    <section class="section s-cream">
      <div class="wrap">
        ${A.status ? `<div class="card gold reveal" style="margin-bottom:30px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">${ico('i-clock')}<b>${esc(A.status)}</b></div>` : ''}
        <div class="sec-head reveal"><div><p class="eyebrow">${esc(T.howEyebrow)}</p><h2 class="h-lg">${title(T.howTitle)}</h2></div></div>
        <div class="steps reveal">${A.how.map(s => `<div class="step"><b>${esc(s.t)}</b><p>${esc(s.d)}</p></div>`).join('')}</div>
        <div class="split" style="margin-top:46px">
          <div class="reveal"><p class="eyebrow">${esc(T.rolesEyebrow)}</p><h2 class="h-md">${esc(T.rolesTitle)}</h2><div class="roles" style="margin:14px 0 20px">${A.roles.map(r => `<span class="tag-pill sm">${esc(r)}</span>`).join('')}</div><p>${esc(T.rolesText)}</p></div>
          <div class="reveal d2"><div class="frame"><img src="${srcOf(A.photo) || 'assets/img/photos/mot-agency.webp'}" alt="${esc(T.rolesAlt)}"></div></div>
        </div>
      </div>
    </section>
    <section class="section" id="services">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">${esc(T.servicesEyebrow)}</p><h2 class="h-lg">${title(T.servicesTitle)}</h2></div></div>
        ${A.concentrations.length ? `<div class="grid g3">${A.concentrations.map((c, i) => `<div class="card reveal d${(i % 3) + 1}"><h3 class="h-sm">${esc(c.t)}</h3><p style="margin:0">${esc(c.d || '')}</p></div>`).join('')}</div>${T.servicesNote ? `<p class="small muted" style="margin:16px 0 0">${esc(T.servicesNote)}</p>` : ''}` : placeholder(T.servicesEmptyTitle, T.servicesEmptyText, ask(T.servicesEmptyBtn || 'Ask about a project'))}
      </div>
    </section>
    <section class="section s-cream" id="consultants">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">${esc(T.teamEyebrow)}</p><h2 class="h-lg">${title(T.teamTitle)}</h2></div><p>${esc(T.teamLede)}</p></div>
        ${A.consultants.length ? `<div class="people">${A.consultants.map(consultantCard).join('')}</div>` : placeholder(T.teamEmptyTitle, T.teamEmptyText, ext(motApply(), esc(T.teamEmptyBtn), 'btn btn-navy btn-sm'))}
        <div class="sec-head reveal" style="margin-top:56px"><div><p class="eyebrow">${esc(T.leadEyebrow)}</p><h2 class="h-lg">${title(T.leadTitle)}</h2></div></div>
        ${A.groupPhoto === null ? '' : `<div class="frame mot-group reveal"><img src="${srcOf(A.groupPhoto) || 'assets/img/photos/mot-eboard.webp'}" alt="${esc(T.leadAlt)}" loading="lazy"></div>`}
        <div class="people leaders">${A.leadership.map(l => `<article class="person reveal"><div class="person-photo">${photoOr(srcOf(l.photo), l.name)}</div><h3>${esc(l.name)}</h3><span class="role">${esc(l.title)}</span>${l.bio ? `<p class="small muted">${esc(l.bio)}</p>` : `<p class="small muted">${esc(T.bioNote)}</p>`}<div class="btn-row" style="justify-content:center">${l.email ? mailBtn('Working with Marketers of Tomorrow', U().email, 'btn btn-ghost btn-sm', l.email) : ''}${l.linktree ? ext(l.linktree, esc(U().linktree), 'btn btn-navy btn-sm') : ''}</div></article>`).join('')}</div>
      </div>
    </section>
    <section class="section" id="clients">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">${esc(T.clientsEyebrow)}</p><h2 class="h-lg">${title(T.clientsTitle)}</h2></div></div>
        ${A.clients.length || A.partners.length ? `<div class="grid g2">${[[T.clientsLabel, A.clients], [T.partnersLabel, A.partners]].filter(x => x[1].length).map(([h, list]) => `<div class="card reveal"><span class="chip navy">${esc(h)}</span><div class="client-list">${list.map(c => `<div>${c.url ? `<a href="${c.url}" target="_blank" rel="noopener"><b>${esc(c.name)}</b></a>` : `<b>${esc(c.name)}</b>`}${c.note ? `<span>${esc(c.note)}</span>` : ''}</div>`).join('')}</div></div>`).join('')}</div>` : placeholder(T.clientsEmptyTitle, T.clientsEmptyText, ask(T.clientsEmptyBtn))}
      </div>
    </section>`;
  };

  pages.icc = () => {
    const icc = D.icc, F = icc.fundraising, T = D.copy.icc;
    const cards = D.iccCards;
    return `
    <section class="page-head s-navy">
      <div class="wrap icc-hero">
        <div>
          <span class="tag-pill sm">${esc(icc.name)}</span>
          <h1 class="h-lg">${esc(icc.short)}: <em class="serif gold">${esc(icc.city)}</em></h1>
          <p class="lede">${esc(icc.dates)}. ${esc(icc.about)}</p>
          <div class="btn-row" style="margin-top:18px">${ext(D.links.iccApplication, esc(T.btnApply))}<button type="button" class="btn btn-ghost" data-donate>${ico('i-heart')} ${esc(T.btnDonate)}</button></div>
        </div>
        <div class="card navy" style="padding:30px">
          <span class="chip">${esc(T.countdownChip)}</span>
          <h3 class="h-md" style="margin:8px 0 0">${esc(T.countdownTitle)}</h3>
          ${countdown(icc.start, 'lg')}
          <p class="small" style="opacity:.8;margin:0">${esc(T.countdownNote)} ${fmtLong(icc.start.slice(0, 10))}.</p>
        </div>
      </div>
    </section>
    <section class="section s-cream">
      <div class="wrap">
        <div class="grid g3" style="margin-bottom:40px">
          ${cards.map((c, i) => `<div class="card reveal d${i}"><span class="chip navy">${esc(c.chip)}</span><h3 class="h-sm" style="margin-top:8px">${esc(c.title)}</h3>${i === 1 ? `<div class="roles" style="margin-top:8px">${icc.competitions.map(x => `<span class="chip">${esc(x)}</span>`).join('')}</div>` : `<p style="margin:0${c.btn ? ' 0 10px' : ''}">${esc(c.text)}</p>`}${c.btn ? ext(D.links.iccApplication, esc(c.btn), 'btn btn-gold btn-sm') : ''}</div>`).join('')}
        </div>
        <div class="sec-head reveal"><div><p class="eyebrow">${esc(T.resultsEyebrow)}</p><h2 class="h-lg">${title(T.resultsTitle)}</h2></div><p>${esc(T.resultsLede)}</p></div>
        <div class="grid g2" style="align-items:start">
          ${icc.results.map((y, i) => `<div class="reveal d${i + 1}">
            <div class="res-year"><h3>${esc(y.year)}</h3><span class="chip">${esc(y.city)}</span>${y.source ? `<a class="small textlink" href="${y.source}" target="_blank" rel="noopener">${esc(y.dates)} ${ico('i-ext')}</a>` : `<span class="small muted">${esc(y.dates)}</span>`}</div>
            ${y.note ? `<p class="muted" style="margin-top:-4px">${esc(y.note)}</p>` : ''}
            <div class="results">${y.wins.map(w => `<div class="res-row">${medal(+w.place)}<div><b>${esc(w.who)}</b><div class="comp">${esc(w.comp)}</div></div></div>`).join('')}</div>
          </div>`).join('')}
        </div>
      </div>
    </section>
    <section class="section s-gold" id="fundraising">
      <div class="wrap split">
        <div class="reveal"><p class="eyebrow">${esc(F.eyebrow)}</p><h2 class="h-lg">${title(F.head)}</h2><p class="lede" style="margin:12px 0 18px">${esc(F.body)}</p><div class="btn-row"><button type="button" class="btn btn-navy" data-donate>${ico('i-heart')} ${esc(T.fundBtn)}</button>${route('#/accomplishments', esc(T.fundBtn2), 'btn btn-ghost')}</div></div>
        <div class="reveal d2"><div class="frame"><img src="${srcOf(icc.photo) || 'assets/img/photos/icc-winners.webp'}" alt="${esc(T.fundAlt)}"></div></div>
      </div>
    </section>`;
  };

  function accomplishmentForm() {
    const F = D.forms, T = D.copy.acc;
    if (F.accomplishmentEmbed) return `<div class="form-embed"><iframe src="${F.accomplishmentEmbed}" title="Accomplishment form" loading="lazy"></iframe></div>`;
    return `<form class="sticky" data-form="accomplishment">
      <h3 class="h-md">${esc(T.formTitle)}</h3>
      <p class="small muted" style="margin:0 0 14px">${esc(T.formNote)}</p>
      <div class="field"><label for="accName">${esc(FM().accName)}</label><input id="accName" name="name" required placeholder="${esc(FM().accNamePh)}"></div>
      <div class="field"><label for="accEmail">${esc(FM().accEmail)}</label><input id="accEmail" name="email" type="email" placeholder="${esc(FM().accEmailPh)}"></div>
      <div class="field"><label for="accCat">${esc(FM().accCat)}</label><select id="accCat" name="category">${Object.entries(D.accomplishmentCats).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <div class="field"><label for="accWhat">${esc(FM().accWhat)}</label><input id="accWhat" name="what" required placeholder="${esc(FM().accWhatPh)}"></div>
      <div class="field"><label for="accWhere">${esc(FM().accWhere)}</label><input id="accWhere" name="where" placeholder="${esc(FM().accWherePh)}"></div>
      <div class="field"><label for="accWhen">${esc(FM().accWhen)}</label><input id="accWhen" name="when" placeholder="${esc(FM().accWhenPh)}"></div>
      <div class="field check"><label><input type="checkbox" name="feature" value="yes" checked> ${esc(FM().accFeature)}</label></div>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn btn-gold" type="submit">${ico('i-send')} ${esc(T.formBtn)}</button>
    </form>`;
  }

  pages.accomplishments = () => {
    const T = D.copy.acc, L = D.leaderboard;
    const rows = L.members.slice().sort((a, b) => b.pts - a.pts);
    const top = rows.slice(0, 3);
    const goal = D.membership.activePoints;
    return `
    ${pageHead(T.eyebrow, T.title, T.lede, `<div class="btn-row" style="margin-top:18px"><a class="btn btn-gold" href="#/accomplishments#submit">${esc(T.btnSubmit)}</a><a class="btn btn-ghost" href="#/accomplishments#leaderboard">${esc(T.btnBoard)}</a></div>`)}
    <section class="section s-cream" id="wins">
      <div class="wrap">
        <div class="filters" data-filters="acc"><button class="on" data-f="all">${esc(U().all)}</button>${Object.entries(D.accomplishmentCats).map(([k, v]) => `<button data-f="${k}">${v}</button>`).join('')}</div>
        <div class="grid g3" data-acc-grid>
          ${D.accomplishments.map((a, i) => `<article class="card acc-card ${a.placeholder ? 'placeholder' : ''} reveal d${(i % 3) + 1}" data-cat="${a.cat}">
            <span class="ico">${ico(a.cat === 'award' ? 'i-trophy' : a.cat === 'internship' ? 'i-bolt' : a.cat === 'job' ? 'i-check' : 'i-star')}</span>
            <div><b>${esc(a.who)}</b><div class="what">${esc(a.what)}</div><div class="where">${esc(a.where)}${a.when ? ' · ' + esc(a.when) : ''}</div>${a.placeholder ? `<div style="margin-top:10px"><a class="btn btn-gold btn-sm" href="#/accomplishments#submit">${esc(T.btnSubmit)}</a></div>` : ''}</div>
          </article>`).join('')}
        </div>
      </div>
    </section>
    <section class="section" id="leaderboard">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">${esc(T.lbEyebrow)}</p><h2 class="h-lg">${title(T.lbTitle)}</h2></div><p>${esc(tpl(T.lbLede, { goal }))} Updated ${fmt(L.updated, { month: 'long', day: 'numeric' })}.${L.demo ? ` <span class="chip">${esc(T.lbSample)}</span>` : ''}</p></div>
        <div class="podium reveal">
          ${[top[1], top[0], top[2]].map((m, i) => m ? `<div class="pod p${i === 1 ? 1 : i === 0 ? 2 : 3}"><span class="tag-pill sm rank">${i === 1 ? '1st' : i === 0 ? '2nd' : '3rd'}</span><div class="av">${monogram(m.name)}</div><b>${esc(m.name)}</b><span class="pts">${m.pts} ${esc(U().pts)}</span></div>` : '').join('')}
        </div>
        <div class="split" style="align-items:start">
          <div class="lb reveal">
            ${rows.map((m, i) => `<div class="lb-row"><span class="n">${i + 1}</span><span class="av">${monogram(m.name)}</span><div><b>${esc(m.name)}</b>${m.pts >= goal ? `<span class="badge-active">${ico('i-check')} ${esc(U().active)}</span>` : ''}<div class="bar"><i data-w="${Math.min(100, m.pts / goal * 100)}%" style="--w:0%"></i></div></div><span class="pts">${m.pts}<small>${Math.max(0, goal - m.pts)} ${esc(U().toGo)}</small></span></div>`).join('')}
          </div>
          <div style="display:grid;gap:18px">
            <div class="card reveal d2"><span class="chip navy">${esc(T.pointsChip)}</span><h3 class="h-md" style="margin-top:8px">${esc(T.pointsTitle)}</h3><div class="pt-list" style="margin:12px 0">${D.membership.knownPoints.map(p => `<div><span>${esc(p.what)}</span><b>${p.isGoal ? '' : '+'}${esc(p.pts)}</b></div>`).join('')}</div><p class="small muted" style="margin:0">${esc(D.membership.pointsNote)} ${esc(T.pointsAfter)}</p></div>
            <div class="card gold reveal d3"><h3 class="h-md">${esc(T.notTitle)}</h3><p>${esc(T.notText)}</p>${route('#/events', esc(T.notBtn), 'btn btn-navy btn-sm')}</div>
          </div>
        </div>
      </div>
    </section>
    <section class="section s-cream" id="submit">
      <div class="wrap split" style="align-items:start">
        <div class="reveal"><p class="eyebrow">${esc(T.submitEyebrow)}</p><h2 class="h-lg">${title(T.submitTitle)}</h2><p class="lede" style="margin:12px 0 18px">${esc(T.submitLede)}</p><p class="small muted">${esc(T.submitSmall)}</p></div>
        <div class="reveal d2">${accomplishmentForm()}</div>
      </div>
    </section>`;
  };

  pages.leadership = () => {
    const L = D.leadership, T = D.copy.lead;
    const ctaFor = p => ({ board: route('#/board', 'Meet the board', 'btn btn-navy btn-sm'), mot: route('#/mot', 'Marketers of Tomorrow', 'btn btn-navy btn-sm'), icc: route('#/icc', D.icc.short, 'btn btn-navy btn-sm'), involved: route('#/involved', 'Get involved', 'btn btn-navy btn-sm') }[p.cta] || (p.url ? ext(p.url, esc(U().learnMore), 'btn btn-navy btn-sm') : ''));
    return `
    ${pageHead(T.eyebrow, T.title, L.intro)}
    <section class="section s-cream">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">${esc(T.pathsEyebrow)}</p><h2 class="h-lg">${title(T.pathsTitle)}</h2></div></div>
        <div class="grid g2">${L.paths.map((p, i) => `<div class="card reveal d${(i % 2) + 1}"><h3 class="h-sm">${esc(p.t)}</h3><p>${esc(p.d)}</p>${ctaFor(p)}</div>`).join('')}</div>
      </div>
    </section>
    <section class="section s-navy">
      <div class="wrap split">
        <div class="reveal"><p class="eyebrow">${esc(T.boardEyebrow)}</p><h2 class="h-lg">${title(T.boardTitle)}</h2><p class="lede" style="margin:12px 0 18px">${esc(L.season)}</p><div class="btn-row">${D.links.boardApplication ? ext(D.links.boardApplication, esc(T.btnApply)) : mailBtn('Interested in the AMA board', T.btnEmail, 'btn btn-gold')}${route('#/board', esc(T.btnBoard), 'btn btn-ghost')}</div>${D.links.boardApplication ? '' : `<p class="small" style="opacity:.75;margin:12px 0 0">${esc(T.note)}</p>`}</div>
        <div class="reveal d2"><div class="card"><span class="chip navy">${esc(T.rolesChip)}</span><div class="role-list">${D.board.map(m => `<div><b>${esc(m.role)}</b><span>${esc(m.name)}, ${esc(D.org.year)}</span></div>`).join('')}</div></div></div>
      </div>
    </section>`;
  };

  pages.opportunities = () => {
    const A = D.alumni, T = D.copy.opp;
    return `
    ${pageHead(T.eyebrow, T.title, T.lede)}
    <section class="section s-cream" id="opportunities">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">${esc(T.oppEyebrow)}</p><h2 class="h-lg">${title(T.oppTitle)}</h2></div><p>${esc(T.oppLede)}</p></div>
        <div class="filters" data-filters="opp"><button class="on" data-f="all">${esc(U().all)}</button>${Object.entries(D.opportunityCats).map(([k, v]) => `<button data-f="${k}">${v}</button>`).join('')}</div>
        <div class="grid g3" data-opp-grid>${D.opportunities.map((o, i) => `<a class="card reveal d${(i % 3) + 1}" data-cat="${o.cat}" style="text-decoration:none" href="${o.url || o.route || '#/opportunities'}" ${o.url ? 'target="_blank" rel="noopener"' : ''}><span class="chip">${esc(D.opportunityCats[o.cat] || o.cat)}</span><h3 class="h-sm" style="margin-top:8px">${esc(o.title)} ${ico(o.url ? 'i-ext' : 'i-arrow')}</h3><p class="muted" style="margin:0">${esc(o.d)}</p></a>`).join('')}</div>
      </div>
    </section>
    <section class="section s-navy" id="alumni">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">${esc(T.alumniEyebrow)}</p><h2 class="h-lg">${title(T.alumniTitle)}</h2></div><p>${esc(A.intro)}</p></div>
        <div class="split" style="align-items:start;margin-bottom:40px">
          <div class="reveal">${D.links.alumniLinkedIn ? `<div class="card navy" style="border:1px solid rgba(255,255,255,.18)"><span class="chip">${esc(T.groupChip)}</span><h3 class="h-md" style="margin:8px 0">${esc(T.groupTitle)}</h3><p class="small" style="opacity:.85">${esc(T.groupText)}</p>${ext(D.links.alumniLinkedIn, esc(T.groupBtn), 'btn btn-gold btn-sm')}</div>` : placeholder(T.groupEmptyTitle, T.groupEmptyText, mailBtn('AMA at VCU alumni', T.groupEmptyBtn, 'btn btn-navy btn-sm'))}</div>
          <div class="reveal d2">${A.stories.length ? `<div class="stories">${A.stories.map(s => `<div class="story"><div class="story-photo">${photoOr(srcOf(s.photo), s.name)}</div><div><b>${esc(s.name)}</b>${s.year ? ` <span class="muted">· ${esc(U().classOf)} ${esc(s.year)}</span>` : ''}<div class="small">${esc(s.now)}</div>${s.story ? `<p class="small" style="margin:6px 0 0">${esc(s.story)}</p>` : ''}${s.url ? `<a class="small textlink" href="${s.url}" target="_blank" rel="noopener">${esc(U().linkedin)} ${ico('i-ext')}</a>` : ''}</div></div>`).join('')}</div>` : placeholder(T.storiesEmptyTitle, T.storiesEmptyText, mailBtn('Alumni update for the AMA at VCU website', T.storiesEmptyBtn, 'btn btn-navy btn-sm'))}</div>
        </div>
        <div class="grid g4">${A.waysToHelp.map((w, i) => `<div class="card reveal d${i + 1}"><h3 class="h-sm">${esc(w.t)}</h3><p style="margin:0">${esc(w.d)}</p></div>`).join('')}</div>
        <div class="btn-row" style="margin-top:22px">${mailBtn('Getting involved as an AMA at VCU alum', T.btnInvolved, 'btn btn-gold')}<button type="button" class="btn btn-ghost" data-donate>${ico('i-heart')} ${esc(T.btnDonate)}</button></div>
      </div>
    </section>
    <section class="section s-cream">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">${esc(T.followEyebrow)}</p><h2 class="h-lg">${title(T.followTitle)}</h2></div></div>
        <div class="grid g2">${A.forAlumniAndMembers.map((o, i) => `<a class="card reveal d${i + 1}" style="text-decoration:none" href="${o.url || '#'}" ${o.url ? 'target="_blank" rel="noopener"' : ''}><h3 class="h-sm">${esc(o.t)} ${o.url ? ico('i-ext') : ''}</h3><p class="muted" style="margin:0">${esc(o.d)}</p></a>`).join('')}</div>
      </div>
    </section>`;
  };

  pages.newsletter = () => {
    const T = D.copy.news;
    const issues = D.newsletter.issues || [];
    const joinCard = `<div class="card navy reveal d2"><span class="chip">${esc(T.inboxChip)}</span><h3 class="h-sm" style="margin:8px 0">${esc(T.inboxTitle)}</h3><p class="small" style="opacity:.85">${esc(T.inboxText)}</p>${ext(D.links.ramsconnectJoin, esc(T.inboxBtn), 'btn btn-gold btn-sm')}</div>`;
    if (issues.length) {
      const cur = issues[0], rest = issues.slice(1), open = cur.file || cur.link;
      const isPdf = cur.file && (/\.pdf(\?|#|$)/i.test(cur.file) || cur.file.includes('/media/'));
      return `
    ${pageHead(T.eyebrow, T.title, T.lede)}
    <section class="section s-cream">
      <div class="wrap split" style="align-items:start;grid-template-columns:1.4fr .8fr">
        <div class="news-card reveal">
          <div class="nc-head"><div><span class="chip">${cur.date ? fmt(cur.date, { month: 'long', year: 'numeric' }) : esc(T.currentChip)}</span><h3>${esc(cur.month)}</h3></div>${markSvg('nc-logo')}</div>
          <div class="nc-body">
            ${cur.blurb ? `<p class="lede" style="margin:0">${esc(cur.blurb)}</p>` : ''}
            ${isPdf ? `<div class="pdf-frame"><iframe src="${cur.file}#view=FitH" title="${esc(cur.month)} newsletter" loading="lazy"></iframe></div>` : ''}
            ${open ? `<div class="btn-row">${ext(open, esc(cur.file ? T.openBtn : T.readBtn), 'btn btn-gold')}</div>` : ''}
          </div>
        </div>
        <div style="display:grid;gap:18px">
          <div class="reveal d1"><p class="eyebrow">${esc(T.archiveEyebrow)}</p><h2 class="h-md" style="margin-bottom:12px">${esc(T.archiveTitle)}</h2><div class="archive">${rest.length ? rest.map(a => `<a href="${a.file || a.link || D.links.newsletterArchive}" target="_blank" rel="noopener"><span style="color:var(--ink)">${esc(a.month)}</span><span>${a.date ? fmt(a.date, { month: 'short', day: 'numeric', year: 'numeric' }) : ''} ${ico('i-ext')}</span></a>`).join('') : `<p class="small muted">${esc(T.archiveEmpty)} <a href="${D.links.newsletterArchive}" target="_blank" rel="noopener">RamsConnect</a></p>`}</div></div>
          ${joinCard}
        </div>
      </div>
    </section>`;
    }
    const c = D.newsletter.current;
    return `
    ${pageHead(T.eyebrow, T.title, T.lede)}
    <section class="section s-cream">
      <div class="wrap split" style="align-items:start;grid-template-columns:1.4fr .8fr">
        <div class="news-card reveal">
          <div class="nc-head"><div><span class="chip">${esc(c.issue)}</span><h3>${esc(c.month)}</h3></div>${markSvg('nc-logo')}</div>
          <div class="nc-body">
            <p class="lede" style="margin:0">${esc(c.intro)}</p>
            ${c.sections.map(s => `<div><h4>${esc(s.h)}</h4><ul>${s.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}
            <div class="spot"><h4 style="margin-bottom:6px">${esc(c.spotlight.h)}</h4><p style="margin:0">${esc(c.spotlight.p)}</p></div>
            <div class="btn-row">${c.url ? ext(c.url, 'Read the full issue', 'btn btn-navy btn-sm') : ''}<span class="small muted">${esc(T.locationsNote)}</span></div>
          </div>
        </div>
        <div style="display:grid;gap:18px">
          <div class="reveal d1"><p class="eyebrow">${esc(T.archiveEyebrow)}</p><h2 class="h-md" style="margin-bottom:12px">${esc(T.archiveTitle)}</h2><div class="archive">${D.newsletter.archive.map(a => `<a href="${a.url || D.links.newsletterArchive}" target="_blank" rel="noopener"><span style="color:var(--ink)">${esc(a.month)}</span><span>${a.date ? fmt(a.date, { month: 'short', day: 'numeric', year: 'numeric' }) : ''} ${ico('i-ext')}</span></a>`).join('')}</div></div>
          ${joinCard}
        </div>
      </div>
    </section>`;
  };

  pages.blog = () => {
    const T = D.copy.blog;
    return `
    ${pageHead(T.eyebrow, T.title, T.lede)}
    <section class="section s-cream"><div class="wrap">${D.posts.length ? `<div class="grid g3" style="align-items:start">${D.posts.map((p, i) => postCard(p, i === 0)).join('')}</div>` : placeholder(T.emptyTitle, T.emptyText, ext(D.links.instagram, esc(T.emptyBtn), 'btn btn-navy btn-sm') + route('#/gallery', esc(T.emptyBtn2), 'btn btn-ghost btn-sm'))}</div></section>`;
  };

  pages.post = slug => {
    const T = D.copy.blog;
    const p = D.posts.find(x => x.slug === slug);
    if (!p) return pages.blog();
    const gal = (p.gallery || []).map(f => D.gallery.find(g => g.f === f) || { f, cap: p.title });
    return `
    <section class="page-head s-navy"><div class="wrap post"><a class="textlink back" href="#/blog">${ico('i-arrow')} ${esc(T.backLabel)}</a><div style="margin-top:14px"><span class="chip">${esc(p.tag)}</span> <span class="small" style="opacity:.8;margin-left:8px">${fmtLong(p.date)}</span></div><h1 class="h-lg" style="margin-top:12px">${esc(p.title)}</h1><p class="lede">${esc(p.dek)}</p></div></section>
    <section class="section s-cream"><div class="wrap post">
      ${p.cover ? `<div class="cover" style="margin-top:-80px"><img src="${p.cover}" alt=""></div>` : ''}
      <div class="body">${(Array.isArray(p.body) ? p.body : [String(p.body || '')]).map(b => `<p>${esc(b)}</p>`).join('')}</div>
      ${gal.length ? `<p class="eyebrow">${esc(T.photosLabel)}</p><div class="post-gallery" data-gallery>${gal.map((g, i) => `<button type="button" data-lb="${i}" data-src="${galleryFull(g)}" data-cap="${esc(g.cap)}"><img src="${galleryThumb(g)}" alt="${esc(g.cap)}" loading="lazy"></button>`).join('')}</div>` : ''}
      <div class="btn-row" style="margin-top:36px">${route('#/gallery', esc(T.morePhotos), 'btn btn-navy')}${ext(p.instagram || D.links.instagram, esc(p.instagram ? T.igBtn : T.followBtn), 'btn btn-ghost')}</div>
    </div></section>`;
  };

  pages.gallery = () => {
    const T = D.copy.gallery;
    return `
    ${pageHead(T.eyebrow, T.title, T.lede)}
    <section class="section s-cream"><div class="wrap">
      <div class="albums">${D.albums.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(albumCover).join('')}</div>
    </div></section>`;
  };

  pages.album = slug => {
    const T = D.copy.gallery;
    const a = D.albums.find(x => x.slug === slug);
    if (!a) return pages.gallery();
    const ph = photosOf(a);
    const needsDrive = !ph.length && a.folder;
    return `
    <section class="page-head"><div class="wrap"><a class="textlink back" href="#/gallery">${ico('i-arrow')} ${esc(T.backLabel)}</a><div style="margin-top:14px">${a.date ? `<span class="chip">${fmtLong(a.date)}</span>` : ''}</div><h1 class="h-lg" style="margin-top:12px">${esc(a.name)}</h1>${a.blurb ? `<p class="lede">${esc(a.blurb)}</p>` : ''}</div></section>
    <section class="section s-cream"><div class="wrap">
      <div class="masonry" data-gallery data-album-slug="${esc(a.slug)}">${ph.map((g, i) => `<figure data-lb="${i}" data-src="${galleryFull(g)}" data-cap="${esc(g.cap || '')}" class="reveal"><img src="${galleryThumb(g)}" alt="${esc(g.cap || '')}" loading="lazy" ${g.w ? `width="${g.w}" height="${g.h}"` : ''}><figcaption>${esc(g.cap || '')}</figcaption></figure>`).join('')}</div>
      ${needsDrive ? `<p class="muted" data-album-loading>Loading photos from Google Drive…</p>` : ''}
      ${!ph.length && !needsDrive ? placeholder(T.emptyTitle, T.emptyText, ext(D.links.instagram, esc(U().seeInstagram), 'btn btn-navy btn-sm')) : ''}
    </div></section>`;
  };

  pages.involved = () => {
    const F = D.forms, m = D.membership, T = D.copy.involved;
    return `
    ${pageHead(T.eyebrow, T.title, T.lede)}
    <section class="section s-cream" id="join">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">${esc(T.joinEyebrow)}</p><h2 class="h-lg">${title(T.joinTitle)}</h2></div><div class="btn-row">${ext(D.links.ramsconnectJoin, esc(T.btnRams))}${ext(D.links.becomeMember, esc(T.btnForm), 'btn btn-navy')}${ext(D.links.groupme, esc(T.btnGroupme), 'btn btn-ghost')}</div></div>
        <div class="steps reveal">${m.steps.map(s => `<div class="step"><b>${esc(s.t)}</b><p>${esc(s.d)}</p></div>`).join('')}</div>
        <p class="small muted" style="margin:16px 0 0">${esc(T.duesPrefix)} ${duesWords()} a year. ${esc(m.duesNote)}</p>
      </div>
    </section>
    <section class="section s-navy" id="ideas">
      <div class="wrap split" style="align-items:start">
        <div class="reveal"><p class="eyebrow">${esc(T.ideasEyebrow)}</p><h2 class="h-lg">${title(T.ideasTitle)}</h2><p class="lede" style="margin:12px 0 18px">${esc(T.ideasLede)}</p><p class="small" style="opacity:.8">${esc(T.ideasSmall)}</p></div>
        <div class="reveal d2">${F.ideaBoxEmbed ? `<div class="form-embed"><iframe src="${F.ideaBoxEmbed}" title="Idea drop box" loading="lazy"></iframe></div>` : `
          <form class="sticky" data-form="idea">
            <h3 class="h-md">${esc(T.ideasFormTitle)}</h3>
            <div class="field"><label for="ideaTitle">${esc(FM().ideaTitle)}</label><input id="ideaTitle" name="title" required placeholder="${esc(FM().ideaTitlePh)}"></div>
            <div class="field"><label for="ideaWhy">${esc(FM().ideaWhy)}</label><textarea id="ideaWhy" name="why" placeholder="${esc(FM().ideaWhyPh)}"></textarea></div>
            <div class="field"><label for="ideaName">${esc(FM().ideaName)}</label><input id="ideaName" name="name" placeholder="${esc(FM().ideaNamePh)}"></div>
            <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
            <button class="btn btn-navy" type="submit">${ico('i-send')} ${esc(T.ideasBtn)}</button>
          </form>`}</div>
      </div>
    </section>
    <section class="section s-cream" id="feedback">
      <div class="wrap split" style="align-items:start">
        <div class="reveal">
          <p class="eyebrow">${esc(T.fbEyebrow)}</p><h2 class="h-lg">${title(T.fbTitle)}</h2>
          <p class="lede" style="margin:12px 0 18px">${esc(T.fbLede)}</p>
          ${F.feedbackEmbed ? `<div class="form-embed"><iframe src="${F.feedbackEmbed}" title="Feedback form" loading="lazy"></iframe></div>` : `
          <form class="card" data-form="feedback">
            <div class="field"><label for="fbType">${esc(FM().fbType)}</label><select id="fbType" name="type">${D.feedbackOptions.map(o => `<option>${esc(o)}</option>`).join('')}</select></div>
            <div class="field"><label for="fbText">${esc(FM().fbText)}</label><textarea id="fbText" name="text" required placeholder="${esc(FM().fbTextPh)}"></textarea></div>
            <div class="field"><label for="fbName">${esc(FM().fbName)}</label><input id="fbName" name="name" placeholder="${esc(FM().fbNamePh)}"></div>
            <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
            <button class="btn btn-gold" type="submit">${ico('i-send')} ${esc(T.fbBtn)}</button>
          </form>`}
        </div>
        <div class="reveal d2">
          <p class="eyebrow">${esc(T.surveysEyebrow)}</p><h2 class="h-md" style="margin-bottom:14px">${esc(T.surveysTitle)}</h2>
          <div class="survey-list">${F.surveys.map(s => `<a href="${s.url}" target="_blank" rel="noopener"><div>${esc(s.title)}<span>${esc(s.note)}</span></div>${ico('i-ext')}</a>`).join('')}</div>
        </div>
      </div>
    </section>
    <section class="section s-gold" id="donate">
      <div class="wrap split">
        <div class="reveal"><p class="eyebrow">${esc(T.donateEyebrow)}</p><h2 class="h-lg">${title(T.donateTitle)}</h2><p class="lede" style="margin:12px 0 18px">${esc(T.donateLede)}</p><div class="btn-row"><button type="button" class="btn btn-navy btn-lg" data-donate>${ico('i-heart')} ${esc(T.donateBtn)}</button></div></div>
        <div class="reveal d2"><div class="frame"><img src="${srcOf(D.donatePhoto) || 'assets/img/photos/donate-event.webp'}" alt="${esc(T.donateAlt)}"></div></div>
      </div>
    </section>
    <section class="section s-cream" id="socials">
      <div class="wrap"><div class="sec-head reveal"><div><p class="eyebrow">${esc(T.socialEyebrow)}</p><h2 class="h-lg">${title(T.socialTitle)}</h2></div><div class="social-row">${socialRow()}</div></div><div class="reveal">${socialBig()}</div></div>
    </section>`;
  };

  const TITLES = { '': () => D.org.tagline, about: 'About us', events: 'Events', board: 'Executive board', mot: () => D.agency.name, icc: () => D.icc.short, accomplishments: 'Accomplishments', leadership: 'Leadership', opportunities: 'Opportunities & Alumni', newsletter: 'Newsletter', blog: 'Blog', gallery: 'Gallery', involved: 'Get involved' };
  const titleOf = k => { const t = TITLES[k] || TITLES['']; return typeof t === 'function' ? t() : t; };
  const ALIASES = { agency: '#/mot', leaderboard: '#/accomplishments#leaderboard', members: '#/accomplishments', alumni: '#/opportunities#alumni', advisor: '#/board#advisor' };

  /* ===================================================================
     ROUTER
     =================================================================== */
  const main = $('#main');
  let lastRoute = null;
  function parseHash() {
    const h = location.hash.replace(/^#\/?/, '');
    const [path, anchor] = h.split('#');
    const parts = path.split('/').filter(Boolean);
    return { page: parts[0] || '', param: parts[1] || '', anchor: anchor || '' };
  }
  function render(force) {
    const { page, param, anchor } = parseHash();
    if (ALIASES[page]) { location.replace(ALIASES[page]); return; }
    let html, t;
    if (page === 'blog' && param) { html = pages.post(param); t = (D.posts.find(p => p.slug === param) || {}).title || 'Blog'; }
    else if (page === 'board' && param) { html = pages.member(param); t = (D.board.find(m => m.slug === param) || {}).name || 'Executive board'; }
    else if (page === 'gallery' && param) { html = pages.album(param); t = (D.albums.find(a => a.slug === param) || {}).name || 'Gallery'; }
    else if (pages[page]) { html = pages[page](); t = titleOf(page); }
    else { html = pages.home(); t = titleOf(''); }
    const key = page + '/' + param;
    const changed = force || key !== lastRoute;
    lastRoute = key;
    if (changed) {
      main.innerHTML = html;
      main.classList.remove('page-enter'); void main.offsetWidth; main.classList.add('page-enter');
      document.title = t + ' | AMA at VCU';
      afterRender();
    }
    closeDonate(); lbClose();
    $$('.nav [data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === page));
    $$('.nav-group').forEach(g => g.classList.toggle('active', !!g.querySelector(`[data-nav="${page}"]`)));
    closeMenu();
    if (anchor) { const el = document.getElementById(anchor); if (el) { setTimeout(() => el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 60); return; } }
    if (changed && !force) window.scrollTo({ top: 0, behavior: 'instant' });
  }
  addEventListener('hashchange', () => render(false));

  /* ===================================================================
     AFTER RENDER: behaviors
     =================================================================== */
  function afterRender() {
    initReveal(); initCounts(); initBars(); initVideo(); initCalendar(); initFilters(); initLightbox(); initForms(); initAlbum(); tick();
  }
  function initReveal() {
    const els = $$('.reveal:not(.in)');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach(e => io.observe(e));
  }
  function countUp(el) {
    const end = parseInt(el.dataset.count, 10), prefix = el.dataset.prefix || '';
    if (reduce || !(end > 0)) { el.textContent = prefix + end; return; }
    const t0 = performance.now(), dur = 1100 + Math.min(end, 200) * 2;
    const step = now => { const p = Math.min(1, (now - t0) / dur); const v = Math.round(end * (1 - Math.pow(1 - p, 3))); el.textContent = prefix + v; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function initCounts() {
    const els = $$('[data-count]:not([data-counted])');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(countUp); return; }
    const io = new IntersectionObserver(en => en.forEach(x => { if (x.isIntersecting) { x.target.dataset.counted = 1; countUp(x.target); io.unobserve(x.target); } }), { threshold: .4 });
    els.forEach(e => io.observe(e));
  }
  function initBars() {
    const bars = $$('.lb-row .bar i[data-w]');
    if (!bars.length) return;
    setTimeout(() => bars.forEach(b => b.style.setProperty('--w', b.dataset.w)), reduce ? 0 : 120);
  }
  // Any pasted link: YouTube, Vimeo and Google Drive play on the page; a file plays in a <video>; anything else (Instagram, TikTok) opens in a new tab.
  const videoTarget = v => {
    const url = String(v.link || '').trim(); let m;
    if (url) {
      if ((m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{6,})/))) return { iframe: `https://www.youtube.com/embed/${m[1]}?autoplay=1&rel=0` };
      if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/))) return { iframe: `https://player.vimeo.com/video/${m[1]}?autoplay=1` };
      if ((m = url.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)([\w-]+)/))) return { iframe: `https://drive.google.com/file/d/${m[1]}/preview` };
      if (/\.(mp4|webm|mov|m4v)(\?|#|$)/i.test(url)) return { file: url };
      return { open: url };
    }
    if (v.youtube) return { iframe: `https://www.youtube.com/embed/${v.youtube}?autoplay=1&rel=0` };
    if (v.mp4) return { file: v.mp4 };
    if (v.instagram) return { open: v.instagram };
    return null;
  };
  function initVideo() {
    const box = $('[data-video]'); if (!box) return;
    $('[data-play]', box).addEventListener('click', () => {
      const v = D.video, t = videoTarget(v);
      if (!t) toast(U().toastVideo);
      else if (t.iframe) box.innerHTML = `<iframe src="${t.iframe}" title="${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      else if (t.file) box.innerHTML = `<video src="${t.file}" controls autoplay playsinline poster="${v.poster}"></video>`;
      else window.open(t.open, '_blank', 'noopener');
    });
  }
  function initCalendar() {
    const root = $('[data-cal]'); if (!root) return;
    const page = root.closest('.wrap');
    const list = $('[data-view-list]', page), cal = $('[data-view-cal]', page);
    $$('.ev-toggle button', page).forEach(b => b.addEventListener('click', () => {
      $$('.ev-toggle button', page).forEach(x => x.classList.toggle('on', x === b));
      const showCal = b.dataset.view === 'cal'; list.hidden = showCal; cal.hidden = !showCal;
    }));
    const byDay = {};
    EV().filter(e => !e.tba && e.date).forEach(e => { let d = pd(e.date); const end = e.end ? pd(e.end) : d; let n = 0; while (d <= end && n++ < 31) { (byDay[iso(d)] = byDay[iso(d)] || []).push(e); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); } });
    let cur = new Date(NOW.getFullYear(), NOW.getMonth(), 1), sel = TODAY;
    const draw = () => {
      const y = cur.getFullYear(), m = cur.getMonth();
      const first = new Date(y, m, 1).getDay(), n = new Date(y, m + 1, 0).getDate();
      let cells = '';
      for (let i = 0; i < first; i++) cells += `<div class="cal-day empty"></div>`;
      for (let d = 1; d <= n; d++) {
        const k = iso(new Date(y, m, d)); const evs = byDay[k] || [];
        cells += `<div class="cal-day ${evs.length ? 'has' : ''} ${k === TODAY ? 'today' : ''} ${k === sel ? 'sel' : ''}" data-day="${k}" ${evs.length ? 'role="button" tabindex="0"' : ''}>${d}${evs.length > 1 ? `<span class="cnt">${evs.length}</span>` : ''}<span class="dots">${evs.slice(0, 4).map(e => `<i style="--c:${typeOf(e).color}"></i>`).join('')}</span></div>`;
      }
      const selEvs = byDay[sel] || [];
      root.innerHTML = `
        <div>
          <div class="cal-head"><button type="button" data-prev aria-label="Previous month"><svg class="ic" style="transform:rotate(90deg)" aria-hidden="true"><use href="#i-chev"/></svg></button><h3>${MON[m]} ${y}</h3><button type="button" data-next aria-label="Next month"><svg class="ic" style="transform:rotate(-90deg)" aria-hidden="true"><use href="#i-chev"/></svg></button></div>
          <div class="cal-grid">${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => `<div class="cal-dow">${d}</div>`).join('')}${cells}</div>
          <div class="cal-legend">${Object.values(D.eventTypes).map(t => `<span><i style="--c:${t.color}"></i>${esc(t.label)}</span>`).join('')}</div>
        </div>
        <div class="cal-side">
          <h4>${sel === TODAY ? esc(U().today) + ', ' : ''}${fmt(sel, { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
          <div class="cal-list">${selEvs.length ? selEvs.map(e => `<div class="cal-item"><span class="chip dot" style="--chip:${typeOf(e).color}">${esc(typeOf(e).label)}</span><b>${esc(e.title)}</b>${e.time ? `<span class="small muted">${esc(e.time)}</span>` : ''}${evCTA(e) || (e.place ? `<span class="small muted">${ico('i-pin')} ${esc(e.place)}</span>` : '')}</div>`).join('') : `<div class="cal-item"><span class="muted">${esc(U().nothingToday)}</span></div>`}</div>
          <div class="btn-row" style="margin-top:14px">${ext(D.links.googleCalendar, esc(U().subscribe), 'btn btn-navy btn-sm')}</div>
        </div>`;
      $('[data-prev]', root).onclick = () => { cur = new Date(y, m - 1, 1); draw(); };
      $('[data-next]', root).onclick = () => { cur = new Date(y, m + 1, 1); draw(); };
      $$('.cal-day.has', root).forEach(c => { const go = () => { sel = c.dataset.day; draw(); }; c.addEventListener('click', go); c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }); });
    };
    draw();
  }
  function initFilters() {
    $$('[data-filters]').forEach(bar => {
      const kind = bar.dataset.filters;
      bar.addEventListener('click', e => {
        const b = e.target.closest('button'); if (!b) return;
        $$('button', bar).forEach(x => x.classList.toggle('on', x === b));
        const f = b.dataset.f;
        const items = kind === 'acc' ? $$('[data-acc-grid] [data-cat]') : $$('[data-opp-grid] [data-cat]');
        items.forEach(it => { it.classList.toggle('hide', !(f === 'all' || it.dataset.cat === f)); it.classList.add('in'); });
      });
    });
  }
  /* lightbox */
  const lb = $('#lightbox'); let lbItems = [], lbI = 0;
  function lbShow(i) { lbI = (i + lbItems.length) % lbItems.length; const it = lbItems[lbI]; $('#lbImg').src = it.src; $('#lbImg').alt = it.cap; $('#lbCap').textContent = it.cap; }
  function lbOpen(items, i) { lbItems = items; lb.hidden = false; document.body.style.overflow = 'hidden'; lbShow(i); }
  function lbClose() { lb.hidden = true; document.body.style.overflow = ''; }
  $$('[data-lb-close]').forEach(b => b.onclick = lbClose);
  $('[data-lb-prev]').onclick = () => lbShow(lbI - 1);
  $('[data-lb-next]').onclick = () => lbShow(lbI + 1);
  lb.addEventListener('click', e => { if (e.target === lb) lbClose(); });
  function initLightbox() {
    $$('[data-gallery]').forEach(g => {
      const nodes = $$('[data-lb]', g);
      const items = nodes.map(n => ({ src: n.dataset.src, cap: n.dataset.cap }));
      nodes.forEach((n, i) => { if (n.dataset.bound) return; n.dataset.bound = 1; n.addEventListener('click', () => lbOpen(items, i)); });
    });
  }
  /* album photos that live in a Google Drive folder */
  async function initAlbum() {
    const g = $('[data-album-slug]'); if (!g || !CMS) return;
    const a = D.albums.find(x => x.slug === g.dataset.albumSlug);
    if (!a || !a.folder || photosOf(a).length) return;
    const ph = await CMS.albumPhotos(a);
    const note = $('[data-album-loading]');
    if (!ph || !ph.length) { if (note) note.textContent = 'Photos could not be loaded from Google Drive. Check the folder is shared with "Anyone with the link".'; return; }
    D.gallery = D.gallery.concat(ph.filter(p => !D.gallery.some(x => x.src === p.src)));
    if (note) note.remove();
    g.innerHTML = ph.map((p, i) => `<figure data-lb="${i}" data-src="${p.src}" data-cap="${esc(p.cap)}" class="reveal in"><img src="${p.thumb}" alt="${esc(p.cap)}" loading="lazy"><figcaption>${esc(p.cap)}</figcaption></figure>`).join('');
    initLightbox();
  }
  /* forms: the editor's inbox first, then the sheet script, then a pre-filled email */
  function initForms() {
    $$('form[data-form]').forEach(form => form.addEventListener('submit', async e => {
      e.preventDefault();
      const f = new FormData(form); const kind = form.dataset.form;
      if (f.get('website')) return;                                    // honeypot
      const fields = {}; f.forEach((v, k) => { if (k !== 'website') fields[k] = v; });
      const btn = $('button[type=submit]', form);
      const subject = kind === 'accomplishment' ? 'Accomplishment: ' + fields.what : kind === 'idea' ? 'Event idea: ' + fields.title : 'Feedback: ' + fields.type;
      const body = Object.entries(fields).map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}: ${v || '(blank)'}`).join('\n');
      const okMsg = kind === 'accomplishment' ? U().toastAcc : U().toastSent;
      if (CMS && CMS.siteSubmit) {
        btn.disabled = true;
        try { await CMS.siteSubmit(kind, fields); form.reset(); toast(okMsg); btn.disabled = false; return; } catch (err) { /* no backend here: fall through */ }
        btn.disabled = false;
      }
      if (CMS && CMS.config.formEndpoint) {
        btn.disabled = true;
        try { await CMS.submit(kind, fields); form.reset(); toast(okMsg); }
        catch (err) { toast(U().toastEmailFail); location.href = `mailto:${D.org.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; }
        btn.disabled = false; return;
      }
      location.href = `mailto:${D.org.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      form.classList.remove('sent'); void form.offsetWidth; form.classList.add('sent');
      toast(U().toastEmail);
    }));
  }
  /* countdowns */
  function tick() {
    $$('[data-countdown]').forEach(el => {
      const t = new Date(el.dataset.countdown).getTime();
      let diff = Math.max(0, t - nowMs());
      const d = Math.floor(diff / 864e5); diff -= d * 864e5;
      const h = Math.floor(diff / 36e5); diff -= h * 36e5;
      const mi = Math.floor(diff / 6e4); diff -= mi * 6e4;
      const s = Math.floor(diff / 1e3);
      const b = el.querySelectorAll('b');
      [d, h, mi, s].forEach((v, i) => { const txt = String(v).padStart(2, '0'); if (b[i].textContent !== txt) { b[i].textContent = txt; if (!reduce) { b[i].classList.remove('roll'); void b[i].offsetWidth; b[i].classList.add('roll'); } } });
    });
  }
  setInterval(tick, 1000);

  /* ---------- chrome: header, menu, modal, footer, toast ---------- */
  let toastT;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 4200); }
  const progress = document.createElement('div'); progress.className = 'progress'; $('#siteHead').appendChild(progress);
  let scrollTick = false;
  const onScroll = () => { $('#siteHead').classList.toggle('scrolled', scrollY > 10); const max = document.documentElement.scrollHeight - innerHeight; progress.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0); scrollTick = false; };
  addEventListener('scroll', () => { if (!scrollTick) { scrollTick = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  const mm = $('#mobileMenu');
  function openMenu() { mm.hidden = false; document.body.style.overflow = 'hidden'; $('#menuBtn').setAttribute('aria-expanded', 'true'); }
  function closeMenu() { if (mm.hidden) return; mm.hidden = true; document.body.style.overflow = ''; $('#menuBtn').setAttribute('aria-expanded', 'false'); }
  $('#menuBtn').onclick = openMenu; $('#menuClose').onclick = closeMenu;
  mm.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('click', e => {
    const b = e.target.closest('.nav-group > button');
    if (b) { const g = b.parentElement; const open = g.classList.toggle('open'); b.setAttribute('aria-expanded', open); $$('.nav-group').forEach(o => { if (o !== g) o.classList.remove('open'); }); return; }
    if (!e.target.closest('.nav-group')) $$('.nav-group.open').forEach(g => g.classList.remove('open'));
  });
  const dm = $('#donateModal');
  function openDonate() { if (D.links.donate) { window.open(D.links.donate, '_blank', 'noopener'); return; } dm.hidden = false; document.body.style.overflow = 'hidden'; setTimeout(() => $('.modal-x', dm).focus(), 50); }
  function closeDonate() { dm.hidden = true; document.body.style.overflow = ''; }
  document.addEventListener('click', e => { if (e.target.closest('[data-donate]')) { e.preventDefault(); closeMenu(); openDonate(); } if (e.target.closest('[data-close]')) closeDonate(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDonate(); lbClose(); closeMenu(); $$('.nav-group.open').forEach(g => g.classList.remove('open')); } if (!lb.hidden) { if (e.key === 'ArrowRight') lbShow(lbI + 1); if (e.key === 'ArrowLeft') lbShow(lbI - 1); } });

  /* menu, footer, logo, colors and panel text (refreshed when saved content arrives or the editor previews a draft) */
  function navHTML() {
    const N = D.nav;
    const group = (label, items) => `<div class="nav-group"><button type="button" aria-expanded="false">${esc(label)} ${ico('i-chev')}</button><div class="nav-panel">${items.map(([href, key, l, sub]) => `<a href="${href}" data-nav="${key}"><b>${esc(l)}</b><span>${esc(sub)}</span></a>`).join('')}</div></div>`;
    return `<a href="#/" data-nav="">${esc(N.home)}</a><a href="#/about" data-nav="about">${esc(N.about)}</a><a href="#/events" data-nav="events">${esc(N.events)}</a><a href="#/board" data-nav="board">${esc(N.board)}</a><a href="#/mot" data-nav="mot">${esc(N.mot)}</a><a href="#/icc" data-nav="icc">${esc(N.icc)}</a>`
      + group(N.members, [['#/accomplishments', 'accomplishments', N.accomplishments, N.accomplishmentsSub], ['#/leadership', 'leadership', N.leadership, N.leadershipSub], ['#/opportunities', 'opportunities', N.opportunities, N.opportunitiesSub]])
      + group(N.news, [['#/newsletter', 'newsletter', N.newsletter, N.newsletterSub], ['#/blog', 'blog', N.blog, N.blogSub], ['#/gallery', 'gallery', N.gallery, N.gallerySub]])
      + `<a href="#/involved" data-nav="involved">${esc(N.involved)}</a>`;
  }
  function menuHTML() {
    const N = D.nav;
    return `<div><h4>${esc(N.groupChapter)}</h4><a href="#/">${esc(N.home)}</a><a href="#/about">${esc(N.about)}</a><a href="#/events">${esc(N.events)}</a><a href="#/board">${esc(N.board)}</a><a href="#/mot">${esc(N.mot)}</a><a href="#/icc">${esc(N.icc)}</a></div>
      <div><h4>${esc(N.groupMembers)}</h4><a href="#/accomplishments">${esc(N.accomplishments)}</a><a href="#/accomplishments#leaderboard">${esc(N.leaderboard)}</a><a href="#/leadership">${esc(N.leadership)}</a><a href="#/opportunities">${esc(N.opportunities)}</a></div>
      <div><h4>${esc(N.groupNews)}</h4><a href="#/newsletter">${esc(N.newsletter)}</a><a href="#/blog">${esc(N.blog)}</a><a href="#/gallery">${esc(N.gallery)}</a></div>
      <div><h4>${esc(N.groupJoin)}</h4><a href="#/involved">${esc(N.involved)}</a><a href="#/involved#ideas">${esc(N.ideas)}</a><a href="#/involved#feedback">${esc(N.feedback)}</a><button type="button" class="linklike" data-donate>${esc(N.donate)}</button></div>`;
  }
  const hexOk = v => /^#[0-9a-f]{6}$/i.test(v || '');
  function shade(hex, dl) {
    const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b); let h = 0, s = 0, l = (max + min) / 2;
    if (max !== min) { const d = max - min; s = l > .5 ? d / (2 - max - min) : d / (max + min); h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
    l = Math.max(0, Math.min(1, l + dl / 100));
    const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    const f = t => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < .5 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    const to = x => Math.round(x * 255).toString(16).padStart(2, '0');
    return s === 0 ? '#' + to(l) + to(l) + to(l) : '#' + to(f(h + 1 / 3)) + to(f(h)) + to(f(h - 1 / 3));
  }
  function applyLook() {
    const L = D.look || {}, r = document.documentElement.style;
    if (hexOk(L.navy)) { r.setProperty('--navy', L.navy); r.setProperty('--navy-2', shade(L.navy, 5)); r.setProperty('--navy-3', shade(L.navy, 10)); r.setProperty('--navy-deep', shade(L.navy, -6)); const m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', L.navy); }
    if (hexOk(L.gold)) { r.setProperty('--gold', L.gold); r.setProperty('--gold-2', shade(L.gold, 7)); r.setProperty('--gold-deep', shade(L.gold, -14)); r.setProperty('--gold-soft', shade(L.gold, 38)); }
    if (hexOk(L.bg)) { r.setProperty('--bg-2', L.bg); r.setProperty('--bg-3', shade(L.bg, -4)); }
    const fp = (D.fontPairs || {})[L.fonts];
    if (fp) {
      r.setProperty('--fh', `'${fp.heading}','Inter',system-ui,sans-serif`); r.setProperty('--ff', `'${fp.body}',system-ui,sans-serif`);
      const link = $('#fontLink'), href = `https://fonts.googleapis.com/css2?family=${fp.css}&display=swap`;
      if (link && link.getAttribute('href') !== href) link.setAttribute('href', href);
    }
    document.documentElement.classList.toggle('no-fx', NOFX || L.motion === false);
  }
  function chrome() {
    const F = D.copy.footer, M = D.copy.donate, N = D.nav;
    applyLook();
    // two lines like the official lockup: break at a | or a line break if the board typed one, else before the last word
    const captionLines = s => { const c = String(s || '').trim(); const parts = c.includes('|') ? c.split('|') : c.includes('\n') ? c.split('\n') : c.replace(/\s+(\S+)$/, '\u0000$1').split('\u0000'); return parts.map(x => `<span>${esc(x.trim())}</span>`).join(''); };
    const caption = logoSrc() ? '' : `<span class="brand-ama">${captionLines(N.brandCaption)}</span>`;
    $('#brandLockup').innerHTML = markSvg('brand-mark') + caption;
    $('#brandText').textContent = N.brandSchool;
    $('#navMain').innerHTML = navHTML();
    $('#mmGroups').innerHTML = menuHTML(); $('#mmTitle').textContent = N.menuTitle; $('#headDonateLabel').textContent = N.donate; $('#skipLink').textContent = N.skip;
    $('#footLockup').innerHTML = markSvg('foot-mark') + caption;
    const grid = $('#footGrid'); $$('.foot-col', grid).forEach(x => x.remove());
    (D.footerColumns || []).forEach(col => grid.insertAdjacentHTML('beforeend', `<div class="foot-col"><h4>${esc(col.title)}</h4>${(col.links || []).map(l => `<a href="${l.href}" ${/^https?:/.test(l.href) ? 'target="_blank" rel="noopener"' : ''}>${esc(l.label)}</a>`).join('')}</div>`));
    grid.style.setProperty('--cols', (D.footerColumns || []).length || 3);
    $('#footOrg').textContent = D.org.short; $('#footAddress').textContent = D.org.address;
    $('#footTitle').textContent = F.title; $('#footText').textContent = F.text; $('#footTags').textContent = F.tags + ' · '; $('#footNote').textContent = F.concept; $('#footAdmin').textContent = F.login;
    $('#donateEyebrow').textContent = M.eyebrow; $('#donateTitle').innerHTML = title(M.title); $('#donateText').textContent = M.text; $('#donateNote').textContent = M.footnote + ' ';
    $('#donateOpts').innerHTML = [
      D.links.venmo ? [U().venmo, M.venmoNote, D.links.venmo, '#3D95CE', 'V'] : null,
      D.links.cashapp ? [U().cashApp, M.cashNote, D.links.cashapp, '#00C244', '$'] : null
    ].filter(Boolean).map(([t, d, h, c, l]) => `<a href="${h}" target="_blank" rel="noopener"><span class="ico" style="background:${c}">${l}</span><div>${esc(t)}<span>${esc(d)}</span></div></a>`).join('');
    $('#donateMail').href = `mailto:${D.org.email}`; $('#donateMail').textContent = D.org.email;
    $('#footSocial').innerHTML = socialRow(); $('#mmSocial').innerHTML = socialRow();
    $('#footMail').href = `mailto:${D.org.email}`; $('#footMail').textContent = D.org.email;
  }
  chrome();
  $('#year').textContent = new Date().getFullYear();

  render(false);
  /* pull the board's saved content / sheet, then redraw the current page if anything changed */
  if (CMS) CMS.load().then(r => { if (r && r.changed) { chrome(); render(true); } });
  window.AMA_TEST = { NOW, TODAY, upcoming, past, render, pages, chrome };
})();
