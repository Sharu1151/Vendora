import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Save } from "lucide-react";
import PageHeader from "./components/PageHeader";

export default function AdminHeader() {
  const [f, setF] = useState(null);
  const [menus, setMenus] = useState([]);
  useEffect(() => {
    api.get("/admin/settings/header").then((r) => setF(r.data));
    api.get("/admin/menus").then((r) => setMenus(r.data));
  }, []);
  const save = async () => { await api.put("/admin/settings/header", f); toast.success("Header saved"); };
  if (!f) return <div className="p-10 text-center text-[#78716C]">Loading…</div>;
  const toggle = (k) => (e) => setF({ ...f, [k]: e.target.checked });
  return (
    <div>
      <PageHeader title="Header Configuration" subtitle="Announcement bar, header elements, and which menu drives navigation."
        actions={<Button onClick={save} data-testid="header-save-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Save className="w-4 h-4 mr-1" />Save</Button>} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-[#78716C] mb-3">Announcement bar</div>
          <div className="grid grid-cols-2 gap-3">
            <label className="col-span-2 inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={f.announcement.enabled} onChange={(e) => setF({ ...f, announcement: { ...f.announcement, enabled: e.target.checked } })} /> Enabled</label>
            <Input className="col-span-2" placeholder="Text" value={f.announcement.text} onChange={(e) => setF({ ...f, announcement: { ...f.announcement, text: e.target.value } })} />
            <Input placeholder="Link" value={f.announcement.link} onChange={(e) => setF({ ...f, announcement: { ...f.announcement, link: e.target.value } })} />
            <Input placeholder="BG color" value={f.announcement.bg} onChange={(e) => setF({ ...f, announcement: { ...f.announcement, bg: e.target.value } })} />
            <Input placeholder="FG color" value={f.announcement.fg} onChange={(e) => setF({ ...f, announcement: { ...f.announcement, fg: e.target.value } })} />
          </div>
        </div>

        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-[#78716C] mb-3">Header elements</div>
          {[
            ["show_search", "Search bar"], ["show_wishlist", "Wishlist icon"], ["show_cart", "Cart icon"],
            ["show_login", "Login button"], ["show_language", "Language selector"], ["show_currency", "Currency selector"],
            ["contact_number_visible", "Contact number in topbar"],
          ].map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-sm py-1.5">
              <input type="checkbox" checked={!!f[k]} onChange={toggle(k)} /> {l}
            </label>
          ))}
        </div>

        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5 lg:col-span-2">
          <div className="text-[10px] uppercase tracking-widest text-[#78716C] mb-3">Primary navigation menu</div>
          <select value={f.menu_id || ""} onChange={(e) => setF({ ...f, menu_id: e.target.value })} className="border border-[#E7E5E4] rounded-lg p-2 text-sm">
            <option value="">— no menu selected —</option>
            {menus.filter((m) => m.location === "header").map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
}
