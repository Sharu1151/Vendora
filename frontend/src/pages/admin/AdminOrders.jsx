import React, { useEffect, useState } from "react";
import { api, rupee } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Eye, Printer, RefreshCw, RotateCcw, Truck, Save } from "lucide-react";
import DataTable from "./components/DataTable";
import PageHeader from "./components/PageHeader";

const STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "refunded"];

export default function AdminOrders() {
  const [rows, setRows] = useState([]);
  const [detail, setDetail] = useState(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundAmt, setRefundAmt] = useState(0);
  const [refundReason, setRefundReason] = useState("");
  const [invoice, setInvoice] = useState(null);

  const refresh = () => api.get("/admin/orders").then((r) => setRows(r.data));
  useEffect(() => { refresh(); }, []);

  const updateStatus = async (oid, status) => {
    await api.put(`/admin/orders/${oid}`, { status });
    toast.success("Status updated"); refresh();
  };
  const saveDetail = async () => {
    await api.put(`/admin/orders/${detail.id}`, {
      status: detail.status,
      delivery_assignee: detail.delivery_assignee || "",
      tracking_no: detail.tracking_no || "",
      notes: detail.notes || "",
    });
    toast.success("Saved"); setDetail(null); refresh();
  };
  const doRefund = async () => {
    await api.post(`/admin/orders/${detail.id}/refund`, { amount: parseFloat(refundAmt) || 0, reason: refundReason });
    toast.success("Refund recorded"); setRefundOpen(false); refresh();
  };
  const showInvoice = async (oid) => {
    const { data } = await api.get(`/admin/orders/${oid}/invoice`);
    setInvoice(data);
  };
  const printInvoice = () => window.print();

  return (
    <div>
      <PageHeader title="Orders" subtitle="Manage the full order lifecycle — status, delivery, invoicing, refunds & returns." />
      <DataTable
        rows={rows}
        searchKeys={["id", "user_name", "user_email", "status", "payment_status"]}
        testIdPrefix="order-row"
        columns={[
          { key: "id", header: "Order", render: (r) => <div><div className="font-mono text-xs">#{r.id.slice(0,8).toUpperCase()}</div><div className="text-[10px] text-[#78716C]">{new Date(r.created_at).toLocaleDateString()}</div></div> },
          { key: "user_name", header: "Customer", sortable: true, render: (r) => <div><div className="font-medium">{r.user_name}</div><div className="text-[11px] text-[#78716C]">{r.user_email}</div></div> },
          { key: "total", header: "Total", sortable: true, render: (r) => <span className="font-medium">{rupee(r.total)}</span> },
          { key: "payment_status", header: "Payment", render: (r) => (
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${r.payment_status === "paid" ? "bg-[#40916C]/10 text-[#40916C]" : "bg-[#F4A261]/10 text-[#F4A261]"}`}>{r.payment_status}</span>
          )},
          { key: "status", header: "Status", render: (r) => (
            <Select value={r.status} onValueChange={(v) => updateStatus(r.id, v)}>
              <SelectTrigger data-testid={`order-status-${r.id}`} className="h-8 w-36"><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          )},
          { key: "actions", header: "", render: (r) => (
            <div className="flex gap-1 justify-end">
              <button className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => setDetail(r)} title="Details" data-testid={`order-view-${r.id}`}><Eye className="w-4 h-4" /></button>
              <button className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => showInvoice(r.id)} title="Invoice"><Printer className="w-4 h-4" /></button>
            </div>
          )},
        ]}
      />

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          {detail && (
            <>
              <DialogHeader><DialogTitle>Order #{detail.id.slice(0,8).toUpperCase()}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-[10px] uppercase text-[#78716C] tracking-widest">Customer</div><div>{detail.user_name}<br/>{detail.user_email}</div></div>
                <div><div className="text-[10px] uppercase text-[#78716C] tracking-widest">Total</div><div className="font-display font-bold text-lg">{rupee(detail.total)}</div></div>
                <div className="col-span-2 rounded-xl border border-[#E7E5E4] divide-y">
                  {detail.items.map((it, i) => (
                    <div key={i} className="p-3 flex items-center gap-3">
                      {it.image && <img src={it.image} className="w-10 h-10 rounded object-cover" alt="" />}
                      <div className="flex-1"><div className="text-sm">{it.name}</div><div className="text-[11px] text-[#78716C]">Qty {it.qty} · {rupee(it.price)}</div></div>
                      {it.seller_store_name && <div className="text-[11px] text-[#78716C]">Sold by {it.seller_store_name}</div>}
                    </div>
                  ))}
                </div>
                <Input placeholder="Delivery assignee" value={detail.delivery_assignee || ""} onChange={(e) => setDetail({ ...detail, delivery_assignee: e.target.value })} />
                <Input placeholder="Tracking number" value={detail.tracking_no || ""} onChange={(e) => setDetail({ ...detail, tracking_no: e.target.value })} />
                <Textarea className="col-span-2" placeholder="Internal notes" value={detail.notes || ""} onChange={(e) => setDetail({ ...detail, notes: e.target.value })} />
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setRefundOpen(true)} className="rounded-full"><RotateCcw className="w-4 h-4 mr-1" />Refund</Button>
                <Button variant="outline" onClick={() => showInvoice(detail.id)} className="rounded-full"><Printer className="w-4 h-4 mr-1" />Invoice</Button>
                <Button onClick={saveDetail} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Save className="w-4 h-4 mr-1" />Save</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Issue refund</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Input type="number" placeholder="Amount ₹" value={refundAmt} onChange={(e) => setRefundAmt(e.target.value)} />
            <Textarea placeholder="Reason" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
          </div>
          <DialogFooter><Button onClick={doRefund} className="rounded-full bg-[#991B1B] hover:bg-[#7f1616]">Record refund</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!invoice} onOpenChange={(v) => !v && setInvoice(null)}>
        <DialogContent className="max-w-3xl print:shadow-none">
          {invoice && (
            <div id="invoice-print">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-3xl font-display font-black">{invoice.store.name}</div>
                  <div className="text-sm text-[#78716C]">{invoice.store.address}</div>
                  <div className="text-sm text-[#78716C]">GSTIN: {invoice.store.gst_number}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase text-[#78716C] tracking-widest">Tax Invoice</div>
                  <div className="font-mono text-sm mt-1">{invoice.invoice_no}</div>
                  <div className="text-xs text-[#78716C]">{new Date(invoice.order.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-2 text-sm">
                <div><div className="text-[10px] uppercase text-[#78716C]">Bill to</div>{invoice.order.user_name}<br/>{invoice.order.user_email}</div>
                <div><div className="text-[10px] uppercase text-[#78716C]">Payment</div>{invoice.order.payment_status.toUpperCase()}</div>
              </div>
              <table className="mt-6 w-full text-sm border-t border-b border-[#E7E5E4]">
                <thead><tr className="text-left text-[10px] uppercase text-[#78716C]"><th className="py-2">Item</th><th className="py-2">Qty</th><th className="py-2">Price</th><th className="py-2 text-right">Total</th></tr></thead>
                <tbody>
                  {invoice.order.items.map((it, i) => (
                    <tr key={i} className="border-t border-[#F4EFE6]">
                      <td className="py-2">{it.name}</td><td>{it.qty}</td><td>{rupee(it.price)}</td><td className="text-right">{rupee(it.price * it.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 flex justify-end text-sm">
                <div className="w-64 space-y-1">
                  <div className="flex justify-between"><span className="text-[#78716C]">Subtotal</span><span>{rupee(invoice.order.subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-[#78716C]">Discount</span><span>-{rupee(invoice.order.discount)}</span></div>
                  <div className="flex justify-between font-display font-black text-lg border-t border-[#E7E5E4] pt-2"><span>Total</span><span>{rupee(invoice.order.total)}</span></div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter><Button onClick={printInvoice} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Printer className="w-4 h-4 mr-1" />Print</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
