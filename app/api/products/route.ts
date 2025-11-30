import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { kv } from "@vercel/kv";
import { toISO } from "@/lib/formatDate";

export const revalidate = 60; // Cache Next.js ISR trong 60s

/* ===== TypeScript Models ===== */
interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  images?: string[];
  seller: string;
  categoryId?: number | null;
  createdAt?: string;
  updatedAt?: string;
  views?: number;
  sold?: number;
  salePrice?: number | null;
  saleStart?: string | null;
  saleEnd?: string | null;
  finalPrice?: number;
  isSale?: boolean;
}

interface SellerRoleResponse {
  role: string;
}

/* ===== CHECK SELLER ===== */
async function isSeller(username: string): Promise<boolean> {
  if (!username) return false;
  try {
    const host = headers().get("host");
    const protocol =
      process.env.NODE_ENV === "development" ? "http" : "https";
    const base = `${protocol}://${host}`;

    const res = await fetch(`${base}/api/users/role?username=${username}`, {
      cache: "force-cache",
    });

    const data: SellerRoleResponse = await res.json();
    return data.role === "seller";
  } catch {
    return false;
  }
}

/* ===== GET ALL PRODUCTS ===== */
export async function GET() {
  try {
    const ids = await kv.lrange<string>("products:all", 0, -1);
    if (!ids || ids.length === 0) return NextResponse.json([]);

    const now = new Date();

    const products = await Promise.all(
      ids.map(async (id) => {
        const product = await kv.get<Product>(`product:${id}`);
        return product || null;
      })
    );

    const updatedProducts: Product[] = products
      .filter((p): p is Product => p !== null)
      .map((p) => {
        const start = p.saleStart ? new Date(p.saleStart) : null;
        const end = p.saleEnd ? new Date(p.saleEnd) : null;

        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);

        const isSale =
          !!p.salePrice &&
          start &&
          end &&
          now.getTime() >= start.getTime() &&
          now.getTime() <= end.getTime();

        return {
          ...p,
          isSale,
          finalPrice: isSale ? p.salePrice! : p.price,
          views: p.views ?? 0,
          sold: p.sold ?? 0,
        };
      });

    return NextResponse.json(updatedProducts);
  } catch (err) {
    console.error("GET products error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

/* ===== CREATE PRODUCT ===== */
export async function POST(req: Request) {
  try {
    const body = await req.json();
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
    } = body;

    if (!name || !price || !seller)
      return NextResponse.json({ success: false, message: "Missing data" });

    const sellerLower = seller.toLowerCase();

    if (!(await isSeller(sellerLower)))
      return NextResponse.json({ success: false, message: "Not a seller" });

    const id = Date.now().toString();

    const newProduct: Product = {
      id,
      name,
      price,
      description: description || "",
      images: Array.isArray(images) ? images : [],
      seller: sellerLower,
      categoryId: Number(categoryId) || null,
      createdAt: new Date().toISOString(),
      views: 0,
      sold: 0,
      salePrice: salePrice || null,
      saleStart: saleStart ? toISO(saleStart) : null,
      saleEnd: saleEnd ? toISO(saleEnd) : null,
    };

    await kv.set(`product:${id}`, newProduct);
    await kv.rpush("products:all", id);
    await kv.rpush(`products:seller:${sellerLower}`, id);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    console.error("POST error:", err);
    return NextResponse.json({ success: false, message: "Server error" });
  }
}

/* ===== UPDATE PRODUCT ===== */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
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
    } = body;

    if (!id || !seller)
      return NextResponse.json({ success: false, message: "Invalid request" });

    const sellerLower = seller.toLowerCase();

    if (!(await isSeller(sellerLower)))
      return NextResponse.json({ success: false, message: "Unauthorized" });

    const product = await kv.get<Product>(`product:${id}`);
    if (!product) return NextResponse.json({ success: false, message: "Not found" });

    if (product.seller !== sellerLower)
      return NextResponse.json({ success: false, message: "Unauthorized" });

    const updatedProduct: Product = {
      ...product,
      name: name || product.name,
      price: price || product.price,
      description: description || product.description,
      images: images || product.images,
      categoryId: Number(categoryId) || product.categoryId,
      updatedAt: new Date().toISOString(),
      salePrice: salePrice || null,
      saleStart: saleStart ? toISO(saleStart) : null,
      saleEnd: saleEnd ? toISO(saleEnd) : null,
    };

    await kv.set(`product:${id}`, updatedProduct);

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (err) {
    console.error("PUT error:", err);
    return NextResponse.json({ success: false });
  }
}

/* ===== DELETE PRODUCT ===== */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    const { seller } = await req.json();

    if (!id || !seller)
      return NextResponse.json({ success: false });

    const sellerLower = seller.toLowerCase();

    if (!(await isSeller(sellerLower)))
      return NextResponse.json({ success: false });

    const product = await kv.get<Product>(`product:${id}`);
    if (!product) return NextResponse.json({ success: false });

    if (product.seller !== sellerLower)
      return NextResponse.json({ success: false });

    await kv.del(`product:${id}`);
    await kv.lrem(`products:seller:${sellerLower}`, 0, id);
    await kv.lrem("products:all", 0, id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json({ success: false });
  }
}
