import React from "react";
import { PackageOpen } from "lucide-react";

export default function EmptyState({ icon: Icon = PackageOpen, title = "Nothing here yet", body = "", action }) {
  return (
    <div className="bg-white border border-dashed border-[#E7E5E4] rounded-2xl p-10 text-center">
      <Icon className="w-8 h-8 mx-auto text-[#78716C]" />
      <div className="mt-3 font-medium">{title}</div>
      {body && <div className="text-sm text-[#78716C] mt-1 max-w-md mx-auto">{body}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
