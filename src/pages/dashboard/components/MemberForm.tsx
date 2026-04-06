import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/database.types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { normalizePhone } from './MemberTable'

type Member = Database['public']['Tables']['members']['Row']

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  group_tag: z.enum(['elders_quorum', 'relief_society', 'none']),
  org_id: z.string().min(1, 'Organization is required'),
})

type FormValues = z.infer<typeof schema>

interface MemberFormProps {
  orgId: string
  member: Member | null
  onSuccess: () => void
}

export function MemberForm({ orgId, member, onSuccess }: MemberFormProps) {
  const queryClient = useQueryClient()

  const { data: orgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name')
      if (error) throw error
      return data
    },
    enabled: !member,
  })

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } =
    useForm<FormValues>({
      resolver: zodResolver(schema),
      defaultValues: {
        name: member?.name ?? '',
        phone: member?.phone ?? '',
        group_tag: member?.group_tag ?? 'none',
        org_id: member?.org_id ?? orgId,
      },
    })

  const groupTag = watch('group_tag')
  const selectedOrgId = watch('org_id')

  const onSubmit = async ({ name, phone, group_tag, org_id }: FormValues) => {
    const normalizedPhone = normalizePhone(phone)
    const group = group_tag === 'none' ? null : group_tag

    if (member) {
      const { error } = await supabase
        .from('members')
        .update({ name, phone: normalizedPhone, group_tag: group })
        .eq('id', member.id)

      if (error) {
        toast.error(error.message)
        return
      }
    } else {
      const { error } = await supabase.from('members').insert({
        org_id,
        name,
        phone: normalizedPhone,
        group_tag: group,
      })

      if (error) {
        toast.error(error.message)
        return
      }
    }

    await queryClient.invalidateQueries({ queryKey: ['members', orgId] })
    toast.success(member ? 'Member updated' : 'Member added')
    onSuccess()
  }

  const showOrgSelector = !member && orgs && orgs.length > 1

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Jane Smith" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" placeholder="(555) 123-4567" {...register('phone')} />
        {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
      </div>

      {showOrgSelector && (
        <div className="flex flex-col gap-2">
          <Label>Organization</Label>
          <Select
            value={selectedOrgId}
            onValueChange={(v) => setValue('org_id', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {orgs.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label>Group</Label>
        <Select
          value={groupTag}
          onValueChange={(v) => setValue('group_tag', v as FormValues['group_tag'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select group" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="elders_quorum">Elders' Quorum</SelectItem>
              <SelectItem value="relief_society">Relief Society</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting && <Spinner data-icon="inline-start" className="size-4" />}
        {member ? 'Save changes' : 'Add member'}
      </Button>
    </form>
  )
}
