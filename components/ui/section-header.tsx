import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeader({ eyebrow, title, description, align = "left" }: SectionHeaderProps) {
  return (
    <header className={cn("space-y-2", align === "center" && "text-center")}>
      {eyebrow ? (
        <p className="text-xs uppercase tracking-[0.16em] text-indigo-600">{eyebrow}</p>
      ) : null}
      <h2 className="text-balance text-2xl font-semibold text-slate-900 md:text-4xl">{title}</h2>
      {description ? <p className="max-w-3xl text-sm text-slate-600 md:text-base">{description}</p> : null}
    </header>
  );
}
