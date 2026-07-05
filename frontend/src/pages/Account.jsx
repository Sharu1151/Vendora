import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, rupee } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Heart, MapPin, User } from "lucide-react";
import ProductCard from "@/components/ProductCard";

export default function Account() {
  const { user, wishlist } = useApp();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const tab = params.get("tab") || "profile";

  useEffect(() => {
    if (!user) { nav("/login"); return; }
    api.get("/orders/mine").then((r) => setOrders(r.data));
    api.get("/addresses").then((r) => setAddresses(r.data));
  }, [user, nav]);

  if (!user) return null;

  return (
    <div className="container-x py-10">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#1B4332] text-white flex items-center justify-center font-display text-2xl font-bold">{user.name[0]}</div>
        <div>
          <div className="overline text-[#78716C]">My Account</div>
          <div className="font-display font-black text-3xl tracking-tight">{user.name}</div>
        </div>
      </div>

      <Tabs defaultValue={tab} className="mt-8">
        <TabsList className="bg-[#F4EFE6] rounded-full p-1 h-auto">
          <TabsTrigger data-testid="tab-profile" value="profile" className="rounded-full px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-[#1B4332]"><User className="w-4 h-4 mr-2" />Profile</TabsTrigger>
          <TabsTrigger data-testid="tab-orders" value="orders" className="rounded-full px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-[#1B4332]"><Package className="w-4 h-4 mr-2" />Orders</TabsTrigger>
          <TabsTrigger data-testid="tab-wishlist" value="wishlist" className="rounded-full px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-[#1B4332]"><Heart className="w-4 h-4 mr-2" />Wishlist</TabsTrigger>
          <TabsTrigger data-testid="tab-addresses" value="addresses" className="rounded-full px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-[#1B4332]"><MapPin className="w-4 h-4 mr-2" />Addresses</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="card-soft p-8 max-w-xl">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><div className="overline">Name</div><div className="mt-1 font-medium">{user.name}</div></div>
              <div><div className="overline">Email</div><div className="mt-1 font-medium">{user.email}</div></div>
              <div><div className="overline">Role</div><div className="mt-1 font-medium capitalize">{user.role.replace("_", " ")}</div></div>
              <div><div className="overline">Wallet</div><div className="mt-1 font-medium">₹0 · 0 reward points</div></div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          {orders.length === 0 ? (
            <div className="text-[#78716C]">No orders yet.</div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o.id} data-testid={`order-${o.id}`} className="card-soft p-5 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-mono text-xs text-[#78716C]">#{o.id.slice(0, 8).toUpperCase()}</div>
                    <div className="text-sm mt-1">{o.items.length} items · {new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="font-display font-bold text-lg">{rupee(o.total)}</div>
                  <span className={`text-xs font-bold uppercase px-3 py-1 rounded-full ${o.payment_status === "paid" ? "bg-[#40916C] text-white" : "bg-[#F4A261] text-white"}`}>{o.status}</span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="wishlist" className="mt-6">
          {wishlist.length === 0 ? (
            <div className="text-[#78716C]">No wishlisted items yet.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {wishlist.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          {addresses.length === 0 ? (
            <div className="text-[#78716C]">No saved addresses yet. Add one at checkout.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {addresses.map((a) => (
                <div key={a.id} className="card-soft p-5">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-sm text-[#78716C]">{a.phone}</div>
                  <div className="text-sm mt-2">{a.line1}, {a.city}, {a.state} {a.pincode}</div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
