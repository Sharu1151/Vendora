import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Navigate, useNavigate } from "react-router-dom";
import { api, rupee } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Store as StoreIcon, Users, IndianRupee, Package, Plus, Trash2,
  Menu as MenuIcon, LayoutDashboard, ChevronRight,
  PanelLeftClose, PanelLeftOpen, ArrowRight
} from "lucide-react";
import DataTable from "./admin/components/DataTable";

export default function SuperAdmin() {
  const { user, logout } = useApp();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [stores, setStores] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", vertical: "grocery", domain: "", plan: "starter", theme: "earthy", owner_email: "" });
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1200);
  const [mobileOpen, setMobileOpen] = useState(false);

  const refresh = async () => {
    const [s, sr] = await Promise.all([api.get("/super/stats"), api.get("/super/stores")]);
    setStats(s.data); setStores(sr.data);
  };
  
  useEffect(() => { 
    if (user?.role === "super_admin") refresh(); 
  }, [user]);

  const save = async () => {
    try {
      await api.post("/super/stores", { ...form, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-") });
      toast.success("Store created"); setOpen(false); refresh();
      setForm({ name: "", slug: "", vertical: "grocery", domain: "", plan: "starter", theme: "earthy", owner_email: "" });
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const del = async (id) => { 
    if (!window.confirm("Delete this store?")) return;
    await api.delete(`/super/stores/${id}`); 
    toast.success("Deleted"); 
    refresh(); 
  };

  if (!user) return <Navigate to="/login" />;
  if (user.role !== "super_admin") return <Navigate to="/" />;

  const columns = [
    { key: "name", header: "Store", sortable: true, render: (r) => (
      <div>
        <div className="font-semibold text-stone-900">{r.name}</div>
        <div className="text-xs text-stone-500">{r.owner_email}</div>
      </div>
    )},
    { key: "vertical", header: "Vertical", sortable: true, render: (r) => (
      <span className="capitalize px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-800">
        {r.vertical}
      </span>
    )},
    { key: "domain", header: "Domain", sortable: true, render: (r) => (
      <span className="font-mono text-stone-600">{r.domain || "—"}</span>
    )},
    { key: "plan", header: "Plan", sortable: true, render: (r) => (
      <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border border-emerald-200">
        {r.plan}
      </span>
    )},
    { key: "status", header: "Status", sortable: true, render: (r) => (
      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${r.status === "active" ? "bg-emerald-100 text-emerald-850" : "bg-amber-100 text-amber-850"}`}>
        {r.status || "active"}
      </span>
    )},
    { key: "actions", header: "", render: (r) => (
      <button data-testid={`del-store-${r.id}`} onClick={() => del(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#991B1B] transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    )}
  ];

  const sidebarWidth = (collapsed && !mobileOpen) ? "w-[72px]" : "w-[264px]";

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-[#1C1917]">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-[#0F2A22] text-white transition-all duration-200 ease-out
        ${sidebarWidth} ${mobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 flex flex-col`}>
        <div className={`flex items-center gap-2 px-4 h-16 border-b border-white/10 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-9 h-9 rounded-full bg-[#E07A5F] flex items-center justify-center font-display font-black">S</div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display font-black text-base tracking-tight">Vendora</div>
              <div className="text-[10px] uppercase tracking-widest text-[#E07A5F] font-bold">Super Console</div>
            </div>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4">
          <div>
            {!collapsed && <div className="px-3 pb-1 text-[10px] uppercase tracking-widest text-white/40">Overview</div>}
            <div className="space-y-0.5">
              <button
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors bg-[#E07A5F] text-white shadow-sm"
                title={collapsed ? "Super Admin" : ""}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">Platform Stats</span>}
              </button>
            </div>
          </div>
        </nav>
        <div className={`p-3 border-t border-white/10 ${collapsed ? "flex justify-center" : ""}`}>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex items-center gap-2 text-xs text-white/60 hover:text-white"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <><PanelLeftClose className="w-4 h-4" /> Collapse</>}
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main container */}
      <div className={`transition-all ${collapsed ? "lg:pl-[72px]" : "lg:pl-[264px]"}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-[#E7E5E4]">
          <div className="h-16 flex items-center gap-3 px-4 lg:px-6">
            <button className="lg:hidden p-2 rounded-lg hover:bg-[#F4EFE6]" onClick={() => setMobileOpen(true)}>
              <MenuIcon className="w-5 h-5" />
            </button>
            <div className="text-sm font-semibold text-stone-700 hidden sm:block">Super Admin Portal</div>
            
            <div className="ml-auto flex items-center gap-1">
              <a href="/" target="_blank" rel="noreferrer" className="hidden md:inline-flex items-center gap-1 px-3 h-9 rounded-full text-xs bg-[#F4EFE6] hover:bg-[#EEE7D9]">
                View Storefront <ArrowRight className="w-3 h-3" />
              </a>
              <button
                onClick={() => { logout(); nav("/"); }}
                className="inline-flex items-center gap-2 pl-2 pr-3 h-9 rounded-full hover:bg-[#F4EFE6]"
              >
                <div className="w-7 h-7 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs font-bold">{user.name[0]}</div>
                <span className="hidden md:block text-sm">{user.name.split(" ")[0]}</span>
              </button>
            </div>
          </div>
          {/* Breadcrumbs */}
          <div className="px-4 lg:px-6 pb-2 text-xs text-[#78716C] flex items-center gap-1 flex-wrap">
            <span className="hover:text-[#1B4332] transition-colors">Super Admin</span>
            <ChevronRight className="w-3 h-3 text-stone-400" />
            <span className="font-semibold text-stone-800">Platform Control Center</span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 lg:p-6 space-y-8">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <h1 className="font-display font-black text-3xl tracking-tight text-[#0F2A22]">Super Admin Dashboard</h1>
              <p className="text-sm text-[#78716C]">Monitor, create and delete multi-tenant store verticals on the platform.</p>
            </div>
            <Button data-testid="super-new-store-btn" onClick={() => setOpen(true)} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F] self-start sm:self-auto"><Plus className="w-4 h-4 mr-1" />New Store</Button>
          </div>

          {/* Stats grid */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: StoreIcon, label: "Stores", value: stats.stores, tid: "stores" },
                { icon: Users, label: "Users", value: stats.users, tid: "users" },
                { icon: Package, label: "Orders", value: stats.orders, tid: "orders" },
                { icon: IndianRupee, label: "Platform Revenue", value: rupee(stats.platform_revenue), tid: "platform-revenue" },
              ].map((m, i) => (
                <div key={i} data-testid={`super-stat-${m.tid}`} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm transition-all hover:scale-[1.01] hover:shadow-md">
                  <div className="p-2 rounded-xl bg-[#F4EFE6] w-fit">
                    <m.icon className="w-5 h-5 text-[#1B4332]" />
                  </div>
                  <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-500">{m.label}</div>
                  <div className="font-display font-black text-2xl mt-1 text-[#0F2A22]">{m.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Tenants / Stores Table Container */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden p-6 space-y-4">
            <h2 className="font-display font-bold text-xl text-[#0F2A22]">Tenants / Stores</h2>
            <DataTable
              columns={columns}
              rows={stores}
              searchKeys={["name", "vertical", "domain", "plan", "owner_email"]}
              testIdPrefix="store-row"
              pageSize={10}
            />
          </div>
        </main>
      </div>

      {/* New Store Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Create Store (Tenant)</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-4">
            <Input data-testid="store-name" placeholder="Store name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input data-testid="store-domain" placeholder="Domain" value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} />
            <Select value={form.vertical} onValueChange={(v) => setForm({ ...form, vertical: v })}>
              <SelectTrigger data-testid="store-vertical"><SelectValue /></SelectTrigger>
              <SelectContent>{["grocery", "fashion", "electronics", "pharmacy", "restaurant", "bakery"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={form.plan} onValueChange={(v) => setForm({ ...form, plan: v })}>
              <SelectTrigger data-testid="store-plan"><SelectValue /></SelectTrigger>
              <SelectContent>{["starter", "growth", "enterprise"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Input data-testid="store-owner-email" placeholder="Owner email" className="col-span-1 sm:col-span-2" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} />
          </div>
          <DialogFooter>
            <Button data-testid="store-save-btn" onClick={save} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Create Store</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
