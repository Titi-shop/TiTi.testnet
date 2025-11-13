import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET() {
  try {
    // Lấy danh mục trong KV
    const categories = (await kv.get("categories")) || [];
    return NextResponse.json(categories);
  } catch (err) {
    console.error("❌ Lỗi GET categories:", err);
    return NextResponse.json([], { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, icon } = body;

    if (!name || !icon) {
      return NextResponse.json(
        { error: "Thiếu name hoặc icon" },
        { status: 400 }
      );
    }

    // Lấy danh mục hiện tại
    const categories = (await kv.get("categories")) || [];

    const newItem = {
      id: Date.now(),
      name,
      icon, // URL icon từ Blob Upload
    };

    categories.push(newItem);

    // Lưu lại vào KV
    await kv.set("categories", categories);

    return NextResponse.json({ success: true, item: newItem });
  } catch (err) {
    console.error("❌ Lỗi POST categories:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
