import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-navy text-white hover:bg-navy-deep",
        destructive:
          "bg-not-yet text-white hover:bg-not-yet",
        outline:
          "border-2 border-navy bg-transparent text-navy hover:bg-tint",
        secondary:
          "bg-tint text-navy hover:bg-line",
        ghost: "text-navy hover:bg-tint",
        link: "text-navy underline underline-offset-4 decoration-navy/40 hover:decoration-navy",
      },
      size: {
        default: "min-h-11 px-5 py-2",
        sm: "min-h-11 px-4 text-sm",
        lg: "min-h-[52px] px-8 text-lg",
        icon: "h-11 w-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    (<Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />)
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }