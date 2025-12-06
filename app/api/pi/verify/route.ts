import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "pi_user";
const MAX_AGE = 60 * 60 * 24 * 30;

/* ============================================================
   ENCODE / DECODE
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
   COOKIE (FULL SAFARI SUPPORT)
============================================================ */
function buildCookie(value: string, age = MAX_AGE) {
  return [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${age}`,
    "HttpOnly",
    "SameSite=None",
    "Secure",
  ].join("; ");
}

/* ============================================================
   ADD SAFARI CORS HEADERS
============================================================ */
function withCORS(res: NextResponse) {
  res.headers.set("Access-Control-Allow-Origin", "https://muasam.titi.onl");
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  return res;
}

/* ============================================================
   OPTIONS (IMPORTANT FOR SAFARI)
============================================================ */
export function OPTIONS() {
  return withCORS(NextResponse.json({ ok: true }));
}

/* ============================================================
   GET — READ SESSION
============================================================ */
export function GET(req: NextRequest) {
  const cookieRaw = req.cookies.get(COOKIE_NAME)?.value;
  const user = cookieRaw ? decodeUser(cookieRaw) : null;

  return withCORS(
    NextResponse.json({
      success: !!user,
      user: user || null,
    })
  );
}

/* ============================================================
   POST — LOGIN
============================================================ */
export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return withCORS(
        NextResponse.json({ success: false, error: "missing_token" }, { status: 400 })
      );
    }

    const piRes = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!piRes.ok) {
      return withCORS(
        NextResponse.json({ success: false, error: "invalid_token" }, { status: 401 })
      );
    }

    const data = await piRes.json();

    const user = {
      username: data.username,
      uid: data.uid || `uid_${data.username}`,
      wallet_address: data.wallet_address ?? null,
      created_at: data.created_at ?? new Date().toISOString(),
      roles: data.roles ?? [],
    };

    const cookieValue = encodeUser(user);

    const res = NextResponse.json({ success: true, user });
    res.headers.set("Set-Cookie", buildCookie(cookieValue));

    return withCORS(res);
  } catch (err) {
    console.error("❌ LOGIN ERROR:", err);
    return withCORS(
      NextResponse.json({ success: false, error: "server_error" }, { status: 500 })
    );
  }
}

/* ============================================================
   DELETE — LOGOUT
============================================================ */
export function DELETE() {
  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", buildCookie("deleted", 0));
  return withCORS(res);
}
