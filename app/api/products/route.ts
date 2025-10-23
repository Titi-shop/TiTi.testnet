import { NextResponse } from "next/server";
import { del, put, list } from "@vercel/blob";

// =========================
// 🧩 Đọc & ghi dữ liệu
// =========================
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

async function writeProducts(products: any[]) {
  try {
    const data = JSON.stringify(products, null, 2);
    const { blobs } = await list();
    const old = blobs.find((b) => b.pathname === "products.json");
    if (old) await del("products.json");

    await put("products.json", data, {
      access: "public",
      addRandomSuffix: false,
    });

    console.log("✅ Đã ghi products.json:", products.length);
  } catch (err) {
    console.error("❌ Lỗi ghi file:", err);
  }
}

// =========================
// 🔐 Xác thực người bán qua Pi Login
// =========================
async function verifySeller(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;

    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return null;

    // 🔹 Gửi tới API của Pi để xác minh
    const res = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) return null;
    const user = await res.json();

    // ✅ Kiểm tra người bán — tùy theo app bạn định danh seller
    const allowedSellers = ["nguyenminhduc1991111", "seller_demo_1", "pi_seller"];
    if (allowedSellers.includes(user.username)) return user;

    return null;
  } catch (err) {
    console.error("❌ verifySeller error:", err);
    return null;
  }
}

// =========================
// 🔹 GET — ai cũng có thể xem
// =========================
export async function GET() {
  const products = await readProducts();
  return NextResponse.json(products);
}

// =========================
// 🔹 POST — chỉ người bán
// =========================
export async function POST(req: Request) {
  const user = await verifySeller(req);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Không có quyền thêm sản phẩm" },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { name, price, description, images } = body;

    if (!name || !price)
      return NextResponse.json(
        { success: false, message: "Thiếu tên hoặc giá sản phẩm" },
        { status: 400 }
      );

    const products = await readProducts();

    const newProduct = {
      id: Date.now(),
      name,
      price,
      description: description || "",
      images: images || [],
      seller: user.username,
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

// =========================
// 🔹 PUT — chỉ người bán
// =========================
export async function PUT(req: Request) {
  const user = await verifySeller(req);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Không có quyền sửa sản phẩm" },
      { status: 403 }
    );
  }

  try {
    const formData = await req.formData();
    const id = Number(formData.get("id"));
    const name = formData.get("name") as string;
    const price = Number(formData.get("price"));
    const description = formData.get("description") as string;
    const images = formData.getAll("images") as string[];

    if (!id || !name || !price) {
      return NextResponse.json(
        { success: false, message: "Thiếu dữ liệu sản phẩm" },
        { status: 400 }
      );
    }

    const products = await readProducts();
    const index = products.findIndex((p: any) => p.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm để cập nhật" },
        { status: 404 }
      );
    }

    const updatedProduct = {
      ...products[index],
      name,
      price,
      description,
      images,
      updatedAt: new Date().toISOString(),
    };

    products[index] = updatedProduct;
    await writeProducts(products);

    return NextResponse.json({ success: true, product: updatedProduct });
  } catch (err) {
    console.error("❌ PUT error:", err);
    return NextResponse.json(
      { success: false, message: "Không thể cập nhật sản phẩm" },
      { status: 500 }
    );
  }
}

// =========================
// 🔹 DELETE — chỉ người bán
// =========================
export async function DELETE(req: Request) {
  const user = await verifySeller(req);
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Không có quyền xóa sản phẩm" },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = Number(searchParams.get("id"));
    if (!id)
      return NextResponse.json(
        { success: false, message: "Thiếu ID" },
        { status: 400 }
      );

    const products = await readProducts();
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
