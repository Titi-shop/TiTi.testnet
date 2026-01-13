import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { kv } from "@vercel/kv";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "pi_user";

/* =========================
   TYPES
========================= */
type MeUser = {
  uid: string;
  username: string;
  role: "customer" | "seller";
  wallet_address?: string | null;
};

/* =========================
   HELPERS
========================= */
function getUserFromCookie(): MeUser | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64").toString("utf8")
    ) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "uid" in parsed &&
      "username" in parsed
    ) {
      return {
        uid: (parsed as any).uid,
        username: (parsed as any).username,
        wallet_address: (parsed as any).wallet_address ?? null,
        role: "customer", // mặc định, sẽ check lại bên dưới
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function getUserFromToken(): Promise<MeUser | null> {
  const auth = headers().get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;

  const token = auth.slice("Bearer ".length).trim();
  if (!token) return null;

  const piRes = await fetch("https://api.minepi.com/v2/me", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!piRes.ok) return null;

  const data = await piRes.json();
  if (!data?.uid || !data?.username) return null;

  return {
    uid: data.uid,
    username: data.username,
    wallet_address: data.wallet_address ?? null,
    role: "customer",
  };
}

async function resolveRole(uid: string): Promise<"customer" | "seller"> {
  const role = await kv.get<string>(`user_role:${uid}`);
  return role === "seller" ? "seller" : "customer";
}

/* =========================
   GET /api/users/me
========================= */
export async function GET() {
  // 1️⃣ Ưu tiên token (Pi Browser iOS)
  let user = await getUserFromToken();

  // 2️⃣ Fallback cookie
  if (!user) {
    user = getUserFromCookie();
  }

  if (!user) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  // 3️⃣ Resolve role từ KV
  const role = await resolveRole(user.uid);

  return NextResponse.json({
    success: true,
    user: {
      uid: user.uid,
      username: user.username,
      wallet_address: user.wallet_address ?? null,
      role,
    },
  });
}
