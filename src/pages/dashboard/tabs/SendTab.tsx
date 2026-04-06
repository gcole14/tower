import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Role } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SendForm } from '../components/SendForm'

interface SendTabProps {
  orgId: string
  role: Role
}

export function SendTab({ orgId, role }: SendTabProps) {
  const { data: stats } = useQuery({
    queryKey: ['members-count', orgId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .eq('opted_out', false)
      if (error) throw error
      return count ?? 0
    },
  })

  const { data: sentCount } = useQuery({
    queryKey: ['messages-count', orgId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
      if (error) throw error
      return count ?? 0
    },
  })

  return (
    <div className="grid grid-cols-3 gap-6">
      <Card className="col-span-2 rounded-xl">
        <CardHeader>
          <CardTitle>Compose message</CardTitle>
        </CardHeader>
        <CardContent>
          <SendForm orgId={orgId} role={role} />
        </CardContent>
      </Card>

      <Card className="col-span-1 rounded-xl">
        <CardHeader>
          <CardTitle>Stats</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Active members</p>
            <p className="text-3xl font-semibold tabular-nums">{stats ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Messages sent</p>
            <p className="text-3xl font-semibold tabular-nums">{sentCount ?? '—'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
