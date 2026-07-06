import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Heart, User, LayoutGrid, MapPin, LogOut } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, cart, logout, storeSettings, headerConfig } = useApp();
  const nav = useNavigate();
  const [q, setQ] = React.useState("");
  const doSearch = (e) => { e.preventDefault(); if (q.trim()) nav(`/products?q=${encodeURIComponent(q)}`); };

  const logoLetter = storeSettings?.name?.[0] || "M";

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[var(--bg)]/85 border-b border-[#E7E5E4]/70 saturate-150">
      {headerConfig?.announcement?.enabled !== false && (
        <div className="border-b border-[#E7E5E4]/70 text-xs" style={{ backgroundColor: headerConfig?.announcement?.bg || "#1B4332", color: headerConfig?.announcement?.fg || "#FFFFFF" }}>
          <div className="container-x px-3 sm:px-6 flex items-center justify-between h-9">
            <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Deliver to {storeSettings?.address?.split(",")?.[1]?.trim() || "Mangalore, 575001"}</div>
            <div className="hidden sm:flex items-center gap-6">
              <span>{headerConfig?.announcement?.text || "Free delivery on orders over ₹499"}</span>
              <Link to="/store-locator" data-testid="header-store-locator" className="hover:opacity-80">Store locator</Link>
              <Link to="/blogs" data-testid="header-blog-link" className="hover:opacity-80">Blog</Link>
            </div>
          </div>
        </div>
      )}
      <div className="container-x px-3 sm:px-6 flex items-center justify-between h-20">
        <Link to="/" data-testid="header-logo" className="flex items-center gap-1.5 sm:gap-2">
          {storeSettings?.logo ? (
            <img src={storeSettings.logo} alt={storeSettings.name} className="w-8 h-8 sm:w-10 sm:h-10 object-contain" />
          ) : (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-display font-black text-sm sm:text-base">{logoLetter}</div>
          )}
          <div className="leading-tight">
            <div className="font-display text-sm sm:text-xl font-black tracking-tight text-[var(--primary)]">{storeSettings?.name || "Mangalore"}</div>
            <div className="hidden sm:block overline -mt-1">{storeSettings?.tagline || "Store"}</div>
          </div>
        </Link>
        {headerConfig?.show_search !== false && (
          <form onSubmit={doSearch} className="hidden sm:block flex-1 max-w-2xl relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
            <Input
              data-testid="header-search-input"
              placeholder={`Search ${storeSettings?.name || "fresh vegetables, fruits, spices"}...`}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-11 h-12 rounded-full bg-white border-[#E7E5E4] focus-visible:ring-[#40916C]"
            />
          </form>
        )}
        <nav className="flex items-center gap-0.5 sm:gap-2">
          {headerConfig?.show_search !== false && (
            <Link to="/products" className="p-2 sm:p-3 rounded-full hover:bg-[#F4EFE6] transition-colors sm:hidden">
              <Search className="w-5 h-5" />
            </Link>
          )}
          {headerConfig?.show_wishlist !== false && (
            <Link to="/wishlist" data-testid="header-wishlist-link" className="p-2 sm:p-3 rounded-full hover:bg-[#F4EFE6] transition-colors">
              <Heart className="w-5 h-5" />
            </Link>
          )}
          {headerConfig?.show_cart !== false && (
            <Link to="/cart" data-testid="header-cart-link" className="relative p-2 sm:p-3 rounded-full hover:bg-[#F4EFE6] transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {cart.items.length > 0 && (
                <span data-testid="header-cart-count" className="absolute -top-1 -right-1 bg-[#E07A5F] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {cart.items.reduce((s, i) => s + i.qty, 0)}
                </span>
              )}
            </Link>
          )}
          {headerConfig?.show_login !== false && (
            <>
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button data-testid="header-user-menu" className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 sm:pr-4 rounded-full hover:bg-[#F4EFE6] transition-colors">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs sm:text-sm font-bold">{user.name[0]}</div>
                      <span className="hidden md:block text-sm font-medium">{user.name.split(" ")[0]}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Hi, {user.name}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem data-testid="menu-account" onClick={() => nav("/account")}><User className="w-4 h-4 mr-2" /> My Account</DropdownMenuItem>
                    <DropdownMenuItem data-testid="menu-orders" onClick={() => nav("/account?tab=orders")}>Orders</DropdownMenuItem>
                    {(user.role === "admin" || user.role === "super_admin") && (
                      <DropdownMenuItem data-testid="menu-admin" onClick={() => nav("/admin")}><LayoutGrid className="w-4 h-4 mr-2" /> Admin</DropdownMenuItem>
                    )}
                    {(user.role === "seller" || user.role === "admin" || user.role === "super_admin") && (
                      <DropdownMenuItem data-testid="menu-seller" onClick={() => nav("/seller")}><LayoutGrid className="w-4 h-4 mr-2" /> Seller Dashboard</DropdownMenuItem>
                    )}
                    {user.role === "super_admin" && (
                      <DropdownMenuItem data-testid="menu-super-admin" onClick={() => nav("/super-admin")}>Super Admin</DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem data-testid="menu-logout" onClick={() => { logout(); nav("/"); }}><LogOut className="w-4 h-4 mr-2" /> Log out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button data-testid="header-login-btn" onClick={() => nav("/login")} className="rounded-full bg-[var(--primary)] hover:opacity-90 px-2 sm:px-6 h-8 sm:h-10">
                  <span className="hidden sm:inline">Login</span>
                  <User className="w-4 h-4 sm:w-5 sm:h-5 sm:hidden" />
                </Button>
              )}
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
