import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Navigate } from "react-router-dom";
import { api, rupee } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Store as StoreIcon, Users, IndianRupee, Package, Plus, Trash2 } from "lucide-react";

export default function SuperAdmin() {
  const { user } = useApp();
  const [stats, setStats] = useState(null);
  const [stores, setStores] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", vertical: "grocery", domain: "", plan: "starter", theme: "earthy", owner_email: "" });

  const refresh = async () => {
    const [s, sr] = await Promise.all([api.get("/super/stats"), api.get("/super/stores")]);
    setStats(s.data); setStores(sr.data);
  };
  useEffect(() => { if (user?.role === "super_admin") refresh(); }, [user]);

  const save = async () => {
    try {
      await api.post("/super/stores", { ...form, slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-") });
      toast.success("Store created"); setOpen(false); refresh();
      setForm({ name: "", slug: "", vertical: "grocery", domain: "", plan: "starter", theme: "earthy", owner_email: "" });
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };
  const del = async (id) => { await api.delete(`/super/stores/${id}`); toast.success("Deleted"); refresh(); };

  if (!user) return <Navigate to="/login" />;
  if (user.role !== "super_admin") return <Navigate to="/" />;

  return (
    <div className="container-x py-10">
      <div>
        <div className="overline text-[#78716C]">Platform Control Center</div>
        <h1 className="font-display font-black text-4xl tracking-tight">Super Admin</h1>
      </div>

      {stats && (
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: StoreIcon, label: "Stores", value: stats.stores },
            { icon: Users, label: "Users", value: stats.users },
            { icon: Package, label: "Orders", value: stats.orders },
            { icon: IndianRupee, label: "Platform Revenue", value: rupee(stats.platform_revenue) },
          ].map((m, i) => (
            <div key={i} data-testid={`super-stat-${m.label.toLowerCase().replace(/\s/g, "-")}`} className="card-soft p-6">
              <m.icon className="w-6 h-6 text-[#1B4332]" />
              <div className="mt-3 overline">{m.label}</div>
              <div className="font-display font-black text-3xl mt-1">{m.value}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between mb-4">
        <div className="font-display text-2xl font-bold">Tenants / Stores</div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button data-testid="super-new-store-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Plus className="w-4 h-4 mr-1" /> New Store</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Store (Tenant)</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
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
              <Input data-testid="store-owner-email" placeholder="Owner email" className="col-span-2" value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} />
            </div>
            <DialogFooter><Button data-testid="store-save-btn" onClick={save} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Create Store</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="card-soft overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F4EFE6] text-left"><tr>
            <th className="p-4">Store</th><th className="p-4">Vertical</th><th className="p-4">Domain</th><th className="p-4">Plan</th><th className="p-4">Status</th><th></th>
          </tr></thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id} className="border-t border-[#E7E5E4]">
                <td className="p-4"><div className="font-medium">{s.name}</div><div className="text-xs text-[#78716C]">{s.owner_email}</div></td>
                <td className="p-4 capitalize">{s.vertical}</td>
                <td className="p-4 text-[#78716C]">{s.domain}</td>
                <td className="p-4"><span className="bg-[#F4EFE6] px-2 py-0.5 rounded text-xs font-medium uppercase">{s.plan}</span></td>
                <td className="p-4"><span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${s.status === "active" ? "bg-[#40916C]/10 text-[#40916C]" : "bg-[#F4A261]/10 text-[#F4A261]"}`}>{s.status}</span></td>
                <td className="p-4"><button data-testid={`del-store-${s.id}`} onClick={() => del(s.id)} className="text-[#991B1B]"><Trash2 className="w-4 h-4" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
