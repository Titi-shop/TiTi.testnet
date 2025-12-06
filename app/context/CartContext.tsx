"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type CartItem = {
  id: string; // 🔥 ĐỔI SANG STRING để khớp URL + API
  name: string;
  price: number;
  images?: string[];
  description?: string;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  updateQty: (id: string, qty: number) => void;
  total: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false); // 🔥 tránh ghi đè khi chưa load

  // =============================================
  // LOAD CART FROM localStorage
  // =============================================
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cart");
      if (saved) setCart(JSON.parse(saved));
    } catch {
      setCart([]);
    } finally {
      setLoaded(true);
    }
  }, []);

  // =============================================
  // SAVE CART (CHỈ SAU KHI ĐÃ LOAD)
  // =============================================
  useEffect(() => {
    if (loaded) {
      localStorage.setItem("cart", JSON.stringify(cart));
    }
  }, [cart, loaded]);

  // =============================================
  // ADD TO CART
  // =============================================
  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const found = prev.find((p) => p.id === item.id);

      if (found) {
        return prev.map((p) =>
          p.id === item.id
            ? { ...p, quantity: p.quantity + (item.quantity || 1) }
            : p
        );
      }

      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  // =============================================
  // REMOVE
  // =============================================
  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((p) => p.id !== id));
  };

  // =============================================
  // UPDATE QTY
  // =============================================
  const updateQty = (id: string, qty: number) => {
    setCart((prev) =>
      prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p))
    );
  };

  const clearCart = () => setCart([]);

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
