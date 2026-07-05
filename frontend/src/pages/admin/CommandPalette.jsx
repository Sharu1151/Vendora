import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { FLAT_MODULES } from "./modules";
import { Search } from "lucide-react";

export default function CommandPalette({ open, onClose }) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  useEffect(() => { if (!open) setQ(""); }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/40" onClick={onClose} data-testid="admin-command-palette">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <Command shouldFilter={true} loop>
          <div className="flex items-center gap-2 border-b border-[#E7E5E4] px-4">
            <Search className="w-4 h-4 text-[#78716C]" />
            <Command.Input
              autoFocus
              value={q}
              onValueChange={setQ}
              placeholder="Jump to any module or action…"
              className="h-12 flex-1 outline-none text-sm bg-transparent"
            />
            <span className="text-[10px] font-mono text-[#78716C] border border-[#E7E5E4] rounded px-1.5 py-0.5">ESC</span>
          </div>
          <Command.List className="max-h-80 overflow-y-auto py-2">
            <Command.Empty className="px-4 py-8 text-center text-sm text-[#78716C]">No matches</Command.Empty>
            <Command.Group heading="Modules" className="px-2 text-[10px] uppercase tracking-widest text-[#78716C]">
              {FLAT_MODULES.map((m) => (
                <Command.Item
                  key={m.key}
                  value={m.label + " " + m.key}
                  onSelect={() => { nav(m.path); onClose(); }}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer aria-selected:bg-[#F4EFE6]"
                >
                  <m.icon className="w-4 h-4" />
                  <span className="text-sm text-[#1C1917] normal-case tracking-normal">{m.label}</span>
                  <span className="ml-auto text-[10px] text-[#78716C]">{m.path}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
