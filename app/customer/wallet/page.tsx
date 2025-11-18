"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Wallet, Link, LogOut } from "lucide-react";

export default function WalletPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [walletData, setWalletData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.wallet_address) {
      setLoading(false);
      return;
    }

    fetch(`/api/piWallet?address=${user.wallet_address}`)
      .then((res) => res.json())
      .then((data) => setWalletData(data))
      .catch(() => console.log("⚠️ Không thể tải thông tin ví"))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading)
    return <main className="p-6 text-center text-gray-500">⏳ Đang tải ví...</main>;

  return (
    <main className="min-h-screen bg-gray-100 pb-20">
      {/* Header */}
      <div className="bg-orange-500 text-white py-6 text-center shadow">
        <h1 className="text-xl font-bold flex items-center justify-center gap-2">
          <Wallet /> Ví Pi Network
        </h1>
      </div>

      <div className="max-w-md mx-auto bg-white rounded-xl shadow-md mt-6 p-5">
        {user?.wallet_address ? (
          <>
            <p className="text-gray-700 text-center mb-3">
              Địa chỉ ví:{" "}
              <span className="font-mono text-sm text-gray-900">
                {user.wallet_address}
              </span>
            </p>

            <div className="bg-orange-100 text-center py-4 rounded-lg mb-4">
              <p className="text-gray-700 font-medium">
                Số dư hiện tại:{" "}
                <span className="text-orange-600 font-bold">
                  {walletData?.balance || "0.00"} π
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => router.push("/customer/transactions")}
                className="w-full py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
              >
                Xem giao dịch gần đây
              </button>
              <button
                onClick={() => router.push("/customer/send")}
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Gửi Pi
              </button>
              <button
                onClick={() => router.push("/customer/receive")}
                className="w-full py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
              >
                Nhận Pi
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <p className="text-gray-700 mb-3">Chưa liên kết ví Pi Network</p>
            <button
              onClick={() => router.push("/customer/linkwallet")}
              className="bg-orange-500 text-white px-6 py-2 rounded-lg inline-flex items-center gap-2 hover:bg-orange-600"
            >
              <Link size={18} /> Liên kết ví ngay
            </button>
          </div>
        )}
      </div>

      {/* Nút quay lại */}
      <div className="text-center mt-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-orange-500 flex items-center justify-center gap-2 mx-auto"
        >
          ← Quay lại
        </button>
      </div>
    </main>
  );
}
