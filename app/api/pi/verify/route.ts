import { NextResponse } from "next/server";

/**
 * ✅ API xác minh Access Token của Pi Network (Testnet/Sandbox)
 * - Nhận accessToken từ frontend (LoginWithPi)
 * - Gọi đúng endpoint tương ứng sandbox/mainnet để lấy thông tin người dùng thật
 */

export async function POST(req: Request) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: "Thiếu accessToken" },
        { status: 400 }
      );
    }

    // ✅ Dùng đúng API URL theo môi trường
    const API_URL =
      process.env.PI_API_URL?.replace("/payments", "/me") ||
      "https://api.minepi.com/v2/payments";

    console.log("🔍 [Pi VERIFY] Đang xác minh token tại:", API_URL);

    // 🔹 Gọi Pi API để xác minh accessToken
    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // 🔹 Nếu lỗi hoặc token không hợp lệ
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Pi Verify API error:", errorText);
      return NextResponse.json(
        { success: false, message: "Token không hợp lệ hoặc hết hạn" },
        { status: 401 }
      );
    }

    // 🔹 Nhận dữ liệu người dùng thật từ Pi Network
    const userData = await response.json();

    const verifiedUser = {
      username: userData?.username,
      uid: userData?.uid,
      roles: userData?.roles || [],
      created_at: userData?.created_at || new Date().toISOString(),
    };

    console.log("✅ Pi user verified:", verifiedUser);

    // 🔹 Trả về cho frontend để lưu vào localStorage
    return NextResponse.json({
      success: true,
      user: verifiedUser,
    });
  } catch (error: any) {
    console.error("💥 [API VERIFY ERROR]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xác minh Pi Network" },
      { status: 500 }
    );
  }
}
