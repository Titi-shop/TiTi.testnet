import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * ✅ API /api/reviews
 * - Lưu và lấy đánh giá
 * - ĐÃ SỬA LỖI "[object Object] is not valid JSON"
 */

// 🟢 Lấy danh sách review
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

// 🟢 Lưu review mới
export async function POST(req: Request) {
  try {
    // ✅ Đọc JSON đúng chuẩn từ body
    const { orderId, rating, comment, username } = await req.json();

    // Kiểm tra đầu vào
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

    // ✅ Cập nhật trạng thái reviewed trong orders (nếu có)
    try {
      const allOrders = (await kv.get("orders")) || "[]";
      const orders = JSON.parse(allOrders as string);
      const idx = orders.findIndex((o: any) => String(o.id) === String(orderId));
      if (idx !== -1) {
        orders[idx].reviewed = true;
        orders[idx].updatedAt = new Date().toISOString();
        await kv.set("orders", JSON.stringify(orders));
      }
    } catch (e) {
      console.warn("⚠️ Không thể cập nhật trạng thái reviewed trong orders:", e);
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
