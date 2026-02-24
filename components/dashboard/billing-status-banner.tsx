"use client";

import { useState } from "react";

type BillingStatus = "success" | "cancelled";

const bannerContent: Record<BillingStatus, { title: string; description: string; className: string }> = {
  success: {
    title: "Billing successful",
    description: "Your subscription has been updated. Pro features are now available.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  cancelled: {
    title: "Checkout cancelled",
    description: "No payment was processed. You can retry upgrade anytime from pricing.",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
};

export function BillingStatusBanner({ status }: { status: BillingStatus }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  const content = bannerContent[status];

  return (
    <div className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 ${content.className}`}>
      <div>
        <p className="text-sm font-semibold">{content.title}</p>
        <p className="mt-1 text-sm">{content.description}</p>
      </div>
      <button
        className="rounded border border-current px-2 py-1 text-xs font-medium opacity-80 hover:opacity-100"
        onClick={() => setDismissed(true)}
        type="button"
      >
        Dismiss
      </button>
    </div>
  );
}
