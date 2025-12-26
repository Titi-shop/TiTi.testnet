import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // 🔥 tránh cache

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      paymentId?: string;
    };

    const { paymentId } = body;

    if (!paymentId) {
      return NextResponse.json({ error: "missing paymentId" }, { status: 400 });
    }

    const API_KEY = process.env.PI_API_KEY;
    const API_URL =
      process.env.NEXT_PUBLIC_PI_ENV === "testnet"
        ? "https://api.minepi.com/v2/sandbox/payments"
        : "https://api.minepi.com/v2/payments";

    console.log("🛑 [Pi CANCEL] Hủy giao dịch:", paymentId);

    const res = await fetch(`${API_URL}/${paymentId}/cancel`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
    });

    const text = await res.text();
    console.log("✅ [Pi CANCEL RESULT]:", res.status, text);

    return new NextResponse(text, {
      status: res.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: unknown) {
    console.error("💥 [Pi CANCEL ERROR]:", err);

    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
