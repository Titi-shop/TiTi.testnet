import { NextResponse } from "next/server";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "pi_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 ngày
const SLIDING_RENEW_THRESHOLD_SECONDS = 60 * 60 * 24 * 3; // còn < 3 ngày thì gia hạn

// ======================
// 🔐 Kiểu dữ liệu
// ======================

export interface PiUser {
  username: string;
  uid?: string;
  wallet_address?: string | null;
  roles: string[];
  created_at: string;
}

// payload lưu trong cookie (KHÔNG chứa accessToken)
interface SessionPayload {
  user: PiUser;
  iat: number;   // issued at (ms)
  exp: number;   // expires at (ms)
  ver: number;   // version để sau này có thể revoke theo version
}

interface VerifyGetResponse {
  success: boolean;
  user: PiUser | null;
  message?: string;
}

interface VerifyPostResponse {
  success: boolean;
  user: PiUser | null;
  message?: string;
}

// Dữ liệu Pi /v2/me
interface PiMeResponse {
  username?: string;
  uid?: string;
  wallet_address?: string | null;
  roles?: string[];
  created_at?: string;
}

// ======================
// 🔐 Helper bảo mật
// ======================

function getSecret(): string {
  const secret = process.env.PI_SESSION_SECRET;
  if (!secret) {
    throw new Error("PI_SESSION_SECRET is missing in environment variables");
  }
  return secret;
}

function getNowMs(): number {
  return Date.now();
}

function secondsToMs(sec: number): number {
  return sec * 1000;
}

// Encode payload -> base64url
function encodePayload(payload: SessionPayload): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json, "utf8").toString("base64url");
}

// Decode base64url -> payload
function decodePayload(raw: string): SessionPayload | null {
  try {
    const json = Buffer.from(raw, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as SessionPayload;

    // Kiểm tra các field quan trọng
    if (
      !parsed.user ||
      typeof parsed.user.username !== "string" ||
      typeof parsed.iat !== "number" ||
      typeof parsed.exp !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

// HMAC SHA-256
function sign(payload: string): string {
  const hmac = crypto.createHmac("sha256", getSecret());
  hmac.update(payload);
  return hmac.digest("base64url");
}

// Verify cookie (HMAC + exp)
function verifyCookie(raw: string): SessionPayload | null {
  const parts = raw.split(".");
  if (parts.length !== 2) return null;

  const [payload, signature] = parts;

  const expectedSignature = sign(payload);

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSignature);

  // độ dài khác nhau -> fail luôn, tránh throw của timingSafeEqual
  if (sigBuf.length !== expBuf.length) {
    return null;
  }

  // So sánh an toàn tránh timing attack
  const equal = crypto.timingSafeEqual(sigBuf, expBuf);
  if (!equal) return null;

  const decoded = decodePayload(payload);
  if (!decoded) return null;

  // Hết hạn
  if (decoded.exp <= getNowMs()) {
    return null;
  }

  return decoded;
}

// Xây cookie
function buildCookie(value: string, maxAgeSeconds: number = MAX_AGE_SECONDS): string {
  const parts: string[] = [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
    "HttpOnly",
    // Lax: cho phép redirect / POST từ Pi Browser mà không mất cookie
    "SameSite=Lax",
  ];

  if (process.env.NODE_ENV === "production") {
    parts.push("Secure");
  }

  return parts.join("; ");
}

// Đọc cookie
function readCookie(req: Request): string | null {
  const cookieHeader = req.headers.get("cookie") ?? "";
  if (!cookieHeader) return null;

  const match = cookieHeader.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match?.[1] ?? null;
}

// Tạo session mới từ user
function createSessionPayload(user: PiUser): SessionPayload {
  const now = getNowMs();
  return {
    user,
    iat: now,
    exp: now + secondsToMs(MAX_AGE_SECONDS),
    ver: 1,
  };
}

// Quyết định có cần gia hạn cookie (sliding session)
function shouldRenewSession(payload: SessionPayload): boolean {
  const now = getNowMs();
  const remainingMs = payload.exp - now;
  return remainingMs < secondsToMs(SLIDING_RENEW_THRESHOLD_SECONDS);
}

// ======================
// GET /api/pi/verify
// ======================

export async function GET(req: Request) {
  const rawCookie = readCookie(req);

  if (!rawCookie) {
    const res: VerifyGetResponse = {
      success: false,
      user: null,
      message: "No session cookie",
    };
    return NextResponse.json(res);
  }

  const payload = verifyCookie(rawCookie);

  if (!payload) {
    // Cookie không hợp lệ / hết hạn → xoá
    const res = NextResponse.json<VerifyGetResponse>({
      success: false,
      user: null,
      message: "Invalid or expired session",
    });
    res.headers.set("Set-Cookie", buildCookie("deleted", 0));
    return res;
  }

  // Nếu sắp hết hạn thì gia hạn thêm
  let cookieValue = rawCookie;
  if (shouldRenewSession(payload)) {
    const encoded = encodePayload(payload);
    const signature = sign(encoded);
    cookieValue = `${encoded}.${signature}`;
  }

  const response = NextResponse.json<VerifyGetResponse>({
    success: true,
    user: payload.user,
  });

  if (cookieValue !== rawCookie) {
    response.headers.set("Set-Cookie", buildCookie(cookieValue));
  }

  return response;
}

// ======================
// POST /api/pi/verify
// (login bằng Pi SDK)
// ======================

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { accessToken?: string };
    const accessToken = body?.accessToken;

    if (!accessToken) {
      return NextResponse.json<VerifyPostResponse>(
        { success: false, user: null, message: "Missing accessToken" },
        { status: 400 }
      );
    }

    const isTestnet =
      process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
      (process.env.PI_API_URL ?? "").includes("sandbox");

    let user: PiUser;

    if (isTestnet) {
      // Testnet: tạo user giả, không cần gọi Pi
      user = {
        username: "test_user",
        uid: "sandbox-uid",
        wallet_address: "TEST-ADDRESS",
        roles: ["tester"],
        created_at: new Date().toISOString(),
      };
    } else {
      // Mainnet: xác thực accessToken với Pi
      const apiBase = process.env.PI_API_URL || "https://api.minepi.com/v2";
      const meRes = await fetch(`${apiBase}/me`, {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!meRes.ok) {
        const text = await meRes.text();
        console.error("❌ Pi /me error:", meRes.status, text);
        return NextResponse.json<VerifyPostResponse>(
          { success: false, user: null, message: "Invalid Pi accessToken" },
          { status: 401 }
        );
      }

      const meData = (await meRes.json()) as PiMeResponse;

      if (!meData.username) {
        return NextResponse.json<VerifyPostResponse>(
          { success: false, user: null, message: "Pi response missing username" },
          { status: 500 }
        );
      }

      user = {
        username: meData.username,
        uid: meData.uid,
        wallet_address: meData.wallet_address ?? null,
        roles: Array.isArray(meData.roles) ? meData.roles : [],
        created_at: meData.created_at || new Date().toISOString(),
      };
    }

    // Tạo payload + ký HMAC
    const payload = createSessionPayload(user);
    const encoded = encodePayload(payload);
    const signature = sign(encoded);
    const cookieValue = `${encoded}.${signature}`;

    const res = NextResponse.json<VerifyPostResponse>({
      success: true,
      user,
    });

    res.headers.set("Set-Cookie", buildCookie(cookieValue));

    return res;
  } catch (error) {
    console.error("❌ POST /api/pi/verify error:", error);
    return NextResponse.json<VerifyPostResponse>(
      {
        success: false,
        user: null,
        message: "Internal server error",
      },
      { status: 500 }
    );
  }
}

// ======================
// DELETE /api/pi/verify
// (logout)
// ======================

export async function DELETE() {
  const res = NextResponse.json<{ success: boolean }>({ success: true });
  res.headers.set("Set-Cookie", buildCookie("deleted", 0));
  return res;
}
