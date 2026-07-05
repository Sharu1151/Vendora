import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import ProductCard from "@/components/ProductCard";
import { useApp } from "@/context/AppContext";
import { ArrowRight, Truck, ShieldCheck, Sparkles, Leaf } from "lucide-react";

export default function Landing() {
  const { storeSettings } = useApp();
  const [cats, setCats] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [flash, setFlash] = useState([]);
  const [sections, setSections] = useState([]);

  useEffect(() => {
    api.get("/categories").then((r) => setCats(r.data));
    api.get("/products?featured=true&limit=8").then((r) => setFeatured(r.data));
    api.get("/products?trending=true&limit=8").then((r) => setTrending(r.data));
    api.get("/products?flash=true&limit=6").then((r) => setFlash(r.data));
    api.get("/homepage").then((r) => setSections(r.data)).catch(() => {});
  }, []);

  const activeSections = sections.length > 0 
    ? sections.filter(s => s.enabled)
    : [
        { id: "default-hero", key: "hero", enabled: true },
        { id: "default-marquee", key: "marquee", enabled: true },
        { id: "default-categories", key: "categories", enabled: true },
        { id: "default-flash", key: "flash", enabled: true },
        { id: "default-featured", key: "featured", enabled: true },
        { id: "default-value-props", key: "value_props", enabled: true },
        { id: "default-trending", key: "trending", enabled: true }
      ];

  const renderSection = (sec) => {
    switch (sec.key) {
      case "hero":
        const heroImage = sec.config?.hero_image || "https://images.unsplash.com/photo-1566385101042-1a0aa0c1268c?w=1600&q=80";
        const heroTitle = sec.config?.hero_title || `Groceries from ${storeSettings?.name || "Mangalore"}'s farms, at your door in 30 minutes.`;
        const sideCard1Title = sec.config?.side_card1_title || "Fresh Alphonsos in season";
        const sideCard1Sub = sec.config?.side_card1_sub || "Hand-picked Ratnagiri mangoes";
        const sideCard2Title = sec.config?.side_card2_title || "First order? 15% off";
        const sideCard2Sub = sec.config?.side_card2_sub || "Use code WELCOME50 at checkout";
        return (
          <section key={sec.id} className="container-x pt-10">
            <div className="grid lg:grid-cols-12 gap-8 items-stretch">
              <div className="lg:col-span-8 relative rounded-3xl overflow-hidden bg-[#F4EFE6] min-h-[440px]">
                <img src={heroImage} alt="Fresh produce" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
                <div className="relative p-10 lg:p-14 h-full flex flex-col justify-end">
                  <div className="overline text-white/80">Farm-fresh · Delivered daily</div>
                  <h1 className="mt-3 font-display font-black text-white text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight max-w-xl">
                    {heroTitle}
                  </h1>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link data-testid="hero-shop-btn" to="/products" className="btn-primary">Shop Now <ArrowRight className="w-4 h-4" /></Link>
                    <Link data-testid="hero-deals-btn" to="/products?flash=1" className="rounded-full bg-white/95 text-[#1B4332] px-6 py-3 font-medium hover:bg-white transition-colors">Today's Flash Deals</Link>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-4 grid grid-rows-2 gap-6">
                <div className="relative rounded-3xl overflow-hidden bg-[#1B4332] p-8 text-white flex flex-col justify-between" style={{ backgroundColor: storeSettings?.primary }}>
                  <Sparkles className="w-8 h-8 text-[#E07A5F]" style={{ color: storeSettings?.secondary }} />
                  <div>
                    <div className="font-display text-3xl font-bold leading-tight">{sideCard1Title}</div>
                    <div className="text-white/70 text-sm mt-2">{sideCard1Sub}</div>
                    <Link to="/products?q=mango" className="mt-4 inline-flex items-center gap-1 text-sm font-medium hover:text-[#E07A5F]">Shop now <ArrowRight className="w-4 h-4" /></Link>
                  </div>
                </div>
                <div className="relative rounded-3xl overflow-hidden bg-[#E07A5F] p-8 text-white flex flex-col justify-between" style={{ backgroundColor: storeSettings?.secondary }}>
                  <Leaf className="w-8 h-8 text-white/90" />
                  <div>
                    <div className="font-display text-3xl font-bold leading-tight">{sideCard2Title}</div>
                    <div className="text-white/85 text-sm mt-2">{sideCard2Sub}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        );

      case "marquee":
        const text = sec.title || "Fresh Organic ◈ Fast Delivery ◈ Premium Quality ◈ Local Farmers ◈ Zero Compromises ◈ Sourced Daily ◈";
        return (
          <section key={sec.id} className="mt-16 border-y border-[#E7E5E4] bg-[#F4EFE6] overflow-hidden">
            <div className="marquee-track py-6">
              {[...Array(2)].map((_, k) => (
                <div key={k} className="inline-flex items-center gap-24 pr-24 font-display text-3xl font-medium text-[#1C1917]/80">
                  {text.split("◈").filter(Boolean).map((t, idx) => (
                    <React.Fragment key={idx}>
                      <span>{t.trim()}</span><span className="text-[#E07A5F]">◈</span>
                    </React.Fragment>
                  ))}
                </div>
              ))}
            </div>
          </section>
        );

      case "categories":
        return (
          <section key={sec.id} className="container-x mt-20">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="overline text-[#78716C]">Shop by Category</div>
                <h2 className="font-display font-black text-3xl md:text-4xl tracking-tight mt-2">{sec.title || "Everything for your kitchen"}</h2>
              </div>
              <Link data-testid="categories-view-all" to="/products" className="text-sm font-medium text-[var(--primary)] hover:opacity-80 inline-flex items-center gap-1">View all <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {cats.map((c) => (
                <Link key={c.id} data-testid={`category-card-${c.slug}`} to={`/products?category=${c.id}`} className="hover-lift group relative aspect-[4/5] rounded-2xl overflow-hidden bg-[#F4EFE6]">
                  <img src={c.image} alt={c.name} className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute inset-0 p-5 flex flex-col justify-end">
                    <div className="font-display text-white text-xl font-bold leading-tight">{c.name}</div>
                    <div className="text-white/70 text-xs mt-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">Shop now <ArrowRight className="w-3 h-3" /></div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );

      case "flash":
        if (flash.length === 0) return null;
        return (
          <section key={sec.id} className="container-x mt-24">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="overline text-[#E07A5F]">Deals of the Day</div>
                <h2 className="font-display font-black text-3xl md:text-4xl tracking-tight mt-2">{sec.title || "Flash Sale · Ends today"}</h2>
              </div>
              <Link to="/products?flash=1" className="text-sm font-medium text-[var(--primary)] hover:opacity-80">See all →</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
              {flash.slice(0, 6).map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </section>
        );

      case "featured":
        return (
          <section key={sec.id} className="container-x mt-24">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="overline text-[#78716C]">Handpicked for you</div>
                <h2 className="font-display font-black text-3xl md:text-4xl tracking-tight mt-2">{sec.title || "Featured Products"}</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {featured.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </section>
        );

      case "value_props":
        return (
          <section key={sec.id} className="container-x mt-24 grid md:grid-cols-3 gap-6">
            {[
              { icon: Truck, title: "30-minute delivery", body: "Fresh to your door, faster than you can chop an onion." },
              { icon: Leaf, title: "Locally sourced", body: "Straight from Mangalore farmers. Zero middlemen, zero markup." },
              { icon: ShieldCheck, title: "Freshness promise", body: "Not fresh? We refund and pick it up. No questions." },
            ].map((v, i) => (
              <div key={i} className="card-soft p-8">
                <v.icon className="w-8 h-8 text-[var(--primary)]" />
                <div className="mt-4 font-display text-xl font-bold">{v.title}</div>
                <div className="mt-2 text-sm text-[#78716C] leading-relaxed">{v.body}</div>
              </div>
            ))}
          </section>
        );

      case "trending":
        return (
          <section key={sec.id} className="container-x mt-24">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="overline text-[#78716C]">Everyone's buying</div>
                <h2 className="font-display font-black text-3xl md:text-4xl tracking-tight mt-2">{sec.title || "Trending in Mangalore"}</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {trending.slice(0, 8).map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      {activeSections.map((sec) => renderSection(sec))}
    </div>
  );
}
