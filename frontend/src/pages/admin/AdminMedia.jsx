import React, { useEffect, useRef, useState } from "react";
import { api, API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, Trash2, Copy, LibraryBig } from "lucide-react";
import PageHeader from "./components/PageHeader";
import EmptyState from "./components/EmptyState";

const BACKEND = process.env.REACT_APP_BACKEND_URL;

export default function AdminMedia() {
  const [rows, setRows] = useState([]);
  const [folder, setFolder] = useState("uploads");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const refresh = () => api.get("/admin/media").then((r) => setRows(r.data));
  useEffect(() => { refresh(); }, []);

  const upload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", folder);
      try { await api.post("/admin/media/upload", fd, { headers: { "Content-Type": "multipart/form-data" } }); }
      catch { toast.error(`Failed: ${file.name}`); }
    }
    setUploading(false);
    e.target.value = ""; refresh(); toast.success(`Uploaded ${files.length} file(s)`);
  };

  const del = async (id) => { if (!window.confirm("Delete file?")) return; await api.delete(`/admin/media/${id}`); refresh(); };
  const copy = (url) => { navigator.clipboard.writeText(`${BACKEND}${url}`); toast.success("URL copied"); };

  return (
    <div>
      <PageHeader title="Media Library" subtitle="Central image & file manager. Uploaded to disk, served via CDN-ready path."
        actions={<>
          <Input placeholder="folder" value={folder} onChange={(e) => setFolder(e.target.value)} className="h-9 w-40" />
          <input ref={fileRef} type="file" multiple accept="image/*,video/*" className="hidden" onChange={upload} data-testid="media-upload-input" />
          <Button onClick={() => fileRef.current?.click()} disabled={uploading} data-testid="media-upload-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]">
            <Upload className="w-4 h-4 mr-1" />{uploading ? "Uploading…" : "Upload"}
          </Button>
        </>}
      />
      {rows.length === 0 ? (
        <EmptyState icon={LibraryBig} title="No media yet" body="Upload logos, banners, product images, and videos here. They will be served at a stable URL you can paste anywhere." />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {rows.map((m) => (
            <div key={m.id} data-testid={`media-item-${m.id}`} className="group relative aspect-square rounded-2xl bg-[#F4EFE6] overflow-hidden border border-[#E7E5E4]">
              {m.mime?.startsWith("image/") ? (
                <img src={`${BACKEND}${m.url}`} className="w-full h-full object-cover" alt={m.filename} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-xs text-[#78716C] p-3 text-center">
                  <div className="font-mono truncate w-full">{m.filename}</div>
                </div>
              )}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/50 transition-opacity flex flex-col justify-between p-2">
                <div className="text-white text-[10px] truncate">{m.filename}</div>
                <div className="flex gap-1">
                  <button className="p-1.5 bg-white/90 rounded-lg hover:bg-white" onClick={() => copy(m.url)}><Copy className="w-3.5 h-3.5" /></button>
                  <button className="p-1.5 bg-white/90 rounded-lg hover:bg-white text-[#991B1B]" onClick={() => del(m.id)}><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
