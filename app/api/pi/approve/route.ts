import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { paymentId } = await req.json();

    if (!paymentId) {
      return NextResponse.json({ error: "missing paymentId" }, { status: 400 });
    }

    const API_KEY = process.env.PI_API_KEY;
    const API_URL = process.env.PI_API_URL || "https://api.minepi.com/v2/payments";

    if (!API_KEY) {
      console.error("❌ Missing PI_API_KEY in environment variables");
      return NextResponse.json({ error: "Missing PI_API_KEY" }, { status: 500 });
    }

    console.log("⏳ [Pi APPROVE] Giao dịch:", paymentId);

    const res = await fetch(`${API_URL}/${paymentId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
    });

    const data = await res.json().catch(() => ({}));
    console.log("✅ [Pi APPROVE RESULT]:", res.status, data);

    if (!res.ok) {
      return NextResponse.json({ success: false, data }, { status: res.status });
    }

    return NextResponse.json({ success: true, paymentId, data });
  } catch (err: any) {
    console.error("💥 [Pi APPROVE ERROR]:", err);
    return NextResponse.json({ error: err.message || "unknown" }, { status: 500 });
  }
}
