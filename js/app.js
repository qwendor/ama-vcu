/* =====================================================================
   AMA at VCU  |  app
   Hash-routed single page site. All content comes from js/data.js.
   ?now=YYYY-MM-DD in the query string previews the site on another day.
   ===================================================================== */
(() => {
  const D = window.AMA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const qs = new URLSearchParams(location.search);
  const NOFX = qs.get('fx') === '0';            // ?fx=0 disables motion (screenshots, projectors)
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
  const sticker = () => '';   // v2: no doodle stickers
  const logoStill = (cls = '', w = 150) => `<svg class="${cls}" viewBox="0 0 200 110" width="${w}" role="img" aria-label="American Marketing Association"><use href="#mark"/></svg>`;
  const shortRole = r => r.replace(/^Director of /, '').replace(/ of Events & Operations$/, '').replace(/^Community Outreach$/, 'Outreach');
  const swash = () => '';
  const ext = (href, label, cls = 'btn btn-gold') => `<a class="${cls}" href="${href}" target="_blank" rel="noopener">${label} ${ico('i-ext')}</a>`;
  const route = (href, label, cls = 'btn btn-navy') => `<a class="${cls}" href="${href}">${label} ${ico('i-arrow')}</a>`;
  const pageHead = (eyebrow, title, lede, extra = '') => `
    <section class="page-head">
      <div class="wrap">
        <p class="eyebrow">${esc(eyebrow)}</p>
        <h1 class="h-lg">${title}</h1>
        ${lede ? `<p class="lede">${lede}</p>` : ''}
        ${extra}
      </div>
    </section>`;

  /* ---------- events ---------- */
  const EV = D.events;
  const isFuture = e => !e.tba && e.date >= TODAY;
  const upcoming = () => EV.filter(isFuture).sort((a, b) => a.date.localeCompare(b.date));
  const past = () => EV.filter(e => !e.tba && e.date < TODAY).sort((a, b) => b.date.localeCompare(a.date));
  const tba = () => EV.filter(e => e.tba);
  const typeOf = e => D.eventTypes[e.type] || { label: e.type, color: '#F4B223' };

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
    if (!fut && e.place) bits.push(`<span>${ico('i-pin')}${esc(e.place)}</span>`);
    bits.push(`<span class="chip dot" style="--chip:${t.color}">${esc(t.label)}</span>`);
    if (e.points) bits.push(`<span class="chip">+${e.points} pts</span>`);
    return `<div class="ev-meta">${bits.join('')}</div>`;
  }
  function evCTA(e) {
    if (!(isFuture(e) || e.tba)) return '';
    if (e.cta) return ext(e.cta.url, esc(e.cta.label), 'btn btn-gold btn-sm');
    if (e.tba) return `<div class="btn-row"><span class="locked">${ico('i-clock')} Date announced on Instagram</span>${ext(D.links.instagram, 'Follow @amavcu', 'btn btn-gold btn-sm')}</div>`;
    return `<div class="btn-row"><span class="locked">${ico('i-lock')} Location on RamsConnect</span>${ext(D.links.ramsconnectEvents, 'Register', 'btn btn-gold btn-sm')}</div>`;
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

  /* ---------- avatars (procedural faces for the leaderboard) ---------- */
  function rng(seed) { let a = seed * 1103515245 + 12345; return () => { a = (a * 1664525 + 1013904223) % 4294967296; return a / 4294967296; }; }
  function avatar(seed) {
    const r = rng(seed + 11);
    const pick = arr => arr[Math.floor(r() * arr.length)];
    const bg = pick(['#F4B223', '#8FB6FF', '#B6E3C6', '#FFB3C7', '#C9B8FF', '#FFD468', '#FFC9A3']);
    const skin = pick(['#F6D3B5', '#EBBE9B', '#D9A077', '#B87B4F', '#8D5A37', '#5E3A22']);
    const hair = pick(['#2B1B12', '#4A2C1A', '#1F1F2B', '#8C5A2B', '#D9A441', '#B23A3A', '#111111', '#6B4F3A']);
    const style = Math.floor(r() * 5);
    const glasses = r() > 0.72;
    const smile = r() > 0.3;
    let back = '', front = '';
    if (style === 0) front = `<path d="M22 36 C22 22 58 22 58 36 L58 32 C58 20 22 20 22 32 Z" fill="${hair}"/><path d="M22 36c0-12 10-18 18-18s18 6 18 18c-6-6-12-8-18-8s-12 2-18 8z" fill="${hair}"/>`;
    if (style === 1) { back = `<path d="M18 40 C18 16 62 16 62 40 L64 66 H16 Z" fill="${hair}"/>`; front = `<path d="M20 40c0-14 8-20 20-20s20 6 20 20c-6-6-12-9-20-9s-14 3-20 9z" fill="${hair}"/>`; }
    if (style === 2) front = `<circle cx="26" cy="30" r="9" fill="${hair}"/><circle cx="36" cy="24" r="9" fill="${hair}"/><circle cx="46" cy="24" r="9" fill="${hair}"/><circle cx="55" cy="30" r="9" fill="${hair}"/><circle cx="21" cy="40" r="7" fill="${hair}"/><circle cx="59" cy="40" r="7" fill="${hair}"/>`;
    if (style === 3) front = `<circle cx="40" cy="16" r="9" fill="${hair}"/><path d="M22 38c0-12 8-18 18-18s18 6 18 18c-6-5-12-7-18-7s-12 2-18 7z" fill="${hair}"/>`;
    if (style === 4) front = `<path d="M20 42c0-16 8-22 20-22s20 6 20 22l-4-2c-2-8-6-10-10-6-3 3-9 3-12 0-4-4-8-2-10 6z" fill="${hair}"/>`;
    const eyes = `<circle cx="33" cy="42" r="2.4" fill="#1B1B2A"/><circle cx="47" cy="42" r="2.4" fill="#1B1B2A"/>`;
    const mouth = smile ? `<path d="M33 52c3 4 11 4 14 0" fill="none" stroke="#1B1B2A" stroke-width="2.2" stroke-linecap="round"/>` : `<path d="M35 53h10" stroke="#1B1B2A" stroke-width="2.2" stroke-linecap="round"/>`;
    const gl = glasses ? `<g fill="none" stroke="#1B1B2A" stroke-width="1.8"><circle cx="33" cy="42" r="6"/><circle cx="47" cy="42" r="6"/><path d="M39 42h2"/></g>` : '';
    return `<svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="40" fill="${bg}"/>${back}<path d="M14 80c2-16 12-24 26-24s24 8 26 24z" fill="${skin}" opacity=".95"/><circle cx="40" cy="42" r="19" fill="${skin}"/>${front}${eyes}${mouth}${gl}</svg>`;
  }

  /* ---------- components ---------- */
  function boardCard(m, i) {
    const li = m.linkedin || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(m.name + ' VCU')}`;
    return `<article class="member reveal d${(i % 3) + 1}">
      <div class="frame"><img src="assets/img/board/${m.slug}.webp" alt="${esc(m.name)}" loading="lazy"></div>
      <div class="member-body">
        <h3>${esc(m.name)}</h3>
        <div class="member-role"><span class="role">${esc(m.role)}</span><a class="li-btn" href="${li}" target="_blank" rel="noopener">${ico('i-in')} LinkedIn</a></div>
        <div class="member-info">
          <div><b>Year and major</b> ${esc(m.year)}, ${esc(m.major)}</div>
          <div><b>Career goal</b> ${esc(m.goal)}</div>
          <div><b>Fun fact</b> ${esc(m.fun)}</div>
        </div>
      </div>
    </article>`;
  }

  function pillarsBlock(onNavy = true) {
    const p0 = D.pillars[0];
    return `<div class="pillars" data-pillars>
      <div class="pillar-tabs" role="tablist">
        ${D.pillars.map((p, i) => `<button class="pillar-tab ${i === 0 ? 'active' : ''}" role="tab" aria-selected="${i === 0}" data-i="${i}"><span class="em">${p.emoji}</span><span>${esc(p.name)}<small>${esc(p.short)}</small></span></button>`).join('')}
      </div>
      <div class="pillar-panel" role="tabpanel">
        <img src="${p0.img}" alt="">
        <div class="pillar-dots">${D.pillars.map((_, i) => `<i class="${i === 0 ? 'on' : ''}"></i>`).join('')}</div>
        <div class="pp-text"><span class="chip">${esc(p0.name)}</span><h3>${esc(p0.short)}</h3><p>${esc(p0.body)}</p></div>
      </div>
    </div>`;
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

  function socialRow() {
    const L = D.links;
    const s = [['i-ig', 'Instagram', L.instagram], ['i-tt', 'TikTok', L.tiktok], ['i-in', 'LinkedIn', L.linkedin], ['i-fb', 'Facebook', L.facebook], ['i-ext', 'Linktree', L.linktree], ['i-users', 'GroupMe', L.groupme]];
    return s.map(([i, t, h]) => `<a href="${h}" target="_blank" rel="noopener">${ico(i)}${t}</a>`).join('');
  }
  function socialBig() {
    const L = D.links;
    const s = [['i-ig', 'Instagram', '@amavcu, where everything drops first', L.instagram], ['i-users', 'GroupMe', 'Reminders, polls and rides', L.groupme], ['i-in', 'LinkedIn', 'Follow the chapter page', L.linkedin], ['i-ext', 'RamsConnect', 'Register for every event here', L.ramsconnect]];
    return `<div class="social-big">${s.map(([i, t, d, h]) => `<a href="${h}" target="_blank" rel="noopener">${ico(i)}<b>${t}</b><span>${d}</span></a>`).join('')}</div>`;
  }

  function medal(place) {
    if (place === 0) return `<span class="medal">★</span>`;
    return `<span class="medal ${place <= 3 ? 'm' + place : ''}">${place}${place === 1 ? 'st' : place === 2 ? 'nd' : place === 3 ? 'rd' : 'th'}</span>`;
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
    const slides = ((D.hero || {}).slides || []).filter(s => s.credit);
    if (!slides.length) return '';
    const seen = new Map(); slides.forEach(s => { if (!seen.has(s.credit)) seen.set(s.credit, s); });
    return `<div class="hero-credit">Campus photos: ${[...seen.values()].map(s => s.url ? `<a href="${s.url}" target="_blank" rel="noopener">${esc(s.credit)}</a>` : esc(s.credit)).join(', ')} (${[...new Set(slides.map(s => s.license))].join(', ')})</div>`;
  }

  pages.home = () => {
    const ups = upcoming().slice(0, 3);
    const icc = D.icc;
    const wins26 = D.icc.results[0].wins.length;
    const days = daysUntil(icc.start.slice(0, 10));
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
        <div class="hero-mark" role="img" aria-label="American Marketing Association"><svg viewBox="0 0 200 110"><use href="#mark"/></svg></div>
        <span class="hero-school">Virginia Commonwealth University</span>
        <h1>American Marketing Association</h1>
        <p class="tagline">Define your brand. The only marketing organization at VCU: speakers, competitions, coffee chats and a chapter that travels to ICC together.</p>
        <div class="btn-row">
          <a class="btn btn-gold btn-lg" href="#/involved">Become a member</a>
          <a class="btn btn-ghost btn-lg" href="#/events">Upcoming events</a>
        </div>
      </div>
      ${heroCredit()}
      <div class="hero-strip"><div class="wrap">
        <div class="stat"><b>${D.org.founded}</b><span>Founded</span></div>
        <div class="stat"><b data-count="${wins26}">${wins26}</b><span>ICC 2026 placements</span></div>
        <div class="stat"><b data-count="${days}">${days}</b><span>Days to ICC 2027</span></div>
        <div class="stat"><b>$${D.membership.dues}</b><span>Annual dues</span></div>
      </div></div>
    </section>

    <section class="section">
      <div class="wrap intro">
        <div class="reveal">
          <p class="eyebrow">What is AMA at VCU</p>
          <h2 class="h-lg">Real-world marketing experience, on campus.</h2>
          <p class="lede" style="margin-top:14px">${esc(D.org.blurb)} Open to every major, since ${D.org.founded}, and connected to AMA Richmond, the professional chapter a few blocks away.</p>
          <div class="quick-links">
            <a href="#/events">Events and calendar <span>Coffee chats, speakers, competitions</span></a>
            <a href="#/board">Executive board <span>Meet the ${D.org.year} team</span></a>
            <a href="#/icc">ICC 2027 <span>${esc(icc.dates)}, ${esc(icc.city)}</span></a>
            <a href="#/agency">Marketers of Tomorrow <span>Our student-run agency</span></a>
          </div>
        </div>
        <div class="reveal d2">
          <div class="video-box" data-video>
            <img src="${D.video.poster}" alt="">
            <button type="button" class="video-play" data-play><span class="play">${ico('i-play')}</span>${esc(D.video.title)}</button>
            ${!(D.video.youtube || D.video.instagram || D.video.mp4) ? `<span class="tag-pill sm video-note">Video coming soon</span>` : ''}
          </div>
        </div>
      </div>
    </section>

    <section class="section s-cream" id="upnext">
      <div class="wrap">
        <div class="sec-head reveal">
          <div><p class="eyebrow">Upcoming</p><h2 class="h-lg">Events this month</h2></div>
          <a class="textlink more" href="#/events">Full calendar ${ico('i-arrow')}</a>
        </div>
        <div class="bento">
          <div class="span7 reveal"><div class="ev-list">${ups.map(evItem).join('')}${tba().slice(0, 1).map(evItem).join('')}${ups.length < 2 ? `<div class="card flat"><b>New events post on RamsConnect and Instagram first.</b><p class="small muted" style="margin:6px 0 12px">Coffee chats, speakers and competitions are added through the semester.</p><div class="btn-row">${ext(D.links.ramsconnectEvents, 'RamsConnect', 'btn btn-navy btn-sm')}${route('#/events', 'Past events', 'btn btn-ghost btn-sm')}</div></div>` : ''}</div></div>
          <article class="card navy span5 reveal d1">
            <span class="chip">${esc(icc.city)}</span>
            <h3 class="h-md" style="margin-top:10px">${esc(icc.short)} countdown</h3>
            <p class="small" style="opacity:.85">${esc(icc.dates)}. Applications are open.</p>
            ${countdown(icc.start)}
            <div class="btn-row">${ext(D.links.iccApplication, 'Apply', 'btn btn-gold btn-sm')}${route('#/icc', 'Our ICC record', 'btn btn-ghost btn-sm')}</div>
          </article>
        </div>
      </div>
    </section>

    <section class="section s-navy">
      <div class="wrap">
        <div class="sec-head reveal">
          <div><p class="eyebrow">What we do</p><h2 class="h-lg">Five pillars, one chapter</h2></div>
          <p>Every AMA chapter is built on the same five pillars. Select one to see what it looks like at VCU.</p>
        </div>
        <div class="reveal">${pillarsBlock()}</div>
      </div>
    </section>

    <section class="section s-gold">
      <div class="wrap">
        <div class="sec-head reveal">
          <div><p class="eyebrow">International Collegiate Conference</p><h2 class="h-lg">ICC 2027: ${esc(icc.city)}, ${esc(icc.dates)}</h2></div>
          <div class="btn-row">${route('#/icc', 'Learn more', 'btn btn-navy')}${ext(D.links.iccApplication, 'Apply to go', 'btn btn-ghost')}</div>
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
        <div class="board-row reveal">${D.board.map(m => `<a href="#/board" title="${esc(m.name)}, ${esc(m.role)}"><img src="assets/img/board/${m.slug}.webp" alt="${esc(m.name)}" loading="lazy"><figcaption>${esc(m.name.split(' ')[0])}<small>${esc(shortRole(m.role))}</small></figcaption></a>`).join('')}</div>
      </div>
    </section>

    <section class="section s-cream">
      <div class="wrap">
        <div class="sec-head reveal">
          <div><p class="eyebrow">News</p><h2 class="h-lg">In case you missed it</h2></div>
          <div class="btn-row"><a class="textlink" href="#/newsletter">${esc(D.newsletter.current.month)} newsletter ${ico('i-arrow')}</a><a class="textlink more" href="#/blog">All posts ${ico('i-arrow')}</a></div>
        </div>
        <div class="grid g3">${D.posts.slice(0, 3).map(p => postCard(p)).join('')}</div>
      </div>
    </section>

    <section class="section s-navy deep">
      <div class="wrap split">
        <div class="reveal">
          <p class="eyebrow">Join today</p>
          <h2 class="h-lg">Open to every major. $${D.membership.dues} for the year.</h2>
          <p class="lede" style="margin:14px 0 22px">Member-only events, competition travel, a points system that rewards showing up, and a network that starts at the next coffee chat.</p>
          <div class="btn-row">${ext(D.links.ramsconnectJoin, 'Join on RamsConnect')}${route('#/involved', 'How it works', 'btn btn-ghost')}</div>
          <div class="social-row" style="margin-top:26px">${socialRow()}</div>
        </div>
        <div class="reveal d2 photo-grid">
          <img src="assets/img/board-group.webp" alt="The ${D.org.year} executive board" loading="lazy">
          <img src="assets/img/gallery/t/mw-11.webp" alt="Members at Marketing Week" loading="lazy">
          <img src="assets/img/gallery/t/mw-06.webp" alt="Mocktails and Marketing Trivia" loading="lazy">
        </div>
      </div>
    </section>`;
  };

  pages.about = () => {
    const m = D.membership;
    return `
    ${pageHead('About us', `The only marketing org at VCU, <em class="serif gold">since 1983.</em>`, 'AMA at VCU is the collegiate chapter of the American Marketing Association on the VCU campus, and a bridge to AMA Richmond, the professional chapter a few blocks away.')}
    <section class="section s-cream">
      <div class="wrap split">
        <div class="reveal">
          <p class="eyebrow">Our purpose</p>
          <p class="quote">"To give members the resources and community to develop their marketing and business skills outside the classroom."</p>
          <p>That means workshops, guest speakers, networking events, study groups and competitions. It also means coffee chats on Sundays, raffles at interest meetings and a group chat that actually answers.</p>
          <p>Membership is open to every major. Our ICC winners include psychology, philosophy and information systems students.</p>
        </div>
        <div class="reveal d2 numbers" style="grid-template-columns:repeat(2,1fr)">
          <div class="num"><b>${D.org.founded}</b><span>Founded (reinstated ${D.org.reinstated})</span></div>
          <div class="num"><b data-count="${m.activePoints}">${m.activePoints}</b><span>Points to Active Member</span></div>
          <div class="num"><b data-count="${m.dues}" data-prefix="$">$${m.dues}</b><span>Dues for the whole year</span></div>
          <div class="num"><b data-count="${D.icc.results[0].wins.length}">${D.icc.results[0].wins.length}</b><span>ICC 2026 placements</span></div>
        </div>
      </div>
    </section>
    <section class="section s-navy">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">The pillars</p><h2 class="h-lg">Five pillars, <em class="serif gold">explained</em></h2></div><p>Every AMA chapter plans its year around these. Tap one.</p></div>
        <div class="reveal">${pillarsBlock()}</div>
      </div>
    </section>
    <section class="section s-cream">
      <div class="wrap">
        <div class="sec-head reveal"><div><p class="eyebrow">Membership</p><h2 class="h-lg">How joining <em class="serif navy">works</em></h2></div></div>
        <div class="steps reveal">${m.steps.map(s => `<div class="step"><b>${esc(s.t)}</b><p>${esc(s.d)}</p></div>`).join('')}</div>
        <div class="split" style="margin-top:40px">
          <div class="card reveal">
            <span class="chip navy">Dues</span>
            <h3 class="h-md" style="margin-top:8px">$${m.dues} a year</h3>
            <div class="dues"><div><b>$${m.duesNational}</b>AMA national membership</div><div><b>$${m.duesChapter}</b>VCU chapter (catering, supplies, events)</div></div>
            <p class="small muted" style="margin:12px 0 0">Deadline: ${esc(m.duesDeadline)}. Pay through the board (see the Linktree) and email us if cost is a barrier.</p>
          </div>
          <div class="card reveal d2">
            <span class="chip navy">Points</span>
            <h3 class="h-md" style="margin-top:8px">Show up, level up</h3>
            <div class="pt-list" style="margin:12px 0">${m.knownPoints.map(p => `<div><span>${esc(p.what)}</span><b>${p.isGoal ? '' : '+'}${p.pts}</b></div>`).join('')}</div>
            <p class="small muted" style="margin:0">${esc(m.pointsNote)}</p>
            <div class="btn-row" style="margin-top:12px">${route('#/leaderboard', 'See the leaderboard', 'btn btn-navy btn-sm')}${ext(D.links.memberResources, 'Member resources', 'btn btn-ghost btn-sm')}</div>
          </div>
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
            <li><b>April 2027</b><span>ICC returns to New Orleans. We are going.</span></li>
          </ul>
        </div>
        <div class="reveal d2">
          <div class="card">
            <span class="chip navy">Advisor</span>
            <h3 class="h-md" style="margin-top:8px">${esc(D.org.advisor.name)}</h3>
            <p class="muted">${esc(D.org.advisor.title)}</p>
            <p>AMA at VCU is housed in the VCU School of Business and works closely with the Center for Professional Selling, which coaches our competition teams.</p>
            <div class="btn-row">${ext(D.links.amaRichmond, 'AMA Richmond', 'btn btn-navy btn-sm')}${ext(D.links.amaNational, 'AMA national', 'btn btn-ghost btn-sm')}</div>
          </div>
        </div>
      </div>
    </section>
    <section class="section s-cream">
      <div class="wrap split" style="align-items:start">
        <div class="reveal"><p class="eyebrow">FAQ</p><h2 class="h-lg">Questions people <em class="serif navy">ask</em></h2><p class="lede" style="margin-top:12px">Still stuck? Email <a href="mailto:${D.org.email}">${D.org.email}</a> or DM us on Instagram.</p></div>
        <div class="faq reveal d2">${D.faq.map(f => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>
      </div>
    </section>`;
  };

  pages.events = () => `
    ${pageHead('Events', `What's <em class="serif gold">happening</em>`, 'Coffee chats, speakers, competitions and service days. Upcoming events show the date and time here; the room or address is on RamsConnect, where you register.', `<div class="btn-row" style="margin-top:18px">${ext(D.links.googleCalendar, 'Add our Google Calendar', 'btn btn-gold')}${ext(D.links.ramsconnectEvents, 'Register on RamsConnect', 'btn btn-ghost')}</div>`)}
    <section class="section s-cream">
      <div class="wrap">
        <div class="sec-head">
          <div class="ev-toggle" role="tablist"><button class="on" data-view="list">List</button><button data-view="cal">Calendar</button></div>
          <span class="locked">${ico('i-lock')} Locations unlock on RamsConnect</span>
        </div>
        <div data-view-list>
          <p class="month-label">Coming up</p>
          <div class="ev-list">${upcoming().map(evItem).join('')}${tba().map(evItem).join('')}</div>
          ${(() => { const p = past(); let cur = ''; let out = ''; p.forEach(e => { const d = pd(e.date); const key = MON[d.getMonth()] + ' ' + d.getFullYear(); if (key !== cur) { cur = key; out += `<p class="month-label">${key} · recap</p>`; } out += evItem(e); }); return `<div class="ev-list">${out}</div>`; })()}
        </div>
        <div data-view-cal hidden><div class="cal" data-cal></div></div>
      </div>
    </section>`;

  pages.board = () => `
    ${pageHead(`${D.org.year} executive board`, `The people behind <em class="serif gold">@amavcu</em>`, 'Nine students run the chapter: events, finance, membership, fundraising, outreach, communications and social media, with a senior advisor keeping us honest. Say hi at the next coffee chat.')}
    <section class="section s-navy deep">
      <div class="wrap">
        <div class="board-grid">${D.board.map(boardCard).join('')}</div>
        ${swash()}
        <div class="split" style="margin-top:20px">
          <div class="card reveal"><span class="chip navy">Faculty advisor</span><h3 class="h-md" style="margin-top:8px">${esc(D.org.advisor.name)}</h3><p class="muted" style="margin:0">${esc(D.org.advisor.title)}</p></div>
          <div class="card gold reveal d2">${sticker('star', '--x:-12px;--y:-16px;--r:-14deg;--s:46px', 'right st-float')}<h3 class="h-md">Want to be on this page next year?</h3><p>Board applications open each spring. The best prep is simple: come to events, join Marketers of Tomorrow, and tell a board member you are interested.</p><div class="btn-row"><a class="btn btn-navy btn-sm" href="mailto:${D.org.email}?subject=Interested in the AMA board">${ico('i-mail')} Email the board</a>${route('#/agency', 'Marketers of Tomorrow', 'btn btn-ghost btn-sm')}</div></div>
        </div>
      </div>
    </section>`;

  pages.icc = () => {
    const icc = D.icc;
    return `
    <section class="page-head s-navy">
      <div class="wrap icc-hero">
        <div>
          <span class="tag-pill sm">${esc(icc.name)}</span>
          <h1 class="h-lg">${esc(icc.short)}: <em class="serif gold">${esc(icc.city)}</em></h1>
          <p class="lede">${esc(icc.dates)}. ${esc(icc.about)}</p>
          <div class="btn-row" style="margin-top:18px">${ext(D.links.iccApplication, 'Apply to go')}<button type="button" class="btn btn-ghost" data-donate>${ico('i-heart')} Fund the trip</button></div>
        </div>
        <div class="card navy" style="padding:30px">
          ${sticker('sparkle', '--x:-14px;--y:-16px;--r:12deg;--s:48px', 'right st-float')}
          <span class="chip">Countdown</span>
          <h3 class="h-md" style="margin:8px 0 0">Wheels up in</h3>
          ${countdown(icc.start, 'lg')}
          <p class="small" style="opacity:.8;margin:0">Counting to the morning of ${fmtLong(icc.start.slice(0, 10))}.</p>
        </div>
      </div>
      ${sticker('star', '--x:8%;--y:30px;--r:-14deg;--s:46px', 'right st-float')}
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
    <section class="section s-gold">
      <div class="wrap split">
        <div class="reveal"><p class="eyebrow">NOLA, round three</p><h2 class="h-lg">Help us get <em class="serif">there.</em></h2><p class="lede" style="margin:12px 0 18px">Travel, hotel and registration add up. Donations and fundraiser nights make the difference between sending five people and sending fifteen.</p><div class="btn-row"><button type="button" class="btn btn-navy" data-donate>${ico('i-heart')} Donate</button>${route('#/accomplishments', 'See past winners', 'btn btn-ghost')}</div></div>
        <div class="reveal d2"><div class="frame"><img src="assets/img/gallery/mw-04.webp" alt="Competition winners holding certificates"></div></div>
      </div>
    </section>`;
  };

  pages.accomplishments = () => `
    ${pageHead('Accomplishments', `Members doing <em class="serif gold">big things</em>`, 'Awards, internships, job offers and other wins from AMA members. Got one? Submit it and we will feature you here and on Instagram.', `<div class="btn-row" style="margin-top:18px">${ext(D.links.accomplishmentForm, 'Submit an accomplishment')}</div>`)}
    <section class="section s-cream">
      <div class="wrap">
        <div class="filters" data-filters="acc"><button class="on" data-f="all">All</button>${Object.entries(D.accomplishmentCats).map(([k, v]) => `<button data-f="${k}">${v}</button>`).join('')}</div>
        <div class="grid g3" data-acc-grid>
          ${D.accomplishments.map((a, i) => `<article class="card acc-card ${a.placeholder ? 'placeholder' : ''} reveal d${(i % 3) + 1}" data-cat="${a.cat}">
            <span class="ico">${ico(a.cat === 'award' ? 'i-trophy' : a.cat === 'internship' ? 'i-bolt' : a.cat === 'job' ? 'i-check' : 'i-star')}</span>
            <div><b>${esc(a.who)}</b><div class="what">${esc(a.what)}</div><div class="where">${esc(a.where)}${a.when ? ' · ' + esc(a.when) : ''}</div>${a.placeholder ? `<div style="margin-top:10px">${ext(D.links.accomplishmentForm, 'Submit yours', 'btn btn-gold btn-sm')}</div>` : ''}</div>
          </article>`).join('')}
        </div>
        <div class="sec-head reveal" style="margin-top:60px"><div><p class="eyebrow">Opportunities</p><h2 class="h-lg">Places to <em class="serif navy">look</em></h2></div><p>Internships and jobs move fast. Start here, and drop opportunities you find into the GroupMe.</p></div>
        <div class="grid g4">${D.opportunities.map((o, i) => `<a class="card reveal d${i + 1}" style="text-decoration:none" href="${o.url || o.route}" ${o.url ? 'target="_blank" rel="noopener"' : ''}><h3 class="h-sm">${esc(o.title)} ${ico(o.url ? 'i-ext' : 'i-arrow')}</h3><p class="muted" style="margin:0">${esc(o.d)}</p></a>`).join('')}</div>
      </div>
    </section>`;

  pages.leaderboard = () => {
    const L = D.leaderboard;
    const rows = L.members.slice().sort((a, b) => b.pts - a.pts);
    const top = rows.slice(0, 3);
    const goal = D.membership.activePoints;
    return `
    ${pageHead('Leaderboard', `Points on the <em class="serif gold">board</em>`, `Every event earns points. Reach ${goal} and you are an Active Member. Updated ${fmt(L.updated, { month: 'long', day: 'numeric' })}.`, L.demo ? `<span class="chip" style="margin-top:14px">Sample data until the first points import</span>` : '')}
    <section class="section s-cream">
      <div class="wrap">
        <div class="podium reveal">
          ${[top[1], top[0], top[2]].map((m, i) => m ? `<div class="pod p${i === 1 ? 1 : i === 0 ? 2 : 3}"><span class="tag-pill sm rank">${i === 1 ? '1st' : i === 0 ? '2nd' : '3rd'}</span><div class="av">${avatar(m.seed)}</div><b>${esc(m.name)}</b><span class="pts">${m.pts} pts</span></div>` : '').join('')}
        </div>
        <div class="split" style="align-items:start">
          <div class="lb reveal">
            ${rows.map((m, i) => `<div class="lb-row"><span class="n">${i + 1}</span><span class="av">${avatar(m.seed)}</span><div><b>${esc(m.name)}</b>${m.pts >= goal ? `<span class="badge-active">${ico('i-check')} Active</span>` : ''}<div class="bar"><i data-w="${Math.min(100, m.pts / goal * 100)}%" style="--w:0%"></i></div></div><span class="pts">${m.pts}<small>${Math.max(0, goal - m.pts)} to go</small></span></div>`).join('')}
          </div>
          <div style="display:grid;gap:18px">
            <div class="card reveal d2"><span class="chip navy">How points work</span><h3 class="h-md" style="margin-top:8px">Show up, level up</h3><div class="pt-list" style="margin:12px 0">${D.membership.knownPoints.map(p => `<div><span>${esc(p.what)}</span><b>${p.isGoal ? '' : '+'}${p.pts}</b></div>`).join('')}</div><p class="small muted" style="margin:0">${esc(D.membership.pointsNote)}</p><div class="btn-row" style="margin-top:12px">${ext(D.links.memberResources, 'Point system doc', 'btn btn-navy btn-sm')}</div></div>
            <div class="card gold reveal d3">${sticker('star', '--x:-12px;--y:-16px;--r:-14deg;--s:46px', 'right st-float')}<h3 class="h-md">Not on the board yet?</h3><p>Pay dues, register on RamsConnect, and come to the next coffee chat. Points post after each event.</p>${route('#/events', 'Next event', 'btn btn-navy btn-sm')}</div>
          </div>
        </div>
      </div>
    </section>`;
  };

  pages.agency = () => {
    const A = D.agency;
    return `
    ${pageHead('Our student agency', `<em class="serif gold">${esc(A.name)}</em>`, A.pitch, `<div class="btn-row" style="margin-top:18px">${ext(A.applyUrl, 'Apply via the Linktree')}</div>`)}
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
    </section>`;
  };

  pages.newsletter = () => {
    const c = D.newsletter.current;
    return `
    ${pageHead('Newsletter', `The <em class="serif gold">monthly</em>`, 'One email a month with recaps, what is coming up and the reminders you will forget otherwise. The current issue lives here; older ones are on RamsConnect.')}
    <section class="section s-cream">
      <div class="wrap split" style="align-items:start;grid-template-columns:1.4fr .8fr">
        <div class="news-card reveal">
          <div class="nc-head"><div><span class="chip">${esc(c.issue)}</span><h3>${esc(c.month)}</h3></div>${logoStill('nc-logo', 104)}</div>
          <div class="nc-body">
            <p class="lede" style="margin:0">${esc(c.intro)}</p>
            ${c.sections.map(s => `<div><h4>${esc(s.h)}</h4><ul>${s.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}
            <div class="spot"><h4 style="margin-bottom:6px">${esc(c.spotlight.h)}</h4><p style="margin:0">${esc(c.spotlight.p)}</p></div>
            <p class="small muted" style="margin:0">Upcoming event locations are on RamsConnect, where you register.</p>
          </div>
        </div>
        <div style="display:grid;gap:18px">
          <div class="reveal d1"><p class="eyebrow">Archive</p><h2 class="h-md" style="margin-bottom:12px">Previous issues</h2><div class="archive">${D.newsletter.archive.map(a => `<a href="${D.links.newsletterArchive}" target="_blank" rel="noopener"><span style="color:var(--ink)">${esc(a.month)}</span><span>${fmt(a.date, { month: 'short', day: 'numeric', year: 'numeric' })} ${ico('i-ext')}</span></a>`).join('')}</div></div>
          <div class="card navy reveal d2"><span class="chip">Get it in your inbox</span><h3 class="h-sm" style="margin:8px 0">Members get the newsletter automatically</h3><p class="small" style="opacity:.85">Join on RamsConnect and the monthly lands in your VCU email.</p>${ext(D.links.ramsconnectJoin, 'Join on RamsConnect', 'btn btn-gold btn-sm')}</div>
        </div>
      </div>
    </section>`;
  };

  pages.blog = () => `
    ${pageHead('Blog', `Recaps, guides and <em class="serif gold">ICYMI</em>`, 'What happened, what we learned, and how to get the most out of the chapter.')}
    <section class="section s-cream"><div class="wrap"><div class="grid g3" style="align-items:start">${D.posts.map((p, i) => postCard(p, i === 0)).join('')}</div></div></section>`;

  pages.post = slug => {
    const p = D.posts.find(x => x.slug === slug);
    if (!p) return pages.blog();
    const gal = (p.gallery || []).map(f => D.gallery.find(g => g.f === f) || { f, cap: p.title });
    return `
    <section class="page-head s-navy"><div class="wrap post"><a class="textlink" href="#/blog" style="color:#fff">${ico('i-arrow')} All posts</a><div style="margin-top:14px"><span class="chip">${esc(p.tag)}</span> <span class="small" style="opacity:.8;margin-left:8px">${fmtLong(p.date)}</span></div><h1 class="h-lg" style="margin-top:12px">${esc(p.title)}</h1><p class="lede">${esc(p.dek)}</p></div></section>
    <section class="section s-cream"><div class="wrap post">
      <div class="cover" style="margin-top:-80px"><img src="${p.cover}" alt=""></div>
      <div class="body">${p.body.map(b => `<p>${esc(b)}</p>`).join('')}</div>
      ${gal.length ? `<p class="eyebrow">Photos</p><div class="post-gallery" data-gallery>${gal.map((g, i) => `<button type="button" data-lb="${i}" data-src="assets/img/gallery/${g.f}.webp" data-cap="${esc(g.cap)}"><img src="assets/img/gallery/t/${g.f}.webp" alt="${esc(g.cap)}" loading="lazy"></button>`).join('')}</div>` : ''}
      <div class="btn-row" style="margin-top:36px">${route('#/gallery', 'More photos', 'btn btn-navy')}${ext(D.links.instagram, 'Follow @amavcu', 'btn btn-ghost')}</div>
    </div></section>`;
  };

  pages.gallery = () => {
    const albums = [...new Set(D.gallery.map(g => g.album))];
    return `
    ${pageHead('Gallery', `Pics or it <em class="serif gold">didn't happen</em>`, 'Photos from past events. Tap any photo to open it. Want yours added? Tag @amavcu.')}
    <section class="section s-cream"><div class="wrap">
      <div class="filters" data-filters="gal"><button class="on" data-f="all">All</button>${albums.map(a => `<button data-f="${esc(a)}">${esc(a)}</button>`).join('')}</div>
      <div class="masonry" data-gallery>${D.gallery.map((g, i) => `<figure data-album="${esc(g.album)}" data-lb="${i}" data-src="assets/img/gallery/${g.f}.webp" data-cap="${esc(g.cap)}" class="reveal"><img src="assets/img/gallery/t/${g.f}.webp" alt="${esc(g.cap)}" loading="lazy" width="${g.w}" height="${g.h}"><figcaption>${esc(g.cap)}<span>${esc(g.album)}</span></figcaption></figure>`).join('')}</div>
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
      </div>
    </section>
    <section class="section s-navy" id="ideas">
      <div class="wrap split" style="align-items:start">
        <div class="reveal"><p class="eyebrow">Idea drop box</p><h2 class="h-lg">What should we <em class="serif gold">do next?</em></h2><p class="lede" style="margin:12px 0 18px">A speaker you want to hear, a company tour, a themed coffee chat, a collab with another org. Drop it here and the board reads every one at its weekly meeting.</p><p class="small" style="opacity:.8">Ideas go straight to ${esc(D.org.email)}. Add your name if you want credit, or stay anonymous.</p></div>
        <div class="reveal d2">${F.ideaBoxEmbed ? `<div class="form-embed"><iframe src="${F.ideaBoxEmbed}" title="Idea drop box" loading="lazy"></iframe></div>` : `
          <form class="sticky" data-idea>
            <h3 class="h-md">Drop an idea</h3>
            <div class="field"><label for="ideaTitle">The idea</label><input id="ideaTitle" name="title" required placeholder="A Richmond agency tour"></div>
            <div class="field"><label for="ideaWhy">Why it would slap</label><textarea id="ideaWhy" name="why" placeholder="Who it is for, when it could happen, anyone we should reach out to"></textarea></div>
            <div class="field"><label for="ideaName">Your name (optional)</label><input id="ideaName" name="name" placeholder="Anonymous is fine"></div>
            <button class="btn btn-navy" type="submit">${ico('i-send')} Pin it to the board</button>
          </form>`}</div>
      </div>
    </section>
    <section class="section s-cream" id="feedback">
      <div class="wrap split" style="align-items:start">
        <div class="reveal">
          <p class="eyebrow">Feedback</p><h2 class="h-lg">Tell us the <em class="serif navy">truth</em></h2>
          <p class="lede" style="margin:12px 0 18px">Too many events? Not enough? Something awkward at a meeting? This is the place. Anonymous unless you sign it.</p>
          ${F.feedbackEmbed ? `<div class="form-embed"><iframe src="${F.feedbackEmbed}" title="Feedback form" loading="lazy"></iframe></div>` : `
          <form class="card" data-feedback>
            <div class="field"><label for="fbType">What is this about?</label><select id="fbType" name="type"><option>An event</option><option>Membership or dues</option><option>Communication</option><option>The website</option><option>Something else</option></select></div>
            <div class="field"><label for="fbText">Your feedback</label><textarea id="fbText" name="text" required placeholder="Be specific, be honest, be kind"></textarea></div>
            <div class="field"><label for="fbName">Name (optional)</label><input id="fbName" name="name" placeholder="Anonymous"></div>
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
        <div class="reveal">${sticker('heart', '--x:-30px;--y:-30px;--r:-12deg;--s:56px', 'st-float')}<p class="eyebrow">Donate</p><h2 class="h-lg">Fund the <em class="serif">trip.</em></h2><p class="lede" style="margin:12px 0 18px">Donations cover competition travel, catering and the raffles that make events worth showing up to. Every dollar goes back into the chapter.</p><div class="btn-row"><button type="button" class="btn btn-navy btn-lg" data-donate>${ico('i-heart')} Donate now</button><a class="btn btn-ghost" href="mailto:${D.org.email}?subject=Sponsoring AMA at VCU">${ico('i-mail')} Sponsor an event</a></div></div>
        <div class="reveal d2"><div class="frame"><img src="assets/img/gallery/mw-14.webp" alt="Members outside Snead Hall"></div></div>
      </div>
    </section>
    <section class="section s-cream" id="socials">
      <div class="wrap"><div class="sec-head reveal"><div><p class="eyebrow">Socials</p><h2 class="h-lg">Follow <em class="serif navy">along</em></h2></div><div class="social-row">${socialRow()}</div></div><div class="reveal">${socialBig()}</div></div>
    </section>`;
  };

  const TITLES = { '': 'Define your brand', about: 'About us', events: 'Events', board: 'Executive board', icc: 'ICC 2027', accomplishments: 'Accomplishments', leaderboard: 'Leaderboard', agency: 'Marketers of Tomorrow', newsletter: 'Newsletter', blog: 'Blog', gallery: 'Gallery', involved: 'Get involved' };

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
  function render() {
    const { page, param, anchor } = parseHash();
    let html;
    if (page === 'blog' && param) html = pages.post(param);
    else if (pages[page]) html = pages[page]();
    else html = pages.home();
    const key = page + '/' + param;
    const changed = key !== lastRoute;
    lastRoute = key;
    if (changed) {
      main.innerHTML = html;
      main.classList.remove('page-enter'); void main.offsetWidth; main.classList.add('page-enter');
      document.title = (page === 'blog' && param ? (D.posts.find(p => p.slug === param) || {}).title || 'Blog' : TITLES[page] || TITLES['']) + ' | AMA at VCU';
      afterRender();
    }
    closeDonate(); lbClose();
    $$('.nav [data-nav]').forEach(a => a.classList.toggle('active', a.dataset.nav === page));
    $$('.nav-group').forEach(g => g.classList.toggle('active', !!g.querySelector(`[data-nav="${page}"]`)));
    closeMenu();
    if (anchor) { const el = document.getElementById(anchor); if (el) { setTimeout(() => el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }), 60); return; } }
    if (changed) window.scrollTo({ top: 0, behavior: 'instant' });
  }
  addEventListener('hashchange', render);

  /* ===================================================================
     AFTER RENDER: behaviors
     =================================================================== */
  function afterRender() {
    initReveal(); initLogo(); initPillars(); initCounts(); initBars(); initVideo(); initCalendar(); initFilters(); initLightbox(); initForms(); tick();
  }

  function initReveal() {
    const els = $$('.reveal:not(.in)');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    els.forEach(e => io.observe(e));
  }
  function initMarquee() {
    const items = ['Define your brand', '#oneama', 'Coffee chats every other Sunday', 'ICC 2027 · New Orleans', 'The only marketing org at VCU', 'Marketers of Tomorrow', 'Since 1983', '#amavcu'];
    $$('[data-marquee]').forEach(t => t.innerHTML = items.map(i => `<span>${esc(i)}</span>`).join(''));
  }
  function initParallax() {
    const hero = $('.hero'), ring = $('.ring');
    if (!hero || !ring || reduce || matchMedia('(hover: none)').matches) return;
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      ring.style.setProperty('--mx', (((e.clientX - r.left) / r.width - .5) * 2).toFixed(3));
      ring.style.setProperty('--my', (((e.clientY - r.top) / r.height - .5) * 2).toFixed(3));
    });
    hero.addEventListener('pointerleave', () => { ring.style.setProperty('--mx', 0); ring.style.setProperty('--my', 0); });
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
  function initLogo() {
    $$('[data-logo]').forEach(el => {
      if (el.dataset.ready || !window.AMALogo) return; el.dataset.ready = 1;
      AMALogo.mount(el, { src: 'assets/logo/ama-logo-stacked.mp4', poster: 'assets/logo/ama-logo-poster.webp', still: reduce });
    });
  }
  function initPillars() {
    $$('[data-pillars]').forEach(root => {
      const tabs = $$('.pillar-tab', root), panel = $('.pillar-panel', root), img = $('img', panel), txt = $('.pp-text', panel), dots = $$('.pillar-dots i', root);
      let cur = 0, timer;
      const show = i => {
        cur = i; const p = D.pillars[i];
        tabs.forEach((t, j) => { t.classList.toggle('active', j === i); t.setAttribute('aria-selected', j === i); });
        dots.forEach((d, j) => d.classList.toggle('on', j === i));
        panel.classList.remove('swap'); void panel.offsetWidth; panel.classList.add('swap');
        img.src = p.img; txt.innerHTML = `<span class="chip">${esc(p.name)}</span><h3>${esc(p.short)}</h3><p>${esc(p.body)}</p>`;
      };
      tabs.forEach((t, i) => t.addEventListener('click', () => { show(i); restart(); }));
      const restart = () => { clearInterval(timer); if (!reduce) timer = setInterval(() => show((cur + 1) % D.pillars.length), 6500); };
      restart();
      root.addEventListener('pointerenter', () => clearInterval(timer));
      root.addEventListener('pointerleave', restart);
    });
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
    EV.filter(e => !e.tba).forEach(e => { let d = pd(e.date); const end = e.end ? pd(e.end) : d; while (d <= end) { (byDay[iso(d)] = byDay[iso(d)] || []).push(e); d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1); } });
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
        const items = kind === 'acc' ? $$('[data-acc-grid] [data-cat]') : $$('[data-gallery] [data-album]');
        items.forEach(it => { const v = kind === 'acc' ? it.dataset.cat : it.dataset.album; it.classList.toggle('hide', !(f === 'all' || v === f)); it.classList.add('in'); });
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
      nodes.forEach((n, i) => n.addEventListener('click', () => lbOpen(items, i)));
    });
  }
  /* forms (mailto fallback) */
  function initForms() {
    const idea = $('[data-idea]');
    if (idea) idea.addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(idea);
      const body = `Idea: ${f.get('title')}\n\nWhy: ${f.get('why') || '(no details)'}\n\nFrom: ${f.get('name') || 'Anonymous'}`;
      location.href = `mailto:${D.org.email}?subject=${encodeURIComponent('Event idea: ' + f.get('title'))}&body=${encodeURIComponent(body)}`;
      idea.classList.remove('sent'); void idea.offsetWidth; idea.classList.add('sent');
      toast('Pinned! Your email app should open with the idea ready to send.');
    });
    const fb = $('[data-feedback]');
    if (fb) fb.addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(fb);
      const body = `Topic: ${f.get('type')}\n\n${f.get('text')}\n\nFrom: ${f.get('name') || 'Anonymous'}`;
      location.href = `mailto:${D.org.email}?subject=${encodeURIComponent('Feedback: ' + f.get('type'))}&body=${encodeURIComponent(body)}`;
      toast('Thank you. Your email app should open with the feedback ready to send.');
    });
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
  function openDonate() { dm.hidden = false; document.body.style.overflow = 'hidden'; setTimeout(() => $('.modal-x', dm).focus(), 50); }
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
  $('#headSocial').innerHTML = [['i-ig', 'Instagram', D.links.instagram], ['i-in', 'LinkedIn', D.links.linkedin], ['i-fb', 'Facebook', D.links.facebook], ['i-mail', 'Email', `mailto:${D.org.email}`]].map(([i, t, h]) => `<a href="${h}" ${h.startsWith('http') ? 'target="_blank" rel="noopener"' : ''} aria-label="${t}" title="${t}">${ico(i)}</a>`).join('');
  $('#footRams').href = D.links.ramsconnect; $('#footLinktree').href = D.links.linktree; $('#footMail').href = `mailto:${D.org.email}`;
  $('#year').textContent = new Date().getFullYear();

  render();
  window.AMA_TEST = { NOW, TODAY, upcoming, past, render };
})();
