import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type CancelRequest = {
  paymentId: string;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<CancelRequest>;
    const paymentId = body.paymentId?.trim();

    if (!paymentId) {
      return NextResponse.json(
        { error: "missing paymentId" },
        { status: 400 }
      );
    }

    const API_KEY = process.env.PI_API_KEY;
    const IS_TESTNET = process.env.NEXT_PUBLIC_PI_ENV === "testnet";

    if (!API_KEY) {
      return NextResponse.json(
        { error: "PI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const API_URL = IS_TESTNET
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

    console.log("✅ [Pi CANCEL RESULT]:", res.status);

    return new NextResponse(text, {
      status: res.status,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err: unknown) {
    console.error("💥 [Pi CANCEL ERROR]:", err);

    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
