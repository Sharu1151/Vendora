import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { rupee, api } from "@/lib/api";
import { Trash2, Plus, Minus, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Cart() {
  const { cart, updateCart, user } = useApp();
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(null);

  const applyCoupon = async () => {
    try {
      const { data } = await api.post("/coupons/apply", { code, subtotal: cart.subtotal });
      setApplied(data);
      toast.success(`Coupon ${data.coupon.code} applied · save ${rupee(data.discount)}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Invalid coupon");
      setApplied(null);
    }
  };

  const total = cart.subtotal - (applied?.discount || 0);
  const delivery = cart.subtotal > 499 || cart.subtotal === 0 ? 0 : 40;

  if (!user) return (
    <div className="container-x py-24 text-center">
      <div className="font-display text-3xl font-bold mb-4">Please login to view your cart</div>
      <Button data-testid="cart-login-btn" onClick={() => nav("/login")} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Login</Button>
    </div>
  );

  if (cart.items.length === 0) return (
    <div className="container-x py-24 text-center">
      <div className="font-display text-3xl font-bold mb-4">Your cart is empty</div>
      <p className="text-[#78716C] mb-6">Add fresh produce and pantry staples to get started.</p>
      <Link data-testid="cart-shop-link" to="/products" className="btn-primary">Continue Shopping</Link>
    </div>
  );

  return (
    <div className="container-x py-10">
      <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight">Shopping Cart</h1>
      <div className="mt-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          {cart.items.map((it) => (
            <div key={it.product.id} data-testid={`cart-item-${it.product.id}`} className="card-soft p-4 flex gap-4 items-center">
              <img src={it.product.images[0]} className="w-24 h-24 object-cover rounded-lg" alt="" />
              <div className="flex-1">
                <Link to={`/products/${it.product.id}`} className="font-medium hover:text-[#1B4332]">{it.product.name}</Link>
                <div className="text-xs text-[#78716C]">{it.product.unit}</div>
                <div className="mt-2 font-display font-bold text-lg">{rupee(it.product.price)}</div>
              </div>
              <div className="flex items-center border border-[#E7E5E4] rounded-full">
                <button data-testid={`cart-dec-${it.product.id}`} onClick={() => updateCart(it.product.id, it.qty - 1)} className="w-9 h-9 flex items-center justify-center hover:bg-[#F4EFE6] rounded-l-full"><Minus className="w-3 h-3" /></button>
                <div className="w-8 text-center text-sm">{it.qty}</div>
                <button data-testid={`cart-inc-${it.product.id}`} onClick={() => updateCart(it.product.id, it.qty + 1)} className="w-9 h-9 flex items-center justify-center hover:bg-[#F4EFE6] rounded-r-full"><Plus className="w-3 h-3" /></button>
              </div>
              <button data-testid={`cart-remove-${it.product.id}`} onClick={() => updateCart(it.product.id, 0)} className="w-9 h-9 rounded-full text-[#991B1B] hover:bg-red-50 flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        <aside className="card-soft p-6 h-fit sticky top-28">
          <div className="font-display text-xl font-bold mb-4">Order Summary</div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span data-testid="cart-subtotal">{rupee(cart.subtotal)}</span></div>
            <div className="flex justify-between text-[#78716C]"><span>Delivery</span><span>{delivery === 0 ? "Free" : rupee(delivery)}</span></div>
            {applied && <div className="flex justify-between text-[#40916C]"><span>Coupon ({applied.coupon.code})</span><span>−{rupee(applied.discount)}</span></div>}
          </div>
          <div className="mt-4 border-t border-[#E7E5E4] pt-4 flex justify-between font-display font-bold text-lg">
            <span>Total</span><span data-testid="cart-total">{rupee(total + delivery)}</span>
          </div>

          <div className="mt-6">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
                <Input data-testid="coupon-input" placeholder="Enter coupon" value={code} onChange={(e) => setCode(e.target.value)} className="pl-9 rounded-full" />
              </div>
              <Button data-testid="coupon-apply-btn" onClick={applyCoupon} variant="outline" className="rounded-full border-[#1B4332] text-[#1B4332] hover:bg-[#1B4332] hover:text-white">Apply</Button>
            </div>
            <div className="text-xs text-[#78716C] mt-2">Try: FRESH10, MANGALORE20, WELCOME50</div>
          </div>

          <Button data-testid="cart-checkout-btn" onClick={() => nav("/checkout")} className="w-full mt-6 h-12 rounded-full bg-[#1B4332] hover:bg-[#2D6A4F] font-medium">Proceed to Checkout</Button>
        </aside>
      </div>
    </div>
  );
}
