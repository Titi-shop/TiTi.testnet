import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "pi_user";
const MAX_AGE = 60 * 60 * 24 * 30;

interface PiUser {
  username: string;
  uid: string;
  wallet_address: string | null;
  created_at: string;
  roles: string[];
}

function encodeUser(user: PiUser) {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64");
}

function decodeUser(raw: string): PiUser | null {
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

function buildCookie(value: string, age = MAX_AGE) {
  const isProd = process.env.NODE_ENV === "production";

  return [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${age}`,
    "HttpOnly",
    "SameSite=None",
    isProd ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

function getCookie(req: NextRequest): PiUser | null {
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  return cookie ? decodeUser(cookie) : null;
}

/* ---------------------- GET SESSION ---------------------- */
export function GET(req: NextRequest) {
  const user = getCookie(req);

  return NextResponse.json({
    success: !!user,
    user: user || null,
  });
}

/* ---------------------- LOGIN (VERIFY TOKEN) ---------------------- */
export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken)
      return NextResponse.json({ success: false }, { status: 400 });

    const piRes = await fetch("https://api.minepi.com/v2/me", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!piRes.ok)
      return NextResponse.json({ success: false, reason: "invalid_token" });

    const data = await piRes.json();

    const user: PiUser = {
      username: data.username,
      uid: data.uid,
      wallet_address: data.wallet_address ?? null,
      created_at: data.created_at ?? new Date().toISOString(),
      roles: data.roles ?? [],
    };

    const cookie = encodeUser(user);

    const res = NextResponse.json({ success: true, user });
    res.headers.set("Set-Cookie", buildCookie(cookie));

    return res;
  } catch (e) {
    return NextResponse.json({ success: false, error: "server_error" });
  }
}

/* ---------------------- LOGOUT ---------------------- */
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", buildCookie("deleted", 0));
  return res;
}
