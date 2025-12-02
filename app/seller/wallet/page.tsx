"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTranslationClient as useTranslation } from "@/app/lib/i18n/client";
import {
  Wallet as WalletIcon,
  ArrowUpCircle,
  ArrowDownCircle,
  History,
  LogOut,
} from "lucide-react";

interface Transaction {
  id: number;
  type: "deposit" | "withdraw";
  amount: number;
  date: string;
}

export default function SellerWalletPage() {
  const router = useRouter();
  const { user } = useAuth();

  const { t } = useTranslation();
  const username = user?.username || "";
  const [role, setRole] = useState<string>("buyer");
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initWallet = async () => {
      if (!user) {
        router.replace("/pilogin");
        return;
      }

      try {
        const roleRes = await fetch(`/api/users/role?username=${user.username}`);
        const roleData = await roleRes.json();
        const userRole = roleData?.role || "buyer";

        setRole(userRole);

        if (userRole !== "seller" && userRole !== "admin") {
          alert("⚠️ Tài khoản này không thuộc khu vực người bán!");
          router.replace("/customer");
          return;
        }

        const storedBalance = localStorage.getItem(`wallet_${username}_balance`);
        const storedTx = localStorage.getItem(`wallet_${username}_transactions`);
        setBalance(storedBalance ? parseFloat(storedBalance) : 0);
        setTransactions(storedTx ? JSON.parse(storedTx) : []);
      } catch (err) {
        console.error("❌ Lỗi tải ví:", err);
      } finally {
        setLoading(false);
      }
    };

    initWallet();
  }, [user, router, username]);

  const addTransaction = (type: "deposit" | "withdraw", amount: number) => {
    const newTx: Transaction = {
      id: Date.now(),
      type,
      amount,
      date: new Date().toLocaleString(),
    };

    const updatedTx = [newTx, ...transactions];
    setTransactions(updatedTx);
    localStorage.setItem(`wallet_${username}_transactions`, JSON.stringify(updatedTx));

    const newBalance = type === "deposit" ? balance + amount : Math.max(balance - amount, 0);
    setBalance(newBalance);
    localStorage.setItem(`wallet_${username}_balance`, newBalance.toString());
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/pilogin");
  };

  if (loading)
    return <main className="text-center mt-10 text-gray-500">⏳ Đang tải ví...</main>;

  return (
    <main className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-md p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <WalletIcon className="w-6 h-6 text-purple-600" />
            <h1 className="text-xl font-semibold text-gray-800">Ví Người Bán</h1>
          </div>
          <button onClick={handleLogout} className="text-red-500 text-sm flex items-center gap-1">
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>

        <p className="text-center text-gray-500 mb-3">
          👤 Người bán: <span className="font-semibold">{username}</span>
          <br />
          <span className="text-sm text-gray-400">
            ({role === "admin" ? "Quản trị viên" : "Tài khoản người bán"})
          </span>
        </p>

        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white p-5 rounded-xl mb-4 text-center">
          <p className="text-sm opacity-80">Số dư hiện tại</p>
          <h2 className="text-3xl font-bold">{balance.toFixed(2)} π</h2>
        </div>

        <div className="flex justify-around mb-5">
          <button onClick={() => addTransaction("deposit", 1)} className="text-green-600">
            <ArrowDownCircle className="w-7 h-7" />
            <span>Nạp Pi</span>
          </button>
          <button onClick={() => addTransaction("withdraw", 0.5)} className="text-red-500">
            <ArrowUpCircle className="w-7 h-7" />
            <span>Rút Pi</span>
          </button>
          <button onClick={() => router.push("/seller")} className="text-blue-500">
            <History className="w-7 h-7" />
            <span>Trang người bán</span>
          </button>
        </div>

        <h3 className="text-lg font-semibold mb-2 text-gray-700">Lịch sử giao dịch</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-center">Chưa có giao dịch nào.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {transactions.map((tx) => (
              <li key={tx.id} className="flex justify-between items-center py-2 text-sm">
                <span className={tx.type === "deposit" ? "text-green-600" : "text-red-500"}>
                  {tx.type === "deposit" ? "Nạp" : "Rút"} {tx.amount} π
                </span>
                <span className="text-gray-400">{tx.date}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
