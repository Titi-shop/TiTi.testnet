import { NextResponse } from "next/server";
import crypto from "crypto";

export interface PiUser {
  username: string;
  uid?: string;
  wallet_address?: string | null;
  roles: string[];
  created_at: string;
}

// tạm lưu session trên memory (production nên dùng DB)
const sessions = new Map<string, PiUser>();

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
    const body: { accessToken?: string } = await req.json();
    const accessToken = body.accessToken;
    if (!accessToken) {
      return NextResponse.json({ success: false, message: "Thiếu accessToken" }, { status: 400 });
    }

    const isTestnet =
      process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
      process.env.PI_API_URL?.includes("/sandbox");

    let user: PiUser;

    if (isTestnet) {
      user = {
        username: "test_user",
        uid: "sandbox-uid",
        wallet_address: "TST123456789",
        roles: ["tester"],
        created_at: new Date().toISOString(),
      };
    } else {
      const res = await fetch("https://api.minepi.com/v2/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Pi verify error:", text);
        return NextResponse.json({ success: false, message: "Token không hợp lệ" }, { status: 401 });
      }

      const data: any = await res.json(); // Pi API trả dynamic object, TS không kiểm soát được
      user = {
        username: data.username,
        uid: data.uid,
        wallet_address: data.wallet_address || null,
        roles: data.roles || [],
        created_at: data.created_at || new Date().toISOString(),
      };
    }

    const sessionId = crypto.randomBytes(32).toString("hex");
    sessions.set(sessionId, user);

    const response = NextResponse.json({ success: true, user });
    response.headers.set(
      "Set-Cookie",
      `pi_session=${sessionId}; HttpOnly; Path=/; Max-Age=3600; Secure; SameSite=Strict`
    );
    return response;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ verify POST error:", err.message);
      return NextResponse.json({ success: false, message: err.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, message: "Lỗi xác minh Pi Network" }, { status: 500 });
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
