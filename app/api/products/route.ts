// app/api/products/route.ts
import { NextResponse } from "next/server";
import { del, put, list } from "@vercel/blob";
import { headers } from "next/headers";

/**
 * =========================================
 * 🛍️ TiTi Marketplace - API Quản lý sản phẩm (Final)
 * -----------------------------------------
 * ✅ Hỗ trợ nhiều người bán (mỗi người 1 file riêng)
 * ✅ Backup an toàn, không mất sản phẩm
 * ✅ Nhanh và ổn định trên Pi Browser + Vercel
 * ✅ Chạy tốt với Next.js 15 (Edge runtime)
 * =========================================
 */

/** Đọc file sản phẩm của người bán */
async function readProducts(seller?: string) {
  try {
    const { blobs } = await list();
    const filename = seller
      ? `products-${seller.toLowerCase()}.json`
      : "products.json";
    const file = blobs.find((b) => b.pathname === filename);
    if (!file) return [];
    const res = await fetch(file.url, { cache: "no-store" });
    return await res.json();
  } catch (err) {
    console.error("❌ Lỗi đọc sản phẩm:", err);
    return [];
  }
}

/** Ghi file sản phẩm + tạo bản backup */
async function writeProducts(products: any[], seller?: string) {
  try {
    const filename = seller
      ? `products-${seller.toLowerCase()}.json`
      : "products.json";
    const data = JSON.stringify(products, null, 2);

    // 🔹 Backup file cũ
    const { blobs } = await list();
    const old = blobs.find((b) => b.pathname === filename);
    if (old) {
      await put(`backup-${Date.now()}-${filename}`, await (await fetch(old.url)).text(), {
        access: "public",
      });
      await del(filename);
    }

    // 🔹 Ghi file mới
    await put(filename, data, {
      access: "public",
      addRandomSuffix: false,
    });

    console.log(`✅ Đã lưu ${filename}:`, products.length);
  } catch (err) {
    console.error("❌ Lỗi ghi sản phẩm:", err);
  }
}

/** Kiểm tra người dùng có phải seller không */
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
    console.error("❌ Lỗi xác minh quyền:", err);
    return false;
  }
}

/** 🔹 GET - Lấy toàn bộ sản phẩm (hoặc theo seller) */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const seller = searchParams.get("seller")?.toLowerCase() || "";
  const products = await readProducts(seller || undefined);
  return NextResponse.json(products);
}

/** 🔹 POST - Thêm sản phẩm mới */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, description, images, seller } = body;

    if (!name || !price || !seller)
      return NextResponse.json({ success: false, message: "Thiếu dữ liệu" }, { status: 400 });

    const username = seller.trim().toLowerCase();
    if (!(await isSeller(username)))
      return NextResponse.json({ success: false, message: "Không có quyền đăng" }, { status: 403 });

    const products = await readProducts(username);
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
    await writeProducts(products, username);
    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    console.error("❌ POST error:", err);
    return NextResponse.json({ success: false, message: "Lỗi khi thêm sản phẩm" }, { status: 500 });
  }
}

/** 🔹 PUT - Cập nhật sản phẩm */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, price, description, images, seller } = body;

    if (!id || !name || !price || !seller)
      return NextResponse.json({ success: false, message: "Thiếu dữ liệu" }, { status: 400 });

    const username = seller.trim().toLowerCase();
    if (!(await isSeller(username)))
      return NextResponse.json({ success: false, message: "Không có quyền sửa" }, { status: 403 });

    const products = await readProducts(username);
    const index = products.findIndex((p: any) => p.id === id);
    if (index === -1)
      return NextResponse.json({ success: false, message: "Không tìm thấy sản phẩm" }, { status: 404 });

    products[index] = {
      ...products[index],
      name,
      price,
      description,
      images,
      updatedAt: new Date().toISOString(),
    };

    await writeProducts(products, username);
    return NextResponse.json({ success: true, product: products[index] });
  } catch (err) {
    console.error("❌ PUT error:", err);
    return NextResponse.json({ success: false, message: "Lỗi cập nhật" }, { status: 500 });
  }
}

/** 🔹 DELETE - Xóa sản phẩm */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const seller = searchParams.get("seller")?.toLowerCase() || "";

    if (!id || !seller)
      return NextResponse.json({ success: false, message: "Thiếu ID hoặc seller" }, { status: 400 });

    if (!(await isSeller(seller)))
      return NextResponse.json({ success: false, message: "Không có quyền xóa" }, { status: 403 });

    const products = await readProducts(seller);
    const updated = products.filter((p) => p.id !== id);
    await writeProducts(updated, seller);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE error:", err);
    return NextResponse.json({ success: false, message: "Lỗi khi xóa" }, { status: 500 });
  }
}
