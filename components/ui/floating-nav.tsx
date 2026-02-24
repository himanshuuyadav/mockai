"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/resume", label: "Resume" },
  { href: "/interview", label: "Interview" },
  { href: "/report", label: "Report" },
  { href: "/profile", label: "Profile" },
];

export function FloatingNav() {
  const pathname = usePathname();

  if (!items.some((item) => pathname.startsWith(item.href))) {
    return null;
  }

  return (
    <motion.nav
      animate={{ opacity: 1, y: 0 }}
      className="fixed left-1/2 top-4 z-40 flex w-[calc(100%-1.5rem)] max-w-2xl -translate-x-1/2 items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-2 py-2 backdrop-blur-xl md:w-full"
      initial={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            className={cn(
              "rounded-xl px-3 py-2 text-xs font-medium text-slate-300 transition-colors md:text-sm",
              active && "bg-cyan-400/20 text-cyan-200",
            )}
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        );
      })}
    </motion.nav>
  );
}
