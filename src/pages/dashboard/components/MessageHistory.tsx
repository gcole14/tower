import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'

type Message = Database['public']['Tables']['messages']['Row']
type MessageLog = Database['public']['Tables']['message_log']['Row']

const scopeColors: Record<string, string> = {
  ward: 'secondary',
  elders_quorum: 'secondary',
  relief_society: 'secondary',
  stake_all: 'default',
}

const scopeLabels: Record<string, string> = {
  ward: 'Ward',
  elders_quorum: 'EQ',
  relief_society: 'RS',
  stake_all: 'Stake',
}

interface MessageHistoryProps {
  orgId: string
}

export function MessageHistory({ orgId }: MessageHistoryProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)

  const { data: messages, isLoading } = useQuery({
    queryKey: ['messages', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Message[]
    },
  })

  const { data: logs, isLoading: logsLoading } = useQuery({
    queryKey: ['message_log', selectedMessage?.id],
    queryFn: async () => {
      if (!selectedMessage) return []
      const { data, error } = await supabase
        .from('message_log')
        .select('*')
        .eq('message_id', selectedMessage.id)
      if (error) throw error
      return data as MessageLog[]
    },
    enabled: !!selectedMessage,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Sent</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Message</TableHead>
            <TableHead className="text-right">Recipients</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {messages?.map((msg) => (
            <TableRow
              key={msg.id}
              className="cursor-pointer"
              onClick={() => setSelectedMessage(msg)}
            >
              <TableCell className="tabular-nums text-muted-foreground text-sm whitespace-nowrap">
                {format(new Date(msg.created_at), 'MMM d, yyyy h:mm a')}
              </TableCell>
              <TableCell>
                <Badge variant={scopeColors[msg.scope] as 'secondary' | 'default'}>
                  {scopeLabels[msg.scope] ?? msg.scope}
                </Badge>
              </TableCell>
              <TableCell className="max-w-sm truncate">{msg.body}</TableCell>
              <TableCell className="text-right tabular-nums">{msg.recipient_count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Sheet open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Message detail</SheetTitle>
          </SheetHeader>
          {selectedMessage && (
            <div className="mt-4 flex flex-col gap-4">
              <p className="text-sm">{selectedMessage.body}</p>
              <div className="text-xs text-muted-foreground tabular-nums">
                {format(new Date(selectedMessage.created_at), 'PPpp')}
                {' · '}
                {selectedMessage.recipient_count} recipient{selectedMessage.recipient_count !== 1 ? 's' : ''}
              </div>

              <ScrollArea className="h-80">
                {logsLoading ? (
                  <div className="flex flex-col gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs?.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="tabular-nums">{log.phone}</TableCell>
                          <TableCell>{log.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
