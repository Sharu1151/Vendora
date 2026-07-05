// Central catalog of admin modules (rendered as sidebar + routes)
import {
  LayoutDashboard, Package, Tags, Store, ShoppingBag, Users, Percent,
  Image as ImageIcon, Menu as MenuIcon, FileText, Bell, Users2, Settings,
  Warehouse, BookOpen, MessageSquare, BarChart3, Palette, Layout,
  Headphones, Mail, Sliders, Newspaper, LibraryBig,
} from "lucide-react";

export const ADMIN_MODULES = [
  {
    section: "Overview",
    items: [
      { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/admin" },
    ],
  },
  {
    section: "Catalog",
    items: [
      { key: "products", label: "Products", icon: Package, path: "/admin/products" },
      { key: "categories", label: "Categories", icon: Tags, path: "/admin/categories" },
      { key: "brands", label: "Brands", icon: Store, path: "/admin/brands" },
      { key: "inventory", label: "Inventory", icon: Warehouse, path: "/admin/inventory" },
      { key: "warehouses", label: "Warehouses", icon: Warehouse, path: "/admin/warehouses" },
    ],
  },
  {
    section: "Sales",
    items: [
      { key: "orders", label: "Orders", icon: ShoppingBag, path: "/admin/orders" },
      { key: "discounts", label: "Discounts", icon: Percent, path: "/admin/discounts" },
      { key: "coupons", label: "Coupons", icon: Percent, path: "/admin/coupons" },
    ],
  },
  {
    section: "People",
    items: [
      { key: "customers", label: "Customers", icon: Users, path: "/admin/customers" },
      { key: "sellers", label: "Sellers", icon: Users2, path: "/admin/sellers" },
      { key: "roles", label: "Roles & Permissions", icon: Users2, path: "/admin/roles" },
    ],
  },
  {
    section: "Storefront",
    items: [
      { key: "homepage", label: "Homepage Builder", icon: Layout, path: "/admin/homepage" },
      { key: "menus", label: "Menus", icon: MenuIcon, path: "/admin/menus" },
      { key: "banners", label: "Banners", icon: ImageIcon, path: "/admin/banners" },
      { key: "header", label: "Header Config", icon: Layout, path: "/admin/header" },
      { key: "footer", label: "Footer Config", icon: Layout, path: "/admin/footer" },
      { key: "branding", label: "Branding & Theme", icon: Palette, path: "/admin/branding" },
    ],
  },
  {
    section: "Content",
    items: [
      { key: "cms", label: "CMS Pages", icon: FileText, path: "/admin/cms" },
      { key: "blogs", label: "Blogs", icon: Newspaper, path: "/admin/blogs" },
      { key: "media", label: "Media Library", icon: LibraryBig, path: "/admin/media" },
      { key: "reviews", label: "Reviews", icon: MessageSquare, path: "/admin/reviews" },
    ],
  },
  {
    section: "Automation",
    items: [
      { key: "notifications", label: "Notification Templates", icon: Bell, path: "/admin/notifications" },
      { key: "reports", label: "Reports", icon: BarChart3, path: "/admin/reports" },
    ],
  },
  {
    section: "System",
    items: [
      { key: "settings", label: "Settings", icon: Settings, path: "/admin/settings" },
    ],
  },
];

// Flat list for search + command palette
export const FLAT_MODULES = ADMIN_MODULES.flatMap((s) => s.items);
