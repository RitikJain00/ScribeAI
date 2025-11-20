'use client';

import { useTheme } from 'next-themes';
import { Moon, Sun, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function Navbar() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();   // 👈 Add this
  const [mounted, setMounted] = useState(false); // 👈 to fix hydration
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const user = localStorage.getItem('scribeai_user');
    if (user) {
      const parsed = JSON.parse(user);
      setUserEmail(parsed.email || '');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('scribeai_token');
    localStorage.removeItem('scribeai_user');
    router.push('/login');
  };

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  // 👇 Extract page name dynamically
  const pageTitle = (() => {
    if (!pathname) return '';

    if (pathname.startsWith('/dashboard')) return 'Dashboard';
    if (pathname.startsWith('/sessions')) return 'Sessions';
    if (pathname.startsWith('/profile')) return 'Profile';

    return 'Dashboard';
  })();

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-semibold text-foreground">
          {pageTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* 👇 Prevent hydration mismatch for theme toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar>
                <AvatarFallback>{getInitials(userEmail)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">My Account</span>
                <span className="text-xs text-muted-foreground">{userEmail}</span>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <User className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
