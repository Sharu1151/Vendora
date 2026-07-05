import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState({ items: [], subtotal: 0 });
  const [wishlist, setWishlist] = useState([]);
  const [loadingUser, setLoadingUser] = useState(true);

  const fetchMe = useCallback(async () => {
    const t = localStorage.getItem("token");
    if (!t) { setLoadingUser(false); return; }
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch { localStorage.removeItem("token"); }
    setLoadingUser(false);
  }, []);

  const refreshCart = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    try { const { data } = await api.get("/cart"); setCart(data); } catch {}
  }, []);

  const refreshWishlist = useCallback(async () => {
    if (!localStorage.getItem("token")) return;
    try { const { data } = await api.get("/wishlist"); setWishlist(data); } catch {}
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);
  useEffect(() => { if (user) { refreshCart(); refreshWishlist(); } }, [user, refreshCart, refreshWishlist]);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  };
  const register = async (name, email, password) => {
    const { data } = await api.post("/auth/register", { name, email, password });
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  };
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null); setCart({ items: [], subtotal: 0 }); setWishlist([]);
  };

  const addToCart = async (product_id, qty = 1) => {
    if (!user) { toast.error("Please login to add to cart"); return; }
    await api.post("/cart/add", { product_id, qty });
    await refreshCart();
    toast.success("Added to cart");
  };
  const updateCart = async (product_id, qty) => {
    await api.post("/cart/update", { product_id, qty });
    await refreshCart();
  };
  const clearCart = async () => { await api.post("/cart/clear"); await refreshCart(); };
  const toggleWishlist = async (product_id) => {
    if (!user) { toast.error("Please login"); return; }
    const { data } = await api.post("/wishlist/toggle", { product_id });
    await refreshWishlist();
    toast.success(data.in_wishlist ? "Added to wishlist" : "Removed from wishlist");
  };

  return (
    <AppCtx.Provider value={{ user, setSession: setUser, loadingUser, cart, wishlist, login, register, logout, addToCart, updateCart, clearCart, toggleWishlist, refreshCart }}>
      {children}
    </AppCtx.Provider>
  );
}
