import { NextResponse } from "next/server";
import { list, put, del } from "@vercel/blob";

const FILE_NAME = "products.json";

/* Đọc sản phẩm */
async function readProducts() {
  try {
    const { blobs } = await list();
    const file = blobs.find((b) => b.pathname === FILE_NAME);
    if (!file) return [];
    const res = await fetch(file.url, { cache: "no-store" });
    return await res.json();
  } catch {
    return [];
  }
}

/* Ghi sản phẩm */
async function writeProducts(products: any[]) {
  try {
    const { blobs } = await list();
    const old = blobs.find((b) => b.pathname === FILE_NAME);
    if (old) await del(FILE_NAME);

    await put(FILE_NAME, JSON.stringify(products, null, 2), {
      access: "public",
      addRandomSuffix: false,
    });
  } catch (err) {
    console.error("❌ Lỗi ghi:", err);
  }
}

/* ======================
   🚀 POST - Tăng VIEW
======================= */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Thiếu id sản phẩm" },
        { status: 400 }
      );
    }

    const list = await readProducts();
    const index = list.findIndex((p) => p.id === Number(id));

    if (index === -1)
      return NextResponse.json({ error: "Không tìm thấy sản phẩm" }, { status: 404 });

    // Nếu sản phẩm chưa có view → gán 0
    list[index].views = list[index].views ? Number(list[index].views) + 1 : 1;

    await writeProducts(list);

    return NextResponse.json({ success: true, views: list[index].views });
  } catch (err) {
    return NextResponse.json(
      { error: "Lỗi tăng lượt xem" },
      { status: 500 }
    );
  }
}
