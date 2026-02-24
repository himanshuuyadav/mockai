"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { parseApiResponse } from "@/lib/api-client";

export function CancelSubscriptionButton({ disabled = false }: { disabled?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/cancel", {
        method: "POST",
      });
      await parseApiResponse<Record<string, unknown>>(response);

      router.refresh();
    } catch (cancelError) {
      setError(cancelError instanceof Error ? cancelError.message : "Unable to cancel subscription.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        disabled={disabled || loading}
        onClick={() => void handleCancel()}
        type="button"
        variant="outline"
      >
        {loading ? "Processing..." : "Cancel at Period End"}
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
