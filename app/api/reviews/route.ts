import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * ✅ API: /api/reviews
 * - Lưu và lấy danh sách đánh giá của người dùng
 * - Dùng KV để lưu trữ tạm thời (hoặc lâu dài)
 */

// -------------------------
// 🔸 Lấy danh sách review
// -------------------------
export async function GET() {
  try {
    const stored = await kv.get("reviews");
    const reviews = stored ? JSON.parse(stored as string) : [];
    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error("❌ Lỗi đọc reviews:", error);
    return NextResponse.json({ success: false, error: "Lỗi khi đọc dữ liệu" }, { status: 500 });
  }
}

// -------------------------
// 🔹 Gửi đánh giá mới
// -------------------------
export async function POST(req: Request) {
  try {
    const { orderId, rating, comment, username } = await req.json();

    if (!orderId || !rating || !username) {
      return NextResponse.json(
        { success: false, error: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }

    const stored = await kv.get("reviews");
    const reviews = stored ? JSON.parse(stored as string) : [];

    const newReview = {
      id: Date.now(),
      orderId,
      rating,
      comment,
      username,
      createdAt: new Date().toISOString(),
    };

    reviews.unshift(newReview);
    await kv.set("reviews", JSON.stringify(reviews));

    // ✅ Cập nhật trạng thái "reviewed" trong đơn hàng
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
      console.warn("⚠️ Không thể cập nhật trạng thái reviewed:", e);
    }

    return NextResponse.json({ success: true, review: newReview });
  } catch (error: any) {
    console.error("❌ Lỗi lưu review:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Không thể lưu đánh giá" },
      { status: 500 }
    );
  }
}
