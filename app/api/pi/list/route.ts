import { NextResponse } from "next/server";

/**
 * ✅ API: Xử lý log từ Pi SDK (khi có payment pending)
 */
export async function POST(req: Request) {
  try {
    const data = await req.json();
    console.log("📦 [Pending Payment Log]:", data);

    return NextResponse.json({ ok: true, message: "Đã ghi log thành công" });
  } catch (err: any) {
    console.error("❌ [API Error]:", err);
    return NextResponse.json(
      { ok: false, error: err.message },
      { status: 500 }
    );
  }
}

/**
 * ✅ API: Xử lý xoá toàn bộ pending payments khi gọi GET
 * (Dành cho developer để reset app)
 */
export async function GET() {
  const API_KEY = process.env.PI_API_KEY;
  const BASE_URL =
  process.env.NEXT_PUBLIC_PI_ENV === "testnet"
    ? "https://api.minepi.com/v2/sandbox"
    : "https://api.minepi.com/v2";

  if (!API_KEY) {
    return NextResponse.json(
      { ok: false, error: "Thiếu PI_API_KEY trong .env.local" },
      { status: 500 }
    );
  }

  try {
    console.log("🔍 Đang lấy danh sách giao dịch pending...");

    // 1️⃣ Lấy danh sách các giao dịch chưa xử lý
    const pendingRes = await fetch(`${BASE_URL}/payments/incomplete`, {
      headers: { Authorization: `Key ${API_KEY}` },
    });
    const pendingData = await pendingRes.json();

    if (!Array.isArray(pendingData) || pendingData.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "✅ Không có giao dịch pending nào.",
      });
    }

    // 2️⃣ Hủy toàn bộ giao dịch bị kẹt
    const results = [];
    for (const payment of pendingData) {
      console.log("🧹 Huỷ payment:", payment.identifier);
      const cancelRes = await fetch(
        `${BASE_URL}/payments/${payment.identifier}/cancel`,
        {
          method: "POST",
          headers: { Authorization: `Key ${API_KEY}` },
        }
      );
      const cancelResult = await cancelRes.json();
      results.push({
        id: payment.identifier,
        result: cancelResult,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "🧹 Đã huỷ toàn bộ giao dịch pending thành công.",
      count: results.length,
      results,
    });
  } catch (error: any) {
    console.error("❌ [Clear Pending Error]:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        message: "Lỗi khi xử lý pending payment",
      },
      { status: 500 }
    );
  }
}
