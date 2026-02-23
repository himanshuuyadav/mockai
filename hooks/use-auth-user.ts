"use client";

import { useSession } from "next-auth/react";

export function useAuthUser() {
  const { data, status } = useSession();

  return {
    user: data?.user,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
