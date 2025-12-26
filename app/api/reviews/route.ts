import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * ✅ API: /api/reviews
 * - Lưu và lấy danh sách đánh giá
 * - Khắc phục lỗi "[object Object]" & 500 Internal Server Error
 */

type Review = Record<string, unknown>;
type Order = Record<string, unknown>;

// 🟢 Lấy danh sách review
export async function GET() {
  try {
    const stored = await kv.get("reviews");

    let reviews: Review[] = [];
    if (stored) {
      if (typeof stored === "string") {
        reviews = JSON.parse(stored) as Review[];
      } else if (Array.isArray(stored)) {
        reviews = stored as Review[];
      } else if (typeof stored === "object") {
        reviews = Object.values(stored as Record<string, Review>);
      }
    }

    return NextResponse.json({ success: true, reviews });
  } catch (error: unknown) {
    console.error("❌ Lỗi đọc reviews:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi đọc dữ liệu" },
      { status: 500 }
    );
  }
}

// 🟢 Gửi đánh giá mới
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const orderId = body.orderId;
    const rating = body.rating;
    const comment = body.comment;
    const username = body.username;

    if (!orderId || !rating || !username) {
      return NextResponse.json(
        { success: false, error: "Thiếu orderId, rating hoặc username" },
        { status: 400 }
      );
    }

    let reviews: Review[] = [];
    const stored = await kv.get("reviews");

    if (stored) {
      if (typeof stored === "string") {
        reviews = JSON.parse(stored) as Review[];
      } else if (Array.isArray(stored)) {
        reviews = stored as Review[];
      }
    }

    const newReview: Review = {
      id: Date.now(),
      orderId,
      rating,
      comment: (comment as string) || "",
      username,
      createdAt: new Date().toISOString(),
    };

    reviews.unshift(newReview);
    await kv.set("reviews", JSON.stringify(reviews));

    // ✅ Cập nhật trạng thái reviewed trong orders
    try {
      const ordersRaw = await kv.get("orders");
      let orders: Order[] = [];

      if (ordersRaw) {
        if (typeof ordersRaw === "string") {
          orders = JSON.parse(ordersRaw) as Order[];
        } else if (Array.isArray(ordersRaw)) {
          orders = ordersRaw as Order[];
        }
      }

      const index = orders.findIndex(
        (o) => String(o.id) === String(orderId)
      );

      if (index !== -1) {
        orders[index] = {
          ...orders[index],
          reviewed: true,
          updatedAt: new Date().toISOString(),
        };
        await kv.set("orders", JSON.stringify(orders));
      }
    } catch (err) {
      console.warn("⚠️ Không thể cập nhật reviewed trong orders:", err);
    }

    return NextResponse.json({ success: true, review: newReview });
  } catch (error: unknown) {
    console.error("❌ Lỗi lưu review:", error);
    return NextResponse.json(
      { success: false, error: "Không thể lưu đánh giá" },
      { status: 500 }
    );
  }
}
