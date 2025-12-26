import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "✅ Pi Test API is active",
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
    const API_URL =
      process.env.NEXT_PUBLIC_PI_ENV === "testnet"
        ? "https://api.minepi.com/v2/sandbox"
        : "https://api.minepi.com/v2";

    if (!API_KEY)
      return NextResponse.json(
        { ok: false, error: "Thiếu PI_API_KEY trong môi trường" },
        { status: 500 }
      );

    console.log(`🔔 [TEST API] ${action.toUpperCase()} paymentId=${paymentId}`);

    let endpoint = "";
    if (action === "approve") endpoint = `${API_URL}/payments/${paymentId}/approve`;
    else if (action === "complete")
      endpoint = `${API_URL}/payments/${paymentId}/complete`;
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
      },
      body: action === "complete" ? JSON.stringify({ txid }) : undefined,
    });

    const text = await res.text();

    const isHTML = text.startsWith("<!DOCTYPE");
    if (isHTML)
      return NextResponse.json(
        {
          ok: false,
          error:
            "Pi API trả về HTML — domain chưa đăng ký hoặc sai môi trường.",
          message: text.slice(0, 200),
        },
        { status: 502 }
      );

    return NextResponse.json({
      ok: true,
      message: `✅ Pi ${action} processed.`,
      result: text,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "unknown error";

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
