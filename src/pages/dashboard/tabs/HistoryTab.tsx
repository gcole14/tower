import { MessageHistory } from '../components/MessageHistory'

interface HistoryTabProps {
  orgId: string
}

export function HistoryTab({ orgId }: HistoryTabProps) {
  return (
    <div className="bento-tile">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Logs</p>
        <h2 className="text-lg font-semibold mt-0.5">Message history</h2>
      </div>
      <MessageHistory orgId={orgId} />
    </div>
  )
}
