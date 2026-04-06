export default function OptIn() {
  return (
    <div className="min-h-screen bg-[--color-surface] flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-xl flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">SMS Opt-In Consent</h1>
          <p className="text-muted-foreground mt-1 text-sm">Tower — Church Communication Tool</p>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium">What is Tower?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tower is a volunteer-run communication tool used by local church congregations to send
            SMS notifications to members. Messages may include meeting reminders, announcements,
            and other congregation-related information.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium">How members are added</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Members are added to the system manually by a ward or congregation administrator who
            has collected their phone number and verbal or written consent. Members are not added
            without prior knowledge or agreement.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium">Message frequency</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Message frequency varies. Most congregations send fewer than 4 messages per month.
            Message and data rates may apply.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium">How to opt out</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Reply <strong>STOP</strong> to any message to opt out at any time. You will receive
            one confirmation message and no further messages will be sent. Reply <strong>HELP</strong> for
            assistance.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium">Privacy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your phone number and personal information are used solely to send congregation
            notifications. No mobile information is shared with third parties or affiliates for
            marketing purposes.
          </p>
        </section>
      </div>
    </div>
  )
}
