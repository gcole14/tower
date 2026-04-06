import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Role, Scope } from '@/types'
import { hasMinRole } from '@/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Progress } from '@/components/ui/progress'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
  elders_quorum: "Elders Quorum",
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
  const [sent, setSent] = useState(false)
  const [progress, setProgress] = useState(0)
  const [pendingBody, setPendingBody] = useState<string | null>(null)

  const { data: memberGroups } = useQuery({
    queryKey: ['member-groups', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('members')
        .select('group_tag')
        .eq('org_id', orgId)
        .eq('opted_out', false)
      if (error) throw error
      return data
    },
  })

  const wardCount = memberGroups?.length ?? 0
  const eqCount = memberGroups?.filter((m) => m.group_tag === 'elders_quorum').length ?? 0
  const rsCount = memberGroups?.filter((m) => m.group_tag === 'relief_society').length ?? 0

  function recipientCount(s: Scope): number | null {
    if (s === 'ward') return wardCount
    if (s === 'elders_quorum') return eqCount
    if (s === 'relief_society') return rsCount
    return null // stake_all — server-side
  }

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const body = watch('body', '')
  const charCount = body.length
  const segments = Math.ceil(charCount / SMS_LIMIT) || 1
  const allowedScopes = getScopesForRole(role)

  // Step 1: form submit → open confirm dialog
  const onSubmit = ({ body }: FormValues) => {
    setPendingBody(body)
  }

  // Step 2: confirmed → actually send
  const handleConfirmedSend = async () => {
    if (!pendingBody) return
    const body = pendingBody
    setPendingBody(null)
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

      setSent(true)
      reset()
      setProgress(0)
      setTimeout(() => setSent(false), 2500)
    } finally {
      setSending(false)
    }
  }

  const count = recipientCount(scope)

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label>Audience</Label>
          <ToggleGroup
            type="single"
            value={scope}
            onValueChange={(v) => v && setScope(v as Scope)}
            spacing={2}
            className="flex flex-wrap gap-2"
          >
            {allowedScopes.map((s) => (
              <ToggleGroupItem
                key={s}
                value={s}
                className="rounded-full border border-border/60 bg-transparent px-4 hover:bg-muted/60 data-[state=on]:border-sidebar-accent data-[state=on]:bg-sidebar-accent data-[state=on]:text-sidebar-accent-foreground"
              >
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

        <Button
          type="submit"
          disabled={sending}
          className={sent ? 'bg-green-600 hover:bg-green-600 text-white transition-colors duration-300' : ''}
        >
          {sending ? (
            <Spinner data-icon="inline-start" className="size-4" />
          ) : sent ? (
            <Check data-icon="inline-start" className="size-4" />
          ) : null}
          {sent ? 'Sent!' : 'Send message'}
        </Button>
      </form>

      <AlertDialog open={pendingBody !== null} onOpenChange={(open) => !open && setPendingBody(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this message?</AlertDialogTitle>
            <AlertDialogDescription>
              {count !== null
                ? <>This will send an SMS to <strong className="text-foreground">{count} {count === 1 ? 'person' : 'people'}</strong> in {scopeLabels[scope]}.</>
                : <>This will send an SMS to all active members across every ward in the stake.</>
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmedSend}>Send</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
