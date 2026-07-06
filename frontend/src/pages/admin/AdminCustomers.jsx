import React, { useEffect, useState } from "react";
import { api, rupee } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Pencil, Trash2, Ban, User, Plus } from "lucide-react";
import DataTable from "./components/DataTable";
import PageHeader from "./components/PageHeader";

export default function AdminCustomers() {
  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null);
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [editingAddress, setEditingAddress] = useState(null);

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

  const refreshCustomerAddresses = async () => {
    const a = await api.get(`/admin/customers/${detail.id}/addresses`);
    setAddresses(a.data);
  };

  const save = async () => {
    await api.put(`/admin/customers/${detail.id}`, { name: detail.name, email: detail.email, wallet: parseFloat(detail.wallet) || 0, points: parseInt(detail.points, 10) || 0, status: detail.status });
    toast.success("Saved"); setDetail(null); setEditingAddress(null); refresh();
  };

  const del = async (id) => { if (!window.confirm("Permanently delete customer?")) return; await api.delete(`/admin/customers/${id}`); refresh(); };
  const disable = async (c) => { await api.put(`/admin/customers/${c.id}`, { status: c.status === "disabled" ? "active" : "disabled" }); refresh(); };

  const handleSaveAddress = async () => {
    try {
      if (editingAddress.id) {
        await api.put(`/admin/customers/${detail.id}/addresses/${editingAddress.id}`, editingAddress);
        toast.success("Address updated");
      } else {
        await api.post(`/admin/customers/${detail.id}/addresses`, editingAddress);
        toast.success("Address added");
      }
      setEditingAddress(null);
      await refreshCustomerAddresses();
    } catch {
      toast.error("Failed to save address");
    }
  };

  const handleDeleteAddress = async (aid) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await api.delete(`/admin/customers/${detail.id}/addresses/${aid}`);
      toast.success("Address deleted");
      await refreshCustomerAddresses();
    } catch {
      toast.error("Failed to delete address");
    }
  };

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

      <Dialog open={!!detail} onOpenChange={(v) => { if (!v) { setDetail(null); setEditingAddress(null); } }}>
        <DialogContent className="max-w-2xl">
          {detail && (
            <>
              <DialogHeader><DialogTitle>{detail.name}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Name" value={detail.name} onChange={(e) => setDetail({ ...detail, name: e.target.value })} />
                <Input placeholder="Email" value={detail.email} onChange={(e) => setDetail({ ...detail, email: e.target.value })} />
                <Input type="number" placeholder="Wallet" value={detail.wallet || 0} onChange={(e) => setDetail({ ...detail, wallet: e.target.value })} />
                <Input type="number" placeholder="Points" value={detail.points || 0} onChange={(e) => setDetail({ ...detail, points: e.target.value })} />
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase text-[#78716C] tracking-widest mb-2">Recent orders ({orders.length})</div>
                  <div className="max-h-64 overflow-y-auto space-y-1">
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
                  {editingAddress ? (
                    <div className="bg-[#F4EFE6] p-3 rounded space-y-2">
                      <div className="text-[10px] uppercase font-bold text-[#1C1917] mb-1">
                        {editingAddress.id ? "Edit Customer Address" : "Add Customer Address"}
                      </div>
                      <Input placeholder="Label (Home/Work)" className="h-8 text-xs" value={editingAddress.name} onChange={(e) => setEditingAddress({ ...editingAddress, name: e.target.value })} />
                      <Input placeholder="Phone" className="h-8 text-xs" value={editingAddress.phone} onChange={(e) => setEditingAddress({ ...editingAddress, phone: e.target.value })} />
                      <Input placeholder="Line 1" className="h-8 text-xs" value={editingAddress.line1} onChange={(e) => setEditingAddress({ ...editingAddress, line1: e.target.value })} />
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="City" className="h-8 text-xs" value={editingAddress.city} onChange={(e) => setEditingAddress({ ...editingAddress, city: e.target.value })} />
                        <Input placeholder="State" className="h-8 text-xs" value={editingAddress.state} onChange={(e) => setEditingAddress({ ...editingAddress, state: e.target.value })} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input placeholder="Pincode" className="h-8 text-xs" value={editingAddress.pincode} onChange={(e) => setEditingAddress({ ...editingAddress, pincode: e.target.value })} />
                        <div className="flex items-center gap-1 text-[10px]">
                          <input type="checkbox" id="adm-is-def" checked={editingAddress.is_default} onChange={(e) => setEditingAddress({ ...editingAddress, is_default: e.target.checked })} />
                          <label htmlFor="adm-is-def" className="cursor-pointer font-medium">Default</label>
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-1">
                        <button className="text-[10px] uppercase font-bold px-2 py-1 text-[#78716C]" onClick={() => setEditingAddress(null)}>Cancel</button>
                        <button className="text-[10px] uppercase font-bold px-3 py-1 bg-[#1B4332] text-white rounded" onClick={handleSaveAddress}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-[10px] uppercase text-[#78716C] tracking-widest">Addresses ({addresses.length})</div>
                        <button className="text-[10px] uppercase font-bold text-[#1B4332] flex items-center gap-0.5 hover:underline" onClick={() => setEditingAddress({ name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India", is_default: false })}><Plus className="w-3 h-3" /> Add</button>
                      </div>
                      <div className="max-h-56 overflow-y-auto space-y-1">
                        {addresses.map((a) => (
                          <div key={a.id} className="text-xs p-2 rounded bg-[#F4EFE6] flex items-center justify-between group">
                            <div>
                              <div className="font-medium flex items-center gap-1">
                                {a.name}
                                {a.is_default && <span className="bg-[#40916C]/15 text-[#40916C] text-[8px] uppercase font-bold px-1 rounded">Default</span>}
                              </div>
                              <div className="text-[10px] text-[#78716C]">{a.line1}, {a.city} · {a.phone}</div>
                            </div>
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="p-0.5 text-[#1B4332] hover:bg-black/5 rounded" onClick={() => setEditingAddress({ ...a })}><Pencil className="w-3 h-3" /></button>
                              <button className="p-0.5 text-[#991B1B] hover:bg-black/5 rounded" onClick={() => handleDeleteAddress(a.id)}><Trash2 className="w-3 h-3" /></button>
                            </div>
                          </div>
                        ))}
                        {addresses.length === 0 && <div className="text-xs text-[#78716C]">No addresses saved</div>}
                      </div>
                    </>
                  )}
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
