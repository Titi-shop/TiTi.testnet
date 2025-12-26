export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

type UserItem = {
  username: string;
  role: string;
};

const ADMIN_KEY = process.env.ADMIN_KEY || "admin123";

const isTestnet =
  process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
  process.env.PI_API_URL?.includes("/sandbox");

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const roleFilter = searchParams.get("role"); // "seller" | "buyer"

    if (key !== ADMIN_KEY) {
      return NextResponse.json(
        { success: false, error: "🚫 Không có quyền truy cập" },
        { status: 403 }
      );
    }

    const envPrefix = isTestnet ? "testnet" : "mainnet";
    const pattern = `user_role:${envPrefix}:`;

    const allUsers =
      (await kv.get<string[]>(`user_list:${envPrefix}`)) || [];

    const result: UserItem[] = [];

    for (const username of allUsers) {
      const role =
        (await kv.get<string>(`${pattern}${username}`)) || "buyer";
      if (roleFilter && role !== roleFilter) continue;
      result.push({ username, role });
    }

    return NextResponse.json({
      success: true,
      env: envPrefix,
      total: result.length,
      users: result,
    });
  } catch (err) {
    const error = err as Error;
    console.error("❌ Lỗi /api/users/list:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
