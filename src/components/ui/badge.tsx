import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-slate-400",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-900 text-white shadow-xs",
        secondary: "border-transparent bg-slate-100 text-slate-900",
        destructive: "border-transparent bg-rose-100 text-rose-800 border-rose-200",
        outline: "text-slate-950 border-slate-200",
        ghost: "border-transparent bg-transparent text-slate-700",
        success: "border-emerald-200 bg-emerald-50 text-emerald-800",
        warning: "border-amber-200 bg-amber-50 text-amber-800",
        info: "border-sky-200 bg-sky-50 text-sky-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
