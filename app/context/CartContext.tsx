"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: string;          // 🔹 LUÔN là string
  name: string;
  price: number;       // 🔹 LUÔN là number
  description?: string;
  images?: string[];
  quantity: number;    // 🔹 LUÔN là number
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  updateQty: (id: string, qty: number) => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  /* =====================================
     LOAD CART (ensure correct typing)
  ===================================== */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cart");
      if (!raw) return;

      const parsed = JSON.parse(raw) as unknown[];

      const normalized = parsed
        .map((i) => {
          if (typeof i !== "object" || i === null) return null;

          const obj = i as any;

          const item: CartItem = {
            id: String(obj.id),
            name: String(obj.name ?? ""),
            price: Number(obj.price) || 0,
            quantity: Number(obj.quantity) || 1,
            description: obj.description,
            images: Array.isArray(obj.images) ? obj.images : [],
          };

          return item;
        })
        .filter(Boolean) as CartItem[];

      setCart(normalized);
    } catch {
      setCart([]);
    }
  }, []);

  /* =====================================
     SAVE CART
  ===================================== */
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  /* =====================================
     ADD PRODUCT (always normalized)
  ===================================== */
  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const id = String(item.id);

      const found = prev.find((p) => p.id === id);

      if (found) {
        return prev.map((p) =>
          p.id === id
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
      }

      return [
        ...prev,
        {
          ...item,
          id,
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((p) => p.id === id));
  };

  const updateQty = (id: string, qty: number) => {
    setCart((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, quantity: Math.max(1, qty) } : p
      )
    );
  };

  const clearCart = () => setCart([]);

  /* =====================================
     TOTAL (safe & typed)
  ===================================== */
  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, clearCart, updateQty, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
