import React, { useEffect, useState } from "react";
import { api, rupee } from "@/lib/api";
import {
  IndianRupee, ShoppingCart, Users, Package, AlertTriangle, Truck, CheckCircle2, XCircle,
  Clock, TrendingUp, UserPlus,
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, BarChart, Bar } from "recharts";
import PageHeader from "./components/PageHeader";

const StatCard = ({ icon: Icon, label, value, sub, tone = "primary", testid }) => {
  const toneCls = {
    primary: "bg-[#1B4332] text-white",
    warn: "bg-[#F4A261] text-[#1C1917]",
    danger: "bg-[#991B1B] text-white",
    accent: "bg-[#E07A5F] text-white",
    light: "bg-white text-[#1C1917] border border-[#E7E5E4]",
  }[tone];
  return (
    <div data-testid={testid} className={`rounded-2xl p-5 ${toneCls}`}>
      <div className="flex items-center justify-between">
        <Icon className="w-5 h-5 opacity-90" />
        {sub && <span className="text-[10px] uppercase tracking-widest opacity-80">{sub}</span>}
      </div>
      <div className="mt-4 text-[11px] uppercase tracking-widest opacity-80">{label}</div>
      <div className="font-display font-black text-2xl md:text-3xl mt-1 tracking-tight">{value}</div>
    </div>
  );
};

export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/admin/dashboard").then((r) => setD(r.data)); }, []);
  if (!d) return <div className="p-10 text-center text-[#78716C]">Loading dashboard…</div>;

  const seriesFilled = d.sales_series?.length ? d.sales_series : [{ date: new Date().toISOString().slice(0,10), orders: 0, revenue: 0 }];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Real-time snapshot of your store's performance." />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard testid="kpi-revenue" icon={IndianRupee} label="Total revenue" value={rupee(d.total_revenue)} sub="all-time" tone="primary" />
        <StatCard testid="kpi-sales" icon={TrendingUp} label="Total sales" value={d.total_sales} sub="paid orders" tone="accent" />
        <StatCard testid="kpi-today" icon={ShoppingCart} label="Today's orders" value={d.orders_today} sub="last 24h" tone="light" />
        <StatCard testid="kpi-pending" icon={Clock} label="Pending orders" value={d.pending_orders} sub="need action" tone="warn" />
        <StatCard testid="kpi-delivered" icon={CheckCircle2} label="Delivered" value={d.delivered_orders} sub="fulfilled" tone="light" />
        <StatCard testid="kpi-cancelled" icon={XCircle} label="Cancelled" value={d.cancelled_orders} sub="refunded" tone="light" />
        <StatCard testid="kpi-customers" icon={Users} label="Active customers" value={d.active_customers} sub={`+${d.new_customers_30d} new (30d)`} tone="light" />
        <StatCard testid="kpi-products" icon={Package} label="Products live" value={d.total_products} sub={`${d.out_of_stock} out · ${d.low_stock} low`} tone="light" />
      </div>

      {/* Sales + Customer growth graphs */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white border border-[#E7E5E4] rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs uppercase tracking-widest text-[#78716C]">Sales & Revenue</div>
              <div className="font-display font-black text-xl mt-0.5">Last 30 days</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={seriesFilled}>
              <defs>
                <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1B4332" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#1B4332" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4EFE6" />
              <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E7E5E4", fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="#1B4332" strokeWidth={2} fill="url(#gRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-4 h-4 text-[#E07A5F]" />
            <div>
              <div className="text-xs uppercase tracking-widest text-[#78716C]">Customer growth</div>
              <div className="font-display font-black text-xl mt-0.5">New signups</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={d.growth_series?.length ? d.growth_series : [{ date: "", count: 0 }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F4EFE6" />
              <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E7E5E4", fontSize: 12 }} />
              <Line type="monotone" dataKey="count" stroke="#E07A5F" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top products + Recent orders + Activities */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-[#78716C]">Top selling</div>
          <div className="font-display font-black text-xl mt-0.5">Products by revenue</div>
          {d.top_products.length === 0 ? (
            <div className="mt-6 text-sm text-[#78716C]">No paid sales yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220} className="mt-3">
              <BarChart data={d.top_products} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F4EFE6" />
                <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" fontSize={10} width={110} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E7E5E4", fontSize: 12 }} />
                <Bar dataKey="revenue" fill="#1B4332" radius={[0,6,6,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-[#78716C]">Recent orders</div>
          <div className="font-display font-black text-xl mt-0.5">Last 8</div>
          <div className="mt-3 divide-y divide-[#F4EFE6]">
            {d.recent_orders.length === 0 && <div className="text-sm text-[#78716C] py-4">No orders yet.</div>}
            {d.recent_orders.map((o) => (
              <div key={o.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-mono text-[11px] text-[#78716C]">#{o.id.slice(0,8).toUpperCase()}</div>
                  <div className="text-sm">{o.user_name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{rupee(o.total)}</div>
                  <div className="text-[10px] uppercase tracking-widest text-[#78716C]">{o.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5">
          <div className="text-xs uppercase tracking-widest text-[#78716C]">Recent activity</div>
          <div className="font-display font-black text-xl mt-0.5">System pulse</div>
          <div className="mt-3 space-y-3">
            {d.activities.length === 0 && <div className="text-sm text-[#78716C]">Nothing recent.</div>}
            {d.activities.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className={`w-2 h-2 mt-2 rounded-full ${a.type === "product" ? "bg-[#40916C]" : a.type === "customer" ? "bg-[#E07A5F]" : "bg-[#F4A261]"}`} />
                <div className="text-sm">
                  <div>{a.text}</div>
                  <div className="text-[11px] text-[#78716C]">{a.at ? new Date(a.at).toLocaleString() : ""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Low stock strip */}
      {(d.low_stock > 0 || d.out_of_stock > 0) && (
        <div className="mt-6 rounded-2xl bg-[#F4A261]/10 border border-[#F4A261]/40 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-[#F4A261]" />
          <div className="text-sm">
            <span className="font-semibold">Inventory alert:</span> {d.out_of_stock} product{d.out_of_stock === 1 ? "" : "s"} out of stock, {d.low_stock} running low.
            <a href="/admin/inventory" className="ml-2 underline text-[#1B4332]">Review inventory →</a>
          </div>
        </div>
      )}
    </div>
  );
}
