import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Role } from '@/types'
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
    <div className="grid grid-cols-3 grid-rows-[1fr_auto] gap-4">
      {/* Compose tile — spans 2 cols, full height */}
      <div className="bento-tile col-span-2 row-span-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Compose</p>
          <h2 className="text-lg font-semibold mt-0.5">New message</h2>
        </div>
        <SendForm orgId={orgId} role={role} />
      </div>

      {/* Active members tile */}
      <div
        className="bento-tile-tinted col-span-1"
        style={{ background: 'color-mix(in oklch, var(--color-primary) 18%, transparent)' }}
      >
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Active members</p>
        <p className="text-5xl font-bold tabular-nums leading-none mt-auto">
          {stats ?? <span className="text-muted-foreground">—</span>}
        </p>
      </div>

      {/* Messages sent tile */}
      <div
        className="bento-tile-tinted col-span-1"
        style={{ background: 'color-mix(in oklch, var(--color-secondary) 18%, transparent)' }}
      >
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Messages sent</p>
        <p className="text-5xl font-bold tabular-nums leading-none mt-auto">
          {sentCount ?? <span className="text-muted-foreground">—</span>}
        </p>
      </div>
    </div>
  )
}
