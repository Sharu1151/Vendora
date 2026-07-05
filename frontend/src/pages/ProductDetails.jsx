import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, rupee } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { Star, Heart, ShoppingCart, Truck, RotateCcw, ShieldCheck, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const [p, setP] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState(0);
  const inWish = p && wishlist.some((w) => w.id === p.id);

  useEffect(() => {
    api.get(`/products/${id}`).then((r) => {
      setP(r.data);
      api.get(`/products?category_id=${r.data.category_id}&limit=8`).then((rr) => setRelated(rr.data.filter((x) => x.id !== r.data.id)));
    });
    api.get(`/reviews/${id}`).then((r) => setReviews(r.data));
  }, [id]);

  if (!p) return <div className="container-x py-24 text-center text-[#78716C]">Loading…</div>;
  const off = Math.round(((p.mrp - p.price) / p.mrp) * 100);

  return (
    <div className="container-x py-10">
      <nav className="flex items-center text-xs text-[#78716C] gap-2 mb-6">
        <Link to="/" className="hover:text-[#1B4332]">Home</Link><ChevronRight className="w-3 h-3" />
        <Link to="/products" className="hover:text-[#1B4332]">Products</Link><ChevronRight className="w-3 h-3" />
        <span>{p.category_name}</span><ChevronRight className="w-3 h-3" />
        <span className="text-[#1C1917] font-medium">{p.name}</span>
      </nav>

      <div className="grid lg:grid-cols-2 gap-12">
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-[#F4EFE6] mb-4">
            <img data-testid="product-hero-image" src={p.images[selected] || p.images[0]} alt={p.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-3">
            {(p.images.length ? p.images : [p.images[0]]).map((img, i) => (
              <button key={i} data-testid={`product-thumb-${i}`} onClick={() => setSelected(i)} className={`w-20 h-20 rounded-lg overflow-hidden border-2 ${selected === i ? "border-[#1B4332]" : "border-transparent"}`}>
                <img src={img} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="overline text-[#78716C]">{p.brand} · {p.category_name}</div>
          <h1 data-testid="product-name" className="font-display font-black text-4xl md:text-5xl tracking-tight mt-2">{p.name}</h1>
          <div className="flex items-center gap-2 mt-3 text-sm">
            <span className="flex items-center gap-1 bg-[#40916C] text-white px-2 py-1 rounded font-medium"><Star className="w-3 h-3 fill-white" /> {p.rating}</span>
            <span className="text-[#78716C]">{p.review_count} reviews</span>
          </div>
          <div className="mt-6 flex items-end gap-3">
            <span data-testid="product-price" className="font-display text-4xl font-black">{rupee(p.price)}</span>
            {p.mrp > p.price && <span className="text-[#78716C] line-through text-lg">{rupee(p.mrp)}</span>}
            {off > 0 && <span className="bg-[#E07A5F] text-white px-2.5 py-1 rounded-full text-xs font-bold">{off}% OFF</span>}
          </div>
          <div className="mt-2 text-sm text-[#78716C]">Inclusive of all taxes · {p.unit}</div>

          <div className="mt-6 border-t border-[#E7E5E4] pt-6">
            <div className="overline text-[#78716C] mb-3">Quantity</div>
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-[#E7E5E4] rounded-full">
                <button data-testid="qty-decrease" onClick={() => setQty(Math.max(1, qty - 1))} className="w-11 h-11 flex items-center justify-center hover:bg-[#F4EFE6] rounded-l-full">−</button>
                <div data-testid="qty-display" className="w-12 text-center font-medium">{qty}</div>
                <button data-testid="qty-increase" onClick={() => setQty(qty + 1)} className="w-11 h-11 flex items-center justify-center hover:bg-[#F4EFE6] rounded-r-full">+</button>
              </div>
              <Button data-testid="add-to-cart-btn" onClick={() => addToCart(p.id, qty)} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F] px-8 h-11">
                <ShoppingCart className="w-4 h-4 mr-2" /> Add to Cart
              </Button>
              <button data-testid="wishlist-btn" onClick={() => toggleWishlist(p.id)} className="w-11 h-11 rounded-full border border-[#E7E5E4] flex items-center justify-center hover:bg-[#F4EFE6]">
                <Heart className={`w-4 h-4 ${inWish ? "fill-[#E07A5F] text-[#E07A5F]" : ""}`} />
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 text-sm">
            {[
              { icon: Truck, t: "30-min delivery" },
              { icon: RotateCcw, t: "Easy returns" },
              { icon: ShieldCheck, t: "Fresh guarantee" },
            ].map((b, i) => (
              <div key={i} className="card-soft p-4 flex items-center gap-2">
                <b.icon className="w-4 h-4 text-[#1B4332]" />
                <span className="text-xs font-medium">{b.t}</span>
              </div>
            ))}
          </div>

          <Tabs defaultValue="highlights" className="mt-10">
            <TabsList className="bg-transparent border-b border-[#E7E5E4] rounded-none h-auto p-0 gap-6 justify-start">
              <TabsTrigger value="highlights" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1B4332] data-[state=active]:bg-transparent px-0 pb-3">Highlights</TabsTrigger>
              <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1B4332] data-[state=active]:bg-transparent px-0 pb-3">Description</TabsTrigger>
              <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#1B4332] data-[state=active]:bg-transparent px-0 pb-3">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="highlights" className="pt-4">
              <ul className="space-y-2 text-sm">
                {p.highlights.map((h, i) => <li key={i} className="flex items-start gap-2"><span className="text-[#40916C] mt-1">✓</span> {h}</li>)}
              </ul>
            </TabsContent>
            <TabsContent value="description" className="pt-4 text-sm text-[#1C1917] leading-relaxed">{p.description}</TabsContent>
            <TabsContent value="reviews" className="pt-4">
              {reviews.length === 0 ? (
                <div className="text-sm text-[#78716C]">No reviews yet.</div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="border-b border-[#E7E5E4] pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-[#1B4332] text-white text-xs flex items-center justify-center">{r.user_name[0]}</div>
                        <div className="font-medium text-sm">{r.user_name}</div>
                        <div className="flex text-[#F4A261]">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}</div>
                      </div>
                      {r.title && <div className="font-medium text-sm">{r.title}</div>}
                      <div className="text-sm text-[#78716C]">{r.body}</div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display font-black text-3xl tracking-tight mb-8">You might also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.slice(0, 4).map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
