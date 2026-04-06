import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'
import { hasMinRole } from '@/types'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">
        {profile.organization?.name ?? 'Dashboard'}
      </h1>

      <Tabs defaultValue="send">
        <TabsList>
          {hasMinRole(role, 'comms_chair') && (
            <TabsTrigger value="send">Send</TabsTrigger>
          )}
          {hasMinRole(role, 'ward_admin') && (
            <TabsTrigger value="members">Members</TabsTrigger>
          )}
          {hasMinRole(role, 'comms_chair') && (
            <TabsTrigger value="history">History</TabsTrigger>
          )}
          {hasMinRole(role, 'ward_admin') && (
            <TabsTrigger value="invites">Invites</TabsTrigger>
          )}
          {hasMinRole(role, 'super_admin') && (
            <TabsTrigger value="orgs">Orgs</TabsTrigger>
          )}
        </TabsList>

        {hasMinRole(role, 'comms_chair') && (
          <TabsContent value="send" className="mt-6">
            <SendTab orgId={org_id} role={role} />
          </TabsContent>
        )}
        {hasMinRole(role, 'ward_admin') && (
          <TabsContent value="members" className="mt-6">
            <MembersTab orgId={org_id} />
          </TabsContent>
        )}
        {hasMinRole(role, 'comms_chair') && (
          <TabsContent value="history" className="mt-6">
            <HistoryTab orgId={org_id} />
          </TabsContent>
        )}
        {hasMinRole(role, 'ward_admin') && (
          <TabsContent value="invites" className="mt-6">
            <InvitesTab orgId={org_id} userId={userId} />
          </TabsContent>
        )}
        {hasMinRole(role, 'super_admin') && (
          <TabsContent value="orgs" className="mt-6">
            <OrgsTab />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
