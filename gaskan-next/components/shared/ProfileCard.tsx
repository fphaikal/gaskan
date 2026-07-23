"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Mail, Edit } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ProfileUser {
  name: string
  email: string
  role?: string
  avatarUrl?: string
  avatar?: string
  lastLogin?: string | Date
}

export interface ProfileCardProps {
  user: ProfileUser
  onEdit?: () => void
  onAction?: () => void
  actionLabel?: string
  actions?: React.ReactNode
  className?: string
}

export function ProfileCard({
  user,
  onEdit,
  onAction,
  actionLabel,
  actions,
  className,
}: ProfileCardProps) {
  const getInitials = (name: string) => {
    if (!name) return "U"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const formatLastLogin = (lastLogin?: string | Date) => {
    if (!lastLogin) return "N/A"
    if (typeof lastLogin === "string") return lastLogin
    return lastLogin.toLocaleString()
  }

  const avatarSrc = user.avatarUrl || user.avatar

  return (
    <Card className={cn("w-full max-w-md shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar size="lg" className="h-16 w-16 text-lg">
          {avatarSrc && <AvatarImage src={avatarSrc} alt={user.name} />}
          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
        </Avatar>

        <div className="flex flex-col space-y-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg truncate text-foreground">
              {user.name}
            </h3>
            {user.role && (
              <Badge variant="secondary" className="capitalize shrink-0">
                {user.role}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
            <Mail className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-2 text-xs space-y-2">
        {user.lastLogin && (
          <div className="flex items-center gap-2 text-muted-foreground bg-muted/40 p-2 rounded-md">
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground/70" />
            <span>
              Last login: <strong className="text-foreground font-medium">{formatLastLogin(user.lastLogin)}</strong>
            </span>
          </div>
        )}
      </CardContent>

      {(onEdit || onAction || actions) && (
        <CardFooter className="flex items-center justify-end gap-2 pt-2">
          {actions}
          {onEdit && (
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
              <Edit className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Button>
          )}
          {onAction && actionLabel && (
            <Button size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
