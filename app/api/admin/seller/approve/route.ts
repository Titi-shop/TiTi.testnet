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

  const myRole = await kv.get(`user_role:${session.uid}`);
  if (myRole !== "admin") {
    return NextResponse.json(
      { error: "forbidden" },
      { status: 403 }
    );
  }

  const { uid, approve } = await req.json();

  if (!uid) {
    return NextResponse.json(
      { error: "missing_uid" },
      { status: 400 }
    );
  }

  if (approve === true) {
    await kv.set(`user_role:${uid}`, "seller");
    await kv.del(`seller_request:${uid}`);
  } else {
    await kv.set(
      `seller_request:${uid}:rejected`,
      { rejectedAt: new Date().toISOString() }
    );
  }

  return NextResponse.json({ success: true });
}
