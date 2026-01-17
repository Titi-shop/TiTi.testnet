import { cookies } from "next/headers";

export async function getRequestUser(req?: Request) {
  const auth = req?.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    const token = auth.replace("Bearer ", "");
    const res = await fetch("https://api.minepi.com/v2/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) return res.json();
  }

  const cookie = cookies().get("pi_user")?.value;
  if (!cookie) return null;

  return JSON.parse(cookie);
}
