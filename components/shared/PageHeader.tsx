"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface PageHeaderProps {
  title: string
  subtitle?: string
  description?: string
  onAction?: () => void
  actionLabel?: string
  actionIcon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  description,
  onAction,
  actionLabel,
  actionIcon,
  actions,
  className,
}: PageHeaderProps) {
  const subText = subtitle || description

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-6 border-b mb-6",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {subText && (
          <p className="text-sm text-muted-foreground">
            {subText}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {actions}
        {onAction && actionLabel && (
          <Button onClick={onAction} className="flex items-center gap-2">
            {actionIcon && <span className="shrink-0">{actionIcon}</span>}
            <span>{actionLabel}</span>
          </Button>
        )}
      </div>
    </div>
  )
}
