import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

type ProductRecord = Record<string, unknown>;

export async function GET(
  _req: Request,
  context: { params: { username?: string } }
) {
  try {
    const seller = context.params.username?.toLowerCase();

    if (!seller) {
      return NextResponse.json(
        { error: "Missing seller" },
        { status: 400 }
      );
    }

    const ids = await kv.lrange<string>(
      `products:seller:${seller}`,
      0,
      -1
    );

    if (!ids || ids.length === 0) {
      return NextResponse.json([]);
    }

    const products = await Promise.all(
      ids.map(async (id) =>
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
