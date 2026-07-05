import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import DataTable from "./components/DataTable";
import PageHeader from "./components/PageHeader";

export default function AdminRoles() {
  const [rows, setRows] = useState([]);
  const [perms, setPerms] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({ name: "", key: "", permissions: [], is_system: false });

  const refresh = () => api.get("/admin/roles").then((r) => setRows(r.data));
  useEffect(() => {
    refresh();
    api.get("/admin/permissions").then((r) => setPerms(r.data));
  }, []);

  const openNew = () => { setEditing(null); setF({ name: "", key: "", permissions: [], is_system: false }); setOpen(true); };
  const openEdit = (r) => { setEditing(r.id); setF({ ...r, permissions: r.permissions || [] }); setOpen(true); };
  const save = async () => {
    if (editing) await api.put(`/admin/roles/${editing}`, f); else await api.post("/admin/roles", f);
    toast.success("Saved"); setOpen(false); refresh();
  };
  const del = async (id) => { if (!window.confirm("Delete role?")) return; try { await api.delete(`/admin/roles/${id}`); refresh(); } catch (e) { toast.error(e.response?.data?.detail || "Failed"); } };

  const togglePerm = (p) => setF({ ...f, permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p] });

  return (
    <div>
      <PageHeader title="Roles & Permissions" subtitle="Fine-grained RBAC — Super Admin, Admin, Manager, Seller, Staff, Support… or your own."
        actions={<Button onClick={openNew} data-testid="role-new-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Plus className="w-4 h-4 mr-1" />New role</Button>} />
      <DataTable rows={rows} searchKeys={["name", "key"]} testIdPrefix="role-row" columns={[
        { key: "name", header: "Role", render: (r) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1B4332]/10 flex items-center justify-center"><Shield className="w-4 h-4 text-[#1B4332]" /></div>
            <div><div className="font-medium">{r.name}</div><div className="text-[11px] text-[#78716C]">{r.key}{r.is_system && " · system"}</div></div>
          </div>
        )},
        { key: "permissions", header: "Permissions", render: (r) => `${(r.permissions || []).length} of ${perms.length}` },
        { key: "actions", header: "", render: (r) => (
          <div className="flex gap-1 justify-end">
            <button className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></button>
            {!r.is_system && <button className="p-1.5 rounded hover:bg-[#F4EFE6] text-[#991B1B]" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></button>}
          </div>
        )},
      ]} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} role</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Role name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            <Input placeholder="Key (e.g. manager)" value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })} />
          </div>
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-widest text-[#78716C] mb-2">Permissions</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {perms.map((p) => (
                <label key={p} className="text-xs inline-flex items-center gap-2 p-2 rounded-lg bg-[#F4EFE6] cursor-pointer">
                  <input type="checkbox" checked={f.permissions.includes(p)} onChange={() => togglePerm(p)} />
                  <span className="font-mono">{p}</span>
                </label>
              ))}
            </div>
          </div>
          <DialogFooter><Button onClick={save} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Save role</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
