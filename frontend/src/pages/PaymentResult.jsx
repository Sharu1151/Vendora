import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useApp } from "@/context/AppContext";

export default function PaymentResult({ result }) {
  const [params] = useSearchParams();
  const sid = params.get("session_id");
  const [status, setStatus] = useState("polling");
  const [orderId, setOrderId] = useState(null);
  const { refreshCart } = useApp();

  useEffect(() => {
    if (result === "cancel") { setStatus("cancelled"); return; }
    if (!sid) return;
    let tries = 0;
    const poll = async () => {
      try {
        const { data } = await api.get(`/payments/status/${sid}`);
        setOrderId(data.order_id);
        if (data.payment_status === "paid") { setStatus("paid"); refreshCart(); return; }
        if (data.payment_status === "failed" || data.payment_status === "expired") { setStatus("failed"); return; }
      } catch {}
      tries++;
      if (tries < 15) setTimeout(poll, 2000);
      else setStatus("failed");
    };
    poll();
  }, [sid, result, refreshCart]);

  return (
    <div className="container-x py-24 text-center">
      {status === "polling" && (
        <>
          <Loader2 className="w-16 h-16 mx-auto animate-spin text-[#1B4332]" />
          <div className="font-display text-3xl font-bold mt-6">Confirming your payment…</div>
          <div className="text-[#78716C] mt-2">Please don't close this page.</div>
        </>
      )}
      {status === "paid" && (
        <>
          <CheckCircle2 className="w-20 h-20 mx-auto text-[#40916C]" />
          <div data-testid="payment-success-title" className="font-display font-black text-4xl md:text-5xl mt-6">Order Confirmed!</div>
          <div className="text-[#78716C] mt-3 max-w-md mx-auto">Fresh produce is being packed. You'll receive delivery updates on your registered phone.</div>
          <div className="mt-8 flex justify-center gap-3">
            <Link data-testid="view-orders-btn" to={`/account?tab=orders`} className="btn-primary">View my orders</Link>
            <Link to="/" className="btn-outline">Continue Shopping</Link>
          </div>
        </>
      )}
      {status === "cancelled" && (
        <>
          <XCircle className="w-16 h-16 mx-auto text-[#F4A261]" />
          <div className="font-display font-black text-3xl mt-6">Payment Cancelled</div>
          <div className="text-[#78716C] mt-2">Your cart is saved. You can retry checkout anytime.</div>
          <Link to="/cart" className="btn-primary mt-8 inline-flex">Back to Cart</Link>
        </>
      )}
      {status === "failed" && (
        <>
          <XCircle className="w-16 h-16 mx-auto text-[#991B1B]" />
          <div className="font-display font-black text-3xl mt-6">Payment Failed</div>
          <div className="text-[#78716C] mt-2">We couldn't confirm your payment. Please try again.</div>
          <Link to="/cart" className="btn-primary mt-8 inline-flex">Try Again</Link>
        </>
      )}
    </div>
  );
}
