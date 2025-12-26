export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const isTestnet =
  process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
  process.env.PI_API_URL?.includes("/sandbox");

const DEFAULT_SELLERS = ["nguyenminhduc1991111", "vothao11996611"];

function normalize(str: string): string {
  return str.trim().toLowerCase();
}

// ----------------------------
// 🔹 POST: Gán quyền cho user
// ----------------------------
export async function POST(req: Request) {
  try {
    const { username, role } = await req.json();

    if (!username || !role)
      return NextResponse.json({ error: "Thiếu dữ liệu" }, { status: 400 });

    const normalized = normalize(username);
    const envPrefix = isTestnet ? "testnet" : "mainnet";
    const key = `user_role:${envPrefix}:${normalized}`;

    if (!["seller", "buyer"].includes(role))
      return NextResponse.json(
        { error: "Role không hợp lệ" },
        { status: 400 }
      );

    await kv.set(key, role);

    console.log(`✅ [${envPrefix}] Gán role cho ${normalized}: ${role}`);

    return NextResponse.json({
      success: true,
      username: normalized,
      role,
      env: envPrefix,
    });
  } catch (err) {
    const error = err as Error;
    console.error("❌ Lỗi lưu quyền:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// ----------------------------
// 🔹 GET: Lấy quyền của user
// ----------------------------
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username");

    if (!username)
      return NextResponse.json({ error: "Thiếu username" }, { status: 400 });

    const normalized = normalize(username);
    const envPrefix = isTestnet ? "testnet" : "mainnet";
    const key = `user_role:${envPrefix}:${normalized}`;

    if (isTestnet) {
      console.log(`🧪 [TESTNET] Auto gán seller cho ${normalized}`);
      await kv.set(key, "seller");
      return NextResponse.json({
        success: true,
        username: normalized,
        role: "seller",
        env: envPrefix,
      });
    }

    let role = (await kv.get<string>(key)) || "buyer";

    if (DEFAULT_SELLERS.some((u) => normalize(u) === normalized)) {
      role = "seller";
      await kv.set(key, role);
    }

    console.log(`👤 [${envPrefix}] Role của ${normalized}: ${role}`);

    return NextResponse.json({
      success: true,
      username: normalized,
      role,
      env: envPrefix,
    });
  } catch (err) {
    const error = err as Error;
    console.error("❌ Lỗi GET role:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
