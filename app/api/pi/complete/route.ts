import { NextResponse } from "next/server";

/**
 * ✅ API Complete thanh toán Pi Network
 * - Tự nhận biết testnet/mainnet
 * - Không crash nếu testnet chưa duyệt domain
 */
export async function POST(req: Request) {
  try {
    const { paymentId, txid } = await req.json();

    if (!paymentId || !txid) {
      return NextResponse.json(
        { ok: false, error: "Thiếu paymentId hoặc txid" },
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

    // ✅ Endpoint phù hợp
    const API_URL = isTestnet
      ? "https://api.minepi.com/v2/sandbox/payments"
      : "https://api.minepi.com/v2/payments";

    console.log(
      `🏁 [PI COMPLETE] Gửi complete đến ${isTestnet ? "TESTNET" : "MAINNET"}...`,
      paymentId
    );

    // ✅ Nếu là testnet → mô phỏng phản hồi thành công
    if (isTestnet) {
      return NextResponse.json({
        ok: true,
        sandbox: true,
        message: "✅ Testnet Complete thành công",
        paymentId,
        txid,
      });
    }

    // ✅ Nếu là mainnet → gọi thật
    const res = await fetch(`${API_URL}/${paymentId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
        "X-Pi-Api-Version": "2.0",
      },
      body: JSON.stringify({ txid }),
    });

    const text = await res.text();

    if (text.startsWith("<!DOCTYPE")) {
      return NextResponse.json({
        ok: false,
        error: "⚠️ Pi API trả về HTML — domain chưa duyệt hoặc server lỗi.",
        html: text.slice(0, 200),
      });
    }

    console.log("✅ [PI COMPLETE SUCCESS]", text);
    return NextResponse.json({ ok: true, result: text });
  } catch (err: any) {
    console.error("💥 [PI COMPLETE ERROR]:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
