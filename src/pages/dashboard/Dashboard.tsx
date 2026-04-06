import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { hasMinRole } from '@/types'
import { OverviewTab } from './tabs/OverviewTab'
import { SendTab } from './tabs/SendTab'
import { MembersTab } from './tabs/MembersTab'
import { HistoryTab } from './tabs/HistoryTab'
import { InvitesTab } from './tabs/InvitesTab'
import { OrgsTab } from './tabs/OrgsTab'

export default function Dashboard() {
  const { user } = useAuth()
  const { data: profile } = useProfile(user)

  if (!profile) return null

  const { role, org_id, id: userId } = profile

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <h1 className="text-2xl font-semibold tracking-tight">
        {profile.organization?.name ?? 'Dashboard'}
      </h1>

      <Routes>
        <Route index element={<OverviewTab orgId={org_id} />} />

        {hasMinRole(role, 'comms_chair') && (
          <Route path="send" element={<SendTab orgId={org_id} role={role} />} />
        )}
        {hasMinRole(role, 'ward_admin') && (
          <Route path="members" element={<MembersTab orgId={org_id} />} />
        )}
        {hasMinRole(role, 'comms_chair') && (
          <Route path="history" element={<HistoryTab orgId={org_id} />} />
        )}
        {hasMinRole(role, 'ward_admin') && (
          <Route path="invites" element={<InvitesTab orgId={org_id} userId={userId} />} />
        )}
        {hasMinRole(role, 'super_admin') && (
          <Route path="orgs" element={<OrgsTab />} />
        )}

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
