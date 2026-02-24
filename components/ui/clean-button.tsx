import * as React from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function CleanButton({ className, ...props }: ButtonProps) {
  return <Button className={cn("h-10 rounded-md", className)} {...props} />;
}
