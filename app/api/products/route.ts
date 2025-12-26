import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { kv } from "@vercel/kv";
import { toISO } from "@/lib/formatDate";

/* -------------------------------------------
   CHECK SELLER
------------------------------------------- */
async function isSeller(username: string): Promise<boolean> {
  try {
    const host = headers().get("host");
    const protocol =
      process.env.NODE_ENV === "development" ? "http" : "https";
    const base = `${protocol}://${host}`;

    const res = await fetch(`${base}/api/users/role?username=${username}`);
    const data = (await res.json()) as { role?: unknown };

    return data.role === "seller";
  } catch {
    return false;
  }
}

/* -------------------------------------------
   GET ALL PRODUCTS
------------------------------------------- */
export async function GET() {
  try {
    const ids = await kv.lrange<string>("products:all", 0, -1);
    if (!ids || ids.length === 0) return NextResponse.json([]);

    const now = new Date();

    const products = await Promise.all(
      ids.map(async (id) => await kv.get<Record<string, unknown>>(`product:${id}`))
    );

    const updated = products
      .filter((p): p is Record<string, unknown> => typeof p === "object" && p !== null)
      .map((p) => {
        const start =
          typeof p.saleStart === "string" ? new Date(p.saleStart) : null;
        const end =
          typeof p.saleEnd === "string" ? new Date(p.saleEnd) : null;

        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        const isSale =
          typeof p.salePrice === "number" &&
          start &&
          end &&
          now >= start &&
          now <= end;

        return {
          ...p,
          isSale,
          finalPrice: isSale ? p.salePrice : p.price,
        };
      });

    return NextResponse.json(updated);
  } catch (err: unknown) {
    console.error("GET products error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

/* -------------------------------------------
   CREATE PRODUCT
------------------------------------------- */
export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const data =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : {};

    const {
      name,
      price,
      description,
      images,
      seller,
      categoryId,
      salePrice,
      saleStart,
      saleEnd,
    } = data;

    if (!name || !price || !seller) {
      return NextResponse.json({ success: false, message: "Thiếu dữ liệu" });
    }

    const sellerLower = String(seller).toLowerCase();

    if (!(await isSeller(sellerLower))) {
      return NextResponse.json({
        success: false,
        message: "Không phải seller",
      });
    }

    const id = Date.now().toString();

    const newProduct = {
      id,
      name,
      price,
      description: description || "",
      images: images || [],
      seller: sellerLower,
      categoryId: Number(categoryId) || null,
      createdAt: new Date().toISOString(),
      views: 0,
      sold: 0,
      salePrice: salePrice || null,
      saleStart: saleStart ? toISO(String(saleStart)) : null,
      saleEnd: saleEnd ? toISO(String(saleEnd)) : null,
    };

    await kv.set(`product:${id}`, newProduct);
    await kv.rpush("products:all", id);
    await kv.rpush(`products:seller:${sellerLower}`, id);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err: unknown) {
    console.error("POST error:", err);
    return NextResponse.json({ success: false, message: "Lỗi server" });
  }
}

/* -------------------------------------------
   UPDATE PRODUCT
------------------------------------------- */
export async function PUT(req: Request) {
  try {
    const body: unknown = await req.json();
    const data =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : {};

    const {
      id,
      name,
      price,
      description,
      images,
      seller,
      categoryId,
      salePrice,
      saleStart,
      saleEnd,
    } = data;

    if (!id || !seller) return NextResponse.json({ success: false });

    const sellerLower = String(seller).toLowerCase();
    if (!(await isSeller(sellerLower)))
      return NextResponse.json({ success: false });

    const product = await kv.get<Record<string, unknown>>(`product:${id}`);
    if (!product) return NextResponse.json({ success: false });

    if (product.seller !== sellerLower)
      return NextResponse.json({ success: false });

    const updated = {
      ...product,
      name,
      price,
      description,
      images,
      categoryId: Number(categoryId) || product.categoryId,
      updatedAt: new Date().toISOString(),
      salePrice: salePrice || null,
      saleStart: saleStart ? toISO(String(saleStart)) : null,
      saleEnd: saleEnd ? toISO(String(saleEnd)) : null,
    };

    await kv.set(`product:${id}`, updated);
    return NextResponse.json({ success: true, product: updated });
  } catch (err: unknown) {
    console.error("PUT error:", err);
    return NextResponse.json({ success: false });
  }
}

/* -------------------------------------------
   DELETE PRODUCT
------------------------------------------- */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    const body: unknown = await req.json();
    const data =
      typeof body === "object" && body !== null
        ? (body as Record<string, unknown>)
        : {};

    const seller = data.seller;
    if (!id || !seller) return NextResponse.json({ success: false });

    const sellerLower = String(seller).toLowerCase();
    if (!(await isSeller(sellerLower)))
      return NextResponse.json({ success: false });

    const product = await kv.get<Record<string, unknown>>(`product:${id}`);
    if (!product) return NextResponse.json({ success: false });

    if (product.seller !== sellerLower)
      return NextResponse.json({ success: false });

    await kv.del(`product:${id}`);
    await kv.lrem(`products:seller:${sellerLower}`, 0, id);
    await kv.lrem("products:all", 0, id);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("DELETE error:", err);
    return NextResponse.json({ success: false });
  }
}
