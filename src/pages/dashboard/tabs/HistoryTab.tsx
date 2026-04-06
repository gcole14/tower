import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageHistory } from '../components/MessageHistory'

interface HistoryTabProps {
  orgId: string
}

export function HistoryTab({ orgId }: HistoryTabProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Message history</CardTitle>
      </CardHeader>
      <CardContent>
        <MessageHistory orgId={orgId} />
      </CardContent>
    </Card>
  )
}
