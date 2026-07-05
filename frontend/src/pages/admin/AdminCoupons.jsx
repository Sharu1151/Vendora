import React, { useEffect, useState } from "react";
import { api, rupee } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import DataTable from "./components/DataTable";
import PageHeader from "./components/PageHeader";

export default function AdminCoupons() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ code: "", discount_pct: 10, max_discount: 200, min_order: 199, active: true });

  const refresh = () => api.get("/coupons").then((r) => setRows(r.data));
  useEffect(() => { refresh(); }, []);

  const save = async () => {
    try {
      await api.post("/coupons", { ...f, code: f.code.toUpperCase(), discount_pct: parseInt(f.discount_pct, 10) || 0, max_discount: parseFloat(f.max_discount) || 0, min_order: parseFloat(f.min_order) || 0 });
      toast.success("Coupon created"); setOpen(false); refresh();
      setF({ code: "", discount_pct: 10, max_discount: 200, min_order: 199, active: true });
    } catch (e) { toast.error(e.response?.data?.detail || "Failed"); }
  };

  return (
    <div>
      <PageHeader title="Coupons" subtitle="Simple percentage coupons redeemable at checkout. For advanced rules see Discounts."
        actions={<Button onClick={() => setOpen(true)} data-testid="coupon-new-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Plus className="w-4 h-4 mr-1" />New coupon</Button>} />
      <DataTable rows={rows} searchKeys={["code"]} testIdPrefix="coupon-row" columns={[
        { key: "code", header: "Code", render: (r) => <span className="font-mono bg-[#F4EFE6] px-2 py-0.5 rounded text-xs">{r.code}</span> },
        { key: "discount_pct", header: "Discount", render: (r) => `${r.discount_pct}%` },
        { key: "max_discount", header: "Max", render: (r) => rupee(r.max_discount) },
        { key: "min_order", header: "Min order", render: (r) => rupee(r.min_order) },
        { key: "active", header: "Active", render: (r) => r.active ? "✓" : "" },
      ]} />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New coupon</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input className="col-span-2" placeholder="Code" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} />
            <Input type="number" placeholder="Discount %" value={f.discount_pct} onChange={(e) => setF({ ...f, discount_pct: e.target.value })} />
            <Input type="number" placeholder="Max discount ₹" value={f.max_discount} onChange={(e) => setF({ ...f, max_discount: e.target.value })} />
            <Input type="number" placeholder="Min order ₹" value={f.min_order} onChange={(e) => setF({ ...f, min_order: e.target.value })} />
            <label className="col-span-2 text-sm inline-flex items-center gap-2"><input type="checkbox" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} /> Active</label>
          </div>
          <DialogFooter><Button onClick={save} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Create</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
