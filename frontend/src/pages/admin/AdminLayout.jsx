import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Search, Bell, Menu as MenuIcon, ChevronLeft, ChevronRight, Command, LogOut, User,
  Sun, Moon, PanelLeftClose, PanelLeftOpen, ArrowRight,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ADMIN_MODULES, FLAT_MODULES } from "./modules";
import CommandPalette from "./CommandPalette";

export default function AdminLayout() {
  const { user, logout } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1200);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Keyboard shortcuts (Cmd/Ctrl+K opens palette, [ toggles sidebar)
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setPaletteOpen(true);
      } else if (e.key === "[" && !e.target.matches("input,textarea")) {
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const breadcrumbs = useMemo(() => {
    const p = loc.pathname.split("/").filter(Boolean);
    const crumbs = [{ label: "Admin", href: "/admin" }];
    if (p.length > 1) {
      const mod = FLAT_MODULES.find((m) => m.path === "/" + p.slice(0, 2).join("/"));
      if (mod) crumbs.push({ label: mod.label, href: mod.path });
    }
    return crumbs;
  }, [loc.pathname]);

  if (!user) return null;

  const sidebarWidth = collapsed ? "w-[72px]" : "w-[264px]";

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1C1917]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-[#0F2A22] text-white transition-all duration-200 ease-out
        ${sidebarWidth} ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 flex flex-col`}>
        <div className={`flex items-center gap-2 px-4 h-16 border-b border-white/10 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 rounded-full bg-[#E07A5F] flex items-center justify-center font-display font-black">M</div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display font-black text-base tracking-tight">Mangalore</div>
              <div className="text-[10px] uppercase tracking-widest text-white/60">Admin Console</div>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          {ADMIN_MODULES.map((s) => (
            <div key={s.section}>
              {!collapsed && <div className="px-3 pb-1 text-[10px] uppercase tracking-widest text-white/40">{s.section}</div>}
              <div className="space-y-0.5">
                {s.items.map((it) => (
                  <NavLink
                    key={it.key}
                    to={it.path}
                    end={it.path === "/admin"}
                    data-testid={`admin-nav-${it.key}`}
                    className={({ isActive }) =>
                      `group flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors
                       ${isActive ? "bg-[#E07A5F] text-white shadow-sm" : "text-white/75 hover:bg-white/5 hover:text-white"}
                       ${collapsed ? "justify-center" : ""}`
                    }
                    onClick={() => setMobileOpen(false)}
                    title={collapsed ? it.label : ""}
                  >
                    <it.icon className="w-4 h-4 shrink-0" />
                    {!collapsed && <span className="truncate">{it.label}</span>}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className={`p-3 border-t border-white/10 ${collapsed ? "flex justify-center" : ""}`}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex items-center gap-2 text-xs text-white/60 hover:text-white"
            data-testid="admin-sidebar-collapse"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <><PanelLeftClose className="w-4 h-4" /> Collapse</>}
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className={`transition-all ${collapsed ? "lg:pl-[72px]" : "lg:pl-[264px]"}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-[#E7E5E4]">
          <div className="h-16 flex items-center gap-3 px-4 lg:px-6">
            <button className="lg:hidden p-2 rounded-lg hover:bg-[#F4EFE6]" onClick={() => setMobileOpen(true)} data-testid="admin-mobile-menu">
              <MenuIcon className="w-5 h-5" />
            </button>
            <button
              className="flex-1 max-w-md flex items-center gap-2 h-10 px-4 rounded-full bg-[#F4EFE6] hover:bg-[#EEE7D9] text-sm text-[#78716C]"
              onClick={() => setPaletteOpen(true)}
              data-testid="admin-search-btn"
            >
              <Search className="w-4 h-4" />
              <span>Search modules, actions…</span>
              <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-mono border border-[#E7E5E4] rounded px-1.5 py-0.5 bg-white">
                <Command className="w-3 h-3" />K
              </span>
            </button>
            <div className="ml-auto flex items-center gap-1">
              <button className="p-2 rounded-full hover:bg-[#F4EFE6] relative" data-testid="admin-notifications-btn" title="Notifications">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#E07A5F] rounded-full" />
              </button>
              <a href="/" target="_blank" rel="noreferrer" className="hidden md:inline-flex items-center gap-1 px-3 h-9 rounded-full text-xs bg-[#F4EFE6] hover:bg-[#EEE7D9]" data-testid="admin-view-storefront">
                View storefront <ArrowRight className="w-3 h-3" />
              </a>
              <button
                onClick={() => { logout(); nav("/"); }}
                className="inline-flex items-center gap-2 pl-2 pr-3 h-9 rounded-full hover:bg-[#F4EFE6]"
                data-testid="admin-user-btn"
              >
                <div className="w-7 h-7 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs font-bold">{user.name[0]}</div>
                <span className="hidden md:block text-sm">{user.name.split(" ")[0]}</span>
              </button>
            </div>
          </div>
          {/* Breadcrumbs */}
          <div className="px-4 lg:px-6 pb-2 text-xs text-[#78716C] flex items-center gap-1 flex-wrap">
            {breadcrumbs.map((c, i) => (
              <React.Fragment key={c.href}>
                {i > 0 && <ChevronRight className="w-3 h-3" />}
                <button onClick={() => nav(c.href)} className="hover:text-[#1B4332] transition-colors" data-testid={`admin-breadcrumb-${i}`}>{c.label}</button>
              </React.Fragment>
            ))}
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
