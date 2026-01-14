import { NextResponse } from "next/server";
import { getSessionUser } from "./session";
import { resolveRole } from "./resolveRole";
import type { Role } from "./role";

/**
 * Bắt buộc đăng nhập (Pi account)
 */
export async function requireAuth() {
  const user = getSessionUser();

  if (!user) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "UNAUTHENTICATED" },
        { status: 401 }
      ),
    };
  }

  const role = await resolveRole(user);

  return {
    ok: true as const,
    user,
    role,
  };
}

/**
 * Bắt buộc là seller (hoặc admin – chuẩn bị cho GĐ2/GĐ3)
 */
export async function requireSeller() {
  const auth = await requireAuth();

  if (!auth.ok) return auth;

  if (auth.role !== "seller" && auth.role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/**
 * Helper kiểm tra role (chuẩn bị RBAC)
 * GĐ1 có thể chưa dùng
 */
export function hasRole(
  role: Role,
  allowed: Role[]
): boolean {
  return allowed.includes(role);
}
