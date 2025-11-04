import { NextResponse } from "next/server";
import { put, list, del } from "@vercel/blob";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

/**
 * ==============================================
 * 🧩 TiTi Shop - API Quản lý sản phẩm (tối ưu)
 * ✅ Dùng 1 file chung: products.json
 * ✅ Có backup tự động trước khi ghi đè
 * ✅ Đọc/ghi nhanh, an toàn, ổn định trên Vercel
 * ✅ Hoạt động tốt trong Pi Browser
 * ==============================================
 */

/** 🔹 Đọc toàn bộ sản phẩm */
async function readProducts() {
  try {
    const { blobs } = await list();
    const file = blobs.find(
      (b) => b.pathname === "products.json" && !b.pathname.startsWith("backup-")
    );
    if (!file) return [];
    const res = await fetch(file.url, { cache: "no-store" });
    return await res.json();
  } catch (err) {
    console.error("❌ Lỗi đọc products.json:", err);
    return [];
  }
}

/** 🔹 Ghi danh sách sản phẩm với backup an toàn */
async function writeProducts(products: any[]) {
  try {
    const filename = "products.json";
    const data = JSON.stringify(products, null, 2);

    const { blobs } = await list();
    const old = blobs.find((b) => b.pathname === filename);

    // ✅ Backup trước khi ghi
    if (old) {
      try {
        const oldRes = await fetch(old.url, { cache: "no-store" });
        const oldData = await oldRes.text();
        const backupName = `backup-${Date.now()}-${filename}`;
        await put(backupName, oldData, { access: "public" });
        console.log(`📦 Backup thành công: ${backupName}`);
      } catch (err) {
        console.warn("⚠️ Không thể backup, tiếp tục ghi file:", err);
      }
    }

    // ✅ Xóa file cũ trước khi ghi (tránh lỗi ghi đè)
    if (old) await del(filename);

    // ✅ Ghi file mới
    await put(filename, data, {
      access: "public",
      addRandomSuffix: false,
    });

    console.log(`✅ Đã ghi ${filename} (${products.length} sản phẩm)`);

    // ✅ Làm mới cache (client sẽ thấy cập nhật ngay)
    revalidatePath("/api/products");
    revalidatePath("/seller/stock");
  } catch (err) {
    console.error("❌ Lỗi ghi file:", err);
  }
}

/** 🔹 Kiểm tra role người dùng có phải seller không */
async function isSeller(username: string): Promise<boolean> {
  if (!username) return false;
  try {
    const host = headers().get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/users/role?username=${username}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("⚠️ Không xác minh được quyền người bán:", res.status);
      return false;
    }

    const data = await res.json();
    return data.role === "seller";
  } catch (err) {
    console.error("❌ Lỗi xác minh role seller:", err);
    return false;
  }
}

/* =======================================
   🔹 GET - Lấy toàn bộ sản phẩm
   ======================================= */
export async function GET() {
  const products = await readProducts();
  return NextResponse.json(products, { headers: { "Cache-Control": "no-store" } });
}

/* =======================================
   🔹 POST - Thêm sản phẩm mới
   ======================================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, price, description, images, seller } = body;

    if (!name || !price || !seller) {
      return NextResponse.json(
        { success: false, message: "Thiếu tên, giá hoặc người bán" },
        { status: 400 }
      );
    }

    const sellerLower = seller.trim().toLowerCase();
    const canPost = await isSeller(sellerLower);

    if (!canPost) {
      return NextResponse.json(
        { success: false, message: "Tài khoản không có quyền đăng sản phẩm" },
        { status: 403 }
      );
    }

    const products = await readProducts();
    const newProduct = {
      id: Date.now(),
      name,
      price,
      description: description || "",
      images: images || [],
      seller: sellerLower,
      createdAt: new Date().toISOString(),
    };

    products.unshift(newProduct);
    await writeProducts(products);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    console.error("❌ POST error:", err);
    return NextResponse.json(
      { success: false, message: "Lỗi khi thêm sản phẩm" },
      { status: 500 }
    );
  }
}

/* =======================================
   🔹 PUT - Sửa sản phẩm
   ======================================= */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, price, description, images, seller } = body;

    if (!id || !seller || !name || !price) {
      return NextResponse.json(
        { success: false, message: "Thiếu dữ liệu sản phẩm" },
        { status: 400 }
      );
    }

    const sellerLower = seller.trim().toLowerCase();
    const canEdit = await isSeller(sellerLower);

    if (!canEdit) {
      return NextResponse.json(
        { success: false, message: "Không có quyền sửa sản phẩm" },
        { status: 403 }
      );
    }

    const products = await readProducts();
    const index = products.findIndex((p: any) => p.id === id);

    if (index === -1)
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );

    if (products[index].seller.toLowerCase() !== sellerLower)
      return NextResponse.json(
        { success: false, message: "Không được sửa sản phẩm người khác" },
        { status: 403 }
      );

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
    return NextResponse.json(
      { success: false, message: "Không thể cập nhật sản phẩm" },
      { status: 500 }
    );
  }
}

/* =======================================
   🔹 DELETE - Xóa sản phẩm
   ======================================= */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    const body = await req.json().catch(() => ({}));
    const seller = (body?.seller || "").trim().toLowerCase();

    if (!id || !seller)
      return NextResponse.json(
        { success: false, message: "Thiếu ID hoặc seller" },
        { status: 400 }
      );

    const canDelete = await isSeller(seller);
    if (!canDelete)
      return NextResponse.json(
        { success: false, message: "Không có quyền xóa sản phẩm" },
        { status: 403 }
      );

    const products = await readProducts();
    const product = products.find((p: any) => p.id === id);

    if (!product)
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );

    if (product.seller.toLowerCase() !== seller)
      return NextResponse.json(
        { success: false, message: "Không được xóa sản phẩm của người khác" },
        { status: 403 }
      );

    const updated = products.filter((p) => p.id !== id);
    await writeProducts(updated);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("❌ DELETE error:", err);
    return NextResponse.json(
      { success: false, message: "Lỗi khi xóa sản phẩm" },
      { status: 500 }
    );
  }
}
