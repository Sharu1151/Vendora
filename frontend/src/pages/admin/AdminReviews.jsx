import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Star, Trash2, MessageSquare, Check, X } from "lucide-react";
import DataTable from "./components/DataTable";
import PageHeader from "./components/PageHeader";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AdminReviews() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("all");
  const [replyFor, setReplyFor] = useState(null);
  const [replyText, setReplyText] = useState("");

  const refresh = () => api.get("/admin/reviews" + (filter === "all" ? "" : `?status=${filter}`)).then((r) => setRows(r.data));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, [filter]);

  const setStatus = async (id, status) => { await api.put(`/admin/reviews/${id}/status`, { status }); toast.success(`${status}`); refresh(); };
  const del = async (id) => { if (!window.confirm("Delete review?")) return; await api.delete(`/admin/reviews/${id}`); refresh(); };
  const doReply = async () => { await api.post(`/admin/reviews/${replyFor.id}/reply`, { reply: replyText }); toast.success("Reply posted"); setReplyFor(null); setReplyText(""); refresh(); };

  return (
    <div>
      <PageHeader title="Reviews" subtitle="Moderate customer reviews across your catalog." />
      <div className="mb-4 inline-flex bg-[#F4EFE6] rounded-full p-1">
        {[["all", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`px-4 h-8 rounded-full text-sm ${filter === k ? "bg-white shadow-sm" : "text-[#78716C]"}`}>{l}</button>
        ))}
      </div>
      <DataTable rows={rows} searchKeys={["user_name", "title", "body", "product_name"]} testIdPrefix="review-row" columns={[
        { key: "product_name", header: "Product", sortable: true, render: (r) => (
          <div className="flex items-center gap-3">
            {r.product_image && <img src={r.product_image} className="w-9 h-9 rounded object-cover" alt="" />}
            <div className="font-medium">{r.product_name}</div>
          </div>
        )},
        { key: "rating", header: "Rating", render: (r) => (
          <span className="inline-flex items-center gap-0.5">{Array.from({length: 5}).map((_, i) => (
            <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? "fill-[#F4A261] text-[#F4A261]" : "text-[#E7E5E4]"}`} />
          ))}</span>
        )},
        { key: "user_name", header: "By", render: (r) => <div><div>{r.user_name}</div><div className="text-[11px] text-[#78716C] max-w-md truncate">{r.body}</div></div> },
        { key: "moderation_status", header: "Status", render: (r) => (
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${r.moderation_status === "approved" ? "bg-[#40916C]/10 text-[#40916C]" : r.moderation_status === "rejected" ? "bg-[#991B1B]/10 text-[#991B1B]" : "bg-[#F4A261]/10 text-[#F4A261]"}`}>{r.moderation_status || "pending"}</span>
        )},
        { key: "actions", header: "", render: (r) => (
          <div className="flex gap-1 justify-end">
            <button className="p-1.5 rounded hover:bg-[#F4EFE6] text-[#40916C]" onClick={() => setStatus(r.id, "approved")}><Check className="w-4 h-4" /></button>
            <button className="p-1.5 rounded hover:bg-[#F4EFE6] text-[#991B1B]" onClick={() => setStatus(r.id, "rejected")}><X className="w-4 h-4" /></button>
            <button className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => { setReplyFor(r); setReplyText(r.admin_reply || ""); }}><MessageSquare className="w-4 h-4" /></button>
            <button className="p-1.5 rounded hover:bg-[#F4EFE6] text-[#991B1B]" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></button>
          </div>
        )},
      ]} />

      <Dialog open={!!replyFor} onOpenChange={(v) => !v && setReplyFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reply to review</DialogTitle></DialogHeader>
          <Textarea placeholder="Your public reply…" value={replyText} onChange={(e) => setReplyText(e.target.value)} className="min-h-[100px]" />
          <DialogFooter><Button onClick={doReply} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Post reply</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
