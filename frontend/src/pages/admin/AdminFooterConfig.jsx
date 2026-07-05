import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Plus, Trash2 } from "lucide-react";
import PageHeader from "./components/PageHeader";

export default function AdminFooter() {
  const [f, setF] = useState(null);
  useEffect(() => { api.get("/admin/settings/footer").then((r) => setF(r.data)); }, []);
  const save = async () => { await api.put("/admin/settings/footer", f); toast.success("Footer saved"); };
  if (!f) return <div className="p-10 text-center text-[#78716C]">Loading…</div>;

  const addColumn = () => setF({ ...f, columns: [...(f.columns || []), { id: crypto.randomUUID(), title: "New column", links: [] }] });
  const updateColumn = (i, patch) => setF({ ...f, columns: f.columns.map((c, ix) => ix === i ? { ...c, ...patch } : c) });
  const removeColumn = (i) => setF({ ...f, columns: f.columns.filter((_, ix) => ix !== i) });
  const addLink = (i) => updateColumn(i, { links: [...(f.columns[i].links || []), { label: "Link", url: "/" }] });
  const updateLink = (i, j, patch) => updateColumn(i, { links: f.columns[i].links.map((l, ix) => ix === j ? { ...l, ...patch } : l) });
  const removeLink = (i, j) => updateColumn(i, { links: f.columns[i].links.filter((_, ix) => ix !== j) });

  const addSocial = () => setF({ ...f, socials: [...(f.socials || []), { platform: "instagram", url: "" }] });
  const addPolicy = () => setF({ ...f, policies: [...(f.policies || []), { label: "Policy", url: "/" }] });

  return (
    <div>
      <PageHeader title="Footer Configuration" subtitle="Columns, socials, newsletter, and policy links."
        actions={<Button onClick={save} data-testid="footer-save-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Save className="w-4 h-4 mr-1" />Save</Button>} />

      <div className="grid gap-4">
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-[#78716C] mb-3">Identity</div>
          <div className="grid grid-cols-2 gap-3">
            <Input className="col-span-2" placeholder="Logo URL" value={f.logo} onChange={(e) => setF({ ...f, logo: e.target.value })} />
            <Textarea className="col-span-2" placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
            <Input className="col-span-2" placeholder="Copyright text" value={f.copyright} onChange={(e) => setF({ ...f, copyright: e.target.value })} />
            <label className="col-span-2 text-sm inline-flex items-center gap-2"><input type="checkbox" checked={f.show_newsletter} onChange={(e) => setF({ ...f, show_newsletter: e.target.checked })} /> Show newsletter signup</label>
          </div>
        </div>

        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-widest text-[#78716C]">Columns</div>
            <Button size="sm" variant="outline" onClick={addColumn} className="rounded-full"><Plus className="w-3 h-3 mr-1" />Add column</Button>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {(f.columns || []).map((col, i) => (
              <div key={col.id} className="border border-[#E7E5E4] rounded-xl p-3">
                <div className="flex items-center gap-2">
                  <Input className="h-8" value={col.title} onChange={(e) => updateColumn(i, { title: e.target.value })} />
                  <button className="p-1.5 rounded hover:bg-[#F4EFE6] text-[#991B1B]" onClick={() => removeColumn(i)}><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="mt-2 space-y-2">
                  {(col.links || []).map((lnk, j) => (
                    <div key={j} className="grid grid-cols-12 gap-1">
                      <Input className="col-span-5 h-8" placeholder="Label" value={lnk.label} onChange={(e) => updateLink(i, j, { label: e.target.value })} />
                      <Input className="col-span-6 h-8" placeholder="URL" value={lnk.url} onChange={(e) => updateLink(i, j, { url: e.target.value })} />
                      <button className="col-span-1 p-1 text-[#991B1B]" onClick={() => removeLink(i, j)}><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                  <Button size="sm" variant="outline" onClick={() => addLink(i)} className="h-7 text-xs">+ Add link</Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-[#78716C]">Social links</div>
              <Button size="sm" variant="outline" onClick={addSocial} className="rounded-full"><Plus className="w-3 h-3 mr-1" />Add</Button>
            </div>
            <div className="mt-2 space-y-2">
              {(f.socials || []).map((s, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <Input className="col-span-4 h-8" placeholder="platform" value={s.platform} onChange={(e) => setF({ ...f, socials: f.socials.map((x, ix) => ix === i ? { ...x, platform: e.target.value } : x) })} />
                  <Input className="col-span-7 h-8" placeholder="URL" value={s.url} onChange={(e) => setF({ ...f, socials: f.socials.map((x, ix) => ix === i ? { ...x, url: e.target.value } : x) })} />
                  <button className="col-span-1 p-1 text-[#991B1B]" onClick={() => setF({ ...f, socials: f.socials.filter((_, ix) => ix !== i) })}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-[#78716C]">Policy links</div>
              <Button size="sm" variant="outline" onClick={addPolicy} className="rounded-full"><Plus className="w-3 h-3 mr-1" />Add</Button>
            </div>
            <div className="mt-2 space-y-2">
              {(f.policies || []).map((p, i) => (
                <div key={i} className="grid grid-cols-12 gap-2">
                  <Input className="col-span-5 h-8" placeholder="Label" value={p.label} onChange={(e) => setF({ ...f, policies: f.policies.map((x, ix) => ix === i ? { ...x, label: e.target.value } : x) })} />
                  <Input className="col-span-6 h-8" placeholder="URL" value={p.url} onChange={(e) => setF({ ...f, policies: f.policies.map((x, ix) => ix === i ? { ...x, url: e.target.value } : x) })} />
                  <button className="col-span-1 p-1 text-[#991B1B]" onClick={() => setF({ ...f, policies: f.policies.filter((_, ix) => ix !== i) })}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
