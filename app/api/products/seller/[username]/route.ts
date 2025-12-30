import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

type ProductRecord = Record<string, unknown>;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/");

    // lấy username từ segment cuối
    const seller = parts[parts.length - 1]
      .toLowerCase();

    const ids = await kv.lrange<string>(
      `products:seller:${seller}`,
      0,
      -1
    );

    if (!ids || ids.length === 0) {
      return NextResponse.json([]);
    }

    const products = await Promise.all(
      ids.map(id =>
        kv.get<ProductRecord>(`product:${id}`)
      )
    );

    const filtered = products.filter(
      (p): p is ProductRecord =>
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
