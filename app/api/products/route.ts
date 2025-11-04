import { NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * ==============================================
 * 🧩 TiTi Shop - API sản phẩm (multi-seller tối ưu)
 * ✅ Mỗi người bán 1 file riêng → không xung đột
 * ✅ Lưu cực nhanh, không delay CDN
 * ✅ Tự động nhận diện seller từ /api/users/role
 * ==============================================
 */

/** 🔹 Đọc sản phẩm của 1 seller */
async function readSellerProducts(seller: string) {
  try {
    const filename = `products-${seller}.json`;
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === filename);
    if (!file) return [];
    const res = await fetch(file.url, { cache: "no-store" });
    return await res.json();
  } catch (err) {
    console.error(`❌ Lỗi đọc file của ${seller}:`, err);
    return [];
  }
}

/** 🔹 Ghi file riêng của seller */
async function writeSellerProducts(seller: string, products: any[]) {
  try {
    const filename = `products-${seller}.json`;
    const data = JSON.stringify(products, null, 2);
    const { blobs } = await list();
    const old = blobs.find((b) => b.pathname === filename);
    if (old) await del(filename);

    await put(filename, data, { access: "public", addRandomSuffix: false });

    console.log(`✅ Đã ghi ${filename} (${products.length} sản phẩm)`);

    // revalidate riêng, không toàn bộ
    revalidatePath("/api/products");
    revalidatePath("/seller/stock");
  } catch (err) {
    console.error("❌ Lỗi ghi file:", err);
  }
}

/** 🔹 Lấy danh sách tất cả sản phẩm của mọi seller */
async function readAllProducts() {
  try {
    const { blobs } = await list();
    const productFiles = blobs.filter((b) => b.pathname.startsWith("products-"));
    const all: any[] = [];
    for (const file of productFiles) {
      const res = await fetch(file.url, { cache: "no-store" });
      const items = await res.json();
      all.push(...items);
    }
    return all;
  } catch (err) {
    console.error("❌ Lỗi đọc tất cả sản phẩm:", err);
    return [];
  }
}

/** 🔹 Xác định role thật của user từ /api/users/role */
async function getUserRole(username: string) {
  try {
    const host = headers().get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    const res = await fetch(`${baseUrl}/api/users/role?username=${username}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.role || null;
  } catch (err) {
    console.error("❌ Lỗi lấy role người dùng:", err);
    return null;
  }
}

/* =======================================
   🔹 GET – Lấy toàn bộ sản phẩm marketplace
   ======================================= */
export async function GET() {
  const all = await readAllProducts();
  return NextResponse.json(all, { headers: { "Cache-Control": "no-store" } });
}

/* =======================================
   🔹 POST – Đăng sản phẩm mới
   ======================================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, description, images, seller } = body;

    if (!name || !price || !seller)
      return NextResponse.json({ success: false, message: "Thiếu dữ liệu" }, { status: 400 });

    const sellerLower = seller.trim().toLowerCase();
    const role = await getUserRole(sellerLower);
    if (role !== "seller")
      return NextResponse.json({ success: false, message: "Không có quyền đăng sản phẩm" }, { status: 403 });

    const sellerProducts = await readSellerProducts(sellerLower);
    const newProduct = {
      id: Date.now(),
      name,
      price,
      description: description || "",
      images: images || [],
      seller: sellerLower,
      createdAt: new Date().toISOString(),
    };

    sellerProducts.unshift(newProduct);
    await writeSellerProducts(sellerLower, sellerProducts);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    console.error("❌ POST error:", err);
    return NextResponse.json({ success: false, message: "Lỗi khi đăng sản phẩm" }, { status: 500 });
  }
}

/* =======================================
   🔹 PUT – Sửa sản phẩm (theo seller)
   ======================================= */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, price, description, images, seller } = body;
    if (!id || !seller)
      return NextResponse.json({ success: false, message: "Thiếu dữ liệu" }, { status: 400 });

    const sellerLower = seller.trim().toLowerCase();
    const role = await getUserRole(sellerLower);
    if (role !== "seller")
      return NextResponse.json({ success: false, message: "Không có quyền sửa" }, { status: 403 });

    const sellerProducts = await readSellerProducts(sellerLower);
    const index = sellerProducts.findIndex((p) => p.id === id);
    if (index === -1)
      return NextResponse.json({ success: false, message: "Không tìm thấy sản phẩm" }, { status: 404 });

    sellerProducts[index] = {
      ...sellerProducts[index],
      name,
      price,
      description,
      images,
      updatedAt: new Date().toISOString(),
    };

    await writeSellerProducts(sellerLower, sellerProducts);
    return NextResponse.json({ success: true, product: sellerProducts[index] });
  } catch (err) {
    console.error("❌ PUT error:", err);
    return NextResponse.json({ success: false, message: "Lỗi khi cập nhật" }, { status: 500 });
  }
}

/* =======================================
   🔹 DELETE – Xóa sản phẩm của seller
   ======================================= */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const body = await req.json();
    const seller = (body?.seller || "").trim().toLowerCase();

    if (!id || !seller)
      return NextResponse.json({ success: false, message: "Thiếu ID hoặc seller" }, { status: 400 });

    const role = await getUserRole(seller);
    if (role !== "seller")
      return NextResponse.json({ success: false, message: "Không có quyền xóa" }, { status: 403 });

    const sellerProducts = await readSellerProducts(seller);
    const exists = sellerProducts.find((p) => p.id === id);
    if (!exists)
      return NextResponse.json({ success: false, message: "Không tìm thấy sản phẩm" }, { status: 404 });

    const updated = sellerProducts.filter((p) => p.id !== id);
    await writeSellerProducts(seller, updated);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE error:", err);
    return NextResponse.json({ success: false, message: "Lỗi khi xóa" }, { status: 500 });
  }
}
