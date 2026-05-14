import { Link } from 'react-router-dom'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[--color-surface] flex items-start justify-center px-4 py-16">
      <div className="w-full max-w-2xl flex flex-col gap-6">
        <div>
          <Link
            to="/"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
          >
            ← Back to home
          </Link>
        </div>

        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Privacy Policy</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tower — Church Communication Tool. Last updated May 13, 2026.
          </p>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Overview</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tower is a volunteer-run communication tool used by local church congregations to send
            SMS notifications to their members. This Privacy Policy explains what information we
            collect, how it is used, and how it is protected.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Information we collect</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We collect the following information, provided by a ward or congregation administrator
            on behalf of their members:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-6 flex flex-col gap-1">
            <li>Member name</li>
            <li>Phone number</li>
            <li>Congregation or organizational affiliation</li>
            <li>Optional grouping or role information used for message targeting</li>
          </ul>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For administrators who sign in, we also collect an email address used for
            authentication.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">How we use information</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Information collected is used solely to send SMS notifications related to congregation
            activity — meeting reminders, announcements, and other church-related communications.
            We do not use member information for advertising or marketing.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Information sharing</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We do not sell, rent, or share member information with third parties for marketing
            purposes. Phone numbers and message content are transmitted through our SMS provider
            (Twilio) solely for the purpose of delivering the requested messages. No mobile
            information is shared with third parties or affiliates for marketing or promotional
            purposes.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Message frequency and rates</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Message frequency varies by congregation. Most congregations send fewer than four
            messages per month. Message and data rates may apply, depending on your wireless plan.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Opting out</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You may opt out of receiving SMS messages at any time by replying <strong>STOP</strong>{' '}
            to any message. You will receive one confirmation message, and no further messages will
            be sent. Reply <strong>HELP</strong> for assistance.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Data retention and security</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Member information is retained for as long as the member is part of the congregation
            using Tower, or until removed by an administrator. Access to member information is
            limited to authorized congregation administrators. Data is stored using industry-standard
            security practices.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Children</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tower is not intended for direct use by children under 13. Phone numbers belonging to
            minors are added only by an administrator with parental or guardian consent.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Changes to this policy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update this Privacy Policy from time to time. The most current version will
            always be posted on this page with an updated revision date.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For questions about this Privacy Policy or to request removal of your information,
            please contact your congregation administrator.
          </p>
        </section>
      </div>
    </div>
  )
}
