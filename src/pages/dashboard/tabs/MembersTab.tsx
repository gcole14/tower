import { MemberTable } from '../components/MemberTable'

interface MembersTabProps {
  orgId: string
}

export function MembersTab({ orgId }: MembersTabProps) {
  return (
    <div className="bento-tile">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Directory</p>
        <h2 className="text-lg font-semibold mt-0.5">Members</h2>
      </div>
      <MemberTable orgId={orgId} />
    </div>
  )
}
