import Link from "next/link";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AnimatedButtonProps = ButtonProps & {
  href?: string;
};

export function AnimatedButton({ className, href, children, ...props }: AnimatedButtonProps) {
  const content = <span className="inline-flex items-center gap-2">{children}</span>;

  if (href) {
    return (
      <Button asChild className={cn(className)} {...props}>
        <Link href={href}>{content}</Link>
      </Button>
    );
  }

  return (
    <Button className={cn(className)} {...props}>
      {content}
    </Button>
  );
}
