// app/api/pi/verify/route.ts
import { NextResponse } from "next/server";

/**
 * ✅ API xác minh Access Token của Pi Network
 * - Nhận accessToken từ client (AuthContext hoặc PiLoginPage)
 * - Gọi Pi API /v2/me hoặc /v2/sandbox/me để xác minh
 * - Trả về thông tin người dùng đã xác thực
 */
export async function POST(req: Request) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json(
        { success: false, message: "Thiếu hoặc sai accessToken" },
        { status: 400 }
      );
    }

    // ✅ Tự động xác định môi trường (Mainnet hoặc Testnet)
    const isSandbox =
      process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
      process.env.PI_API_URL?.includes("/sandbox");

    const API_URL = isSandbox
      ? "https://api.minepi.com/v2/sandbox/me"
      : "https://api.minepi.com/v2/me";

    console.log(
      `🔍 [Pi VERIFY] Kiểm tra token qua ${isSandbox ? "SANDBOX" : "MAINNET"}`
    );

    // 🔹 Gọi Pi API để xác minh token
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // ⚠️ Token không hợp lệ hoặc hết hạn
    if (!response.ok) {
      const errorText = await response.text();
      console.warn("❌ [Pi VERIFY FAILED]:", errorText);
      return NextResponse.json(
        { success: false, message: "Token không hợp lệ hoặc đã hết hạn" },
        { status: 401 }
      );
    }

    // ✅ Trả về thông tin người dùng từ Pi Network
    const userData = await response.json();

    const verifiedUser = {
      username: userData?.username || "unknown",
      uid: userData?.uid || null,
      roles: userData?.roles || [],
      wallet_address: userData?.wallet_address || null,
      created_at: userData?.created_at || new Date().toISOString(),
    };

    console.log("✅ [Pi VERIFY SUCCESS]:", verifiedUser.username);

    // 👉 Có thể tạo session ở đây (JWT / cookie HTTPOnly)
    // Ví dụ:
    // const token = jwt.sign({ username: verifiedUser.username }, process.env.JWT_SECRET!, { expiresIn: "1h" });
    // const res = NextResponse.json({ success: true, user: verifiedUser });
    // res.cookies.set("session", token, { httpOnly: true, secure: true, sameSite: "strict" });
    // return res;

    return NextResponse.json({
      success: true,
      user: verifiedUser,
    });
  } catch (error: any) {
    console.error("💥 [Pi VERIFY EXCEPTION]:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Lỗi hệ thống khi xác minh Pi Network",
      },
      { status: 500 }
    );
  }
}
