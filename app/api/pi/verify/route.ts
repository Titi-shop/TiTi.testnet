import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "pi_user";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Encode user → base64
function encodeUser(user: any) {
  return Buffer.from(JSON.stringify(user)).toString("base64");
}

// Decode user
function decodeUser(raw: string) {
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString());
  } catch {
    return null;
  }
}

// Read user from Cookie
function getUserFromCookie(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/pi_user=([^;]+)/);
  if (!match) return null;
  return decodeUser(match[1]);
}

// Build cookie string
function buildCookie(value: string, maxAge = MAX_AGE) {
  return [
    `${COOKIE_NAME}=${value}`,
    `Path=/`,
    `Max-Age=${maxAge}`,
    "SameSite=Strict",
  ].join("; ");
}

// -------- GET session -------
export async function GET(req: Request) {
  const user = getUserFromCookie(req);

  if (!user) {
    return NextResponse.json({ success: false, user: null });
  }

  const res = NextResponse.json({ success: true, user });
  res.headers.set("Set-Cookie", buildCookie(encodeUser(user)));
  return res;
}

// -------- POST login --------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const accessToken = body?.accessToken;

    if (!accessToken) {
      return NextResponse.json({ success: false }, { status: 400 });
    }

    let user;

    const isTest = process.env.NEXT_PUBLIC_PI_ENV === "testnet";

    if (isTest) {
      user = {
        username: "test_user",
        wallet_address: "TEST123",
        roles: ["tester"],
        created_at: new Date().toISOString(),
      };
    } else {
      const piRes = await fetch("https://api.minepi.com/v2/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!piRes.ok) return NextResponse.json({ success: false });

      const data = await piRes.json();
      user = {
        username: data.username,
        uid: data.uid,
        wallet_address: data.wallet_address,
        roles: data.roles || [],
        created_at: data.created_at || new Date().toISOString(),
      };
    }

    const encoded = encodeUser(user);

    const res = NextResponse.json({ success: true, user });
    res.headers.set("Set-Cookie", buildCookie(encoded));

    return res;
  } catch (err) {
    return NextResponse.json({ success: false });
  }
}

// -------- DELETE logout --------
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", buildCookie("deleted", 0));
  return res;
}
