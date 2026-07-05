# Mangalore Store – White-Label Ecommerce SaaS

## Original Problem Statement
Build a production-ready, enterprise-grade, white-label, multi-tenant Ecommerce SaaS platform.
First brand: **Mangalore Store** (grocery/supermarket vertical). Architecture must support any vertical
(fashion, electronics, pharmacy, restaurant, etc.) via config swaps.

## Stack
- Backend: FastAPI + Motor (MongoDB) + Stripe SDK + emergentintegrations (Claude Sonnet 4.6)
- Frontend: React 19 + Tailwind + shadcn/ui + Cabinet Grotesk / Satoshi (Fontshare)
- Auth: JWT (bcrypt) — email + password
- Payments: Stripe Flow A (claimable sandbox), DIY tax mode (per user choice)
- AI: Product description generator (Claude Sonnet 4.6 via Emergent LLM key)

## User Personas
1. **Customer** — browses, buys groceries
2. **Store Admin** — manages products, orders, customers
3. **Super Admin** — manages tenant stores (multi-vertical)

## Implemented (2026-02)
### Storefront
- Landing page: hero, category bento, editorial marquee, flash sale, featured, trending, value props
- Catalog: filters (category, price, sort), grid layout
- Product Details: gallery, variants, tabs (highlights/description/reviews), related products
- Cart: qty controls, coupon apply, order summary
- Checkout: address management, Stripe Checkout Session (dynamic line_items)
- Payment success/cancel with polling
- Customer Dashboard: profile, orders, wishlist, addresses

### Admin
- Stats (revenue, orders, customers)
- Products CRUD (with AI description generator)
- Orders management with lifecycle status
- Customers list

### Super Admin
- Platform stats
- Tenants/Stores CRUD (multi-vertical)

### Backend APIs
- `/api/auth/*`, `/api/products*`, `/api/categories`, `/api/cart*`, `/api/wishlist*`,
  `/api/addresses`, `/api/coupons*`, `/api/reviews*`, `/api/checkout`, `/api/payments/status/*`,
  `/api/stripe/webhook`, `/api/orders*`, `/api/admin/*`, `/api/super/*`, `/api/ai/describe`

### Seed data
- 8 categories, 33+ products, 3 coupons, 3 demo users, 3 demo stores (grocery/fashion/pharmacy)

## Backlog (P0/P1/P2)
- **P0 IN-PROGRESS: Enterprise Admin Panel (Metronic-inspired)** — see /app/memory/ADMIN_PANEL_PLAN.md
- P1: Google social auth, phone OTP, 2FA
- P1: Wishlist/Compare/Recently Viewed depth
- P1: Blogs / CMS pages / FAQs
- P1: WhatsApp/Email notifications, order tracking timeline
- P2: AI Chatbot, AI Recommendations, AI Inventory Forecast
- P2: Loyalty program, referral, gift cards
- P2: Shipping integrations (Shiprocket/Delhivery), shipping labels
- P2: Multi-currency, multi-language (i18n)
- ✅ DONE (Phase 1): Seller (marketplace) dashboards — seller auth, products CRUD, orders/fulfillment, earnings+payouts, review responses
- P2: Analytics dashboards (heatmaps, funnel)
- P2: Docker + CI/CD pipeline, e2e test suite
