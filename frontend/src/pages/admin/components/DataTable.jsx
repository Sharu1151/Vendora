import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search, Download, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DataTable({
  columns,       // [{ key, header, render?, sortable?, className? }]
  rows,
  searchable = true,
  searchKeys,    // fields to search across
  actions,       // right-side buttons (JSX)
  bulkActions,   // (selectedIds) => JSX
  onExport,      // callback for export button
  pageSize = 10,
  rowKey = "id",
  emptyText = "No records yet.",
  testIdPrefix = "row",
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());

  const filtered = useMemo(() => {
    if (!q) return rows;
    const s = q.toLowerCase();
    const keys = searchKeys || columns.map((c) => c.key);
    return rows.filter((r) => keys.some((k) => String(r[k] ?? "").toLowerCase().includes(s)));
  }, [rows, q, columns, searchKeys]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const arr = [...filtered];
    arr.sort((a, b) => {
      const av = a[sort.key], bv = b[sort.key];
      if (av === bv) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      return sort.dir === "asc" ? (av > bv ? 1 : -1) : av > bv ? -1 : 1;
    });
    return arr;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const pageRows = sorted.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  const toggleRow = (id) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const toggleAll = () => {
    setSelected((s) => (s.size === pageRows.length ? new Set() : new Set(pageRows.map((r) => r[rowKey]))));
  };

  return (
    <div className="bg-white border border-[#E7E5E4] rounded-2xl overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-[#E7E5E4] bg-[#FAF8F3]">
        {searchable && (
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#78716C]" />
            <Input
              data-testid="datatable-search"
              placeholder="Search…"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              className="h-9 pl-9 bg-white"
            />
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {selected.size > 0 && bulkActions && (
            <div className="flex items-center gap-2 mr-2 text-sm">
              <span className="text-[#78716C]">{selected.size} selected</span>
              {bulkActions(Array.from(selected), () => setSelected(new Set()))}
            </div>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} data-testid="datatable-export" className="h-9">
              <Download className="w-4 h-4 mr-1" /> Export
            </Button>
          )}
          {actions}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white text-left">
            <tr className="text-[#78716C] uppercase text-[10px] tracking-widest">
              {bulkActions && (
                <th className="px-4 py-3 w-8">
                  <input type="checkbox" checked={selected.size === pageRows.length && pageRows.length > 0} onChange={toggleAll} />
                </th>
              )}
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-3 ${c.className || ""}`}>
                  {c.sortable ? (
                    <button className="inline-flex items-center gap-1" onClick={() => toggleSort(c.key)}>
                      {c.header}
                      {sort.key === c.key && (sort.dir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                    </button>
                  ) : c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 && (
              <tr><td colSpan={columns.length + (bulkActions ? 1 : 0)} className="px-4 py-12 text-center text-[#78716C]">{emptyText}</td></tr>
            )}
            {pageRows.map((r) => (
              <tr key={r[rowKey]} className="border-t border-[#F4EFE6] hover:bg-[#FAF8F3]/50" data-testid={`${testIdPrefix}-${r[rowKey]}`}>
                {bulkActions && (
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(r[rowKey])} onChange={() => toggleRow(r[rowKey])} />
                  </td>
                )}
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 ${c.className || ""}`}>
                    {c.render ? c.render(r) : String(r[c.key] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-[#E7E5E4] text-sm text-[#78716C] bg-[#FAF8F3]">
        <div>Page {page} of {totalPages} · {sorted.length} row{sorted.length === 1 ? "" : "s"}</div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="h-8">Prev</Button>
          <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="h-8">Next</Button>
        </div>
      </div>
    </div>
  );
}
