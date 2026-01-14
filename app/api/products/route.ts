import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { requireSeller } from "@/lib/auth/guard";
import { toISO } from "@/lib/formatDate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* =========================
   TYPES
========================= */
type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  images: string[];
  sellerId: string;
  categoryId: number | null;
  createdAt: string;
  updatedAt?: string;
  views: number;
  sold: number;
  salePrice: number | null;
  saleStart: string | null;
  saleEnd: string | null;
};

/* =========================
   GET — ALL PRODUCTS (PUBLIC)
========================= */
export async function GET() {
  const ids = await kv.lrange<string>("products:all", 0, -1);
  if (!ids.length) return NextResponse.json([]);

  const now = new Date();
  const products = await Promise.all(
    ids.map((id) => kv.get<Product>(`product:${id}`))
  );

  const safe = products.filter(Boolean).map((p) => {
    const start = p!.saleStart ? new Date(p!.saleStart) : null;
    const end = p!.saleEnd ? new Date(p!.saleEnd) : null;

    const isSale =
      !!p!.salePrice &&
      !!start &&
      !!end &&
      now >= start &&
      now <= end;

    return {
      ...p!,
      isSale,
      finalPrice: isSale ? p!.salePrice : p!.price,
    };
  });

  return NextResponse.json(safe);
}

/* =========================
   POST — CREATE PRODUCT (SELLER)
========================= */
export async function POST(req: Request) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  const uid = auth.user.uid;
  const body = (await req.json()) as Partial<Product>;

  if (!body.name || typeof body.price !== "number") {
    return NextResponse.json(
      { error: "invalid_payload" },
      { status: 400 }
    );
  }

  const id = `PRD-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const product: Product = {
    id,
    name: body.name,
    price: body.price,
    description: body.description ?? "",
    images: body.images ?? [],
    sellerId: uid,
    categoryId: body.categoryId ?? null,
    createdAt: new Date().toISOString(),
    views: 0,
    sold: 0,
    salePrice: body.salePrice ?? null,
    saleStart: body.saleStart ? toISO(body.saleStart) : null,
    saleEnd: body.saleEnd ? toISO(body.saleEnd) : null,
  };

  await kv.set(`product:${id}`, product);
  await kv.rpush("products:all", id);
  await kv.rpush(`products:seller:${uid}`, id);

  return NextResponse.json({ success: true, product });
}

/* =========================
   PUT — UPDATE PRODUCT (OWNER)
========================= */
export async function PUT(req: Request) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  const uid = auth.user.uid;
  const body = await req.json();

  const product = await kv.get<Product>(`product:${body.id}`);
  if (!product || product.sellerId !== uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updated: Product = {
    ...product,
    ...body,
    sellerId: uid,
    updatedAt: new Date().toISOString(),
  };

  await kv.set(`product:${product.id}`, updated);
  return NextResponse.json({ success: true, product: updated });
}

/* =========================
   DELETE — REMOVE PRODUCT (OWNER)
========================= */
export async function DELETE(req: Request) {
  const auth = await requireSeller();
  if (!auth.ok) return auth.response;

  const uid = auth.user.uid;
  const id = new URL(req.url).searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  const product = await kv.get<Product>(`product:${id}`);
  if (!product || product.sellerId !== uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await kv.del(`product:${id}`);
  await kv.lrem(`products:seller:${uid}`, 0, id);
  await kv.lrem("products:all", 0, id);

  return NextResponse.json({ success: true });
}
