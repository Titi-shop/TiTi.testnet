import { NextResponse } from "next/server";

export async function GET() {
  const API_KEY = process.env.PI_API_KEY;
  const IS_TESTNET = process.env.NEXT_PUBLIC_PI_ENV === "testnet";

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
    console.log("🔍 Đang lấy danh sách giao dịch pending từ:", BASE_URL);

    const pendingRes = await fetch(`${BASE_URL}/payments/incomplete`, {
      headers: { Authorization: `Key ${API_KEY}` },
    });

    const contentType = pendingRes.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await pendingRes.text();
      console.error("❌ [Pi API Error - Non-JSON Response]:", text);
      return NextResponse.json(
        {
          ok: false,
          error: "Pi API trả về HTML, có thể sai key hoặc domain chưa đăng ký",
          message: text.slice(0, 200),
        },
        { status: 502 }
      );
    }

    const pendingData = await pendingRes.json();

    if (!Array.isArray(pendingData) || pendingData.length === 0) {
      return NextResponse.json({
        ok: true,
        message: "✅ Không có giao dịch pending nào.",
      });
    }

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
      results.push({ id: payment.identifier, result: cancelResult });
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
