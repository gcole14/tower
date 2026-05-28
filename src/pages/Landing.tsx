import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-[--color-surface]">
      <main className="flex-1 flex flex-col items-center justify-center px-4 gap-8">
        <div className="flex flex-col items-center gap-6 text-center">
          <div
            className="size-24 rounded-3xl flex items-center justify-center"
            style={{ background: 'color-mix(in oklch, var(--color-primary) 30%, white)' }}
          >
            <img src="/tower-logo.svg" alt="Tower" className="size-14" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold tracking-tight">Tower</h1>
            <p className="text-muted-foreground max-w-sm">
              SMS communication for local church congregations.
            </p>
          </div>
          <Button asChild size="lg" className="mt-2">
            <Link to="/login">Sign in</Link>
          </Button>
        </div>
      </main>

      <footer className="py-6 px-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
        <Link
          to="/privacy"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Privacy Policy
        </Link>
        <Link
          to="/terms"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          Terms and Conditions
        </Link>
        <Link
          to="/opt-in"
          className="underline underline-offset-4 hover:text-foreground transition-colors"
        >
          SMS Opt-In Consent
        </Link>
      </footer>
    </div>
  )
}
