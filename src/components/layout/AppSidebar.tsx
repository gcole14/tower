import { NavLink, useLocation } from 'react-router-dom'
import { Send, Users, History, Mail, Building2, LayoutDashboard } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { hasMinRole } from '@/types'

const navItems = [
  { label: 'Send',    to: '/send',    icon: Send,          minRole: 'comms_chair' as const },
  { label: 'Members', to: '/members', icon: Users,         minRole: 'ward_admin'  as const },
  { label: 'History', to: '/history', icon: History,       minRole: 'comms_chair' as const },
  { label: 'Invites', to: '/invites', icon: Mail,          minRole: 'ward_admin'  as const },
  { label: 'Orgs',    to: '/orgs',    icon: Building2,     minRole: 'super_admin' as const },
]

export function AppSidebar() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user)
  const { pathname } = useLocation()

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tower</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/'}>
                  <NavLink to="/" end>
                    <LayoutDashboard />
                    Dashboard
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {profile &&
                navItems
                  .filter(({ minRole }) => hasMinRole(profile.role, minRole))
                  .map(({ label, to, icon: Icon }) => (
                    <SidebarMenuItem key={to}>
                      <SidebarMenuButton asChild isActive={pathname.startsWith(to)}>
                        <NavLink to={to}>
                          <Icon />
                          {label}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
