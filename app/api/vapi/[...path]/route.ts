import { NextRequest, NextResponse } from "next/server";

// Same-origin proxy for the Vapi REST API.
//
// The Vapi Web SDK normally POSTs to https://api.vapi.ai/call/web directly from
// the browser. That request is frequently killed by adblockers, Brave shields,
// corporate firewalls, and some ISPs (it surfaces as a CORS / ERR_FAILED
// "Failed to fetch" after a long timeout). Routing it through our own domain
// makes it indistinguishable from first-party traffic.
//
// Only Vapi call-creation endpoints are allowed through. The browser supplies
// its own public-key Authorization header — no server secrets are involved.

export const runtime = "nodejs";

const VAPI_API_BASE = "https://api.vapi.ai";
const ALLOWED_PATH_PREFIXES = ["call"];

async function proxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const joined = path.join("/");

  if (!ALLOWED_PATH_PREFIXES.some((p) => joined === p || joined.startsWith(`${p}/`))) {
    return NextResponse.json({ error: "Path not allowed" }, { status: 403 });
  }

  const headers: Record<string, string> = {};
  const auth = req.headers.get("authorization");
  if (auth) headers["authorization"] = auth;
  const contentType = req.headers.get("content-type");
  if (contentType) headers["content-type"] = contentType;

  try {
    const upstream = await fetch(`${VAPI_API_BASE}/${joined}${req.nextUrl.search}`, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.text(),
      // Vapi call creation can be slow; don't let the platform default cut it off early
      signal: AbortSignal.timeout(30_000),
    });

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": upstream.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (err) {
    console.error("[VAPI PROXY ERROR]", err);
    return NextResponse.json(
      { error: "Failed to reach Vapi API from server" },
      { status: 502 }
    );
  }
}

export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE };
