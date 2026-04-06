import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type FormValues = z.infer<typeof schema>

export default function Login() {
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async ({ email }: FormValues) => {
    setSending(true)
    const { error } = await supabase.auth.signInWithOtp({ email })
    setSending(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[--color-surface] px-4 gap-5">
      <div
        className="w-full max-w-sm rounded-3xl p-8 flex flex-col gap-6"
        style={{
          background: 'color-mix(in oklch, white 92%, var(--color-primary) 8%)',
          boxShadow: '0 2px 4px oklch(0 0 0 / 0.04), 0 8px 32px oklch(0 0 0 / 0.08)',
          border: '1px solid oklch(0 0 0 / 0.06)',
        }}
      >
        {/* Logo + heading */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="size-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'color-mix(in oklch, var(--color-primary) 30%, white)' }}
          >
            <img src="/tower-logo.svg" alt="Tower" className="size-8" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Sign in to Tower</h1>
            <p className="text-sm text-muted-foreground mt-0.5">We'll send a magic link to your email.</p>
          </div>
        </div>

        {/* Form */}
        {sent ? (
          <Alert>
            <AlertDescription>
              Check your email — a magic link is on its way.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                className="bg-white/70"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <Button type="submit" disabled={sending} className="w-full mt-1">
              {sending && <Spinner data-icon="inline-start" className="size-4" />}
              Send magic link
            </Button>
          </form>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        <Link to="/opt-in" className="underline underline-offset-4 hover:text-foreground transition-colors">
          SMS opt-in consent
        </Link>
      </p>
    </div>
  )
}
