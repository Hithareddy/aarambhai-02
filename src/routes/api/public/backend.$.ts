import { createFileRoute } from "@tanstack/react-router";

/**
 * Same-origin proxy to the FastAPI backend.
 *
 * The hosted preview/published site runs on a *.lovable.app origin that the
 * deployed FastAPI CORS config rejects, so direct browser calls fail with
 * "Failed to fetch". Routing them through this server route makes every call
 * same-origin, which removes CORS from the picture entirely.
 */

const UPSTREAM =
  process.env["BACKEND_API_URL"] ??
  "https://aarambhai-02-backend.onrender.com/api/v1";

const PREFIX = "/api/public/backend";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
} as const;

function upstreamUrl(request: Request): string {
  const url = new URL(request.url);
  const path = url.pathname.slice(PREFIX.length) || "/";
  return `${UPSTREAM}${path}${url.search}`;
}

async function forward(request: Request): Promise<Response> {
  const headers = new Headers();
  const auth = request.headers.get("authorization");
  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  if (auth) headers.set("authorization", auth);
  if (contentType) headers.set("content-type", contentType);
  if (accept) headers.set("accept", accept);

  const method = request.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  try {
    const upstreamResponse = await fetch(upstreamUrl(request), {
      method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
    });

    const responseHeaders = new Headers();
    const upstreamContentType = upstreamResponse.headers.get("content-type");
    if (upstreamContentType) responseHeaders.set("content-type", upstreamContentType);
    Object.entries(CORS_HEADERS).forEach(([key, value]) => responseHeaders.set(key, value));

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Backend proxy request failed", error);
    return new Response(
      JSON.stringify({ detail: "Backend is unreachable. Please try again shortly." }),
      { status: 502, headers: { "content-type": "application/json", ...CORS_HEADERS } },
    );
  }
}

export const Route = createFileRoute("/api/public/backend/$")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      GET: async ({ request }) => forward(request),
      POST: async ({ request }) => forward(request),
      PUT: async ({ request }) => forward(request),
      PATCH: async ({ request }) => forward(request),
      DELETE: async ({ request }) => forward(request),
    },
  },
});
