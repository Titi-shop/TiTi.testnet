import { NextResponse } from "next/server";
import crypto from "crypto";

/**
 * API verify Pi token & quản lý session cookie
 * GET: kiểm tra session cookie → trả user
 * POST: verify accessToken Pi → tạo session cookie
 * DELETE: logout → xóa session cookie
 */

// session lưu trên server memory tạm (dùng DB cho production)
const sessions = new Map<string, any>();

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/pi_session=([^;]+)/);
  const sessionId = match?.[1];

  if (sessionId && sessions.has(sessionId)) {
    return NextResponse.json({ success: true, user: sessions.get(sessionId) });
  }
  return NextResponse.json({ success: false, user: null });
}

export async function POST(req: Request) {
  try {
    const { accessToken } = await req.json();
    if (!accessToken) return NextResponse.json({ success: false, message: "Thiếu accessToken" }, { status: 400 });

    const isTestnet =
      process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
      process.env.PI_API_URL?.includes("/sandbox");

    let user: any;

    if (isTestnet) {
      user = {
        username: "test_user",
        uid: "sandbox-uid",
        wallet_address: "TST123456789",
        roles: ["tester"],
        created_at: new Date().toISOString(),
      };
    } else {
      // Mainnet: verify thật với Pi API
      const res = await fetch("https://api.minepi.com/v2/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Pi verify error:", text);
        return NextResponse.json({ success: false, message: "Token không hợp lệ" }, { status: 401 });
      }

      const data = await res.json();
      user = {
        username: data.username,
        uid: data.uid,
        wallet_address: data.wallet_address,
        roles: data.roles || [],
        created_at: data.created_at || new Date().toISOString(),
      };
    }

    // Tạo session ID bảo mật
    const sessionId = crypto.randomBytes(32).toString("hex");
    sessions.set(sessionId, user);

    const res = NextResponse.json({ success: true, user });
    res.headers.set(
      "Set-Cookie",
      `pi_session=${sessionId}; HttpOnly; Path=/; Max-Age=3600; Secure; SameSite=Strict`
    );
    return res;
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, message: err.message || "Lỗi xác minh Pi Network" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/pi_session=([^;]+)/);
  const sessionId = match?.[1];
  if (sessionId) sessions.delete(sessionId);

  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", `pi_session=deleted; HttpOnly; Path=/; Max-Age=0; Secure; SameSite=Strict`);
  return res;
}
