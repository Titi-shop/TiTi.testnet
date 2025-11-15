import { NextResponse } from "next/server";
import { del, put, list } from "@vercel/blob";
import { headers } from "next/headers";

const FILE_NAME = "products.json";

/* ===============================
   📌 Đọc danh sách sản phẩm
================================*/
async function readProducts() {
  try {
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === FILE_NAME);
    if (!file) return [];

    const res = await fetch(file.url, { cache: "no-store" });
    return await res.json();
  } catch {
    return [];
  }
}

/* ===============================
   📌 Ghi danh sách sản phẩm
================================*/
async function writeProducts(products: any[]) {
  try {
    const { blobs } = await list();
    const old = blobs.find((b) => b.pathname === FILE_NAME);
    if (old) await del(FILE_NAME);

    await put(FILE_NAME, JSON.stringify(products, null, 2), {
      access: "public",
      addRandomSuffix: false,
    });
  } catch (err) {
    console.error("❌ Lỗi ghi sản phẩm:", err);
  }
}

/* ===============================
   📌 Kiểm tra quyền Seller
================================*/
async function isSeller(username: string) {
  try {
    const host = headers().get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const base = `${protocol}://${host}`;

    const res = await fetch(`${base}/api/users/role?username=${username}`);
    if (!res.ok) return false;

    const data = await res.json();
    return data.role === "seller";
  } catch {
    return false;
  }
}

/* ===============================
   🚀 GET – Lấy toàn bộ sản phẩm
================================*/
export async function GET() {
  const list = await readProducts();
  const now = new Date();

  const updated = list.map((p) => {
    const start = p.saleStart ? new Date(p.saleStart) : null;
    const end = p.saleEnd ? new Date(p.saleEnd) : null;

    const isSale =
      p.salePrice &&
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
}

/* ===============================
   🚀 POST – Thêm sản phẩm mới
================================*/
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
    const ok = await isSeller(sellerLower);
    if (!ok) return NextResponse.json({ success: false, message: "Không có quyền đăng" });

    const list = await readProducts();

    const newProduct = {
      id: Date.now(),
      name,
      price,
      description: description || "",
      images: images || [],
      seller: sellerLower,
      categoryId: Number(categoryId) || null,
      createdAt: new Date().toISOString(),
      salePrice: salePrice || null,
      saleStart: saleStart || null,
      saleEnd: saleEnd || null,
    };

    list.unshift(newProduct);
    await writeProducts(list);

    return NextResponse.json({ success: true, product: newProduct });
  } catch {
    return NextResponse.json({ success: false, message: "Lỗi thêm" });
  }
}

/* ===============================
   🚀 PUT – Sửa sản phẩm
================================*/
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
      return NextResponse.json({ success: false, message: "Thiếu dữ liệu" });

    const sellerLower = seller.toLowerCase();
    const ok = await isSeller(sellerLower);
    if (!ok) return NextResponse.json({ success: false, message: "Không có quyền sửa" });

    const list = await readProducts();
    const index = list.findIndex((p) => p.id === id);

    if (index === -1)
      return NextResponse.json({ success: false, message: "Không tìm thấy sản phẩm" });

    if (list[index].seller !== sellerLower)
      return NextResponse.json({ success: false, message: "Không được sửa sản phẩm người khác" });

    list[index] = {
      ...list[index],
      name,
      price,
      description,
      images,
      categoryId: Number(categoryId) || list[index].categoryId,
      updatedAt: new Date().toISOString(),
      salePrice: salePrice ?? list[index].salePrice,
      saleStart: saleStart ?? list[index].saleStart,
      saleEnd: saleEnd ?? list[index].saleEnd,
    };

    await writeProducts(list);

    return NextResponse.json({ success: true, product: list[index] });
  } catch {
    return NextResponse.json({ success: false, message: "Lỗi cập nhật" });
  }
}

/* ===============================
   🚀 DELETE – Xóa sản phẩm
================================*/
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    const body = await req.json();
    const seller = body.seller?.toLowerCase();

    if (!id || !seller)
      return NextResponse.json({ success: false, message: "Thiếu dữ liệu" });

    const ok = await isSeller(seller);
    if (!ok) return NextResponse.json({ success: false, message: "Không có quyền xóa" });

    const list = await readProducts();
    const item = list.find((p) => p.id === id);

    if (!item) return NextResponse.json({ success: false, message: "Không tìm thấy" });
    if (item.seller !== seller)
      return NextResponse.json({ success: false, message: "Không được xóa sản phẩm người khác" });

    const updated = list.filter((p) => p.id !== id);
    await writeProducts(updated);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: "Lỗi xóa" });
  }
}
