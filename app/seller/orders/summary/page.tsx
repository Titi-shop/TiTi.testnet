"use client";

import React, { useEffect, useState } from "react";

interface Order {
  id: string;
  buyer: string;
  total: number;
  status: string;
  createdAt: string;
}

export default function OrdersSummaryPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  // 🔹 Giả lập dữ liệu – bạn có thể thay bằng fetch API thật
  useEffect(() => {
    setOrders([
      { id: "1762840991334", buyer: "nguyenminhduc1991111", total: 1.6, status: "chờ xác nhận", createdAt: "11/11/2025" },
      { id: "1762840930498", buyer: "nguyenminhduc1991111", total: 6, status: "đã hủy", createdAt: "11/11/2025" },
      { id: "1762840888888", buyer: "lethanh", total: 3.2, status: "hoàn tất", createdAt: "10/11/2025" },
    ]);
  }, []);

  const totalPi = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">📦 Tổng đơn hàng</h2>

      {/* Thống kê nhanh */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="card">
          <p className="text-gray-500 text-sm">Tổng đơn</p>
          <p className="text-lg font-bold">{orders.length}</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Tổng Pi</p>
          <p className="text-lg font-bold">{totalPi} Pi</p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">Hoàn tất</p>
          <p className="text-lg font-bold">
            {orders.filter(o => o.status === "hoàn tất").length}
          </p>
        </div>
      </div>

      {/* Danh sách đơn */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="card">
            <p>🧾 <b>Mã đơn:</b> #{order.id}</p>
            <p>👤 <b>Người mua:</b> {order.buyer}</p>
            <p>💰 <b>Tổng:</b> {order.total} Pi</p>
            <p>📅 <b>Ngày tạo:</b> {order.createdAt}</p>
            <p>📊 <b>Trạng thái:</b> {order.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
