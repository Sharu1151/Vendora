import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "./components/DataTable";
import PageHeader from "./components/PageHeader";

export default function AdminBanners() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({ title: "", subtitle: "", image: "", link_type: "url", link_value: "", placement: "hero", active: true, starts_at: "", ends_at: "", order: 0 });
  const refresh = () => api.get("/admin/banners").then((r) => setRows(r.data));
  useEffect(() => { refresh(); }, []);
  const openNew = () => { setEditing(null); setF({ title: "", subtitle: "", image: "", link_type: "url", link_value: "", placement: "hero", active: true, starts_at: "", ends_at: "", order: 0 }); setOpen(true); };
  const openEdit = (r) => { setEditing(r.id); setF({ ...r }); setOpen(true); };
  const save = async () => {
    const body = { ...f, order: parseInt(f.order, 10) || 0 };
    if (editing) await api.put(`/admin/banners/${editing}`, body); else await api.post("/admin/banners", body);
    toast.success("Saved"); setOpen(false); refresh();
  };
  const del = async (id) => { if (!window.confirm("Delete banner?")) return; await api.delete(`/admin/banners/${id}`); refresh(); };

  return (
    <div>
      <PageHeader title="Banners" subtitle="Schedule and link storefront banners."
        actions={<Button onClick={openNew} data-testid="banner-new-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Plus className="w-4 h-4 mr-1" />New banner</Button>} />
      <DataTable rows={rows} searchKeys={["title", "placement"]} testIdPrefix="banner-row" columns={[
        { key: "image", header: "Preview", render: (r) => r.image ? <img src={r.image} className="w-24 h-12 rounded object-cover" alt="" /> : "—" },
        { key: "title", header: "Title", sortable: true },
        { key: "placement", header: "Placement" },
        { key: "link_type", header: "Link", render: (r) => `${r.link_type}: ${r.link_value || "—"}` },
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
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} banner</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input className="col-span-2" placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <Textarea className="col-span-2" placeholder="Subtitle" value={f.subtitle} onChange={(e) => setF({ ...f, subtitle: e.target.value })} />
            <Input className="col-span-2" placeholder="Image URL" value={f.image} onChange={(e) => setF({ ...f, image: e.target.value })} />
            <Select value={f.placement} onValueChange={(v) => setF({ ...f, placement: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["hero", "sidebar", "strip", "popup"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={f.link_type} onValueChange={(v) => setF({ ...f, link_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["url", "product", "category"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
            <Input className="col-span-2" placeholder="Link value (URL or ID)" value={f.link_value} onChange={(e) => setF({ ...f, link_value: e.target.value })} />
            <Input type="date" placeholder="Starts at" value={(f.starts_at || "").slice(0,10)} onChange={(e) => setF({ ...f, starts_at: e.target.value })} />
            <Input type="date" placeholder="Ends at" value={(f.ends_at || "").slice(0,10)} onChange={(e) => setF({ ...f, ends_at: e.target.value })} />
            <Input placeholder="Order" type="number" value={f.order} onChange={(e) => setF({ ...f, order: e.target.value })} />
            <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active</label>
          </div>
          <DialogFooter><Button onClick={save} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
