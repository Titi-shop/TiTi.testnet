import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

/** Đọc danh sách sản phẩm */
async function readProducts() {
  try {
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === "products.json");
    if (!file) return [];
    const res = await fetch(file.url, { cache: "no-store" });
    return await res.json();
  } catch (err) {
    console.error("❌ Lỗi đọc products:", err);
    return [];
  }
}

/** GET – Lấy danh sách sản phẩm đang sale */
export async function GET() {
  const now = new Date();
  const products = await readProducts();

  const saleItems = products.filter((p: any) => {
    const start = p.saleStart ? new Date(p.saleStart) : null;
    const end = p.saleEnd ? new Date(p.saleEnd) : null;

    return (
      p.salePrice &&
      start &&
      end &&
      now >= start &&
      now <= end
    );
  });

  return NextResponse.json(saleItems);
}
