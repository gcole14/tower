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
      const start = new Date()
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', orgId)
        .gte('created_at', start.toISOString())
      if (error) throw error
      return count ?? 0
    },
  })

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 sm:grid-rows-[1fr_auto] gap-4">
      {/* Active members tile — top on mobile, top-right on sm+ */}
      <div
        className="bento-tile-tinted order-1 sm:order-2 sm:col-start-3 sm:row-start-1"
        style={{ background: 'color-mix(in oklch, var(--color-primary) 18%, transparent)' }}
      >
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Active members</p>
        <p className="text-5xl font-bold tabular-nums leading-none mt-auto">
          {stats ?? <span className="text-muted-foreground">—</span>}
        </p>
      </div>

      {/* Messages sent tile — top on mobile, bottom-right on sm+ */}
      <div
        className="bento-tile-tinted order-2 sm:order-3 sm:col-start-3 sm:row-start-2"
        style={{ background: 'color-mix(in oklch, var(--color-secondary) 18%, transparent)' }}
      >
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Messages sent</p>
        <p className="text-5xl font-bold tabular-nums leading-none mt-auto pt-1">
          {sentCount ?? <span className="text-muted-foreground">—</span>}
        </p>
        <p className="text-xs text-muted-foreground">this month</p>
      </div>

      {/* Compose tile — full width on mobile, spans 2 cols + 2 rows on sm+ */}
      <div className="bento-tile order-3 col-span-2 sm:order-1 sm:col-start-1 sm:col-span-2 sm:row-start-1 sm:row-span-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Compose</p>
          <h2 className="text-lg font-semibold mt-0.5">New message</h2>
        </div>
        <SendForm orgId={orgId} role={role} />
      </div>
    </div>
  )
}
