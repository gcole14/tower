import type { Role } from '@/types'
import { SendForm } from '../components/SendForm'
import { ScheduledList } from '../components/ScheduledList'

interface SendTabProps {
  orgId: string
  role: Role
}

export function SendTab({ orgId, role }: SendTabProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="bento-tile">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Compose</p>
          <h2 className="text-lg font-semibold mt-0.5">New message</h2>
        </div>
        <SendForm orgId={orgId} role={role} />
      </div>
      <ScheduledList orgId={orgId} />
    </div>
  )
}
