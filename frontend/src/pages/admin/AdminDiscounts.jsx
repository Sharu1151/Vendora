import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "./components/DataTable";
import PageHeader from "./components/PageHeader";

const TYPES = ["percentage", "fixed", "bogo", "bundle", "flash", "happy_hour", "category", "brand", "product", "automatic"];

export default function AdminDiscounts() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({ name: "", type: "percentage", value: 10, max_discount: 0, min_order: 0, code: "", target_ids: [], starts_at: "", ends_at: "", active: true, priority: 0 });
  const refresh = () => api.get("/admin/discounts").then((r) => setRows(r.data));
  useEffect(() => { refresh(); }, []);
  const openNew = () => { setEditing(null); setF({ name: "", type: "percentage", value: 10, max_discount: 0, min_order: 0, code: "", target_ids: [], starts_at: "", ends_at: "", active: true, priority: 0 }); setOpen(true); };
  const openEdit = (r) => { setEditing(r.id); setF({ ...r, target_ids: r.target_ids || [] }); setOpen(true); };
  const save = async () => {
    const body = { ...f, value: parseFloat(f.value) || 0, max_discount: parseFloat(f.max_discount) || 0, min_order: parseFloat(f.min_order) || 0, priority: parseInt(f.priority, 10) || 0, code: f.code || null };
    if (editing) await api.put(`/admin/discounts/${editing}`, body); else await api.post("/admin/discounts", body);
    toast.success("Saved"); setOpen(false); refresh();
  };
  const del = async (id) => { if (!window.confirm("Delete discount?")) return; await api.delete(`/admin/discounts/${id}`); refresh(); };
  return (
    <div>
      <PageHeader title="Discounts" subtitle="Every kind of discount, coupon, BOGO and flash sale — all in one place."
        actions={<Button onClick={openNew} data-testid="disc-new-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Plus className="w-4 h-4 mr-1" />New rule</Button>} />
      <DataTable rows={rows} searchKeys={["name", "code", "type"]} testIdPrefix="disc-row" columns={[
        { key: "name", header: "Rule", sortable: true },
        { key: "type", header: "Type", render: (r) => <span className="text-xs uppercase font-bold">{r.type}</span> },
        { key: "value", header: "Value", render: (r) => r.type === "percentage" ? `${r.value}%` : `₹${r.value}` },
        { key: "code", header: "Code", render: (r) => r.code ? <span className="font-mono bg-[#F4EFE6] px-2 py-0.5 rounded text-xs">{r.code}</span> : "—" },
        { key: "active", header: "Active", render: (r) => (
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${r.active ? "bg-[#40916C]/10 text-[#40916C]" : "bg-[#78716C]/10 text-[#78716C]"}`}>{r.active ? "live" : "off"}</span>
        )},
        { key: "actions", header: "", render: (r) => (
          <div className="flex gap-1 justify-end">
            <button className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></button>
            <button className="p-1.5 rounded hover:bg-[#F4EFE6] text-[#991B1B]" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></button>
          </div>
        )},
      ]} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} discount rule</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input className="col-span-2" placeholder="Rule name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Priority" type="number" value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })} />
            <Input placeholder="Discount value" type="number" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
            <Input placeholder="Max discount ₹" type="number" value={f.max_discount} onChange={(e) => setF({ ...f, max_discount: e.target.value })} />
            <Input placeholder="Min order ₹" type="number" value={f.min_order} onChange={(e) => setF({ ...f, min_order: e.target.value })} />
            <Input placeholder="Coupon code" value={f.code || ""} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} />
            <Input type="date" placeholder="Starts at" value={(f.starts_at || "").slice(0,10)} onChange={(e) => setF({ ...f, starts_at: e.target.value })} />
            <Input type="date" placeholder="Ends at" value={(f.ends_at || "").slice(0,10)} onChange={(e) => setF({ ...f, ends_at: e.target.value })} />
            <label className="col-span-2 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active</label>
          </div>
          <DialogFooter><Button onClick={save} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Save rule</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
