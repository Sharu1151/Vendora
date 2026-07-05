import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save } from "lucide-react";
import PageHeader from "./components/PageHeader";

const BUCKETS = [
  { key: "tax", label: "Taxes", fields: [{ k: "default_rate", label: "Default tax rate %" }, { k: "inclusive", label: "Prices are tax-inclusive (true/false)" }, { k: "gst_enabled", label: "Enable GST" }] },
  { key: "shipping", label: "Shipping", fields: [{ k: "free_over", label: "Free shipping above ₹" }, { k: "default_charge", label: "Default charge ₹" }, { k: "shiprocket_api", label: "Shiprocket API key" }, { k: "delhivery_api", label: "Delhivery API key" }] },
  { key: "payments", label: "Payments", fields: [{ k: "stripe_publishable", label: "Stripe publishable key" }, { k: "cod_enabled", label: "Enable COD" }, { k: "razorpay_key", label: "Razorpay key" }] },
  { key: "email", label: "Email", fields: [{ k: "provider", label: "Provider (sendgrid/mailgun/smtp)" }, { k: "api_key", label: "API key" }, { k: "from", label: "From email" }] },
  { key: "sms", label: "SMS", fields: [{ k: "provider", label: "Provider" }, { k: "api_key", label: "API key" }, { k: "sender_id", label: "Sender ID" }] },
  { key: "whatsapp", label: "WhatsApp", fields: [{ k: "provider", label: "Provider" }, { k: "api_key", label: "API key" }, { k: "phone_id", label: "Phone number ID" }] },
  { key: "analytics", label: "Analytics", fields: [{ k: "ga4_id", label: "Google Analytics 4 ID" }, { k: "gtm_id", label: "Google Tag Manager" }, { k: "fb_pixel", label: "Facebook Pixel ID" }] },
  { key: "seo", label: "SEO", fields: [{ k: "default_title", label: "Default meta title" }, { k: "default_description", label: "Default meta description" }, { k: "og_image", label: "Default OG image URL" }, { k: "robots", label: "robots.txt overrides" }] },
  { key: "integrations", label: "API Keys", fields: [{ k: "openai_key", label: "OpenAI key" }, { k: "cloudinary_url", label: "Cloudinary URL" }, { k: "maps_key", label: "Google Maps key" }] },
  { key: "social", label: "Social", fields: [{ k: "instagram", label: "Instagram URL" }, { k: "facebook", label: "Facebook URL" }, { k: "twitter", label: "Twitter URL" }, { k: "youtube", label: "YouTube URL" }] },
];

function BucketPanel({ bucket }) {
  const [state, setState] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get(`/admin/settings/${bucket.key}`).then((r) => { setState(r.data || {}); setLoading(false); });
  }, [bucket.key]);
  const save = async () => { await api.put(`/admin/settings/${bucket.key}`, state); toast.success(`${bucket.label} saved`); };
  if (loading) return <div className="p-6 text-sm text-[#78716C]">Loading…</div>;
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {bucket.fields.map((fld) => (
          <div key={fld.k}>
            <div className="text-xs text-[#78716C] mb-1">{fld.label}</div>
            <Input value={state[fld.k] || ""} onChange={(e) => setState((s) => ({ ...s, [fld.k]: e.target.value }))} data-testid={`setting-${bucket.key}-${fld.k}`} />
          </div>
        ))}
      </div>
      <Button onClick={save} className="mt-4 rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Save className="w-4 h-4 mr-1" />Save {bucket.label}</Button>
    </div>
  );
}

export default function AdminSettings() {
  return (
    <div>
      <PageHeader title="Settings" subtitle="System-wide configuration. Provider keys are stored server-side." />
      <Tabs defaultValue={BUCKETS[0].key}>
        <TabsList className="bg-[#F4EFE6] rounded-full p-1 h-auto flex flex-wrap">
          {BUCKETS.map((b) => <TabsTrigger key={b.key} value={b.key} className="rounded-full px-4 data-[state=active]:bg-white">{b.label}</TabsTrigger>)}
        </TabsList>
        {BUCKETS.map((b) => (
          <TabsContent key={b.key} value={b.key} className="mt-6 bg-white border border-[#E7E5E4] rounded-2xl p-6">
            <BucketPanel bucket={b} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
