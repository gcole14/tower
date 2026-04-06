import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  role: z.enum(['stake_admin', 'ward_admin', 'comms_chair']),
})

type FormValues = z.infer<typeof schema>

interface InviteFormProps {
  orgId: string
  invitedBy: string
}

export function InviteForm({ orgId, invitedBy }: InviteFormProps) {
  const queryClient = useQueryClient()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: { email: '', role: 'comms_chair' },
    })

  const role = watch('role')

  const onSubmit = async ({ email, role }: FormValues) => {
    const { error } = await supabase.functions.invoke('send-invite', {
      body: { email, role, org_id: orgId, invited_by: invitedBy },
    })

    if (error) {
      toast.error(error.message)
      return
    }

    await queryClient.invalidateQueries({ queryKey: ['invites', orgId] })
    toast.success(`Invite sent to ${email}`)
    reset()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          type="email"
          placeholder="member@example.com"
          {...register('email')}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Role</Label>
        <Select value={role} onValueChange={(v) => setValue('role', v as FormValues['role'])}>
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="stake_admin">Stake Admin</SelectItem>
              <SelectItem value="ward_admin">Ward Admin</SelectItem>
              <SelectItem value="comms_chair">Comms Chair</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Spinner data-icon="inline-start" className="size-4" />}
        Send invite
      </Button>
    </form>
  )
}
