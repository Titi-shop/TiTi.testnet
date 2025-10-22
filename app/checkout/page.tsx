import { NextRequest, NextResponse } from "next/server";

/**
 * ⚙️ API Checkout
 * URL: POST /api/checkout
 * Nhận dữ liệu từ form checkout (product, user, address, phone)
 * Gửi sang Pi Testnet (hoặc lưu DB / log giao dịch)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const { productId, username, amount, country, address, phone } = body;

    if (!productId || !username || !amount || !country || !address || !phone) {
      return NextResponse.json(
        { error: "Thiếu thông tin cần thiết để thanh toán" },
        { status: 400 }
      );
    }

    // 🪙 Đây là mô phỏng giao dịch testnet — bạn có thể thay bằng Pi API thật khi sẵn sàng.
    // Thực tế sẽ là: gọi fetch("https://api.minepi.com/v2/payments", {...})
    const mockTransactionId = "tx_" + Math.random().toString(36).substring(2, 10);

    // ✅ Giả lập phản hồi thành công từ Pi Testnet
    const paymentData = {
      paymentId: mockTransactionId,
      status: "pending",
      network: "Pi Testnet",
      username,
      amount,
      currency: "π",
      productId,
      delivery: {
        country,
        address,
        phone,
      },
      createdAt: new Date().toISOString(),
    };

    console.log("🟢 Payment request:", paymentData);

    // Trả về phản hồi để frontend mở giao diện Pi thanh toán
    return NextResponse.json({
      success: true,
      message: "Yêu cầu thanh toán đã được tạo (Testnet)",
      payment: paymentData,
    });
  } catch (err) {
    console.error("❌ Checkout API error:", err);
    return NextResponse.json(
      { error: "Không thể xử lý thanh toán" },
      { status: 500 }
    );
  }
}
