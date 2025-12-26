import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * 🟢 API: /api/address
 * - GET: lấy địa chỉ theo username
 * - POST: lưu/cập nhật địa chỉ
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username)
    return NextResponse.json({ error: "missing username" }, { status: 400 });

  const key = `address:${username.toLowerCase()}`;
  const data = (await kv.get(key)) || null;

  return NextResponse.json({ success: true, address: data });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      username: string;
      name?: string;
      phone?: string;
      address?: string;
    };

    const { username, name, phone, address } = body;

    if (!username) throw new Error("Missing username");

    const key = `address:${username.toLowerCase()}`;
    await kv.set(key, { name, phone, address });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("❌ Lỗi lưu địa chỉ:", err);

    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
