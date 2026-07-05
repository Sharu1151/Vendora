import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Trash2, GripVertical, Save } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import PageHeader from "./components/PageHeader";

const SECTION_TYPES = [
  { key: "hero", label: "Hero Slider" },
  { key: "categories", label: "Featured Categories" },
  { key: "featured", label: "Featured Products" },
  { key: "trending", label: "Trending Products" },
  { key: "flash", label: "Flash Sale" },
  { key: "brands", label: "Top Brands" },
  { key: "banner", label: "Banner" },
  { key: "video", label: "Video Section" },
  { key: "testimonials", label: "Testimonials" },
  { key: "blog", label: "Blog Highlights" },
  { key: "newsletter", label: "Newsletter" },
  { key: "app", label: "App Download" },
];

function SortableSection({ s, onChange, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: s.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-[#E7E5E4] rounded-2xl p-4 flex items-center gap-3">
      <button {...attributes} {...listeners} className="p-2 cursor-grab active:cursor-grabbing text-[#78716C]">
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 grid grid-cols-3 gap-2 items-center">
        <div className="text-sm">
          <div className="font-medium">{SECTION_TYPES.find((t) => t.key === s.key)?.label || s.key}</div>
          <div className="text-[10px] uppercase tracking-widest text-[#78716C]">{s.key}</div>
        </div>
        <Input placeholder="Section title" value={s.title} onChange={(e) => onChange({ ...s, title: e.target.value })} />
        <label className="inline-flex items-center gap-2 text-sm justify-end">
          <input type="checkbox" checked={s.enabled} onChange={(e) => onChange({ ...s, enabled: e.target.checked })} />
          {s.enabled ? "Enabled" : "Disabled"}
        </label>
      </div>
      <button className="p-2 rounded hover:bg-[#F4EFE6] text-[#991B1B]" onClick={() => onDelete(s.id)}><Trash2 className="w-4 h-4" /></button>
    </div>
  );
}

export default function AdminHomepage() {
  const [sections, setSections] = useState([]);
  const [adding, setAdding] = useState("hero");

  const refresh = () => api.get("/admin/homepage").then((r) => setSections(r.data));
  useEffect(() => { refresh(); }, []);

  const onDragEnd = (e) => {
    const { active, over } = e; if (!over || active.id === over.id) return;
    const oldIx = sections.findIndex((s) => s.id === active.id);
    const newIx = sections.findIndex((s) => s.id === over.id);
    setSections(arrayMove(sections, oldIx, newIx));
  };

  const addSection = () => {
    setSections([...sections, { id: crypto.randomUUID(), key: adding, title: SECTION_TYPES.find((t) => t.key === adding)?.label || adding, enabled: true, config: {}, order: sections.length }]);
  };
  const updateSection = (s2) => setSections((arr) => arr.map((s) => s.id === s2.id ? s2 : s));
  const removeSection = (id) => setSections((arr) => arr.filter((s) => s.id !== id));

  const save = async () => {
    await api.put("/admin/homepage", sections);
    toast.success("Homepage saved"); refresh();
  };

  return (
    <div>
      <PageHeader
        title="Homepage Builder"
        subtitle="Drag sections to reorder. Toggle to enable / disable. Add or remove sections anytime."
        actions={<>
          <div className="flex items-center gap-2">
            <Select value={adding} onValueChange={setAdding}>
              <SelectTrigger className="h-9 w-56"><SelectValue /></SelectTrigger>
              <SelectContent>{SECTION_TYPES.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" onClick={addSection} className="h-9 rounded-full" data-testid="hp-add-section"><Plus className="w-4 h-4 mr-1" />Add</Button>
          </div>
          <Button onClick={save} data-testid="hp-save-btn" className="rounded-full bg-[#1B4332] hover:bg-[#2D6A4F]"><Save className="w-4 h-4 mr-1" />Save layout</Button>
        </>}
      />

      {sections.length === 0 ? (
        <div className="bg-white border border-dashed border-[#E7E5E4] rounded-2xl p-10 text-center text-sm text-[#78716C]">
          Empty homepage. Add sections above to get started.
        </div>
      ) : (
        <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {sections.map((s) => (
                <SortableSection key={s.id} s={s} onChange={updateSection} onDelete={removeSection} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
