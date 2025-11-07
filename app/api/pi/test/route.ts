import { NextResponse } from "next/server";

/**
 * ✅ API test đồng bộ với bản PHP
 * - Không dùng /sandbox
 * - Thêm "X-Pi-Api-Version": "2.0"
 * - Dùng chung cách gọi với approve / complete
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "✅ Pi Test API is active (v2)",
    example: {
      approve: { action: "approve", paymentId: "123" },
      complete: { action: "complete", paymentId: "123", txid: "abc123" },
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, paymentId, txid } = body;

    if (!action || !paymentId)
      return NextResponse.json(
        { ok: false, error: "Thiếu action hoặc paymentId" },
        { status: 400 }
      );

    const API_KEY = process.env.PI_API_KEY;
    const API_URL = "https://api.minepi.com/v2/payments";

    if (!API_KEY)
      return NextResponse.json(
        { ok: false, error: "Thiếu PI_API_KEY trong môi trường" },
        { status: 500 }
      );

    console.log(`🔔 [TEST API] ${action.toUpperCase()} paymentId=${paymentId}`);

    let endpoint = "";
    if (action === "approve") endpoint = `${API_URL}/${paymentId}/approve`;
    else if (action === "complete") endpoint = `${API_URL}/${paymentId}/complete`;
    else
      return NextResponse.json(
        { ok: false, error: "Action không hợp lệ" },
        { status: 400 }
      );

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${API_KEY}`,
        "X-Pi-Api-Version": "2.0",
      },
      body: action === "complete" ? JSON.stringify({ txid }) : undefined,
    });

    const text = await res.text();

    if (text.startsWith("<!DOCTYPE")) {
      return NextResponse.json(
        {
          ok: false,
          error: "⚠️ Pi API trả về HTML — domain chưa duyệt hoặc sai endpoint.",
          message: text.slice(0, 200),
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: `✅ Pi ${action} processed.`,
      result: text,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "unknown" },
      { status: 500 }
    );
  }
}
