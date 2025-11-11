import { NextResponse } from "next/server";

/**
 * ✅ API xác minh Access Token của Pi Network (Tự nhận biết Testnet/Mainnet)
 * - Tránh lỗi verify sai trong môi trường testnet
 * - Trả về user hợp lệ hoặc user giả lập khi testnet
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

    // ✅ Kiểm tra môi trường (testnet/mainnet)
    const isTestnet =
      process.env.NEXT_PUBLIC_PI_ENV === "testnet" ||
      process.env.PI_API_URL?.includes("/sandbox");

    // ✅ Nếu là TESTNET → bỏ qua xác minh thật, trả về user giả lập
    if (isTestnet) {
      console.log("🧪 [Pi VERIFY] Bỏ qua xác minh thật (Testnet Mode)");
      return NextResponse.json({
        success: true,
        user: {
          username: "test_user",
          uid: "sandbox-uid",
          wallet_address: "TST123456789",
          roles: ["tester"],
          created_at: new Date().toISOString(),
        },
        env: "testnet",
      });
    }

    // ✅ Nếu là MAINNET → xác minh thật qua Pi API
    const API_URL = "https://api.minepi.com/v2/me";
    console.log("🌐 [Pi VERIFY] Mainnet mode:", API_URL);

    const response = await fetch(API_URL, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Pi VERIFY ERROR]", errorText);
      return NextResponse.json(
        { success: false, message: "Token không hợp lệ hoặc hết hạn" },
        { status: 401 }
      );
    }

    const userData = await response.json();
    const verifiedUser = {
      username: userData?.username,
      uid: userData?.uid,
      roles: userData?.roles || [],
      wallet_address: userData?.wallet_address || null,
      created_at: userData?.created_at || new Date().toISOString(),
    };

    console.log("✅ [Pi VERIFY SUCCESS]:", verifiedUser);

    return NextResponse.json({
      success: true,
      user: verifiedUser,
      env: "mainnet",
    });
  } catch (error: any) {
    console.error("💥 [API VERIFY EXCEPTION]:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Lỗi xác minh Pi Network" },
      { status: 500 }
    );
  }
}
