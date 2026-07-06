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

export default function AdminBlogs() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({ slug: "", title: "", excerpt: "", content: "", cover: "", tags: [], author: "", status: "draft" });
  const refresh = () => api.get("/admin/blogs").then((r) => setRows(r.data));
  useEffect(() => { refresh(); }, []);
  const openNew = () => { setEditing(null); setF({ slug: "", title: "", excerpt: "", content: "", cover: "", tags: [], author: "", status: "draft" }); setOpen(true); };
  const openEdit = (r) => { setEditing(r.id); setF({ ...r, tags: r.tags || [] }); setOpen(true); };
  const save = async () => {
    const body = { ...f, slug: f.slug || f.title.toLowerCase().replace(/\s+/g, "-") };
    if (editing) await api.put(`/admin/blogs/${editing}`, body); else await api.post("/admin/blogs", body);
    toast.success("Saved"); setOpen(false); refresh();
  };
  const del = async (id) => { if (!window.confirm("Delete blog post?")) return; await api.delete(`/admin/blogs/${id}`); refresh(); };

  return (
    <div>
      <PageHeader title="Blogs" subtitle="Content marketing engine."
        actions={<Button onClick={openNew} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Plus className="w-4 h-4 mr-1" />New post</Button>} />
      <DataTable rows={rows} searchKeys={["title", "slug", "author"]} testIdPrefix="blog-row" columns={[
        { key: "title", header: "Post", sortable: true, render: (r) => (
          <div className="flex items-center gap-3">
            {r.cover ? <img src={r.cover} className="w-12 h-8 rounded object-cover" alt="" /> : <div className="w-12 h-8 rounded bg-[#F4EFE6]" />}
            <div><div className="font-medium">{r.title}</div><div className="text-[11px] text-[#78716C]">/{r.slug}</div></div>
          </div>
        )},
        { key: "author", header: "Author" },
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
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} blog post</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input placeholder="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
            <Input placeholder="Slug" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />
            <Input placeholder="Author" value={f.author} onChange={(e) => setF({ ...f, author: e.target.value })} />
            <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["draft", "published"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Input className="col-span-2" placeholder="Cover image URL" value={f.cover} onChange={(e) => setF({ ...f, cover: e.target.value })} />
            <Textarea className="col-span-2" placeholder="Excerpt" value={f.excerpt} onChange={(e) => setF({ ...f, excerpt: e.target.value })} />
            <Textarea className="col-span-2" placeholder="Content (markdown)" rows={10} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} />
            <Input className="col-span-2" placeholder="Tags (comma separated)" value={(f.tags || []).join(", ")} onChange={(e) => setF({ ...f, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
          </div>
          <DialogFooter><Button onClick={save} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
