import { cn } from "@/lib/utils";

type SectionLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

export function SectionLayout({ children, className }: SectionLayoutProps) {
  return <section className={cn("space-y-5", className)}>{children}</section>;
}
