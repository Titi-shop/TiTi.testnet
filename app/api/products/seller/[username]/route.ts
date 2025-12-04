import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET(_req: Request, { params }: any) {
  try {
    const seller = params.username?.toLowerCase();
    if (!seller) {
      return NextResponse.json({ error: "Missing seller" }, { status: 400 });
    }

    // Lấy list ID sản phẩm của seller
    const ids = await kv.lrange(`products:seller:${seller}`, 0, -1);

    if (!ids || ids.length === 0) {
      return NextResponse.json([]);
    }

    // Lấy chi tiết sản phẩm
    const products = await Promise.all(
      ids.map(async (id: string) => await kv.get(`product:${id}`))
    );

    // Lọc bỏ null (nếu có)
    return NextResponse.json(products.filter(Boolean));
  } catch (err) {
    console.error("Seller API Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
