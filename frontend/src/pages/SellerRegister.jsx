import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Store, TrendingUp, ShieldCheck, Sparkles } from "lucide-react";

export default function SellerRegister() {
  const { setSession } = useApp();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    store_name: "",
    phone: "",
    description: "",
  });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/seller/register", form);
      localStorage.setItem("token", data.token);
      setSession(data.user);
      toast.success(`Welcome, ${data.user.name.split(" ")[0]}! Your seller account is ready.`);
      nav("/seller");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Registration failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[85vh] grid lg:grid-cols-2">
      <div className="hidden lg:flex relative overflow-hidden bg-[#1B4332] text-white flex-col justify-between p-12">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-[#E07A5F] flex items-center justify-center font-display font-black">M</div>
          <div className="font-display text-xl font-black tracking-tight">Mangalore Store · Sellers</div>
        </div>
        <div>
          <div className="overline text-white/70">Marketplace</div>
          <h1 className="mt-3 font-display font-black text-5xl leading-[1.05] tracking-tight max-w-md">Sell fresh. Grow big. Get paid weekly.</h1>
          <p className="mt-6 text-white/80 max-w-md">Join Coastal Farms Co., Konkan Spices, and dozens more brands using Mangalore Store to reach thousands of families across Karnataka.</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { icon: Store, label: "Zero setup fees" },
            { icon: TrendingUp, label: "Weekly payouts" },
            { icon: ShieldCheck, label: "Fair commissions" },
          ].map((v, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/10 backdrop-blur">
              <v.icon className="w-5 h-5 text-[#E07A5F]" />
              <div className="mt-2 text-sm font-medium">{v.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center p-8 bg-[#FDFBF7]">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#E07A5F] font-bold">
            <Sparkles className="w-4 h-4" /> Become a seller
          </div>
          <div className="mt-2 font-display font-black text-4xl tracking-tight">Open your store</div>
          <div className="text-[#78716C] mt-2">Takes 60 seconds. No credit card required.</div>

          <div className="mt-8 space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-[#78716C]">Your name</Label>
              <Input data-testid="seller-reg-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 h-12" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-[#78716C]">Store name</Label>
              <Input data-testid="seller-reg-store" required value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} className="mt-2 h-12" placeholder="e.g. Coastal Farms Co." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs uppercase tracking-widest text-[#78716C]">Email</Label>
                <Input data-testid="seller-reg-email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 h-12" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-widest text-[#78716C]">Phone</Label>
                <Input data-testid="seller-reg-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-2 h-12" placeholder="+91…" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-[#78716C]">Password</Label>
              <Input data-testid="seller-reg-password" required minLength={6} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="mt-2 h-12" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-[#78716C]">Store description (optional)</Label>
              <Textarea data-testid="seller-reg-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-2 min-h-[90px]" placeholder="Tell shoppers about your brand…" />
            </div>
            <Button data-testid="seller-reg-submit" disabled={loading} className="w-full h-12 rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">
              {loading ? "Creating…" : "Create seller account"}
            </Button>
          </div>

          <div className="mt-6 text-sm text-[#78716C]">
            Already selling? <Link data-testid="seller-reg-login-link" to="/login" className="text-[#1B4332] font-medium underline">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
