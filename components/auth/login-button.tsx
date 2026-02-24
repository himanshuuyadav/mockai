"use client";

import { signIn } from "next-auth/react";

import { AnimatedButton } from "@/components/ui/animated-button";

export function LoginButton() {
  return (
    <AnimatedButton className="w-full" onClick={() => signIn("google", { callbackUrl: "/dashboard" })}>
      Continue with Google
    </AnimatedButton>
  );
}
