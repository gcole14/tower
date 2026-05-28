import { Link } from 'react-router-dom'

export default function Terms() {
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
          <h1 className="text-3xl font-semibold tracking-tight">Terms and Conditions</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tower — Church Communication Tool. Last updated May 28, 2026.
          </p>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Acceptance of terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            By accessing or using Tower, you agree to be bound by these Terms and Conditions. If
            you do not agree, you may not use the service.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Description of service</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tower is a volunteer-run communication tool that enables ward and congregation
            administrators to send SMS notifications to congregation members. The service is
            intended solely for legitimate church-related communication.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">SMS messaging program</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tower sends SMS messages only to members who separately opt in through the standalone
            process described on the{' '}
            <Link
              to="/opt-in"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              SMS Opt-In Consent page
            </Link>
            . SMS consent is optional and is not required to accept these Terms, use Tower as an
            administrator, participate in church activities, or receive church services. Messages
            may include meeting reminders, schedule changes, announcements, service project
            updates, volunteer coordination, and urgent congregation-related notices.
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-6 flex flex-col gap-1">
            <li>Message frequency varies; most congregations send fewer than four messages per month.</li>
            <li>Message and data rates may apply.</li>
            <li>Reply <strong>STOP</strong> at any time to opt out. Reply <strong>HELP</strong> for assistance.</li>
            <li>Supported carriers include all major U.S. wireless carriers. Carriers are not liable for delayed or undelivered messages.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Administrator responsibilities</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Congregation administrators agree to:
          </p>
          <ul className="text-sm text-muted-foreground leading-relaxed list-disc pl-6 flex flex-col gap-1">
            <li>Obtain prior consent from each member before adding their phone number to Tower.</li>
            <li>Use the service only for legitimate church-related communication.</li>
            <li>Promptly remove members who request to be removed.</li>
            <li>Not send unsolicited, commercial, or promotional messages.</li>
            <li>Not use the service to send unlawful, harassing, or abusive content.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Acceptable use</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You may not use Tower to: violate any law or regulation; transmit content that is
            unlawful, defamatory, harassing, or otherwise objectionable; interfere with the proper
            operation of the service; or attempt to gain unauthorized access to any portion of the
            service or to any data not belonging to your congregation.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Privacy</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your use of Tower is also governed by our{' '}
            <Link
              to="/privacy"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Privacy Policy
            </Link>
            , which explains what information we collect and how it is used.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Disclaimer of warranties</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tower is provided on an "as is" and "as available" basis. We make no warranties,
            express or implied, regarding the reliability, availability, or timeliness of message
            delivery. Tower is not a substitute for emergency communication channels.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Limitation of liability</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            To the maximum extent permitted by law, Tower and its volunteer operators shall not be
            liable for any indirect, incidental, special, or consequential damages arising out of
            or related to the use of the service.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Changes to these terms</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We may update these Terms from time to time. Continued use of the service after changes
            are posted constitutes acceptance of the updated Terms.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="font-medium text-lg">Contact</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For questions about these Terms or SMS support, please contact your congregation
            administrator.
          </p>
        </section>
      </div>
    </div>
  )
}
