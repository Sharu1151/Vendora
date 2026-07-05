import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, Heart, User, LayoutGrid, MapPin, LogOut } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Header() {
  const { user, cart, logout } = useApp();
  const nav = useNavigate();
  const [q, setQ] = React.useState("");
  const doSearch = (e) => { e.preventDefault(); if (q.trim()) nav(`/products?q=${encodeURIComponent(q)}`); };
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#FDFBF7]/85 border-b border-[#E7E5E4]/70 saturate-150">
      <div className="border-b border-[#E7E5E4]/70 text-xs text-[#78716C]">
        <div className="container-x flex items-center justify-between h-9">
          <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> Deliver to Mangalore, 575001</div>
          <div className="hidden sm:flex items-center gap-6">
            <span>Free delivery on orders over ₹499</span>
            <Link to="/store-locator" data-testid="header-store-locator" className="hover:text-[#1B4332]">Store locator</Link>
            <Link to="/blogs" data-testid="header-blog-link" className="hover:text-[#1B4332]">Blog</Link>
          </div>
        </div>
      </div>
      <div className="container-x flex items-center gap-6 h-20">
        <Link to="/" data-testid="header-logo" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#1B4332] flex items-center justify-center text-white font-display font-black">M</div>
          <div className="leading-tight">
            <div className="font-display text-xl font-black tracking-tight text-[#1B4332]">Mangalore</div>
            <div className="overline -mt-1">Store</div>
          </div>
        </Link>
        <form onSubmit={doSearch} className="flex-1 max-w-2xl relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
          <Input
            data-testid="header-search-input"
            placeholder="Search fresh vegetables, fruits, spices…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-11 h-12 rounded-full bg-white border-[#E7E5E4] focus-visible:ring-[#40916C]"
          />
        </form>
        <nav className="flex items-center gap-2">
          <Link to="/wishlist" data-testid="header-wishlist-link" className="p-3 rounded-full hover:bg-[#F4EFE6] transition-colors">
            <Heart className="w-5 h-5" />
          </Link>
          <Link to="/cart" data-testid="header-cart-link" className="relative p-3 rounded-full hover:bg-[#F4EFE6] transition-colors">
            <ShoppingCart className="w-5 h-5" />
            {cart.items.length > 0 && (
              <span data-testid="header-cart-count" className="absolute -top-1 -right-1 bg-[#E07A5F] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {cart.items.reduce((s, i) => s + i.qty, 0)}
              </span>
            )}
          </Link>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="header-user-menu" className="flex items-center gap-2 p-2 pr-4 rounded-full hover:bg-[#F4EFE6] transition-colors">
                  <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-sm font-bold">{user.name[0]}</div>
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
            <Button data-testid="header-login-btn" onClick={() => nav("/login")} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Login</Button>
          )}
        </nav>
      </div>
    </header>
  );
}
