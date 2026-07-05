import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api, rupee } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Heart, MapPin, User, Pencil, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import ProductCard from "@/components/ProductCard";

export default function Account() {
  const { user, wishlist } = useApp();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [editAddr, setEditAddr] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const tab = params.get("tab") || "profile";

  const refreshAddresses = () => api.get("/addresses").then((r) => setAddresses(r.data));

  useEffect(() => {
    if (!user) { nav("/login"); return; }
    api.get("/orders/mine").then((r) => setOrders(r.data));
    refreshAddresses();
  }, [user, nav]);

  if (!user) return null;

  const openAdd = () => {
    setEditAddr({ name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "", country: "India", is_default: false });
    setIsNew(true);
  };

  const openEdit = (addr) => {
    setEditAddr({ ...addr });
    setIsNew(false);
  };

  const saveAddr = async () => {
    try {
      if (isNew) {
        await api.post("/addresses", editAddr);
        toast.success("Address added");
      } else {
        await api.put(`/addresses/${editAddr.id}`, editAddr);
        toast.success("Address updated");
      }
      setEditAddr(null);
      refreshAddresses();
    } catch {
      toast.error("Failed to save address");
    }
  };

  const removeAddr = async (aid) => {
    if (!window.confirm("Delete this address?")) return;
    try {
      await api.delete(`/addresses/${aid}`);
      toast.success("Address deleted");
      refreshAddresses();
    } catch {
      toast.error("Failed to delete address");
    }
  };

  const setDefault = async (aid) => {
    try {
      await api.put(`/addresses/${aid}/default`);
      toast.success("Default address updated");
      refreshAddresses();
    } catch {
      toast.error("Failed to set default address");
    }
  };

  return (
    <div className="container-x py-10">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-display text-2xl font-bold">{user.name[0]}</div>
        <div>
          <div className="overline text-[#78716C]">My Account</div>
          <div className="font-display font-black text-3xl tracking-tight">{user.name}</div>
        </div>
      </div>

      <Tabs defaultValue={tab} className="mt-8">
        <TabsList className="bg-[#F4EFE6] rounded-full p-1 h-auto">
          <TabsTrigger data-testid="tab-profile" value="profile" className="rounded-full px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-[var(--primary)]"><User className="w-4 h-4 mr-2" />Profile</TabsTrigger>
          <TabsTrigger data-testid="tab-orders" value="orders" className="rounded-full px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-[var(--primary)]"><Package className="w-4 h-4 mr-2" />Orders</TabsTrigger>
          <TabsTrigger data-testid="tab-wishlist" value="wishlist" className="rounded-full px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-[var(--primary)]"><Heart className="w-4 h-4 mr-2" />Wishlist</TabsTrigger>
          <TabsTrigger data-testid="tab-addresses" value="addresses" className="rounded-full px-5 py-2 data-[state=active]:bg-white data-[state=active]:text-[var(--primary)]"><MapPin className="w-4 h-4 mr-2" />Addresses</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="card-soft p-8 max-w-xl">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><div className="overline">Name</div><div className="mt-1 font-medium">{user.name}</div></div>
              <div><div className="overline">Email</div><div className="mt-1 font-medium">{user.email}</div></div>
              <div><div className="overline">Role</div><div className="mt-1 font-medium capitalize">{user.role.replace("_", " ")}</div></div>
              <div><div className="overline">Wallet</div><div className="mt-1 font-medium">{rupee(user.wallet || 0)} · {user.points || 0} reward points</div></div>
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
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-display font-bold text-xl">My Saved Addresses</h3>
            <Button data-testid="add-address-btn" onClick={openAdd} className="rounded-full bg-[var(--primary)] hover:opacity-90">Add New Address</Button>
          </div>
          {addresses.length === 0 ? (
            <div className="text-[#78716C]">No saved addresses yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {addresses.map((a) => (
                <div key={a.id} className="card-soft p-5 relative group flex flex-col justify-between h-full min-h-[160px]">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-base">{a.name}</div>
                      {a.is_default && <span className="bg-[#40916C]/10 text-[#40916C] text-[10px] uppercase font-bold px-2 py-0.5 rounded">Default</span>}
                    </div>
                    <div className="text-sm text-[#78716C] mt-1">{a.phone}</div>
                    <div className="text-sm mt-2 leading-relaxed text-[#1C1917]">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}</div>
                  </div>
                  <div className="mt-4 flex gap-3 justify-end border-t border-[#F4EFE6] pt-3">
                    {!a.is_default && (
                      <button className="text-xs font-semibold text-[var(--primary)] hover:underline" onClick={() => setDefault(a.id)}>Set Default</button>
                    )}
                    <button className="text-xs font-semibold text-[var(--primary)] hover:underline flex items-center gap-1" onClick={() => openEdit(a)}><Pencil className="w-3 h-3" /> Edit</button>
                    <button className="text-xs font-semibold text-[#991B1B] hover:underline flex items-center gap-1" onClick={() => removeAddr(a.id)}><Trash2 className="w-3 h-3" /> Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!editAddr} onOpenChange={(v) => !v && setEditAddr(null)}>
        <DialogContent className="max-w-md">
          {editAddr && (
            <>
              <DialogHeader>
                <DialogTitle>{isNew ? "Add New Address" : "Edit Address"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 my-4">
                <Input placeholder="Address Label (e.g., Home, Work)" value={editAddr.name} onChange={(e) => setEditAddr({ ...editAddr, name: e.target.value })} />
                <Input placeholder="Phone Number" value={editAddr.phone} onChange={(e) => setEditAddr({ ...editAddr, phone: e.target.value })} />
                <Input placeholder="Address Line 1" value={editAddr.line1} onChange={(e) => setEditAddr({ ...editAddr, line1: e.target.value })} />
                <Input placeholder="Address Line 2 (Optional)" value={editAddr.line2} onChange={(e) => setEditAddr({ ...editAddr, line2: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="City" value={editAddr.city} onChange={(e) => setEditAddr({ ...editAddr, city: e.target.value })} />
                  <Input placeholder="State" value={editAddr.state} onChange={(e) => setEditAddr({ ...editAddr, state: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Pincode" value={editAddr.pincode} onChange={(e) => setEditAddr({ ...editAddr, pincode: e.target.value })} />
                  <Input placeholder="Country" value={editAddr.country} onChange={(e) => setEditAddr({ ...editAddr, country: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input type="checkbox" id="is_default" checked={editAddr.is_default} onChange={(e) => setEditAddr({ ...editAddr, is_default: e.target.checked })} />
                  <label htmlFor="is_default" className="text-sm font-medium text-[#1C1917] cursor-pointer">Set as default shipping address</label>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setEditAddr(null)} variant="outline" className="rounded-full">Cancel</Button>
                <Button onClick={saveAddr} className="rounded-full bg-[var(--primary)] hover:opacity-95">Save Address</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
