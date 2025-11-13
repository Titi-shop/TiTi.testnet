import { NextResponse } from "next/server";

const KV_URL = process.env.KV_URL!; // URL của KV database
const KV_REST_API_TOKEN = process.env.KV_REST_API_TOKEN!;

export async function GET() {
  try {
    const res = await fetch(`${KV_URL}/get/categories`, {
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
      cache: "no-store"
    });

    const data = await res.json();

    // Nếu KV chưa có categories → trả mảng trống
    const categories = data?.result ? JSON.parse(data.result) : [];

    return NextResponse.json(categories);
  } catch (err) {
    console.error("❌ Lỗi API categories:", err);
    return NextResponse.json([], { status: 500 });
  }
}

// --------------------------
// POST: Thêm danh mục mới
// --------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${KV_URL}/get/categories`, {
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
      },
    });

    let categories = [];
    const old = await res.json();
    if (old?.result) categories = JSON.parse(old.result);

    const newItem = {
      id: Date.now(),
      name: body.name,
      icon: body.icon, // URL icon Blob
    };

    categories.push(newItem);

    // Lưu lại
    await fetch(`${KV_URL}/set/categories`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${KV_REST_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(categories),
    });

    return NextResponse.json({ success: true, item: newItem });
  } catch (err) {
    console.error("❌ Lỗi POST categories:", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
