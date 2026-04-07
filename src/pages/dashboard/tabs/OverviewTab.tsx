import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { TrendingUp, TrendingDown, Minus, Send, History } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import type { Database } from '@/lib/database.types'

type Message = Database['public']['Tables']['messages']['Row']

const scopeLabels: Record<string, string> = {
  ward: 'Ward',
  elders_quorum: 'Elders Quorum',
  relief_society: 'Relief Society',
  stake_all: 'Stake-wide',
}

const MONTH_ABBREVS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

interface OverviewTabProps {
  orgId: string
}

export function OverviewTab({ orgId }: OverviewTabProps) {
  // All members (including opted out) for stat breakdowns
  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members-all', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('group_tag, opted_out')
        .eq('org_id', orgId)
      if (error) throw error
      return data
    },
  })

  // Messages from last month's 1st through today, so we can split into two windows client-side
  const { data: recentMessages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages-trend', orgId],
    queryFn: async () => {
      const now = new Date()
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const { data, error } = await supabase
        .from('messages')
        .select('created_at')
        .eq('org_id', orgId)
        .gte('created_at', lastMonthStart.toISOString())
      if (error) throw error
      return data
    },
  })

  // Messages over the past 12 months for the line chart
  const { data: yearMessages, isLoading: yearLoading } = useQuery({
    queryKey: ['messages-year', orgId],
    queryFn: async () => {
      const now = new Date()
      const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
      const { data, error } = await supabase
        .from('messages')
        .select('created_at')
        .eq('org_id', orgId)
        .gte('created_at', yearAgo.toISOString())
      if (error) throw error
      return data
    },
  })

  // Last message sent
  const { data: lastMessage, isLoading: lastLoading } = useQuery({
    queryKey: ['last-message', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as Message | null
    },
  })

  // Member stats
  const totalMembers = members?.length ?? 0
  const activeMembers = members?.filter((m) => !m.opted_out).length ?? 0
  const eqCount = members?.filter((m) => m.group_tag === 'elders_quorum' && !m.opted_out).length ?? 0
  const rsCount = members?.filter((m) => m.group_tag === 'relief_society' && !m.opted_out).length ?? 0
  const optedOutCount = members?.filter((m) => m.opted_out).length ?? 0
  const optedOutPct = totalMembers > 0 ? Math.round((optedOutCount / totalMembers) * 100) : 0

  // Message trend: this month vs same period last month
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthSameDayEnd = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate(), 23, 59, 59)

  const thisMonthCount = recentMessages?.filter((m) => new Date(m.created_at) >= thisMonthStart).length ?? 0
  const lastMonthSamePeriodCount = recentMessages?.filter((m) => {
    const d = new Date(m.created_at)
    return d >= lastMonthStart && d <= lastMonthSameDayEnd
  }).length ?? 0

  const trendDelta = thisMonthCount - lastMonthSamePeriodCount

  // Build 12-month chart data
  const chartData = (() => {
    const months: { month: string; messages: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = `${MONTH_ABBREVS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`
      const count = yearMessages?.filter((m) => {
        const md = new Date(m.created_at)
        return md.getFullYear() === d.getFullYear() && md.getMonth() === d.getMonth()
      }).length ?? 0
      months.push({ month: label, messages: count })
    }
    return months
  })()

  const isLoading = membersLoading || messagesLoading || lastLoading || yearLoading

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-36 rounded-2xl sm:col-span-2" />
          <Skeleton className="h-36 rounded-2xl" />
        </div>
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Stat tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bento-tile">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Active members</p>
          <p className="text-4xl font-bold tabular-nums leading-none mt-auto">{activeMembers}</p>
        </div>

        <div className="bento-tile">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Elders Quorum</p>
          <p className="text-4xl font-bold tabular-nums leading-none mt-auto">{eqCount}</p>
        </div>

        <div className="bento-tile">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Relief Society</p>
          <p className="text-4xl font-bold tabular-nums leading-none mt-auto">{rsCount}</p>
        </div>

        <div className="bento-tile">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Opted out</p>
          <p className="text-4xl font-bold tabular-nums leading-none mt-auto">{optedOutCount}</p>
          <p className="text-xs text-muted-foreground">{optedOutPct}% of total</p>
        </div>
      </div>

      {/* Trend + Last sent */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Message trend */}
        <div className="bento-tile sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Messages this month</p>
          <div className="flex items-end gap-3 mt-auto">
            <p className="text-4xl font-bold tabular-nums leading-none">{thisMonthCount}</p>
            <div className={`flex items-center gap-1 mb-0.5 text-sm font-medium ${
              trendDelta > 0 ? 'text-green-600' : trendDelta < 0 ? 'text-red-500' : 'text-muted-foreground'
            }`}>
              {trendDelta > 0 ? (
                <TrendingUp className="size-4" />
              ) : trendDelta < 0 ? (
                <TrendingDown className="size-4" />
              ) : (
                <Minus className="size-4" />
              )}
              <span>
                {trendDelta > 0
                  ? `${trendDelta} more than last month`
                  : trendDelta < 0
                  ? `${Math.abs(trendDelta)} fewer than last month`
                  : 'Same as last month'}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Compared to the same {now.getDate()}-day period last month ({lastMonthSamePeriodCount} messages)
          </p>
        </div>

        {/* Last sent */}
        <div className="bento-tile">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Last message sent</p>
          {lastMessage ? (
            <>
              <p className="text-sm leading-snug line-clamp-2 mt-auto">{lastMessage.body}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{scopeLabels[lastMessage.scope] ?? lastMessage.scope}</Badge>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                </span>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground mt-auto">No messages sent yet.</p>
          )}
        </div>
      </div>

      {/* Message volume chart */}
      <div className="bento-tile">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Message volume</p>
        <p className="text-sm text-muted-foreground mt-0.5 mb-4">Messages sent per month over the past year</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--popover))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
                fontSize: 12,
                color: 'hsl(var(--popover-foreground))',
              }}
              cursor={{ stroke: 'hsl(var(--border))' }}
              formatter={(value) => [value ?? 0, 'Messages']}
            />
            <Line
              type="monotone"
              dataKey="messages"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 3, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Quick actions */}
      <div className="flex gap-2">
        <Button asChild>
          <Link to="/send"><Send className="size-4" />Compose message</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/history"><History className="size-4" />View history</Link>
        </Button>
      </div>
    </div>
  )
}
