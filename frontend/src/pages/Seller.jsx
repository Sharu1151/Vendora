import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Navigate, Link } from "react-router-dom";
import { api, rupee } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Package, TrendingUp, IndianRupee, ShoppingBag, Sparkles, Plus, Trash2, Pencil,
  Wallet, Star, MessageSquare, Store as StoreIcon, ArrowRight, ArrowUpRight,
} from "lucide-react";

const emptyForm = () => ({
  name: "",
  description: "",
  highlights: [],
  price: 0,
  mrp: 0,
  category_id: "",
  brand: "",
  unit: "1 unit",
  stock: 100,
  images: [""],
  tags: [],
  is_featured: false,
  is_trending: false,
  is_flash_sale: false,
});

const ITEM_STATUS = ["pending", "packed", "shipped", "delivered", "cancelled"];

export default function Seller() {
  const { user } = useApp();
  const [me, setMe] = useState(null);
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [cats, setCats] = useState([]);

  const [prodOpen, setProdOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [aiLoading, setAiLoading] = useState(false);

  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNote, setPayoutNote] = useState("");

  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({});

  const [respondFor, setRespondFor] = useState(null);
  const [respondText, setRespondText] = useState("");

  const refresh = async () => {
    const [m, s, p, o, e, py, r, c] = await Promise.all([
      api.get("/seller/me"),
      api.get("/seller/stats"),
      api.get("/seller/products"),
      api.get("/seller/orders"),
      api.get("/seller/earnings"),
      api.get("/seller/payouts"),
      api.get("/seller/reviews"),
      api.get("/categories"),
    ]);
    setMe(m.data);
    setStats(s.data);
    setProducts(p.data);
    setOrders(o.data);
    setEarnings(e.data);
    setPayouts(py.data);
    setReviews(r.data);
    setCats(c.data);
  };

  useEffect(() => {
    if (user && (user.role === "seller" || user.role === "admin" || user.role === "super_admin")) {
      refresh().catch((err) => toast.error(err.response?.data?.detail || "Failed to load"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) return <Navigate to="/login" />;
  if (user.role !== "seller" && user.role !== "admin" && user.role !== "super_admin") return <Navigate to="/" />;

  const aiGenerate = async () => {
    if (!form.name) { toast.error("Enter a product name first"); return; }
    setAiLoading(true);
    try {
      const cat = cats.find((c) => c.id === form.category_id);
      const { data } = await api.post("/ai/describe", { name: form.name, category: cat?.name || "", tags: form.tags });
      setForm({ ...form, description: data.description, highlights: data.highlights || [] });
      toast.success("AI description generated");
    } catch (err) { toast.error("AI generation failed"); }
    setAiLoading(false);
  };

  const openNewProduct = () => {
    setEditingId(null);
    setForm(emptyForm());
    setProdOpen(true);
  };

  const openEditProduct = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name || "",
      description: p.description || "",
      highlights: p.highlights || [],
      price: p.price ?? 0,
      mrp: p.mrp ?? 0,
      category_id: p.category_id || "",
      brand: p.brand || "",
      unit: p.unit || "1 unit",
      stock: p.stock ?? 100,
      images: p.images?.length ? p.images : [""],
      tags: p.tags || [],
      is_featured: !!p.is_featured,
      is_trending: !!p.is_trending,
      is_flash_sale: !!p.is_flash_sale,
    });
    setProdOpen(true);
  };

  const saveProduct = async () => {
    try {
      const body = {
        ...form,
        price: parseFloat(form.price),
        mrp: parseFloat(form.mrp),
        stock: parseInt(form.stock, 10) || 0,
      };
      if (editingId) {
        await api.put(`/seller/products/${editingId}`, body);
        toast.success("Product updated");
      } else {
        await api.post("/seller/products", body);
        toast.success("Product created");
      }
      setProdOpen(false);
      refresh();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Save failed");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/seller/products/${id}`);
      toast.success("Deleted");
      refresh();
    } catch (err) { toast.error(err.response?.data?.detail || "Delete failed"); }
  };

  const updateItemStatus = async (oid, pid, status) => {
    try {
      await api.put(`/seller/orders/${oid}/items/${pid}/status`, { status });
      toast.success("Fulfillment updated");
      refresh();
    } catch (err) { toast.error(err.response?.data?.detail || "Update failed"); }
  };

  const requestPayout = async () => {
    const amt = parseFloat(payoutAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    try {
      await api.post("/seller/payouts/request", { amount: amt, note: payoutNote });
      toast.success("Payout requested");
      setPayoutOpen(false);
      setPayoutAmount("");
      setPayoutNote("");
      refresh();
    } catch (err) { toast.error(err.response?.data?.detail || "Request failed"); }
  };

  const openProfileEdit = () => {
    if (!me?.profile) return;
    setProfileForm({
      store_name: me.profile.store_name || "",
      phone: me.profile.phone || "",
      description: me.profile.description || "",
      logo: me.profile.logo || "",
      bank_account_name: me.profile.bank_account_name || "",
      bank_account_number: me.profile.bank_account_number || "",
      bank_ifsc: me.profile.bank_ifsc || "",
    });
    setProfileOpen(true);
  };

  const saveProfile = async () => {
    try {
      await api.put("/seller/me", profileForm);
      toast.success("Profile updated");
      setProfileOpen(false);
      refresh();
    } catch (err) { toast.error(err.response?.data?.detail || "Save failed"); }
  };

  const submitResponse = async () => {
    if (!respondFor || !respondText.trim()) return;
    try {
      await api.post(`/seller/reviews/${respondFor.id}/respond`, { response: respondText });
      toast.success("Response posted");
      setRespondFor(null);
      setRespondText("");
      refresh();
    } catch (err) { toast.error(err.response?.data?.detail || "Failed"); }
  };

  const store = me?.profile;

  return (
    <div className="container-x py-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {store?.logo ? (
            <img src={store.logo} alt="" className="w-14 h-14 rounded-2xl object-cover border border-[#E7E5E4]" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-[#1B4332] text-white flex items-center justify-center">
              <StoreIcon className="w-6 h-6" />
            </div>
          )}
          <div>
            <div className="overline text-[#78716C]">Seller dashboard</div>
            <h1 className="font-display font-black text-3xl md:text-4xl tracking-tight">{store?.store_name || "Your Store"}</h1>
            {store?.description && <div className="text-sm text-[#78716C] mt-1 max-w-xl">{store.description}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button data-testid="seller-edit-profile-btn" variant="outline" onClick={openProfileEdit} className="rounded-full">
            <Pencil className="w-4 h-4 mr-2" /> Edit store
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      {stats && (
        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: IndianRupee, label: "Gross revenue", value: rupee(stats.revenue), sub: `${stats.items_sold} items sold` },
            { icon: TrendingUp, label: "Net earnings", value: rupee(stats.net_earnings), sub: `after ${stats.commission ? rupee(stats.commission) : "₹0"} fees` },
            { icon: Wallet, label: "Pending payout", value: rupee(stats.pending_payout), sub: `Paid: ${rupee(stats.paid_out)}` },
            { icon: Package, label: "Products live", value: stats.products, sub: `${stats.orders} paid orders` },
          ].map((m, i) => (
            <div key={i} data-testid={`seller-stat-${i}`} className="card-soft p-6">
              <m.icon className="w-6 h-6 text-[#1B4332]" />
              <div className="mt-3 overline">{m.label}</div>
              <div className="font-display font-black text-2xl md:text-3xl mt-1">{m.value}</div>
              <div className="text-xs text-[#78716C] mt-1">{m.sub}</div>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="products" className="mt-10">
        <TabsList className="bg-[#F4EFE6] rounded-full p-1 h-auto flex flex-wrap">
          <TabsTrigger data-testid="seller-tab-products" value="products" className="rounded-full px-5 data-[state=active]:bg-white">Products</TabsTrigger>
          <TabsTrigger data-testid="seller-tab-orders" value="orders" className="rounded-full px-5 data-[state=active]:bg-white">Orders</TabsTrigger>
          <TabsTrigger data-testid="seller-tab-earnings" value="earnings" className="rounded-full px-5 data-[state=active]:bg-white">Earnings & Payouts</TabsTrigger>
          <TabsTrigger data-testid="seller-tab-reviews" value="reviews" className="rounded-full px-5 data-[state=active]:bg-white">Reviews</TabsTrigger>
        </TabsList>

        {/* -------- Products -------- */}
        <TabsContent value="products" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-[#78716C]">{products.length} product{products.length === 1 ? "" : "s"} in your catalog</div>
            <Dialog open={prodOpen} onOpenChange={setProdOpen}>
              <DialogTrigger asChild>
                <Button data-testid="seller-new-product-btn" onClick={openNewProduct} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">
                  <Plus className="w-4 h-4 mr-1" /> New product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader><DialogTitle>{editingId ? "Edit product" : "Create product"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3 max-h-[70vh] overflow-y-auto pr-1">
                  <Input data-testid="seller-prod-name" placeholder="Product name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger data-testid="seller-prod-category"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input data-testid="seller-prod-price" placeholder="Price ₹" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                  <Input data-testid="seller-prod-mrp" placeholder="MRP ₹" type="number" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} />
                  <Input data-testid="seller-prod-unit" placeholder="Unit (e.g. 1 kg)" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} />
                  <Input data-testid="seller-prod-stock" placeholder="Stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                  <Input data-testid="seller-prod-brand" placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="col-span-2" />
                  <Input data-testid="seller-prod-image" placeholder="Image URL" className="col-span-2" value={form.images[0] || ""} onChange={(e) => setForm({ ...form, images: [e.target.value] })} />
                  <div className="col-span-2 relative">
                    <Textarea data-testid="seller-prod-description" placeholder="Description (or use AI)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="min-h-[100px]" />
                    <Button data-testid="seller-ai-generate-btn" size="sm" onClick={aiGenerate} disabled={aiLoading} type="button" className="absolute bottom-3 right-3 rounded-full bg-[#E07A5F] hover:bg-[#D96A4D] h-8">
                      <Sparkles className="w-3 h-3 mr-1" />{aiLoading ? "Thinking…" : "AI Generate"}
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button data-testid="seller-prod-save-btn" onClick={saveProduct} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">
                    {editingId ? "Save changes" : "Create product"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="card-soft overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F4EFE6] text-left"><tr>
                <th className="p-4">Product</th><th className="p-4">Category</th><th className="p-4">Price</th><th className="p-4">Stock</th><th className="p-4">Rating</th><th></th>
              </tr></thead>
              <tbody>
                {products.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-[#78716C]">
                    No products yet — click <span className="font-medium">New product</span> to add your first listing.
                  </td></tr>
                )}
                {products.map((p) => (
                  <tr key={p.id} className="border-t border-[#E7E5E4]">
                    <td className="p-4 flex items-center gap-3">
                      <img src={p.images?.[0]} className="w-10 h-10 rounded object-cover" alt="" />
                      <div>{p.name}<div className="text-xs text-[#78716C]">{p.sku}</div></div>
                    </td>
                    <td className="p-4">{p.category_name}</td>
                    <td className="p-4 font-medium">{rupee(p.price)}</td>
                    <td className="p-4">{p.stock}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-[#F4A261] text-[#F4A261]" /> {p.rating} <span className="text-xs text-[#78716C]">({p.review_count})</span></span>
                    </td>
                    <td className="p-4 flex gap-2 justify-end">
                      <button data-testid={`seller-edit-prod-${p.id}`} onClick={() => openEditProduct(p)} className="p-2 rounded hover:bg-[#F4EFE6]"><Pencil className="w-4 h-4" /></button>
                      <button data-testid={`seller-del-prod-${p.id}`} onClick={() => deleteProduct(p.id)} className="p-2 rounded hover:bg-[#F4EFE6] text-[#991B1B]"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* -------- Orders -------- */}
        <TabsContent value="orders" className="mt-6">
          {orders.length === 0 ? (
            <div className="card-soft p-10 text-center">
              <ShoppingBag className="w-8 h-8 mx-auto text-[#78716C]" />
              <div className="mt-3 font-medium">No orders yet</div>
              <div className="text-sm text-[#78716C] mt-1">When customers order your products, they'll show up here.</div>
              <Link to="/products" className="inline-flex items-center gap-1 mt-4 text-sm text-[#1B4332] font-medium hover:underline">
                Preview the storefront <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => (
                <div key={o.id} data-testid={`seller-order-${o.id}`} className="card-soft p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-mono text-xs text-[#78716C]">#{o.id.slice(0, 8).toUpperCase()}</div>
                      <div className="text-sm mt-1">{o.user_name} · {o.user_email} · {new Date(o.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${o.payment_status === "paid" ? "bg-[#40916C]/10 text-[#40916C]" : "bg-[#F4A261]/10 text-[#F4A261]"}`}>{o.payment_status}</span>
                      <div className="font-display font-bold text-lg">{rupee(o.seller_subtotal)}</div>
                    </div>
                  </div>
                  <div className="mt-4 divide-y divide-[#F4EFE6] border-t border-[#F4EFE6] pt-2">
                    {o.items.map((it) => (
                      <div key={it.product_id} className="py-3 flex items-center gap-3 flex-wrap">
                        {it.image && <img src={it.image} className="w-12 h-12 rounded object-cover" alt="" />}
                        <div className="flex-1 min-w-[200px]">
                          <div className="font-medium">{it.name}</div>
                          <div className="text-xs text-[#78716C]">Qty {it.qty} · {rupee(it.price)} each</div>
                        </div>
                        <Select value={it.fulfillment_status || "pending"} onValueChange={(v) => updateItemStatus(o.id, it.product_id, v)}>
                          <SelectTrigger data-testid={`seller-item-status-${o.id}-${it.product_id}`} className="h-9 w-40"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ITEM_STATUS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* -------- Earnings & Payouts -------- */}
        <TabsContent value="earnings" className="mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card-soft p-6">
              <div className="overline">Total gross</div>
              <div className="font-display font-black text-2xl mt-1">{rupee(earnings?.total_gross ?? 0)}</div>
            </div>
            <div className="card-soft p-6">
              <div className="overline">Platform fee ({earnings?.commission_rate ?? 0}%)</div>
              <div className="font-display font-black text-2xl mt-1">-{rupee(earnings?.total_commission ?? 0)}</div>
            </div>
            <div className="card-soft p-6 bg-[#1B4332] text-white">
              <div className="overline text-white/70">Net earnings</div>
              <div className="font-display font-black text-2xl mt-1">{rupee(earnings?.total_net ?? 0)}</div>
              <Button data-testid="seller-payout-request-btn" onClick={() => setPayoutOpen(true)} className="mt-4 rounded-full bg-[#E07A5F] hover:bg-[#D96A4D]">
                Request payout <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-5 gap-6">
            <div className="md:col-span-3 card-soft overflow-hidden">
              <div className="p-4 bg-[#F4EFE6] font-medium">Earnings ledger</div>
              <table className="w-full text-sm">
                <thead className="text-left"><tr>
                  <th className="p-3 text-xs uppercase tracking-wider text-[#78716C]">Date</th>
                  <th className="p-3 text-xs uppercase tracking-wider text-[#78716C]">Product</th>
                  <th className="p-3 text-xs uppercase tracking-wider text-[#78716C]">Qty</th>
                  <th className="p-3 text-xs uppercase tracking-wider text-[#78716C]">Gross</th>
                  <th className="p-3 text-xs uppercase tracking-wider text-[#78716C]">Net</th>
                </tr></thead>
                <tbody>
                  {(earnings?.ledger || []).length === 0 && (
                    <tr><td colSpan={5} className="p-6 text-center text-[#78716C]">No earnings yet.</td></tr>
                  )}
                  {(earnings?.ledger || []).map((row, i) => (
                    <tr key={i} className="border-t border-[#E7E5E4]">
                      <td className="p-3 text-[#78716C]">{new Date(row.date).toLocaleDateString()}</td>
                      <td className="p-3">{row.product_name}</td>
                      <td className="p-3">{row.qty}</td>
                      <td className="p-3">{rupee(row.gross)}</td>
                      <td className="p-3 font-medium">{rupee(row.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:col-span-2 card-soft overflow-hidden">
              <div className="p-4 bg-[#F4EFE6] font-medium">Payouts</div>
              <div className="divide-y divide-[#F4EFE6]">
                {payouts.length === 0 && <div className="p-6 text-center text-[#78716C] text-sm">No payouts requested.</div>}
                {payouts.map((p) => (
                  <div key={p.id} data-testid={`seller-payout-${p.id}`} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{rupee(p.amount)}</div>
                      <div className="text-xs text-[#78716C]">{new Date(p.created_at).toLocaleDateString()}{p.note ? ` · ${p.note}` : ""}</div>
                    </div>
                    <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${p.status === "paid" ? "bg-[#40916C]/10 text-[#40916C]" : p.status === "rejected" ? "bg-[#991B1B]/10 text-[#991B1B]" : "bg-[#F4A261]/10 text-[#F4A261]"}`}>{p.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Dialog open={payoutOpen} onOpenChange={setPayoutOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request payout</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="text-sm text-[#78716C]">Available for payout: <span className="font-medium text-[#1B4332]">{rupee(stats?.pending_payout ?? 0)}</span></div>
                <Input data-testid="seller-payout-amount" type="number" placeholder="Amount ₹" value={payoutAmount} onChange={(e) => setPayoutAmount(e.target.value)} />
                <Textarea data-testid="seller-payout-note" placeholder="Note (optional)" value={payoutNote} onChange={(e) => setPayoutNote(e.target.value)} />
              </div>
              <DialogFooter>
                <Button data-testid="seller-payout-submit" onClick={requestPayout} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Submit request</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* -------- Reviews -------- */}
        <TabsContent value="reviews" className="mt-6">
          {reviews.length === 0 ? (
            <div className="card-soft p-10 text-center">
              <Star className="w-8 h-8 mx-auto text-[#78716C]" />
              <div className="mt-3 font-medium">No reviews yet</div>
              <div className="text-sm text-[#78716C] mt-1">Reviews from customers on your products will appear here.</div>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} data-testid={`seller-review-${r.id}`} className="card-soft p-5">
                  <div className="flex items-start gap-4">
                    {r.product_image && <img src={r.product_image} className="w-14 h-14 rounded-lg object-cover" alt="" />}
                    <div className="flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="font-medium">{r.product_name}</div>
                          <div className="text-xs text-[#78716C]">by {r.user_name} · {new Date(r.created_at).toLocaleDateString()}</div>
                        </div>
                        <div className="inline-flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-[#F4A261] text-[#F4A261]" : "text-[#E7E5E4]"}`} />
                          ))}
                        </div>
                      </div>
                      {r.title && <div className="mt-2 font-medium">{r.title}</div>}
                      <div className="mt-1 text-sm">{r.body}</div>

                      {r.seller_response ? (
                        <div className="mt-3 p-3 rounded-xl bg-[#F4EFE6]">
                          <div className="text-xs uppercase tracking-widest text-[#78716C]">Your response</div>
                          <div className="mt-1 text-sm">{r.seller_response}</div>
                        </div>
                      ) : (
                        <button
                          data-testid={`seller-respond-btn-${r.id}`}
                          onClick={() => { setRespondFor(r); setRespondText(""); }}
                          className="mt-3 inline-flex items-center gap-1 text-sm text-[#1B4332] font-medium hover:underline"
                        >
                          <MessageSquare className="w-4 h-4" /> Respond to review
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Dialog open={!!respondFor} onOpenChange={(v) => !v && setRespondFor(null)}>
            <DialogContent>
              <DialogHeader><DialogTitle>Respond to review</DialogTitle></DialogHeader>
              {respondFor && (
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-[#F4EFE6] text-sm">
                    <div className="font-medium">{respondFor.title || `${respondFor.rating}★ review`}</div>
                    <div className="text-[#78716C] mt-1">{respondFor.body}</div>
                  </div>
                  <Textarea
                    data-testid="seller-respond-text"
                    placeholder="Thank the customer, address concerns, share context…"
                    value={respondText}
                    onChange={(e) => setRespondText(e.target.value)}
                    className="min-h-[110px]"
                  />
                </div>
              )}
              <DialogFooter>
                <Button data-testid="seller-respond-submit" onClick={submitResponse} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Post response</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>

      {/* Edit store dialog */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Edit store profile</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input data-testid="seller-profile-store" className="col-span-2" placeholder="Store name" value={profileForm.store_name || ""} onChange={(e) => setProfileForm({ ...profileForm, store_name: e.target.value })} />
            <Input placeholder="Phone" value={profileForm.phone || ""} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
            <Input placeholder="Logo URL" value={profileForm.logo || ""} onChange={(e) => setProfileForm({ ...profileForm, logo: e.target.value })} />
            <Textarea className="col-span-2" placeholder="Store description" value={profileForm.description || ""} onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })} />
            <Input placeholder="Bank a/c name" value={profileForm.bank_account_name || ""} onChange={(e) => setProfileForm({ ...profileForm, bank_account_name: e.target.value })} />
            <Input placeholder="Bank a/c number" value={profileForm.bank_account_number || ""} onChange={(e) => setProfileForm({ ...profileForm, bank_account_number: e.target.value })} />
            <Input className="col-span-2" placeholder="IFSC" value={profileForm.bank_ifsc || ""} onChange={(e) => setProfileForm({ ...profileForm, bank_ifsc: e.target.value })} />
          </div>
          <DialogFooter>
            <Button data-testid="seller-profile-save" onClick={saveProfile} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
