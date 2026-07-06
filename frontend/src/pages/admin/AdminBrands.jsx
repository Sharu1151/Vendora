import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
import DataTable from "./components/DataTable";
import PageHeader from "./components/PageHeader";

export default function AdminBrands() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({ name: "", slug: "", logo: "", banner: "", description: "", status: "active" });

  const refresh = () => api.get("/admin/brands").then((r) => setRows(r.data));
  useEffect(() => { refresh(); }, []);

  const openNew = () => { setEditing(null); setF({ name: "", slug: "", logo: "", banner: "", description: "", status: "active" }); setOpen(true); };
  const openEdit = (r) => { setEditing(r.id); setF({ ...r }); setOpen(true); };
  const save = async () => {
    try {
      const body = { ...f, slug: f.slug || f.name.toLowerCase().replace(/\s+/g, "-") };
      if (editing) await api.put(`/admin/brands/${editing}`, body); else await api.post("/admin/brands", body);
      toast.success(editing ? "Updated" : "Created"); setOpen(false); refresh();
    } catch (e) { toast.error(e.response?.data?.detail || "Save failed"); }
  };
  const del = async (id) => { if (!window.confirm("Delete brand?")) return; await api.delete(`/admin/brands/${id}`); toast.success("Deleted"); refresh(); };

  return (
    <div>
      <PageHeader title="Brands" subtitle="Manage the brands that appear across your storefront."
        actions={<Button onClick={openNew} data-testid="brand-new-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Plus className="w-4 h-4 mr-1" />New brand</Button>} />
      <DataTable
        rows={rows}
        searchKeys={["name", "slug"]}
        testIdPrefix="brand-row"
        columns={[
          { key: "name", header: "Brand", sortable: true, render: (r) => (
            <div className="flex items-center gap-3">
              {r.logo ? <img src={r.logo} className="w-8 h-8 rounded object-cover" alt="" /> : <div className="w-8 h-8 rounded bg-[#F4EFE6]" />}
              <div><div className="font-medium">{r.name}</div><div className="text-[11px] text-[#78716C]">/{r.slug}</div></div>
            </div>
          )},
          { key: "status", header: "Status", render: (r) => (
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${r.status === "active" ? "bg-[#40916C]/10 text-[#40916C]" : "bg-[#78716C]/10 text-[#78716C]"}`}>{r.status}</span>
          )},
          { key: "actions", header: "", render: (r) => (
            <div className="flex gap-1 justify-end">
              <button className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></button>
              <button className="p-1.5 rounded hover:bg-[#F4EFE6] text-[#991B1B]" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></button>
            </div>
          )},
        ]}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} brand</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input className="col-span-2" placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Input placeholder="Slug" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />
            <Input placeholder="Status" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} />
            <Input className="col-span-2" placeholder="Logo URL" value={f.logo} onChange={(e) => setF({ ...f, logo: e.target.value })} />
            <Input className="col-span-2" placeholder="Banner URL" value={f.banner} onChange={(e) => setF({ ...f, banner: e.target.value })} />
            <Textarea className="col-span-2" placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
          </div>
          <DialogFooter><Button onClick={save} data-testid="brand-save-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">{editing ? "Save" : "Create"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
