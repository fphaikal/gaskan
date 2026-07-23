"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export interface ConfirmModalProps {
  open?: boolean
  isOpen?: boolean
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  variant?: "destructive" | "default"
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmModal({
  open,
  isOpen,
  title = "Confirm Action",
  description = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  isLoading = false,
  variant = "default",
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const isModalOpen = open !== undefined ? open : (isOpen !== undefined ? isOpen : false)

  return (
    <Dialog open={isModalOpen} onOpenChange={(val) => { if (!val) onClose() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
