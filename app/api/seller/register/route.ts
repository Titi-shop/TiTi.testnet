import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { kv } from "@vercel/kv";

const COOKIE_NAME = "pi_user";

/* =========================
   SESSION HELPER (SAFE)
========================= */
function getSession():
  | { uid: string; username?: string }
  | null {
  try {
    const raw = cookies().get(COOKIE_NAME)?.value;
    if (!raw) return null;

    const parsed = JSON.parse(
      Buffer.from(raw, "base64").toString("utf8")
    );

    if (!parsed?.uid) return null;

    return parsed;
  } catch {
    return null;
  }
}

/* =========================
   POST /api/seller/register
========================= */
export async function POST(req: Request) {
  const session = getSession();

  if (!session) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    );
  }

  // ❌ Nếu đã là seller → không đăng ký lại
  const role = await kv.get<string>(
    `user_role:${session.uid}`
  );

  if (role === "seller") {
    return NextResponse.json(
      { error: "already_seller" },
      { status: 400 }
    );
  }

  // 🧾 Body (optional)
  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const request = {
    uid: session.uid,
    username: session.username ?? "",
    shopName: body.shopName ?? "",
    note: body.note ?? "",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  // 🔑 Lưu yêu cầu duyệt
  await kv.set(
    `seller_request:${session.uid}`,
    request
  );

  return NextResponse.json({
    success: true,
    status: "pending",
  });
}
