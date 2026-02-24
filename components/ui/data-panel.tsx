import { cn } from "@/lib/utils";

type DataPanelProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
};

export function DataPanel({ title, subtitle, children, className }: DataPanelProps) {
  return (
    <article className={cn("panel space-y-4 p-5", className)}>
      <header>
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle ? <p className="mt-1 text-xs text-slate-500">{subtitle}</p> : null}
      </header>
      {children}
    </article>
  );
}
