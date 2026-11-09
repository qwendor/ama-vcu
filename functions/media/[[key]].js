// /media/<id>  serves files uploaded through the editor (stored in KV).
// Photos that ship with the site live as plain files under assets/ and never reach this function.
export async function onRequestGet({ env, params }) {
  const id = (params.key || []).join("/");
  if (!/^[a-z0-9]+\.[a-z0-9]+$/.test(id)) return new Response("Not found", { status: 404 });
  const { value, metadata } = await env.SITE.getWithMetadata("media:" + id, "arrayBuffer");
  if (!value) return new Response("Not found", { status: 404 });
  return new Response(value, {
    headers: {
      "content-type": (metadata && metadata.type) || "application/octet-stream",
      "cache-control": "public, max-age=31536000, immutable",
      "access-control-allow-origin": "*",
      "x-content-type-options": "nosniff",
    },
  });
}
