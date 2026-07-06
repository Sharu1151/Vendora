import React, { useEffect, useState } from "react";
import { api, rupee } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Copy, Upload, Sparkles, Star } from "lucide-react";
import DataTable from "./components/DataTable";
import PageHeader from "./components/PageHeader";
import { API_BASE } from "@/lib/api";

const empty = () => ({
  name: "", slug: "", description: "", highlights: [], price: 0, mrp: 0, cost_price: 0, tax_pct: 0,
  category_id: "", brand: "", brand_id: "", sku: "", barcode: "", unit: "1 unit", stock: 100,
  min_qty: 1, max_qty: 20, weight: 0, dimensions: "", images: [""], videos: [], tags: [],
  variants: [], seo_title: "", seo_description: "", seo_keywords: "",
  is_featured: false, is_trending: false, is_flash_sale: false, status: "active", visibility: "public",
});

export default function AdminProducts() {
  const [rows, setRows] = useState([]);
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState(empty());
  const [aiLoading, setAi] = useState(false);

  const refresh = async () => {
    const [p, c, b] = await Promise.all([
      api.get("/products?limit=500"), api.get("/categories"), api.get("/admin/brands"),
    ]);
    setRows(p.data); setCats(c.data); setBrands(b.data);
  };
  useEffect(() => { refresh(); }, []);

  const openNew = () => { setEditing(null); setF(empty()); setOpen(true); };
  const openEdit = (r) => { setEditing(r.id); setF({ ...empty(), ...r, images: r.images?.length ? r.images : [""] }); setOpen(true); };

  const save = async () => {
    try {
      const body = { ...f, price: parseFloat(f.price) || 0, mrp: parseFloat(f.mrp) || 0, cost_price: parseFloat(f.cost_price) || 0, tax_pct: parseFloat(f.tax_pct) || 0, stock: parseInt(f.stock, 10) || 0 };
      if (editing) await api.put(`/admin/products/${editing}`, body);
      else await api.post("/admin/products", body);
      toast.success(editing ? "Updated" : "Created");
      setOpen(false); refresh();
    } catch (e) { toast.error(e.response?.data?.detail || "Save failed"); }
  };

  const del = async (id) => { if (!window.confirm("Delete this product?")) return; await api.delete(`/admin/products/${id}`); toast.success("Deleted"); refresh(); };
  const dup = async (id) => { await api.post(`/admin/products/${id}/duplicate`); toast.success("Duplicated"); refresh(); };

  const aiGen = async () => {
    if (!f.name) return toast.error("Enter name first");
    setAi(true);
    try {
      const c = cats.find((x) => x.id === f.category_id);
      const { data } = await api.post("/ai/describe", { name: f.name, category: c?.name || "", tags: f.tags });
      setF({ ...f, description: data.description, highlights: data.highlights || [] });
      toast.success("Generated");
    } catch { toast.error("AI failed"); }
    setAi(false);
  };

  const bulkDelete = async (ids, clear) => {
    if (!window.confirm(`Delete ${ids.length} products?`)) return;
    await api.post("/admin/products/bulk-delete", { ids });
    toast.success(`Deleted ${ids.length}`);
    clear(); refresh();
  };

  const exportCsv = () => {
    const t = localStorage.getItem("token");
    window.open(`${API_BASE}/admin/products/export.csv?token=${t}`, "_blank");
    // Trigger via fetch since GET needs auth header
    fetch(`${API_BASE}/admin/products/export.csv`, { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.blob())
      .then((b) => { const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "products.csv"; a.click(); URL.revokeObjectURL(u); });
  };

  const importCsv = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImporting(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const { data } = await api.post("/admin/products/import", fd, { headers: { "Content-Type": "multipart/form-data" } });
      toast.success(`Imported ${data.imported} product(s)${data.errors.length ? ` · ${data.errors.length} error(s)` : ""}`);
      refresh();
    } catch { toast.error("Import failed"); }
    setImporting(false); e.target.value = "";
  };

  const columns = [
    { key: "name", header: "Product", sortable: true, render: (r) => (
      <div className="flex items-center gap-3">
        <img src={r.images?.[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-[#F4EFE6]" />
        <div><div className="font-medium">{r.name}</div><div className="text-[11px] text-[#78716C]">{r.sku}</div></div>
      </div>
    )},
    { key: "category_name", header: "Category", sortable: true },
    { key: "price", header: "Price", sortable: true, render: (r) => <span className="font-medium">{rupee(r.price)}</span> },
    { key: "stock", header: "Stock", sortable: true, render: (r) => (
      <span className={r.stock <= 0 ? "text-[#991B1B] font-bold" : r.stock <= 10 ? "text-[#F4A261] font-medium" : ""}>{r.stock}</span>
    )},
    { key: "rating", header: "Rating", render: (r) => <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 fill-[#F4A261] text-[#F4A261]" />{r.rating || 0}</span> },
    { key: "status", header: "Status", render: (r) => (
      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${r.status === "active" ? "bg-[#40916C]/10 text-[#40916C]" : "bg-[#78716C]/10 text-[#78716C]"}`}>{r.status || "active"}</span>
    )},
    { key: "actions", header: "", render: (r) => (
      <div className="flex gap-1 justify-end">
        <button data-testid={`prod-edit-${r.id}`} className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></button>
        <button data-testid={`prod-dup-${r.id}`} className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => dup(r.id)}><Copy className="w-4 h-4" /></button>
        <button data-testid={`prod-del-${r.id}`} className="p-1.5 rounded hover:bg-[#F4EFE6] text-[#991B1B]" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle="Full catalog control — create, edit, duplicate, bulk import/export."
        actions={<>
          <label className="inline-flex">
            <input type="file" accept=".csv" onChange={importCsv} className="hidden" data-testid="prod-import-input" />
            <span className="inline-flex items-center gap-1 h-9 px-3 rounded-full border border-[#E7E5E4] hover:bg-[#F4EFE6] cursor-pointer text-sm">
              <Upload className="w-4 h-4" />{importing ? "Importing…" : "Import CSV"}
            </span>
          </label>
          <Button data-testid="prod-new-btn" onClick={openNew} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Plus className="w-4 h-4 mr-1" />New product</Button>
        </>}
      />

      <DataTable
        columns={columns}
        rows={rows}
        searchKeys={["name", "sku", "category_name", "brand"]}
        onExport={exportCsv}
        testIdPrefix="prod-row"
        bulkActions={(ids, clear) => (
          <Button size="sm" variant="outline" onClick={() => bulkDelete(ids, clear)} className="h-8 text-[#991B1B]">Delete selected</Button>
        )}
        pageSize={12}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit product" : "New product"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input data-testid="prod-name" placeholder="Product name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Input placeholder="Slug (auto)" value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} />
            <Select value={f.category_id} onValueChange={(v) => setF({ ...f, category_id: v })}>
              <SelectTrigger data-testid="prod-category"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={f.brand_id || ""} onValueChange={(v) => { setF({ ...f, brand_id: v, brand: brands.find((b) => b.id === v)?.name || f.brand }); }}>
              <SelectTrigger><SelectValue placeholder="Brand" /></SelectTrigger>
              <SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
            </Select>
            <Input placeholder="Selling Price ₹" type="number" value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} />
            <Input placeholder="MRP ₹" type="number" value={f.mrp} onChange={(e) => setF({ ...f, mrp: e.target.value })} />
            <Input placeholder="Cost price ₹" type="number" value={f.cost_price} onChange={(e) => setF({ ...f, cost_price: e.target.value })} />
            <Input placeholder="Tax %" type="number" value={f.tax_pct} onChange={(e) => setF({ ...f, tax_pct: e.target.value })} />
            <Input placeholder="SKU" value={f.sku} onChange={(e) => setF({ ...f, sku: e.target.value })} />
            <Input placeholder="Barcode" value={f.barcode} onChange={(e) => setF({ ...f, barcode: e.target.value })} />
            <Input placeholder="Unit (e.g. 1 kg)" value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} />
            <Input placeholder="Stock" type="number" value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} />
            <Input placeholder="Min qty" type="number" value={f.min_qty} onChange={(e) => setF({ ...f, min_qty: e.target.value })} />
            <Input placeholder="Max qty" type="number" value={f.max_qty} onChange={(e) => setF({ ...f, max_qty: e.target.value })} />
            <Input placeholder="Weight (kg)" type="number" value={f.weight} onChange={(e) => setF({ ...f, weight: e.target.value })} />
            <Input placeholder="Dimensions (LxWxH cm)" value={f.dimensions} onChange={(e) => setF({ ...f, dimensions: e.target.value })} />
            <Input className="col-span-2" placeholder="Main image URL" value={f.images?.[0] || ""} onChange={(e) => setF({ ...f, images: [e.target.value] })} />
            <Input className="col-span-2" placeholder="Tags (comma separated)" value={(f.tags || []).join(", ")} onChange={(e) => setF({ ...f, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} />
            <div className="col-span-2 relative">
              <Textarea data-testid="prod-description" placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} className="min-h-[100px]" />
              <Button size="sm" type="button" onClick={aiGen} disabled={aiLoading} className="absolute bottom-3 right-3 rounded-full bg-[#E07A5F] hover:bg-[#D96A4D] h-8">
                <Sparkles className="w-3 h-3 mr-1" />{aiLoading ? "Thinking…" : "AI Generate"}
              </Button>
            </div>
            <Input className="col-span-2" placeholder="SEO title" value={f.seo_title} onChange={(e) => setF({ ...f, seo_title: e.target.value })} />
            <Input className="col-span-2" placeholder="SEO description" value={f.seo_description} onChange={(e) => setF({ ...f, seo_description: e.target.value })} />
            <Input className="col-span-2" placeholder="SEO keywords" value={f.seo_keywords} onChange={(e) => setF({ ...f, seo_keywords: e.target.value })} />
            <div className="col-span-2 flex flex-wrap gap-4 text-sm mt-1">
              <label className="inline-flex gap-1.5 items-center"><input type="checkbox" checked={f.is_featured} onChange={(e) => setF({ ...f, is_featured: e.target.checked })} /> Featured</label>
              <label className="inline-flex gap-1.5 items-center"><input type="checkbox" checked={f.is_trending} onChange={(e) => setF({ ...f, is_trending: e.target.checked })} /> Trending</label>
              <label className="inline-flex gap-1.5 items-center"><input type="checkbox" checked={f.is_flash_sale} onChange={(e) => setF({ ...f, is_flash_sale: e.target.checked })} /> Flash sale</label>
              <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
                <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{["active", "draft", "archived"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={f.visibility} onValueChange={(v) => setF({ ...f, visibility: v })}>
                <SelectTrigger className="h-8 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>{["public", "hidden"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button data-testid="prod-save-btn" onClick={save} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">{editing ? "Save changes" : "Create product"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
