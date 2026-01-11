import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

const COOKIE_NAME = "pi_user";

/* =========================
   TYPES
========================= */
type Session = {
  uid: string;
};

type OrderItem = {
  productId: string;
  quantity: number;
  price?: number;
};

type Order = {
  id: string;
  buyerId: string;
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

/* =========================
   SESSION HELPER
========================= */
function getSession(req: Request): Session | null {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return null;

  const raw = cookieHeader
    .split(";")
    .map(c => c.trim())
    .find(c => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(raw, "base64").toString("utf8")
    ) as unknown;

    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "uid" in parsed &&
      typeof (parsed as { uid: unknown }).uid === "string"
    ) {
      return { uid: (parsed as { uid: string }).uid };
    }
    return null;
  } catch {
    return null;
  }
}

/* =========================
   GET — CHI TIẾT ORDER
========================= */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const order = await kv.get<Order>(`order:${id}`);

  if (!order) {
    return NextResponse.json(
      { error: "Không tìm thấy đơn hàng" },
      { status: 404 }
    );
  }

  // 🔐 CHỈ BUYER ĐƯỢC XEM
  if (order.buyerId !== session.uid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json(order);
}

/* =========================
   PATCH — CẬP NHẬT TRẠNG THÁI
========================= */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession(req);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as unknown;

    if (
      typeof body !== "object" ||
      body === null ||
      !("status" in body) ||
      typeof (body as { status: unknown }).status !== "string"
    ) {
      return NextResponse.json(
        { error: "invalid_status" },
        { status: 400 }
      );
    }

    const { id } = params;
    const order = await kv.get<Order>(`order:${id}`);

    if (!order) {
      return NextResponse.json(
        { error: "Không tìm thấy đơn hàng" },
        { status: 404 }
      );
    }

    // 🔐 QUYỀN: chỉ buyer (hoặc sau này seller/admin)
    if (order.buyerId !== session.uid) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const updated: Order = {
      ...order,
      status: (body as { status: string }).status,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`order:${id}`, updated);

    return NextResponse.json({ success: true, order: updated });
  } catch (err: unknown) {
    console.error("❌ Lỗi API PATCH:", err);
    return NextResponse.json(
      { error: "server_error" },
      { status: 500 }
    );
  }
}
