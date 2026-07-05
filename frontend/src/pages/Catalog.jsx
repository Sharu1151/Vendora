import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [price, setPrice] = useState([0, 800]);
  const [sort, setSort] = useState(params.get("sort") || "latest");
  const [category, setCategory] = useState(params.get("category") || "");
  const q = params.get("q") || "";

  useEffect(() => { api.get("/categories").then((r) => setCats(r.data)); }, []);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (category) p.set("category_id", category);
    p.set("min_price", String(price[0]));
    p.set("max_price", String(price[1]));
    p.set("sort", sort);
    if (params.get("featured")) p.set("featured", "true");
    if (params.get("trending")) p.set("trending", "true");
    if (params.get("flash")) p.set("flash", "true");
    api.get(`/products?${p.toString()}`).then((r) => { setProducts(r.data); setLoading(false); });
  }, [q, category, price, sort, params]);

  return (
    <div className="container-x py-10">
      <div className="mb-8">
        <div className="overline text-[#78716C]">Shop</div>
        <h1 className="font-display font-black text-4xl md:text-5xl tracking-tight mt-2">{q ? `Results for "${q}"` : "All Products"}</h1>
        <div className="text-sm text-[#78716C] mt-2">{products.length} products</div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <aside className="lg:col-span-3 space-y-8">
          <div>
            <div className="font-display text-lg font-bold mb-3">Categories</div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox data-testid="filter-cat-all" checked={!category} onCheckedChange={() => { setCategory(""); setParams({}); }} />
                All
              </label>
              {cats.map((c) => (
                <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    data-testid={`filter-cat-${c.slug}`}
                    checked={category === c.id}
                    onCheckedChange={() => setCategory(category === c.id ? "" : c.id)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <div className="font-display text-lg font-bold mb-3">Price</div>
            <Slider data-testid="filter-price-slider" min={0} max={800} step={10} value={price} onValueChange={setPrice} />
            <div className="mt-3 flex justify-between text-sm text-[#78716C]">
              <span>₹{price[0]}</span><span>₹{price[1]}</span>
            </div>
          </div>
        </aside>
        <main className="lg:col-span-9">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-[#78716C]">Showing {products.length} results</div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger data-testid="catalog-sort-select" className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">Latest</SelectItem>
                <SelectItem value="price_asc">Price · Low to High</SelectItem>
                <SelectItem value="price_desc">Price · High to Low</SelectItem>
                <SelectItem value="rating">Top Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {loading ? (
            <div className="text-sm text-[#78716C]">Loading…</div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 text-[#78716C]">No products match your filters.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {products.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
