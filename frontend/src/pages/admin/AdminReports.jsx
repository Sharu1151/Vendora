import React, { useEffect, useState } from "react";
import { api, rupee } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import PageHeader from "./components/PageHeader";
import DataTable from "./components/DataTable";

function SalesReport() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/admin/reports/sales?days=30").then((r) => setD(r.data)); }, []);
  if (!d) return <div className="p-6 text-sm text-[#78716C]">Loading…</div>;
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5"><div className="overline text-[#78716C]">Total orders (30d)</div><div className="font-display font-black text-2xl mt-1">{d.total_orders}</div></div>
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5"><div className="overline text-[#78716C]">Total revenue (30d)</div><div className="font-display font-black text-2xl mt-1">{rupee(d.total_revenue)}</div></div>
      </div>
      <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={d.series}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F4EFE6" />
            <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#1B4332" strokeWidth={2} />
            <Line type="monotone" dataKey="orders" stroke="#E07A5F" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TopProducts() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get("/admin/reports/top-products?limit=20").then((r) => setRows(r.data)); }, []);
  return <DataTable rows={rows.map((r, i) => ({ ...r, id: r.product_id || i }))} testIdPrefix="tp-row" columns={[
    { key: "name", header: "Product", sortable: true },
    { key: "qty", header: "Units sold", sortable: true },
    { key: "revenue", header: "Revenue", sortable: true, render: (r) => rupee(r.revenue) },
  ]} />;
}

function CustomerGrowth() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get("/admin/reports/customers").then((r) => setD(r.data)); }, []);
  if (!d) return <div className="p-6 text-sm text-[#78716C]">Loading…</div>;
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5"><div className="overline text-[#78716C]">Total customers</div><div className="font-display font-black text-2xl mt-1">{d.total}</div></div>
        <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5"><div className="overline text-[#78716C]">New in last 30d</div><div className="font-display font-black text-2xl mt-1">{d.new_last_30_days}</div></div>
      </div>
      <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={d.growth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F4EFE6" />
            <XAxis dataKey="date" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip />
            <Bar dataKey="count" fill="#E07A5F" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SellerReport() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get("/admin/reports/seller").then((r) => setRows(r.data)); }, []);
  return <DataTable rows={rows.map((r, i) => ({ ...r, id: r.seller_id || i }))} testIdPrefix="seller-report-row" columns={[
    { key: "store", header: "Store", sortable: true },
    { key: "orders", header: "Orders" },
    { key: "items", header: "Items sold" },
    { key: "revenue", header: "Revenue", sortable: true, render: (r) => rupee(r.revenue) },
  ]} />;
}

function TaxProfit() {
  const [tax, setTax] = useState(null);
  const [profit, setProfit] = useState(null);
  useEffect(() => {
    api.get("/admin/reports/tax").then((r) => setTax(r.data));
    api.get("/admin/reports/profit").then((r) => setProfit(r.data));
  }, []);
  if (!tax || !profit) return <div className="p-6 text-sm text-[#78716C]">Loading…</div>;
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5"><div className="overline">Total taxable</div><div className="font-display font-black text-2xl mt-1">{rupee(tax.total_taxable)}</div></div>
      <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5"><div className="overline">Tax collected</div><div className="font-display font-black text-2xl mt-1">{rupee(tax.total_tax_collected)}</div></div>
      <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5"><div className="overline">Revenue</div><div className="font-display font-black text-2xl mt-1">{rupee(profit.revenue)}</div></div>
      <div className="bg-white border border-[#E7E5E4] rounded-2xl p-5"><div className="overline">COGS</div><div className="font-display font-black text-2xl mt-1">{rupee(profit.cogs)}</div></div>
      <div className="col-span-2 bg-[#1B4332] text-white rounded-2xl p-5"><div className="overline text-white/70">Estimated profit</div><div className="font-display font-black text-3xl mt-1">{rupee(profit.profit)}</div></div>
    </div>
  );
}

export default function AdminReports() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Sales, product, customer, seller, tax and profit reports." />
      <Tabs defaultValue="sales">
        <TabsList className="bg-[#F4EFE6] rounded-full p-1 h-auto flex flex-wrap">
          <TabsTrigger value="sales" className="rounded-full px-4 data-[state=active]:bg-white">Sales</TabsTrigger>
          <TabsTrigger value="products" className="rounded-full px-4 data-[state=active]:bg-white">Top products</TabsTrigger>
          <TabsTrigger value="customers" className="rounded-full px-4 data-[state=active]:bg-white">Customers</TabsTrigger>
          <TabsTrigger value="sellers" className="rounded-full px-4 data-[state=active]:bg-white">Sellers</TabsTrigger>
          <TabsTrigger value="tax" className="rounded-full px-4 data-[state=active]:bg-white">Tax & Profit</TabsTrigger>
        </TabsList>
        <TabsContent value="sales" className="mt-6"><SalesReport /></TabsContent>
        <TabsContent value="products" className="mt-6"><TopProducts /></TabsContent>
        <TabsContent value="customers" className="mt-6"><CustomerGrowth /></TabsContent>
        <TabsContent value="sellers" className="mt-6"><SellerReport /></TabsContent>
        <TabsContent value="tax" className="mt-6"><TaxProfit /></TabsContent>
      </Tabs>
    </div>
  );
}
