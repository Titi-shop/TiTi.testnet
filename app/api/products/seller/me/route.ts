import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { requireSeller } from "@/lib/auth/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES
========================= */
type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  sellerId: string;
  createdAt: string;
  updatedAt?: string;
};

/* =========================
   GET — PRODUCTS CỦA SELLER HIỆN TẠI
========================= */
export async function GET() {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  const uid = auth.user.uid;

  const ids = await kv.lrange<string>(
    `products:seller:${uid}`,
    0,
    -1
  );

  if (!ids.length) {
    return NextResponse.json([]);
  }

  const products = await Promise.all(
    ids.map((id) => kv.get<Product>(`product:${id}`))
  );

  const safe = products.filter(
    (p): p is Product => !!p && p.sellerId === uid
  );

  return NextResponse.json(safe);
}
