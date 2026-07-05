import React, { useEffect, useState } from "react";
import { api, rupee } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, Save } from "lucide-react";
import DataTable from "./components/DataTable";
import PageHeader from "./components/PageHeader";

export default function AdminInventory() {
  const [rows, setRows] = useState([]);
  const [threshold, setThreshold] = useState(10);
  const [drafts, setDrafts] = useState({});
  const [tab, setTab] = useState("low");

  const refresh = async () => {
    if (tab === "low") {
      const { data } = await api.get(`/admin/inventory/low-stock?threshold=${threshold}`);
      setRows(data);
    } else {
      const { data } = await api.get("/products?limit=500");
      setRows(data);
    }
    setDrafts({});
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, [tab, threshold]);

  const saveAll = async () => {
    const updates = Object.entries(drafts).map(([product_id, stock]) => ({ product_id, stock: parseInt(stock, 10) || 0 }));
    if (!updates.length) return toast.info("No changes");
    await api.post("/admin/inventory/bulk", updates);
    toast.success(`Updated ${updates.length} product(s)`); refresh();
  };

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Bulk stock control + low stock alerts."
        actions={<Button onClick={saveAll} data-testid="inv-save" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Save className="w-4 h-4 mr-1" />Save changes</Button>} />
      <div className="flex items-center gap-3 mb-4">
        <div className="inline-flex bg-[#F4EFE6] rounded-full p-1">
          {[["low", "Low stock"], ["all", "All products"]].map(([k, label]) => (
            <button key={k} data-testid={`inv-tab-${k}`} onClick={() => setTab(k)} className={`px-4 h-8 rounded-full text-sm ${tab === k ? "bg-white shadow-sm" : "text-[#78716C]"}`}>{label}</button>
          ))}
        </div>
        {tab === "low" && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-[#78716C]">Threshold:</span>
            <Input data-testid="inv-threshold" type="number" value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value, 10) || 0)} className="h-8 w-20" />
          </div>
        )}
      </div>

      <DataTable
        rows={rows}
        searchKeys={["name", "sku"]}
        testIdPrefix="inv-row"
        columns={[
          { key: "name", header: "Product", sortable: true, render: (r) => (
            <div className="flex items-center gap-3">
              <img src={r.images?.[0]} className="w-9 h-9 rounded object-cover" alt="" />
              <div><div className="font-medium">{r.name}</div><div className="text-[11px] text-[#78716C]">{r.sku}</div></div>
            </div>
          )},
          { key: "category_name", header: "Category", sortable: true },
          { key: "price", header: "Price", render: (r) => rupee(r.price) },
          { key: "stock", header: "Stock", sortable: true, render: (r) => (
            <div className="flex items-center gap-2">
              {r.stock <= threshold && <AlertTriangle className="w-3.5 h-3.5 text-[#F4A261]" />}
              <Input
                type="number"
                defaultValue={r.stock}
                onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                className="h-8 w-24"
                data-testid={`inv-stock-${r.id}`}
              />
            </div>
          )},
        ]}
      />
    </div>
  );
}
