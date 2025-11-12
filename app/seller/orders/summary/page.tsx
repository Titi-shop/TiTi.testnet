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

  // 🔹 Dữ liệu mẫu (thay bằng dữ liệu fetch từ API thực tế nếu có)
  useEffect(() => {
    setOrders([
      {
        id: "1762840991334",
        buyer: "nguyenminhduc1991111",
        total: 1.6,
        status: "chờ xác nhận",
        createdAt: "11/11/2025",
      },
      {
        id: "1762840930498",
        buyer: "nguyenminhduc1991111",
        total: 6,
        status: "đã hủy",
        createdAt: "11/11/2025",
      },
      {
        id: "1762840888888",
        buyer: "lethanh",
        total: 3.2,
        status: "hoàn tất",
        createdAt: "10/11/2025",
      },
    ]);
  }, []);

  // 🔹 Tính tổng đơn và tổng Pi
  const totalPi = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;

  return (
    <div className="min-h-screen p-4 pb-24 bg-gray-50">
      {/* ===== Header ===== */}
      <h2 className="text-2xl font-semibold mb-4 text-gray-800 text-center">
        📦 Tổng đơn hàng
      </h2>

      {/* ===== Thống kê nhanh ===== */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card text-center">
          <p className="text-gray-500 text-sm">Tổng đơn</p>
          <p className="text-xl font-bold">{totalOrders}</p>
        </div>
        <div className="card text-center">
          <p className="text-gray-500 text-sm">Tổng Pi</p>
          <p className="text-xl font-bold">{totalPi.toFixed(1)} Pi</p>
        </div>
      </div>

      {/* ===== Danh sách đơn ===== */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="card bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
          >
            <p>🧾 <b>Mã đơn:</b> #{order.id}</p>
            <p>👤 <b>Người mua:</b> {order.buyer}</p>
            <p>💰 <b>Tổng:</b> {order.total} Pi</p>
            <p>📅 <b>Ngày tạo:</b> {order.createdAt}</p>
            <p>📊 <b>Trạng thái:</b> {order.status}</p>
          </div>
        ))}
      </div>

      {/* ===== Chân trang tránh bị che ===== */}
      <div className="h-16"></div>
    </div>
  );
}
