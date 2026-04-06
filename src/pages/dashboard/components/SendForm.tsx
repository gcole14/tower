import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Role, Scope } from '@/types'
import { hasMinRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Progress } from '@/components/ui/progress'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

const SMS_LIMIT = 160

const schema = z.object({
  body: z.string().min(1, 'Message is required').max(1600, 'Message too long'),
})

type FormValues = z.infer<typeof schema>

interface SendFormProps {
  orgId: string
  role: Role
}

const scopeLabels: Record<Scope, string> = {
  ward: 'Ward',
  elders_quorum: "Elders' Quorum",
  relief_society: 'Relief Society',
  stake_all: 'Stake-wide',
}

function getScopesForRole(role: Role): Scope[] {
  const base: Scope[] = ['ward', 'elders_quorum', 'relief_society']
  if (hasMinRole(role, 'stake_admin')) return [...base, 'stake_all']
  return base
}

export function SendForm({ orgId, role }: SendFormProps) {
  const [scope, setScope] = useState<Scope>('ward')
  const [sending, setSending] = useState(false)
  const [progress, setProgress] = useState(0)

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const body = watch('body', '')
  const charCount = body.length
  const segments = Math.ceil(charCount / SMS_LIMIT) || 1

  const allowedScopes = getScopesForRole(role)

  const onSubmit = async ({ body }: FormValues) => {
    setSending(true)
    if (scope === 'stake_all') setProgress(10)

    try {
      const endpoint = scope === 'stake_all' ? 'send-stake-blast' : 'send-sms'
      const { error } = await supabase.functions.invoke(endpoint, {
        body: { body, scope, org_id: orgId },
      })

      if (scope === 'stake_all') setProgress(100)

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Message sent!')
      reset()
      setProgress(0)
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>Audience</Label>
        <ToggleGroup
          type="single"
          value={scope}
          onValueChange={(v) => v && setScope(v as Scope)}
          className="flex flex-wrap gap-2"
        >
          {allowedScopes.map((s) => (
            <ToggleGroupItem key={s} value={s} className="rounded-lg">
              {scopeLabels[s]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="body">Message</Label>
        <Textarea
          id="body"
          rows={5}
          placeholder="Type your message..."
          {...register('body')}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{errors.body?.message}</span>
          <span className="tabular-nums">
            {charCount} / {SMS_LIMIT} · {segments} segment{segments !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {scope === 'stake_all' && sending && (
        <Progress value={progress} className="h-2" />
      )}

      <Button type="submit" disabled={sending}>
        {sending && <Spinner data-icon="inline-start" className="size-4" />}
        Send message
      </Button>
    </form>
  )
}
