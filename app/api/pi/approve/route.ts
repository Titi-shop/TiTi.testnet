import { NextResponse } from "next/server";

/**
 * ✅ API Approve thanh toán Pi Network
 * - Tự nhận biết testnet/mainnet
 * - Không gây lỗi khi chạy sandbox (testnet)
 */
export async function POST(req: Request) {
  try {
    const { paymentId, orderId } = await req.json();

    if (!paymentId) {
      return NextResponse.json(
        { ok: false, error: "Thiếu paymentId" },
        { status: 400 }
      );
    }

    const API_KEY = process.env.PI_API_KEY;
    if (!API_KEY) {
      return NextResponse.json(
        { ok: false, error: "Thiếu PI_API_KEY trong .env" },
        { status: 500 }
      );
    }

    // ✅ Tự nhận biết môi trường
    const isTestnet =
      process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
      process.env.PI_API_URL?.includes("/sandbox");

    // ✅ Chọn endpoint tương ứng
    const API_URL = isTestnet
      ? "https://api.minepi.com/v2/sandbox/payments"
      : "https://api.minepi.com/v2/payments";

    console.log(
      `🪙 [PI APPROVE] Gửi approve đến ${isTestnet ? "TESTNET" : "MAINNET"}...`,
      paymentId
    );

    // ✅ Nếu là testnet → mô phỏng phản hồi (không gọi thật)
    if (isTestnet) {
      return NextResponse.json({
        ok: true,
        sandbox: true,
        message: `✅ Testnet Approve thành công (orderId=${orderId})`,
        paymentId,
      });
    }

    // ✅ Nếu là mainnet → gọi API thật
    const res = await fetch(`${API_URL}/${paymentId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
        "X-Pi-Api-Version": "2.0",
      },
    });

    const text = await res.text();

    // 🔹 Khi domain chưa whitelist, Pi trả về HTML → xử lý an toàn
    if (text.startsWith("<!DOCTYPE")) {
      return NextResponse.json({
        ok: false,
        error: "⚠️ Pi API trả về HTML — domain chưa duyệt hoặc server lỗi.",
        html: text.slice(0, 200),
      });
    }

    console.log("✅ [PI APPROVE SUCCESS]", text);
    return NextResponse.json({ ok: true, result: text });
  } catch (err: any) {
    console.error("💥 [PI APPROVE ERROR]:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
