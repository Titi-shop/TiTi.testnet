"use client";

import { useEffect, useState } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";

// 🧩 Khai báo Pi SDK toàn cục
declare global {
  interface Window {
    Pi?: any;
  }
}

export default function CheckoutPage() {
  const { cart, clearCart, total } = useCart();
  const [wallet, setWallet] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState("guest");
  const router = useRouter();

  // ✅ Lấy thông tin người dùng từ PiLogin (đã lưu trong localStorage)
  useEffect(() => {
    try {
      const isLoggedIn = localStorage.getItem("titi_is_logged_in") === "true";
      const username = localStorage.getItem("titi_username");
      if (isLoggedIn && username) {
        setUser(username);
      } else {
        setUser("guest");
      }
    } catch (err) {
      console.error("User load error:", err);
    }
  }, []);

  // ✅ Lấy ví Pi (mock tạm)
  useEffect(() => {
    const w = Number(localStorage.getItem("pi_wallet") ?? "1000");
    setWallet(w);
  }, []);

  // 💰 Hàm thanh toán
  const handlePayWithPi = async () => {
    if (!window.Pi) {
      alert("⚠️ Hãy mở trang này trong Pi Browser để thanh toán.");
      return;
    }
    if (cart.length === 0) {
      alert("🛒 Giỏ hàng trống.");
      return;
    }
    if (user === "guest") {
      alert("⚠️ Bạn cần đăng nhập bằng Pi trước khi thanh toán!");
      router.push("/pilogin");
      return;
    }

    setLoading(true);

    try {
      // ✅ Khởi tạo Pi SDK
      window.Pi.init({ version: "2.0", sandbox: true });

      // ✅ Xác thực lại người dùng (đảm bảo an toàn)
      const scopes = ["payments", "username", "wallet_address"];
      const auth = await window.Pi.authenticate(scopes, (res: any) => res);
      console.log("✅ Xác thực Pi:", auth);

      // ✅ Cấu hình thông tin đơn hàng
      const orderId = Date.now();
      const paymentData = {
        amount: total,
        memo: `Thanh toán đơn hàng #${orderId}`,
        metadata: {
          orderId,
          items: cart,
          buyer: auth.user?.username || user,
        },
      };

      // ✅ Callback xử lý của Pi SDK
      const callbacks = {
        // 1️⃣ App gửi yêu cầu duyệt payment đến server
        onReadyForServerApproval: async (paymentId: string) => {
          console.log("⏳ [APPROVE] ID:", paymentId);
          await fetch("/api/pi/approve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId }),
          });
        },

        // 2️⃣ Khi Pi Wallet hoàn tất giao dịch và gửi txid về
        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log("✅ [COMPLETE] ID:", paymentId, "TXID:", txid);

          // Gửi thông tin lên server để xác minh txid thật
          const res = await fetch("/api/pi/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paymentId, txid }),
          });

          const result = await res.json();

          // 🧠 Chỉ tạo đơn hàng khi backend xác minh giao dịch thành công
          if (result?.success) {
            const order = {
              id: orderId,
              items: cart,
              total,
              createdAt: new Date().toISOString(),
              buyer: auth.user?.username || user,
              status: "Đã thanh toán",
              note: `Pi TXID: ${txid}`,
            };

            await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(order),
            });

            clearCart();
            alert("✅ Thanh toán qua Pi Wallet thành công!");
            router.push("/customer/pending");
          } else {
            alert("⚠️ Giao dịch đang chờ xác minh trên Pi Network.");
          }
        },

        // 3️⃣ Khi người dùng huỷ
        onCancel: () => alert("❌ Giao dịch đã bị huỷ."),

        // 4️⃣ Khi có lỗi
        onError: (error: any) => {
          console.error("💥 Lỗi thanh toán:", error);
          alert("💥 Lỗi trong quá trình thanh toán: " + error.message);
        },
      };

      // ✅ Gọi thanh toán qua Pi SDK
      await window.Pi.createPayment(paymentData, callbacks);
    } catch (err: any) {
      console.error("❌ Lỗi thanh toán:", err);
      alert("❌ Giao dịch thất bại hoặc bị huỷ.");
    } finally {
      setLoading(false);
    }
  };

  // 🧱 Giao diện hiển thị
  return (
    <main className="max-w-3xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-center text-orange-600">
        💳 Thanh toán
      </h1>

      <div className="bg-white p-4 rounded shadow mb-4">
        <p>
          Người mua: <b>{user}</b>
        </p>
        <p>
          Ví Pi hiện tại: <b className="text-yellow-600">{wallet} Pi</b>
        </p>
        <p>
          Tổng đơn hàng: <b className="text-yellow-600">{total} Pi</b>
        </p>
      </div>

      <button
        onClick={handlePayWithPi}
        disabled={loading}
        className={`w-full py-3 rounded text-white font-semibold ${
          loading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"
        }`}
      >
        {loading ? "Đang mở Pi Wallet..." : "Thanh toán bằng Pi Wallet"}
      </button>
    </main>
  );
}
