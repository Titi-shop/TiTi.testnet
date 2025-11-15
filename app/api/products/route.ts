import { NextResponse } from "next/server";
import { del, put, list } from "@vercel/blob";
import { headers } from "next/headers";
import { toISO } from "@/lib/formatDate";

const FILE_NAME = "products.json";

/* =====================================
   📌 Đọc file sản phẩm từ Blob
===================================== */
async function readProducts() {
  try {
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === FILE_NAME);

    if (!file) return [];
    const res = await fetch(file.url, { cache: "no-store" });
    return await res.json();
  } catch (err) {
    console.error("❌ Lỗi đọc file:", err);
    return [];
  }
}

/* =====================================
   📌 Ghi file sản phẩm
===================================== */
async function writeProducts(data: any[]) {
  try {
    const { blobs } = await list();
    const old = blobs.find((b) => b.pathname === FILE_NAME);
    if (old) await del(FILE_NAME);

    await put(FILE_NAME, JSON.stringify(data, null, 2), {
      access: "public",
      addRandomSuffix: false,
    });
  } catch (err) {
    console.error("❌ Lỗi ghi file:", err);
  }
}

/* =====================================
   📌 Kiểm tra quyền seller
===================================== */
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

/* =====================================
   🚀 GET – Lấy tất cả sản phẩm
===================================== */
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

/* =====================================
   🚀 POST – Thêm sản phẩm mới
===================================== */
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
    if (!ok)
      return NextResponse.json({ success: false, message: "Không có quyền đăng" });

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
      views: 0,
      sold: 0,
      salePrice: salePrice || null,
      saleStart: saleStart ? toISO(saleStart) : null,
      saleEnd: saleEnd ? toISO(saleEnd) : null,
    };

    list.unshift(newProduct);
    await writeProducts(list);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Lỗi thêm sản phẩm" });
  }
}

/* =====================================
   🚀 PUT – Sửa sản phẩm
===================================== */
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
    if (!ok)
      return NextResponse.json({ success: false, message: "Không có quyền sửa" });

    const list = await readProducts();
    const index = list.findIndex((p) => p.id === id);

    if (index === -1)
      return NextResponse.json({ success: false, message: "Không tìm thấy sản phẩm" });

    if (list[index].seller !== sellerLower)
      return NextResponse.json({
        success: false,
        message: "Không được sửa sản phẩm người khác",
      });

    list[index] = {
      ...list[index],
      name,
      price,
      description,
      images,
      categoryId: Number(categoryId) || list[index].categoryId,
      updatedAt: new Date().toISOString(),
      salePrice: salePrice || null,
      saleStart: saleStart ? toISO(saleStart) : null,
      saleEnd: saleEnd ? toISO(saleEnd) : null,
    };

    await writeProducts(list);

    return NextResponse.json({ success: true, product: list[index] });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Lỗi cập nhật" });
  }
}

/* =====================================
   🚀 DELETE – Xoá sản phẩm
===================================== */
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = Number(url.searchParams.get("id"));
    const { seller } = await req.json();

    if (!id || !seller)
      return NextResponse.json({ success: false, message: "Thiếu dữ liệu" });

    const sellerLower = seller.toLowerCase();
    const ok = await isSeller(sellerLower);
    if (!ok)
      return NextResponse.json({ success: false, message: "Không có quyền xoá" });

    const list = await readProducts();
    const item = list.find((p) => p.id === id);

    if (!item)
      return NextResponse.json({ success: false, message: "Không tìm thấy sản phẩm" });

    if (item.seller !== sellerLower)
      return NextResponse.json({
        success: false,
        message: "Không được xoá sản phẩm người khác",
      });

    const updated = list.filter((p) => p.id !== id);
    await writeProducts(updated);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: "Lỗi xoá" });
  }
}
