// /api/*  the editor's backend.
// Public: GET /api/content, GET /api/session, POST /api/submit (website forms).
// Everything that changes the site needs the login cookie.
import {
  json, isAuthed, sameOrigin, loadContent, getAuth, setPassword, checkPassword, sessionCookie, clearCookie,
  tooManyTries, noteFailure, clearFailures, safeEqual, randomId,
} from "../../src/lib.js";

const MAX_CONTENT = 1_500_000;     // bytes of JSON
const MAX_UPLOAD = 12_000_000;     // bytes per file
const KEEP_VERSIONS = 25;
const MAX_INBOX = 400;
const TYPES = {
  "image/webp": "webp", "image/jpeg": "jpg", "image/png": "png", "image/gif": "gif", "application/pdf": "pdf",
  "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov",
};
const FORMS = { accomplishment: ["name", "email", "category", "what", "where", "when", "feature"], idea: ["title", "why", "name"], feedback: ["type", "text", "name"] };
const goodPassword = (p) => typeof p === "string" && p.length >= 10 && p.length <= 200;
const cors = { "access-control-allow-origin": "*" };

export async function onRequest({ request, env, params }) {
  const path = (params.path || []).join("/");
  const method = request.method;
  try {
    if (!env.SITE) return json({ error: "Storage is not connected (KV binding SITE missing)." }, 500);
    if (method === "OPTIONS") return new Response(null, { status: 204, headers: { ...cors, "access-control-allow-methods": "GET, POST", "access-control-allow-headers": "content-type" } });

    // ---------- public
    if (path === "content" && method === "GET") return json({ content: await loadContent(env), mediaBase: new URL(request.url).origin }, 200, cors);
    if (path === "session" && method === "GET") {
      return json({ authed: await isAuthed(request, env), setupNeeded: !(await getAuth(env)) });
    }
    if (path === "submit" && method === "POST") {
      if (await tooManyTries(request, env, 20, "sub:")) return json({ error: "Too many submissions from this network. Try again later." }, 429);
      let body = {};
      const ct = request.headers.get("content-type") || "";
      if (ct.includes("json")) body = await request.json();
      else { const fd = await request.formData(); fd.forEach((v, k) => { body[k] = String(v); }); }
      if (body.website) return json({ ok: true });                       // honeypot: pretend it worked
      const kind = FORMS[body.form] ? body.form : "feedback";
      const fields = {};
      FORMS[kind].forEach((k) => { if (body[k] != null) fields[k] = String(body[k]).slice(0, 2000); });
      if (!Object.values(fields).some((v) => v.trim())) return json({ error: "Nothing to send." }, 400);
      const stamp = new Date().toISOString();
      await env.SITE.put("inbox:" + stamp + "-" + randomId(4), JSON.stringify({ kind, fields, t: stamp, page: String(body.page || "").slice(0, 200) }));
      await noteFailure(request, env, "sub:", 3600);
      const all = await env.SITE.list({ prefix: "inbox:" });
      const old = all.keys.map((k) => k.name).sort().slice(0, -MAX_INBOX);
      await Promise.all(old.map((k) => env.SITE.delete(k)));
      return json({ ok: true }, 200, cors);
    }

    if (method !== "GET" && method !== "HEAD" && !sameOrigin(request)) return json({ error: "Blocked." }, 403);

    // ---------- first-time setup, or reset with the setup code
    if (path === "setup" && method === "POST") {
      if (await tooManyTries(request, env)) return json({ error: "Too many tries. Wait 15 minutes." }, 429);
      const { code, password } = await request.json();
      if (!env.SETUP_CODE || !safeEqual(String(code || "").trim(), env.SETUP_CODE)) {
        await noteFailure(request, env);
        return json({ error: "That setup code is not right." }, 403);
      }
      if (!goodPassword(password)) return json({ error: "Use at least 10 characters." }, 400);
      await setPassword(env, password);
      await clearFailures(request, env);
      return json({ ok: true }, 200, { "set-cookie": await sessionCookie(request, env) });
    }

    if (path === "login" && method === "POST") {
      if (await tooManyTries(request, env)) return json({ error: "Too many tries. Wait 15 minutes." }, 429);
      const { password } = await request.json();
      if (!(await checkPassword(env, String(password || "")))) {
        await noteFailure(request, env);
        return json({ error: "Wrong password." }, 401);
      }
      await clearFailures(request, env);
      return json({ ok: true }, 200, { "set-cookie": await sessionCookie(request, env) });
    }

    if (path === "logout" && method === "POST") return json({ ok: true }, 200, { "set-cookie": clearCookie() });

    // ---------- everything below needs a login
    if (!(await isAuthed(request, env))) return json({ error: "Please log in again." }, 401);

    if (path === "password" && method === "POST") {
      const { current, next } = await request.json();
      if (!(await checkPassword(env, String(current || "")))) return json({ error: "Current password is wrong." }, 401);
      if (!goodPassword(next)) return json({ error: "Use at least 10 characters." }, 400);
      await setPassword(env, next);
      return json({ ok: true }, 200, { "set-cookie": await sessionCookie(request, env) });
    }

    if (path === "content" && method === "PUT") {
      const text = await request.text();
      if (text.length > MAX_CONTENT) return json({ error: "That is too much text to save at once." }, 413);
      let content;
      try { content = JSON.parse(text); } catch { return json({ error: "Could not read that content." }, 400); }
      if (!content || typeof content !== "object" || !Array.isArray(content.events) || !Array.isArray(content.board)) {
        return json({ error: "That content is missing pieces, so it was not saved." }, 400);
      }
      const stamp = new Date().toISOString();
      await env.SITE.put("content", text);
      await env.SITE.put("hist:" + stamp, text, { metadata: { t: stamp } });
      const all = await env.SITE.list({ prefix: "hist:" });
      const old = all.keys.map((k) => k.name).sort().slice(0, -KEEP_VERSIONS);
      await Promise.all(old.map((k) => env.SITE.delete(k)));
      return json({ ok: true, saved: stamp });
    }

    if (path === "history" && method === "GET") {
      const all = await env.SITE.list({ prefix: "hist:" });
      return json({ versions: all.keys.map((k) => k.name.slice(5)).sort().reverse() });
    }
    if (path.startsWith("history/") && method === "GET") {
      const v = await env.SITE.get("hist:" + decodeURIComponent(path.slice(8)), "json");
      return v ? json(v) : json({ error: "That version is gone." }, 404);
    }

    if (path === "inbox" && method === "GET") {
      const all = await env.SITE.list({ prefix: "inbox:" });
      const keys = all.keys.map((k) => k.name).sort().reverse().slice(0, 200);
      const items = await Promise.all(keys.map(async (k) => ({ id: k.slice(6), ...(await env.SITE.get(k, "json")) })));
      return json({ items: items.filter((x) => x && x.kind) });
    }
    if (path.startsWith("inbox/") && method === "DELETE") {
      await env.SITE.delete("inbox:" + decodeURIComponent(path.slice(6)));
      return json({ ok: true });
    }

    if (path === "media" && method === "GET") {
      const all = await env.SITE.list({ prefix: "media:" });
      const items = all.keys
        .map((k) => ({ url: "/media/" + k.name.slice(6), ...(k.metadata || {}) }))
        .filter((m) => m.role !== "small")
        .sort((a, b) => String(b.t || "").localeCompare(String(a.t || "")));
      return json({ items });
    }
    if (path === "media" && method === "POST") {
      const type = (request.headers.get("content-type") || "").split(";")[0].trim();
      const ext = TYPES[type];
      if (!ext) return json({ error: "Only images (JPG, PNG, WebP, GIF), PDFs and videos (mp4, webm, mov) can be uploaded." }, 415);
      const body = await request.arrayBuffer();
      if (!body.byteLength) return json({ error: "That file is empty." }, 400);
      if (body.byteLength > MAX_UPLOAD) return json({ error: "That file is too big (12 MB limit)." }, 413);
      const id = randomId() + "." + ext;
      const meta = {
        type, size: body.byteLength, t: new Date().toISOString(),
        name: decodeURIComponent(request.headers.get("x-name") || "").slice(0, 120),
        w: Number(request.headers.get("x-width")) || 0, h: Number(request.headers.get("x-height")) || 0,
        role: request.headers.get("x-role") === "small" ? "small" : "full",
      };
      const sm = request.headers.get("x-sm") || "";
      if (/^\/media\/[a-z0-9]+\.[a-z0-9]+$/.test(sm)) meta.sm = sm;
      await env.SITE.put("media:" + id, body, { metadata: meta });
      return json({ ok: true, url: "/media/" + id, ...meta });
    }
    if (path.startsWith("media/") && method === "DELETE") {
      await env.SITE.delete("media:" + decodeURIComponent(path.slice(6)));
      return json({ ok: true });
    }

    return json({ error: "Not found." }, 404);
  } catch (err) {
    return json({ error: "Something went wrong on the server.", detail: String(err && err.message || err) }, 500);
  }
}
