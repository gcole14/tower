import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Scope } from '@/types'
import { Button } from '@/components/ui/button'

interface ScheduledListProps {
  orgId: string
}

interface ScheduledRow {
  id: string
  body: string
  scope: Scope
  scheduled_at: string
  sent_by: string | null
}

const scopeLabel: Record<Scope, string> = {
  ward: 'Ward',
  elders_quorum: 'EQ',
  relief_society: 'RS',
  stake_all: 'Stake',
}

const scopeBadgeClass: Record<Scope, string> = {
  ward: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  elders_quorum: 'bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-accent',
  relief_society: 'bg-pink-100 text-pink-800 border-pink-300',
  stake_all: 'bg-red-100 text-red-800 border-red-300',
}

function formatScheduled(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ScheduledList({ orgId }: ScheduledListProps) {
  const queryClient = useQueryClient()

  const { data: rows, isLoading } = useQuery({
    queryKey: ['scheduled-messages', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('id, body, scope, scheduled_at, sent_by')
        .eq('org_id', orgId)
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true })
      if (error) throw error
      return (data ?? []) as ScheduledRow[]
    },
  })

  async function cancel(id: string) {
    const { error } = await supabase
      .from('messages')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Scheduled message cancelled')
    queryClient.invalidateQueries({ queryKey: ['scheduled-messages', orgId] })
  }

  if (isLoading) return null
  if (!rows || rows.length === 0) return null

  return (
    <div className="bento-tile">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Queued</p>
        <h2 className="text-lg font-semibold mt-0.5">Scheduled messages</h2>
      </div>
      <ul className="flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.id} className="flex items-start gap-3 rounded-md border border-border/60 p-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${scopeBadgeClass[row.scope]}`}>
                  {scopeLabel[row.scope]}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatScheduled(row.scheduled_at)}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap break-words line-clamp-3">{row.body}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => cancel(row.id)}
              aria-label="Cancel scheduled message"
            >
              <X className="size-4" />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  )
}
