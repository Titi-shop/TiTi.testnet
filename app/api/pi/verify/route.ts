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
   COOKIE BUILDER — FULLY COMPATIBLE WITH SAFARI + PI BROWSER
============================================================ */
function buildCookie(value: string, age = MAX_AGE) {
  return [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${age}`,
    "HttpOnly",
    "SameSite=Lax" // ⭐ QUAN TRỌNG
  ].join("; ");
}
/* ============================================================
   🔹 GET — FETCH SESSION
============================================================ */
export function GET(req: NextRequest) {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  const user = raw ? decodeUser(raw) : null;

  return NextResponse.json(
    {
      success: !!user,
      user: user || null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

/* ============================================================
   🔹 POST — LOGIN WITH PI TOKEN
============================================================ */
export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "missing_access_token" },
        { status: 400 }
      );
    }

    // 🔥 Fetch login info from Pi Network
    const piRes = await fetch("https://api.minepi.com/v2/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!piRes.ok) {
      return NextResponse.json(
        { success: false, error: "invalid_access_token" },
        { status: 401 }
      );
    }

    const data = await piRes.json();

    // 🔥 FIX: some Pi accounts DO NOT HAVE uid → fallback required
    const user = {
      username: data.username,
      uid: data.uid || `user_${data.username}`,
      wallet_address: data.wallet_address ?? null,
      created_at: data.created_at ?? new Date().toISOString(),
      roles: data.roles ?? [],
    };

    const cookieValue = encodeUser(user);

    // 🔥 MUST return Set-Cookie so Safari accepts
    const res = NextResponse.json({ success: true, user });
    res.headers.set("Set-Cookie", buildCookie(cookieValue));

    return res;
  } catch (err) {
    console.error("❌ PI LOGIN ERROR:", err);
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    );
  }
}

/* ============================================================
   🔹 DELETE — LOGOUT
============================================================ */
export function DELETE() {
  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", buildCookie("deleted", 0));
  return res;
}
