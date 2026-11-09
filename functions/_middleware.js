// Runs in front of the home document only (see _routes.json). Drops the board's saved content
// into <script id="__content"> so the page paints with the current content on the first frame.
import { loadContent } from "../src/lib.js";

export async function onRequest({ request, env, next }) {
  const url = new URL(request.url);
  if (request.method !== "GET" || !(url.pathname === "/" || url.pathname === "/index.html")) return next();
  const res = await next();
  if (!env.SITE || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  let content = null;
  try { content = await loadContent(env); } catch { return res; }
  if (!content) return res;
  const indexable = !!(content.settings && content.settings.indexable);
  const out = new HTMLRewriter()
    .on("script#__content", { element(el) { el.setInnerContent(JSON.stringify(content).replace(/</g, "\\u003c"), { html: true }); } })
    .on('meta[name="robots"]', { element(el) { el.setAttribute("content", indexable ? "index, follow" : "noindex, nofollow"); } })
    .transform(res);
  const headers = new Headers(out.headers);
  headers.set("cache-control", "no-cache");
  return new Response(out.body, { status: out.status, headers });
}
