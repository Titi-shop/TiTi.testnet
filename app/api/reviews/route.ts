import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * ✅ API: /api/reviews
 * - Lưu và đọc danh sách đánh giá
 * - Sửa lỗi "[object Object]" do JSON không hợp lệ
 */

// 🟢 Lấy tất cả đánh giá
export async function GET() {
  try {
    const stored = await kv.get("reviews");
    const reviews = stored ? JSON.parse(stored as string) : [];
    return NextResponse.json({ success: true, reviews });
  } catch (error: any) {
    console.error("❌ Lỗi đọc reviews:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi đọc dữ liệu" },
      { status: 500 }
    );
  }
}

// 🟢 Gửi đánh giá mới
export async function POST(req: Request) {
  try {
    const bodyText = await req.text();

    // 🔍 Đảm bảo dữ liệu hợp lệ JSON
    let data;
    try {
      data = JSON.parse(bodyText);
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Dữ liệu gửi lên không phải JSON hợp lệ." },
        { status: 400 }
      );
    }

    const { orderId, rating, comment, username } = data;

    if (!orderId || !rating || !username) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin bắt buộc (orderId, rating, username)" },
        { status: 400 }
      );
    }

    // ✅ Lấy danh sách đánh giá cũ
    const stored = await kv.get("reviews");
    const reviews = stored ? JSON.parse(stored as string) : [];

    const newReview = {
      id: Date.now(),
      orderId,
      rating,
      comment: comment || "",
      username,
      createdAt: new Date().toISOString(),
    };

    // ✅ Lưu review mới
    reviews.unshift(newReview);
    await kv.set("reviews", JSON.stringify(reviews));

    // ✅ Cập nhật trạng thái reviewed trong orders
    try {
      const allOrders = (await kv.get("orders")) || "[]";
      const orders = JSON.parse(allOrders as string);
      const idx = orders.findIndex((o: any) => o.id === orderId);
      if (idx !== -1) {
        orders[idx].reviewed = true;
        orders[idx].updatedAt = new Date().toISOString();
        await kv.set("orders", JSON.stringify(orders));
      }
    } catch (e) {
      console.warn("⚠️ Không thể cập nhật reviewed trong orders:", e);
    }

    return new NextResponse(JSON.stringify({ success: true, review: newReview }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Lỗi lưu review:", error);
    return new NextResponse(
      JSON.stringify({ success: false, error: error.message || "Không thể lưu đánh giá" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
