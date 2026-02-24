export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as unknown;

  // Backward compatibility for legacy route payloads.
  if (typeof payload === "object" && payload !== null && "success" in payload) {
    const typed = payload as ApiEnvelope<T>;
    if (!typed.success) {
      throw new Error(typed.error || "Request failed.");
    }
    return (typed.data ?? {}) as T;
  }

  const legacy = payload as { error?: string };
  if (!response.ok) {
    throw new Error(legacy.error || "Request failed.");
  }

  return payload as T;
}
