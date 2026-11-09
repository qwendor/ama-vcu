// /robots.txt  blocks search engines until the board switches "Let Google list this site" on in the editor.
import { loadContent } from "../src/lib.js";

export async function onRequestGet({ env }) {
  let indexable = false;
  try {
    const c = env.SITE ? await loadContent(env) : null;
    indexable = !!(c && c.settings && c.settings.indexable);
  } catch {}
  const body = indexable ? "User-agent: *\nAllow: /\n" : "User-agent: *\nDisallow: /\n";
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-cache" } });
}
