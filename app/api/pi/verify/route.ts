import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs"; // bắt buộc để Vercel không xoá session sớm

const COOKIE_NAME = "pi_user";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 ngày

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

/* GET — VERIFY */
export async function GET(req: NextRequest) {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  const user = raw ? decodeUser(raw) : null;

  return NextResponse.json({
    success: !!user,
    user: user || null,
  });
}

/* POST — LOGIN */
export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();
    if (!accessToken) {
      return NextResponse.json({ success: false, error: "missing_token" }, { status: 400 });
    }

    const pi = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!pi.ok) {
      return NextResponse.json({ success: false, error: "invalid_token" }, { status: 401 });
    }

    const data = await pi.json();

    const user = {
      username: data.username,
      uid: data.uid || `user_${data.username}`,
      wallet_address: data.wallet_address || null,
      roles: data.roles || [],
      created_at: data.created_at || new Date().toISOString(),
    };

    const encoded = encodeUser(user);

    const res = NextResponse.json({ success: true, user });

    res.cookies.set({
      name: COOKIE_NAME,
      value: encoded,
      maxAge: MAX_AGE,
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      domain: "titi.onl", // ⚠️ chỉnh theo domain thật của bạn
    });

    return res;
  } catch (e) {
    return NextResponse.json({ success: false, error: "server_error" }, { status: 500 });
  }
}

/* DELETE — LOGOUT */
export async function DELETE() {
  const res = NextResponse.json({ success: true });

  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "none",
  });

  return res;
}
