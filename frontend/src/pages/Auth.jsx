import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export function Login() {
  const { login } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(email, password);
      toast.success(`Welcome back, ${u.name.split(" ")[0]}`);
      if (u.role === "super_admin") nav("/super-admin");
      else if (u.role === "admin") nav("/admin");
      else if (u.role === "seller") nav("/seller");
      else nav("/");
    } catch (e) { toast.error(e.response?.data?.detail || "Login failed"); }
    setLoading(false);
  };
  return (
    <div className="min-h-[80vh] grid lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <img src="https://images.unsplash.com/photo-1773802539139-d0ecea5b2002?w=1200&q=80" className="absolute inset-0 w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B4332]/80 to-transparent" />
        <div className="absolute bottom-12 left-12 text-white max-w-md">
          <div className="overline text-white/70">Welcome back</div>
          <div className="font-display font-black text-4xl mt-3 tracking-tight">Fresh groceries, freshly delivered.</div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="font-display font-black text-4xl tracking-tight">Log in</div>
          <div className="text-[#78716C] mt-2">Enter your credentials to continue shopping.</div>
          <div className="mt-8 space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-[#78716C]">Email</Label>
              <Input data-testid="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2 h-12" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-[#78716C]">Password</Label>
              <Input data-testid="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2 h-12" />
            </div>
            <Button data-testid="login-submit" disabled={loading} className="w-full h-12 rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">{loading ? "Signing in…" : "Log in"}</Button>
          </div>
          <div className="mt-6 text-sm text-[#78716C]">
            No account? <Link data-testid="login-register-link" to="/register" className="text-[#1B4332] font-medium underline">Create one</Link>
          </div>
          <div className="mt-8 text-xs text-[#78716C] border-t border-[#E7E5E4] pt-4">
            <div className="overline mb-2">Demo accounts</div>
            <div>Customer: customer@test.com / Test@1234</div>
            <div>Admin: admin@mangalorestore.com / Admin@123</div>
            <div>Super Admin: super@emergent.com / Super@123</div>
            <div>Seller (Coastal Farms): seller1@mangalore.com / Seller@123</div>
            <div>Seller (Konkan Spices): seller2@mangalore.com / Seller@123</div>
            <div className="mt-3">
              Want to sell?{" "}
              <Link data-testid="login-seller-register-link" to="/seller/register" className="text-[#1B4332] font-medium underline">
                Open a store
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export function Register() {
  const { register } = useApp();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await register(name, email, password); toast.success("Welcome to Mangalore Store!"); nav("/"); }
    catch (e) { toast.error(e.response?.data?.detail || "Registration failed"); }
    setLoading(false);
  };
  return (
    <div className="min-h-[80vh] grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 order-2 lg:order-1">
        <form onSubmit={submit} className="w-full max-w-md">
          <div className="font-display font-black text-4xl tracking-tight">Create account</div>
          <div className="text-[#78716C] mt-2">Join thousands shopping fresh with Mangalore Store.</div>
          <div className="mt-8 space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-[#78716C]">Full name</Label>
              <Input data-testid="register-name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-2 h-12" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-[#78716C]">Email</Label>
              <Input data-testid="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2 h-12" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-[#78716C]">Password</Label>
              <Input data-testid="register-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="mt-2 h-12" />
            </div>
            <Button data-testid="register-submit" disabled={loading} className="w-full h-12 rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">{loading ? "Creating…" : "Create account"}</Button>
          </div>
          <div className="mt-6 text-sm text-[#78716C]">
            Already a member? <Link to="/login" className="text-[#1B4332] font-medium underline">Log in</Link>
          </div>
        </form>
      </div>
      <div className="hidden lg:block relative order-1 lg:order-2">
        <img src="https://images.unsplash.com/photo-1553531889-56cc480ac5cb?w=1200&q=80" className="absolute inset-0 w-full h-full object-cover" alt="" />
        <div className="absolute inset-0 bg-gradient-to-bl from-[#E07A5F]/70 to-transparent" />
      </div>
    </div>
  );
}
