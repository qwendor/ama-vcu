/* Site editor for /admin. No build step: plain JS that draws forms from the SECTIONS list below.
   Content is saved as one JSON document through /api/content (functions/api/[[path]].js) and the
   public site reads it in js/cms.js. To add a field: one line in SECTIONS here, read it in cms.js. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const app = $("#app");
  const SITE = window.AMA;                       // js/data.js, the content built into the site (used as the starting point)
  const MARK = '<svg viewBox="0 0 288 110" aria-hidden="true"><path d="M12 94 L48 16 L84 94 M100 94 V16 L139 71 L178 16 V94 M194 16 L274 55 L194 94" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // ---------------------------------------------------------------- tiny helpers
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "value") el.value = v;
      else if (k === "checked") el.checked = v;
      else if (k === "style") el.style.cssText = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat(3)) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return el;
  }
  const icon = (name) => h("i", { class: "ph ph-" + name, "aria-hidden": "true" });
  const clone = (x) => JSON.parse(JSON.stringify(x));
  const get = (o, path) => path.split(".").reduce((a, k) => (a == null ? undefined : a[k]), o);
  function set(o, path, val) {
    const ks = path.split(".");
    ks.slice(0, -1).forEach((k) => { if (o[k] == null || typeof o[k] !== "object") o[k] = {}; o = o[k]; });
    o[ks[ks.length - 1]] = val;
  }
  const slugify = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  const thumbUrl = (v) => { const s = typeof v === "string" ? v : (v && (v.sm || v.src)) || ""; return !s ? "" : /^(https?:)?\//.test(s) ? s : "/" + s; };
  const fmtDate = (iso) => iso ? new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  let uid = 0;
  const id = () => "f" + ++uid;

  function toast(msg, bad) {
    const t = h("div", { class: "toast" + (bad ? " bad" : "") }, msg);
    $("#toasts").append(t);
    setTimeout(() => t.remove(), bad ? 6000 : 3200);
  }

  async function api(path, opts = {}) {
    const headers = { "x-requested-with": "ama-admin", ...(opts.headers || {}) };
    let body = opts.body;
    if (opts.json !== undefined) { headers["content-type"] = "application/json"; body = JSON.stringify(opts.json); }
    let res;
    try { res = await fetch("/api/" + path, { method: opts.method || "GET", headers, body, credentials: "same-origin" }); }
    catch { throw new Error("No connection. Check your internet and try again."); }
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) { const e = new Error(data.error || "Something went wrong."); e.status = res.status; throw e; }
    return data;
  }

  // ---------------------------------------------------------------- state
  let draft = null;          // what is being edited
  let savedText = "";        // what is live, as text, to tell if anything changed
  let view = { section: "events", item: null };
  let showPreview = true, phone = false, previewReady = false, previewTimer = 0, inboxCount = 0, firstRun = false;
  const dirty = () => JSON.stringify(draft) !== savedText;

  // ---------------------------------------------------------------- uploads
  async function shrink(file, max, quality) {
    let bmp;
    try { bmp = await createImageBitmap(file); }
    catch { throw new Error("That photo type could not be read. Save it as a JPG or PNG and try again."); }
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * k), hh = Math.round(bmp.height * k);
    const c = document.createElement("canvas"); c.width = w; c.height = hh;
    c.getContext("2d").drawImage(bmp, 0, 0, w, hh);
    const blob = await new Promise((r) => c.toBlob(r, "image/webp", quality));
    if (!blob) throw new Error("That photo could not be prepared for upload.");
    return { blob, w, h: hh };
  }
  const send = (blob, name, extra = {}) => api("media", {
    method: "POST", body: blob,
    headers: { "content-type": blob.type || "application/octet-stream", "x-name": encodeURIComponent(name || "file"), ...extra },
  });
  async function uploadImage(file) {
    const small = await shrink(file, 760, 0.78);
    const full = await shrink(file, 2000, 0.82);
    const s = await send(small.blob, file.name, { "x-role": "small", "x-width": small.w, "x-height": small.h });
    const f = await send(full.blob, file.name, { "x-role": "full", "x-width": full.w, "x-height": full.h, "x-sm": s.url });
    return { src: f.url, sm: s.url, w: full.w, h: full.h, alt: "" };
  }
  function pickFiles(accept, multiple) {
    return new Promise((resolve) => {
      const inp = h("input", { type: "file", accept, multiple, style: "display:none" });
      inp.addEventListener("change", () => { resolve(Array.from(inp.files || [])); inp.remove(); });
      document.body.append(inp); inp.click();
    });
  }
  async function busy(btn, label, fn) {
    const old = btn.innerHTML; btn.disabled = true; btn.textContent = label;
    try { return await fn(); }
    catch (e) { toast(e.message, true); if (e.status === 401) gate(); }
    finally { btn.disabled = false; btn.innerHTML = old; }
  }

  // every image already on the site + everything uploaded, for "Library"
  async function library(onPick) {
    const seen = new Map();
    (function walk(o) {
      if (!o || typeof o !== "object") return;
      if (typeof o.src === "string" && o.src) seen.set(o.src, o);
      Object.values(o).forEach(walk);
    })(draft);
    const grid = h("div", { class: "lib" });
    const close = () => modal.remove();
    const modal = h("div", { class: "modal", onclick: (e) => { if (e.target === modal) close(); } },
      h("div", { class: "modal-card", role: "dialog", "aria-label": "Image library" },
        h("div", { class: "modal-head" }, h("h3", null, "Choose an image"), h("button", { class: "btn btn--small", onclick: close }, "Close")),
        h("div", { class: "modal-body" }, grid)));
    document.body.append(modal);
    try { (await api("media")).items.forEach((m) => { if (/^image\//.test(m.type || "") && !seen.has(m.url)) seen.set(m.url, { src: m.url, sm: m.sm || "", w: m.w, h: m.h, alt: "" }); }); } catch {}
    if (!seen.size) grid.append(h("p", { class: "help" }, "Nothing here yet. Upload an image first."));
    seen.forEach((im) => grid.append(h("button", { type: "button", title: im.alt || "", style: `background-image:url("${thumbUrl(im)}")`, onclick: () => { close(); onPick(clone(im)); } })));
  }

  // ---------------------------------------------------------------- field types
  const wrap = (def, control, forId) => h("div", { class: "f" },
    def.label ? (forId ? h("label", { for: forId }, def.label) : h("div", { class: "lab" }, def.label)) : null,
    def.help ? h("div", { class: "help" }, def.help) : null, control);

  const input = (def, base, type) => {
    const i = id();
    return wrap(def, h("input", { id: i, type, value: get(base, def.key) ?? "", placeholder: def.placeholder,
      oninput: (e) => { set(base, def.key, e.target.value); if (def.onchange) def.onchange(base, e.target.value); changed(); } }), i);
  };
  const FIELDS = {
    text: (def, base) => input(def, base, "text"),
    url: (def, base) => input(def, base, "url"),
    date: (def, base) => input(def, base, "date"),
    number: (def, base) => input(def, base, "number"),
    textarea(def, base) {
      const i = id();
      return wrap(def, h("textarea", { id: i, rows: def.rows || 4, placeholder: def.placeholder, oninput: (e) => { set(base, def.key, e.target.value); changed(); } }, get(base, def.key) || ""), i);
    },
    toggle(def, base) {
      const v = get(base, def.key);
      return h("div", { class: "f" }, h("label", { class: "switch" },
        h("input", { type: "checkbox", checked: v === undefined ? !!def.defaultOn : !!v,
          onchange: (e) => { set(base, def.key, e.target.checked); changed(); } }),
        h("span", null, def.label)), def.help ? h("div", { class: "help" }, def.help) : null);
    },
    select(def, base) {
      const i = id(), opts = typeof def.options === "function" ? def.options() : def.options, cur = get(base, def.key);
      return wrap(def, h("select", { id: i, onchange: (e) => { set(base, def.key, e.target.value); changed(); } },
        opts.map(([v, t]) => h("option", { value: v, selected: v === cur }, t))), i);
    },
    slug(def, base) {
      const i = id();
      return wrap(def, h("div", { class: "slug" }, h("span", null, def.prefix),
        h("input", { id: i, type: "text", value: get(base, def.key) || "", oninput: (e) => { set(base, def.key, slugify(e.target.value)); changed(); },
          onblur: (e) => { e.target.value = get(base, def.key) || ""; } })), i);
    },
    image(def, base) {
      const cur = get(base, def.key);
      const has = cur && (cur.src || typeof cur === "string");
      const put = (im) => { set(base, def.key, im); changed(true); };
      const up = h("button", { type: "button", class: "btn btn--small", onclick: async () => {
        const [file] = await pickFiles("image/*"); if (!file) return;
        const im = await busy(up, "Uploading…", () => uploadImage(file)); if (im) put(im);
      } }, icon("upload-simple"), has ? "Replace" : "Upload");
      return wrap(def, h("div", { class: "imgbox" },
        h("div", { class: "thumb" + (def.portrait ? " portrait" : ""), style: has ? `background-image:url("${thumbUrl(cur)}")` : "" }, has ? null : icon("image")),
        h("div", { class: "imgbox-side" },
          h("div", { class: "btnrow" }, up,
            h("button", { type: "button", class: "btn btn--small", onclick: () => library(put) }, icon("images"), "Library"),
            has ? h("button", { type: "button", class: "btn btn--small btn--danger", onclick: () => put(null) }, "Remove") : null))));
    },
    images(def, base) {
      const arr = get(base, def.key) || []; if (!get(base, def.key)) set(base, def.key, arr);
      const move = (i, d) => { const [x] = arr.splice(i, 1); arr.splice(i + d, 0, x); changed(true); };
      const add = h("button", { type: "button", class: "btn btn--small btn--main", onclick: async () => {
        const files = await pickFiles("image/*", true); if (!files.length) return;
        await busy(add, "Uploading…", async () => {
          for (let n = 0; n < files.length; n++) { add.textContent = `Uploading ${n + 1} of ${files.length}…`; arr.push(await uploadImage(files[n])); }
        });
        changed(true);
      } }, icon("upload-simple"), "Add photos");
      return wrap(def, h("div", { class: "rows" },
        arr.length ? h("div", { class: "tiles" }, arr.map((im, i) => h("div", { class: "tile" },
          h("div", { class: "thumb", style: `background-image:url("${thumbUrl(im)}")` }),
          h("input", { type: "text", value: im.alt || "", placeholder: "Caption", "aria-label": `Photo ${i + 1} caption`, oninput: (e) => { im.alt = e.target.value; changed(); } }),
          h("div", { class: "tile-bar" },
            h("button", { type: "button", disabled: i === 0, title: "Move earlier", "aria-label": "Move earlier", onclick: () => move(i, -1) }, icon("arrow-left")),
            h("button", { type: "button", title: "Remove", "aria-label": "Remove photo", onclick: () => { arr.splice(i, 1); changed(true); } }, icon("trash")),
            h("button", { type: "button", disabled: i === arr.length - 1, title: "Move later", "aria-label": "Move later", onclick: () => move(i, 1) }, icon("arrow-right")))))) : h("div", { class: "help" }, "No photos yet."),
        h("div", { class: "btnrow" }, add,
          h("button", { type: "button", class: "btn btn--small", onclick: () => library((im) => { arr.push(im); changed(true); }) }, icon("images"), "Library"))));
    },
    file(def, base) {
      const cur = get(base, def.key);
      const up = h("button", { type: "button", class: "btn btn--small btn--main", onclick: async () => {
        const [file] = await pickFiles(def.accept); if (!file) return;
        const r = await busy(up, "Uploading…", () => send(file, file.name)); if (r) { set(base, def.key, r.url); changed(true); }
      } }, icon("upload-simple"), cur ? "Replace file" : "Upload file");
      return wrap(def, h("div", { class: "btnrow" }, up,
        cur ? h("a", { class: "btn btn--small", href: thumbUrl(cur), target: "_blank", rel: "noopener" }, "Open current file") : null,
        cur ? h("button", { type: "button", class: "btn btn--small btn--danger", onclick: () => { set(base, def.key, ""); changed(true); } }, "Remove") : null));
    },
    rows(def, base) {
      const arr = get(base, def.key) || []; if (!get(base, def.key)) set(base, def.key, arr);
      const move = (i, d) => { const [x] = arr.splice(i, 1); arr.splice(i + d, 0, x); changed(true); };
      const cols = def.cols.map(([, , w]) => w || "1fr").join(" ") + " auto";
      return wrap(def, h("div", { class: "rows" },
        arr.map((row, i) => h("div", { class: "rowline", style: `grid-template-columns:${cols}` },
          def.cols.map(([k, ph]) => h("input", { type: "text", value: row[k] ?? "", placeholder: ph, "aria-label": ph, oninput: (e) => { row[k] = e.target.value; changed(); } })),
          h("div", { class: "acts" },
            h("button", { type: "button", disabled: i === 0, "aria-label": "Move up", onclick: () => move(i, -1) }, icon("arrow-up")),
            h("button", { type: "button", disabled: i === arr.length - 1, "aria-label": "Move down", onclick: () => move(i, 1) }, icon("arrow-down")),
            h("button", { type: "button", "aria-label": "Remove", onclick: () => { arr.splice(i, 1); changed(true); } }, icon("trash"))))),
        h("div", null, h("button", { type: "button", class: "btn btn--small", onclick: () => { arr.push(Object.fromEntries(def.cols.map(([k]) => [k, ""]))); changed(true); } }, icon("plus"), def.add || "Add a row"))));
    },
    cards(def, base) {
      const arr = get(base, def.key) || []; if (!get(base, def.key)) set(base, def.key, arr);
      const move = (i, d) => { const [x] = arr.splice(i, 1); arr.splice(i + d, 0, x); changed(true); };
      return wrap(def, h("div", { class: "rows" },
        arr.map((it, i) => h("div", { class: "card" },
          h("div", { class: "card-head" }, h("b", null, it[def.titleKey] || def.noun),
            h("div", { class: "acts" },
              h("button", { type: "button", disabled: i === 0, "aria-label": "Move up", onclick: () => move(i, -1) }, icon("arrow-up")),
              h("button", { type: "button", disabled: i === arr.length - 1, "aria-label": "Move down", onclick: () => move(i, 1) }, icon("arrow-down")),
              h("button", { type: "button", "aria-label": "Remove", onclick: () => { if (confirm(`Remove this ${def.noun}?`)) { arr.splice(i, 1); changed(true); } } }, icon("trash")))),
          def.fields.map((f) => FIELDS[f.type](f, it)))),
        h("div", null, h("button", { type: "button", class: "btn btn--small", onclick: () => { arr.push(def.fresh()); changed(true); } }, icon("plus"), "Add " + def.noun))));
    },
    paste(def, base) {
      const i = id();
      return wrap(def, h("textarea", { id: i, rows: 5, placeholder: def.placeholder, onchange: (e) => {
        const rows = e.target.value.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const m = l.match(/^(.*?)[\s,;\t]+(\d+)\s*$/); return m ? { name: m[1].replace(/[,;]+$/, "").trim(), pts: m[2] } : null; }).filter(Boolean);
        if (!rows.length) { toast("Could not read that list. One person per line, name then points.", true); return; }
        set(base, def.key, rows); e.target.value = ""; changed(true); toast(`${rows.length} members loaded. Press Save when it looks right.`);
      } }), i);
    },
  };

  // ---------------------------------------------------------------- what the editor shows
  const TYPES = () => Object.entries(SITE.eventTypes).map(([k, v]) => [k, v.label]);
  const CATS = () => Object.entries(SITE.accomplishmentCats);
  const autoSlug = (it, title) => { if (it._auto) it.slug = slugify(title); };
  const person = (noun) => ({ type: "cards", noun, titleKey: "name", fresh: () => ({ name: "", title: "", expertise: "", photo: null, linktree: "", bio: "" }), fields: [
    { key: "name", type: "text", label: "Name" }, { key: "title", type: "text", label: "Role or title", placeholder: noun === "leader" ? "CEO" : "Consultant" },
    { key: "expertise", type: "text", label: "Areas of expertise", placeholder: "Social media, content, brand" },
    { key: "photo", type: "image", label: "Headshot", portrait: true },
    { key: "linktree", type: "url", label: "Linktree or LinkedIn link" },
    { key: "bio", type: "textarea", rows: 3, label: "Short bio" } ] });

  const SECTIONS = [
    { id: "events", label: "Events", icon: "calendar-blank", noun: "event", list: "events", titleKey: "title", thumb: "img", hash: () => "#/events",
      lead: "Everything on the Events page and the home page. Upcoming events show the date and time; the room stays on RamsConnect unless you turn locations on in Text and links.",
      sub: (e) => [e.tba ? "Date TBA" : fmtDate(e.date), (SITE.eventTypes[e.type] || {}).label].filter(Boolean).join(" · "),
      fresh: () => ({ id: "ev-" + Date.now().toString(36), title: "", date: "", end: "", time: "", type: "event", series: "", place: "", blurb: "", img: null, points: "", rsvp: "", tba: false, ctaLabel: "", ctaUrl: "" }),
      groups: [
        { title: "The event", fields: [
          { key: "title", type: "text", label: "Title" },
          { key: "date", type: "date", label: "Date" }, { key: "end", type: "date", label: "End date (multi-day only)" },
          { key: "time", type: "text", label: "Time", placeholder: "6:00 to 7:30 PM" },
          { key: "type", type: "select", label: "Type", options: TYPES },
          { key: "series", type: "text", label: "Series", placeholder: "Marketing Week", help: "Optional label, shown as a small tag." },
          { key: "tba", type: "toggle", label: "Date not set yet (shows as TBA)" } ] },
        { title: "Details", fields: [
          { key: "blurb", type: "textarea", rows: 3, label: "Description" },
          { key: "place", type: "text", label: "Room or address", help: "Kept for the record. Shown on past events, and on upcoming ones only if locations are turned on." },
          { key: "points", type: "number", label: "Membership points" },
          { key: "rsvp", type: "url", label: "RamsConnect event link", help: "The Register button goes here. Empty = the chapter's RamsConnect events page." },
          { key: "img", type: "image", label: "Flyer or photo" } ] },
        { title: "Special button (optional)", fields: [
          { key: "ctaLabel", type: "text", label: "Button text", placeholder: "Apply for ICC 2027" },
          { key: "ctaUrl", type: "url", label: "Button link" } ] },
      ] },
    { id: "newsletters", label: "Newsletter", icon: "newspaper", noun: "issue", list: "newsletters", titleKey: "month", hash: () => "#/newsletter",
      lead: "Upload each issue as a PDF (or paste a link to it). The newest issue shows on the Newsletter page and in the home page link; the rest become the archive.",
      sub: (n) => [fmtDate(n.date), n.file ? "PDF" : n.link ? "Link" : "No file yet"].filter(Boolean).join(" · "),
      fresh: () => ({ month: "", date: new Date().toISOString().slice(0, 10), file: "", link: "", blurb: "" }),
      groups: [
        { title: "The issue", fields: [
          { key: "month", type: "text", label: "Issue name", placeholder: "November 2026" },
          { key: "date", type: "date", label: "Date sent", help: "Newest date shows first." },
          { key: "file", type: "file", accept: "application/pdf", label: "PDF of the issue", help: "Up to 12 MB. It shows inside the page and opens in a new tab." },
          { key: "link", type: "url", label: "Or a link to the issue", placeholder: "https://…", help: "Used when there is no PDF (Mailchimp or Canva web view, for example)." },
          { key: "blurb", type: "textarea", rows: 3, label: "Two-line summary", help: "Shown above the issue." } ] },
      ] },
    { id: "leaderboard", label: "Points leaderboard", icon: "trophy", hash: () => "#/accomplishments#leaderboard",
      lead: "Names and points. Names only, no photos. Shown on the Accomplishments page.",
      groups: [
        { title: "Paste a fresh list", fields: [{ key: "leaderboard.members", type: "paste", label: "Paste from your spreadsheet", placeholder: "Jordan R.\t165\nPriya S.\t150", help: "One person per line: name, then points. Replaces the whole list below." }] },
        { title: "The list", fields: [
          { key: "leaderboard.updated", type: "date", label: "Last updated" },
          { key: "leaderboard.members", type: "rows", label: "Members", cols: [["name", "Name", "2fr"], ["pts", "Points", "1fr"]], add: "Add a member" } ] },
      ] },
    { id: "accomplishments", label: "Accomplishments", icon: "medal", noun: "accomplishment", list: "accomplishments", titleKey: "who", hash: () => "#/accomplishments",
      lead: "Members doing big things. Submissions from the website land in the Inbox; add them here with one click, then switch them on.",
      sub: (a) => [a.what, a.approved === false ? "hidden" : null].filter(Boolean).join(" · "),
      off: (a) => a.approved === false,
      fresh: () => ({ who: "", what: "", where: "", when: "", cat: "internship", approved: true }),
      groups: [
        { title: "The win", fields: [
          { key: "who", type: "text", label: "Name" },
          { key: "what", type: "text", label: "What they did", placeholder: "Marketing intern, summer 2027" },
          { key: "where", type: "text", label: "Company, organization or event" },
          { key: "when", type: "text", label: "When", placeholder: "May 2027" },
          { key: "cat", type: "select", label: "Kind", options: CATS },
          { key: "approved", type: "toggle", label: "Show on the site", defaultOn: true } ] },
      ] },
    { id: "albums", label: "Gallery", icon: "images", noun: "album", list: "albums", titleKey: "name", thumb: "cover", hash: (it) => it && it.slug ? "#/gallery/" + it.slug : "#/gallery",
      lead: "One album per event. Upload the photos straight from your phone or laptop; they are resized for you.",
      sub: (a) => [fmtDate(a.date), `${(a.photos || []).length} photos`].filter(Boolean).join(" · "),
      slugged: true,
      fresh: () => ({ _auto: true, slug: "", name: "", date: new Date().toISOString().slice(0, 10), blurb: "", cover: null, photos: [] }),
      groups: [
        { title: "The album", fields: [
          { key: "name", type: "text", label: "Album name", onchange: autoSlug },
          { key: "date", type: "date", label: "Event date" },
          { key: "blurb", type: "textarea", rows: 2, label: "One line about it" },
          { key: "cover", type: "image", label: "Cover photo", help: "If empty, the first photo is used." } ] },
        { title: "Photos", fields: [{ key: "photos", type: "images", label: "Photos in this album" }] },
        { title: "Web address", fields: [{ key: "slug", type: "slug", prefix: "#/gallery/", label: "Link for this album" }] },
      ] },
    { id: "board", label: "Executive board", icon: "users-three", noun: "board member", list: "board", titleKey: "name", thumb: "photo", hash: (it) => it && it.slug ? "#/board/" + it.slug : "#/board",
      lead: "The order here is the order on the site. Every spring: update names, roles, photos and LinkedIn links.",
      sub: (m) => m.role, slugged: true,
      fresh: () => ({ _auto: true, slug: "", name: "", role: "", year: "", major: "", goal: "", fun: "", linkedin: "", bio: "", photo: null }),
      groups: [
        { title: "The person", fields: [
          { key: "name", type: "text", label: "Name", onchange: autoSlug },
          { key: "role", type: "text", label: "Role", placeholder: "Director of Membership" },
          { key: "photo", type: "image", label: "Headshot", portrait: true, help: "A portrait works best. Faces sit near the top of the frame." },
          { key: "linkedin", type: "url", label: "LinkedIn profile link" } ] },
        { title: "About them", fields: [
          { key: "year", type: "text", label: "Year", placeholder: "Junior" }, { key: "major", type: "text", label: "Major", placeholder: "Marketing / Sales" },
          { key: "goal", type: "text", label: "Career goal" }, { key: "fun", type: "text", label: "Fun fact" },
          { key: "bio", type: "textarea", rows: 4, label: "Bio (optional)", help: "Shown on their profile page." } ] },
        { title: "Web address", fields: [{ key: "slug", type: "slug", prefix: "#/board/", label: "Link for this profile" }] },
      ] },
    { id: "advisor", label: "Faculty advisor", icon: "graduation-cap", hash: () => "#/board#advisor", lead: "Shown on the Board page and in the home page board row.",
      groups: [{ title: "Advisor", fields: [
        { key: "advisor.name", type: "text", label: "Name" }, { key: "advisor.title", type: "text", label: "Title on the site", placeholder: "Faculty Advisor" },
        { key: "advisor.role", type: "text", label: "Position", placeholder: "Associate Professor of Marketing, VCU School of Business" },
        { key: "advisor.photo", type: "image", label: "Headshot", portrait: true },
        { key: "advisor.bio", type: "textarea", rows: 4, label: "Bio" }, { key: "advisor.linkedin", type: "url", label: "LinkedIn link" } ] }] },
    { id: "mot", label: "Marketers of Tomorrow", icon: "briefcase", hash: () => "#/mot", lead: "The agency page: status line, consultants, leadership, services and clients.",
      groups: [
        { title: "Applications", fields: [
          { key: "mot.status", type: "text", label: "Status line", placeholder: "Spring 2027 applications open January 20." },
          { key: "mot.applyUrl", type: "url", label: "Application link", help: "Where the Apply button goes." } ] },
        { title: "Consultants", fields: [{ key: "mot.consultants", ...person("consultant"), label: "This semester's consultants" }] },
        { title: "Leadership", fields: [{ key: "mot.leadership", ...person("leader"), label: "Who runs MoT" }] },
        { title: "Areas of concentration", fields: [{ key: "mot.concentrations", type: "rows", label: "Services", cols: [["t", "Service", "1fr"], ["d", "One line about it", "2fr"]], add: "Add a service" }] },
        { title: "Clients and partners", fields: [
          { key: "mot.clients", type: "rows", label: "Past clients", cols: [["name", "Client", "1fr"], ["note", "Project", "1fr"], ["url", "Link (optional)", "1fr"]], add: "Add a client" },
          { key: "mot.partners", type: "rows", label: "Partners", cols: [["name", "Organization", "1fr"], ["note", "What you did together", "1fr"], ["url", "Link (optional)", "1fr"]], add: "Add a partner" } ] },
      ] },
    { id: "alumni", label: "Alumni", icon: "handshake", noun: "alumni story", list: "alumni", titleKey: "name", thumb: "photo", hash: () => "#/opportunities#alumni",
      lead: "Where graduates landed. Shown on the Opportunities & Alumni page.",
      sub: (a) => [a.year ? "Class of " + a.year : "", a.now].filter(Boolean).join(" · "),
      fresh: () => ({ name: "", year: "", now: "", story: "", url: "", photo: null }),
      groups: [{ title: "The alum", fields: [
        { key: "name", type: "text", label: "Name" }, { key: "year", type: "text", label: "Class year", placeholder: "2024" },
        { key: "now", type: "text", label: "What they do now", placeholder: "Brand Manager, Example Co." },
        { key: "story", type: "textarea", rows: 3, label: "A line or two" },
        { key: "url", type: "url", label: "LinkedIn link" }, { key: "photo", type: "image", label: "Photo (optional)", portrait: true } ] }] },
    { id: "posts", label: "Blog", icon: "article", noun: "post", list: "posts", titleKey: "title", thumb: "cover", hash: (it) => it && it.slug ? "#/blog/" + it.slug : "#/blog",
      lead: "Recaps and guides. The three newest also show on the home page under In case you missed it.",
      sub: (p) => [fmtDate(p.date), p.tag].filter(Boolean).join(" · "), slugged: true,
      fresh: () => ({ _auto: true, slug: "", title: "", date: new Date().toISOString().slice(0, 10), tag: "ICYMI", dek: "", body: "", cover: null, instagram: "" }),
      groups: [
        { title: "The post", fields: [
          { key: "title", type: "text", label: "Title", onchange: autoSlug },
          { key: "date", type: "date", label: "Date" }, { key: "tag", type: "text", label: "Tag", placeholder: "ICYMI, Speakers, Guide" },
          { key: "dek", type: "text", label: "One-line teaser" },
          { key: "cover", type: "image", label: "Cover photo" },
          { key: "body", type: "textarea", rows: 12, label: "The post", help: "Leave an empty line between paragraphs." },
          { key: "instagram", type: "url", label: "Instagram post link (optional)", help: "Adds a See the post on Instagram button." } ] },
        { title: "Web address", fields: [{ key: "slug", type: "slug", prefix: "#/blog/", label: "Link for this post" }] },
      ] },
    { id: "faq", label: "FAQ", icon: "question", hash: () => "#/", lead: "The questions at the bottom of the home page.",
      groups: [{ title: "Questions", fields: [{ key: "faq", type: "cards", noun: "question", titleKey: "q", label: "", fresh: () => ({ q: "", a: "", link: "", linkLabel: "" }), fields: [
        { key: "q", type: "text", label: "Question" }, { key: "a", type: "textarea", rows: 3, label: "Answer" },
        { key: "link", type: "text", label: "Link (optional)", placeholder: "#/involved#join", help: "A page on the site (starts with #/) or a full web address." }, { key: "linkLabel", type: "text", label: "Link text", placeholder: "See the four steps" } ] }] }] },
    { id: "settings", label: "Text and links", icon: "gear", hash: () => "#/", lead: "Words on the home page, dues, links and the ICC dates.",
      groups: [
        { title: "Home page words", fields: [
          { key: "settings.tagline", type: "text", label: "Tagline", help: "First sentence under the big headline." },
          { key: "settings.blurb", type: "textarea", rows: 5, label: "What is AMA at VCU" },
          { key: "settings.email", type: "text", label: "Chapter email" } ] },
        { title: "Dues and points", fields: [
          { key: "settings.dues", type: "number", label: "Annual dues (number only)" },
          { key: "settings.duesNote", type: "text", label: "Note under the dues" },
          { key: "settings.activePoints", type: "number", label: "Points for Active Member" } ] },
        { title: "Applications and forms", fields: [
          { key: "settings.iccApplication", type: "url", label: "ICC application" }, { key: "settings.motApplication", type: "url", label: "Marketers of Tomorrow application" },
          { key: "settings.boardApplication", type: "url", label: "Executive board application" }, { key: "settings.becomeMember", type: "url", label: "Membership form" },
          { key: "settings.ramsconnectJoin", type: "url", label: "RamsConnect join link" }, { key: "settings.ramsconnectEvents", type: "url", label: "RamsConnect events page" } ] },
        { title: "Social links", fields: [
          { key: "settings.instagram", type: "url", label: "Instagram" }, { key: "settings.tiktok", type: "url", label: "TikTok" },
          { key: "settings.linkedin", type: "url", label: "LinkedIn page" }, { key: "settings.linktree", type: "url", label: "Linktree" },
          { key: "settings.groupme", type: "url", label: "GroupMe invite" }, { key: "settings.alumniLinkedIn", type: "url", label: "Alumni LinkedIn group" } ] },
        { title: "Donations", fields: [
          { key: "settings.donate", type: "url", label: "One official giving link", help: "If set, every Donate button goes straight there instead of showing Venmo and Cash App." },
          { key: "settings.venmo", type: "url", label: "Venmo link" }, { key: "settings.cashapp", type: "url", label: "Cash App link" } ] },
        { title: "Video and background", fields: [
          { key: "settings.videoYoutube", type: "text", label: "Recruitment video: YouTube id", help: "The part after v= in the YouTube link." },
          { key: "settings.videoInstagram", type: "url", label: "Or an Instagram reel link" },
          { key: "settings.heroVideo", type: "url", label: "Home page background video (mp4 link)", help: "Replaces the campus photos. Leave empty to keep the photos." } ] },
        { title: "Events", fields: [{ key: "settings.showLocations", type: "toggle", label: "Show rooms and addresses on upcoming events", help: "Off = people get the room on RamsConnect when they register." }] },
        { title: "ICC", fields: [
          { key: "settings.iccShort", type: "text", label: "Name", placeholder: "ICC 2027" }, { key: "settings.iccCity", type: "text", label: "City", placeholder: "New Orleans, LA" },
          { key: "settings.iccDates", type: "text", label: "Dates in words", placeholder: "April 8 to 10, 2027" },
          { key: "settings.iccStart", type: "date", label: "First day (the countdown counts to it)" }, { key: "settings.iccEnd", type: "date", label: "Last day" },
          { key: "settings.iccAbout", type: "textarea", rows: 3, label: "About ICC" },
          { key: "settings.fundHead", type: "text", label: "Fundraising headline" }, { key: "settings.fundBody", type: "textarea", rows: 3, label: "Fundraising text" } ] },
      ] },
    { id: "inbox", label: "Inbox", icon: "tray", custom: inboxPanel, hash: () => "#/" },
    { id: "history", label: "History", icon: "clock-counter-clockwise", custom: historyPanel, hash: () => "#/" },
    { id: "account", label: "Password", icon: "lock-key", custom: accountPanel, hash: () => "#/" },
  ];
  const sectionOf = (sid) => SECTIONS.find((s) => s.id === sid);

  // ---------------------------------------------------------------- the content built into the site, as the starting point
  function seed() {
    const A = SITE, L = A.links, M = A.membership, I = A.icc;
    const img = (src, sm) => src ? { src, sm: sm || src, w: 0, h: 0, alt: "" } : null;
    const personOf = (p) => ({ name: p.name, title: p.title || "", expertise: p.expertise || "", photo: img(p.photo), linktree: p.linktree || "", bio: p.bio || "" });
    const orgOf = (o) => ({ name: o.name, note: o.note || "", url: o.url || "" });
    return {
      settings: {
        tagline: A.org.tagline, blurb: A.org.blurb, email: A.org.email, dues: M.dues, duesNote: M.duesNote || "", activePoints: M.activePoints,
        instagram: L.instagram, tiktok: L.tiktok, linkedin: L.linkedin, linktree: L.linktree, groupme: L.groupme, ramsconnect: L.ramsconnect, ramsconnectJoin: L.ramsconnectJoin, ramsconnectEvents: L.ramsconnectEvents,
        becomeMember: L.becomeMember, iccApplication: L.iccApplication, accomplishmentForm: L.accomplishmentForm || "", motApplication: L.motApplication || "", boardApplication: L.boardApplication || "", alumniLinkedIn: L.alumniLinkedIn || "",
        donate: L.donate || "", venmo: L.venmo, cashapp: L.cashapp, googleCalendar: L.googleCalendar, newsletterArchive: L.newsletterArchive,
        videoYoutube: A.video.youtube || "", videoInstagram: A.video.instagram || "", heroVideo: A.hero.video || "", showLocations: !!(A.integrations && A.integrations.showLocations),
        iccShort: I.short, iccCity: I.city, iccDates: I.dates, iccStart: I.start.slice(0, 10), iccEnd: I.end, iccAbout: I.about, fundHead: I.fundraising.head, fundBody: I.fundraising.body,
      },
      events: A.events.map((e) => ({ id: e.id, title: e.title, date: e.date || "", end: e.end || "", time: e.time || "", type: e.type, series: e.series || "", place: e.place || "", blurb: e.blurb || "", img: img(e.img), points: e.points || "", rsvp: e.rsvp || "", tba: !!e.tba, ctaLabel: e.cta ? e.cta.label : "", ctaUrl: e.cta ? e.cta.url : "" })),
      newsletters: [],
      leaderboard: { updated: A.leaderboard.updated, members: A.leaderboard.members.map((m) => ({ name: m.name, pts: String(m.pts) })) },
      accomplishments: A.accomplishments.filter((a) => !a.placeholder).map((a) => ({ who: a.who, what: a.what, where: a.where || "", when: a.when || "", cat: a.cat, approved: true })),
      albums: A.albums.map((a) => ({ slug: a.slug, name: a.name, date: a.date || "", blurb: a.blurb || "",
        cover: a.cover && A.gallery.find((g) => g.f === a.cover) ? img(`assets/img/gallery/${a.cover}.webp`, `assets/img/gallery/t/${a.cover}.webp`) : null,
        photos: A.gallery.filter((g) => g.album === a.name).map((g) => ({ src: `assets/img/gallery/${g.f}.webp`, sm: `assets/img/gallery/t/${g.f}.webp`, w: g.w, h: g.h, alt: g.cap })) })),
      board: A.board.map((m) => ({ slug: m.slug, name: m.name, role: m.role, year: m.year, major: m.major, goal: m.goal, fun: m.fun, linkedin: m.linkedin || "", bio: m.bio || "", photo: img(`assets/img/board/${m.slug}.webp`) })),
      advisor: { name: A.org.advisor.name, title: A.org.advisor.title, role: A.org.advisor.role, bio: A.org.advisor.bio || "", linkedin: A.org.advisor.linkedin || "", photo: img(A.org.advisor.photo) },
      mot: { status: A.agency.status, applyUrl: A.agency.applyUrl, consultants: A.agency.consultants.map(personOf), leadership: A.agency.leadership.map(personOf), concentrations: A.agency.concentrations.map((c) => ({ t: c.t, d: c.d || "" })), clients: A.agency.clients.map(orgOf), partners: A.agency.partners.map(orgOf) },
      alumni: A.alumni.stories.map((s) => ({ name: s.name, year: s.year || "", now: s.now || "", story: s.story || "", url: s.url || "", photo: img(s.photo) })),
      posts: A.posts.map((p) => ({ slug: p.slug, title: p.title, date: p.date, tag: p.tag, dek: p.dek, body: p.body.join("\n\n"), cover: img(p.cover, p.thumb), instagram: p.instagram || "", gallery: p.gallery || [] })),
      faq: A.faq.map((f) => ({ q: f.q, a: f.a, link: f.link || "", linkLabel: f.linkLabel || "" })),
    };
  }
  // an older save may lack keys added later: fill the holes from the built-in content
  function fill(c) {
    const s = seed();
    for (const k of Object.keys(s)) {
      if (c[k] === undefined || c[k] === null) c[k] = s[k];
      else if (!Array.isArray(s[k]) && typeof s[k] === "object") for (const kk of Object.keys(s[k])) if (c[k][kk] === undefined) c[k][kk] = s[k][kk];
    }
    return c;
  }

  // ---------------------------------------------------------------- change tracking + preview
  function changed(redraw) {
    updateStatus();
    if (redraw) drawPanel(true);
    clearTimeout(previewTimer);
    previewTimer = setTimeout(pushPreview, 220);
  }
  function previewHash() {
    const s = sectionOf(view.section);
    const it = s.list && view.item != null ? draft[s.list][view.item] : null;
    return s.hash ? s.hash(it) : "#/";
  }
  function pushPreview() {
    const f = $("#pv");
    if (f && previewReady && f.contentWindow) f.contentWindow.postMessage({ type: "ama:draft", content: draft, hash: previewHash() }, location.origin);
  }
  addEventListener("message", (e) => { if (e.origin === location.origin && e.data && e.data.type === "ama:ready") { previewReady = true; pushPreview(); } });

  function updateStatus() {
    const s = $("#status"), b = $("#save"); if (!s) return;
    const d = dirty();
    s.className = "status " + (d ? "dirty" : "saved");
    s.replaceChildren(icon(d ? "circle-dashed" : "check-circle"), d ? "Changes not saved yet" : "Everything is saved");
    b.disabled = !d;
  }
  addEventListener("beforeunload", (e) => { if (draft && dirty()) { e.preventDefault(); e.returnValue = ""; } });
  addEventListener("keydown", (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && draft) { e.preventDefault(); save(); } });

  async function save() {
    for (const s of SECTIONS.filter((x) => x.list)) {
      const used = new Set();
      for (const it of draft[s.list] || []) {
        if (!String(it[s.titleKey] || "").trim()) { goSection(s.id, draft[s.list].indexOf(it)); toast(`Give this ${s.noun} a ${s.titleKey === "who" ? "name" : s.titleKey === "month" ? "name" : s.titleKey} before saving.`, true); return; }
        if (s.slugged) {
          let base = slugify(it.slug || it[s.titleKey]) || s.noun.replace(/\s+/g, "-"), slug = base, n = 2;
          while (used.has(slug)) slug = `${base}-${n++}`;
          used.add(slug); it.slug = slug;
        }
        delete it._auto;
      }
    }
    const btn = $("#save");
    await busy(btn, "Saving…", async () => {
      await api("content", { method: "PUT", json: draft });
      savedText = JSON.stringify(draft); firstRun = false;
      toast("Saved. The site is updated.");
    });
    updateStatus(); drawPanel(true); pushPreview();
  }

  // ---------------------------------------------------------------- screens
  function drawAll() {
    app.replaceChildren(h("div", { class: "shell" },
      h("header", { class: "top" },
        h("div", { class: "top-title", html: MARK }, h("span", null, "AMA at VCU", h("small", null, " Site editor"))),
        h("span", { id: "status", class: "status" }),
        h("button", { class: "btn btn--small hide-narrow", onclick: () => { showPreview = !showPreview; drawAll(); } }, icon(showPreview ? "eye-slash" : "eye"), showPreview ? "Hide preview" : "Show preview"),
        h("a", { class: "btn btn--small", href: "/", target: "_blank", rel: "noopener" }, icon("arrow-square-out"), "View site"),
        h("button", { id: "save", class: "btn btn--main", onclick: save }, icon("floppy-disk"), "Save")),
      h("div", { class: "body" + (showPreview ? "" : " no-preview") },
        h("nav", { class: "side", "aria-label": "Sections" }, SECTIONS.map((s) => [
          s.id === "faq" || s.id === "inbox" ? h("hr") : null,
          h("button", { type: "button", "data-sec": s.id, "aria-current": view.section === s.id ? "true" : null, onclick: () => goSection(s.id) }, icon(s.icon), s.label,
            s.id === "inbox" && inboxCount ? h("span", { class: "badge" }, inboxCount) : null)])),
        h("main", { class: "panel", id: "panel" }),
        h("aside", { class: "preview" + (phone ? " phone" : ""), "aria-label": "Live preview" },
          h("div", { class: "preview-bar" }, h("span", null, "Live preview (nothing changes for visitors until you press Save)"),
            h("button", { class: "btn btn--small", onclick: () => { phone = !phone; $(".preview").classList.toggle("phone", phone); } }, icon("device-mobile"), "Phone / desktop")),
          h("div", { class: "preview-stage" }, h("iframe", { id: "pv", title: "Live preview of the site", src: "/?preview=1&fx=0" + previewHash() }))))));
    previewReady = false;
    drawPanel(); updateStatus();
  }

  function goSection(sid, item = null) {
    view = { section: sid, item };
    document.querySelectorAll(".side button").forEach((b) => { if (b.dataset.sec === sid) b.setAttribute("aria-current", "true"); else b.removeAttribute("aria-current"); });
    drawPanel(); pushPreview();
  }

  function drawPanel(keepScroll) {
    const p = $("#panel"); if (!p) return;
    const y = keepScroll ? p.scrollTop : 0, wy = keepScroll ? scrollY : 0;
    const s = sectionOf(view.section);
    let nodes;
    if (s.custom) nodes = s.custom();
    else if (s.list && view.item == null) nodes = listPanel(s);
    else if (s.list) nodes = itemPanel(s);
    else nodes = [h("div", { class: "panel-head" }, h("h2", null, s.label)), h("p", { class: "lead" }, s.lead), groups(s.groups, draft)];
    const banner = firstRun ? h("div", { class: "note" }, "This is the content built into the site. Change anything, then press Save: from then on the site shows what you save here.") : null;
    p.replaceChildren(...[banner, nodes].flat(3).filter(Boolean));
    p.scrollTop = y; if (keepScroll) scrollTo(0, wy);
  }

  const groups = (gs, base) => gs.map((g) => h("section", { class: "group" }, h("h3", null, g.title), g.fields.map((f) => FIELDS[f.type](f, base))));

  function listPanel(s) {
    const arr = draft[s.list] || (draft[s.list] = []);
    const move = (i, d) => { const [x] = arr.splice(i, 1); arr.splice(i + d, 0, x); changed(true); };
    const open = (i) => { view.item = i; drawPanel(); pushPreview(); };
    return [
      h("div", { class: "panel-head" }, h("h2", null, s.label),
        h("button", { class: "btn btn--main btn--small", onclick: () => { arr.unshift(s.fresh()); view.item = 0; changed(true); } }, icon("plus"), "Add " + s.noun)),
      h("p", { class: "lead" }, s.lead),
      arr.length ? h("div", { class: "items" }, arr.map((it, i) => {
        const im = s.thumb && it[s.thumb];
        return h("div", { class: "item" + (s.off && s.off(it) ? " off" : "") },
          h("div", { class: "thumb", style: im ? `background-image:url("${thumbUrl(im)}")` : "" }, im ? null : icon(s.icon)),
          h("button", { type: "button", class: "item-main", onclick: () => open(i) }, h("b", null, it[s.titleKey] || `Untitled ${s.noun}`), h("span", null, s.sub(it))),
          h("div", { class: "acts" },
            h("button", { class: "btn btn--icon", disabled: i === 0, "aria-label": "Move up", onclick: () => move(i, -1) }, icon("arrow-up")),
            h("button", { class: "btn btn--icon", disabled: i === arr.length - 1, "aria-label": "Move down", onclick: () => move(i, 1) }, icon("arrow-down")),
            h("button", { class: "btn btn--small", onclick: () => open(i) }, "Edit")));
      })) : h("div", { class: "empty" }, `No ${s.noun} yet. Press “Add ${s.noun}” to start.`),
    ];
  }

  function itemPanel(s) {
    const arr = draft[s.list], it = arr[view.item];
    if (!it) { view.item = null; return listPanel(s); }
    const back = () => { view.item = null; drawPanel(); pushPreview(); };
    return [
      h("div", { class: "panel-head" },
        h("button", { class: "btn btn--small", onclick: back }, icon("arrow-left"), "All " + s.label.toLowerCase()),
        h("h2", null, it[s.titleKey] || `New ${s.noun}`),
        h("button", { class: "btn btn--small", onclick: () => { const c = clone(it); c[s.titleKey] = (c[s.titleKey] || s.noun) + " copy"; if (s.slugged) { c._auto = true; c.slug = slugify(c[s.titleKey]); } arr.splice(view.item + 1, 0, c); view.item++; changed(true); } }, icon("copy"), "Duplicate"),
        h("button", { class: "btn btn--small btn--danger", onclick: () => { if (confirm(`Delete “${it[s.titleKey] || "this " + s.noun}”? You can bring it back from History after saving.`)) { arr.splice(view.item, 1); view.item = null; changed(true); } } }, icon("trash"), "Delete")),
      h("p", { class: "lead" }, ""),
      groups(s.groups, it),
    ];
  }

  function inboxPanel() {
    const box = h("div", { class: "inbox" }, h("p", { class: "help" }, "Loading…"));
    const fmt = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    const KIND = { accomplishment: "Accomplishment", idea: "Event idea", feedback: "Feedback" };
    const LABEL = { name: "Name", email: "Email", category: "Kind", what: "Accomplishment", where: "Where", when: "When", feature: "OK for Instagram", title: "Idea", why: "Why", type: "About", text: "Feedback" };
    const load = () => api("inbox").then(({ items }) => {
      inboxCount = items.length; const badge = $('.side [data-sec="inbox"] .badge'); if (badge) badge.textContent = items.length || "";
      box.replaceChildren(...(items.length ? items.map((m) => h("div", { class: "msg" },
        h("div", { class: "msg-head" }, h("span", { class: "kind" }, KIND[m.kind] || m.kind), h("time", null, fmt(m.t)),
          m.kind === "accomplishment" ? h("button", { class: "btn btn--small btn--main", onclick: () => {
            const f = m.fields || {};
            draft.accomplishments.unshift({ who: f.name || "", what: f.what || "", where: f.where || "", when: f.when || "", cat: SITE.accomplishmentCats[f.category] ? f.category : "other", approved: true });
            changed(); toast("Added to Accomplishments. Press Save to publish it.");
            goSection("accomplishments", 0);
          } }, icon("plus"), "Add to the site") : null,
          m.fields && m.fields.email ? h("a", { class: "btn btn--small", href: `mailto:${m.fields.email}` }, icon("envelope-simple"), "Reply") : null,
          h("button", { class: "btn btn--small btn--danger", onclick: async (e) => { if (!confirm("Delete this submission?")) return; await busy(e.currentTarget, "…", () => api("inbox/" + encodeURIComponent(m.id), { method: "DELETE" })); load(); } }, icon("trash"), "Delete")),
        h("dl", null, Object.entries(m.fields || {}).filter(([, v]) => String(v).trim()).map(([k, v]) => [h("dt", null, LABEL[k] || k), h("dd", null, v)])))) : [h("p", { class: "help" }, "Nothing here. Accomplishment submissions, event ideas and feedback from the website land in this list.")]));
    }).catch((e) => { box.replaceChildren(h("p", { class: "err" }, e.message)); if (e.status === 401) gate(); });
    load();
    return [h("div", { class: "panel-head" }, h("h2", null, "Inbox")), h("p", { class: "lead" }, "What people sent through the website forms. Accomplishments can be added to the site with one click; ideas and feedback are here to read."), box];
  }

  function historyPanel() {
    const box = h("div", { class: "versions" }, h("p", { class: "help" }, "Loading…"));
    const fmt = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    api("history").then(({ versions }) => {
      box.replaceChildren(...(versions.length ? versions.map((v, i) => h("div", { class: "version" }, h("span", null, fmt(v), i === 0 ? " (live now)" : ""),
        i === 0 ? null : h("button", { class: "btn btn--small", onclick: async (e) => {
          const c = await busy(e.currentTarget, "Loading…", () => api("history/" + encodeURIComponent(v)));
          if (c) { draft = fill(c); view = { section: "events", item: null }; drawAll(); toast("Old version loaded. Press Save to make it live."); }
        } }, "Bring this back"))) : [h("p", { class: "help" }, "No saves yet. Every time you press Save, a copy lands here.")]));
    }).catch((e) => { box.replaceChildren(h("p", { class: "err" }, e.message)); if (e.status === 401) gate(); });
    return [
      h("div", { class: "panel-head" }, h("h2", null, "History")),
      h("p", { class: "lead" }, "The last 25 saves are kept. Made a mess? Bring an older version back, then press Save."),
      box,
      h("section", { class: "group", style: "margin-top:18px" }, h("h3", null, "Backup"),
        h("div", { class: "help" }, "Download everything as one file, or load a backup file."),
        h("div", { class: "btnrow" },
          h("button", { class: "btn btn--small", onclick: () => {
            const a = h("a", { href: URL.createObjectURL(new Blob([JSON.stringify(draft, null, 1)], { type: "application/json" })), download: `ama-site-backup-${new Date().toISOString().slice(0, 10)}.json` });
            document.body.append(a); a.click(); a.remove();
          } }, icon("download-simple"), "Download backup"),
          h("button", { class: "btn btn--small", onclick: async () => {
            const [f] = await pickFiles("application/json,.json"); if (!f) return;
            try { const c = JSON.parse(await f.text()); if (!Array.isArray(c.events) || !Array.isArray(c.board)) throw 0; draft = fill(c); drawAll(); toast("Backup loaded. Press Save to make it live."); }
            catch { toast("That file is not a site backup.", true); }
          } }, icon("upload-simple"), "Load a backup"),
          h("button", { class: "btn btn--small btn--danger", onclick: () => { if (confirm("Replace everything in the editor with the content built into the site? Nothing changes for visitors until you press Save.")) { draft = seed(); drawAll(); toast("Built-in content loaded. Press Save to make it live."); } } }, icon("arrow-counter-clockwise"), "Start over from the built-in content"))),
    ];
  }

  function accountPanel() {
    const cur = h("input", { type: "password", id: "pw0", autocomplete: "current-password" });
    const a = h("input", { type: "password", id: "pw1", autocomplete: "new-password" });
    const b = h("input", { type: "password", id: "pw2", autocomplete: "new-password" });
    const err = h("div", { class: "err" });
    return [
      h("div", { class: "panel-head" }, h("h2", null, "Password")),
      h("p", { class: "lead" }, "One shared board password. Changing it signs every other device out, so tell the rest of the board."),
      h("form", { class: "group", onsubmit: async (e) => {
        e.preventDefault(); err.textContent = "";
        if (a.value.length < 10) { err.textContent = "Use at least 10 characters."; return; }
        if (a.value !== b.value) { err.textContent = "The two new passwords do not match."; return; }
        try { await api("password", { method: "POST", json: { current: cur.value, next: a.value } }); cur.value = a.value = b.value = ""; toast("Password changed."); }
        catch (x) { err.textContent = x.message; }
      } },
        h("div", { class: "f" }, h("label", { for: "pw0" }, "Current password"), cur),
        h("div", { class: "f" }, h("label", { for: "pw1" }, "New password"), h("div", { class: "help" }, "At least 10 characters."), a),
        h("div", { class: "f" }, h("label", { for: "pw2" }, "New password again"), b),
        err, h("div", null, h("button", { class: "btn btn--main" }, "Change password"))),
      h("section", { class: "group" }, h("h3", null, "Sign out"),
        h("div", null, h("button", { class: "btn", onclick: async () => { if (dirty() && !confirm("You have changes that are not saved. Sign out anyway?")) return; await api("logout", { method: "POST" }).catch(() => {}); savedText = JSON.stringify(draft); location.reload(); } }, icon("sign-out"), "Sign out of this device"))),
    ];
  }

  // ---------------------------------------------------------------- login / first-time setup
  function gate(mode) {
    const err = h("div", { class: "err" });
    const done = async () => { if (draft) { toast("You are signed in again."); drawAll(); } else await boot(); };
    let card;
    const head = h("div", { class: "mark", html: MARK });
    if (mode === "setup") {
      const code = h("input", { type: "text", id: "g0", autocomplete: "off" });
      const a = h("input", { type: "password", id: "g1", autocomplete: "new-password" });
      const b = h("input", { type: "password", id: "g2", autocomplete: "new-password" });
      card = [head, h("h1", null, "Set the board password"), h("p", null, "Enter the setup code the chapter was given, then choose a password the board will share."),
        h("form", { onsubmit: async (e) => {
          e.preventDefault(); err.textContent = "";
          if (a.value.length < 10) { err.textContent = "Use at least 10 characters."; return; }
          if (a.value !== b.value) { err.textContent = "The two passwords do not match."; return; }
          try { await api("setup", { method: "POST", json: { code: code.value, password: a.value } }); await done(); } catch (x) { err.textContent = x.message; }
        } },
          h("div", { class: "f" }, h("label", { for: "g0" }, "Setup code"), code),
          h("div", { class: "f" }, h("label", { for: "g1" }, "New password"), a),
          h("div", { class: "f" }, h("label", { for: "g2" }, "New password again"), b),
          err, h("button", { class: "btn btn--main" }, "Save password and open the editor"),
          h("button", { type: "button", class: "linkish", onclick: () => gate("login") }, "I already have the password"))];
    } else {
      const pw = h("input", { type: "password", id: "g3", autocomplete: "current-password" });
      card = [head, h("h1", null, "Site editor"), h("p", null, "Sign in to update the AMA at VCU website."),
        h("form", { onsubmit: async (e) => {
          e.preventDefault(); err.textContent = "";
          try { await api("login", { method: "POST", json: { password: pw.value } }); await done(); } catch (x) { err.textContent = x.message; }
        } },
          h("div", { class: "f" }, h("label", { for: "g3" }, "Board password"), pw),
          err, h("button", { class: "btn btn--main" }, "Sign in"),
          h("button", { type: "button", class: "linkish", onclick: () => gate("setup") }, "Forgot it, or first time here? Use the setup code"))];
    }
    app.replaceChildren(h("div", { class: "gate" }, h("div", { class: "gate-card" }, card)));
    const first = $("input", app); if (first) first.focus();
  }

  async function boot() {
    let s;
    try { s = await api("session"); }
    catch (e) {
      app.replaceChildren(h("div", { class: "gate" }, h("div", { class: "gate-card" }, h("div", { class: "mark", html: MARK }), h("h1", null, "Editor not available here"),
        h("p", null, "This copy of the site has no backend. Open the editor on the live site: "), h("a", { class: "btn btn--main", href: "https://amavcu.pages.dev/admin" }, "amavcu.pages.dev/admin"))));
      return;
    }
    if (!s.authed) return gate(s.setupNeeded ? "setup" : "login");
    const r = await api("content");
    if (r.content) { draft = fill(r.content); savedText = JSON.stringify(r.content); }
    else { draft = seed(); savedText = ""; firstRun = true; }
    api("inbox").then(({ items }) => { inboxCount = items.length; const b = $('.side [data-sec="inbox"]'); if (b && items.length && !$(".badge", b)) b.append(h("span", { class: "badge" }, items.length)); }).catch(() => {});
    drawAll();
  }
  boot();
})();
