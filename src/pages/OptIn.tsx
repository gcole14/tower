export default function OptIn() {
  return (
    <div className="min-h-screen bg-[--color-surface] flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-xl flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">SMS Opt-In Consent</h1>
          <p className="text-muted-foreground mt-1 text-sm">Tower — Church Communication Tool</p>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium">Use case summary</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tower is a volunteer-run communication tool used by local church congregations to send
            non-commercial SMS notifications to members who have separately opted in. Messages may
            include meeting reminders, schedule changes, congregation announcements, service
            project updates, volunteer coordination, and urgent congregation-related notices.
            Tower does not send marketing, promotional, fundraising, political, public solicitation,
            or third-party advertising messages.
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
          <h2 className="font-medium">Consent is separate</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            SMS consent is requested separately from any other agreement. It is not required to use
            the Tower website, create an administrator account, participate in church activities,
            receive church services, or agree to any Terms and Conditions. Members may decline SMS
            messages and still participate in their congregation.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium">Verbal consent script</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Congregation administrators read the following script verbatim when collecting verbal
            consent from a member before adding their phone number to Tower:
          </p>
          <blockquote
            className="text-sm leading-relaxed rounded-2xl p-5 border whitespace-pre-line"
            style={{
              background: 'color-mix(in oklch, white 92%, var(--color-primary) 8%)',
              borderColor: 'oklch(0 0 0 / 0.06)',
            }}
          >
            {`"Hi, this is [administrator name] from [congregation name]. We use a tool called Tower to send occasional SMS text messages to members of our congregation — things like meeting reminders, announcements, and other congregation-related information.

If you opt in, you'll receive fewer than four messages per month on average. Message and data rates may apply, depending on your wireless plan. You can reply STOP at any time to opt out, or reply HELP for help.

Your phone number will only be used to send these congregation messages, and will not be shared with any third party for marketing purposes.

Do I have your permission to add your phone number — [recite the number back] — to receive these text messages?"`}
          </blockquote>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The administrator records the member's affirmative response (date, time, and the name
            of the administrator who collected consent) before adding the number. If the member
            declines, the number is not added.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium">Written consent option</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            If consent is collected in writing, the administrator uses a standalone unchecked
            checkbox or signature line that is separate from all other acknowledgments:
          </p>
          <blockquote
            className="text-sm leading-relaxed rounded-2xl p-5 border"
            style={{
              background: 'color-mix(in oklch, white 92%, var(--color-primary) 8%)',
              borderColor: 'oklch(0 0 0 / 0.06)',
            }}
          >
            I agree to receive occasional SMS messages from Tower on behalf of my congregation,
            including meeting reminders, announcements, schedule changes, service project updates,
            volunteer coordination, and urgent congregation-related notices. Message frequency
            varies, usually fewer than 4 messages per month. Message and data rates may apply.
            Reply STOP to opt out or HELP for help. Consent is optional and is not a condition of
            any other agreement. Privacy Policy: /privacy. Terms: /terms.
          </blockquote>
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
