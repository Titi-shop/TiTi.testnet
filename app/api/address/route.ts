import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * 🟢 API: /api/address
 * - GET: lấy danh sách địa chỉ theo username
 * - POST: thêm/cập nhật địa chỉ (hỗ trợ nhiều địa chỉ)
 */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username");

  if (!username)
    return NextResponse.json({ error: "missing username" }, { status: 400 });

  const key = `address:${username.toLowerCase()}`;
  const data = (await kv.get(key)) || []; // 🟢 Trả mảng địa chỉ

  return NextResponse.json({ success: true, addresses: data });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, ...newAddress } = body;

    if (!username)
      return NextResponse.json({ error: "missing username" }, { status: 400 });

    const key = `address:${username.toLowerCase()}`;
    let existing = (await kv.get(key)) || [];

    // 🟠 Nếu address mới là mặc định → bỏ mặc định cũ
    if (newAddress.isDefault) {
      existing = existing.map((a: any) => ({ ...a, isDefault: false }));
    }

    // 🟢 Thêm địa chỉ mới vào danh sách
    existing.push(newAddress);

    await kv.set(key, existing);

    return NextResponse.json({ success: true, addresses: existing });
  } catch (err: any) {
    console.error("❌ API Error:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
