import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return <main className={cn("mx-auto w-full max-w-7xl px-6 py-12 md:px-10", className)}>{children}</main>;
}
