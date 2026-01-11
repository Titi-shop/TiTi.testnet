import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "pi_user";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

/* ============================================================
   TYPES
============================================================ */
type PiMeResponse = {
  uid?: string;
  user_uid?: string;
  id?: string;
  username: string;
  wallet_address?: string | null;
  created_at?: string;
  roles?: string[];
};

type SessionPayload = {
  uid: string;
};

/* ============================================================
   ENCODE / DECODE SESSION
============================================================ */
function encodeSession(payload: SessionPayload): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
}

function decodeSession(raw: string): SessionPayload | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64").toString("utf8")
    ) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "uid" in parsed &&
      typeof (parsed as { uid: unknown }).uid === "string"
    ) {
      return { uid: (parsed as { uid: string }).uid };
    }

    return null;
  } catch {
    return null;
  }
}

/* ============================================================
   COOKIE BUILDER — PI BROWSER + SAFARI SAFE
============================================================ */
function buildCookie(value: string, age = MAX_AGE) {
  return [
    `${COOKIE_NAME}=${value}`,
    "Path=/",
    `Max-Age=${age}`,
    "HttpOnly",
    "SameSite=None",
    "Secure",
  ].join("; ");
}

/* ============================================================
   🔹 GET — FETCH SESSION
============================================================ */
export function GET(req: NextRequest) {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  const session = raw ? decodeSession(raw) : null;

  if (!session) {
    return NextResponse.json({ success: false, uid: null });
  }

  return NextResponse.json({
    success: true,
    uid: session.uid,
  });
}

/* ============================================================
   🔹 POST — LOGIN WITH PI ACCESS TOKEN
============================================================ */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as unknown;

    if (
      typeof body !== "object" ||
      body === null ||
      !("accessToken" in body) ||
      typeof (body as { accessToken?: unknown }).accessToken !== "string"
    ) {
      return NextResponse.json(
        { success: false, error: "missing_access_token" },
        { status: 400 }
      );
    }

    const accessToken = (body as { accessToken: string }).accessToken;

    // 🔐 VERIFY TOKEN WITH PI NETWORK
    const piRes = await fetch("https://api.minepi.com/v2/me", {
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

    const data = (await piRes.json()) as PiMeResponse;

    // 🔥 UID MUST COME FROM PI — NO FALLBACK
    const piUid = data.uid || data.user_uid || data.id;

    if (!piUid) {
      return NextResponse.json(
        { success: false, error: "pi_uid_missing" },
        { status: 401 }
      );
    }

    const session: SessionPayload = {
      uid: String(piUid),
    };

    const cookieValue = encodeSession(session);

    const res = NextResponse.json({
      success: true,
      uid: session.uid,
      username: data.username,
    });

    res.headers.set("Set-Cookie", buildCookie(cookieValue));
    return res;
  } catch (err: unknown) {
    console.error("❌ PI VERIFY ERROR:", err);
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
