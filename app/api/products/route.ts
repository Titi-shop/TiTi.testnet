// /app/api/products/route.ts
import { NextResponse } from "next/server";
import { list, put, del } from "@vercel/blob";

// 📌 Đọc danh sách sản phẩm
async function readProducts() {
  try {
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === "products.json");
    if (!file) return [];
    const res = await fetch(file.url, { cache: "no-store" });
    return await res.json();
  } catch (err) {
    console.error("Lỗi đọc products.json:", err);
    return [];
  }
}

// 📌 Ghi danh sách sản phẩm
async function writeProducts(products: any[]) {
  try {
    const json = JSON.stringify(products, null, 2);

    const { blobs } = await list();
    const old = blobs.find((b) => b.pathname === "products.json");
    if (old) await del("products.json");

    await put("products.json", json, {
      access: "public",
      addRandomSuffix: false,
    });
  } catch (err) {
    console.error("Lỗi ghi products.json:", err);
  }
}

// ============================
// 📌 API GET — Lấy sản phẩm
// ============================
export async function GET() {
  const products = await readProducts();
  return NextResponse.json(products);
}

// ============================
// 📌 API POST — Thêm sản phẩm
// ============================
export async function POST(req: Request) {
  const body = await req.json();
  const { name, price, images, categoryId } = body;

  if (!name || !price) {
    return NextResponse.json(
      { error: "Thiếu tên hoặc giá" },
      { status: 400 }
    );
  }

  const products = await readProducts();

  const newItem = {
    id: Date.now(),
    name,
    price,
    images: images || [],
    categoryId: Number(categoryId) || null,
    createdAt: new Date().toISOString(),
  };

  products.unshift(newItem);
  await writeProducts(products);

  return NextResponse.json(newItem);
}
