import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { AlertTriangle, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

type SortField = 'name' | 'age' | 'created_at'
type SortDir = 'asc' | 'desc'

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

function SortIcon({ field, sortField, sortDir }: { field: SortField; sortField: SortField; sortDir: SortDir }) {
  if (sortField !== field) return <ChevronsUpDown className="size-3 text-muted-foreground/50" />
  return sortDir === 'asc'
    ? <ChevronUp className="size-3 text-foreground" />
    : <ChevronDown className="size-3 text-foreground" />
}

export function MemberTable({ orgId }: MemberTableProps) {
  const queryClient = useQueryClient()
  const [editMember, setEditMember] = useState<Member | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  // Search + filter + sort state
  const [search, setSearch] = useState('')
  const [groupFilter, setGroupFilter] = useState<'all' | 'elders_quorum' | 'relief_society'>('all')
  const [optOutFilter, setOptOutFilter] = useState<'all' | 'active' | 'opted_out'>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

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

  // Filtered + sorted view
  const filteredMembers = useMemo(() => {
    if (!members) return []
    let list = [...members]

    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.phone.replace(/\D/g, '').includes(q.replace(/\D/g, ''))
      )
    }

    if (groupFilter !== 'all') {
      list = list.filter((m) => m.group_tag === groupFilter)
    }

    if (optOutFilter === 'active') list = list.filter((m) => !m.opted_out)
    if (optOutFilter === 'opted_out') list = list.filter((m) => m.opted_out)

    list.sort((a, b) => {
      let cmp = 0
      if (sortField === 'name') {
        cmp = a.name.localeCompare(b.name)
      } else if (sortField === 'age') {
        const ageA = a.birthday ? computeAge(a.birthday) : -1
        const ageB = b.birthday ? computeAge(b.birthday) : -1
        cmp = ageA - ageB
      } else if (sortField === 'created_at') {
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

    return list
  }, [members, search, groupFilter, optOutFilter, sortField, sortDir])

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

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
        <MemberFormDialog open={addOpen} onOpenChange={setAddOpen} orgId={orgId} member={null} />
        <MemberImportDialog open={importOpen} onOpenChange={setImportOpen} orgId={orgId} />
      </Empty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Search + filters */}
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search name or phone…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
          <div className="flex gap-2">
            <Select value={groupFilter} onValueChange={(v) => setGroupFilter(v as typeof groupFilter)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All groups</SelectItem>
                <SelectItem value="elders_quorum">EQ</SelectItem>
                <SelectItem value="relief_society">RS</SelectItem>
              </SelectContent>
            </Select>
            <Select value={optOutFilter} onValueChange={(v) => setOptOutFilter(v as typeof optOutFilter)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="opted_out">Opted out</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex gap-2 sm:shrink-0">
          <Button variant="outline" onClick={() => setImportOpen(true)}>Import CSV</Button>
          <Button onClick={() => setAddOpen(true)}>Add member</Button>
        </div>
      </div>

      {/* Aged-out banner */}
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

      {/* Result count when filtering */}
      {(search || groupFilter !== 'all' || optOutFilter !== 'all') && (
        <p className="text-xs text-muted-foreground">
          Showing {filteredMembers.length} of {members.length} member{members.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => toggleSort('name')}
                >
                  Name <SortIcon field="name" sortField={sortField} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => toggleSort('age')}
                >
                  Age <SortIcon field="age" sortField={sortField} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead>
                <button
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={() => toggleSort('created_at')}
                >
                  Added <SortIcon field="created_at" sortField={sortField} sortDir={sortDir} />
                </button>
              </TableHead>
              <TableHead>Opted out</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No members match your search.
                </TableCell>
              </TableRow>
            ) : (
              filteredMembers.map((member) => (
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
                  <TableCell>
                    {member.group_tag ? (
                      <Badge
                        variant="outline"
                        className={member.group_tag === 'elders_quorum'
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-accent'
                          : 'bg-pink-100 text-pink-800 border-pink-300'}
                      >
                        {member.group_tag === 'elders_quorum' ? 'EQ' : 'RS'}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground text-sm">
                    {member.birthday ? computeAge(member.birthday) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="tabular-nums text-muted-foreground text-sm">
                    {format(new Date(member.created_at), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={member.opted_out}
                      onCheckedChange={(v) => optOutMutation.mutate({ id: member.id, opted_out: v })}
                    />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setEditMember(member)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="flex flex-col divide-y sm:hidden">
        {filteredMembers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 text-sm">No members match your search.</p>
        ) : (
          filteredMembers.map((member) => (
            <div key={member.id} className="py-3 flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm truncate">{member.name}</span>
                  {member.group_tag && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${member.group_tag === 'elders_quorum'
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground border-sidebar-accent'
                        : 'bg-pink-100 text-pink-800 border-pink-300'}`}
                    >
                      {member.group_tag === 'elders_quorum' ? 'EQ' : 'RS'}
                    </Badge>
                  )}
                  {member.birthday && computeAge(member.birthday) >= 35 && (
                    <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 text-xs">
                      Age {computeAge(member.birthday)}
                    </Badge>
                  )}
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">{member.phone}</span>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {member.birthday ? `Age ${computeAge(member.birthday)}` : 'No birthday'}
                  </span>
                  {member.opted_out && (
                    <span className="text-xs text-muted-foreground">Opted out</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Switch
                  checked={member.opted_out}
                  onCheckedChange={(v) => optOutMutation.mutate({ id: member.id, opted_out: v })}
                />
                <Button variant="ghost" size="sm" className="px-2" onClick={() => setEditMember(member)}>
                  Edit
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <MemberFormDialog open={addOpen} onOpenChange={setAddOpen} orgId={orgId} member={null} />
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
