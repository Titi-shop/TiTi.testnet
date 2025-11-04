// app/api/products/route.ts
import { NextResponse } from "next/server";
import { del, put, list } from "@vercel/blob";
import { headers } from "next/headers";

/**
 * =========================================
 * 🛍️ TiTi Marketplace - API Quản lý sản phẩm
 * -----------------------------------------
 * ✅ Hỗ trợ Next.js 15 / Edge Runtime
 * ✅ Có backup khi ghi file
 * ✅ Không lỗi cache / mất sản phẩm
 * =========================================
 */

/** Đọc file sản phẩm từ Blob */
async function readProducts() {
  try {
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === "products.json");
    if (!file) return [];
    const res = await fetch(file.url, { cache: "no-store" });
    return await res.json();
  } catch (err) {
    console.error("❌ Lỗi đọc products.json:", err);
    return [];
  }
}

/** Ghi danh sách sản phẩm và tạo bản sao backup */
async function writeProducts(products: any[]) {
  try {
    const json = JSON.stringify(products, null, 2);
    const { blobs } = await list();
    const old = blobs.find((b) => b.pathname === "products.json");

    // 🔹 Backup file cũ trước khi ghi mới
    if (old) {
      await put(`backup-${Date.now()}-products.json`, await (await fetch(old.url)).text(), {
        access: "public",
      });
    }

    // 🔹 Ghi file mới
    await put("products.json", json, {
      access: "public",
      addRandomSuffix: false,
    });

    // 🔹 Xóa file cũ (nếu cần) sau khi thành công
    if (old) await del("products.json");
    console.log("✅ Đã lưu products.json:", products.length);
  } catch (err) {
    console.error("❌ Lỗi ghi products.json:", err);
  }
}

/** Kiểm tra quyền người bán */
async function isSeller(username: string): Promise<boolean> {
  try {
    const host = headers().get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/users/role?username=${username}`, {
      cache: "no-store",
    });

    if (!res.ok) return false;
    const data = await res.json();
    return data.role === "seller";
  } catch (err) {
    console.error("❌ Lỗi kiểm tra quyền:", err);
    return false;
  }
}

/** GET - Lấy toàn bộ sản phẩm */
export async function GET() {
  const products = await readProducts();
  return NextResponse.json(products);
}

/** POST - Thêm sản phẩm */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, description, images, seller } = body;

    if (!name || !price || !seller)
      return NextResponse.json({ success: false, message: "Thiếu dữ liệu" }, { status: 400 });

    const username = seller.trim().toLowerCase();
    if (!(await isSeller(username)))
      return NextResponse.json({ success: false, message: "Không có quyền đăng" }, { status: 403 });

    const products = await readProducts();
    const newProduct = {
      id: Date.now(),
      name,
      price,
      description: description || "",
      images: images || [],
      seller: username,
      createdAt: new Date().toISOString(),
    };

    products.unshift(newProduct);
    await writeProducts(products);
    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    console.error("❌ POST error:", err);
    return NextResponse.json({ success: false, message: "Lỗi khi thêm sản phẩm" }, { status: 500 });
  }
}

/** PUT - Cập nhật sản phẩm */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, price, description, images, seller } = body;

    if (!id || !name || !price || !seller)
      return NextResponse.json({ success: false, message: "Thiếu dữ liệu" }, { status: 400 });

    const username = seller.trim().toLowerCase();
    if (!(await isSeller(username)))
      return NextResponse.json({ success: false, message: "Không có quyền sửa" }, { status: 403 });

    const products = await readProducts();
    const index = products.findIndex((p: any) => p.id === id);
    if (index === -1)
      return NextResponse.json({ success: false, message: "Không tìm thấy sản phẩm" }, { status: 404 });

    if (products[index].seller.toLowerCase() !== username)
      return NextResponse.json({ success: false, message: "Không thể sửa sản phẩm của người khác" }, { status: 403 });

    products[index] = {
      ...products[index],
      name,
      price,
      description,
      images,
      updatedAt: new Date().toISOString(),
    };

    await writeProducts(products);
    return NextResponse.json({ success: true, product: products[index] });
  } catch (err) {
    console.error("❌ PUT error:", err);
    return NextResponse.json({ success: false, message: "Lỗi cập nhật" }, { status: 500 });
  }
}

/** DELETE - Xóa sản phẩm */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const body = await req.json();
    const seller = (body?.seller || "").toLowerCase();

    if (!id || !seller)
      return NextResponse.json({ success: false, message: "Thiếu ID hoặc seller" }, { status: 400 });

    if (!(await isSeller(seller)))
      return NextResponse.json({ success: false, message: "Không có quyền xóa" }, { status: 403 });

    const products = await readProducts();
    const product = products.find((p: any) => p.id === id);
    if (!product)
      return NextResponse.json({ success: false, message: "Không tìm thấy sản phẩm" }, { status: 404 });

    if (product.seller.toLowerCase() !== seller)
      return NextResponse.json({ success: false, message: "Không thể xóa sản phẩm của người khác" }, { status: 403 });

    const updated = products.filter((p) => p.id !== id);
    await writeProducts(updated);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE error:", err);
    return NextResponse.json({ success: false, message: "Lỗi khi xóa" }, { status: 500 });
  }
}
