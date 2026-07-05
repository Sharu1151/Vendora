import React, { useEffect, useState } from "react";
import { api, rupee } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Ban, User } from "lucide-react";
import DataTable from "./components/DataTable";
import PageHeader from "./components/PageHeader";

export default function AdminCustomers() {
  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);

  const refresh = () => api.get("/admin/customers").then((r) => setRows(r.data));
  useEffect(() => { refresh(); }, []);

  const openDetail = async (c) => {
    setDetail({ ...c });
    const [o, a] = await Promise.all([
      api.get(`/admin/customers/${c.id}/orders`),
      api.get(`/admin/customers/${c.id}/addresses`),
    ]);
    setOrders(o.data); setAddresses(a.data);
  };
  const save = async () => {
    await api.put(`/admin/customers/${detail.id}`, { name: detail.name, email: detail.email, wallet: parseFloat(detail.wallet) || 0, points: parseInt(detail.points, 10) || 0, status: detail.status });
    toast.success("Saved"); setDetail(null); refresh();
  };
  const del = async (id) => { if (!window.confirm("Permanently delete customer?")) return; await api.delete(`/admin/customers/${id}`); refresh(); };
  const disable = async (c) => { await api.put(`/admin/customers/${c.id}`, { status: c.status === "disabled" ? "active" : "disabled" }); refresh(); };

  return (
    <div>
      <PageHeader title="Customers" subtitle="Manage shoppers, wallet, reward points and orders." />
      <DataTable rows={rows} searchKeys={["name", "email"]} testIdPrefix="cust-row" columns={[
        { key: "name", header: "Customer", sortable: true, render: (r) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white flex items-center justify-center text-xs font-bold">{r.name?.[0]}</div>
            <div><div className="font-medium">{r.name}</div><div className="text-[11px] text-[#78716C]">{r.email}</div></div>
          </div>
        )},
        { key: "wallet", header: "Wallet", render: (r) => rupee(r.wallet || 0) },
        { key: "points", header: "Points", render: (r) => r.points || 0 },
        { key: "order_count", header: "Orders", sortable: true },
        { key: "status", header: "Status", render: (r) => (
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${r.status === "disabled" ? "bg-[#991B1B]/10 text-[#991B1B]" : "bg-[#40916C]/10 text-[#40916C]"}`}>{r.status || "active"}</span>
        )},
        { key: "actions", header: "", render: (r) => (
          <div className="flex gap-1 justify-end">
            <button className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => openDetail(r)}><Pencil className="w-4 h-4" /></button>
            <button className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => disable(r)} title="Toggle disable"><Ban className="w-4 h-4" /></button>
            <button className="p-1.5 rounded hover:bg-[#F4EFE6] text-[#991B1B]" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></button>
          </div>
        )},
      ]} />

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          {detail && (
            <>
              <DialogHeader><DialogTitle>{detail.name}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Name" value={detail.name} onChange={(e) => setDetail({ ...detail, name: e.target.value })} />
                <Input placeholder="Email" value={detail.email} onChange={(e) => setDetail({ ...detail, email: e.target.value })} />
                <Input type="number" placeholder="Wallet" value={detail.wallet || 0} onChange={(e) => setDetail({ ...detail, wallet: e.target.value })} />
                <Input type="number" placeholder="Points" value={detail.points || 0} onChange={(e) => setDetail({ ...detail, points: e.target.value })} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase text-[#78716C] tracking-widest mb-2">Recent orders ({orders.length})</div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {orders.slice(0, 10).map((o) => (
                      <div key={o.id} className="text-sm flex justify-between py-1 border-b border-[#F4EFE6]">
                        <span className="font-mono text-[11px]">#{o.id.slice(0,8).toUpperCase()}</span>
                        <span>{rupee(o.total)}</span>
                      </div>
                    ))}
                    {orders.length === 0 && <div className="text-xs text-[#78716C]">No orders yet</div>}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase text-[#78716C] tracking-widest mb-2">Addresses ({addresses.length})</div>
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {addresses.map((a) => (
                      <div key={a.id} className="text-xs p-2 rounded bg-[#F4EFE6]">
                        <div className="font-medium">{a.name}</div>
                        {a.line1}, {a.city} · {a.phone}
                      </div>
                    ))}
                    {addresses.length === 0 && <div className="text-xs text-[#78716C]">No addresses saved</div>}
                  </div>
                </div>
              </div>
              <DialogFooter><Button onClick={save} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Save</Button></DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
