import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import DataTable from "./components/DataTable";
import PageHeader from "./components/PageHeader";
import { Store as StoreIcon } from "lucide-react";

export default function AdminSellers() {
  const [rows, setRows] = useState([]);
  const [profiles, setProfiles] = useState({});
  useEffect(() => {
    // Reuse admin/customers endpoint by filtering role locally via admin/reports/seller
    api.get("/admin/reports/seller").then((r) => setRows(r.data));
  }, []);
  return (
    <div>
      <PageHeader title="Sellers" subtitle="Marketplace sellers and their performance snapshot." />
      <DataTable rows={rows.map((r) => ({ ...r, id: r.seller_id }))} searchKeys={["store"]} testIdPrefix="seller-row" columns={[
        { key: "store", header: "Store", sortable: true, render: (r) => (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F4EFE6] flex items-center justify-center"><StoreIcon className="w-4 h-4" /></div>
            <div className="font-medium">{r.store}</div>
          </div>
        )},
        { key: "orders", header: "Orders" },
        { key: "items", header: "Items sold" },
        { key: "revenue", header: "Revenue", sortable: true, render: (r) => `₹${r.revenue.toLocaleString("en-IN")}` },
      ]} />
    </div>
  );
}
