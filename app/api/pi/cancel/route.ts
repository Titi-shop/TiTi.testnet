import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json();
    if (!paymentId) {
      return NextResponse.json({ error: "missing paymentId" }, { status: 400 });
    }

    const API_KEY = process.env.PI_API_KEY;
    const API_URL = process.env.PI_API_URL || "https://api.minepi.com/v2/payments";

    const res = await fetch(`${API_URL}/${paymentId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Key ${API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    console.log("🗑️ [PI CANCEL RESULT]:", data);

    return NextResponse.json({ success: true, message: "Đã huỷ giao dịch pending" });
  } catch (err: any) {
    console.error("💥 [PI CANCEL ERROR]:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
