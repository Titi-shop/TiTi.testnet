import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "pi_user";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/* ============================================================
   TYPES
============================================================ */
type Role = "seller" | "customer";

type PiUser = {
  username: string;
  uid: string;
  wallet_address: string | null;
  created_at: string;
  roles: Role[];
};

/* ============================================================
   SELLER LIST (FROM VERCEL ENV)
============================================================ */
const SELLER_USERNAMES = (process.env.NEXT_PUBLIC_SELLER_PI_USERNAMES || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/* ============================================================
   ENCODE / DECODE USER
============================================================ */
function encodeUser(user: PiUser) {
  return Buffer.from(JSON.stringify(user), "utf8").toString("base64");
}

function decodeUser(raw: string): PiUser | null {
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as PiUser;
  } catch {
    return null;
  }
}

/* ============================================================
   COOKIE BUILDER — SAFARI + PI BROWSER SAFE
============================================================ */
function buildCookie(value: string, age = MAX_AGE) {
  return [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${age}`,
    "HttpOnly",
    "SameSite=Lax",
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
      user,
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
    const body = (await req.json()) as { accessToken?: string };

    if (!body.accessToken) {
      return NextResponse.json(
        { success: false, error: "missing_access_token" },
        { status: 400 }
      );
    }

    /* 🔐 Verify token with Pi Network */
    const piRes = await fetch("https://api.minepi.com/v2/me", {
      headers: {
        Authorization: `Bearer ${body.accessToken}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!piRes.ok) {
      return NextResponse.json(
        { success: false, error: "invalid_access_token" },
        { status: 401 }
      );
    }

    const data = (await piRes.json()) as {
      username?: string;
      uid?: string;
      wallet_address?: string;
      created_at?: string;
    };

    if (!data.username) {
      return NextResponse.json(
        { success: false, error: "missing_username" },
        { status: 500 }
      );
    }

    /* 🔑 ASSIGN ROLE (RBAC) */
    const roles: Role[] = SELLER_USERNAMES.includes(data.username)
      ? ["seller"]
      : ["customer"];

    const user: PiUser = {
      username: data.username,
      uid: data.uid ?? `user_${data.username}`,
      wallet_address: data.wallet_address ?? null,
      created_at: data.created_at ?? new Date().toISOString(),
      roles,
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

/* ============================================================
   🔹 DELETE — LOGOUT
============================================================ */
export function DELETE() {
  const res = NextResponse.json({ success: true });
  res.headers.set("Set-Cookie", buildCookie("deleted", 0));
  return res;
}
