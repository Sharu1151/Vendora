import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { api, rupee } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export default function Checkout() {
  const { cart, user } = useApp();
  const nav = useNavigate();
  const [addresses, setAddresses] = useState([]);
  const [selected, setSelected] = useState("");
  const [coupon, setCoupon] = useState("");
  const [newAddr, setNewAddr] = useState({ name: user?.name || "", phone: "", line1: "", city: "Mangalore", state: "Karnataka", pincode: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { nav("/login"); return; }
    api.get("/addresses").then((r) => {
      setAddresses(r.data);
      if (r.data[0]) setSelected(r.data[0].id);
      else setShowAdd(true);
    });
  }, [user, nav]);

  const saveAddress = async () => {
    if (!newAddr.name || !newAddr.phone || !newAddr.line1 || !newAddr.pincode) { toast.error("Fill all fields"); return; }
    const { data } = await api.post("/addresses", newAddr);
    setAddresses([...addresses, data]);
    setSelected(data.id);
    setShowAdd(false);
    toast.success("Address saved");
  };

  const placeOrder = async () => {
    if (!selected) { toast.error("Add a delivery address"); return; }
    setLoading(true);
    try {
      const items = cart.items.map((i) => ({ product_id: i.product.id, qty: i.qty }));
      const { data } = await api.post("/checkout", { items, address_id: selected, coupon_code: coupon || null, origin_url: window.location.origin });
      window.location.href = data.checkout_url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Checkout failed");
      setLoading(false);
    }
  };

  if (!user || cart.items.length === 0) return null;

  return (
    <div className="container-x py-10">
      <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight">Checkout</h1>
      <div className="mt-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section className="card-soft p-6">
            <div className="font-display text-xl font-bold mb-4">Delivery Address</div>
            {addresses.length > 0 && (
              <RadioGroup value={selected} onValueChange={setSelected} className="space-y-2">
                {addresses.map((a) => (
                  <label key={a.id} data-testid={`address-${a.id}`} htmlFor={a.id} className="flex items-start gap-3 border border-[#E7E5E4] rounded-xl p-4 cursor-pointer hover:border-[#1B4332]">
                    <RadioGroupItem id={a.id} value={a.id} />
                    <div className="text-sm">
                      <div className="font-medium">{a.name} · {a.phone}</div>
                      <div className="text-[#78716C]">{a.line1}, {a.city}, {a.state} {a.pincode}</div>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            )}
            {!showAdd ? (
              <Button data-testid="add-address-btn" variant="outline" onClick={() => setShowAdd(true)} className="mt-4 rounded-full"><Plus className="w-4 h-4 mr-1" /> Add new address</Button>
            ) : (
              <div className="mt-4 grid sm:grid-cols-2 gap-3">
                <Input data-testid="addr-name" placeholder="Full name" value={newAddr.name} onChange={(e) => setNewAddr({ ...newAddr, name: e.target.value })} />
                <Input data-testid="addr-phone" placeholder="Phone" value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} />
                <Input data-testid="addr-line1" placeholder="Address line" className="sm:col-span-2" value={newAddr.line1} onChange={(e) => setNewAddr({ ...newAddr, line1: e.target.value })} />
                <Input data-testid="addr-city" placeholder="City" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
                <Input data-testid="addr-state" placeholder="State" value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} />
                <Input data-testid="addr-pincode" placeholder="Pincode" value={newAddr.pincode} onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })} />
                <Button data-testid="addr-save-btn" onClick={saveAddress} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F] sm:col-span-2">Save address</Button>
              </div>
            )}
          </section>

          <section className="card-soft p-6">
            <div className="font-display text-xl font-bold mb-4">Payment</div>
            <div className="border border-[#E7E5E4] rounded-xl p-4 bg-[#F4EFE6]">
              <div className="font-medium">💳 Secure card payment via Stripe</div>
              <div className="text-sm text-[#78716C] mt-1">You'll be redirected to Stripe for a secure checkout. Test card: 4242 4242 4242 4242</div>
            </div>
          </section>
        </div>

        <aside className="card-soft p-6 h-fit sticky top-28">
          <div className="font-display text-xl font-bold mb-4">Order Summary</div>
          <div className="space-y-2 text-sm max-h-56 overflow-auto pr-2">
            {cart.items.map((it) => (
              <div key={it.product.id} className="flex justify-between">
                <span className="line-clamp-1 pr-2">{it.product.name} × {it.qty}</span>
                <span>{rupee(it.product.price * it.qty)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-[#E7E5E4] pt-4 flex justify-between font-display font-bold text-lg">
            <span>Total</span><span>{rupee(cart.subtotal)}</span>
          </div>
          <Input data-testid="checkout-coupon" placeholder="Coupon code (optional)" value={coupon} onChange={(e) => setCoupon(e.target.value)} className="mt-4 rounded-full" />
          <Button data-testid="place-order-btn" onClick={placeOrder} disabled={loading} className="w-full mt-4 h-12 rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">
            {loading ? "Redirecting…" : `Pay ${rupee(cart.subtotal)}`}
          </Button>
        </aside>
      </div>
    </div>
  );
}
