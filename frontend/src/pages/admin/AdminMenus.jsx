import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Save, GripVertical } from "lucide-react";
import DataTable from "./components/DataTable";
import PageHeader from "./components/PageHeader";

export default function AdminMenus() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({ name: "", location: "header", items: [] });

  const refresh = () => api.get("/admin/menus").then((r) => setRows(r.data));
  useEffect(() => { refresh(); }, []);

  const openNew = () => { setEditing(null); setF({ name: "", location: "header", items: [] }); setOpen(true); };
  const openEdit = (r) => { setEditing(r.id); setF({ ...r, items: r.items || [] }); setOpen(true); };
  const save = async () => {
    if (editing) await api.put(`/admin/menus/${editing}`, f); else await api.post("/admin/menus", f);
    toast.success("Saved"); setOpen(false); refresh();
  };
  const del = async (id) => { if (!window.confirm("Delete menu?")) return; await api.delete(`/admin/menus/${id}`); refresh(); };

  const addItem = () => setF((s) => ({ ...s, items: [...s.items, { id: crypto.randomUUID(), label: "New item", url: "/", icon: "", order: s.items.length, children: [], is_mega: false }] }));
  const updateItem = (i, patch) => setF((s) => ({ ...s, items: s.items.map((it, ix) => ix === i ? { ...it, ...patch } : it) }));
  const removeItem = (i) => setF((s) => ({ ...s, items: s.items.filter((_, ix) => ix !== i) }));

  return (
    <div>
      <PageHeader title="Menus" subtitle="Build header, footer and mobile menus visually. Supports nested items and mega menus."
        actions={<Button onClick={openNew} data-testid="menu-new-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Plus className="w-4 h-4 mr-1" />New menu</Button>} />
      <DataTable rows={rows} searchKeys={["name", "location"]} testIdPrefix="menu-row" columns={[
        { key: "name", header: "Menu", sortable: true },
        { key: "location", header: "Location" },
        { key: "items", header: "Items", render: (r) => (r.items || []).length },
        { key: "actions", header: "", render: (r) => (
          <div className="flex gap-1 justify-end">
            <button className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></button>
            <button className="p-1.5 rounded hover:bg-[#F4EFE6] text-[#991B1B]" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></button>
          </div>
        )},
      ]} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} menu</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Menu name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Select value={f.location} onValueChange={(v) => setF({ ...f, location: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["header", "footer", "mobile"].map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-[#78716C]">Items</div>
              <Button size="sm" variant="outline" onClick={addItem} className="rounded-full"><Plus className="w-3 h-3 mr-1" />Add item</Button>
            </div>
            <div className="mt-2 space-y-2">
              {f.items.map((it, i) => (
                <div key={it.id} className="grid grid-cols-12 gap-2 items-center bg-[#F4EFE6] rounded-lg p-2">
                  <GripVertical className="w-4 h-4 text-[#78716C] col-span-1" />
                  <Input className="col-span-4 h-8" placeholder="Label" value={it.label} onChange={(e) => updateItem(i, { label: e.target.value })} />
                  <Input className="col-span-4 h-8" placeholder="URL" value={it.url} onChange={(e) => updateItem(i, { url: e.target.value })} />
                  <label className="col-span-2 text-xs inline-flex items-center gap-1"><input type="checkbox" checked={it.is_mega} onChange={(e) => updateItem(i, { is_mega: e.target.checked })} /> Mega</label>
                  <button className="col-span-1 p-1 rounded hover:bg-white text-[#991B1B]" onClick={() => removeItem(i)}><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              {f.items.length === 0 && <div className="text-sm text-[#78716C] text-center py-3">No items yet</div>}
            </div>
          </div>
          <DialogFooter><Button onClick={save} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Save className="w-4 h-4 mr-1" />Save menu</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
