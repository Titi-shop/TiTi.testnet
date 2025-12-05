import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export interface PiUser {
  username: string;
  uid?: string;
  wallet_address?: string | null;
  roles: string[];
  created_at: string;
}

// ⚠️ DEMO: lưu session trong RAM.
// Production nên dùng DB/Redis.
const sessions = new Map<string, PiUser>();

// Thời gian sống của phiên: 30 ngày (giây)
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getSessionIdFromCookie(req: Request): string | undefined {
  const cookie = req.headers.get("cookie") || "";
  const match = cookie.match(/pi_session=([^;]+)/);
  return match?.[1];
}

function buildSessionCookie(sessionId: string, maxAge: number): string {
  const parts = [
    `pi_session=${sessionId}`,
    "HttpOnly",
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Strict",
  ];

  // Chỉ bật Secure ở production (https).
  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

// ✅ GET: kiểm tra phiên đăng nhập hiện tại
export async function GET(req: Request) {
  const sessionId = getSessionIdFromCookie(req);

  if (sessionId && sessions.has(sessionId)) {
    const user = sessions.get(sessionId)!;

    const res = NextResponse.json({ success: true, user });

    // 🔁 Gia hạn thời gian sống mỗi lần client kiểm tra phiên
    res.headers.set(
      "Set-Cookie",
      buildSessionCookie(sessionId, SESSION_MAX_AGE_SECONDS)
    );

    return res;
  }

  return NextResponse.json({ success: false, user: null });
}

// ✅ POST: nhận accessToken từ Pi, xác minh, tạo session
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { accessToken?: string };
    const accessToken = body?.accessToken;

    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json(
        { success: false, message: "Thiếu hoặc accessToken không hợp lệ" },
        { status: 400 }
      );
    }

    const isTestnet =
      process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
      (process.env.PI_API_URL || "").includes("/sandbox");

    let user: PiUser;

    if (isTestnet) {
      // ✅ Testnet: giả lập user
      user = {
        username: "test_user",
        uid: "sandbox-uid",
        wallet_address: "TST123456789",
        roles: ["tester"],
        created_at: new Date().toISOString(),
      };
    } else {
      // ✅ Mainnet: gọi Pi API để xác thực accessToken
      const res = await fetch("https://api.minepi.com/v2/me", {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("❌ Pi verify error:", text);
        return NextResponse.json(
          { success: false, message: "Token không hợp lệ" },
          { status: 401 }
        );
      }

      const data = (await res.json()) as {
        username?: string;
        uid?: string;
        wallet_address?: string | null;
        roles?: string[];
        created_at?: string;
      };

      if (!data.username) {
        return NextResponse.json(
          { success: false, message: "Dữ liệu Pi không hợp lệ" },
          { status: 500 }
        );
      }

      user = {
        username: data.username,
        uid: data.uid,
        wallet_address: data.wallet_address ?? null,
        roles: Array.isArray(data.roles) ? data.roles : [],
        created_at: data.created_at || new Date().toISOString(),
      };
    }

    // ✅ Tạo session id ngẫu nhiên, khó đoán
    const sessionId = crypto.randomBytes(32).toString("hex");
    sessions.set(sessionId, user);

    const response = NextResponse.json({ success: true, user });

    // 🔐 Set cookie phiên đăng nhập, sống lâu (30 ngày)
    response.headers.set(
      "Set-Cookie",
      buildSessionCookie(sessionId, SESSION_MAX_AGE_SECONDS)
    );

    return response;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ verify POST error:", err.message);
      return NextResponse.json(
        { success: false, message: "Lỗi máy chủ: " + err.message },
        { status: 500 }
      );
    }

    console.error("❌ verify POST unknown error:", err);
    return NextResponse.json(
      { success: false, message: "Lỗi xác minh Pi Network" },
      { status: 500 }
    );
  }
}

// ✅ DELETE: logout, xóa session + xóa cookie
export async function DELETE(req: Request) {
  const sessionId = getSessionIdFromCookie(req);
  if (sessionId) {
    sessions.delete(sessionId);
  }

  const res = NextResponse.json({ success: true });

  // Xóa cookie bằng Max-Age=0
  res.headers.set("Set-Cookie", buildSessionCookie("deleted", 0));

  return res;
}
