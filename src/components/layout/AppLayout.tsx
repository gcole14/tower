import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, signOut } = useAuth()
  const { data: profile } = useProfile(user)

  const initials = profile?.display_name
    ? profile.display_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex items-center justify-between h-14 px-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2 min-w-0">
              <img src="/tower-logo.svg" alt="Tower" className="size-5 opacity-80 shrink-0" />
              <span className="font-semibold text-sm tracking-tight shrink-0">Tower</span>
              {profile?.organization?.name && (
                <>
                  <span className="text-muted-foreground/40 text-sm shrink-0">/</span>
                  <span className="text-sm text-muted-foreground truncate">{profile.organization.name}</span>
                </>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary-foreground/80">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-muted-foreground text-sm" disabled>
                {profile?.display_name ?? user?.email}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
