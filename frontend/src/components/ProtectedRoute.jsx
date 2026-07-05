import React from "react";
import { Navigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loadingUser } = useApp();

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1B4332] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-[#78716C] font-semibold text-sm">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
