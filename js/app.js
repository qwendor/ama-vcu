/* =====================================================================
   AMA at VCU  |  app
   Hash-routed single page site. Content comes from js/data.js, and from the
   board's Google Sheet / Calendar / Drive when js/cms.js is configured.
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
  const MARK_VB = '0 0 288 110';
  const markSvg = (cls = '', label = 'American Marketing Association') => `<svg class="${cls}" viewBox="${MARK_VB}" role="img" aria-label="${label}"><use href="#mark"/></svg>`;
  const shortRole = r => r.replace(/^Director of /, '').replace(/ of Events & Operations$/, '').replace(/^Community Outreach$/, 'Outreach');
  const ext = (href, label, cls = 'btn btn-gold') => `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${label} ${ico('i-ext')}</a>`;
  const route = (href, label, cls = 'btn btn-navy') => `<a class="${cls}" href="${href}">${label} ${ico('i-arrow')}</a>`;
  const mailBtn = (subject, label, cls = 'btn btn-ghost btn-sm') => `<a class="${cls}" href="mailto:${D.org.email}?subject=${encodeURIComponent(subject)}">${ico('i-mail')} ${label}</a>`;
  const pageHead = (eyebrow, title, lede, extra = '') => `
    <section class="page-head">
      <div class="wrap">
        <p class="eyebrow">${esc(eyebrow)}</p>
        <h1 class="h-lg">${title}</h1>
        ${lede ? `<p class="lede">${lede}</p>` : ''}
        ${extra}
      </div>
    </section>`;
  const placeholder = (title, text, cta = '') => `<div class="card placeholder-card"><span class="chip">Coming soon</span><h3 class="h-sm" style="margin-top:8px">${esc(title)}</h3><p class="muted" style="margin:0">${esc(text)}</p>${cta ? `<div class="btn-row" style="margin-top:12px">${cta}</div>` : ''}</div>`;
  const duesLabel = () => D.membership.duesMax && D.membership.duesMax !== D.membership.dues ? `$${D.membership.dues}–${D.membership.duesMax}` : `$${D.membership.dues}`;
  const duesWords = () => D.membership.duesMax && D.membership.duesMax !== D.membership.dues ? `$${D.membership.dues} to $${D.membership.duesMax}` : `$${D.membership.dues}`;
  const motApply = () => D.links.motApplication || D.agency.applyUrl;

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
  const galleryFull = g => g.src || `assets/img/gallery/${g.f}.webp`;
  const galleryThumb = g => g.thumb || g.src || `assets/img/gallery/t/${g.f}.webp`;

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
    if (e.tba) return `<div class="btn-row"><span class="locked">${ico('i-clock')} Date announced on Instagram</span>${ext(D.links.instagram, 'Follow @amavcu', 'btn btn-gold btn-sm')}</div>`;
    const reg = ext(e.rsvp || D.links.ramsconnectEvents, 'Register on RamsConnect', 'btn btn-gold btn-sm');
    return showLoc() ? `<div class="btn-row">${reg}</div>` : `<div class="btn-row"><span class="locked">${ico('i-lock')} Location on RamsConnect</span>${reg}</div>`;
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
      ${e.img ? `<div class="ev-art"><img src="${e.img}" alt="" loading="lazy"></div>` : ''}
    </article>`;
  }

  /* ---------- components ---------- */
  const li = m => m.linkedin ? { href: m.linkedin, label: 'LinkedIn' } : { href: `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(m.name + ' VCU')}`, label: 'Find on LinkedIn' };
  function boardCard(m, i) {
    const l = li(m);
    return `<article class="member reveal d${(i % 3) + 1}">
      <a class="frame" href="#/board/${m.slug}"><img src="assets/img/board/${m.slug}.webp" alt="${esc(m.name)}" loading="lazy"></a>
      <div class="member-body">
        <h3><a href="#/board/${m.slug}">${esc(m.name)}</a></h3>
        <div class="member-role"><span class="role">${esc(m.role)}</span><a class="li-btn" href="${l.href}" target="_blank" rel="noopener">${ico('i-in')} ${l.label}</a></div>
        <div class="member-info">
          <div><b>Year and major</b> ${esc(m.year)}, ${esc(m.major)}</div>
          <div><b>Career goal</b> ${esc(m.goal)}</div>
          <div><b>Fun fact</b> ${esc(m.fun)}</div>
        </div>
        <a class="textlink small-link" href="#/board/${m.slug}">Profile ${ico('i-arrow')}</a>
      </div>
    </article>`;
  }
  function advisorCard(cls = '') {
    const a = D.org.advisor;
    return `<article class="member advisor ${cls}">
      <div class="frame ${a.photo ? '' : 'ph'}">${a.photo ? `<img src="${a.photo}" alt="${esc(a.name)}" loading="lazy">` : `<div class="ph-face">${monogram(a.name)}<span>Headshot coming</span></div>`}</div>
      <div class="member-body">
        <h3>${esc(a.name)}</h3>
        <div class="member-role"><span class="role">${esc(a.title)}</span>${a.linkedin ? `<a class="li-btn" href="${a.linkedin}" target="_blank" rel="noopener">${ico('i-in')} LinkedIn</a>` : ''}</div>
        <div class="member-info">
          <div>${esc(a.role)}</div>
          ${a.bio ? `<div>${esc(a.bio)}</div>` : `<div class="muted">Bio coming from the board.</div>`}
        </div>
      </div>
    </article>`;
  }
  function boardTile(m) {
    return `<a href="#/board/${m.slug}" title="${esc(m.name)}, ${esc(m.role)}"><img src="assets/img/board/${m.slug}.webp" alt="${esc(m.name)}" loading="lazy"><figcaption>${esc(m.name.split(' ')[0])}<small>${esc(shortRole(m.role))}</small></figcaption></a>`;
  }
  function advisorTile() {
    const a = D.org.advisor;
    return `<a href="#/board#advisor" title="${esc(a.name)}, ${esc(a.title)}">${a.photo ? `<img src="${a.photo}" alt="${esc(a.name)}" loading="lazy">` : `<div class="tile-ph">${monogram(a.name)}</div>`}<figcaption>${esc(a.name.split(' ')[0])}<small>${esc(a.title)}</small></figcaption></a>`;
  }
  function pillarsRow() {
    return `<div class="pillars-row">${D.pillars.map(p => `<div class="pillar"><span class="pillar-ico">${ico(p.icon)}</span><h3>${esc(p.name)}</h3><p>${esc(p.short)}</p></div>`).join('')}</div>`;
  }
  function countdown(target, cls = '') {
    return `<div class="countdown ${cls}" data-countdown="${target}">
      <div><b>0</b><span>days</span></div><div><b>0</b><span>hours</span></div><div><b>0</b><span>min</span></div><div><b>0</b><span>sec</span></div>
    </div>`;
  }
  function postCard(p, big = false) {
    return `<a class="post-card ${big ? 'big' : ''} reveal" href="#/blog/${p.slug}">
      <div class="pc-img"><img src="${big ? p.cover : p.thumb}" alt="" loading="lazy"></div>
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
    const L = D.links;
    const s = [['i-ig', 'Instagram', '@amavcu, where everything drops first', L.instagram], ['i-users', 'GroupMe', 'Reminders, polls and rides', L.groupme], ['i-in', 'LinkedIn', 'Follow the chapter page', L.linkedin], ['i-ext', 'RamsConnect', 'Register for every event here', L.ramsconnect]];
    return `<div class="social-big">${s.map(([i, t, d, h]) => `<a href="${h}" target="_blank" rel="noopener">${ico(i)}<b>${t}</b><span>${d}</span></a>`).join('')}</div>`;
  }
  function medal(place) {
    if (place === 0) return `<span class="medal">★</span>`;
    return `<span class="medal ${place <= 3 ? 'm' + place : ''}">${place}${place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'}</span>`;
  }
  function photosOf(album) {
    return D.gallery.filter(g => g.album === album.name);
  }
  function albumCover(a) {
    const ph = photosOf(a);
    const key = a.cover && D.gallery.find(g => g.f === a.cover);
    const src = key ? `assets/img/gallery/${key.f}.webp` : a.cover ? a.cover : ph.length ? galleryFull(ph[0]) : '';
    const n = ph.length;
    return `<a class="album reveal" href="#/gallery/${a.slug}">
      <div class="album-img">${src ? `<img src="${src}" alt="" loading="lazy">` : `<div class="album-empty">${ico('i-ig')}</div>`}</div>
      <div class="album-body"><span class="chip">${a.date ? fmt(a.date, { month: 'short', year: 'numeric' }) : 'Album'}</span><h3>${esc(a.name)}</h3><p>${esc(a.blurb || '')}</p><span class="album-count">${n ? `${n} photo${n === 1 ? '' : 's'}` : a.folder ? 'Photos on Drive' : 'Coming soon'} ${ico('i-arrow')}</span></div>
    </a>`;
  }
  function consultantCard(c) {
    return `<article class="person reveal">
      <div class="person-photo">${photoOr(c.photo, c.name)}</div>
      <h3>${esc(c.name)}</h3>
      <span class="role">${esc(c.title || 'Consultant')}</span>
      ${c.expertise ? `<p class="small"><b>Expertise</b> ${esc(c.expertise)}</p>` : ''}
      ${c.bio ? `<p class="small muted">${esc(c.bio)}</p>` : ''}
      ${c.linktree ? ext(c.linktree, 'Linktree', 'btn btn-navy btn-sm') : ''}
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
    return `<div class="hero-credit">Campus photos: ${[...seen.values()].map(s => s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.credit)}</a>` : esc(s.credit)).join(', ')} (${[...new Set(slides.map(s => s.license))].join(', ')})</div>`;
  }

  pages.home = () => {
    const ups = upcoming();
    const icc = D.icc;
    const wins26 = icc.results[0].wins.length;
    const days = daysUntil(icc.start.slice(0, 10));
    const thisMonth = ups.some(e => e.date.slice(0, 7) === TODAY.slice(0, 7));
    const shown = ups.slice(0, 3);
    const feats = [
      { h: 'Compete', p: 'Perfect Pitch, the Sales Competition, case and strategy rounds against 150+ chapters.', img: 'assets/img/gallery/mw-04.webp' },
      { h: 'Learn', p: 'Keynotes and workshops from marketers at the top of the industry.', img: 'assets/img/gallery/mw-13.webp' },
      { h: 'Network', p: 'A recruiter hall and 1,600 students who do what you do.', img: 'assets/img/gallery/mw-14.webp' },
      { h: 'Travel', p: 'Three days in New Orleans with the chapter, fundraised together.', img: 'assets/img/gallery/mw-02.webp' }
    ];
    return `
    <section class="hero" id="top">
      ${heroBackground()}
      <div class="hero-inner">
        <div class="hero-mark">${markSvg()}</div>
        <span class="hero-school">Virginia Commonwealth University</span>
        <h1>American Marketing Association</h1>
        <p class="tagline">${esc(D.org.tagline)} Learn from people in the industry, compete on a national stage, and find your people over coffee. Open to every major.</p>
        <div class="btn-row">
          <a class="btn btn-gold btn-lg" href="#/involved#join">Become a member</a>
          <a class="btn btn-ghost btn-lg" href="#/events">Upcoming events</a>
        </div>
      </div>
      ${heroCredit()}
      <div class="hero-strip"><div class="wrap">
        <div class="stat"><b>${D.org.founded}</b><span>Founded</span></div>
        <div class="stat"><b data-count="${wins26}">${wins26}</b><span>ICC 2026 placements</span></div>
        <div class="stat"><b data-count="${days}">${days}</b><span>Days to ICC 2027</span></div>
        <div class="stat"><b>${duesLabel()}</b><span>Annual dues</span></div>
      </div></div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="intro">
          <div class="reveal">
            <p class="eyebrow">What is AMA at VCU</p>
            <h2 class="h-lg">Real-world marketing experience, on campus.</h2>
            <p class="lede" style="margin-top:14px">${esc(D.org.blurb)}</p>
            <div class="btn-row" style="margin-top:20px">${route('#/about', 'About the chapter', 'btn btn-navy')}${route('#/involved#join', 'How to join', 'btn btn-ghost')}</div>
          </div>
          <div class="reveal d2">
            <div class="video-box" data-video>
              <img src="${D.video.poster}" alt="">
              <button type="button" class="video-play" data-play><span class="play">${ico('i-play')}</span>${esc(D.video.title)}</button>
              ${!(D.video.youtube || D.video.instagram || D.video.mp4) ? `<span class="tag-pill sm video-note">Video coming soon</span>` : ''}
            </div>
          </div>
        </div>
        <div class="reveal" style="margin-top:clamp(34px,5vw,56px)">
          <p class="eyebrow">Three pillars</p>
          ${pillarsRow()}
        </div>
      </div>
    </section>

    <section class="section s-cream" id="upnext">
      <div class="wrap">
        <div class="sec-head reveal">
          <div><p class="eyebrow">Upcoming events</p><h2 class="h-lg">${thisMonth ? 'Events this month' : 'Coming up'}</h2></div>
          <a class="textlink more" href="#/events">Full calendar ${ico('i-arrow')}</a>
        </div>
        <div class="bento">
          <div class="span7 reveal"><div class="ev-list">${shown.map(evItem).join('')}${tba().slice(0, 1).map(evItem).join('')}${shown.length < 2 ? `<div class="card flat"><b>New events post on RamsConnect and Instagram first.</b><p class="small muted" style="margin:6px 0 12px">Coffee chats, speakers and competitions are added through the semester.</p><div class="btn-row">${ext(D.links.ramsconnectEvents, 'RamsConnect', 'btn btn-navy btn-sm')}${route('#/events', 'Past events', 'btn btn-ghost btn-sm')}</div></div>` : ''}</div></div>
          <article class="card navy span5 reveal d1">
            <span class="chip">${esc(icc.city)}</span>
            <h3 class="h-md" style="margin-top:10px">${esc(icc.short)} countdown</h3>
            <p class="small" style="opacity:.85">${esc(icc.dates)}. Applications are open.</p>
            ${countdown(icc.start)}
            <div class="btn-row">${ext(D.links.iccApplication, 'Apply to go', 'btn btn-gold btn-sm')}${route('#/icc', 'Learn more', 'btn btn-ghost btn-sm')}</div>
          </article>
        </div>
      </div>
    </section>

    <section class="section s-gold">
      <div class="wrap">
        <div class="sec-head reveal">
          <div><p class="eyebrow">International Collegiate Conference</p><h2 class="h-lg">ICC 2027: ${esc(icc.city)}, ${esc(icc.dates)}</h2></div>
          <div class="btn-row">${ext(D.links.iccApplication, 'Apply to go', 'btn btn-navy')}${route('#/icc', 'Learn more', 'btn btn-ghost')}</div>
        </div>
        <div class="feature-cards reveal">${feats.map(f => `<div class="feature"><img src="${f.img}" alt="" loading="lazy"><div><h4>${f.h}</h4><p>${f.p}</p></div></div>`).join('')}</div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="sec-head reveal">
          <div><p class="eyebrow">${D.org.year} executive board</p><h2 class="h-lg">The people behind the chapter</h2></div>
          <a class="textlink more" href="#/board">Full bios ${ico('i-arrow')}</a>
        </div>
        <div class="board-row ten reveal">${D.board.map(boardTile).join('')}${advisorTile()}</div>
      </div>
    </section>

    <section class="section s-cream">
      <div class="wrap">
        <div class="sec-head reveal">
          <div><p class="eyebrow">In case you missed it</p><h2 class="h-lg">Recaps and photo dumps</h2></div>
          <div class="btn-row"><a class="textlink" href="#/newsletter">${esc(D.newsletter.current.month)} newsletter ${ico('i-arrow')}</a><a class="textlink more" href="#/blog">All posts ${ico('i-arrow')}</a></div>
        </div>
        <div class="grid g3">${D.posts.slice(0, 3).map(p => postCard(p)).join('')}</div>
      </div>
    </section>

    <section class="section">
      <div class="wrap split" style="align-items:start">
        <div class="reveal"><p class="eyebrow">FAQ</p><h2 class="h-lg">Questions people ask</h2><p class="lede" style="margin-top:12px">Still stuck? Email <a href="mailto:${D.org.email}">${D.org.email}</a> or DM us on Instagram.</p><div class="social-row on-light" style="margin-top:18px">${socialRow()}</div></div>
        <div class="faq reveal d2">${D.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>
      </div>
    </section>`;
  };

  pages.about = () => {
    const m = D.membership;
    return `
    ${pageHead('About us', `The only marketing org at VCU, <em class="serif gold">since 1983.</em>`, 'AMA at VCU is the collegiate chapter of the American Marketing Association on the VCU campus: a student-run community for anyone who wants to learn marketing from the people who do it, and a bridge to AMA Richmond, the professional chapter a few blocks away.')}
    <section class="section s-cream">
      <div class="wrap split">
        <div class="reveal">
          <p class="eyebrow">Our purpose</p>
          <p class="quote">"To give members the resources and community to develop their marketing and business skills outside the classroom."</p>
          <p>That means guest speakers, workshops, study groups, a student-run agency and a delegation at the International Collegiate Conference every spring. It also means coffee chats on Sundays, raffles at interest meetings and a group chat that actually answers.</p>
          <p>Membership is open to every major. Our ICC winners include psychology, philosophy and information systems students.</p>
          <div class="btn-row" style="margin-top:6px">${route('#/involved#join', 'Join the chapter')}${route('#/board', 'Meet the board', 'btn btn-ghost')}</div>
        </div>
        <div class="reveal d2 numbers" style="grid-template-columns:repeat(2,1fr)">
          <div class="num"><b>${D.org.founded}</b><span>Founded (reinstated ${D.org.reinstated})</span></div>
          <div class="num"><b data-count="${D.icc.results[0].wins.length}">${D.icc.results[0].wins.length}</b><span>ICC 2026 placements</span></div>
          <div class="num"><b data-count="${m.activePoints}">${m.activePoints}</b><span>Points to Active Member</span></div>
          <div class="num"><b>${duesLabel()}</b><span>Dues for the whole year</span></div>
        </div>
      </div>
    </section>
    <section class="section">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">How the chapter fits together</p><h2 class="h-lg">Three organizations, one membership</h2></div></div>
        <div class="grid g3">
          <div class="card reveal"><span class="chip navy">On campus</span><h3 class="h-sm" style="margin-top:8px">AMA at VCU</h3><p style="margin:0">Housed in the VCU School of Business and advised by ${esc(D.org.advisor.name)}. The Center for Professional Selling coaches our competition teams. Events, the agency and the ICC trip all start here.</p></div>
          <div class="card reveal d1"><span class="chip navy">In Richmond</span><h3 class="h-sm" style="margin-top:8px">AMA Richmond</h3><p style="margin:0 0 10px">The professional chapter: mixers, speakers and a local job board where members meet the people hiring in this city.</p>${ext(D.links.amaRichmond, 'amarichmond.org', 'btn btn-ghost btn-sm')}</div>
          <div class="card reveal d2"><span class="chip navy">Nationwide</span><h3 class="h-sm" style="margin-top:8px">AMA national</h3><p style="margin:0 0 10px">Chapter dues include AMA national membership: the Career Center, webinars, certifications and the International Collegiate Conference.</p>${ext(D.links.amaNational, 'ama.org', 'btn btn-ghost btn-sm')}</div>
        </div>
      </div>
    </section>
    <section class="section s-navy deep">
      <div class="wrap split">
        <div class="reveal">
          <p class="eyebrow">History</p>
          <h2 class="h-lg">A short <em class="serif gold">timeline</em></h2>
          <ul class="timeline" style="margin:24px 0 0;padding-left:28px">
            <li><b>1983</b><span>VCU's AMA chapter is founded.</span></li>
            <li><b>2008</b><span>The chapter is reinstated and has run every year since.</span></li>
            <li><b>April 2024</b><span>Clean sweep of the Perfect Pitch podium at ICC in New Orleans.</span></li>
            <li><b>March 2026</b><span>Eight placements in Chicago, including first in the Design Lab Marketing Competition.</span></li>
            <li><b>April 2027</b><span>ICC heads back to New Orleans. We are going.</span></li>
          </ul>
        </div>
        <div class="reveal d2">
          <div class="frame"><img src="assets/img/board-group.webp" alt="The ${D.org.year} executive board"></div>
        </div>
      </div>
    </section>`;
  };

  pages.events = () => `
    ${pageHead('Events', `What's <em class="serif gold">happening</em>`, `Coffee chats, speakers, competitions and service days. Upcoming events show the date and time here${showLoc() ? '' : '; the room or address is on RamsConnect, where you register'}.`, `<div class="btn-row" style="margin-top:18px">${ext(D.links.googleCalendar, 'Add our Google Calendar', 'btn btn-gold')}${ext(D.links.ramsconnectEvents, 'Register on RamsConnect', 'btn btn-ghost')}</div>`)}
    <section class="section s-cream">
      <div class="wrap">
        <div class="sec-head">
          <div class="ev-toggle" role="tablist"><button class="on" data-view="list">List</button><button data-view="cal">Calendar</button></div>
          ${showLoc() ? '' : `<span class="locked">${ico('i-lock')} Locations unlock on RamsConnect</span>`}
        </div>
        <div data-view-list>
          <p class="month-label">Coming up</p>
          <div class="ev-list">${upcoming().map(evItem).join('')}${tba().map(evItem).join('')}${upcoming().length ? '' : `<div class="card flat"><b>New events post on RamsConnect and Instagram first.</b><p class="small muted" style="margin:6px 0 0">Check back soon, or add the Google Calendar above.</p></div>`}</div>
          ${(() => { const p = past(); let cur = ''; let out = ''; p.forEach(e => { const d = pd(e.date); const key = MON[d.getMonth()] + ' ' + d.getFullYear(); if (key !== cur) { cur = key; out += `<p class="month-label">${key} · recap</p>`; } out += evItem(e); }); return `<div class="ev-list">${out}</div>`; })()}
        </div>
        <div data-view-cal hidden><div class="cal" data-cal></div></div>
      </div>
    </section>`;

  pages.board = () => `
    ${pageHead(`${D.org.year} executive board`, `The people behind <em class="serif gold">@amavcu</em>`, 'Nine students run the chapter: events, finance, membership, fundraising, outreach, communications and social media, with a senior advisor keeping us honest and a faculty advisor in the School of Business. Say hi at the next coffee chat.')}
    <section class="section s-navy deep">
      <div class="wrap">
        <div class="board-grid">${D.board.map(boardCard).join('')}</div>
        <div class="split" style="margin-top:26px;align-items:stretch" id="advisor">
          ${advisorCard('reveal')}
          <div class="card gold reveal d2 next-year"><span class="chip navy">Leadership</span><h3 class="h-md" style="margin-top:8px">Want to be on this page next year?</h3><p>${esc(D.leadership.season)}</p><div class="btn-row">${D.links.boardApplication ? ext(D.links.boardApplication, 'Board application', 'btn btn-navy btn-sm') : mailBtn('Interested in the AMA board', 'Email about the board', 'btn btn-navy btn-sm')}${route('#/leadership', 'Leadership paths', 'btn btn-ghost btn-sm')}</div>${D.links.boardApplication ? '' : `<p class="small muted" style="margin:12px 0 0">The application form link goes here when the board publishes it.</p>`}</div>
        </div>
      </div>
    </section>`;

  pages.member = slug => {
    const i = D.board.findIndex(m => m.slug === slug);
    if (i < 0) return pages.board();
    const m = D.board[i], l = li(m);
    const prev = D.board[(i - 1 + D.board.length) % D.board.length], next = D.board[(i + 1) % D.board.length];
    return `
    <section class="page-head"><div class="wrap"><a class="textlink back" href="#/board">${ico('i-arrow')} Executive board</a></div></section>
    <section class="section s-cream">
      <div class="wrap profile">
        <div class="frame reveal"><img src="assets/img/board/${m.slug}.webp" alt="${esc(m.name)}"></div>
        <div class="reveal d1">
          <span class="chip navy">${esc(m.role)}</span>
          <h1 class="h-lg" style="margin:12px 0 6px">${esc(m.name)}</h1>
          <p class="lede">${esc(m.year)}, ${esc(m.major)}</p>
          ${m.bio ? `<p>${esc(m.bio)}</p>` : ''}
          <div class="profile-facts">
            <div><b>Career goal</b><span>${esc(m.goal)}</span></div>
            <div><b>Fun fact</b><span>${esc(m.fun)}</span></div>
            <div><b>Board year</b><span>${esc(D.org.year)}</span></div>
          </div>
          <div class="btn-row" style="margin-top:22px"><a class="btn btn-navy" href="${l.href}" target="_blank" rel="noopener">${ico('i-in')} ${l.label}</a>${mailBtn('Hello from the website, for ' + m.name.split(' ')[0], 'Email the board', 'btn btn-ghost')}</div>
          <div class="profile-nav"><a href="#/board/${prev.slug}">${ico('i-arrow')} ${esc(prev.name)}</a><a href="#/board/${next.slug}">${esc(next.name)} ${ico('i-arrow')}</a></div>
        </div>
      </div>
    </section>`;
  };

  pages.mot = () => {
    const A = D.agency;
    return `
    ${pageHead('Our student-run agency', `<em class="serif gold">${esc(A.name)}</em>`, esc(A.pitch), `<div class="btn-row" style="margin-top:18px">${ext(motApply(), 'Apply to MoT')}${mailBtn('Working with Marketers of Tomorrow', 'Bring us a project', 'btn btn-ghost')}</div>`)}
    <section class="section s-cream">
      <div class="wrap">
        <div class="card gold reveal" style="margin-bottom:30px;display:flex;gap:16px;align-items:center;flex-wrap:wrap">${ico('i-clock')}<b>${esc(A.status)}</b></div>
        <div class="sec-head reveal"><div><p class="eyebrow">How it works</p><h2 class="h-lg">Real clients, <em class="serif navy">real work</em></h2></div></div>
        <div class="steps reveal">${A.how.map(s => `<div class="step"><b>${esc(s.t)}</b><p>${esc(s.d)}</p></div>`).join('')}</div>
        <div class="split" style="margin-top:46px">
          <div class="reveal"><p class="eyebrow">Roles</p><h2 class="h-md">Pick a lane, or try all five</h2><div class="roles" style="margin:14px 0 20px">${A.roles.map(r => `<span class="tag-pill sm">${esc(r)}</span>`).join('')}</div><p>Teams are small on purpose. Everyone presents, everyone ships something they can show a recruiter.</p></div>
          <div class="reveal d2"><div class="frame"><img src="assets/img/gallery/mw-03.webp" alt="A team working around a table"></div></div>
        </div>
      </div>
    </section>
    <section class="section" id="services">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">Areas of concentration</p><h2 class="h-lg">What MoT does for clients</h2></div></div>
        ${A.concentrations.length ? `<div class="grid g3">${A.concentrations.map((c, i) => `<div class="card reveal d${(i % 3) + 1}"><h3 class="h-sm">${esc(c.t)}</h3><p style="margin:0">${esc(c.d || '')}</p></div>`).join('')}</div>` : placeholder('Concentrations and services', 'MoT leadership is finalizing the list of services the agency offers. Until then, the roles above are the best guide to the work.', mailBtn('Working with Marketers of Tomorrow', 'Ask about a project'))}
      </div>
    </section>
    <section class="section s-cream" id="consultants">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">The team</p><h2 class="h-lg">Meet the consultants</h2></div><p>Each consultant lists what they offer and how to connect. Reach out through their Linktree.</p></div>
        ${A.consultants.length ? `<div class="people">${A.consultants.map(consultantCard).join('')}</div>` : placeholder('This semester’s consultants', 'Headshots, roles, areas of expertise and Linktree links for the current cohort are being collected from MoT. Check back soon.', ext(motApply(), 'Apply to join them', 'btn btn-navy btn-sm'))}
        <div class="sec-head reveal" style="margin-top:56px"><div><p class="eyebrow">Leadership</p><h2 class="h-lg">Who runs MoT</h2></div></div>
        <div class="people leaders">${A.leadership.map(l => `<article class="person reveal"><div class="person-photo">${photoOr(l.photo, l.name)}</div><h3>${esc(l.name)}</h3><span class="role">${esc(l.title)}</span>${l.bio ? `<p class="small muted">${esc(l.bio)}</p>` : `<p class="small muted">Bio coming soon.</p>`}${l.linktree ? ext(l.linktree, 'Linktree', 'btn btn-navy btn-sm') : ''}</article>`).join('')}</div>
      </div>
    </section>
    <section class="section" id="clients">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">Clients and partners</p><h2 class="h-lg">Who we have worked with</h2></div></div>
        ${A.clients.length || A.partners.length ? `<div class="grid g2">${[['Past clients', A.clients], ['Partners', A.partners]].filter(x => x[1].length).map(([h, list]) => `<div class="card reveal"><span class="chip navy">${h}</span><div class="client-list">${list.map(c => `<div>${c.url ? `<a href="${c.url}" target="_blank" rel="noopener"><b>${esc(c.name)}</b></a>` : `<b>${esc(c.name)}</b>`}${c.note ? `<span>${esc(c.note)}</span>` : ''}</div>`).join('')}</div></div>`).join('')}</div>` : placeholder('Past clients and business partners', 'The client list and the organizations MoT has partnered with are coming from MoT leadership.', mailBtn('Working with Marketers of Tomorrow', 'Become a client'))}
      </div>
    </section>`;
  };

  pages.icc = () => {
    const icc = D.icc, F = icc.fundraising;
    return `
    <section class="page-head s-navy">
      <div class="wrap icc-hero">
        <div>
          <span class="tag-pill sm">${esc(icc.name)}</span>
          <h1 class="h-lg">${esc(icc.short)}: <em class="serif gold">${esc(icc.city)}</em></h1>
          <p class="lede">${esc(icc.dates)}. ${esc(icc.about)}</p>
          <div class="btn-row" style="margin-top:18px">${ext(D.links.iccApplication, 'Apply to go')}<button type="button" class="btn btn-ghost" data-donate>${ico('i-heart')} Donate</button></div>
        </div>
        <div class="card navy" style="padding:30px">
          <span class="chip">Countdown</span>
          <h3 class="h-md" style="margin:8px 0 0">Wheels up in</h3>
          ${countdown(icc.start, 'lg')}
          <p class="small" style="opacity:.8;margin:0">Counting to the morning of ${fmtLong(icc.start.slice(0, 10))}.</p>
        </div>
      </div>
    </section>
    <section class="section s-cream">
      <div class="wrap">
        <div class="grid g3" style="margin-bottom:40px">
          <div class="card reveal"><span class="chip navy">What it is</span><h3 class="h-sm" style="margin-top:8px">Three days, 1,600+ marketers</h3><p style="margin:0">Keynotes, workshops, a recruiter hall and the biggest collegiate marketing competitions in the country.</p></div>
          <div class="card reveal d1"><span class="chip navy">Competitions</span><h3 class="h-sm" style="margin-top:8px">Where VCU shows up</h3><div class="roles" style="margin-top:8px">${icc.competitions.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div></div>
          <div class="card reveal d2"><span class="chip navy">How to go</span><h3 class="h-sm" style="margin-top:8px">Apply, pay dues, prep</h3><p style="margin:0 0 10px">Fill out the application, stay current on dues and points, and come to the prep sessions. Fundraising covers part of the trip.</p>${ext(D.links.iccApplication, 'Application', 'btn btn-gold btn-sm')}</div>
        </div>
        <div class="sec-head reveal"><div><p class="eyebrow">Results</p><h2 class="h-lg">VCU at <em class="serif navy">ICC</em></h2></div><p>Every placement from the official AMA results. Click a year for the source.</p></div>
        <div class="grid g2" style="align-items:start">
          ${icc.results.map((y, i) => `<div class="reveal d${i + 1}">
            <div class="res-year"><h3>${y.year}</h3><span class="chip">${esc(y.city)}</span><a class="small textlink" href="${y.source}" target="_blank" rel="noopener">${esc(y.dates)} ${ico('i-ext')}</a></div>
            ${y.note ? `<p class="muted" style="margin-top:-4px">${esc(y.note)}</p>` : ''}
            <div class="results">${y.wins.map(w => `<div class="res-row">${medal(w.place)}<div><b>${esc(w.who)}</b><div class="comp">${esc(w.comp)}</div></div></div>`).join('')}</div>
          </div>`).join('')}
        </div>
      </div>
    </section>
    <section class="section s-gold" id="fundraising">
      <div class="wrap split">
        <div class="reveal"><p class="eyebrow">${esc(F.eyebrow)}</p><h2 class="h-lg">${esc(F.head)}</h2><p class="lede" style="margin:12px 0 18px">${esc(F.body)}</p><div class="btn-row"><button type="button" class="btn btn-navy" data-donate>${ico('i-heart')} Donate</button>${route('#/accomplishments', 'See past winners', 'btn btn-ghost')}</div></div>
        <div class="reveal d2"><div class="frame"><img src="assets/img/gallery/mw-04.webp" alt="Competition winners holding certificates"></div></div>
      </div>
    </section>`;
  };

  function accomplishmentForm() {
    const F = D.forms;
    if (F.accomplishmentEmbed) return `<div class="form-embed"><iframe src="${F.accomplishmentEmbed}" title="Accomplishment form" loading="lazy"></iframe></div>`;
    return `<form class="sticky" data-form="accomplishment">
      <h3 class="h-md">Submit yours</h3>
      <p class="small muted" style="margin:0 0 14px">The board reviews every entry before it posts here and on Instagram.</p>
      <div class="field"><label for="accName">Your name</label><input id="accName" name="name" required placeholder="First and last name"></div>
      <div class="field"><label for="accEmail">VCU email</label><input id="accEmail" name="email" type="email" placeholder="you@vcu.edu"></div>
      <div class="field"><label for="accCat">What kind of win?</label><select id="accCat" name="category">${Object.entries(D.accomplishmentCats).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
      <div class="field"><label for="accWhat">The accomplishment</label><input id="accWhat" name="what" required placeholder="Marketing intern, summer 2027"></div>
      <div class="field"><label for="accWhere">Company, organization or event</label><input id="accWhere" name="where" placeholder="Capital One"></div>
      <div class="field"><label for="accWhen">When</label><input id="accWhen" name="when" placeholder="May 2027"></div>
      <div class="field check"><label><input type="checkbox" name="feature" value="yes" checked> OK to feature on Instagram</label></div>
      <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      <button class="btn btn-gold" type="submit">${ico('i-send')} Submit</button>
    </form>`;
  }

  pages.accomplishments = () => {
    const L = D.leaderboard;
    const rows = L.members.slice().sort((a, b) => b.pts - a.pts);
    const top = rows.slice(0, 3);
    const goal = D.membership.activePoints;
    return `
    ${pageHead('Accomplishments', `Members doing <em class="serif gold">big things</em>`, 'Awards, internships, job offers and other wins from AMA members, plus the membership points leaderboard. Got a win? Submit it and we will feature you here and on Instagram.', `<div class="btn-row" style="margin-top:18px"><a class="btn btn-gold" href="#/accomplishments#submit">Submit yours</a><a class="btn btn-ghost" href="#/accomplishments#leaderboard">Points leaderboard</a></div>`)}
    <section class="section s-cream" id="wins">
      <div class="wrap">
        <div class="filters" data-filters="acc"><button class="on" data-f="all">All</button>${Object.entries(D.accomplishmentCats).map(([k, v]) => `<button data-f="${k}">${v}</button>`).join('')}</div>
        <div class="grid g3" data-acc-grid>
          ${D.accomplishments.map((a, i) => `<article class="card acc-card ${a.placeholder ? 'placeholder' : ''} reveal d${(i % 3) + 1}" data-cat="${a.cat}">
            <span class="ico">${ico(a.cat === 'award' ? 'i-trophy' : a.cat === 'internship' ? 'i-bolt' : a.cat === 'job' ? 'i-check' : 'i-star')}</span>
            <div><b>${esc(a.who)}</b><div class="what">${esc(a.what)}</div><div class="where">${esc(a.where)}${a.when ? ' · ' + esc(a.when) : ''}</div>${a.placeholder ? `<div style="margin-top:10px"><a class="btn btn-gold btn-sm" href="#/accomplishments#submit">Submit yours</a></div>` : ''}</div>
          </article>`).join('')}
        </div>
      </div>
    </section>
    <section class="section" id="leaderboard">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">Membership points</p><h2 class="h-lg">The leaderboard</h2></div><p>Every event earns points. Reach ${goal} and you are an Active Member. Updated ${fmt(L.updated, { month: 'long', day: 'numeric' })}.${L.demo ? ' <span class="chip">Sample data until the first points import</span>' : ''}</p></div>
        <div class="podium reveal">
          ${[top[1], top[0], top[2]].map((m, i) => m ? `<div class="pod p${i === 1 ? 1 : i === 0 ? 2 : 3}"><span class="tag-pill sm rank">${i === 1 ? '1st' : i === 0 ? '2nd' : '3rd'}</span><div class="av">${monogram(m.name)}</div><b>${esc(m.name)}</b><span class="pts">${m.pts} pts</span></div>` : '').join('')}
        </div>
        <div class="split" style="align-items:start">
          <div class="lb reveal">
            ${rows.map((m, i) => `<div class="lb-row"><span class="n">${i + 1}</span><span class="av">${monogram(m.name)}</span><div><b>${esc(m.name)}</b>${m.pts >= goal ? `<span class="badge-active">${ico('i-check')} Active</span>` : ''}<div class="bar"><i data-w="${Math.min(100, m.pts / goal * 100)}%" style="--w:0%"></i></div></div><span class="pts">${m.pts}<small>${Math.max(0, goal - m.pts)} to go</small></span></div>`).join('')}
          </div>
          <div style="display:grid;gap:18px">
            <div class="card reveal d2"><span class="chip navy">How points work</span><h3 class="h-md" style="margin-top:8px">Show up, level up</h3><div class="pt-list" style="margin:12px 0">${D.membership.knownPoints.map(p => `<div><span>${esc(p.what)}</span><b>${p.isGoal ? '' : '+'}${p.pts}</b></div>`).join('')}</div><p class="small muted" style="margin:0">${esc(D.membership.pointsNote)} Points post after each event.</p></div>
            <div class="card gold reveal d3"><h3 class="h-md">Not on the board yet?</h3><p>Pay dues, register on RamsConnect, and come to the next coffee chat.</p>${route('#/events', 'Next event', 'btn btn-navy btn-sm')}</div>
          </div>
        </div>
      </div>
    </section>
    <section class="section s-cream" id="submit">
      <div class="wrap split" style="align-items:start">
        <div class="reveal"><p class="eyebrow">Submit yours</p><h2 class="h-lg">Internship? Offer? Award?</h2><p class="lede" style="margin:12px 0 18px">Tell us and we will feature it here and on @amavcu. Internships landed, job offers signed, competitions won, anything you are proud of.</p><p class="small muted">Entries go to the board, who review them before anything posts.</p></div>
        <div class="reveal d2">${accomplishmentForm()}</div>
      </div>
    </section>`;
  };

  pages.leadership = () => {
    const L = D.leadership;
    const ctaFor = p => ({ board: route('#/board', 'Meet the board', 'btn btn-navy btn-sm'), mot: route('#/mot', 'Marketers of Tomorrow', 'btn btn-navy btn-sm'), icc: route('#/icc', 'ICC 2027', 'btn btn-navy btn-sm'), involved: route('#/involved', 'Get involved', 'btn btn-navy btn-sm') }[p.cta] || '');
    return `
    ${pageHead('Members · Leadership', `Lead the <em class="serif gold">chapter</em>`, esc(L.intro))}
    <section class="section s-cream">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">Ways to lead</p><h2 class="h-lg">Four paths in</h2></div></div>
        <div class="grid g2">${L.paths.map((p, i) => `<div class="card reveal d${(i % 2) + 1}"><h3 class="h-sm">${esc(p.t)}</h3><p>${esc(p.d)}</p>${ctaFor(p)}</div>`).join('')}</div>
      </div>
    </section>
    <section class="section s-navy">
      <div class="wrap split">
        <div class="reveal"><p class="eyebrow">Executive board</p><h2 class="h-lg">Applications open each spring</h2><p class="lede" style="margin:12px 0 18px">${esc(L.season)}</p><div class="btn-row">${D.links.boardApplication ? ext(D.links.boardApplication, 'Board application') : mailBtn('Interested in the AMA board', 'Email about the board', 'btn btn-gold')}${route('#/board', 'This year’s board', 'btn btn-ghost')}</div>${D.links.boardApplication ? '' : `<p class="small" style="opacity:.75;margin:12px 0 0">The application form link goes here when the board publishes it.</p>`}</div>
        <div class="reveal d2"><div class="card"><span class="chip navy">The roles</span><div class="role-list">${D.board.map(m => `<div><b>${esc(m.role)}</b><span>${esc(m.name)}, ${esc(D.org.year)}</span></div>`).join('')}</div></div></div>
      </div>
    </section>`;
  };

  pages.opportunities = () => {
    const A = D.alumni;
    return `
    ${pageHead('Members · Opportunities & Alumni', `Internships, careers and <em class="serif gold">alumni</em>`, 'Where members find internships and jobs, how to grow before graduation, and how alumni stay part of the chapter.')}
    <section class="section s-cream" id="opportunities">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">Opportunities</p><h2 class="h-lg">Places to look</h2></div><p>Internships and jobs move fast. Start here, and drop opportunities you find into the GroupMe.</p></div>
        <div class="filters" data-filters="opp"><button class="on" data-f="all">All</button>${Object.entries(D.opportunityCats).map(([k, v]) => `<button data-f="${k}">${v}</button>`).join('')}</div>
        <div class="grid g3" data-opp-grid>${D.opportunities.map((o, i) => `<a class="card reveal d${(i % 3) + 1}" data-cat="${o.cat}" style="text-decoration:none" href="${o.url || o.route}" ${o.url ? 'target="_blank" rel="noopener"' : ''}><span class="chip">${esc(D.opportunityCats[o.cat] || o.cat)}</span><h3 class="h-sm" style="margin-top:8px">${esc(o.title)} ${ico(o.url ? 'i-ext' : 'i-arrow')}</h3><p class="muted" style="margin:0">${esc(o.d)}</p></a>`).join('')}</div>
      </div>
    </section>
    <section class="section s-navy" id="alumni">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">Alumni</p><h2 class="h-lg">Once AMA, always AMA</h2></div><p>${esc(A.intro)}</p></div>
        <div class="split" style="align-items:start;margin-bottom:40px">
          <div class="reveal">${D.links.alumniLinkedIn ? `<div class="card navy" style="border:1px solid rgba(255,255,255,.18)"><span class="chip">Alumni network</span><h3 class="h-md" style="margin:8px 0">AMA at VCU alumni on LinkedIn</h3><p class="small" style="opacity:.85">Job leads, mentoring and reunions.</p>${ext(D.links.alumniLinkedIn, 'Join the group', 'btn btn-gold btn-sm')}</div>` : placeholder('Alumni LinkedIn group', 'The link to the AMA at VCU alumni LinkedIn group goes here once the board shares it.', mailBtn('AMA at VCU alumni', 'Are you an alum? Say hi', 'btn btn-navy btn-sm'))}</div>
          <div class="reveal d2">${A.stories.length ? `<div class="stories">${A.stories.map(s => `<div class="story"><div class="story-photo">${photoOr(s.photo, s.name)}</div><div><b>${esc(s.name)}</b>${s.year ? ` <span class="muted">· Class of ${esc(s.year)}</span>` : ''}<div class="small">${esc(s.now)}</div>${s.story ? `<p class="small" style="margin:6px 0 0">${esc(s.story)}</p>` : ''}${s.url ? `<a class="small textlink" href="${s.url}" target="_blank" rel="noopener">LinkedIn ${ico('i-ext')}</a>` : ''}</div></div>`).join('')}</div>` : placeholder('Alumni accomplishments and stories', 'Alumni updates will be featured here: where our graduates landed and what they are building. Alumni, send yours.', mailBtn('Alumni update for the AMA at VCU website', 'Share your update', 'btn btn-navy btn-sm'))}</div>
        </div>
        <div class="grid g4">${A.waysToHelp.map((w, i) => `<div class="card reveal d${i + 1}"><h3 class="h-sm">${esc(w.t)}</h3><p style="margin:0">${esc(w.d)}</p></div>`).join('')}</div>
        <div class="btn-row" style="margin-top:22px">${mailBtn('Getting involved as an AMA at VCU alum', 'Get involved as an alum', 'btn btn-gold')}<button type="button" class="btn btn-ghost" data-donate>${ico('i-heart')} Donate</button></div>
      </div>
    </section>
    <section class="section s-cream">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">For alumni and current members</p><h2 class="h-lg">Opportunities that follow you</h2></div></div>
        <div class="grid g2">${A.forAlumniAndMembers.map((o, i) => `<a class="card reveal d${i + 1}" style="text-decoration:none" href="${o.url}" target="_blank" rel="noopener"><h3 class="h-sm">${esc(o.t)} ${ico('i-ext')}</h3><p class="muted" style="margin:0">${esc(o.d)}</p></a>`).join('')}</div>
      </div>
    </section>`;
  };

  pages.newsletter = () => {
    const c = D.newsletter.current;
    return `
    ${pageHead('Newsletter', `The <em class="serif gold">monthly</em>`, 'One email a month with recaps, what is coming up and the reminders you will forget otherwise. The current issue lives here; older ones are in the archive.')}
    <section class="section s-cream">
      <div class="wrap split" style="align-items:start;grid-template-columns:1.4fr .8fr">
        <div class="news-card reveal">
          <div class="nc-head"><div><span class="chip">${esc(c.issue)}</span><h3>${esc(c.month)}</h3></div>${markSvg('nc-logo')}</div>
          <div class="nc-body">
            <p class="lede" style="margin:0">${esc(c.intro)}</p>
            ${c.sections.map(s => `<div><h4>${esc(s.h)}</h4><ul>${s.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}
            <div class="spot"><h4 style="margin-bottom:6px">${esc(c.spotlight.h)}</h4><p style="margin:0">${esc(c.spotlight.p)}</p></div>
            <div class="btn-row">${c.url ? ext(c.url, 'Read the full issue', 'btn btn-navy btn-sm') : ''}<span class="small muted">Upcoming event locations are on RamsConnect, where you register.</span></div>
          </div>
        </div>
        <div style="display:grid;gap:18px">
          <div class="reveal d1"><p class="eyebrow">Archive</p><h2 class="h-md" style="margin-bottom:12px">Previous issues</h2><div class="archive">${D.newsletter.archive.map(a => `<a href="${a.url || D.links.newsletterArchive}" target="_blank" rel="noopener"><span style="color:var(--ink)">${esc(a.month)}</span><span>${a.date ? fmt(a.date, { month: 'short', day: 'numeric', year: 'numeric' }) : ''} ${ico('i-ext')}</span></a>`).join('')}</div></div>
          <div class="card navy reveal d2"><span class="chip">Get it in your inbox</span><h3 class="h-sm" style="margin:8px 0">Members get the newsletter automatically</h3><p class="small" style="opacity:.85">Join on RamsConnect and the monthly lands in your VCU email.</p>${ext(D.links.ramsconnectJoin, 'Join on RamsConnect', 'btn btn-gold btn-sm')}</div>
        </div>
      </div>
    </section>`;
  };

  pages.blog = () => `
    ${pageHead('Blog', `Recaps, guides and <em class="serif gold">ICYMI</em>`, 'What happened, what we learned, and how to get the most out of the chapter. Photo dumps live in the gallery.')}
    <section class="section s-cream"><div class="wrap"><div class="grid g3" style="align-items:start">${D.posts.map((p, i) => postCard(p, i === 0)).join('')}</div></div></section>`;

  pages.post = slug => {
    const p = D.posts.find(x => x.slug === slug);
    if (!p) return pages.blog();
    const gal = (p.gallery || []).map(f => D.gallery.find(g => g.f === f) || { f, cap: p.title });
    return `
    <section class="page-head s-navy"><div class="wrap post"><a class="textlink back" href="#/blog">${ico('i-arrow')} All posts</a><div style="margin-top:14px"><span class="chip">${esc(p.tag)}</span> <span class="small" style="opacity:.8;margin-left:8px">${fmtLong(p.date)}</span></div><h1 class="h-lg" style="margin-top:12px">${esc(p.title)}</h1><p class="lede">${esc(p.dek)}</p></div></section>
    <section class="section s-cream"><div class="wrap post">
      <div class="cover" style="margin-top:-80px"><img src="${p.cover}" alt=""></div>
      <div class="body">${p.body.map(b => `<p>${esc(b)}</p>`).join('')}</div>
      ${gal.length ? `<p class="eyebrow">Photos</p><div class="post-gallery" data-gallery>${gal.map((g, i) => `<button type="button" data-lb="${i}" data-src="${galleryFull(g)}" data-cap="${esc(g.cap)}"><img src="${galleryThumb(g)}" alt="${esc(g.cap)}" loading="lazy"></button>`).join('')}</div>` : ''}
      <div class="btn-row" style="margin-top:36px">${route('#/gallery', 'More photos', 'btn btn-navy')}${ext(p.instagram || D.links.instagram, p.instagram ? 'See the post on Instagram' : 'Follow @amavcu', 'btn btn-ghost')}</div>
    </div></section>`;
  };

  pages.gallery = () => `
    ${pageHead('Gallery', `Pics or it <em class="serif gold">didn't happen</em>`, 'One album per event. Open an album to see every photo. Want yours added? Tag @amavcu.')}
    <section class="section s-cream"><div class="wrap">
      <div class="albums">${D.albums.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')).map(albumCover).join('')}</div>
    </div></section>`;

  pages.album = slug => {
    const a = D.albums.find(x => x.slug === slug);
    if (!a) return pages.gallery();
    const ph = photosOf(a);
    const needsDrive = !ph.length && a.folder;
    return `
    <section class="page-head"><div class="wrap"><a class="textlink back" href="#/gallery">${ico('i-arrow')} All albums</a><div style="margin-top:14px">${a.date ? `<span class="chip">${fmtLong(a.date)}</span>` : ''}</div><h1 class="h-lg" style="margin-top:12px">${esc(a.name)}</h1>${a.blurb ? `<p class="lede">${esc(a.blurb)}</p>` : ''}</div></section>
    <section class="section s-cream"><div class="wrap">
      <div class="masonry" data-gallery data-album-slug="${esc(a.slug)}">${ph.map((g, i) => `<figure data-lb="${i}" data-src="${galleryFull(g)}" data-cap="${esc(g.cap || '')}" class="reveal"><img src="${galleryThumb(g)}" alt="${esc(g.cap || '')}" loading="lazy" ${g.w ? `width="${g.w}" height="${g.h}"` : ''}><figcaption>${esc(g.cap || '')}</figcaption></figure>`).join('')}</div>
      ${needsDrive ? `<p class="muted" data-album-loading>Loading photos from Google Drive…</p>` : ''}
      ${!ph.length && !needsDrive ? placeholder('Photos coming', 'This album is set up but the photos have not been added yet.', ext(D.links.instagram, 'See @amavcu', 'btn btn-navy btn-sm')) : ''}
    </div></section>`;
  };

  pages.involved = () => {
    const F = D.forms;
    const m = D.membership;
    return `
    ${pageHead('Get involved', `Your move, <em class="serif gold">marketer.</em>`, 'Join, drop an event idea, tell us what to fix, or chip in for the ICC trip. All of it lives on this page.')}
    <section class="section s-cream" id="join">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">Join</p><h2 class="h-lg">Four steps, <em class="serif navy">one semester</em></h2></div><div class="btn-row">${ext(D.links.ramsconnectJoin, 'Join on RamsConnect')}${ext(D.links.becomeMember, 'Membership form', 'btn btn-navy')}${ext(D.links.groupme, 'GroupMe', 'btn btn-ghost')}</div></div>
        <div class="steps reveal">${m.steps.map(s => `<div class="step"><b>${esc(s.t)}</b><p>${esc(s.d)}</p></div>`).join('')}</div>
        <p class="small muted" style="margin:16px 0 0">Dues: ${duesWords()} a year. ${esc(m.duesNote)}</p>
      </div>
    </section>
    <section class="section s-navy" id="ideas">
      <div class="wrap split" style="align-items:start">
        <div class="reveal"><p class="eyebrow">Idea drop box</p><h2 class="h-lg">What should we <em class="serif gold">do next?</em></h2><p class="lede" style="margin:12px 0 18px">A speaker you want to hear, a company tour, a themed coffee chat, a collab with another org. Drop it here and the board reads every one at its weekly meeting.</p><p class="small" style="opacity:.8">Add your name if you want credit, or stay anonymous.</p></div>
        <div class="reveal d2">${F.ideaBoxEmbed ? `<div class="form-embed"><iframe src="${F.ideaBoxEmbed}" title="Idea drop box" loading="lazy"></iframe></div>` : `
          <form class="sticky" data-form="idea">
            <h3 class="h-md">Drop an idea</h3>
            <div class="field"><label for="ideaTitle">The idea</label><input id="ideaTitle" name="title" required placeholder="A Richmond agency tour"></div>
            <div class="field"><label for="ideaWhy">Why it would work</label><textarea id="ideaWhy" name="why" placeholder="Who it is for, when it could happen, anyone we should reach out to"></textarea></div>
            <div class="field"><label for="ideaName">Your name (optional)</label><input id="ideaName" name="name" placeholder="Anonymous is fine"></div>
            <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
            <button class="btn btn-navy" type="submit">${ico('i-send')} Send it to the board</button>
          </form>`}</div>
      </div>
    </section>
    <section class="section s-cream" id="feedback">
      <div class="wrap split" style="align-items:start">
        <div class="reveal">
          <p class="eyebrow">Feedback</p><h2 class="h-lg">Tell us the <em class="serif navy">truth</em></h2>
          <p class="lede" style="margin:12px 0 18px">Too many events? Not enough? Something awkward at a meeting? This is the place. Anonymous unless you sign it.</p>
          ${F.feedbackEmbed ? `<div class="form-embed"><iframe src="${F.feedbackEmbed}" title="Feedback form" loading="lazy"></iframe></div>` : `
          <form class="card" data-form="feedback">
            <div class="field"><label for="fbType">What is this about?</label><select id="fbType" name="type"><option>An event</option><option>Membership or dues</option><option>Communication</option><option>The website</option><option>Something else</option></select></div>
            <div class="field"><label for="fbText">Your feedback</label><textarea id="fbText" name="text" required placeholder="Be specific, be honest, be kind"></textarea></div>
            <div class="field"><label for="fbName">Name (optional)</label><input id="fbName" name="name" placeholder="Anonymous"></div>
            <input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
            <button class="btn btn-gold" type="submit">${ico('i-send')} Send feedback</button>
          </form>`}
        </div>
        <div class="reveal d2">
          <p class="eyebrow">Surveys & forms</p><h2 class="h-md" style="margin-bottom:14px">Open right now</h2>
          <div class="survey-list">${F.surveys.map(s => `<a href="${s.url}" target="_blank" rel="noopener"><div>${esc(s.title)}<span>${esc(s.note)}</span></div>${ico('i-ext')}</a>`).join('')}</div>
        </div>
      </div>
    </section>
    <section class="section s-gold" id="donate">
      <div class="wrap split">
        <div class="reveal"><p class="eyebrow">Donate</p><h2 class="h-lg">Send us to <em class="serif">New Orleans.</em></h2><p class="lede" style="margin:12px 0 18px">Donations cover competition travel, catering and the raffles that make events worth showing up to. Every dollar goes back into the chapter.</p><div class="btn-row"><button type="button" class="btn btn-navy btn-lg" data-donate>${ico('i-heart')} Donate</button>${mailBtn('Sponsoring AMA at VCU', 'Sponsor an event', 'btn btn-ghost')}</div></div>
        <div class="reveal d2"><div class="frame"><img src="assets/img/gallery/mw-14.webp" alt="Members outside Snead Hall"></div></div>
      </div>
    </section>
    <section class="section s-cream" id="socials">
      <div class="wrap"><div class="sec-head reveal"><div><p class="eyebrow">Follow along</p><h2 class="h-lg">Where everything <em class="serif navy">drops first</em></h2></div><div class="social-row">${socialRow()}</div></div><div class="reveal">${socialBig()}</div></div>
    </section>`;
  };

  const TITLES = { '': 'The home for marketers at VCU', about: 'About us', events: 'Events', board: 'Executive board', mot: 'Marketers of Tomorrow', icc: 'ICC 2027', accomplishments: 'Accomplishments', leadership: 'Leadership', opportunities: 'Opportunities & Alumni', newsletter: 'Newsletter', blog: 'Blog', gallery: 'Gallery', involved: 'Get involved' };
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
    let html, title;
    if (page === 'blog' && param) { html = pages.post(param); title = (D.posts.find(p => p.slug === param) || {}).title || 'Blog'; }
    else if (page === 'board' && param) { html = pages.member(param); title = (D.board.find(m => m.slug === param) || {}).name || 'Executive board'; }
    else if (page === 'gallery' && param) { html = pages.album(param); title = (D.albums.find(a => a.slug === param) || {}).name || 'Gallery'; }
    else if (pages[page]) { html = pages[page](); title = TITLES[page]; }
    else { html = pages.home(); title = TITLES['']; }
    const key = page + '/' + param;
    const changed = force || key !== lastRoute;
    lastRoute = key;
    if (changed) {
      main.innerHTML = html;
      main.classList.remove('page-enter'); void main.offsetWidth; main.classList.add('page-enter');
      document.title = title + ' | AMA at VCU';
      afterRender();
    }
    closeDonate(); lbClose();
    const navKey = ['leadership', 'opportunities', 'accomplishments'].includes(page) ? page : page;
    $$('.nav [data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === navKey));
    $$('.nav-group').forEach(g => g.classList.toggle('active', !!g.querySelector(`[data-nav="${navKey}"]`)));
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
  function initVideo() {
    const box = $('[data-video]'); if (!box) return;
    $('[data-play]', box).addEventListener('click', () => {
      const v = D.video;
      if (v.youtube) box.innerHTML = `<iframe src="https://www.youtube.com/embed/${v.youtube}?autoplay=1&rel=0" title="${esc(v.title)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      else if (v.mp4) box.innerHTML = `<video src="${v.mp4}" controls autoplay playsinline poster="${v.poster}"></video>`;
      else if (v.instagram) window.open(v.instagram, '_blank', 'noopener');
      else toast('The recruitment video is being edited. Follow @amavcu to catch it first.');
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
          <h4>${sel === TODAY ? 'Today, ' : ''}${fmt(sel, { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
          <div class="cal-list">${selEvs.length ? selEvs.map(e => `<div class="cal-item"><span class="chip dot" style="--chip:${typeOf(e).color}">${esc(typeOf(e).label)}</span><b>${esc(e.title)}</b>${e.time ? `<span class="small muted">${esc(e.time)}</span>` : ''}${evCTA(e) || (e.place ? `<span class="small muted">${ico('i-pin')} ${esc(e.place)}</span>` : '')}</div>`).join('') : `<div class="cal-item"><span class="muted">Nothing on this day. Pick a highlighted date.</span></div>`}</div>
          <div class="btn-row" style="margin-top:14px">${ext(D.links.googleCalendar, 'Subscribe', 'btn btn-navy btn-sm')}</div>
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
  /* forms: Google Apps Script endpoint when configured, otherwise a pre-filled email */
  function initForms() {
    $$('form[data-form]').forEach(form => form.addEventListener('submit', async e => {
      e.preventDefault();
      const f = new FormData(form); const kind = form.dataset.form;
      if (f.get('website')) return;                                    // honeypot
      const fields = {}; f.forEach((v, k) => { if (k !== 'website') fields[k] = v; });
      const btn = $('button[type=submit]', form);
      const subject = kind === 'accomplishment' ? 'Accomplishment: ' + fields.what : kind === 'idea' ? 'Event idea: ' + fields.title : 'Feedback: ' + fields.type;
      const body = Object.entries(fields).map(([k, v]) => `${k[0].toUpperCase() + k.slice(1)}: ${v || '(blank)'}`).join('\n');
      if (CMS && CMS.config.formEndpoint) {
        btn.disabled = true;
        try { await CMS.submit(kind, fields); form.reset(); toast(kind === 'accomplishment' ? 'Submitted. The board reviews entries before they post.' : 'Sent to the board. Thank you.'); }
        catch (err) { toast('Could not send just now. Opening an email instead.'); location.href = `mailto:${D.org.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; }
        btn.disabled = false; return;
      }
      location.href = `mailto:${D.org.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      form.classList.remove('sent'); void form.offsetWidth; form.classList.add('sent');
      toast('Your email app should open with everything filled in. Hit send.');
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
  $$('.nav-group > button').forEach(b => b.addEventListener('click', e => { const g = b.parentElement; const open = g.classList.toggle('open'); b.setAttribute('aria-expanded', open); $$('.nav-group').forEach(o => { if (o !== g) o.classList.remove('open'); }); }));
  document.addEventListener('click', e => { if (!e.target.closest('.nav-group')) $$('.nav-group.open').forEach(g => g.classList.remove('open')); });
  const dm = $('#donateModal');
  function openDonate() { if (D.links.donate) { window.open(D.links.donate, '_blank', 'noopener'); return; } dm.hidden = false; document.body.style.overflow = 'hidden'; setTimeout(() => $('.modal-x', dm).focus(), 50); }
  function closeDonate() { dm.hidden = true; document.body.style.overflow = ''; }
  document.addEventListener('click', e => { if (e.target.closest('[data-donate]')) { e.preventDefault(); closeMenu(); openDonate(); } if (e.target.closest('[data-close]')) closeDonate(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeDonate(); lbClose(); closeMenu(); $$('.nav-group.open').forEach(g => g.classList.remove('open')); } if (!lb.hidden) { if (e.key === 'ArrowRight') lbShow(lbI + 1); if (e.key === 'ArrowLeft') lbShow(lbI - 1); } });
  $('#donateOpts').innerHTML = [
    ['Venmo', 'Kayla Lee, chapter president', D.links.venmo, '#3D95CE', 'V'],
    ['Cash App', 'Candace Heath, director of finance', D.links.cashapp, '#00C244', '$'],
    ['Email about sponsoring', 'Companies and alumni: sponsor an event or the ICC trip', `mailto:${D.org.email}?subject=Sponsoring AMA at VCU`, '#2E456F', '@']
  ].map(([t, d, h, c, l]) => `<a href="${h}" ${h.startsWith('http') ? 'target="_blank" rel="noopener"' : ''}><span class="ico" style="background:${c}">${l}</span><div>${t}<span>${d}</span></div></a>`).join('');
  $('#donateMail').href = `mailto:${D.org.email}`;
  $('#footSocial').innerHTML = socialRow(); $('#mmSocial').innerHTML = socialRow();
  $('#footRams').href = D.links.ramsconnect; $('#footLinktree').href = D.links.linktree; $('#footMail').href = `mailto:${D.org.email}`;
  $('#year').textContent = new Date().getFullYear();

  render(false);
  /* pull the board's sheet / calendar, then redraw the current page if anything changed */
  if (CMS) CMS.load().then(r => { if (r && r.changed) render(true); });
  window.AMA_TEST = { NOW, TODAY, upcoming, past, render, pages };
})();
