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

  const [storeSettings, setStoreSettings] = useState(null);
  const [themeSettings, setThemeSettings] = useState(null);
  const [headerConfig, setHeaderConfig] = useState(null);
  const [footerConfig, setFooterConfig] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      const s = await api.get("/settings/store").catch(() => ({ data: {
        name: "Mangalore Store",
        tagline: "Farm-fresh groceries, delivered daily",
        logo: "",
        logo_dark: "",
        logo_mobile: "",
        favicon: "",
        loading_logo: "",
        email: "hello@mangalorestore.com",
        phone: "+91 98450 00000",
        whatsapp: "+91 98450 00000",
        address: "12 MG Road, Mangalore, Karnataka 575001, India",
        google_maps: "",
        gst_number: "29ABCDE1234F1Z5",
        company_name: "Mangalore Commerce Pvt Ltd",
        footer_copyright: "© 2026 Mangalore Store. All rights reserved."
      } }));
      setStoreSettings(s.data);
    } catch (e) {}

    try {
      const t = await api.get("/settings/theme").catch(() => ({ data: {
        primary: "#1B4332",
        secondary: "#E07A5F",
        accent: "#F4A261",
        background: "#FDFBF7",
        text: "#1C1917",
        button_radius: 999,
        card_radius: 16,
        font_display: "Cabinet Grotesk",
        font_body: "Satoshi",
        dark_mode: false,
        product_layout: "grid",
        category_layout: "bento"
      } }));
      setThemeSettings(t.data);
    } catch (e) {}

    try {
      const h = await api.get("/settings/header").catch(() => ({ data: {
        show_search: true,
        show_wishlist: true,
        show_cart: true,
        show_login: true,
        show_language: false,
        show_currency: false,
        contact_number_visible: true,
        menu_id: null,
        announcement: {
          enabled: true,
          text: "Free delivery on orders over ₹499 · Same-day delivery in Mangalore",
          link: "",
          bg: "#1B4332",
          fg: "#FFFFFF"
        }
      } }));
      setHeaderConfig(h.data);
    } catch (e) {}

    try {
      const f = await api.get("/settings/footer").catch(() => ({ data: {
        description: "Farm-fresh groceries, sourced daily from local Mangalore farmers and delivered to your door in under 30 minutes.",
        columns: [],
        copyright: "© 2026 Mangalore Store. All rights reserved."
      } }));
      setFooterConfig(f.data);
    } catch (e) {}
  }, []);

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

  useEffect(() => { fetchMe(); fetchSettings(); }, [fetchMe, fetchSettings]);
  useEffect(() => { if (user) { refreshCart(); refreshWishlist(); } }, [user, refreshCart, refreshWishlist]);

  useEffect(() => {
    if (!themeSettings) return;
    const r = document.documentElement;
    if (themeSettings.primary) r.style.setProperty("--primary", themeSettings.primary);
    if (themeSettings.secondary) r.style.setProperty("--accent", themeSettings.secondary);
    if (themeSettings.accent) r.style.setProperty("--accent-hover", themeSettings.accent);
    if (themeSettings.background) r.style.setProperty("--bg", themeSettings.background);
    if (themeSettings.text) r.style.setProperty("--text", themeSettings.text);
    if (themeSettings.button_radius !== undefined) r.style.setProperty("--button-radius", `${themeSettings.button_radius}px`);
    if (themeSettings.card_radius !== undefined) r.style.setProperty("--card-radius", `${themeSettings.card_radius}px`);
  }, [themeSettings]);

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
    <AppCtx.Provider value={{ user, setSession: setUser, loadingUser, cart, wishlist, login, register, logout, addToCart, updateCart, clearCart, toggleWishlist, refreshCart, storeSettings, themeSettings, headerConfig, footerConfig, fetchSettings }}>
      {children}
    </AppCtx.Provider>
  );
}
