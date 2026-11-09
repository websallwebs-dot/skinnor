import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900/20 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-slate-900 text-white shadow-xs hover:bg-slate-800 active:bg-slate-950",
        destructive: "bg-rose-600 text-white shadow-xs hover:bg-rose-700 active:bg-rose-800",
        outline: "border border-slate-200 bg-white shadow-2xs hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 text-slate-700",
        secondary: "bg-slate-100 text-slate-900 shadow-2xs hover:bg-slate-200/80 border border-slate-200/60",
        ghost: "hover:bg-slate-100 hover:text-slate-900 text-slate-600",
        link: "text-slate-900 underline-offset-4 hover:underline",
        emerald: "bg-slate-900 text-white shadow-xs hover:bg-slate-800 active:bg-slate-950",
        "emerald-outline": "border border-slate-200 bg-white text-slate-800 shadow-2xs hover:bg-slate-50 hover:border-slate-300",
      },
      size: {
        default: "h-9 px-4 py-2 text-xs",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-lg px-6 text-sm",
        icon: "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
