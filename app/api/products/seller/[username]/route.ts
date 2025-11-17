import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET(req: Request, { params }: any) {
  try {
    const seller = params.username?.toLowerCase();

    if (!seller) {
      return NextResponse.json({ error: "Missing seller" }, { status: 400 });
    }

    // Lấy danh sách product IDs từ tập products:all
    const allIds = await kv.smembers("products:all");

    if (!allIds || allIds.length === 0) {
      return NextResponse.json([]);
    }

    // Lấy chi tiết tất cả sản phẩm
    const multi = kv.multi();
    allIds.forEach((id: any) => multi.hgetall(`product:${id}`));
    const products = await multi.exec();

    // Lọc theo seller
    const list = products
      .filter((p: any) => p && p.seller?.toLowerCase() === seller)
      .map((p: any) => ({
        ...p,
        id: Number(p.id),
        price: Number(p.price),
        salePrice: p.salePrice ? Number(p.salePrice) : null,
        categoryId: p.categoryId ? Number(p.categoryId) : null,
        images: p.images ? JSON.parse(p.images) : [],
      }));

    return NextResponse.json(list, { status: 200 });
  } catch (err) {
    console.error("Seller API Error", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
