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
  Store as StoreIcon, Users, IndianRupee, Package, Plus, Trash2, Pencil,
  Menu as MenuIcon, LayoutDashboard, ChevronRight,
  PanelLeftClose, PanelLeftOpen, ArrowRight, Settings2, Activity
} from "lucide-react";
import DataTable from "./admin/components/DataTable";

export default function SuperAdmin() {
  const { user, logout } = useApp();
  const nav = useNavigate();
  const [stats, setStats] = useState(null);
  const [stores, setStores] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", slug: "", vertical: "grocery", domain: "", plan: "starter", theme: "earthy", owner_email: "", status: "active" });
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1200);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Global Config Mock State
  const [config, setConfig] = useState({
    selfReg: true,
    requireSsl: true,
    maintMode: false,
    orderNotif: true
  });

  // Mock Audit Logs
  const [logs, setLogs] = useState([
    { id: 1, time: "Just now", type: "info", text: "Global config 'Require SSL' updated by super@vendora.com" },
    { id: 2, time: "10 mins ago", type: "success", text: "Store 'Mangalore Store' vertical grocery successfully active" },
    { id: 3, time: "1 hour ago", type: "warning", text: "Custom domain validation pending for 'mangalorestore.com'" },
    { id: 4, time: "4 hours ago", type: "info", text: "Platform seeder initialized with 3 default tenants" },
    { id: 5, time: "1 day ago", type: "danger", text: "Failed login attempt block for admin@mangalorestore.com from IP 192.168.1.5" }
  ]);

  const refresh = async () => {
    const [s, sr] = await Promise.all([api.get("/super/stats"), api.get("/super/stores")]);
    setStats(s.data); setStores(sr.data);
  };
  
  useEffect(() => { 
    if (user?.role === "super_admin") refresh(); 
  }, [user]);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", slug: "", vertical: "grocery", domain: "", plan: "starter", theme: "earthy", owner_email: "", status: "active" });
    setOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r.id);
    setForm({
      name: r.name || "",
      slug: r.slug || "",
      vertical: r.vertical || "grocery",
      domain: r.domain || "",
      plan: r.plan || "starter",
      theme: r.theme || "earthy",
      owner_email: r.owner_email || "",
      status: r.status || "active"
    });
    setOpen(true);
  };

  const save = async () => {
    try {
      const payload = { ...form, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-") };
      if (editing) {
        await api.put(`/super/stores/${editing}`, payload);
        toast.success("Store updated");
        // Log editing activity
        setLogs(prev => [
          { id: Date.now(), time: "Just now", type: "info", text: `Store '${payload.name}' updated by super@vendora.com` },
          ...prev
        ]);
      } else {
        await api.post("/super/stores", payload);
        toast.success("Store created");
        // Log creation activity
        setLogs(prev => [
          { id: Date.now(), time: "Just now", type: "success", text: `New tenant store '${payload.name}' created by super@vendora.com` },
          ...prev
        ]);
      }
      setOpen(false); refresh();
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  const del = async (id) => { 
    if (!window.confirm("Delete this store?")) return;
    const targetStore = stores.find(s => s.id === id);
    await api.delete(`/super/stores/${id}`); 
    toast.success("Deleted");
    setLogs(prev => [
      { id: Date.now(), time: "Just now", type: "danger", text: `Store '${targetStore?.name || id}' deleted from platform` },
      ...prev
    ]);
    refresh(); 
  };

  const toggleConfig = (key, label) => {
    setConfig(prev => {
      const next = { ...prev, [key]: !prev[key] };
      toast.success(`${label} turned ${next[key] ? "ON" : "OFF"}`);
      setLogs(logsPrev => [
        { id: Date.now(), time: "Just now", type: "info", text: `Global toggle '${label}' changed to ${next[key] ? "ENABLED" : "DISABLED"}` },
        ...logsPrev
      ]);
      return next;
    });
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
      <span className="font-mono text-stone-600 text-xs">{r.domain || "—"}</span>
    )},
    { key: "plan", header: "Plan", sortable: true, render: (r) => (
      <Select value={r.plan || "starter"} onValueChange={async (v) => {
        try {
          await api.put(`/super/stores/${r.id}`, { plan: v });
          toast.success("Store plan upgraded");
          setLogs(prev => [
            { id: Date.now(), time: "Just now", type: "success", text: `Store '${r.name}' plan updated to ${v.toUpperCase()}` },
            ...prev
          ]);
          refresh();
        } catch { toast.error("Failed to update plan"); }
      }}>
        <SelectTrigger className="h-7 w-28 text-[11px] font-bold uppercase"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="starter" className="text-xs uppercase">Starter</SelectItem>
          <SelectItem value="growth" className="text-xs uppercase">Growth</SelectItem>
          <SelectItem value="enterprise" className="text-xs uppercase">Enterprise</SelectItem>
        </SelectContent>
      </Select>
    )},
    { key: "status", header: "Status", sortable: true, render: (r) => (
      <Select value={r.status || "active"} onValueChange={async (v) => {
        try {
          await api.put(`/super/stores/${r.id}`, { status: v });
          toast.success("Store status updated");
          setLogs(prev => [
            { id: Date.now(), time: "Just now", type: "info", text: `Store '${r.name}' status set to ${v.toUpperCase()}` },
            ...prev
          ]);
          refresh();
        } catch { toast.error("Failed to update status"); }
      }}>
        <SelectTrigger className="h-7 w-24 text-[11px] font-bold uppercase"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="active" className="text-xs uppercase">Active</SelectItem>
          <SelectItem value="draft" className="text-xs uppercase">Draft</SelectItem>
          <SelectItem value="inactive" className="text-xs uppercase">Inactive</SelectItem>
        </SelectContent>
      </Select>
    )},
    { key: "actions", header: "", render: (r) => (
      <div className="flex gap-1 justify-end">
        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-600 transition-colors">
          <Pencil className="w-4 h-4" />
        </button>
        <button data-testid={`del-store-${r.id}`} onClick={() => del(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-[#991B1B] transition-colors">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
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
            <Button data-testid="super-new-store-btn" onClick={openNew} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F] self-start sm:self-auto"><Plus className="w-4 h-4 mr-1" />New Store</Button>
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

          {/* New Bottom Feature Panel Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Global Settings Control Panel */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-[#1B4332]" />
                <h2 className="font-display font-bold text-lg text-[#0F2A22]">Global Config Rules</h2>
              </div>
              <div className="space-y-4 pt-2">
                {[
                  { key: "selfReg", label: "Allow Seller Registrations", desc: "Toggle if new stores can register via the registration link." },
                  { key: "requireSsl", label: "Enforce HTTPS for custom domains", desc: "Forces SSL redirect for customized domains." },
                  { key: "maintMode", label: "Global Maintenance Mode", desc: "Redirects all storefronts to under-construction page." },
                  { key: "orderNotif", label: "Email Notifications for new orders", desc: "Sends immediate notifications to tenant owners." }
                ].map(item => (
                  <div key={item.key} className="flex items-start justify-between gap-4 py-2 border-b border-stone-155 last:border-0">
                    <div>
                      <div className="text-sm font-semibold text-stone-850">{item.label}</div>
                      <div className="text-xs text-stone-500">{item.desc}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={config[item.key]} 
                        onChange={() => toggleConfig(item.key, item.label)} 
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1B4332]"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Audit Logs */}
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#1B4332]" />
                <h2 className="font-display font-bold text-lg text-[#0F2A22]">Platform Audit Logs</h2>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 pt-2">
                {logs.map(log => (
                  <div key={log.id} className="text-xs flex items-start gap-3 p-2.5 rounded-lg bg-stone-50 hover:bg-stone-100/70 transition-colors">
                    <span className="font-mono text-stone-400 shrink-0 mt-0.5">{log.time}</span>
                    <div className="flex-1">
                      <span className={`inline-block w-2 h-2 rounded-full mr-2 shrink-0 ${
                        log.type === "success" ? "bg-emerald-550" : 
                        log.type === "warning" ? "bg-amber-500" : 
                        log.type === "danger" ? "bg-red-500" : "bg-blue-500"
                      }`} />
                      <span className="text-stone-700">{log.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* New / Edit Store Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Store Details" : "Create Store (Tenant)"}</DialogTitle></DialogHeader>
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
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["active", "draft", "inactive"].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Theme" value={form.theme} onChange={(e) => setForm({ ...form, theme: e.target.value })} />
            <Input data-testid="store-owner-email" placeholder="Owner email" className="col-span-1 sm:col-span-2" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} />
          </div>
          <DialogFooter>
            <Button data-testid="store-save-btn" onClick={save} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">{editing ? "Save Changes" : "Create Store"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
