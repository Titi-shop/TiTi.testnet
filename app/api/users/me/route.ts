import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { kv } from "@vercel/kv";

import { getSessionUser } from "@/lib/auth/session";
import { resolveRole } from "@/lib/auth/resolveRole";
import type { Role } from "@/lib/auth/role";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES (GIỮ NGUYÊN CONTRACT FE)
========================= */
type MeUserResponse = {
  uid: string;
  username: string;
  role: Role;
  wallet_address?: string | null;
};

/* =========================
   HELPERS
========================= */

/**
 * Fallback cho Pi Browser iOS:
 * nếu có Authorization Bearer token
 * thì lấy user trực tiếp từ Pi API
 */
async function getUserFromToken(): Promise<{
  uid: string;
  username: string;
  wallet_address?: string | null;
} | null> {
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
  };
}

/* =========================
   GET /api/users/me
========================= */
export async function GET() {
  /**
   * 1️⃣ Ưu tiên Pi token (Pi Browser iOS)
   */
  let baseUser =
    (await getUserFromToken()) ??
    getSessionUser(); // 2️⃣ fallback cookie chuẩn hoá

  if (!baseUser) {
    return NextResponse.json(
      { success: false },
      { status: 401 }
    );
  }

  /**
   * 3️⃣ Resolve role TẬP TRUNG (AUTH-CENTRIC)
   * - Không tin cookie
   * - Không hardcode
   */
  const role = await resolveRole(baseUser);

  const user: MeUserResponse = {
    uid: baseUser.uid,
    username: baseUser.username ?? "",
    wallet_address: baseUser.wallet_address ?? null,
    role,
  };

  return NextResponse.json({
    success: true,
    user,
  });
}
