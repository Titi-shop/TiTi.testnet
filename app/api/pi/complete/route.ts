import { NextResponse } from "next/server";

/** ✅ API xác nhận hoàn tất thanh toán Pi Network */
export async function POST(req: Request) {
  try {
    const { paymentId, txid } = await req.json();
    if (!paymentId || !txid) {
      return NextResponse.json({ success: false, message: "Thiếu paymentId hoặc txid" }, { status: 400 });
    }

    const API_KEY = process.env.PI_API_KEY;
    const isSandbox = process.env.PI_ENV === "sandbox";
    const API_BASE = isSandbox
      ? "https://api.minepi.com/v2/sandbox/payments"
      : "https://api.minepi.com/v2/payments";
    const endpoint = `${API_BASE}/${paymentId}/complete`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify({ txid }),
    });

    const result = await res.json();
    console.log("✅ [Pi COMPLETE RESULT]:", result);

    return NextResponse.json(result, { status: res.status });
  } catch (err: any) {
    console.error("💥 [Pi COMPLETE ERROR]:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
