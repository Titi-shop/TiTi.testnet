import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { kv } from "@vercel/kv";

const COOKIE_NAME = "pi_user";

function getSession() {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;

  return JSON.parse(
    Buffer.from(raw, "base64").toString("utf8")
  );
}

export async function POST(req: Request) {
  const session = getSession();
  if (!session?.uid) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    );
  }

  // ❌ Nếu đã là seller thì không đăng ký lại
  const role = await kv.get(`user_role:${session.uid}`);
  if (role === "seller") {
    return NextResponse.json(
      { error: "already_seller" },
      { status: 400 }
    );
  }

  const body = await req.json();

  const request = {
    uid: session.uid,
    username: session.username,
    shopName: body?.shopName ?? "",
    note: body?.note ?? "",
    status: "pending",
    createdAt: new Date().toISOString(),
  };

  await kv.set(
    `seller_request:${session.uid}`,
    request
  );

  return NextResponse.json({
    success: true,
    status: "pending",
  });
}
