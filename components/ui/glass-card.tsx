import * as React from "react";

import { cn } from "@/lib/utils";

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  glow?: boolean;
};

export function GlassCard({ className, glow = false, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "glass-surface rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/20",
        glow && "glow-ring",
        className,
      )}
      {...props}
    />
  );
}
