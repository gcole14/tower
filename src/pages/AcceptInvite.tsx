import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Skeleton } from '@/components/ui/skeleton'

const schema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters'),
})

type FormValues = z.infer<typeof schema>

interface InviteData {
  id: string
  org_id: string
  email: string
  role: string
  org_name: string
}

export default function AcceptInvite() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()
  const { user } = useAuth()

  const [invite, setInvite] = useState<InviteData | null>(null)
  const [loadingInvite, setLoadingInvite] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    if (!token) {
      setLoadingInvite(false)
      return
    }

    const fetchInvite = async () => {
      const { data, error } = await supabase
        .from('invites')
        .select('id, org_id, email, role')
        .eq('token', token)
        .is('accepted_at', null)
        .single()

      if (error || !data) {
        toast.error('Invalid or expired invite link.')
        setLoadingInvite(false)
        return
      }

      const { data: orgData } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', data.org_id)
        .single()

      setInvite({
        id: data.id,
        org_id: data.org_id,
        email: data.email,
        role: data.role,
        org_name: orgData?.name ?? '',
      })
      setLoadingInvite(false)
    }

    fetchInvite()
  }, [token])

  const onSubmit = async ({ display_name }: FormValues) => {
    if (!invite || !user) return
    setSubmitting(true)

    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      org_id: invite.org_id,
      display_name,
      role: invite.role,
    })

    if (profileError) {
      toast.error(profileError.message)
      setSubmitting(false)
      return
    }

    await supabase
      .from('invites')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    toast.success('Welcome to Tower!')
    navigate('/')
  }

  if (loadingInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--color-surface]">
        <Card className="w-full max-w-sm rounded-xl">
          <CardContent className="pt-6 flex flex-col gap-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!token || !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--color-surface]">
        <Card className="w-full max-w-sm rounded-xl">
          <CardHeader>
            <CardTitle>Invalid invite</CardTitle>
            <CardDescription>This invite link is invalid or has already been used.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-surface]">
      <Card className="w-full max-w-sm rounded-xl">
        <CardHeader>
          <CardTitle>You're invited!</CardTitle>
          <CardDescription>
            You've been invited to join <strong>{invite.org_name}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Role:</span>
              <Badge variant="secondary">{invite.role.replace('_', ' ')}</Badge>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="display_name">Your name</Label>
              <Input
                id="display_name"
                placeholder="Jane Smith"
                autoComplete="name"
                {...register('display_name')}
              />
              {errors.display_name && (
                <p className="text-sm text-destructive">{errors.display_name.message}</p>
              )}
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner data-icon="inline-start" className="size-4" />}
              Accept invite
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
