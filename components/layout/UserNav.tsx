'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User as UserIcon, LogOut, ChevronDown } from 'lucide-react';

export function UserNav() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const displayName = user?.nama || user?.username || 'User';
  const displayRole = user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : 'Siswa';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            className="relative flex h-10 max-w-56 items-center gap-0 rounded-xl px-1.5 min-[360px]:gap-1 md:gap-2 md:px-2"
          >
            <Avatar className="h-8 w-8 shrink-0">
              {user?.avatar ? (
                <AvatarImage src={user.avatar} alt={displayName} />
              ) : null}
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{initial}</AvatarFallback>
            </Avatar>
            <div className="hidden min-w-0 max-w-36 flex-col text-left text-xs leading-none md:flex">
              <span className="truncate font-semibold">{displayName}</span>
              <span className="mt-0.5 truncate text-[10px] capitalize text-muted-foreground">{displayRole}</span>
            </div>
            <ChevronDown className="hidden h-4 w-4 shrink-0 text-muted-foreground min-[360px]:block" />
          </Button>
        }
      />
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email || user?.nis || user?.username || 'No details'}
              </p>
              <div className="pt-1">
                <Badge variant="outline" className="text-[10px] capitalize">
                  {displayRole}
                </Badge>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <Link href="/profile" className="flex w-full items-center gap-2">
              <UserIcon className="h-4 w-4" />
              <span>Profile</span>
            </Link>
          }
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          variant="destructive"
          className="cursor-pointer"
        >
          <LogOut className="h-4 w-4 mr-2" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default UserNav;
