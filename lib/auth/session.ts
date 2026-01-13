import { cookies } from "next/headers";

export type SessionUser = {
  uid: string;
  username?: string;
  wallet_address?: string;
};

const COOKIE_NAME = "pi_user";

export function getSessionUser(): SessionUser | null {
  const raw = cookies().get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}
