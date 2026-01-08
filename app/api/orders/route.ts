import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { kv } from "@vercel/kv";

/* =========================================================
   CONFIG
========================================================= */
const COOKIE_NAME = "pi_user";

const isTestnet =
  process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
  process.env.PI_API_URL?.includes("/sandbox");

/* =========================================================
   AUTH HELPER – LẤY USER ĐANG ĐĂNG NHẬP
========================================================= */
function getCurrentUser() {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(
      Buffer.from(raw, "base64").toString("utf8")
    );
  } catch {
    return null;
  }
}

/* =========================================================
   GET – LẤY ĐƠN HÀNG CỦA USER ĐANG ĐĂNG NHẬP
========================================================= */
export async function GET() {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    // 👉 Lấy danh sách orderId của user
    const orderIds =
      (await kv.lrange<string>(`orders:user:${user.uid}`, 0, -1)) || [];

    if (orderIds.length === 0) {
      return NextResponse.json([]);
    }

    // 👉 Lấy chi tiết từng đơn
    const orders = await Promise.all(
      orderIds.map((id) => kv.get(`order:${id}`))
    );

    // Lọc null (phòng lỗi)
    return NextResponse.json(orders.filter(Boolean));
  } catch (err) {
    console.error("❌ GET /api/orders error:", err);
    return NextResponse.json([], { status: 500 });
  }
}

/* =========================================================
   POST – TẠO ĐƠN HÀNG MỚI (THEO USER ĐANG LOGIN)
========================================================= */
export async function POST(req: Request) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();

    if (!body.items || !Array.isArray(body.items)) {
      return NextResponse.json(
        { success: false, message: "Thiếu sản phẩm" },
        { status: 400 }
      );
    }

    const orderId = `ORD-${Date.now()}`;

    const order = {
      id: orderId,
      buyerId: user.uid,
      buyerUsername: user.username,

      items: body.items,
      total: Number(body.total || 0),
      status: "Chờ xác nhận",

      note: body.note ?? "",
      shipping: body.shipping ?? {},

      paymentId: body.paymentId ?? "",
      txid: body.txid ?? "",

      env: isTestnet ? "testnet" : "mainnet",

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 👉 LƯU CHI TIẾT ĐƠN
    await kv.set(`order:${orderId}`, order);

    // 👉 GẮN ĐƠN VÀO USER
    await kv.lpush(`orders:user:${user.uid}`, orderId);

    console.log("🧾 ORDER CREATED:", order);

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("❌ POST /api/orders error:", err);
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT – CẬP NHẬT TRẠNG THÁI ĐƠN (ADMIN / SELLER)
========================================================= */
export async function PUT(req: Request) {
  try {
    const user = getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "unauthorized" },
        { status: 401 }
      );
    }

    const { id, status, txid } = await req.json();
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Thiếu ID đơn hàng" },
        { status: 400 }
      );
    }

    const order: any = await kv.get(`order:${id}`);
    if (!order) {
      return NextResponse.json(
        { success: false, message: "Không tìm thấy đơn" },
        { status: 404 }
      );
    }

    // 👉 CHỈ CHO PHÉP:
    // - buyer (xem / huỷ)
    // - seller / admin (update trạng thái)
    const isOwner = order.buyerId === user.uid;
    const isStaff = user.roles?.includes("seller") || user.roles?.includes("admin");

    if (!isOwner && !isStaff) {
      return NextResponse.json(
        { success: false, error: "forbidden" },
        { status: 403 }
      );
    }

    const updated = {
      ...order,
      status: status || order.status,
      txid: txid || order.txid,
      updatedAt: new Date().toISOString(),
    };

    if (status === "Đã thanh toán") {
      updated.paidAt = new Date().toISOString();
    }

    await kv.set(`order:${id}`, updated);

    console.log("🔄 ORDER UPDATED:", updated);

    return NextResponse.json({ success: true, order: updated });
  } catch (err) {
    console.error("❌ PUT /api/orders error:", err);
    return NextResponse.json(
      { success: false, error: "server_error" },
      { status: 500 }
    );
  }
}
