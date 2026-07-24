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
  const hasActions = Boolean(actions || (onAction && actionLabel))

  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-center sm:justify-between sm:pb-6",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        {subText && (
          <p className="max-w-3xl break-words text-sm text-muted-foreground">
            {subText}
          </p>
        )}
      </div>

      {hasActions && (
        <div className="flex w-full min-w-0 flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
          {actions}
          {onAction && actionLabel && (
            <Button onClick={onAction} className="flex w-full items-center gap-2 sm:w-auto">
              {actionIcon && <span className="shrink-0">{actionIcon}</span>}
              <span className="truncate">{actionLabel}</span>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
