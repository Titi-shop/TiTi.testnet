import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  context: any
) {
  try {
    const seller = context.params?.username?.toLowerCase();

    if (!seller) {
      return NextResponse.json(
        { error: "Missing seller" },
        { status: 400 }
      );
    }

    // Lấy list ID sản phẩm của seller
    const ids = await kv.lrange<string>(
      `products:seller:${seller}`,
      0,
      -1
    );

    if (!ids || ids.length === 0) {
      return NextResponse.json([]);
    }

    // Lấy chi tiết sản phẩm
    const products = await Promise.all(
      ids.map(async (id) =>
        kv.get<Record<string, unknown>>(`product:${id}`)
      )
    );

    // Lọc null
    const filtered = products.filter(
      (p): p is Record<string, unknown> =>
        typeof p === "object" && p !== null
    );

    return NextResponse.json(filtered);
  } catch (err) {
    console.error("Seller API Error:", err);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
