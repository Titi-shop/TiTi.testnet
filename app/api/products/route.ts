import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { kv } from "@vercel/kv";
import { toISO } from "@/lib/formatDate";

/* -------------------------------------------
   CHECK SELLER
------------------------------------------- */
async function isSeller(username: string) {
  try {
    const host = headers().get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const base = `${protocol}://${host}`;

    const res = await fetch(`${base}/api/users/role?username=${username}`);
    const data = await res.json();

    return data.role === "seller";
  } catch {
    return false;
  }
}

/* -------------------------------------------
   GET ALL PRODUCTS
------------------------------------------- */
export async function GET() {
  const ids = await kv.get<string[]>("products:all");
  if (!ids) return NextResponse.json([]);

  const now = new Date();

  const products = await Promise.all(
    ids.map(async (id) => await kv.get(`product:${id}`))
  );

  // xử lý ngày sale
  const updated = products.map((p: any) => {
    if (!p) return null;

    const start = p.saleStart ? new Date(p.saleStart) : null;
    const end = p.saleEnd ? new Date(p.saleEnd) : null;

    if (start) start.setHours(0, 0, 0, 0);
    if (end) end.setHours(23, 59, 59, 999);

    const isSale =
      p.salePrice &&
      start &&
      end &&
      now.getTime() >= start.getTime() &&
      now.getTime() <= end.getTime();

    return {
      ...p,
      isSale,
      finalPrice: isSale ? p.salePrice : p.price,
    };
  });

  return NextResponse.json(updated.filter(Boolean));
}

/* -------------------------------------------
   CREATE PRODUCT
------------------------------------------- */
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
      return NextResponse.json({ success: false, message: "Thiếu dữ liệu" });

    const sellerLower = seller.toLowerCase();
    if (!(await isSeller(sellerLower)))
      return NextResponse.json({ success: false, message: "Không phải seller" });

    // tạo ID
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
      saleStart: saleStart ? toISO(saleStart) : null,
      saleEnd: saleEnd ? toISO(saleEnd) : null,
    };

    // lưu sản phẩm
    await kv.set(`product:${id}`, newProduct);

    // thêm vào danh sách chung
    await kv.rpush("products:all", id);

    // thêm vào danh sách của seller
    await kv.rpush(`products:seller:${sellerLower}`, id);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Lỗi server" });
  }
}

/* -------------------------------------------
   UPDATE PRODUCT
------------------------------------------- */
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
      return NextResponse.json({ success: false });

    const sellerLower = seller.toLowerCase();

    if (!(await isSeller(sellerLower)))
      return NextResponse.json({ success: false });

    const product: any = await kv.get(`product:${id}`);
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
      saleStart: saleStart ? toISO(saleStart) : null,
      saleEnd: saleEnd ? toISO(saleEnd) : null,
    };

    await kv.set(`product:${id}`, updated);

    return NextResponse.json({ success: true, product: updated });
  } catch {
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
    const { seller } = await req.json();

    if (!id || !seller)
      return NextResponse.json({ success: false });

    const sellerLower = seller.toLowerCase();

    if (!(await isSeller(sellerLower)))
      return NextResponse.json({ success: false });

    const product: any = await kv.get(`product:${id}`);
    if (!product) return NextResponse.json({ success: false });

    if (product.seller !== sellerLower)
      return NextResponse.json({ success: false });

    // xóa product
    await kv.del(`product:${id}`);

    // xóa khỏi danh sách seller
    await kv.lrem(`products:seller:${sellerLower}`, 0, id);

    // xóa khỏi danh sách all
    await kv.lrem(`products:all`, 0, id);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false });
  }
}
