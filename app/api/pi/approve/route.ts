import { NextResponse } from "next/server";

/** ✅ API duyệt (approve) thanh toán Pi Network */
export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json();
    if (!paymentId) {
      return NextResponse.json({ success: false, message: "Thiếu paymentId" }, { status: 400 });
    }

    const API_KEY = process.env.PI_API_KEY;
    const isSandbox = process.env.PI_ENV === "sandbox";
    const API_BASE = isSandbox
      ? "https://api.minepi.com/v2/sandbox/payments"
      : "https://api.minepi.com/v2/payments";
    const endpoint = `${API_BASE}/${paymentId}/approve`;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
    });

    const result = await res.json();
    console.log("✅ [Pi APPROVE RESULT]:", result);

    return NextResponse.json(result, { status: res.status });
  } catch (err: any) {
    console.error("💥 [Pi APPROVE ERROR]:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
