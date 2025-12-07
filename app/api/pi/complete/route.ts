// app/api/pi/complete/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { paymentId, txid } = await req.json();

    if (!paymentId || !txid) {
      return NextResponse.json(
        { error: "missing paymentId or txid" },
        { status: 400 }
      );
    }

    const API_KEY = process.env.PI_API_KEY!;
    const API_URL = process.env.PI_API_URL!;

    console.log("⏳ [TESTNET COMPLETE]:", paymentId, txid);

    const res = await fetch(`${API_URL}/${paymentId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify({ txid }),
    });

    const text = await res.text();

    console.log("✅ COMPLETE RESULT:", res.status, text);

    return new NextResponse(text, { status: res.status });
  } catch (err: any) {
    console.error("💥 COMPLETE ERROR:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
