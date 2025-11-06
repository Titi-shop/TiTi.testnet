import { NextResponse } from "next/server";

/**
 * ✅ API: Xóa toàn bộ giao dịch "pending" trên Pi Network (dành cho developer)
 * - Tự chọn môi trường (sandbox hoặc mainnet)
 * - Kiểm tra lỗi domain, key, hoặc môi trường sai
 */

export async function GET() {
  const API_KEY = process.env.PI_API_KEY;
  const ENV = process.env.NEXT_PUBLIC_PI_ENV?.trim();
  const IS_TESTNET = ENV === "testnet";

  // 🔧 Chọn đúng API endpoint theo môi trường
  const BASE_URL = IS_TESTNET
    ? "https://api.minepi.com/v2/sandbox"
    : "https://api.minepi.com/v2";

  if (!API_KEY) {
    return NextResponse.json(
      { ok: false, error: "❌ Thiếu PI_API_KEY trong .env.local" },
      { status: 500 }
    );
  }

  try {
    console.log(`🔍 [Pi LIST] Đang lấy danh sách pending từ: ${BASE_URL}`);

    // 1️⃣ Gọi danh sách payment chưa xử lý
    const pendingRes = await fetch(`${BASE_URL}/payments/incomplete`, {
      headers: { Authorization: `Key ${API_KEY}` },
    });

    // 2️⃣ Nếu trả về không phải JSON → lỗi domain hoặc môi trường
    const contentType = pendingRes.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await pendingRes.text();
      console.error("❌ [Pi API Error - Non-JSON Response]:", text);
      return NextResponse.json(
        {
          ok: false,
          error:
            "Pi API trả về HTML → Sai môi trường (sandbox/mainnet) hoặc domain chưa đăng ký trong Pi Developer Portal.",
          message: text.slice(0, 250),
        },
        { status: 502 }
      );
    }

    // 3️⃣ Phân tích kết quả JSON
    const pendingData = await pendingRes.json();

    if (!Array.isArray(pendingData) || pendingData.length === 0) {
      console.log("✅ Không có giao dịch pending.");
      return NextResponse.json({
        ok: true,
        message: "✅ Không có giao dịch pending nào.",
      });
    }

    // 4️⃣ Hủy từng giao dịch pending
    const results = [];
    for (const payment of pendingData) {
      const pid = payment.identifier;
      console.log("🧹 Đang huỷ payment:", pid);

      const cancelRes = await fetch(`${BASE_URL}/payments/${pid}/cancel`, {
        method: "POST",
        headers: { Authorization: `Key ${API_KEY}` },
      });

      const cancelType = cancelRes.headers.get("content-type") || "";
      const cancelResult = cancelType.includes("application/json")
        ? await cancelRes.json()
        : await cancelRes.text();

      results.push({
        id: pid,
        status: cancelRes.status,
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
    console.error("💥 [Clear Pending Error]:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
        message: "Lỗi khi xử lý pending payment.",
      },
      { status: 500 }
    );
  }
}
