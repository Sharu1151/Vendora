import React from "react";
import { Link } from "react-router-dom";
import { Heart, Star, Plus } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { rupee } from "@/lib/api";

export default function ProductCard({ p }) {
  const { addToCart, toggleWishlist, wishlist } = useApp();
  const inWish = wishlist.some((w) => w.id === p.id);
  const off = Math.round(((p.mrp - p.price) / p.mrp) * 100);
  return (
    <div data-testid={`product-card-${p.id}`} className="card-soft hover-lift overflow-hidden group flex flex-col">
      <Link to={`/products/${p.id}`} className="relative aspect-square bg-[#F4EFE6] overflow-hidden">
        <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        {off > 0 && (
          <span className="absolute top-3 left-3 bg-[#E07A5F] text-white text-xs font-bold px-2.5 py-1 rounded-full">{off}% OFF</span>
        )}
        <button
          data-testid={`wishlist-toggle-${p.id}`}
          onClick={(e) => { e.preventDefault(); toggleWishlist(p.id); }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
        >
          <Heart className={`w-4 h-4 ${inWish ? "fill-[#E07A5F] text-[#E07A5F]" : "text-[#1C1917]"}`} />
        </button>
      </Link>
      <div className="p-4 flex-1 flex flex-col">
        <div className="overline text-[#78716C] mb-1">{p.unit}</div>
        <Link to={`/products/${p.id}`} className="font-medium text-[15px] leading-snug line-clamp-2 hover:text-[#1B4332]">{p.name}</Link>
        <div className="mt-2 flex items-center gap-1 text-xs text-[#78716C]">
          <Star className="w-3.5 h-3.5 fill-[#F4A261] text-[#F4A261]" />
          <span>{p.rating}</span>
          <span>·</span>
          <span>{p.review_count} reviews</span>
        </div>
        <div className="mt-auto pt-4 flex items-end justify-between">
          <div>
            <div className="font-display text-xl font-bold text-[#1C1917]">{rupee(p.price)}</div>
            {p.mrp > p.price && <div className="text-xs text-[#78716C] line-through">{rupee(p.mrp)}</div>}
          </div>
          <button
            data-testid={`add-to-cart-${p.id}`}
            onClick={() => addToCart(p.id, 1)}
            className="w-10 h-10 rounded-full bg-[#1B4332] text-white flex items-center justify-center hover:bg-[#2D6A4F] transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
