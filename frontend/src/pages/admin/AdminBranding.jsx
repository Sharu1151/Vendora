import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Upload } from "lucide-react";
import PageHeader from "./components/PageHeader";

const SectionCard = ({ title, children }) => (
  <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5">
    <div className="text-[10px] uppercase tracking-widest text-[#78716C]">{title}</div>
    <div className="mt-3 grid grid-cols-2 gap-3">{children}</div>
  </div>
);

const ColorInput = ({ label, value, onChange }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1">
      <div className="text-xs text-[#78716C] mb-1">{label}</div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono text-sm" />
    </div>
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-10 h-10 rounded border border-[#E7E5E4] cursor-pointer mt-4" />
  </div>
);

export default function AdminBranding() {
  const [store, setStore] = useState(null);
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    api.get("/admin/settings/store").then((r) => setStore(r.data));
    api.get("/admin/settings/theme").then((r) => setTheme(r.data));
  }, []);

  const upload = async (field) => {
    return new Promise((res) => {
      const input = document.createElement("input");
      input.type = "file"; input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0]; if (!file) return res();
        const fd = new FormData(); fd.append("file", file); fd.append("folder", "branding");
        const { data } = await api.post("/admin/media/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
        const BACKEND = process.env.REACT_APP_BACKEND_URL;
        setStore((s) => ({ ...s, [field]: `${BACKEND}${data.url}` }));
        toast.success("Uploaded"); res();
      };
      input.click();
    });
  };

  const saveStore = async () => { await api.put("/admin/settings/store", store); toast.success("Branding saved"); };
  const saveTheme = async () => { await api.put("/admin/settings/theme", theme); toast.success("Theme saved"); };

  if (!store || !theme) return <div className="p-10 text-center text-[#78716C]">Loading…</div>;

  const LogoField = ({ field, label }) => (
    <div>
      <div className="text-xs text-[#78716C] mb-1">{label}</div>
      <div className="flex gap-2 items-center">
        <Input value={store[field] || ""} onChange={(e) => setStore({ ...store, [field]: e.target.value })} placeholder="URL" />
        <Button variant="outline" size="sm" onClick={() => upload(field)} className="h-10"><Upload className="w-4 h-4" /></Button>
      </div>
      {store[field] && <img src={store[field]} className="h-10 mt-2 rounded bg-[#F4EFE6] object-contain" alt="" />}
    </div>
  );

  return (
    <div>
      <PageHeader title="Branding & Theme" subtitle="Logos, favicons, colors, fonts and layout controls — all editable, no code."
        actions={<>
          <Button onClick={saveStore} variant="outline" className="rounded-full"><Save className="w-4 h-4 mr-1" />Save branding</Button>
          <Button onClick={saveTheme} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]" data-testid="branding-save-theme"><Save className="w-4 h-4 mr-1" />Save theme</Button>
        </>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Identity">
          <Input className="col-span-2" placeholder="Store name" value={store.name} onChange={(e) => setStore({ ...store, name: e.target.value })} data-testid="branding-store-name" />
          <Input className="col-span-2" placeholder="Tagline" value={store.tagline} onChange={(e) => setStore({ ...store, tagline: e.target.value })} />
          <Input className="col-span-2" placeholder="Company legal name" value={store.company_name} onChange={(e) => setStore({ ...store, company_name: e.target.value })} />
          <Input placeholder="GST number" value={store.gst_number} onChange={(e) => setStore({ ...store, gst_number: e.target.value })} />
          <Input placeholder="Footer copyright" value={store.footer_copyright} onChange={(e) => setStore({ ...store, footer_copyright: e.target.value })} />
        </SectionCard>

        <SectionCard title="Contact">
          <Input placeholder="Email" value={store.email} onChange={(e) => setStore({ ...store, email: e.target.value })} />
          <Input placeholder="Phone" value={store.phone} onChange={(e) => setStore({ ...store, phone: e.target.value })} />
          <Input placeholder="WhatsApp" value={store.whatsapp} onChange={(e) => setStore({ ...store, whatsapp: e.target.value })} />
          <Input placeholder="Google Maps URL" value={store.google_maps} onChange={(e) => setStore({ ...store, google_maps: e.target.value })} />
          <Textarea className="col-span-2" placeholder="Address" value={store.address} onChange={(e) => setStore({ ...store, address: e.target.value })} />
        </SectionCard>

        <SectionCard title="Logos">
          <div className="col-span-2 grid grid-cols-2 gap-3">
            <LogoField field="logo" label="Main logo" />
            <LogoField field="logo_dark" label="Dark-mode logo" />
            <LogoField field="logo_mobile" label="Mobile logo" />
            <LogoField field="favicon" label="Favicon (32×32)" />
            <LogoField field="loading_logo" label="Loading logo" />
          </div>
        </SectionCard>

        <SectionCard title="Colors & radius">
          <ColorInput label="Primary" value={theme.primary} onChange={(v) => setTheme({ ...theme, primary: v })} />
          <ColorInput label="Secondary" value={theme.secondary} onChange={(v) => setTheme({ ...theme, secondary: v })} />
          <ColorInput label="Accent" value={theme.accent} onChange={(v) => setTheme({ ...theme, accent: v })} />
          <ColorInput label="Background" value={theme.background} onChange={(v) => setTheme({ ...theme, background: v })} />
          <ColorInput label="Text" value={theme.text} onChange={(v) => setTheme({ ...theme, text: v })} />
          <div><div className="text-xs text-[#78716C] mb-1">Button radius (px)</div><Input type="number" value={theme.button_radius} onChange={(e) => setTheme({ ...theme, button_radius: parseInt(e.target.value, 10) || 0 })} /></div>
          <div><div className="text-xs text-[#78716C] mb-1">Card radius (px)</div><Input type="number" value={theme.card_radius} onChange={(e) => setTheme({ ...theme, card_radius: parseInt(e.target.value, 10) || 0 })} /></div>
        </SectionCard>

        <SectionCard title="Typography & layout">
          <Input placeholder="Display font" value={theme.font_display} onChange={(e) => setTheme({ ...theme, font_display: e.target.value })} />
          <Input placeholder="Body font" value={theme.font_body} onChange={(e) => setTheme({ ...theme, font_body: e.target.value })} />
          <div className="col-span-2 flex flex-wrap gap-4">
            <label className="text-sm inline-flex items-center gap-2"><input type="checkbox" checked={theme.dark_mode} onChange={(e) => setTheme({ ...theme, dark_mode: e.target.checked })} /> Enable dark mode</label>
          </div>
          <div><div className="text-xs text-[#78716C] mb-1">Product layout</div><Input value={theme.product_layout} onChange={(e) => setTheme({ ...theme, product_layout: e.target.value })} /></div>
          <div><div className="text-xs text-[#78716C] mb-1">Category layout</div><Input value={theme.category_layout} onChange={(e) => setTheme({ ...theme, category_layout: e.target.value })} /></div>
        </SectionCard>
      </div>
    </div>
  );
}
