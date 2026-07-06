import React from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider } from "@/context/AppContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Landing from "@/pages/Landing";
import Catalog from "@/pages/Catalog";
import ProductDetails from "@/pages/ProductDetails";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import PaymentResult from "@/pages/PaymentResult";
import { Login, Register } from "@/pages/Auth";
import Account from "@/pages/Account";
import SuperAdmin from "@/pages/SuperAdmin";
import Seller from "@/pages/Seller";
import SellerRegister from "@/pages/SellerRegister";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  AdminLayout, Dashboard, AdminProducts, AdminCategories, AdminBrands,
  AdminInventory, AdminWarehouses, AdminOrders, AdminDiscounts, AdminCoupons,
  AdminCustomers, AdminSellers, AdminRoles, AdminHomepage, AdminMenus,
  AdminBanners, AdminHeaderConfig, AdminFooterConfig, AdminBranding, AdminCms,
  AdminBlogs, AdminMedia, AdminReviews, AdminNotifications, AdminReports,
  AdminSettings
} from "@/pages/admin";
import "@/App.css";

function Shell({ children }) {
  const loc = useLocation();
  const hideChrome = ["/login", "/register", "/seller/register"].includes(loc.pathname) || 
                     loc.pathname.startsWith("/admin") || 
                     loc.pathname.startsWith("/super-admin") || 
                     loc.pathname.startsWith("/seller");
  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      {!hideChrome && <Header />}
      <main className="flex-1 animate-fade-in">{children}</main>
      {!hideChrome && <Footer />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Shell>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/products" element={<Catalog />} />
            <Route path="/products/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={
              <ProtectedRoute allowedRoles={["customer", "seller", "admin", "super_admin"]}>
                <Checkout />
              </ProtectedRoute>
            } />
            <Route path="/payment/success" element={<PaymentResult result="success" />} />
            <Route path="/payment/cancel" element={<PaymentResult result="cancel" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/account" element={
              <ProtectedRoute allowedRoles={["customer", "seller", "admin", "super_admin"]}>
                <Account />
              </ProtectedRoute>
            } />
            <Route path="/wishlist" element={
              <ProtectedRoute allowedRoles={["customer", "seller", "admin", "super_admin"]}>
                <Account />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={["admin", "super_admin"]}>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="brands" element={<AdminBrands />} />
              <Route path="inventory" element={<AdminInventory />} />
              <Route path="warehouses" element={<AdminWarehouses />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="discounts" element={<AdminDiscounts />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="sellers" element={<AdminSellers />} />
              <Route path="roles" element={<AdminRoles />} />
              <Route path="homepage" element={<AdminHomepage />} />
              <Route path="menus" element={<AdminMenus />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="header" element={<AdminHeaderConfig />} />
              <Route path="footer" element={<AdminFooterConfig />} />
              <Route path="branding" element={<AdminBranding />} />
              <Route path="cms" element={<AdminCms />} />
              <Route path="blogs" element={<AdminBlogs />} />
              <Route path="media" element={<AdminMedia />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="notifications" element={<AdminNotifications />} />
              <Route path="reports" element={<AdminReports />} />
              <Route path="settings" element={<AdminSettings />} />
            </Route>
            <Route path="/super-admin" element={
              <ProtectedRoute allowedRoles={["super_admin"]}>
                <SuperAdmin />
              </ProtectedRoute>
            } />
            <Route path="/seller" element={
              <ProtectedRoute allowedRoles={["seller", "admin", "super_admin"]}>
                <Seller />
              </ProtectedRoute>
            } />
            <Route path="/seller/register" element={<SellerRegister />} />
            <Route path="*" element={<Landing />} />
          </Routes>
        </Shell>
        <Toaster position="top-right" richColors />
      </AppProvider>
    </BrowserRouter>
  );
}
export default App;
