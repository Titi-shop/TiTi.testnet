import { NextResponse } from "next/server";

export async function GET() {
  const API_KEY = process.env.PI_API_KEY!;
  const PAYMENT_ID = "⚠️_THAY_BẰNG_PAYMENT_ID_BỊ_KẸT_⚠️";

  try {
    const approve = await fetch(`https://api.minepi.com/v2/payments/${PAYMENT_ID}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
    });
    const complete = await fetch(`https://api.minepi.com/v2/payments/${PAYMENT_ID}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify({ txid: "dummy" }),
    });

    return NextResponse.json({
      message: "✅ Payment reset done!",
      approveStatus: approve.status,
      completeStatus: complete.status,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
