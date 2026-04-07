import type { Role } from '@/types'
import { SendForm } from '../components/SendForm'

interface SendTabProps {
  orgId: string
  role: Role
}

export function SendTab({ orgId, role }: SendTabProps) {
  return (
    <div className="bento-tile">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Compose</p>
        <h2 className="text-lg font-semibold mt-0.5">New message</h2>
      </div>
      <SendForm orgId={orgId} role={role} />
    </div>
  )
}
