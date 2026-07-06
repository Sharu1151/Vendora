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

export default function AdminCms() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({ key: "custom", slug: "", title: "", content: "", seo_title: "", seo_description: "", status: "published" });
  const refresh = () => api.get("/admin/cms").then((r) => setRows(r.data));
  useEffect(() => { refresh(); }, []);
  const openNew = () => { setEditing(null); setF({ key: "custom", slug: "", title: "", content: "", seo_title: "", seo_description: "", status: "published" }); setOpen(true); };
  const openEdit = (r) => { setEditing(r.id); setF({ ...r }); setOpen(true); };
  const save = async () => {
    try {
      const body = { ...f, slug: f.slug || f.title.toLowerCase().replace(/\s+/g, "-") };
      if (editing) await api.put(`/admin/cms/${editing}`, body); else await api.post("/admin/cms", body);
      toast.success("Saved successfully"); setOpen(false); refresh();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Save failed");
    }
  };
  const del = async (id) => {
    if (!window.confirm("Delete page?")) return;
    try {
      await api.delete(`/admin/cms/${id}`);
      toast.success("Deleted successfully");
      refresh();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Delete failed");
    }
  };

  return (
    <div>
      <PageHeader title="CMS Pages" subtitle="About, Privacy, Terms, FAQ, and any custom pages."
        actions={<Button onClick={openNew} data-testid="cms-new-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Plus className="w-4 h-4 mr-1" />New page</Button>} />
      <DataTable rows={rows} searchKeys={["title", "key", "slug"]} testIdPrefix="cms-row" columns={[
        { key: "title", header: "Title", sortable: true, render: (r) => <div><div className="font-medium">{r.title}</div><div className="text-[11px] text-[#78716C]">/{r.slug}</div></div> },
        { key: "key", header: "Type" },
        { key: "status", header: "Status", render: (r) => (
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${r.status === "published" ? "bg-[#40916C]/10 text-[#40916C]" : "bg-[#78716C]/10 text-[#78716C]"}`}>{r.status}</span>
        )},
        { key: "actions", header: "", render: (r) => (
          <div className="flex gap-1 justify-end">
            <button className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></button>
            <button className="p-1.5 rounded hover:bg-[#F4EFE6] text-[#991B1B]" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></button>
          </div>
        )},
      ]} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} CMS page</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <Input placeholder="Slug" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />
            <Select value={f.key} onValueChange={(v) => setF({ ...f, key: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["about", "privacy", "terms", "refund", "shipping", "contact", "faq", "career", "help", "custom"].map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["draft", "published"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea className="col-span-2" placeholder="Content (markdown or HTML)" value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} rows={12} />
            <Input className="col-span-2" placeholder="SEO title" value={f.seo_title} onChange={(e) => setF({ ...f, seo_title: e.target.value })} />
            <Textarea className="col-span-2" placeholder="SEO description" value={f.seo_description} onChange={(e) => setF({ ...f, seo_description: e.target.value })} />
          </div>
          <DialogFooter><Button onClick={save} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
