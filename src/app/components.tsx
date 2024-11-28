"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function WithTooltip({ text, children }: { text: string, children: React.ReactNode }) {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent>
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}