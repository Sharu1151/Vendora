import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Send } from "lucide-react";
import DataTable from "./components/DataTable";
import PageHeader from "./components/PageHeader";

export default function AdminNotifications() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState({ key: "", channel: "email", subject: "", body: "", enabled: true });
  const [testOpen, setTestOpen] = useState(false);
  const [testFor, setTestFor] = useState(null);
  const [testTo, setTestTo] = useState("");

  const refresh = () => api.get("/admin/notifications/templates").then((r) => setRows(r.data));
  useEffect(() => { refresh(); }, []);

  const openNew = () => { setEditing(null); setF({ key: "", channel: "email", subject: "", body: "", enabled: true }); setOpen(true); };
  const openEdit = (r) => { setEditing(r.id); setF({ ...r }); setOpen(true); };
  const save = async () => {
    if (editing) await api.put(`/admin/notifications/templates/${editing}`, f); else await api.post("/admin/notifications/templates", f);
    toast.success("Saved"); setOpen(false); refresh();
  };
  const del = async (id) => { if (!window.confirm("Delete template?")) return; await api.delete(`/admin/notifications/templates/${id}`); refresh(); };

  const sendTest = async () => {
    const { data } = await api.post("/admin/notifications/test", { template_id: testFor.id, to: testTo });
    toast.success(`MOCKED: would send via ${testFor.channel} to ${testTo}`); setTestOpen(false);
  };

  return (
    <div>
      <PageHeader title="Notification Templates" subtitle="Email / SMS / WhatsApp / Push templates. Sends are MOCKED until you add provider keys."
        actions={<Button onClick={openNew} data-testid="notif-new-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Plus className="w-4 h-4 mr-1" />New template</Button>} />

      <DataTable rows={rows} searchKeys={["key", "channel"]} testIdPrefix="notif-row" columns={[
        { key: "key", header: "Key", sortable: true },
        { key: "channel", header: "Channel", render: (r) => <span className="text-xs uppercase font-bold">{r.channel}</span> },
        { key: "subject", header: "Subject" },
        { key: "enabled", header: "Enabled", render: (r) => r.enabled ? "✓" : "" },
        { key: "actions", header: "", render: (r) => (
          <div className="flex gap-1 justify-end">
            <button className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => { setTestFor(r); setTestOpen(true); }} title="Send test (mocked)"><Send className="w-4 h-4" /></button>
            <button className="p-1.5 rounded hover:bg-[#F4EFE6]" onClick={() => openEdit(r)}><Pencil className="w-4 h-4" /></button>
            <button className="p-1.5 rounded hover:bg-[#F4EFE6] text-[#991B1B]" onClick={() => del(r.id)}><Trash2 className="w-4 h-4" /></button>
          </div>
        )},
      ]} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit" : "New"} template</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Key (e.g. order.confirmed)" value={f.key} onChange={(e) => setF({ ...f, key: e.target.value })} />
            <Select value={f.channel} onValueChange={(v) => setF({ ...f, channel: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["email", "sms", "whatsapp", "push"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Input className="col-span-2" placeholder="Subject" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
            <Textarea className="col-span-2" placeholder="Body (supports {{variables}})" value={f.body} onChange={(e) => setF({ ...f, body: e.target.value })} rows={8} />
            <label className="col-span-2 text-sm inline-flex items-center gap-2"><input type="checkbox" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })} /> Enabled</label>
          </div>
          <DialogFooter><Button onClick={save} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={testOpen} onOpenChange={setTestOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send test (mocked)</DialogTitle></DialogHeader>
          <div className="text-sm text-[#78716C] mb-2">Real sends are disabled until you add provider credentials. The test call will log the payload only.</div>
          <Input placeholder={testFor?.channel === "email" ? "recipient@example.com" : "+91 phone number"} value={testTo} onChange={(e) => setTestTo(e.target.value)} />
          <DialogFooter><Button onClick={sendTest} className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">Send test</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
