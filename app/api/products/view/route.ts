import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Thiếu id" },
        { status: 400 }
      );
    }

    const key = `product:${id}`;
    const product = await kv.get<any>(key);

    if (!product) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );
    }

    // ⭐ Tăng view ngay trong KV (đúng chuẩn)
    product.views = (product.views ?? 0) + 1;

    // Lưu lại
    await kv.set(key, product);

    return NextResponse.json({ success: true, views: product.views });
  } catch (err) {
    console.error("❌ Lỗi tăng view:", err);
    return NextResponse.json(
      { success: false, message: "Lỗi server" },
      { status: 500 }
    );
  }
}
