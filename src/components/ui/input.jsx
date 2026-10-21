import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    (<input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-pw-line bg-white px-4 py-2 text-base text-pw-navy transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-pw-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy/30 focus-visible:border-pw-navy disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Input.displayName = "Input"

export { Input }
