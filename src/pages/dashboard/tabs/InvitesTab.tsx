import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { InviteForm } from '../components/InviteForm'

type Invite = Database['public']['Tables']['invites']['Row']

interface InvitesTabProps {
  orgId: string
  userId: string
}

export function InvitesTab({ orgId, userId }: InvitesTabProps) {
  const queryClient = useQueryClient()

  const { data: invites, isLoading } = useQuery({
    queryKey: ['invites', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('org_id', orgId)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Invite[]
    },
  })

  const revokeMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase.from('invites').delete().eq('id', inviteId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invites', orgId] })
      toast.success('Invite revoked')
    },
    onError: () => toast.error('Failed to revoke invite'),
  })

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bento-tile sm:col-span-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Access</p>
          <h2 className="text-lg font-semibold mt-0.5">Pending invites</h2>
        </div>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : !invites || invites.length === 0 ? (
            <p className="text-muted-foreground text-sm">No pending invites.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {invites.map((invite) => (
                <div key={invite.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="text-sm font-medium">{invite.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{invite.role.replace('_', ' ')}</Badge>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {format(new Date(invite.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">Revoke</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-lg">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke invite?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the invite for <strong>{invite.email}</strong>.
                          They will no longer be able to accept it.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => revokeMutation.mutate(invite.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Revoke
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
      </div>

      <div className="bento-tile col-span-1">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Invite</p>
          <h2 className="text-lg font-semibold mt-0.5">Add someone</h2>
        </div>
        <InviteForm orgId={orgId} invitedBy={userId} />
      </div>
    </div>
  )
}
