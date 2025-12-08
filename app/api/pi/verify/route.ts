import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const COOKIE_NAME = "pi_user";
const MAX_AGE = 60 * 60 * 24 * 30;

function encodeUser(user: object) {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64");
}

function decodeUser(value: string) {
  try {
    return JSON.parse(Buffer.from(value, "base64").toString("utf8"));
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const raw = req.cookies.get(COOKIE_NAME)?.value || null;
  const user = raw ? decodeUser(raw) : null;

  return NextResponse.json({
    success: !!user,
    user: user || null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken)
      return NextResponse.json({ success: false, error: "Missing access token" }, { status: 400 });

    const response = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok)
      return NextResponse.json({ success: false, error: "Invalid access token" }, { status: 401 });

    const data = await response.json();

    const user = {
      username: data.username,
      uid: data.uid,
      wallet_address: data.wallet_address || null,
      roles: data.roles || [],
      created_at: data.created_at || new Date().toISOString(),
    };

    const encoded = encodeUser(user);

    const res = NextResponse.json({ success: true, user });

    // 🔥 COOKIE CHUẨN 100% PI BROWSER
    res.cookies.set({
  name: COOKIE_NAME,
  value: encoded,
  maxAge: MAX_AGE,
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  domain: "muasam.titi.onl",  // ⭐ BẮT BUỘC PHẢI KHỚP 100% DOMAIN APP
});

    return res;
  } catch (e) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });

  res.cookies.set({
  name: COOKIE_NAME,
  value: "",
  maxAge: 0,
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  domain: "muasam.titi.onl",
});

  return res;
}
