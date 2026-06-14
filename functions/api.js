/**
 * Cloudflare Pages Function — /api/* proxy
 *
 * This runs server-side so ANTHROPIC_API_KEY never reaches the browser.
 * Cloudflare Access sits in front of *.pages.dev, enforcing login before
 * any request even reaches this function.
 *
 * Routes:
 *   POST /api/chat       → Claude messages (streaming)
 *   POST /api/search     → Claude messages with web_search tool
 *   GET  /api/health     → simple ping
 */

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  if (path === "/api/health") {
    return new Response(JSON.stringify({ ok: true }), { headers: cors });
  }

  if (path === "/api/chat" || path === "/api/search") {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: cors,
      });
    }

    const body = await request.json();
    const useSearch = path === "/api/search";

    const claudeBody = {
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: body.system || "",
      messages: body.messages || [],
    };

    if (useSearch) {
      claudeBody.tools = [{ type: "web_search_20250305", name: "web_search" }];
    }

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(claudeBody),
    });

    const data = await resp.json();

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || "API error" }), {
        status: resp.status, headers: cors,
      });
    }

    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");

    return new Response(JSON.stringify({ text }), { headers: cors });
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404, headers: cors,
  });
}
