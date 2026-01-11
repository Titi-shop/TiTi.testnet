import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { cookies } from "next/headers";
import { toISO } from "@/lib/formatDate";

const COOKIE_NAME = "pi_user";

/* =========================
   TYPES
========================= */
type Session = { uid: string };

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
   SESSION
========================= */
function getSession(): Session | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64").toString("utf8")) as unknown;
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "uid" in parsed &&
      typeof (parsed as { uid: unknown }).uid === "string"
    ) {
      return { uid: (parsed as { uid: string }).uid };
    }
    return null;
  } catch {
    return null;
  }
}

/* =========================
   CHECK SELLER ROLE
========================= */
async function isSeller(uid: string): Promise<boolean> {
  const role = await kv.get<string>(`user_role:${uid}`);
  return role === "seller";
}

/* =========================
   GET ALL PRODUCTS (PUBLIC)
========================= */
export async function GET() {
  const ids = await kv.lrange<string>("products:all", 0, -1);
  if (!ids.length) return NextResponse.json([]);

  const now = new Date();

  const products = await Promise.all(
    ids.map(id => kv.get<Product>(`product:${id}`))
  );

  const safe = products.filter(Boolean).map(p => {
    const start = p!.saleStart ? new Date(p!.saleStart) : null;
    const end = p!.saleEnd ? new Date(p!.saleEnd) : null;

    const isSale =
      p!.salePrice &&
      start &&
      end &&
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
   CREATE PRODUCT (SELLER)
========================= */
export async function POST(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!(await isSeller(session.uid))) {
    return NextResponse.json({ error: "not_seller" }, { status: 403 });
  }

  const body = (await req.json()) as Partial<Product>;
  if (!body.name || typeof body.price !== "number") {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const id = `PRD-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const product: Product = {
    id,
    name: body.name,
    price: body.price,
    description: body.description ?? "",
    images: body.images ?? [],
    sellerId: session.uid,
    categoryId: body.categoryId ?? null,
    createdAt: now,
    views: 0,
    sold: 0,
    salePrice: body.salePrice ?? null,
    saleStart: body.saleStart ? toISO(body.saleStart) : null,
    saleEnd: body.saleEnd ? toISO(body.saleEnd) : null,
  };

  await kv.set(`product:${id}`, product);
  await kv.rpush("products:all", id);
  await kv.rpush(`products:seller:${session.uid}`, id);

  return NextResponse.json({ success: true, product });
}

/* =========================
   UPDATE / DELETE
========================= */
export async function PUT(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isSeller(session.uid))) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json();
  const product = await kv.get<Product>(`product:${body.id}`);
  if (!product || product.sellerId !== session.uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const updated: Product = {
    ...product,
    ...body,
    sellerId: session.uid,
    updatedAt: new Date().toISOString(),
  };

  await kv.set(`product:${product.id}`, updated);
  return NextResponse.json({ success: true, product: updated });
}

export async function DELETE(req: Request) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!(await isSeller(session.uid))) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 });

  const product = await kv.get<Product>(`product:${id}`);
  if (!product || product.sellerId !== session.uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  await kv.del(`product:${id}`);
  await kv.lrem(`products:seller:${session.uid}`, 0, id);
  await kv.lrem("products:all", 0, id);

  return NextResponse.json({ success: true });
}
