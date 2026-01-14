import { SessionUser } from "./session";
import { Role } from "./role";

/**
 * GIAI ĐOẠN 1:
 * - Seller cố định qua ENV
 * - Không DB
 * - Không đăng ký
 */
export async function resolveRole(
  user: SessionUser | null
): Promise<Role> {
  if (!user) return "guest";

  const allowUsers =
    process.env.NEXT_PUBLIC_SELLER_PI_USERNAMES?.split(",") ?? [];

  const allowWallets =
    process.env.NEXT_PUBLIC_SELLER_PI_WALLETS?.split(",") ?? [];

  const isSellerByUsername =
    user.username &&
    allowUsers.map(u => u.trim().toLowerCase())
      .includes(user.username.toLowerCase());

  const isSellerByWallet =
    user.wallet_address &&
    allowWallets.map(w => w.trim().toUpperCase())
      .includes(user.wallet_address.toUpperCase());

  if (isSellerByUsername || isSellerByWallet) {
    return "seller";
  }

  return "customer";
}
