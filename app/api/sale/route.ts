import { NextResponse } from "next/server";
import { list, put, del } from "@vercel/blob";

// 📌 Đọc sale.json
async function readSale() {
  try {
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === "sale.json");
    if (!file) return [];
    const res = await fetch(file.url, { cache: "no-store" });
    return await res.json();
  } catch (err) {
    console.error("Lỗi đọc sale.json:", err);
    return [];
  }
}

// 📌 Ghi sale.json
async function writeSale(items: any[]) {
  try {
    const json = JSON.stringify(items, null, 2);

    const { blobs } = await list();
    const old = blobs.find((b) => b.pathname === "sale.json");
    if (old) await del("sale.json");

    await put("sale.json", json, {
      access: "public",
      addRandomSuffix: false,
    });
  } catch (err) {
    console.error("Lỗi ghi sale.json:", err);
  }
}

// ============================
// 📌 GET — Lấy danh sách sale
// ============================
export async function GET() {
  const items = await readSale();
  return NextResponse.json(items);
}

// ============================
// 📌 POST — Thêm sản phẩm sale
// ============================
export async function POST(req: Request) {
  const body = await req.json();
  const { productId, salePrice, from, to } = body;

  if (!productId || !salePrice) {
    return NextResponse.json(
      { error: "Thiếu productId hoặc salePrice" },
      { status: 400 }
    );
  }

  const items = await readSale();

  const newSale = {
    id: Date.now(),
    productId,
    salePrice,
    from: from || null,
    to: to || null,
  };

  items.unshift(newSale);
  await writeSale(items);

  return NextResponse.json(newSale);
}
