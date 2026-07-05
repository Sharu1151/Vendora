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

export default function AdminCategories() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({ name: "", slug: "", icon: "", image: "", banner: "", parent_id: "", sort_order: 0, seo_title: "", seo_description: "" });

  const refresh = () => api.get("/admin/categories").then((r) => setRows(r.data));
  useEffect(() => { refresh(); }, []);

  const openNew = () => { setEditing(null); setF({ name: "", slug: "", icon: "", image: "", banner: "", parent_id: "", sort_order: 0, seo_title: "", seo_description: "" }); setOpen(true); };
  const openEdit = (r) => { setEditing(r.id); setF({ ...r, parent_id: r.parent_id || "" }); setOpen(true); };

  const save = async () => {
    try {
      const body = { ...f, sort_order: parseInt(f.sort_order, 10) || 0, slug: f.slug || f.name.toLowerCase().replace(/\s+/g, "-"), parent_id: f.parent_id || null };
      if (editing) await api.put(`/admin/categories/${editing}`, body);
      else await api.post("/admin/categories", body);
      toast.success(editing ? "Updated" : "Created"); setOpen(false); refresh();
    } catch (e) { toast.error(e.response?.data?.detail || "Save failed"); }
  };

  const del = async (id) => { if (!window.confirm("Delete category?")) return; await api.delete(`/admin/categories/${id}`); toast.success("Deleted"); refresh(); };

  const columns = [
    { key: "name", header: "Category", sortable: true, render: (r) => (
      <div className="flex items-center gap-3">
        {r.image ? <img src={r.image} className="w-8 h-8 rounded object-cover" alt="" /> : <div className="w-8 h-8 rounded bg-[#F4EFE6]" />}
        <div><div className="font-medium">{r.name}</div><div className="text-[11px] text-[#78716C]">/{r.slug}</div></div>
      </div>
    )},
    { key: "parent_id", header: "Parent", render: (r) => rows.find((x) => x.id === r.parent_id)?.name || "—" },
    { key: "sort_order", header: "Order", sortable: true },
    { key: "actions", header: "", render: (r) => (
      <div className="flex gap-1 justify-end">
        <button className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => openEdit(r)} data-testid={`cat-edit-${r.id}`}><Pencil className="w-4 h-4" /></button>
        <button className="p-1.5 rounded hover:bg-[#F4EFE6] text-[#991B1B]" onClick={() => del(r.id)} data-testid={`cat-del-${r.id}`}><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader title="Categories" subtitle="Nested taxonomy for browsing your catalog."
        actions={<Button data-testid="cat-new-btn" onClick={openNew} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Plus className="w-4 h-4 mr-1" />New category</Button>} />
      <DataTable columns={columns} rows={rows} searchKeys={["name", "slug"]} testIdPrefix="cat-row" />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} category</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input className="col-span-2" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Input placeholder="Slug" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />
            <Input placeholder="Sort order" type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: e.target.value })} />
            <Input placeholder="Icon (lucide name)" value={f.icon} onChange={(e) => setF({ ...f, icon: e.target.value })} />
            <Select value={f.parent_id || "__none__"} onValueChange={(v) => setF({ ...f, parent_id: v === "__none__" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Parent category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— top level —</SelectItem>
                {rows.filter((r) => r.id !== editing).map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input className="col-span-2" placeholder="Image URL" value={f.image} onChange={(e) => setF({ ...f, image: e.target.value })} />
            <Input className="col-span-2" placeholder="Banner URL" value={f.banner} onChange={(e) => setF({ ...f, banner: e.target.value })} />
            <Input className="col-span-2" placeholder="SEO title" value={f.seo_title} onChange={(e) => setF({ ...f, seo_title: e.target.value })} />
            <Textarea className="col-span-2" placeholder="SEO description" value={f.seo_description} onChange={(e) => setF({ ...f, seo_description: e.target.value })} />
          </div>
          <DialogFooter>
            <Button onClick={save} data-testid="cat-save-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
