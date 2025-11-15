import { NextResponse } from "next/server";
import { del, put, list } from "@vercel/blob";
import { headers } from "next/headers";

// PI env
const isTestnet =
  process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
  process.env.PI_API_URL?.includes("/sandbox");

/** Đọc products.json từ blob */
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

/** Ghi products.json */
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
  } catch (err) {
    console.error("❌ Lỗi ghi file:", err);
  }
}

/** Kiểm tra seller */
async function isSeller(username: string): Promise<boolean> {
  try {
    if (isTestnet) return true;

    const host = headers().get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch(`${baseUrl}/api/users/role?username=${username}`, {
      cache: "no-store",
    });

    if (!res.ok) return false;

    const data = await res.json();
    return data.role === "seller";
  } catch {
    return false;
  }
}

/** ⭐ GET - hỗ trợ lọc sản phẩm theo danh mục */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cate = searchParams.get("category");

  const products = await readProducts();
  const now = new Date();

  const enriched = products.map((p: any) => {
    const start = p.saleStart ? new Date(p.saleStart) : null;
    const end = p.saleEnd ? new Date(p.saleEnd) : null;
    const isSale =
      start && end && now >= start && now <= end && p.salePrice;

    return {
      ...p,
      isSale,
      finalPrice: isSale ? p.salePrice : p.price,
    };
  });

  // ⭐ Lọc theo danh mục
  if (cate) {
    const cateId = parseInt(cate);
    return NextResponse.json(enriched.filter((p) => p.categoryId === cateId));
  }

  return NextResponse.json(enriched);
}

/** ⭐ POST - thêm categoryId */
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

    if (!name || !price || !seller || !categoryId) {
      return NextResponse.json(
        { success: false, message: "Thiếu dữ liệu sản phẩm" },
        { status: 400 }
      );
    }

    const sellerLower = seller.trim().toLowerCase();
    const canPost = await isSeller(sellerLower);
    if (!canPost)
      return NextResponse.json(
        { success: false, message: "Không có quyền đăng" },
        { status: 403 }
      );

    const products = await readProducts();

    const newProduct = {
      id: Date.now(),
      name,
      price,
      description: description || "",
      images: images || [],
      seller: sellerLower,

      // ⭐ LƯU DANH MỤC
      categoryId: Number(categoryId),

      salePrice: salePrice || null,
      saleStart: saleStart || null,
      saleEnd: saleEnd || null,

      createdAt: new Date().toISOString(),
      env: isTestnet ? "testnet" : "mainnet",
    };

    products.unshift(newProduct);
    await writeProducts(products);

    return NextResponse.json({ success: true, product: newProduct });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Lỗi thêm sản phẩm" },
      { status: 500 }
    );
  }
}

/** ⭐ PUT - cập nhật categoryId */
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

    if (!id || !name || !seller || !price || !categoryId) {
      return NextResponse.json(
        { success: false, message: "Thiếu dữ liệu cập nhật" },
        { status: 400 }
      );
    }

    const sellerLower = seller.trim().toLowerCase();
    const canEdit = await isSeller(sellerLower);
    if (!canEdit)
      return NextResponse.json(
        { success: false, message: "Không có quyền sửa" },
        { status: 403 }
      );

    const products = await readProducts();
    const index = products.findIndex((p: any) => p.id === id);

    if (index === -1)
      return NextResponse.json(
        { success: false, message: "Không tìm thấy sản phẩm" },
        { status: 404 }
      );

    products[index] = {
      ...products[index],
      name,
      price,
      description,
      images,
      categoryId: Number(categoryId),
      salePrice,
      saleStart,
      saleEnd,
      updatedAt: new Date().toISOString(),
    };

    await writeProducts(products);

    return NextResponse.json({ success: true, product: products[index] });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Không thể cập nhật" },
      { status: 500 }
    );
  }
}
