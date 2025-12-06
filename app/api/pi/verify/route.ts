import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "pi_user";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/* ============================================================
   ENCODE / DECODE USER
============================================================ */
function encodeUser(user: object) {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64");
}

function decodeUser(raw: string) {
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

/* ============================================================
   SAFARI-COMPATIBLE COOKIE
============================================================ */
function buildCookie(value: string, age = MAX_AGE) {
  return [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${age}`,
    "HttpOnly",
    "Secure",
    "SameSite=None",
  ].join("; ");
}

/* ============================================================
   UNIVERSAL CORS (AUTO DETECT DOMAIN)
============================================================ */
function withCORS(req: NextRequest, res: NextResponse) {
  const origin =
    req.headers.get("origin") ||
    "https://app.titi.onl"; // fallback domain nếu không có origin

  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  return res;
}

/* ============================================================
   OPTIONS – REQUIRED FOR SAFARI & PI BROWSER
============================================================ */
export function OPTIONS(req: NextRequest) {
  return withCORS(req, NextResponse.json({ ok: true }));
}

/* ============================================================
   GET – READ SESSION
============================================================ */
export function GET(req: NextRequest) {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  const user = raw ? decodeUser(raw) : null;

  return withCORS(
    req,
    NextResponse.json({
      success: !!user,
      user: user || null,
    })
  );
}

/* ============================================================
   POST – LOGIN USING PI ACCESS TOKEN
============================================================ */
export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return withCORS(
        req,
        NextResponse.json(
          { success: false, error: "missing_access_token" },
          { status: 400 }
        )
      );
    }

    // Fetch user from Pi API
    const piRes = await fetch("https://api.minepi.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!piRes.ok) {
      return withCORS(
        req,
        NextResponse.json(
          { success: false, error: "invalid_access_token" },
          { status: 401 }
        )
      );
    }

    const data = await piRes.json();

    // FIX: Some Pi accounts missing UID → fallback required
    const user = {
      username: data.username,
      uid: data.uid || `uid_${data.username}`,
      wallet_address: data.wallet_address ?? null,
      created_at: data.created_at ?? new Date().toISOString(),
      roles: data.roles ?? [],
    };

    const cookie = encodeUser(user);

    // Create response + set cookie
    const res = NextResponse.json({ success: true, user });
    res.headers.set("Set-Cookie", buildCookie(cookie));

    return withCORS(req, res);
  } catch (err) {
    console.error("❌ LOGIN SERVER ERROR:", err);
    return withCORS(
      req,
      NextResponse.json(
        { success: false, error: "server_error" },
        { status: 500 }
      )
    );
  }
}

/* ============================================================
   DELETE – LOGOUT
============================================================ */
export function DELETE(req: NextRequest) {
  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", buildCookie("deleted", 0));
  return withCORS(req, res);
}
