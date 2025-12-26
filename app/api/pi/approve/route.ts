import { NextResponse } from "next/server";

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
      process.env.PI_API_URL ||
      "https://api.minepi.com/v2/sandbox/payments";

    if (!API_KEY) {
      console.error("❌ Missing PI_API_KEY in environment variables");
      return NextResponse.json(
        { error: "Missing PI_API_KEY" },
        { status: 500 }
      );
    }

    console.log("⏳ [Pi APPROVE] Giao dịch:", paymentId);

    const res = await fetch(`${API_URL}/${paymentId}/approve`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
      },
    });

    const text = await res.text();
    console.log("✅ [Pi APPROVE RESULT]:", res.status, text);

    if (res.status === 401) {
      console.error("❌ Sai API key hoặc app chưa đăng ký domain!");
    }

    return new NextResponse(text, {
      status: res.status,
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: unknown) {
    console.error("💥 [Pi APPROVE ERROR]:", err);

    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
