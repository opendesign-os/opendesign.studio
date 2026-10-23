import type { VariantProps } from "class-variance-authority"
import { cva } from "class-variance-authority"

export { default as Badge } from "./Badge.vue"

export const badgeVariants = cva(
  "inline-flex h-5 items-center justify-center gap-1 rounded-md border border-transparent px-1.5 text-[11px] leading-none font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        neutral: "bg-accent text-muted-foreground",
        accent: "bg-primary/12 text-primary",
        info: "bg-media/15 text-media",
        success: "bg-success/15 text-success",
        warn: "bg-container/15 text-container",
        danger: "bg-destructive/12 text-destructive",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
)
export type BadgeVariants = VariantProps<typeof badgeVariants>
