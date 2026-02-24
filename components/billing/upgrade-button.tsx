"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { parseApiResponse } from "@/lib/api-client";

export function UpgradeButton({ disabled = false }: { disabled?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
      });
      const payload = await parseApiResponse<{ checkoutUrl: string }>(response);

      window.location.assign(payload.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Unable to start checkout.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button disabled={disabled || loading} onClick={() => void handleUpgrade()} type="button">
        {loading ? "Redirecting..." : "Upgrade to Pro"}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
