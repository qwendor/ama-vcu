// Shared helpers for the site's small backend (Cloudflare Pages Functions).
// Everything is stored in one KV namespace, bound as env.SITE:
//   content            what the board saved in /admin (JSON). Missing = the site shows js/data.js as is
//   hist:<ISO time>    the last 25 saved versions, for "History" in the editor
//   media:<id>         uploaded images / PDFs (binary, with metadata)
//   inbox:<ISO time>   submissions from the website forms (accomplishments, ideas, feedback)
//   sys:auth           password hash + salt (never the password itself)
//   sys:secret         random key used to sign login cookies
//   rl:<ip>            failed-login / submission counter (expires on its own)

const enc = new TextEncoder();
const dec = new TextDecoder();

export const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });

const b64u = (buf) => {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

export function safeEqual(a, b) {
  a = String(a); b = String(b);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

// ---- passwords: PBKDF2-SHA256, 100k rounds, random salt. Only the hash is stored.
export async function hashPassword(password, saltB64) {
  const salt = saltB64 ? fromB64u(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100000 }, key, 256);
  return { salt: b64u(salt), hash: b64u(bits) };
}

export const getAuth = (env) => env.SITE.get("sys:auth", "json");

export async function setPassword(env, password) {
  const prev = await getAuth(env);
  const { salt, hash } = await hashPassword(password);
  // v changes on every password change, which signs every older login out.
  await env.SITE.put("sys:auth", JSON.stringify({ salt, hash, v: (prev?.v || 0) + 1, updated: new Date().toISOString() }));
}

export async function checkPassword(env, password) {
  const auth = await getAuth(env);
  if (!auth) return false;
  const { hash } = await hashPassword(password, auth.salt);
  return safeEqual(hash, auth.hash);
}

// ---- login cookie: a signed, expiring token. No session table needed.
async function hmac(env, payload) {
  let secret = await env.SITE.get("sys:secret");
  if (!secret) {
    secret = b64u(crypto.getRandomValues(new Uint8Array(32)));
    await env.SITE.put("sys:secret", secret);
  }
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64u(await crypto.subtle.sign("HMAC", key, enc.encode(payload)));
}

const COOKIE = "ama_session";
const DAYS = 30;

export async function sessionCookie(request, env) {
  const auth = await getAuth(env);
  const payload = b64u(enc.encode(JSON.stringify({ exp: Date.now() + DAYS * 864e5, v: auth?.v || 0 })));
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE}=${payload}.${await hmac(env, payload)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${DAYS * 86400}${secure}`;
}

export const clearCookie = () => `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

export async function isAuthed(request, env) {
  const m = (request.headers.get("cookie") || "").match(/(?:^|;\s*)ama_session=([^;]+)/);
  if (!m) return false;
  const [payload, sig] = m[1].split(".");
  if (!payload || !sig || !safeEqual(sig, await hmac(env, payload))) return false;
  try {
    const data = JSON.parse(dec.decode(fromB64u(payload)));
    const auth = await getAuth(env);
    return !!auth && data.exp > Date.now() && data.v === auth.v;
  } catch {
    return false;
  }
}

// ---- brute-force guard: 8 wrong tries locks that network address out for 15 minutes.
export const ipOf = (request) => request.headers.get("cf-connecting-ip") || "local";

export async function tooManyTries(request, env, limit = 8, prefix = "rl:") {
  const rec = await env.SITE.get(prefix + ipOf(request), "json");
  return !!rec && rec.n >= limit;
}
export async function noteFailure(request, env, prefix = "rl:", ttl = 900) {
  const key = prefix + ipOf(request);
  const rec = (await env.SITE.get(key, "json")) || { n: 0 };
  await env.SITE.put(key, JSON.stringify({ n: rec.n + 1 }), { expirationTtl: ttl });
}
export const clearFailures = (request, env) => env.SITE.delete("rl:" + ipOf(request));

// ---- only accept changes that come from this site's own pages.
export function sameOrigin(request) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("x-requested-with") === "ama-admin";
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

// ---- content: the board's saved copy, or null when nothing has been saved yet.
export const loadContent = (env) => env.SITE.get("content", "json");

export const randomId = (n = 12) => {
  const abc = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => abc[b % abc.length]).join("");
};
