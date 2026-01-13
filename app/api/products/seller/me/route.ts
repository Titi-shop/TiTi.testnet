import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { cookies, headers } from "next/headers";

// ⭐ THÊM ĐÚNG 2 DÒNG NÀY
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
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

async function isSeller(uid: string): Promise<boolean> {
  const role = await kv.get<string>(`user_role:${uid}`);
  return role === "seller";
}
/* =========================
   GET — PRODUCTS CỦA SELLER HIỆN TẠI
========================= */
export async function GET() {
  // 1) Ưu tiên token trước (bền cho Pi Browser iOS)
  const piUser = await getPiUserFromToken();
  const uidFromToken = piUser?.uid;

  // 2) Nếu không có token thì fallback cookie (giữ tương thích Android / web)
  const session = uidFromToken ? null : getSession();
  const uid = uidFromToken ?? session?.uid;

  if (!uid) {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

// ⭐ THÊM KHỐI NÀY NGAY SAU
if (!(await isSeller(uid))) {
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

  // 3) Lấy danh sách product ID theo seller uid
  const ids = await kv.lrange<string>(`products:seller:${uid}`, 0, -1);
  if (!ids.length) return NextResponse.json([]);

  // 4) Lấy từng product
  const products = await Promise.all(
    ids.map((id) => kv.get<Product>(`product:${id}`))
  );

  // 5) Ép ownership lần cuối
  const safe = products.filter(
    (p): p is Product => !!p && p.sellerId === uid
  );

  return NextResponse.json(safe);
}
