import { NextResponse } from "next/server";
import { getSessionUser } from "./session";
import { resolveRole } from "./resolveRole";

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
