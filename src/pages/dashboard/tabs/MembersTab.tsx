import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MemberTable } from '../components/MemberTable'

interface MembersTabProps {
  orgId: string
}

export function MembersTab({ orgId }: MembersTabProps) {
  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent>
        <MemberTable orgId={orgId} />
      </CardContent>
    </Card>
  )
}
