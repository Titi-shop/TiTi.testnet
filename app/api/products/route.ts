import { NextResponse } from "next/server";
import { del, put, list } from "@vercel/blob";
import { headers } from "next/headers";

/** Đọc danh sách sản phẩm từ Blob */
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

/** Ghi danh sách sản phẩm vào Blob */
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

    console.log("✅ Đã lưu products.json:", products.length);
  } catch (err) {
    console.error("❌ Lỗi ghi file:", err);
  }
}

/** 🔹 GET - Hỗ trợ tìm kiếm ?search= */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("search") || "").toLowerCase();

    const products = await readProducts();

    // Nếu có từ khóa thì lọc
    const filtered = query
      ? products.filter((p: any) =>
          (p.name?.toLowerCase().includes(query) ||
           p.description?.toLowerCase().includes(query) ||
           p.seller?.toLowerCase().includes(query))
        )
      : products;

    // ⚠️ Trả về đúng dạng object
    return NextResponse.json({ products: filtered });
  } catch (err) {
    console.error("❌ Lỗi GET /api/products:", err);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}

/** 🔹 POST / PUT / DELETE — giữ nguyên của bạn */
