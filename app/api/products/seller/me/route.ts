import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { cookies, headers } from "next/headers";

const COOKIE_NAME = "pi_user";

/* =========================
   TYPES
========================= */
type Session = {
  uid: string;
};

type PiUser = {
  uid: string;
  username?: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  images: string[];
  sellerId: string;
  createdAt: string;
  updatedAt?: string;
};

/* =========================
   SESSION HELPER
========================= */
function getSession(): Session | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
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

async function getPiUserFromToken(): Promise<PiUser | null> {
  const auth = headers().get("authorization");

  // 1) Không có header -> không có token
  if (!auth || !auth.startsWith("Bearer ")) return null;

  // 2) Cắt token ra
  const token = auth.slice("Bearer ".length).trim();
  if (!token) return null;

  // 3) Verify token với Pi Network
  const piRes = await fetch("https://api.minepi.com/v2/me", {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    // tránh cache
    cache: "no-store",
  });

  if (!piRes.ok) return null;

  const data = await piRes.json();

  // 4) đảm bảo có uid
  if (!data?.uid || typeof data.uid !== "string") return null;

  return { uid: data.uid, username: data.username };
}
/* =========================
   GET — PRODUCTS CỦA SELLER HIỆN TẠI
========================= */
export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 🔐 Lấy danh sách product ID của seller hiện tại
  const ids = await kv.lrange<string>(
    `products:seller:${session.uid}`,
    0,
    -1
  );

  if (!ids.length) return NextResponse.json([]);

  const products = await Promise.all(
    ids.map(id => kv.get<Product>(`product:${id}`))
  );

  // 🔐 Ép ownership lần cuối
  const safe = products.filter(
    (p): p is Product => !!p && p.sellerId === session.uid
  );

  return NextResponse.json(safe);
}
