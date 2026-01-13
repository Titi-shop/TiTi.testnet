import { SessionUser } from "./session";
import { Role } from "./role";
import { isSellerByEnv } from "../utils/roles";

export async function resolveRole(
  user: SessionUser | null
): Promise<Role> {
  if (!user) return "guest";

  // sau này có admin thì thêm tại đây
  if (isSellerByEnv(user)) return "seller";

  return "customer";
}
