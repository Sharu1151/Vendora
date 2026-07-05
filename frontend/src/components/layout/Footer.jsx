import React from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";

export default function Footer() {
  const { storeSettings, footerConfig } = useApp();
  const logoLetter = storeSettings?.name?.[0] || "M";

  return (
    <footer className="mt-24 bg-[var(--primary)] text-[#FDFBF7]">
      <div className="container-x py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-4">
            {storeSettings?.logo ? (
              <img src={storeSettings.logo} alt={storeSettings.name} className="w-10 h-10 object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#E07A5F] flex items-center justify-center text-white font-display font-black">{logoLetter}</div>
            )}
            <div className="font-display text-2xl font-black tracking-tight">{storeSettings?.name || "Mangalore Store"}</div>
          </div>
          <p className="text-sm text-white/70 leading-relaxed max-w-md">
            {footerConfig?.description || storeSettings?.tagline || "Farm-fresh groceries, sourced daily from local Mangalore farmers and delivered to your door in under 30 minutes."}
          </p>
          <div className="mt-6 flex items-center gap-3">
            <input data-testid="footer-newsletter-input" placeholder="Your email for weekly deals" className="rounded-full bg-white/10 border border-white/20 px-5 py-3 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-[#E07A5F] flex-1" />
            <button data-testid="footer-newsletter-btn" className="rounded-full bg-[#E07A5F] text-white px-5 py-3 text-sm font-medium hover:bg-[#D96A4D] transition-colors">Subscribe</button>
          </div>
        </div>

        {footerConfig?.columns && footerConfig.columns.length > 0 ? (
          <>
            {footerConfig.columns.map((col) => (
              <div key={col.id}>
                <div className="overline text-white/60 mb-3">{col.title}</div>
                <ul className="space-y-2 text-sm text-white/80">
                  {col.links?.map((lnk, idx) => (
                    <li key={idx}><Link to={lnk.url} className="hover:text-white">{lnk.label}</Link></li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        ) : (
          <>
            <div>
              <div className="overline text-white/60 mb-3">Shop</div>
              <ul className="space-y-2 text-sm text-white/80">
                <li><Link to="/products" data-testid="footer-all-products" className="hover:text-white">All Products</Link></li>
                <li><Link to="/products?flash=1" className="hover:text-white">Flash Deals</Link></li>
                <li><Link to="/products?featured=1" className="hover:text-white">Featured</Link></li>
                <li><Link to="/products?trending=1" className="hover:text-white">Trending</Link></li>
              </ul>
            </div>
            <div>
              <div className="overline text-white/60 mb-3">Company</div>
              <ul className="space-y-2 text-sm text-white/80">
                <li><Link to="/about" className="hover:text-white">About us</Link></li>
                <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link to="/faq" className="hover:text-white">FAQs</Link></li>
                <li><Link to="/privacy" className="hover:text-white">Privacy</Link></li>
              </ul>
            </div>
          </>
        )}
      </div>
      <div className="border-t border-white/10">
        <div className="container-x py-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-white/60">
          <div>{footerConfig?.copyright || storeSettings?.footer_copyright || `© ${new Date().getFullYear()} ${storeSettings?.name || "Mangalore Store"}`}</div>
          <div className="flex gap-6">
            <Link to="/terms" className="hover:text-white">Terms</Link>
            <Link to="/privacy" className="hover:text-white">Privacy</Link>
            <Link to="/refund" className="hover:text-white">Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
