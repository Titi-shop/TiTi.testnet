import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      paymentId?: string;
      txid?: string;
    };

    const { paymentId, txid } = body;

    if (!paymentId) {
      return NextResponse.json({ error: "missing paymentId" }, { status: 400 });
    }

    const API_KEY = process.env.PI_API_KEY;
    const API_URL =
      process.env.PI_API_URL ||
      "https://api.minepi.com/v2/sandbox/payments";

    console.log("⏳ [Pi COMPLETE] ID:", paymentId, txid);

    const res = await fetch(`${API_URL}/${paymentId}/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
      body: JSON.stringify({ txid }),
    });

    const text = await res.text();
    console.log("✅ [Pi COMPLETE RESULT]:", res.status, text);

    return new NextResponse(text, {
      status: res.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: unknown) {
    console.error("💥 [Pi COMPLETE ERROR]:", err);

    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
