import { NextResponse } from "next/server";
import { headers } from "next/headers";

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
 * Ưu tiên Pi Browser (Bearer token)
 * → xử lý iOS WebView không gửi cookie ổn định
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

  const res = await fetch("https://api.minepi.com/v2/me", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) return null;

  const data = await res.json();
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
   * 1️⃣ Bearer-first (Pi Browser)
   * 2️⃣ Cookie fallback (desktop / ổn định)
   */
  const baseUser =
    (await getUserFromToken()) ??
    getSessionUser();

  if (!baseUser) {
    return NextResponse.json(
      { success: false },
      { status: 401 }
    );
  }

  /**
   * 3️⃣ Resolve role tập trung (RBAC)
   * - Không hardcode
   * - Không tin cookie
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
