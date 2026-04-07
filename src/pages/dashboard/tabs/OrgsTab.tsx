import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Org = Database['public']['Tables']['organizations']['Row']

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  twilio_account_sid: z.string().optional(),
  twilio_auth_token: z.string().optional(),
  twilio_phone_number: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

function OrgForm({
  org,
  onSuccess,
  onCancel,
}: {
  org: Org | null
  onSuccess: () => void
  onCancel: () => void
}) {
  const queryClient = useQueryClient()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: org
      ? {
          name: org.name,
          twilio_account_sid: org.twilio_account_sid ?? '',
          twilio_auth_token: '',
          twilio_phone_number: org.twilio_phone_number ?? '',
        }
      : {},
  })

  const onSubmit = async ({ name, twilio_account_sid, twilio_auth_token, twilio_phone_number }: FormValues) => {
    if (org) {
      const updates: Partial<Org> = {
        name,
        twilio_account_sid: twilio_account_sid || null,
        twilio_phone_number: twilio_phone_number || null,
      }
      // Only update auth token if a new one was entered
      if (twilio_auth_token) updates.twilio_auth_token = twilio_auth_token

      const { error } = await supabase.from('organizations').update(updates).eq('id', org.id)
      if (error) { toast.error(error.message); return }
      toast.success('Organization updated')
    } else {
      const { error } = await supabase.from('organizations').insert({
        name,
        twilio_account_sid: twilio_account_sid || null,
        twilio_auth_token: twilio_auth_token || null,
        twilio_phone_number: twilio_phone_number || null,
      })
      if (error) { toast.error(error.message); return }
      toast.success('Organization created')
    }

    await queryClient.invalidateQueries({ queryKey: ['organizations'] })
    reset()
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="org-name">Name</Label>
        <Input id="org-name" placeholder="Salt Lake YSA 1st Ward" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="twilio-phone">Twilio phone number</Label>
        <Input id="twilio-phone" placeholder="+15551234567" {...register('twilio_phone_number')} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="twilio-sid">Twilio account SID</Label>
        <Input id="twilio-sid" placeholder="ACxxxxxxx" {...register('twilio_account_sid')} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="twilio-token">
          Twilio auth token{org && <span className="text-muted-foreground font-normal"> (leave blank to keep existing)</span>}
        </Label>
        <Input
          id="twilio-token"
          type="password"
          autoComplete="off"
          placeholder={org ? '••••••••' : 'Auth token'}
          {...register('twilio_auth_token')}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Spinner data-icon="inline-start" className="size-4" />}
          {org ? 'Save changes' : 'Create organization'}
        </Button>
      </div>
    </form>
  )
}

export function OrgsTab() {
  const [showCreate, setShowCreate] = useState(false)
  const [editOrg, setEditOrg] = useState<Org | null>(null)

  const { data: orgs, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name')
      if (error) throw error
      return data as Org[]
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Organizations</CardTitle>
          <Button onClick={() => setShowCreate(true)}>New org</Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Twilio phone</TableHead>
                  <TableHead>Account SID</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs?.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>{org.name}</TableCell>
                    <TableCell className="tabular-nums">{org.twilio_phone_number ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{org.twilio_account_sid ?? '—'}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setEditOrg(org)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle>Create organization</DialogTitle>
          </DialogHeader>
          <OrgForm org={null} onSuccess={() => setShowCreate(false)} onCancel={() => setShowCreate(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editOrg} onOpenChange={(open) => !open && setEditOrg(null)}>
        <DialogContent className="rounded-lg">
          <DialogHeader>
            <DialogTitle>Edit organization</DialogTitle>
          </DialogHeader>
          {editOrg && (
            <OrgForm org={editOrg} onSuccess={() => setEditOrg(null)} onCancel={() => setEditOrg(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
