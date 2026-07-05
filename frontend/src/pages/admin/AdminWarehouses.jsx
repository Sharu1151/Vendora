import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "./components/DataTable";
import PageHeader from "./components/PageHeader";

export default function AdminWarehouses() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({ name: "", address: "", city: "", is_default: false });
  const refresh = () => api.get("/admin/warehouses").then((r) => setRows(r.data));
  useEffect(() => { refresh(); }, []);
  const openNew = () => { setEditing(null); setF({ name: "", address: "", city: "", is_default: false }); setOpen(true); };
  const openEdit = (r) => { setEditing(r.id); setF({ ...r }); setOpen(true); };
  const save = async () => {
    if (editing) await api.put(`/admin/warehouses/${editing}`, f); else await api.post("/admin/warehouses", f);
    toast.success("Saved"); setOpen(false); refresh();
  };
  const del = async (id) => { if (!window.confirm("Delete warehouse?")) return; await api.delete(`/admin/warehouses/${id}`); toast.success("Deleted"); refresh(); };
  return (
    <div>
      <PageHeader title="Warehouses" subtitle="Physical fulfillment locations."
        actions={<Button onClick={openNew} data-testid="wh-new-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Plus className="w-4 h-4 mr-1" />New warehouse</Button>} />
      <DataTable rows={rows} searchKeys={["name", "city"]} testIdPrefix="wh-row" columns={[
        { key: "name", header: "Name", sortable: true },
        { key: "city", header: "City" },
        { key: "address", header: "Address" },
        { key: "is_default", header: "Default", render: (r) => r.is_default ? "✓" : "" },
        { key: "actions", header: "", render: (r) => (
          <div className="flex gap-1 justify-end">
            <button className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></button>
            <button className="p-1.5 rounded hover:bg-[#F4EFE6] text-[#991B1B]" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></button>
          </div>
        )},
      ]} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} warehouse</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input className="col-span-2" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Input placeholder="City" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={f.is_default} onChange={(e) => setF({ ...f, is_default: e.target.checked })} /> Default warehouse</label>
            <Input className="col-span-2" placeholder="Address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
          </div>
          <DialogFooter><Button onClick={save} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
