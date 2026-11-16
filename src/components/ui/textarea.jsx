import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef(({ className, ...props }, ref) => {
  return (
    (<textarea
      className={cn(
        "flex min-h-[88px] w-full rounded-2xl border border-line bg-white px-4 py-3 text-base text-navy placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30 focus-visible:border-navy disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props} />)
  );
})
Textarea.displayName = "Textarea"

export { Textarea }
