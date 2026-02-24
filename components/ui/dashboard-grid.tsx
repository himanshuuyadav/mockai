import { cn } from "@/lib/utils";

type DashboardGridProps = {
  children: React.ReactNode;
  className?: string;
};

export function DashboardGrid({ children, className }: DashboardGridProps) {
  return <div className={cn("grid gap-4 md:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}
