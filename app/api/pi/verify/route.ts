import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "pi_user";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/* ===============================
   ENCODE / DECODE
================================ */
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

/* ===============================
   COOKIE BUILDER (SAFE)
================================ */
function buildCookie(value: string, age = MAX_AGE) {
  const isProd = process.env.NODE_ENV === "production";

  const expires = new Date(Date.now() + age * 1000).toUTCString();

  return [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${age}`,
    `Expires=${expires}`,
    "HttpOnly",
    "SameSite=None",
    ...(isProd ? ["Secure"] : []), // ✅ chỉ bật Secure khi production
  ].join("; ");
}

/* ===============================
   🔹 GET — CHECK SESSION
================================ */
export function GET(req: NextRequest) {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  const user = raw ? decodeUser(raw) : null;

  return NextResponse.json({
    success: !!user,
    user: user || null,
  });
}

/* ===============================
   🔹 POST — LOGIN
================================ */
export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "missing_access_token" },
        { status: 400 }
      );
    }

    const isTestnet = process.env.NEXT_PUBLIC_PI_ENV === "testnet";

    const PI_API_URL = isTestnet
      ? "https://api.minepi.com/v2/sandbox/me"
      : "https://api.minepi.com/v2/me";

    const piRes = await fetch(PI_API_URL, {
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

    const user = {
      username: data.username,
      uid: data.uid || `user_${data.username}`,
      wallet_address: data.wallet_address ?? null,
      created_at: data.created_at ?? new Date().toISOString(),
      roles: data.roles ?? [],
    };

    const cookieValue = encodeUser(user);

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

/* ===============================
   🔹 DELETE — LOGOUT
================================ */
export function DELETE() {
  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", buildCookie("deleted", 0));
  return res;
}
