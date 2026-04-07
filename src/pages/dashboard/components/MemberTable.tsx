import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
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
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { MemberForm } from './MemberForm'
import { MemberImportDialog } from './MemberImportDialog'

type Member = Database['public']['Tables']['members']['Row']

interface MemberTableProps {
  orgId: string
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `+1${digits}`
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`
  return `+${digits}`
}

export { normalizePhone }

function computeAge(birthday: string): number {
  const today = new Date()
  const dob = new Date(birthday)
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

export function MemberTable({ orgId }: MemberTableProps) {
  const queryClient = useQueryClient()
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const { data: members, isLoading } = useQuery({
    queryKey: ['members', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('org_id', orgId)
        .order('name')
      if (error) throw error
      return data as Member[]
    },
  })

  const agedOutMembers = members?.filter(
    (m) => m.birthday && computeAge(m.birthday) >= 35
  ) ?? []

  const removeAgedOutMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('members').delete().in('id', ids)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', orgId] })
      toast.success(`Removed ${agedOutMembers.length} aged-out member${agedOutMembers.length !== 1 ? 's' : ''}`)
    },
    onError: () => toast.error('Failed to remove members'),
  })

  const optOutMutation = useMutation({
    mutationFn: async ({ id, opted_out }: { id: string; opted_out: boolean }) => {
      const { error } = await supabase
        .from('members')
        .update({ opted_out })
        .eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, opted_out }) => {
      await queryClient.cancelQueries({ queryKey: ['members', orgId] })
      const prev = queryClient.getQueryData<Member[]>(['members', orgId])
      queryClient.setQueryData<Member[]>(['members', orgId], (old) =>
        old?.map((m) => (m.id === id ? { ...m, opted_out } : m)) ?? []
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['members', orgId], ctx?.prev)
      toast.error('Failed to update opt-out status')
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['members', orgId] })
    },
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

  if (!members || members.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No members yet</EmptyTitle>
          <EmptyDescription>Add your first member to get started.</EmptyDescription>
        </EmptyHeader>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>Import CSV</Button>
          <Button onClick={() => setAddOpen(true)}>Add member</Button>
        </div>
        <MemberFormDialog
          open={addOpen}
          onOpenChange={setAddOpen}
          orgId={orgId}
          member={null}
        />
        <MemberImportDialog open={importOpen} onOpenChange={setImportOpen} orgId={orgId} />
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => setImportOpen(true)}>Import CSV</Button>
        <Button onClick={() => setAddOpen(true)}>Add member</Button>
      </div>

      {agedOutMembers.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              <strong>{agedOutMembers.length} member{agedOutMembers.length !== 1 ? 's have' : ' has'} reached age 35</strong> and should be removed from this list.
            </span>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="shrink-0">
                Remove {agedOutMembers.length === 1 ? 'them' : `all ${agedOutMembers.length}`}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove aged-out members?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {agedOutMembers.length === 1 ? `${agedOutMembers[0].name}` : `${agedOutMembers.length} members`} who {agedOutMembers.length === 1 ? 'has' : 'have'} reached age 35. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={() => removeAgedOutMutation.mutate(agedOutMembers.map((m) => m.id))}
                >
                  Remove
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="hidden sm:table-cell">Group</TableHead>
              <TableHead className="hidden sm:table-cell">Added</TableHead>
              <TableHead>Opted out</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {member.name}
                    {member.birthday && computeAge(member.birthday) >= 35 && (
                      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-xs">
                        Age {computeAge(member.birthday)}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="tabular-nums">{member.phone}</TableCell>
                <TableCell className="hidden sm:table-cell">
                  {member.group_tag ? (
                    <Badge variant="secondary">
                      {member.group_tag === 'elders_quorum' ? "EQ" : "RS"}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell tabular-nums text-muted-foreground text-sm">
                  {format(new Date(member.created_at), 'MMM d, yyyy')}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={member.opted_out}
                    onCheckedChange={(v) =>
                      optOutMutation.mutate({ id: member.id, opted_out: v })
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditMember(member)}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <MemberFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        orgId={orgId}
        member={null}
      />

      <MemberFormDialog
        open={!!editMember}
        onOpenChange={(open) => !open && setEditMember(null)}
        orgId={orgId}
        member={editMember}
      />

      <MemberImportDialog open={importOpen} onOpenChange={setImportOpen} orgId={orgId} />
    </div>
  )
}

interface MemberFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  member: Member | null
}

function MemberFormDialog({ open, onOpenChange, orgId, member }: MemberFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-lg">
        <DialogHeader>
          <DialogTitle>{member ? 'Edit member' : 'Add member'}</DialogTitle>
        </DialogHeader>
        <MemberForm
          orgId={orgId}
          member={member}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
