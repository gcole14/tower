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

type Org = Database['public']['Tables']['organizations']['Row']

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  twilio_account_sid: z.string().optional(),
  twilio_auth_token: z.string().optional(),
  twilio_phone_number: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export function OrgsTab() {
  const queryClient = useQueryClient()
  const [showForm, setShowForm] = useState(false)

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

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ name, twilio_account_sid, twilio_auth_token, twilio_phone_number }: FormValues) => {
    const { error } = await supabase.from('organizations').insert({
      name,
      twilio_account_sid: twilio_account_sid || null,
      twilio_auth_token: twilio_auth_token || null,
      twilio_phone_number: twilio_phone_number || null,
    })

    if (error) {
      toast.error(error.message)
      return
    }

    await queryClient.invalidateQueries({ queryKey: ['organizations'] })
    toast.success('Organization created')
    reset()
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Organizations</CardTitle>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : 'New org'}
          </Button>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs?.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>{org.name}</TableCell>
                    <TableCell className="tabular-nums">{org.twilio_phone_number ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{org.twilio_account_sid ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showForm && (
        <Card className="rounded-xl">
          <CardHeader>
            <CardTitle>Create organization</CardTitle>
          </CardHeader>
          <CardContent>
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
                <Label htmlFor="twilio-token">Twilio auth token</Label>
                <Input
                  id="twilio-token"
                  type="password"
                  autoComplete="off"
                  placeholder="Auth token"
                  {...register('twilio_auth_token')}
                />
              </div>

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Spinner data-icon="inline-start" className="size-4" />}
                Create organization
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
