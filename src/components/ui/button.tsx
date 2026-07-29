"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[calc(var(--radius)-2px)] text-sm font-medium transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 shrink-0 focus-visible:ring-2 focus-visible:ring-ring/60",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        outline: "border border-border bg-background hover:bg-muted",
        ghost: "hover:bg-muted hover:text-foreground",
        destructive:
          "bg-destructive text-white shadow-sm hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
        sitePrimary:
          "border border-transparent bg-primary text-primary-foreground shadow-site-button transition-[transform,background-color,border-color] hover:-translate-y-px hover:bg-primary-strong focus-visible:-translate-y-px focus-visible:bg-primary-strong",
        siteSecondary:
          "border border-primary-border bg-primary-soft text-ink transition-[transform,background-color,border-color] hover:-translate-y-px hover:bg-primary-soft-hover focus-visible:-translate-y-px focus-visible:bg-primary-soft-hover",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-[calc(var(--radius)-4px)] px-3 text-xs",
        lg: "h-10 px-5",
        icon: "size-9",
        site: "min-h-13.5 rounded-sm px-7 py-2 text-base [&_svg]:size-4.5",
        siteDefault: "min-h-11 rounded-sm px-4.5 py-2 [&_svg]:size-4.5",
        siteCompact: "min-h-10.5 rounded-sm px-4.5 py-2 text-sm [&_svg]:size-4.25",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
